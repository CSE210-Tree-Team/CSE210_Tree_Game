import styles from "./Raindrop.module.css";

export type RaindropProps = {
  x: number;
  y: number;
  answer: string;
};

export const Raindrop = ({ x, y, answer }: RaindropProps) => {
  return (
    <div className={styles.raindrop} style={{ left: x, top: y }}>
      <span className={styles.answer}>{answer}</span>
    </div>
  );
};
