import { useState, useCallback, useEffect } from 'react';

import type {
  GameState,
  GamePhase,
  Node,
  Quest,
  Position,
  Inventory,
  ElementType,
  Direction,
//   StartGameResponse,
} from '../types/SoilGame.type';
// {
//     "text": "What is the powerhouse of the cell?",
//     "question_type": "MCQ",
//     "resource_type": "Sun",
//     "choices": ["The mitochondria", "The nucleus", "The ribosome", "The endoplasmic reticulum"],
//     "correct_choices": [0]
// },
// {
//     "text": "",
//     "question_type": "",
//     "resource_type": "",
//     "choices": ["", "", "", ""],
//     "correct_choices": [0]
// },
type responseType = {
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
    const raw: responseType[] = await response.json();

    // Filter for Soil related questions.
    const relevantQuestions = raw.filter(
        (q) => q.resource_type === "Soil"
    );
    return convertToQuests(relevantQuestions);
}

function convertToQuests(raw: responseType[]): Quest[] {
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