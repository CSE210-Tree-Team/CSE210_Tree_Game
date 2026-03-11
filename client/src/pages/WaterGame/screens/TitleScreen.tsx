import { Popup } from "../../../components/Popup";
import styles from "./Screens.module.css";

export type TitleScreenProps = {
  onPlay: () => void;
  onBack: () => void;
};

export const TitleScreen = ({ onPlay, onBack }: TitleScreenProps) => {
  return (
    <div data-testid="water-start" className={styles.gameScreen}>
      <img
        src="/waterBack.svg"
        alt="Water Game Back Arrow"
        className={styles.icon}
        onClick={onBack}
      />
      <Popup
        variant="water"
        screen="start"
        header="Welcome To"
        buttonText="Play"
        title="RAINDROP RUSH"
        onClick={onPlay}
      />
    </div>
  );
};
