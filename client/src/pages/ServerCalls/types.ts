/**
 * Type definitions for server API responses and request payloads.
 */

export interface QuestionChoice {
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

export interface GetQuestionsResponse {
  success: boolean;
  count: number;
  questions: Question[];
}

export interface UpdateStatResponse {
  success: boolean;
  message: string;
}

export interface UserInfoResponse {
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
}
