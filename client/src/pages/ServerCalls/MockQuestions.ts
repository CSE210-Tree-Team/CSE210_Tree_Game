// import type { EarthQuestion } from "./ServerCalls";
import type { Question } from "./ServerCalls";

// export const testEarthQuestions: EarthQuestion[] = [
//   {
//     questionID: "test-1",
//     difficulty: 1,
//     resourceType: "Earth",
//     moleculeName: "Water",
//     moleculeFormula: "H2O",
//     required: { H: 2, O: 1 },
//   },
//   {
//     questionID: "test-2",
//     difficulty: 1,
//     resourceType: "Earth",
//     moleculeName: "Ammonia",
//     moleculeFormula: "NH3",
//     required: { N: 1, H: 3 },
//   },
// ];

// export const mockEarthQuestions: Question[] = [
//   {
//     questionID: "test-1",
//     text: "Water/H2O",
//     type: "MultiSelect",
//     difficulty: 1,
//     resourceType: "earth",
//     choices: [
//       { "text": "2H", "isCorrect": true },
//       { "text": "1O", "isCorrect": true },
//     ],
//   },
// ]; 

export const mockEarthQuestions: Question[] = [
  {
    questionID: "test-1",
    text: "Water / H2O",
    type: "MultiSelect",
    difficulty: 1,
    resourceType: "earth",
    choices: [
      { text: "2H", isCorrect: true },
      { text: "1O", isCorrect: true },
    ],
  },

  {
    questionID: "test-2",
    text: "Carbon Dioxide / CO2",
    type: "MultiSelect",
    difficulty: 1,
    resourceType: "earth",
    choices: [
      { text: "1C", isCorrect: true },
      { text: "2O", isCorrect: true },
    ],
  },

  {
    questionID: "test-3",
    text: "Ammonia / NH3",
    type: "MultiSelect",
    difficulty: 2,
    resourceType: "earth",
    choices: [
      { text: "1N", isCorrect: true },
      { text: "3H", isCorrect: true },
    ],
  },

  {
    questionID: "test-4",
    text: "Methane / CH4",
    type: "MultiSelect",
    difficulty: 2,
    resourceType: "earth",
    choices: [
      { text: "1C", isCorrect: true },
      { text: "4H", isCorrect: true },
    ],
  },

  {
    questionID: "test-5",
    text: "Oxygen Gas / O2",
    type: "MultiSelect",
    difficulty: 1,
    resourceType: "earth",
    choices: [
      { text: "2O", isCorrect: true },
      { text: "1O", isCorrect: false },
      { text: "2H", isCorrect: false },
    ],
  },

  {
    questionID: "test-6",
    text: "Glucose / C6H12O6",
    type: "MultiSelect",
    difficulty: 3,
    resourceType: "earth",
    choices: [
      { text: "6C", isCorrect: true },
      { text: "12H", isCorrect: true },
      { text: "6O", isCorrect: true },
      { text: "1N", isCorrect: false },
    ],
  },

  {
    questionID: "test-7",
    text: "Calcium Carbonate / CaCO3",
    type: "MultiSelect",
    difficulty: 3,
    resourceType: "earth",
    choices: [
      { text: "1Ca", isCorrect: true },
      { text: "1C", isCorrect: true },
      { text: "3O", isCorrect: true },
      { text: "2H", isCorrect: false },
    ],
  },

  {
    questionID: "test-8",
    text: "Sulfuric Acid / H2SO4",
    type: "MultiSelect",
    difficulty: 4,
    resourceType: "earth",
    choices: [
      { text: "2H", isCorrect: true },
      { text: "1S", isCorrect: true },
      { text: "4O", isCorrect: true },
      { text: "1C", isCorrect: false },
    ],
  },

  {
    questionID: "test-9",
    text: "Potassium Chloride / KCl",
    type: "MultiSelect",
    difficulty: 2,
    resourceType: "earth",
    choices: [
      { text: "1K", isCorrect: true },
      { text: "1Cl", isCorrect: true },
      { text: "2O", isCorrect: false },
    ],
  },

  {
    questionID: "test-10",
    text: "Magnesium Oxide / MgO",
    type: "MultiSelect",
    difficulty: 2,
    resourceType: "earth",
    choices: [
      { text: "1Mg", isCorrect: true },
      { text: "1O", isCorrect: true },
      { text: "2H", isCorrect: false },
    ],
  },
];