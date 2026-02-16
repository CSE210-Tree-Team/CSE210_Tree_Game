import type { Quest, } from '../types/SoilGame_REP.type';

type questFormat = {
    id: string;
    resource_type: string;
    molecule_name: string;
    molecule_formula: string;
    required: Record<string, number>;
}

export async function fetchQuestions(): Promise<Quest[]> {
    const response = await fetch('/api/get-questions'); // TODO: Create a separate endpoint for soil game questions
    if (!response.ok) {
        throw new Error('Failed to fetch questions');
    }
    const raw: questFormat[] = await response.json();

    // Filter for Soil related questions.
    const relevantQuestions = raw.filter(
        (q) => q.resource_type === "Soil"
    );
    return convertToQuests(relevantQuestions);
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