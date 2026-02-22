import { useNavigate } from 'react-router-dom';
import { useSoilGame } from './hooks/UseSoilGame';
import { TitleScreen } from './components/TitleScreen/TitleScreen';
import { TutorialScreen } from './components/TutorialScreen/TutorialScreen';
import styles from './SoilGame.module.css';

export default function SoilMinigame() {
  const { state, setPhase } = useSoilGame();
  const navigate = useNavigate();

  return (
    <div className={styles.gameContainer}>
      {state.phase === 'title' && (
        <TitleScreen onPlay={() => setPhase('tutorial')} />
      )}
      {state.phase === 'tutorial' && (
        <TutorialScreen onReady={() => navigate('/')} />
      )}
    </div>
  );
}