import { Popup } from '../../../../components/Popup';
import styles from './TutorialScreen.module.css';

interface TutorialScreenProps {
  onReady: () => void;
}

export function TutorialScreen({ onReady }: TutorialScreenProps) {
  const tips = [
    "You are in a dungeon underground with various rooms and have been given 3 quests",
    "Each room may contain an answer to a quest",
    "Type the number of the correct corresponding quest to collect that answer",
    "Goal: Collect the answers to all 3 quests",
  ];

  return (
    <div className={styles.container}>
      <Popup
        variant="soil"
        screen="tutorial"
        header="How To Play"
        textList={tips}
        buttonText="I'm Ready"
        onClick={onReady}
      />
    </div>
  );
}