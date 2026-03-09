import { useState, useRef, useCallback } from "react";
import {
  BUCKET_WIDTH,
  BUCKET_HEIGHT,
  POINT_DURATION_MS,
  POINT_WIDTH,
  POINT_GAP,
} from "../constants";
import type { PointData } from "../types";

const getPointPosition = (
  bucketXRef: React.RefObject<number | null>,
  gameScreenRef: React.RefObject<HTMLDivElement | null>,
  padding: number,
) => ({
  x:
    bucketXRef.current != null
      ? bucketXRef.current + (BUCKET_WIDTH / 2 - POINT_WIDTH / 2) + padding
      : 0,
  y: gameScreenRef.current
    ? gameScreenRef.current.offsetHeight - BUCKET_HEIGHT - POINT_GAP - padding
    : 0,
});

export const usePoints = (
  bucketXRef: React.RefObject<number | null>,
  gameScreenRef: React.RefObject<HTMLDivElement | null>,
) => {
  const [points, setPoints] = useState<PointData[]>([]);
  const nextPointId = useRef(0);

  const spawnPoint = useCallback(
    (isCorrect: boolean) => {
      if (!bucketXRef || !gameScreenRef || !gameScreenRef.current) {
        return;
      }
      const id = nextPointId.current++;
      const padding = parseFloat(
        getComputedStyle(gameScreenRef.current).paddingBottom,
      );
      const { x, y } = getPointPosition(bucketXRef, gameScreenRef, padding);

      setPoints((prev) => [
        ...prev,
        {
          id,
          x,
          y,
          variant: isCorrect ? "correct" : "incorrect",
        },
      ]);

      setTimeout(() => {
        setPoints((prev) => prev.filter((p) => p.id !== id));
      }, POINT_DURATION_MS);
    },
    [bucketXRef, gameScreenRef],
  );

  const reset = () => {
    setPoints([]);
    nextPointId.current = 0;
  };

  return {
    points,
    spawnPoint,
    reset,
  };
};
