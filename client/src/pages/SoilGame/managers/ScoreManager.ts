/**
 * ScoreManager - Handles all score-related logic for soil game
 *
 * Responsibilities:
 * - Track quest completion and incorrect resource collection
 * - Calculate score from quest completion and penalties
 * - Submit score to server
 * - Error handling for score operations
 */

import { pushGameResults, AuthenticationError, handle401Error } from '../../ServerCalls/ServerCalls';
import type {
  ScoreSubmissionResult,
} from '../types/Abstract.types';

// Scoring constants - soil game configuration
export const POINTS_PER_QUEST = 25;
export const POINTS_PER_INCORRECT = -5;
export const MINIMUM_SCORE = 0;

/**
 * Manages score calculation and submission for the soil game
 */
export class ScoreManager {
  private questsCompleted: number = 0;
  private incorrectElementsCollected: number = 0;

  /**
   * Creates a new ScoreManager instance
   */
  constructor() { }

  /**
   * Record a completed quest
   */
  completeQuest(): void {
    this.questsCompleted++;
  }

  /**
   * Set completed quest count directly.
   * Useful when syncing manager state from authoritative game state.
   */
  setQuestsCompleted(count: number): void {
    this.questsCompleted = Math.max(0, count);
  }

  /**
   * Record an incorrectly collected element
   */
  collectIncorrectElement(): void {
    this.incorrectElementsCollected++;
  }

  /**
   * Get the number of quests completed so far
   */
  getQuestsCompleted(): number {
    return this.questsCompleted;
  }

  /**
   * Get the number of incorrect elements collected
   */
  getIncorrectElementsCollected(): number {
    return this.incorrectElementsCollected;
  }

  /**
   * Reset quest and incorrect collection counters
   */
  reset(): void {
    this.questsCompleted = 0;
    this.incorrectElementsCollected = 0;
  }

  /**
   * Calculate total score based on quests completed and incorrect elements collected
   * This is the raw score that can be negative during gameplay
   * @returns Raw score value (can be negative)
   */
  calculateRawScore(): number {
    const correctProgress = this.questsCompleted * POINTS_PER_QUEST;
    const incorrectPenalty = this.incorrectElementsCollected * POINTS_PER_INCORRECT;
    return correctProgress + incorrectPenalty;
  }

  /**
   * Calculate final score with minimum bound applied
   * Use this for final/submitted scores only
   * @returns Final score value (minimum is 0)
   */
  calculateScore(): number {
    return Math.max(this.calculateRawScore(), MINIMUM_SCORE);
  }

  /**
   * Get the current score state snapshot
   * Returns raw score (can be negative) for gameplay display
   * @returns Object containing questsCompleted and raw score
   */
  getScoreState() {
    return {
      questsCompleted: this.questsCompleted,
      score: this.calculateRawScore(),
    };
  }

  /**
   * Submit score to the server
   * @returns Result of the submission attempt
   */
  async submitScore(): Promise<ScoreSubmissionResult> {
    try {
      const scoreToSubmit = this.calculateScore();

      const success = await pushGameResults(
        scoreToSubmit,
        'Earth'
      );

      return {
        success,
        scoreAdded: scoreToSubmit,
      };
    } catch (error) {
      // Handle authentication errors with user-facing alert
      if (error instanceof AuthenticationError) {
        handle401Error();
        // Return error result but the page will redirect
        return {
          success: false,
          scoreAdded: 0,
          error: 'Authentication required',
        };
      }

      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      return {
        success: false,
        scoreAdded: 0,
        error: errorMessage,
      };
    }
  }
}
