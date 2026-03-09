import { Popup } from "../../../components/Popup";
import styles from "./Screens.module.css";

export type TutorialScreenProps = {
  onPlay: () => void;
  onBack: () => void;
};

export const TutorialScreen = ({ onPlay, onBack }: TutorialScreenProps) => {
  return (
    <div data-testid="water-tutorial" className={styles.gameScreen}>
      <img
        src="/waterBack.svg"
        alt="Water Game Back Arrow"
        className={styles.icon}
        onClick={onBack}
      />
      <Popup
        variant="water"
        screen="tutorial"
        header="How To Play"
        buttonText={"I'm Ready"}
        onClick={onPlay}
        textList={[
          "Questions will appear at the top of the screen",
          "Raindrops will fall, each with a possible answer",
          "Move the bucket left and right using the arrow keys on your keyboard",
          "Catch the correct answer to earn 10 points",
          "Goal: Collect as many raindrops as you can!",
        ]}
      />
    </div>
  );
};
