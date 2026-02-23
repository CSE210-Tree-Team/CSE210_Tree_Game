import styles from "./Raindrop.module.css";

export type RaindropProps = {
  label: string;
  answer: string;
};

export const Raindrop = ({ answer }: RaindropProps) => {
  return (
    <div className={styles.raindrop}>
      <span className={styles.answer}>{answer}</span>
    </div>
  );
};
