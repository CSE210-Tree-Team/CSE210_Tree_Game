import { useSoilGame } from './hooks/useSoilGame';
import { TitleScreen } from './components/TitleScreen/TitleScreen';
import { TutorialScreen } from './components/TutorialScreen/TutorialScreen';
import styles from './SoilGame.module.css';

export default function SoilMinigame() {
  const { state, setPhase } = useSoilGame();

  return (
    <div className={styles.gameContainer}>
      {state.phase === 'title' && (
        <TitleScreen onPlay={() => setPhase('tutorial')} />
      )}
      {state.phase === 'tutorial' && (
        <TutorialScreen onReady={() => {/* TODO: start game later */}} />
      )}
    </div>
  );
}