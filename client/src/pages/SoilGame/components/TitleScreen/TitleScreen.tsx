import styles from './TitleScreen.module.css';

interface TitleScreenProps {
  onPlay: () => void;
}

export function TitleScreen({ onPlay }: TitleScreenProps) {
  return (
    <div className={styles.container}>
      <div className={styles.contentBox}>
        <p className={styles.welcomeText}>Welcome To</p>
        <h1 className={styles.titleMain}>DOWN TO</h1>
        <h1 className={styles.titleLarge}>THE ROOTS</h1>
        <button onClick={onPlay} className={styles.playButton}>
          Play
        </button>
      </div>
    </div>
  );
}