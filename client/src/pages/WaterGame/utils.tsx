import type { WaterQuestion } from "../ServerCalls/ServerCalls";
import type { RaindropAnswer } from "./types";

export const questionToRaindropAnswers = (
  question: WaterQuestion,
): RaindropAnswer[] => {
  return question.choices.map((choice) => ({
    text: choice.text,
    isCorrect: choice.isCorrect,
  }));
};

export const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};
