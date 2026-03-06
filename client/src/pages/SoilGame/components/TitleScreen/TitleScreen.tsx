import { Popup } from '../../../../components/Popup';
import styles from './TitleScreen.module.css';

interface TitleScreenProps {
  onPlay: () => void;
  onBack: () => void;
}

export function TitleScreen({ onPlay, onBack }: TitleScreenProps) {
  return (
    <div className={styles.container}>
      <img
        src="/soilArrow.svg"
        alt="Back Arrow"
        className={styles.arrow}
        onClick={onBack}
      />
      <Popup
        variant="soil"
        screen="start"
        header="Welcome To"
        title="DOWN TO THE ROOTS"
        buttonText="Play"
        onClick={onPlay}
      />
    </div>
  );
}