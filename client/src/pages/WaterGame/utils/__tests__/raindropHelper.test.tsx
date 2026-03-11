/*
Unit Tests for the WaterGame utility functions

This module contains unit tests for the utility functions used in the
WaterGame, including questionToRaindropAnswers and shuffleArray.
*/

import { describe, it, expect, vi, afterEach } from "vitest";
import { questionToRaindropAnswers, shuffleArray } from "../raindropHelper";
import type { Question } from "../../../ServerCalls/ServerCalls";

const mockQuestion: Question = {
  questionID: "1",
  difficulty: 1,
  resourceType: "Water",
  text: "What is the chemical formula for water?",
  type: "MCQ",
  choices: [
    { text: "H2O", isCorrect: true },
    { text: "CO2", isCorrect: false },
    { text: "O2", isCorrect: false },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("questionToRaindropAnswers", () => {
  it("converts question choices to raindrop answer format", () => {
    const result = questionToRaindropAnswers(mockQuestion);

    expect(result).toEqual([
      { text: "H2O", isCorrect: true },
      { text: "CO2", isCorrect: false },
      { text: "O2", isCorrect: false },
    ]);
  });

  it("returns the correct number of answers", () => {
    const result = questionToRaindropAnswers(mockQuestion);
    expect(result).toHaveLength(mockQuestion.choices.length);
  });

  it("correctly maps isCorrect for each choice", () => {
    const result = questionToRaindropAnswers(mockQuestion);
    const correctAnswers = result.filter((a) => a.isCorrect);
    const incorrectAnswers = result.filter((a) => !a.isCorrect);

    expect(correctAnswers).toHaveLength(1);
    expect(incorrectAnswers).toHaveLength(2);
  });

  it("returns empty array for question with no choices", () => {
    const emptyQuestion = { ...mockQuestion, choices: [] };
    const result = questionToRaindropAnswers(emptyQuestion);
    expect(result).toEqual([]);
  });
});

describe("shuffleArray", () => {
  it("returns an array of the same length", () => {
    const array = [1, 2, 3, 4, 5];
    const result = shuffleArray(array);
    expect(result).toHaveLength(array.length);
  });

  it("contains all the same elements as the original array", () => {
    const array = [1, 2, 3, 4, 5];
    const result = shuffleArray(array);
    expect(result).toEqual(expect.arrayContaining(array));
  });

  it("does not mutate the original array", () => {
    const array = [1, 2, 3, 4, 5];
    const original = [...array];
    shuffleArray(array);
    expect(array).toEqual(original);
  });

  it("shuffles the array into a different order", () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Run shuffle multiple times and check at least one result differs
    const results = Array.from({ length: 10 }, () => shuffleArray(array));
    const allSame = results.every((r) => r.join(",") === array.join(","));

    expect(allSame).toBe(false);
  });
});
