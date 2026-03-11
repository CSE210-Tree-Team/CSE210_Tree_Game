import Bucket from "../components/Bucket";
import { Raindrop } from "../components/Raindrop";
import { Point } from "../components/Point";
import { useBucket } from "../hooks/useBucket";

import type { RaindropData, PointData } from "../types";
import type { Question } from "../../ServerCalls/ServerCalls";

import styles from "./Screens.module.css";

interface GameScreenProps {
  questions: Question[];
  currentQuestionIndex: number;
  correctCount: number;
  raindrops: RaindropData[];
  points: PointData[];
  gameScreenRef: React.RefObject<HTMLDivElement | null>;
  bucketXRef: React.RefObject<number | null>;
  onExit: () => void;
}

export const GameScreen = ({
  questions,
  currentQuestionIndex,
  correctCount,
  raindrops,
  points,
  gameScreenRef,
  bucketXRef,
  onExit,
}: GameScreenProps) => {
  const { bucketX, containerRef } = useBucket(bucketXRef);

  return (
    <div
      data-testid="water-game"
      className={styles.gameScreen}
      ref={gameScreenRef}
    >
      <img
        src="/waterExit.svg"
        alt="Water Game Exit"
        className={styles.icon}
        onClick={onExit}
      />
      <span data-testid="question" className={styles.question}>
        <p className={styles.questionText}>
          {questions[currentQuestionIndex]?.text}
        </p>
      </span>
      <span data-testid="point-count" className={styles.pointCount}>
        <p className={styles.pointCountText}>{`${correctCount * 10} Points`}</p>
      </span>

      {points.map((point) => (
        <Point
          key={point.id}
          id={point.id}
          x={point.x}
          y={point.y}
          variant={point.variant}
        />
      ))}

      {raindrops.map((drop) => (
        <Raindrop
          key={drop.id}
          id={drop.id}
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
  );
};
