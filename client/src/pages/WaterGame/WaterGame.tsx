import { useState } from "react";
import { Popup } from "../../components/Popup";
import styles from "./WaterGame.module.css";

export const WaterGame = () => {
  const [showStart, setShowStart] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  return (
    <div className={styles.gameContainer}>
      {showStart && (
        <Popup
          variant="water"
          screen="start"
          header="Welcome To"
          buttonText="Play"
          title="RAINDROP RUSH"
          onClick={() => {
            setShowStart(false);
            setShowTutorial(true);
          }}
        />
      )}
      {showTutorial && (
        <Popup
          variant="water"
          screen="tutorial"
          header="How To Play"
          buttonText="I'm Ready"
          onClick={() => {
            setShowTutorial(false);
            setShowGame(true);
          }}
          textList={[
            "A question will appear at the top of the screen",
            "Raindrops will fall, each with a possible answer",
            "Catch the correct answer to earn a point",
            "Move the bucket left and right using the arrow keys on your keyboard",
            "Goal: Collect as many raindrops as you can to gather water for your tree!",
          ]}
        />
      )}
      {showGame && (
        <div className={styles.gameScreen}>
          <span className={styles.question}>
            <p className={styles.questionText}>
              What is the chemical formula for water?
            </p>
          </span>
          <button
            onClick={() => {
              setShowGame(false);
              setShowEnd(true);
            }}
          >
            End Game
          </button>
        </div>
      )}
      {showEnd && (
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
      )}
    </div>
  );
};
