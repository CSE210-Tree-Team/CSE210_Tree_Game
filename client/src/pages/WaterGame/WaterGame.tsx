/*
WaterGame Page

This module defines the WaterGame page, which manages the different screens
(start, tutorial, game, end) and handles navigation between them. It uses
React state to track the current screen and renders the appropriate content
based on that state.

The game presents the player with a series of water-related multiple choice
questions. Raindrop answers fall from the top of the screen and the player
must move a bucket left and right using the arrow keys to catch the correct
answer. The game tracks correct and incorrect answers and displays the results
on the end screen, where the player's score is pushed to the server to update
the water resource level.
*/

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useWaterGameQuestions } from "./hooks/useWaterGameQuestions";
import { pushGameResults } from "../ServerCalls/ServerCalls";
import { checkCollision } from "./collision";

import { questionToRaindropAnswers, shuffleArray } from "./utils";
import { Popup } from "../../components/Popup";
import Bucket from "./components/Bucket";
import { Raindrop } from "./components/Raindrop";
import type { RaindropData, RaindropAnswer } from "./types";
import {
  RAINDROP_FALL_SPEED,
  RAINDROP_HEIGHT,
  RAINDROP_WIDTH,
  SPAWN_INTERVAL_MS,
  BUCKET_WIDTH,
  BUCKET_HEIGHT,
} from "./constants";

import styles from "./WaterGame.module.css";

export const WaterGame = () => {
  const [screen, setScreen] = useState<"start" | "tutorial" | "game" | "end">(
    "start",
  );
  const navigate = useNavigate();
  const [bucketX, setBucketX] = useState(0);
  const bucketXRef = useRef(bucketX);

  const containerRef = useRef<HTMLDivElement>(null);
  const gameScreenRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);

  const [raindrops, setRaindrops] = useState<RaindropData[]>([]);
  const nextRaindropId = useRef(0);
  const caughtRaindropIds = useRef<Set<number>>(new Set());

  const answerQueueRef = useRef<RaindropAnswer[]>([]);
  const { questions, isLoading, error } = useWaterGameQuestions();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setIncorrectCount((prev) => prev + 1);
    }
  }, []);

  // Keep the ref in sync with the state
  useEffect(() => {
    bucketXRef.current = bucketX;
  }, [bucketX]);

  // Sets the bucket's initial horizontal position to the center of the container
  // when the game screen mounts
  useEffect(() => {
    if (screen !== "game") return;
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    setBucketX(containerWidth / 2 - BUCKET_WIDTH / 2);
  }, [screen]);

  // Listens for left and right arrow key presses and moves the bucket
  // horizontally, clamping its position within the container bounds
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const maxRight = Math.max(containerWidth - BUCKET_WIDTH, 0);

      if (e.key === "ArrowLeft") {
        setBucketX((prev) => Math.max(prev - 20, 0));
      } else if (e.key === "ArrowRight") {
        setBucketX((prev) => Math.min(prev + 20, maxRight));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Resets game state and transitions to the game screen
  const startGame = () => {
    if (questions.length === 0) return;

    const answers = shuffleArray(questionToRaindropAnswers(questions[0])); // shuffle here too
    setRaindrops([]);
    answerQueueRef.current = answers;
    nextRaindropId.current = 0;
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    caughtRaindropIds.current = new Set();
    setScreen("game");
  };

  // Pauses the game when the tab is hidden and resumes when the tab is visible
  useEffect(() => {
    if (screen !== "game") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - intervals will be cleared by their own cleanup
        // Store that we were paused
        isPausedRef.current = true;
      } else {
        isPausedRef.current = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [screen]);

  // Pulls the next answer from the queue and spawns a raindrop at a random
  // horizontal position along the top of the container
  const spawnRaindrop = useCallback(() => {
    if (!containerRef.current) return;

    // Refill queue with shuffled choices if empty
    if (answerQueueRef.current.length === 0) {
      if (questions.length === 0) return;
      answerQueueRef.current = shuffleArray(
        questionToRaindropAnswers(questions[currentQuestionIndex]),
      );
    }

    const queue = answerQueueRef.current;
    const nextAnswer = queue.shift()!;
    const containerWidth = containerRef.current.offsetWidth;

    const minX = BUCKET_WIDTH - RAINDROP_WIDTH;
    const maxX = containerWidth - (BUCKET_WIDTH - RAINDROP_WIDTH);

    setRaindrops((prev) => [
      ...prev,
      {
        id: nextRaindropId.current++,
        x: Math.random() * (maxX - minX),
        y: 0,
        velocity: RAINDROP_FALL_SPEED,
        answer: nextAnswer.text,
        isCorrect: nextAnswer.isCorrect,
      },
    ]);
  }, [currentQuestionIndex, questions]);

  // Spawns a new raindrop at a fixed interval while the game screen is active
  useEffect(() => {
    if (screen !== "game") return;

    const interval = setInterval(() => {
      if (isPausedRef.current) return;
      spawnRaindrop();
    }, SPAWN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [screen, spawnRaindrop]);

  // Clears current raindrops and loads the next question's choices into the queue
  const moveToNextQuestion = useCallback(() => {
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex >= questions.length) {
      setScreen("end");
      return;
    }

    setCurrentQuestionIndex(nextIndex);
    console.log(currentQuestionIndex);
    answerQueueRef.current = questionToRaindropAnswers(questions[nextIndex]);
    setRaindrops([]);
  }, [currentQuestionIndex, questions]);

  // Moves all raindrops downward on each tick, checks for bucket collision,
  // and removes any that have fallen past the bottom of the game screen
  useEffect(() => {
    if (screen !== "game") return;
    if (!gameScreenRef.current) return;

    const floorY = gameScreenRef.current.offsetHeight - RAINDROP_HEIGHT;
    const bucketTop = gameScreenRef.current.offsetHeight - BUCKET_HEIGHT;

    const interval = setInterval(() => {
      if (isPausedRef.current) return;
      setRaindrops((prev) =>
        prev
          .map((drop) => ({
            ...drop,
            y: drop.y + RAINDROP_FALL_SPEED,
          }))
          .filter((drop) => {
            if (checkCollision(drop.x, drop.y, bucketXRef.current, bucketTop)) {
              if (!caughtRaindropIds.current.has(drop.id)) {
                caughtRaindropIds.current.add(drop.id);
                handleAnswer(drop.isCorrect);
                moveToNextQuestion();
              }
              return false;
            }

            return drop.y < floorY;
          }),
      );
    }, 16);

    return () => clearInterval(interval);
  }, [screen, handleAnswer, moveToNextQuestion]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className={styles.gameContainer}>
      {screen === "start" && (
        <div data-testid="water-start" className={styles.gameScreen}>
          <img
            src="/leftArrow.svg"
            alt="Back Arrow"
            className={styles.arrow}
            onClick={() => navigate("/")}
          />
          <Popup
            variant="water"
            screen="start"
            header="Welcome To"
            buttonText="Play"
            title="RAINDROP RUSH"
            onClick={() => {
              setScreen("tutorial");
            }}
          />
        </div>
      )}
      {screen === "tutorial" && (
        <div data-testid="water-tutorial" className={styles.gameScreen}>
          <img
            src="/leftArrow.svg"
            alt="Back Arrow"
            className={styles.arrow}
            onClick={() => {
              setScreen("start");
            }}
          />
          <Popup
            variant="water"
            screen="tutorial"
            header="How To Play"
            buttonText={isLoading ? "Loading..." : "I'm Ready"}
            onClick={() => startGame()}
            textList={[
              "A question will appear at the top of the screen",
              "Raindrops will fall, each with a possible answer",
              "Catch the correct answer to earn a point",
              "Move the bucket left and right using the arrow keys on your keyboard",
              "Goal: Collect as many raindrops as you can to gather water for your tree!",
            ]}
          />
        </div>
      )}
      {screen === "game" && (
        <div
          data-testid="water-game"
          className={styles.gameScreen}
          ref={gameScreenRef}
        >
          <span data-testid="question" className={styles.question}>
            <p className={styles.questionText}>
              {questions[currentQuestionIndex]?.text}
            </p>
          </span>
          {raindrops.map((drop) => (
            <Raindrop
              id={drop.id}
              key={drop.id}
              x={drop.x}
              y={drop.y}
              answer={drop.answer}
            />
          ))}

          <div
            data-testid="bucket-container"
            className={styles.bucketContainer}
            ref={containerRef}
          >
            <Bucket data-testid="bucket" x={bucketX} />
          </div>
        </div>
      )}
      {screen === "end" && (
        <div data-testid="water-end" className={styles.gameScreen}>
          <Popup
            variant="water"
            screen="end"
            header="Game Over"
            buttonText="Go Back to Home"
            onClick={async () => {
              try {
                await pushGameResults(
                  (correctCount / questions.length) * 100,
                  "water",
                );
              } catch {
                console.error("Failed to update water resource.");
              } finally {
                window.location.href = "/";
              }
            }}
            textList={[
              `Number of correctly answered questions: ${correctCount}`,
              `Number of incorrectly answered questions: ${incorrectCount}`,
              `Total number of points earned: ${Math.ceil((correctCount / questions.length) * 100)}`,
            ]}
          />
        </div>
      )}
    </div>
  );
};
