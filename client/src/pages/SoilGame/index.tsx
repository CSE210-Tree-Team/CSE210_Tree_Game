import { useSoilGame } from './hooks/useSoilGame';
import { TitleScreen } from './components/TitleScreen/TitleScreen';
import { TutorialScreen } from './components/TutorialScreen/TutorialScreen';
import { GameScreen } from './components/GameScreen/GameScreen';
import { CompletionPopup } from './components/CompletionPopup/CompletionPopup';
import styles from './SoilGame.module.css';

export default function SoilMinigame() {
  const { state, setPhase, startGame, handleCommand } = useSoilGame();

  // Transition from Tutorial to Playing
  const handleReadyToPlay = () => {
    startGame(); // This initializes the map and switches phase to 'playing'
  };

  const handleRestart = () => {
    setPhase('title');
  };

  return (
    <div className={styles.gameContainer}>
      {/* 1. Title Screen */}
      {state.phase === 'title' && (
        <TitleScreen onPlay={() => setPhase('tutorial')} />
      )}

      {/* 2. Tutorial Screen */}
      {state.phase === 'tutorial' && (
        <TutorialScreen onReady={handleReadyToPlay} />
      )}

      {/* 3. Main Gameplay Screen */}
      {(state.phase === 'playing' || state.phase === 'complete') && (
        <GameScreen state={state} onCommand={handleCommand} />
      )}

      {/* 4. Completion Popup Overlay */}
      {state.showCompletionPopup && (
        <CompletionPopup onRestart={handleRestart} />
      )}

      {/* 5. Loading State when user clicks on soil on the frontpage */}
      {state.phase === 'loading' && (
        <div className={styles.loadingOverlay}>Initializing Underground...</div>
      )}
    </div>
  );
}