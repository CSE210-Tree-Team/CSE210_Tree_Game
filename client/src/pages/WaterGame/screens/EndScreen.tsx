import { Popup } from "../../../components/Popup";
import styles from "./Screens.module.css";

export type EndScreenProps = {
  onPlay: () => void;
  correctCount: number;
  incorrectCount: number;
};

export const EndScreen = ({
  onPlay,
  correctCount,
  incorrectCount,
}: EndScreenProps) => {
  return (
    <div data-testid="water-end" className={styles.gameScreen}>
      <Popup
        variant="water"
        screen="end"
        header="Good Job!"
        buttonText="Go Back to Home"
        onClick={onPlay}
        textList={[
          `Number of correctly answered questions: ${correctCount}`,
          `Number of incorrectly answered questions: ${incorrectCount}`,
          `Total number of points earned: ${correctCount * 10}`,
        ]}
      />
    </div>
  );
};
