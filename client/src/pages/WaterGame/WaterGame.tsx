/*
WaterGame Page

This module defines the WaterGame page, which manages the different screens 
(start, tutorial, game, end) and handles navigation between them. It uses 
React state to track the current screen and renders the appropriate content 
based on that state. The component also includes navigation functionality to 
return to the home page or move between screens using buttons and a back arrow.
*/

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Popup } from "../../components/Popup";
import Bucket from "./components/Bucket";

import styles from "./WaterGame.module.css";

export const WaterGame = () => {
  const [screen, setScreen] = useState<"start" | "tutorial" | "game" | "end">(
    "start",
  );
  const navigate = useNavigate();
  const [bucketX, setBucketX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
      const bucketWidth = 140; // match your CSS width
      const maxRight = containerWidth - bucketWidth;

      if (e.key === "ArrowLeft") {
        setBucketX((prev) => Math.max(prev - 20, 0));
      } else if (e.key === "ArrowRight") {
        setBucketX((prev) => Math.min(prev + 20, maxRight));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
              setScreen("game");
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
        <div data-testid="water-game" className={styles.gameScreen}>
          <span className={styles.question}>
            <p className={styles.questionText}>
              What is the chemical formula for water?
            </p>
          </span>
          <button
            onClick={() => {
              setScreen("end");
            }}
          >
            End Game
          </button>
          <div className={styles.bucketContainer} ref={containerRef}>
            <Bucket x={bucketX} />
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
