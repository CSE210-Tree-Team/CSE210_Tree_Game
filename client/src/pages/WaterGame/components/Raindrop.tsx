import styles from "./Raindrop.module.css";

export type RaindropProps = {
  id: number;
  x: number;
  y: number;
  answer: string;
};

export const Raindrop = ({ id, x, y, answer }: RaindropProps) => {
  return (
    <div
      className={styles.raindrop}
      data-testid={`raindrop-${id}`}
      style={{ left: x, top: y }}
    >
      <span className={styles.answer}>{answer}</span>
    </div>
  );
};
