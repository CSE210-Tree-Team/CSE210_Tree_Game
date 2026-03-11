import { useState, useEffect, useRef } from "react";
import { BUCKET_WIDTH, BUCKET_MOVE } from "../constants";

export const useBucket = (bucketXRef: React.RefObject<number | null>) => {
  const [bucketX, setBucketX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep ref in sync with state
  useEffect(() => {
    bucketXRef.current = bucketX;
  }, [bucketXRef, bucketX]);

  // Set bucket initial position to center of container when game screen mounts
  useEffect(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    setBucketX(containerWidth / 2 - BUCKET_WIDTH / 2);
  }, []);

  // Arrow key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const maxRight = Math.max(containerWidth - BUCKET_WIDTH, 0);

      if (e.key === "ArrowLeft") {
        setBucketX((prev) => Math.max(prev - BUCKET_MOVE, 0));
      } else if (e.key === "ArrowRight") {
        setBucketX((prev) => Math.min(prev + BUCKET_MOVE, maxRight));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const reset = () => setBucketX(0);

  return {
    bucketX,
    containerRef,
    reset,
  };
};
