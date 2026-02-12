import styles from './TutorialScreen.module.css';

interface TutorialScreenProps {
  onReady: () => void;
}

export function TutorialScreen({ onReady }: TutorialScreenProps) {
  const tips = [
    "You are in a dungeon underground with various rooms and have been given 3 quests",
    "Each room may contain an answer to a quest",
    "Type the number of the correct corresponding quest to collect that answer",
    <><strong>Goal:</strong> Collect the answers to all 3 quests</>,
  ];

  return (
    <div className={styles.container}>
      <div className={styles.contentBox}>
        <h2 className={styles.title}>How To Play</h2>
        <ul className={styles.tipsList}>
          {tips.map((tip, i) => (
            <li key={i} className={styles.tip}>
              {tip}
            </li>
          ))}
        </ul>
        <div className={styles.buttonContainer}>
          <button onClick={onReady} className={styles.readyButton}>
            I'm Ready
          </button>
        </div>
      </div>
    </div>
  );
}