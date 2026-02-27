/**
 * ScoreManager - Handles all score-related logic for soil game
 *
 * Responsibilities:
 * - Track quest completion and incorrect resource collection
 * - Calculate score from quest completion and penalties
 * - Submit score to server
 * - Error handling for score operations
 */

import { pushGameResults } from '../../ServerCalls/ServerCalls';
import type {
  ScoreSubmissionResult,
} from '../types/Abstract.types';

// Scoring constants - soil game configuration
const POINTS_PER_QUEST = 25;
const POINTS_PER_INCORRECT = -5;
const MINIMUM_SCORE = 0;

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
   * Score is never negative (minimum is 0)
   * @returns Total score value
   */
  calculateScore(): number {
    const correctProgress = this.questsCompleted * POINTS_PER_QUEST;
    const incorrectPenalty = this.incorrectElementsCollected * POINTS_PER_INCORRECT;
    const totalProgress = correctProgress + incorrectPenalty;
    return Math.max(totalProgress, MINIMUM_SCORE);
  }

  /**
   * Get the current score state snapshot
   * @returns Object containing questsCompleted and calculated score
   */
  getScoreState() {
    return {
      questsCompleted: this.questsCompleted,
      score: this.calculateScore(),
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
