import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useWaterGame } from "./hooks/useWaterGame";
import { submitGameResults } from "./utils/gameResultsHelper";

import styles from "./WaterGame.module.css";

import { TitleScreen } from "./screens/TitleScreen";
import { TutorialScreen } from "./screens/TutorialScreen";
import { GameScreen } from "./screens/GameScreen";
import { EndScreen } from "./screens/EndScreen";

export const WaterGame = () => {
  const navigate = useNavigate();

  const {
    screen,
    setScreen,
    isLoading,
    error,
    questions,
    currentQuestionIndex,
    correctCount,
    incorrectCount,
    raindrops,
    points,
    gameScreenRef,
    bucketXRef,
    startGame,
    stopAudio,
  } = useWaterGame();

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className={styles.gameContainer}>
      {screen === "start" && (
        <TitleScreen
          onPlay={() => setScreen("tutorial")}
          onBack={() => navigate("/")}
        />
      )}
      {screen === "tutorial" && (
        <TutorialScreen onPlay={startGame} onBack={() => setScreen("start")} />
      )}
      {screen === "game" && (
        <GameScreen
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          correctCount={correctCount}
          raindrops={raindrops}
          points={points}
          gameScreenRef={gameScreenRef}
          bucketXRef={bucketXRef}
          onExit={() => setScreen("end")}
        />
      )}
      {screen === "end" && (
        <EndScreen
          onPlay={async () => submitGameResults(correctCount * 10, "Water")}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
        />
      )}
    </div>
  );
};
