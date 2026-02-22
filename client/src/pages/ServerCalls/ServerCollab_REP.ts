// Types:
interface QuestionChoice {
    text: string;
    isCorrect: boolean;
}

export interface Question {
    questionID: string;
    text: string;
    type: string;
    difficulty: number;
    resourceType: string;
    choices: QuestionChoice[];
}

interface GetQuestionsResponse {
    success: boolean;
    count: number;
    questions: Question[];
}

interface UpdateStatResponse {
    success: boolean;
    message: string;
}

/**
 * Fetches questions list from Server. Refer to main.py for more.
 * @param numQuestions - Max number of questions to return
 * @param resourceType - Filter by resource (Defines the minigame the pulled questions pertained to)
 * @param questionType - Filter by question type (MCQ, etc.)
 * @param difficulty - Filter by difficulty level (not implemented yet)
 * @returns Array of questions
 */
export async function fetchQuestions(numQuestions?: number, resourceType?: string,
        questionType?: string, difficulty?: number): Promise<Question[]> {
    const response = await fetch('/api/get-questions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            numQuestions,
            resourceType,
            questionType,
            difficulty,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch questions');
    }

    const data: GetQuestionsResponse = await response.json();
    
    if (!data.success) {
        throw new Error('Server returned unsuccessful response');
    }

    return data.questions;
}

/**
 * Pushes the game results to server (increments Tree's resource levels).
 * @param progress - Game result value to add to the resource level
 * @param gameType - Resource type to update: "water", "earth", or "sun"
 * @returns Promise<boolean> - true if update was successful
 */
export async function pushGameResults(progress: number, gameType: string): Promise<boolean> {
    const statName = gameType.toLowerCase();
    
    if (!['water', 'earth', 'sun'].includes(statName)) {
        throw new Error(`Invalid gameType: ${gameType}. Must be "water", "earth", or "sun"`);
    }

    const response = await fetch('/api/update-stat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            stat_name: statName,
            value: progress,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to update stat: ${response.statusText}`);
    }

    const data: UpdateStatResponse = await response.json();
    
    return data.success;
}
