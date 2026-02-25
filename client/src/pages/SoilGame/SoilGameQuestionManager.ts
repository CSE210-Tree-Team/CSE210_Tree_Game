/**
 * This file manages the fetching and structuring of questions for the Soil Game. It depends
 * on ServerCalls.ts to fetch questions from the server and on QuestionAdapter.ts to convert those questions
 * 
 * It currently is barebones and simply fetches questions from the server and defines a type alias for SoilQuestion.
 * The more complex logic of parsing the server question format into the Quest format used by the game 
 * is handled in QuestionAdapter.ts.
 * 
 * Example server question format:
 * {
 *   "questionId": 123,
 *   "text": "Water/H2O",
 *   "type": "MultiSelect",
 *   "difficulty": 1,
 *   "resourceType": "earth",
 *   "choices": [
 *     { "text": "2H", "isCorrect": true },
 *     { "text": "1O", "isCorrect": true },
 *     { "text": "2Fe", "isCorrect": false }
 *   ],
 * }
 */

import { fetchQuestions, type Question } from "../ServerCalls/ServerCalls";

export type SoilQuestion = Question;

export const SOIL_QUESTION_COUNT = 3;
export const SOIL_QUESTION_TYPE = "MultiSelect";

const mockQuestions: SoilQuestion[] = [
  {
    questionID: "dummy-1",
    text: "Water/H2O",
    type: "MultiSelect",
    difficulty: 1,
    resourceType: "earth",
    choices: [
      { text: "2H", isCorrect: true },
      { text: "1O", isCorrect: true },
      { text: "2O", isCorrect: false },
      { text: "1H", isCorrect: false },
    ],
  },
  {
    questionID: "dummy-2",
    text: "Carbon Dioxide/CO2",
    type: "MultiSelect",
    difficulty: 1,
    resourceType: "earth",
    choices: [
      { text: "1C", isCorrect: true },
      { text: "2O", isCorrect: true },
      { text: "2C", isCorrect: false },
      { text: "1O", isCorrect: false },
    ],
  },
  {
    questionID: "dummy-3",
    text: "Glucose/C6H12O6",
    type: "MultiSelect",
    difficulty: 1,
    resourceType: "earth",
    choices: [
      { text: "6C", isCorrect: true },
      { text: "12H", isCorrect: true },
      { text: "6O", isCorrect: true },
      { text: "6H", isCorrect: false },
      { text: "12O", isCorrect: false },
    ],
  },
];
// Text: "Water/H2O"
// Choices: "2H" - "Correct", "O" - "Correct", "2Fe" - "Incorrect"

export async function fetchSoilQuestions(
  difficulty?: number
): Promise<SoilQuestion[]> {
  try {
    return await fetchQuestions(SOIL_QUESTION_COUNT, "earth", SOIL_QUESTION_TYPE, difficulty);
  } catch (error) {
    console.warn("Falling back to dummy soil questions:");
    return mockQuestions;
  }
