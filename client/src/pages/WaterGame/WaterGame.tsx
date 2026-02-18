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

import { Popup } from "../../components/Popup";
import Bucket from "./components/Bucket";
import { Raindrop } from "./components/Raindrop";
import type { RaindropData } from "./types";

import styles from "./WaterGame.module.css";

const SAMPLE_ANSWERS = [
  { text: "H2O", isCorrect: true },
  { text: "CO2", isCorrect: false },
  { text: "O2", isCorrect: false },
  { text: "NaCl", isCorrect: false },
  { text: "O2", isCorrect: false },
  { text: "He", isCorrect: false },
];
const RAINDROP_WIDTH = 96; // 6rem
const RAINDROP_HEIGHT = 128; // 8rem
const RAINDROP_FALL_SPEED = 1.2;
const SPAWN_INTERVAL_MS = 1750;

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
  const answerQueueRef = useRef([...SAMPLE_ANSWERS]);

  useEffect(() => {
    if (screen !== "game") return;
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    setBucketX(containerWidth / 2 - 140 / 2);
  }, [screen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const bucketWidth = 140;
      const maxRight = Math.max(containerWidth - bucketWidth, 0);

      if (e.key === "ArrowLeft") {
        setBucketX((prev) => Math.max(prev - 20, 0));
      } else if (e.key === "ArrowRight") {
        setBucketX((prev) => Math.min(prev + 20, maxRight));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const startGame = () => {
    setRaindrops([]);
    answerQueueRef.current = [...SAMPLE_ANSWERS];
    nextRaindropId.current = 0;
    setScreen("game");
  };

  const spawnRaindrop = useCallback(() => {
    if (!containerRef.current) return;

    const queue = answerQueueRef.current;
    if (queue.length === 0) return;

    const nextAnswer = queue.shift()!; // mutate ref safely
    const containerWidth = containerRef.current.offsetWidth;

    setRaindrops((prev) => [
      ...prev,
      {
        id: nextRaindropId.current++,
        x: Math.random() * (containerWidth - RAINDROP_WIDTH),
        y: 0,
        velocity: RAINDROP_FALL_SPEED,
        answer: nextAnswer.text,
        isCorrect: nextAnswer.isCorrect,
      },
    ]);
  }, []);

  useEffect(() => {
    if (screen !== "game") return;

    const interval = setInterval(spawnRaindrop, SPAWN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [screen, spawnRaindrop]);

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
            buttonText="I'm Ready"
            onClick={() => {
              startGame();
            }}
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
              What is the chemical formula for water?
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
