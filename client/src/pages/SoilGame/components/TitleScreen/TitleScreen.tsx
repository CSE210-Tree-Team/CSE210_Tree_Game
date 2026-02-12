import { Popup } from '../../../../components/Popup';
import styles from './TitleScreen.module.css';

interface TitleScreenProps {
  onPlay: () => void;
}

export function TitleScreen({ onPlay }: TitleScreenProps) {
  return (
    <div className={styles.container}>
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