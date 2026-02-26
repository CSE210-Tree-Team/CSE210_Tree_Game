/*
Point Component

This component displays a score indicator when the player catches a raindrop
with the bucket. It renders a "+" or "X" score text styled in green or red
depending on whether the caught raindrop answer was correct or incorrect.
The Point is positioned absolutely on the game screen above the bucket.
*/

import styles from "./Point.module.css";
import { NUM_POINTS } from "../constants";
import { INCORRECT } from "../constants";

export type PointProps = {
  id: number;
  x: number;
  y: number;
  variant: "correct" | "incorrect";
};

export const Point = ({ id, x, y, variant }: PointProps) => {
  return (
    <div
      className={styles.point}
      data-testid={`point-${id}`}
      style={{ left: x, top: y }}
    >
      <span className={`${styles.pointText} ${styles[variant]}`}>
        {variant === "correct" ? `+${NUM_POINTS}` : INCORRECT}{" "}
      </span>
    </div>
  );
};
