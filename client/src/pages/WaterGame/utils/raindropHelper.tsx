import type { Question } from "../../ServerCalls/ServerCalls";
import type { RaindropAnswer } from "../types";

// Converts a WaterQuestion's choices into the RaindropAnswer format used by the game
export const questionToRaindropAnswers = (
  question: Question,
): RaindropAnswer[] => {
  return question.choices.map((choice) => ({
    text: choice.text,
    isCorrect: choice.isCorrect,
  }));
};

// Shuffles an array into a random order
export const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};
