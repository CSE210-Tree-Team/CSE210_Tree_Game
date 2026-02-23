/*
WaterGame Page

This module defines the WaterGame page, which manages the different screens 
(start, tutorial, game, end) and handles navigation between them. It uses 
React state to track the current screen and renders the appropriate content 
based on that state. The component also includes navigation functionality to 
return to the home page or move between screens using buttons and a back arrow.
*/

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useWaterGameQuestions } from "./hooks/useWaterGameQuestions";
import { questionToRaindropAnswers } from "./utils";
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
} from "./constants";

import styles from "./WaterGame.module.css";

export const WaterGame = () => {
  const [screen, setScreen] = useState<"start" | "tutorial" | "game" | "end">(
    "start",
  );
  const navigate = useNavigate();
  const [bucketX, setBucketX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameScreenRef = useRef<HTMLDivElement>(null);

  const [raindrops, setRaindrops] = useState<RaindropData[]>([]);
  const nextRaindropId = useRef(0);
  const answerQueueRef = useRef<RaindropAnswer[]>([]);
  const { questions, isLoading, error } = useWaterGameQuestions();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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
    if (questions.length === 0) {
      return;
    }
    console.log(questions);
    const answers = questionToRaindropAnswers(questions[0]);
    setRaindrops([]);
    answerQueueRef.current = answers;
    nextRaindropId.current = 0;
    setCurrentQuestionIndex(0);
    setScreen("game");
  };

  // Pulls the next answer from the queue and spawns a raindrop at a random
  // horizontal position along the top of the container
  const spawnRaindrop = useCallback(() => {
    if (!containerRef.current) return;

    const queue = answerQueueRef.current;
    if (queue.length === 0) return;

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
  }, []);

  // Spawns a new raindrop at a fixed interval while the game screen is active
  useEffect(() => {
    if (screen !== "game") return;

    const interval = setInterval(spawnRaindrop, SPAWN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [screen, spawnRaindrop]);

  // Moves all raindrops downward on each tick and removes any that have
  // fallen past the bottom of the game screen
  useEffect(() => {
    if (screen !== "game") return;
    if (!gameScreenRef.current) return;

    const floorY = gameScreenRef.current.offsetHeight - RAINDROP_HEIGHT;

    const interval = setInterval(() => {
      setRaindrops((prev) =>
        prev
          .map((drop) => ({
            ...drop,
            y: drop.y + RAINDROP_FALL_SPEED,
          }))
          .filter((drop) => drop.y < floorY),
      );
    }, 16);

    return () => clearInterval(interval);
  }, [screen]);

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
          <button
            onClick={() => {
              setScreen("end");
            }}
            style={{ position: "absolute", right: "16px", top: "16px" }}
          >
            End Game
          </button>
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
            header="Time's Up"
            buttonText="Go Back to Home"
            onClick={() => (window.location.href = "/")}
            textList={[
              "Number of correctly answered questions: 7",
              "Number of incorrectly answered questions: 3",
              "Total number of points earned: 7",
            ]}
          />
        </div>
      )}
    </div>
  );
};
