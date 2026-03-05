/**
 * This file contains functions for making API calls to the server related to authentication, user info, and game operations.
 * 
 * Functions:
 * - establishAuthSession: Verify and establish authentication with the server
 * - fetchUserInfo: Retrieve current user information and tree data
 * - updateAccountProfile: Update user account settings
 * - fetchQuestions: Fetch questions from the server based on specified filters
 * - pushGameResults: Send game progress to update resource levels
 * 
 * Type definitions are located in types.ts
 * Reference settings.py for valid resource types and question types.
 * Reference main.py for API endpoint implementations and expected request/response handling.
 * 
 * Example usage:
 * const questions = await fetchQuestions(5, "earth", "MultiSelect", 1);
 * const success = await pushGameResults(10, "earth");
 */

import type {
  Question,
  GetQuestionsResponse,
  UpdateStatResponse,
  UserInfoResponse,
} from './types';

export type { Question, UserInfoResponse };

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

  if (!response.ok) {
    if (response.status === 401) {
      console.error("Authentication failed: Invalid or expired token");
      throw new AuthenticationError();
    }
    const error = `Failed to establish auth session: ${response.status} ${response.statusText}`;
    console.error(error);
    throw new Error(error);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Server returned unsuccessful response');
  }

  return true;
}

export async function fetchUserInfo(): Promise<UserInfoResponse> {
  const response = await fetch("/api/get-user-info", {
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.error("Authentication failed: Session expired or unauthorized");
      throw new AuthenticationError();
    }
    const error = `Failed to fetch user info: ${response.status} ${response.statusText}`;
    console.error(error);
    throw new Error(error);
  }

  const data: UserInfoResponse = await response.json();

  if (!data.success) {
    throw new Error('Server returned unsuccessful response');
  }

  return data;
}

export async function updateAccountProfile(
  profile: Partial<UserInfoResponse['user']>,
): Promise<boolean> {
  // Map user data to update schema
  const userUpdate: Record<string, unknown> = {
    displayName: profile.displayName || "",
    contactEmail: profile.contactEmail,
    educationLevel: profile.educationLevel,
  };
  
  // Only include email if it's actually provided
  if (profile.email) {
    userUpdate.email = profile.email;
  }

  const response = await fetch("/api/update-user", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(userUpdate),
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.error("Authentication failed: Cannot update profile - unauthorized");
      throw new AuthenticationError();
    }
    const error = `Failed to update account profile: ${response.status} ${response.statusText}`;
    console.error(error);
    throw new Error(error);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Server returned unsuccessful response');
  }

  return true;
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
            console.error("Authentication failed: Cannot fetch questions - unauthorized");
            throw new AuthenticationError();
        }
        const error = `Failed to fetch questions: ${response.status} ${response.statusText}`;
        console.error(error);
        throw new Error(error);
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
            console.error("Authentication failed: Cannot update stat - unauthorized");
            throw new AuthenticationError();
        }
        const error = `Failed to update stat: ${response.status} ${response.statusText}`;
        console.error(error);
        throw new Error(error);
    }

    const data: UpdateStatResponse = await response.json();
    
    return data.success;
}
