import type { Quest, } from '../types/SoilGame_REP.type';

type questFormat = {
    id: string;
    resource_type: string;
    molecule_name: string;
    molecule_formula: string;
    required: Record<string, number>;
}

const MOCK_QUESTS: Quest[] = [
  {
    id: 1,
    moleculeName: 'Water',
    moleculeFormula: 'H2O',
    required: { H: 2, O: 1 }, // Changed from Hydrogen: 2, Oxygen: 1
    submitted: { H: 0, O: 0 },
    completed: false,
  },
  {
    id: 2,
    moleculeName: 'Ammonia',
    moleculeFormula: 'NH3',
    required: { N: 1, H: 3 }, // Changed from Nitrogen: 1, Hydrogen: 3
    submitted: { N: 0, H: 0 },
    completed: false,
  },
  {
    id: 3,
    moleculeName: 'Methane',
    moleculeFormula: 'CH4',
    required: { C: 1, H: 4 }, // Changed from Carbon: 1, Hydrogen: 4
    submitted: { C: 0, H: 0 },
    completed: false,
  },
];






export async function fetchQuestions(): Promise<Quest[]> {
    // const response = await fetch('/api/get-questions'); // TODO: Create a separate endpoint for soil game questions
    // if (!response.ok) {
    //     throw new Error('Failed to fetch questions');
    // }
    // const raw: questFormat[] = await response.json();

    // // Filter for Soil related questions.
    // const relevantQuestions = raw.filter(
    //     (q) => q.resource_type === "Soil"
    // );
    // return convertToQuests(relevantQuestions);
    await new Promise((resolve) => setTimeout(resolve, 500));
  
  console.log("Using Mock Quests for Soil Game");
  return MOCK_QUESTS;
}

function convertToQuests(raw: questFormat[]): Quest[] {
    const quests: Quest[] = raw.map((q) => ({
        id: Number(q.id),
        moleculeName: q.molecule_name,
        moleculeFormula: q.molecule_formula,
        required: q.required,
        submitted: {}, // Initialize submitted as an empty object
        completed: false,
    }));
    return quests;
}

// TODO: ADD PUSH DATA TO SERVER