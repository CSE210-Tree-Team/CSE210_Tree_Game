import { useState, useRef, useCallback } from "react";
import { useWaterGameQuestions } from "./useWaterGameQuestions";
import { useGameLoop } from "./useGameLoop";
import { usePoints } from "./usePoints";
import { audioSystem } from "../../../AudioSystem";
import audioFile from "../audio/WaterMinigameOST.mp3";

export type GameScreen = "start" | "tutorial" | "game" | "end";

export const useWaterGame = () => {
  const [screen, setScreen] = useState<GameScreen>("start");
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  const { questions, isLoading, error } = useWaterGameQuestions();

  const gameScreenRef = useRef<HTMLDivElement>(null);
  const bucketXRef = useRef<number | null>(0);
  const {
    points,
    spawnPoint,
    reset: resetPoints,
  } = usePoints(bucketXRef, gameScreenRef);

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      } else {
        setIncorrectCount((prev) => prev + 1);
      }
      spawnPoint(isCorrect);
    },
    [spawnPoint],
  );

  const {
    raindrops,
    currentQuestionIndex,
    reset: resetGameLoop,
  } = useGameLoop({
    questions,
    bucketXRef,
    gameScreenRef,
    onAnswer: handleAnswer,
    onGameEnd: () => setScreen("end"),
  });

  const startGame = useCallback(() => {
    if (questions.length === 0) return;

    resetGameLoop();
    resetPoints();
    setCorrectCount(0);
    setIncorrectCount(0);
    setScreen("game");

    audioSystem.playAmbient(audioFile);
  }, [questions, resetGameLoop, resetPoints]);

  const stopAudio = useCallback(() => {
    audioSystem.stopAmbient();
  }, []);

  return {
    // screen state
    screen,
    setScreen,
    isLoading,
    error,

    // question
    questions,
    currentQuestionIndex,

    // score
    correctCount,
    incorrectCount,

    // game entities
    raindrops,
    points,

    // refs for GameScreen to attach to DOM
    gameScreenRef,
    bucketXRef,

    // actions
    startGame,
    stopAudio,
  };
};
