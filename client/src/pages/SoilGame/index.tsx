//import { useNavigate } from 'react-router-dom';
import { useSoilGame } from './hooks/UseSoilGame_REP'; 
import { TitleScreen } from './components/TitleScreen/TitleScreen';
import { TutorialScreen } from './components/TutorialScreen/TutorialScreen';
import { GameScreen } from './components/GameScreen/GameScreen';
import { CompleteScreen } from './components/CompleteScreen/CompleteScreen';
import styles from './SoilGame.module.css';

export default function SoilMinigame() {
  const { state, setPhase, startGame, handleCommand } = useSoilGame();
  //const navigate = useNavigate(); might need later for navigating back to main menu or other pages

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
        <TutorialScreen onReady={handleReadyToPlay} />
      )}

      {/* 3. Main Gameplay Screen */}
      {state.phase === 'playing' && (
        <GameScreen state={state} onCommand={handleCommand} />
      )}

      {/* 4. Game Completion Screen */}
      {state.phase === 'complete' && (
        <CompleteScreen 
          onRestart={() => setPhase('title')} 
          
        />
      )}

      {/* 5. Loading State when user clicks on soil on the frontpage */}
      {state.phase === 'loading' && (
        <div className={styles.loadingOverlay}>Initializing Underground...</div>
      )}
    </div>
  );
}