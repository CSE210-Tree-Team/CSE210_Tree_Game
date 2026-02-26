import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { fetchSoilQuestions, SOIL_QUESTION_COUNT, SOIL_QUESTION_TYPE } from "../client/src/pages/SoilGame/SoilGameQuestionManager";
import { toSoilQuest } from "../client/src/pages/SoilGame/utils/QuestionAdapter";
import type { Question } from "../client/src/pages/ServerCalls/ServerCalls";

type RawQuestion = {
  text: string;
  question_type: string;
  resource_type: string;
  choices: string[];
  correct_choices: number[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const questionsPath = path.join(__dirname, "..", "utils", "questions.json");

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    fail(message);
  }
};

const toServerQuestion = (raw: RawQuestion, index: number): Question => {
  return {
    questionID: `earth-${index}`,
    text: raw.text,
    type: raw.question_type,
    difficulty: 1,
    resourceType: raw.resource_type,
    choices: raw.choices.map((choice, choiceIndex) => ({
      text: choice,
      isCorrect: raw.correct_choices.includes(choiceIndex),
    })),
  };
};

const rawQuestions = JSON.parse(fs.readFileSync(questionsPath, "utf8")) as RawQuestion[];

const earthQuestions = rawQuestions.filter(
  (question) =>
    question.resource_type === "Earth" && question.question_type === "MultiSelect",
);

const expectedRequired: Record<string, Record<string, number>> = {
  "Water/H2O": { H: 2, O: 1 },
  "Carbon Dioxide/CO2": { C: 1, O: 2 },
  "Ammonia/NH3": { N: 1, H: 3 },
  "Methane/CH4": { C: 1, H: 4 },
  "Sodium Chloride/NaCl": { Na: 1, Cl: 1 },
  "Glucose/C6H12O6": { C: 6, H: 12, O: 6 },
};

const fetchCalls: Array<{ url: string; body: any }> = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = async (url: string, options?: any) => {
  const body = options?.body ? JSON.parse(options.body) : {};
  fetchCalls.push({ url, body });

  const requestedCount = typeof body.numQuestions === "number" ? body.numQuestions : earthQuestions.length;
  const responseQuestions = earthQuestions
    .slice(0, requestedCount)
    .map((question, index) => toServerQuestion(question, index));

  return {
    ok: true,
    async json() {
      return {
        success: true,
        count: responseQuestions.length,
        questions: responseQuestions,
      };
    },
  };
};

const run = async (): Promise<void> => {
  const questions = await fetchSoilQuestions();

  assert(fetchCalls.length === 1, "Expected fetchSoilQuestions to call fetch once.");

  const call = fetchCalls[0];
  assert(call.url === "/api/get-questions", "Manager should call the get-questions endpoint.");
  assert(call.body.resourceType === "Earth", "Manager should request earth questions.");
  assert(call.body.questionType === SOIL_QUESTION_TYPE, "Manager should request MultiSelect questions.");
  assert(
    call.body.numQuestions === SOIL_QUESTION_COUNT,
    "Manager should request the configured number of questions.",
  );

  assert(questions.length === SOIL_QUESTION_COUNT, "Manager should return the requested number of questions.");

  for (const question of questions) {
    const quest = toSoilQuest(question);
    assert(quest != null, "Adapter failed to parse an earth question.");
    const expected = expectedRequired[question.text];
    assert(!!expected, `Missing expected requirements for ${question.text}.`);
    assert(
      JSON.stringify(quest.required) === JSON.stringify(expected),
      `Adapter requirements mismatch for ${question.text}.`,
    );
  }
};

run().catch((error) => {
  fail(error instanceof Error ? error.message : "Unknown error while running manager/adapter checks.");
});
