import styles from "./Raindrop.module.css";

export type RaindropProps = {
  id: number;
  x: number;
  y: number;
  answer: string;
};

export const Raindrop = ({ id, x, y, answer }: RaindropProps) => {
  const getFontSize = (text: string) => {
    if (text.length > 12) return "0.75rem";
    if (text.length > 4) return "1.5rem";
    return "2.5rem";
  };

  return (
    <div
      className={styles.raindrop}
      data-testid={`raindrop-${id}`}
      style={{ left: x, top: y }}
    >
      <span className={styles.answer} style={{ fontSize: getFontSize(answer) }}>
        {answer}
      </span>
    </div>
  );
};
