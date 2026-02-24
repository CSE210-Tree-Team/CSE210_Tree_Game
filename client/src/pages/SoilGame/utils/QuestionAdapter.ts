/**
 * Converts server questions into the format expected by the soil game. Intakes a 
 * question object and outputs a quest object, or null if the question is invalid or not relevant to the soil game.
 * 
 * Incorrect question options are currently ignored. 
 * 
 * Example input question:
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
 * 
 * Example output quest:
 * {
 *   moleculeName: "Water",
 *   moleculeFormula: "H2O",
 *   required: { H: 2, O: 1 },
 *   submitted: {},
 *   completed: false,
 * }
 * 
 * Note: The parsing logic is currently very basic and assumes a specific format for the question text and choices. 
 * It may need to be updated if the server question format changes or if more complex questions are introduced.
 */

import type { Question } from "../../ServerCalls/ServerCalls";
import type { Quest } from "../types/Abstract.types";

type ElementCount = {
  symbol: string;
  count: number;
};

// Parses entries like "6C" or "12H" into element counts.
const parseElementCount = (value: string): ElementCount | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d+)?([A-Z][a-z]*)$/);
  if (!match) {
    return null;
  }

  // If no number is provided, default to 1 (e.g. "O" means "1O").
  const count = match[1] ? Number(match[1]) : 1;
  if (!Number.isFinite(count) || count <= 0) {
    return null;
  }

  return { count, symbol: match[2] };
};

// Convert a server question into the soil quest shape.
export const toSoilQuest = (question: Question): Quest | null => {
  if (typeof question.resourceType !== "string" || question.resourceType.toLowerCase() !== "earth") {
    return null;
  }

  const questionText = question.text;
  const [namePart, formulaPart] = questionText.split("/");
  const moleculeName = namePart?.trim();
  const moleculeFormula = formulaPart?.trim();

  if (!moleculeName || !moleculeFormula) {
    return null;
  }

  const required: Record<string, number> = {};
  if (Array.isArray(question.choices)) {
    for (const choice of question.choices) {
      if (!choice.isCorrect || typeof choice.text !== "string") { // Currently skipping all other choices.
        continue;
      }

      const parsed = parseElementCount(choice.text);
      if (!parsed) {
        return null;
      }

      // Accumulate counts for each element symbol.
      required[parsed.symbol] = (required[parsed.symbol] ?? 0) + parsed.count;
    }
  }

  // If no valid required elements were parsed, return null to indicate an invalid quest.
  if (Object.keys(required).length === 0) {
    return null;
  }

  return {
    moleculeName,
    moleculeFormula,
    required,
    submitted: {},
    completed: false,
  };
};
