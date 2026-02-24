import type { EarthQuestion } from "./ServerCalls";

export const testEarthQuestions: EarthQuestion[] = [
  {
    questionID: "test-1",
    difficulty: 1,
    resourceType: "Earth",
    moleculeName: "Water",
    moleculeFormula: "H2O",
    required: { H: 2, O: 1 },
  },
  {
    questionID: "test-2",
    difficulty: 1,
    resourceType: "Earth",
    moleculeName: "Ammonia",
    moleculeFormula: "NH3",
    required: { N: 1, H: 3 },
  },
];