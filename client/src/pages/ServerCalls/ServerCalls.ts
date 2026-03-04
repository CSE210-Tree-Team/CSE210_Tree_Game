/**
 * This file contains functions for making API calls to the server related to fetching questions and pushing game results.
 * It defines the expected request and response formats for these API calls.
 * 
 * fetchQuestions: Fetches a list of questions from the server based on specified filters (number of questions, resource type, question type, difficulty).
 * pushGameResults: Sends the player's game progress to the server to update the corresponding resource levels.
 * 
 * The question and response formats are defined as TypeScript interfaces.
 * 
 * Reference settings.py for valid resource types and question types.
 * Reference main.py for API endpoint implementations and expected request/response handling.
 * 
 * Example usage:
 * const questions = await fetchQuestions(5, "earth", "MultiSelect", 1);
 * const success = await pushGameResults(10, "earth");
 */

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

export type AuthVerifyResponse = {
  success?: boolean;
};

export async function establishAuthSession(
  token: string,
  user: unknown,
): Promise<boolean> {
  const response = await fetch("/api/auth/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ user }),
  });

  return response.ok;
}

export type UserInfoResponse = {
  success: boolean;
  message?: string;
  user: {
    username: string;
    displayName: string;
    email: string;
    roles: string[];
    contactEmail?: string;
    educationLevel?: string;
  };
  tree?: {
    treeID: string;
    health: string;
    growthStage: number;
    resourceLevels: {
      water: number;
      earth: number;
      sun: number;
    };
  };
};

export async function fetchUserInfo(): Promise<UserInfoResponse> {
  const response = await fetch("/api/get-user-info", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }

  return (await response.json()) as UserInfoResponse;
}

export async function updateAccountProfile(
  profile: Partial<UserInfoResponse['user']>,
): Promise<boolean> {
  // Map user data to update schema
  const userUpdate = {
    username: "",  // Will be ignored by server
    displayName: profile.displayName || "",
    email: profile.email || "",
    roles: [],  // Will be ignored by server
    contactEmail: profile.contactEmail,
    educationLevel: profile.educationLevel,
  };

  const response = await fetch("/api/update-user", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(userUpdate),
  });

  return response.ok;
}

/**
 * Fetches questions list from Server. Refer to main.py for more.
 * @param numQuestions - Max number of questions to return
 * @param resourceType - Filter by resource (Defines the minigame the pulled questions pertained to)
 * @param questionType - Filter by question type (MCQ, etc.)
interface UpdateStatResponse {
    success: boolean;
    message: string;
}

/**
 * Custom error class for authentication failures
 */
export class AuthenticationError extends Error {
    constructor(message: string = 'Authentication required. Please log in again.') {
        super(message);
        this.name = 'AuthenticationError';
    }
}

/**
 * Handles 401 authentication errors by showing alert and redirecting to login
 */
export function handle401Error(): void {
    alert('Your session has expired. Please log in again.');
    // Redirect to root which will trigger Auth0 login
    window.location.href = '/';
}

/**
 * Fetches questions list from Server. Refer to main.py for more.
 * @param numQuestions - Max number of questions to return
 * @param resourceType - Filter by resource (Defines the minigame the pulled questions pertained to)
 * @param questionType - Filter by question type (MCQ, etc.)
 * @param difficulty - Filter by difficulty level (not implemented yet)
 * @returns Array of questions
 */
export async function fetchQuestions(
    numQuestions?: number,
    resourceType?: string,
    questionType?: string,
    difficulty?: number
): Promise<Question[]> {
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
        if (response.status === 401) {
            throw new AuthenticationError();
        }
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
 * @param gameType - Resource type to update: "Water", "Earth", or "Sun"
 * @returns Promise<boolean> - true if update was successful
 */
export async function pushGameResults(progress: number, gameType: string): Promise<boolean> {
    // Validate gameType as a properly capitalized resource
    const validGameTypes = ['Water', 'Earth', 'Sun'];
    if (!validGameTypes.includes(gameType)) {
        throw new Error(`Invalid gameType: ${gameType}. Must be "Water", "Earth", or "Sun"`);
    }
    
    const statName = gameType.toLowerCase();

    const response = await fetch('/api/update-stat', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            stat_name: statName,
            value: progress,
        }),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new AuthenticationError();
        }
        throw new Error(`Failed to update stat: ${response.statusText}`);
    }

    const data: UpdateStatResponse = await response.json();
    
    return data.success;
}
