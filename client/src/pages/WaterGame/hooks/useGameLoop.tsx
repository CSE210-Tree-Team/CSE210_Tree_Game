import { useState, useEffect, useRef, useCallback } from "react";
import { checkCollision } from "../utils/collision";
import {
  questionToRaindropAnswers,
  shuffleArray,
} from "../utils/raindropHelper";
import type { RaindropData, RaindropAnswer } from "../types";
import type { Question } from "../../ServerCalls/types";
import {
  RAINDROP_FALL_SPEED,
  RAINDROP_HEIGHT,
  RAINDROP_WIDTH,
  SPAWN_INTERVAL_MS,
  BUCKET_WIDTH,
  BUCKET_HEIGHT,
} from "../constants";

interface UseGameLoopProps {
  questions: Question[];
  bucketXRef: React.RefObject<number | null>;
  gameScreenRef: React.RefObject<HTMLDivElement | null>;
  onAnswer: (isCorrect: boolean) => void;
  onGameEnd: () => void;
}

export const useGameLoop = ({
  questions,
  bucketXRef,
  gameScreenRef,
  onAnswer,
  onGameEnd,
}: UseGameLoopProps) => {
  const [raindrops, setRaindrops] = useState<RaindropData[]>([]);
  const nextRaindropId = useRef(0);
  const caughtRaindropIds = useRef<Set<number>>(new Set());
  const answerQueueRef = useRef<RaindropAnswer[]>([]);
  const isPausedRef = useRef(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Pause when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPausedRef.current = document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Spawn a raindrop from the answer queue
  const spawnRaindrop = useCallback(() => {
    if (!gameScreenRef.current) return;

    if (answerQueueRef.current.length === 0) {
      if (questions.length === 0) return;
      answerQueueRef.current = shuffleArray(
        questionToRaindropAnswers(questions[currentQuestionIndex]),
      );
    }

    const queue = answerQueueRef.current;
    const nextAnswer = queue.shift()!;
    const containerWidth = gameScreenRef.current.offsetWidth;

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
  }, [currentQuestionIndex, questions, gameScreenRef]);

  // Raindrop spawn interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current) return;
      spawnRaindrop();
    }, SPAWN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [spawnRaindrop]);

  // internally handle next question
  const handleNextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= questions.length) {
        onGameEnd();
        return prev;
      }
      setRaindrops([]);
      answerQueueRef.current = shuffleArray(
        questionToRaindropAnswers(questions[nextIndex]),
      );
      return nextIndex;
    });
  }, [questions, onGameEnd]);

  // Game loop: move raindrops, check collisions, remove out-of-bounds drops
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current) return;
      if (!gameScreenRef.current) return;

      const floorY = gameScreenRef.current.offsetHeight - RAINDROP_HEIGHT;
      const bucketTop = gameScreenRef.current.offsetHeight - BUCKET_HEIGHT;

      setRaindrops((prev) =>
        prev
          .map((drop) => ({ ...drop, y: drop.y + RAINDROP_FALL_SPEED }))
          .filter((drop) => {
            if (
              bucketXRef.current &&
              checkCollision(drop.x, drop.y, bucketXRef.current, bucketTop)
            ) {
              if (!caughtRaindropIds.current.has(drop.id)) {
                caughtRaindropIds.current.add(drop.id);
                onAnswer(drop.isCorrect);
                handleNextQuestion();
              }
              return false;
            }
            return drop.y < floorY;
          }),
      );
    }, 16);

    return () => clearInterval(interval);
  }, [bucketXRef, gameScreenRef, onAnswer, handleNextQuestion]);

  const reset = useCallback(() => {
    setRaindrops([]);
    nextRaindropId.current = 0;
    caughtRaindropIds.current = new Set();
    answerQueueRef.current = shuffleArray(
      questionToRaindropAnswers(questions[0]),
    );
    setCurrentQuestionIndex(0);
  }, [questions]);

  return {
    raindrops,
    currentQuestionIndex,
    reset,
  };
};
