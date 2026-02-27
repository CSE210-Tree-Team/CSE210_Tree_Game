// Types:
interface QuestionChoice {
  text: string;
  isCorrect: boolean;
}

/**
 * TODO:
 * Question is formatted wrong for Soilminigame
 * 1) explicitly define resourceType as "earth" and "water"
 * 2) Abstract a BaseQuestion to only house the common fields
 * 3) Extend BaseQuestion with the earth and water minigame extensions
 *      (these contain the updated question and answer fields)
 * 4) Have AI rewrite some tests for this implementation
 *      (half of the current tests should become invalid due to the wrong soil game question format)
 * 5) Ensure the backend follows the naming convention used here
 */

// Used to determine what questions to filter by
type ResourceType = "Earth" | "Water";

type QuestionMap = {
  Water: WaterQuestion;
  Earth: EarthQuestion;
};

export interface BaseQuestion {
  questionID: string;
  difficulty: number;
  resourceType: ResourceType;
}

export interface WaterQuestion extends BaseQuestion {
  resourceType: "Water";
  text: string;
  type: string;
  choices: QuestionChoice[];
}

export interface EarthQuestion extends BaseQuestion {
  resourceType: "Earth";
  moleculeName: string;
  moleculeFormula: string;
  required: Record<string, number>;
}

export type Question = WaterQuestion | EarthQuestion;

interface GetQuestionsResponse<T> {
  success: boolean;
  count: number;
  questions: T[];
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
  user: {
    username: string;
    displayName: string;
    email: string;
    roles: string[];
  };
  tree: {
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

export type AccountProfile = {
  name: string;
  email: string;
  parentEmail: string;
  educationLevel: string;
};

export type AccountProfileResponse = {
  success: boolean;
  profile?: Partial<AccountProfile>;
};

export async function fetchAccountProfile(): Promise<AccountProfileResponse> {
  const response = await fetch("/api/account/profile", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch account profile");
  }

  return (await response.json()) as AccountProfileResponse;
}

export async function updateAccountProfile(
  profile: Partial<AccountProfile>,
): Promise<boolean> {
  const response = await fetch("/api/account/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(profile),
  });

  return response.ok;
}

/**
 * Fetches questions list from Server. Refer to main.py for more.
 * @param numQuestions - Max number of questions to return
 * @param resourceType - Filter by resource (Defines the minigame the pulled questions pertained to)
 * @param questionType - Filter by question type (MCQ, etc.)
 * @param difficulty - Filter by difficulty level (not implemented yet)
 * @returns Array of questions
 */
export async function fetchQuestions<T extends ResourceType>(
  resourceType: T,
  numQuestions?: number,
  questionType?: string,
  difficulty?: number,
): Promise<QuestionMap[T][]> {
  const response = await fetch("/api/get-questions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      numQuestions,
      resourceType,
      questionType,
      difficulty,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch questions");
  }

  const data: GetQuestionsResponse<QuestionMap[T]> = await response.json();

  if (!data.success) {
    throw new Error("Server returned unsuccessful response");
  }

  return data.questions as QuestionMap[T][];
}

/**
 * Pushes the game results to server (increments Tree's resource levels).
 * @param progress - Game result value to add to the resource level
 * @param gameType - Resource type to update: "water", "earth", or "sun"
 * @returns Promise<boolean> - true if update was successful
 */
export async function pushGameResults(
  progress: number,
  gameType: string,
): Promise<boolean> {
  const statName = gameType.toLowerCase();

  if (!["water", "earth", "sun"].includes(statName)) {
    throw new Error(
      `Invalid gameType: ${gameType}. Must be "water", "earth", or "sun"`,
    );
  }

  const response = await fetch("/api/update-stat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
