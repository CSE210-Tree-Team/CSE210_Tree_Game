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

  return (
    <div className={styles.gameContainer}>
      {/* 1. Title Screen */}
      {state.phase === 'title' && (
        <TitleScreen onPlay={() => setPhase('tutorial')} />
      )}

      {/* 2. Tutorial Screen */}
      {state.phase === 'tutorial' && (
        <TutorialScreen onReady={handleReadyToPlay} onBack={() => setPhase('title')} />
      )}

      {/* 3. Main Gameplay Screen */}
      {(state.phase === 'playing' || state.phase === 'complete') && (
        <>
          <img
            src="/closeSoil.svg"
            alt="Exit Game"
            className={styles.closeButton}
            onClick={() => handleCommand('exit')}
          />
          <GameScreen state={state} onCommand={handleCommand} />
        </>
      )}

      {/* 4. Completion Popup Overlay */}
      {state.showCompletionPopup && (
        <CompletionPopup
          questsCompleted={state.quests.filter(q => q.completed).length}
          totalQuests={state.quests.length}
          score={state.score}
        />
      )}

      {/* 5. Loading State when user clicks on soil on the frontpage */}
      {state.phase === 'loading' && (
        <div className={styles.loadingOverlay}>Initializing Underground...</div>
      )}
    </div>
  );
}