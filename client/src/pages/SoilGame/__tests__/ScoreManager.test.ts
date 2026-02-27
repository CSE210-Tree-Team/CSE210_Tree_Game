import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager } from '../managers/ScoreManager';
import * as ServerCalls from '../../ServerCalls/ServerCalls';

vi.mock('../../ServerCalls/ServerCalls');

describe('ScoreManager', () => {
  let scoreManager: ScoreManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ServerCalls.pushGameResults).mockResolvedValue(true);
    scoreManager = new ScoreManager();
  });

  describe('completeQuest', () => {
    it('should increment quest counter', () => {
      expect(scoreManager.getQuestsCompleted()).toBe(0);
      scoreManager.completeQuest();
      expect(scoreManager.getQuestsCompleted()).toBe(1);
      scoreManager.completeQuest();
      expect(scoreManager.getQuestsCompleted()).toBe(2);
    });
  });

  describe('collectIncorrectElement', () => {
    it('should increment incorrect element counter', () => {
      scoreManager.collectIncorrectElement();
      scoreManager.collectIncorrectElement();
      scoreManager.collectIncorrectElement();
      expect(scoreManager.calculateScore()).toBe(0);
    });
  });

  describe('calculateScore', () => {
    it('should calculate progress correctly based on quests completed', () => {
      expect(scoreManager.calculateScore()).toBe(0);
      scoreManager.completeQuest();
      expect(scoreManager.calculateScore()).toBe(25);
      scoreManager.completeQuest();
      scoreManager.completeQuest();
      scoreManager.completeQuest();
      expect(scoreManager.calculateScore()).toBe(100);
    });

    it('should apply penalty for incorrect elements', () => {
      // 2 quests (50) - 3 incorrect (15 penalty) = 35
      scoreManager.completeQuest();
      scoreManager.completeQuest();
      scoreManager.collectIncorrectElement();
      scoreManager.collectIncorrectElement();
      scoreManager.collectIncorrectElement();
      expect(scoreManager.calculateScore()).toBe(35);
    });

    it('should clamp progress to minimum of 0', () => {
      // 1 quest (25) - 5 incorrect (25 penalty) = 0 (minimum)
      scoreManager.completeQuest();
      scoreManager.collectIncorrectElement();
      scoreManager.collectIncorrectElement();
      scoreManager.collectIncorrectElement();
      scoreManager.collectIncorrectElement();
      scoreManager.collectIncorrectElement();
      expect(scoreManager.calculateScore()).toBe(0);

      // 1 quest (25) - 6 incorrect (30 penalty) = -5, but clamped to 0
      scoreManager.collectIncorrectElement();
      expect(scoreManager.calculateScore()).toBe(0);
    });
  });

  describe('submitScore', () => {
    it('should submit progress and return success', async () => {
      scoreManager.completeQuest();
      scoreManager.completeQuest();

      const submission = await scoreManager.submitScore();

      expect(submission.success).toBe(true);
      expect(submission.scoreAdded).toBe(50);
      expect(submission.error).toBeUndefined();
      expect(ServerCalls.pushGameResults).toHaveBeenCalledWith(50, 'Earth');
    });

    it('should handle submission errors gracefully', async () => {
      vi.mocked(ServerCalls.pushGameResults).mockRejectedValueOnce(new Error('Network error'));
      scoreManager.completeQuest();
      scoreManager.completeQuest();

      const submission = await scoreManager.submitScore();

      expect(submission.success).toBe(false);
      expect(submission.scoreAdded).toBe(0);
      expect(submission.error).toBe('Network error');
    });

    it('should handle unknown errors', async () => {
      vi.mocked(ServerCalls.pushGameResults).mockRejectedValueOnce('Unknown error string');
      scoreManager.completeQuest();

      const submission = await scoreManager.submitScore();

      expect(submission.success).toBe(false);
      expect(submission.error).toBe('Unknown error string');
    });

    it('should submit progress with incorrect element penalties', async () => {
      scoreManager.completeQuest();
      scoreManager.completeQuest();
      scoreManager.collectIncorrectElement();
      scoreManager.collectIncorrectElement();
      scoreManager.collectIncorrectElement();

      const submission = await scoreManager.submitScore();

      expect(submission.success).toBe(true);
      expect(submission.scoreAdded).toBe(35); // 50 - 15
      expect(ServerCalls.pushGameResults).toHaveBeenCalledWith(35, 'Earth');
    });
  });

  describe('reset', () => {
    it('should reset quest and incorrect counters', () => {
      scoreManager.completeQuest();
      scoreManager.completeQuest();
      scoreManager.collectIncorrectElement();

      expect(scoreManager.calculateScore()).toBe(45);

      scoreManager.reset();

      expect(scoreManager.getQuestsCompleted()).toBe(0);
      expect(scoreManager.calculateScore()).toBe(0);
    });
  });

  describe('getScoreState', () => {
    it('should return progress state snapshot with quests and progress', () => {
      scoreManager.completeQuest();
      scoreManager.completeQuest();
      scoreManager.collectIncorrectElement();

      const state = scoreManager.getScoreState();

      expect(state.questsCompleted).toBe(2);
      expect(state.score).toBe(45); // 2 * 25 - 1 * 5
    });

    it('should return zero progress when no quests completed', () => {
      const state = scoreManager.getScoreState();

      expect(state.questsCompleted).toBe(0);
      expect(state.score).toBe(0);
    });
  });

  describe('basic instantiation', () => {
    it('should create a new manager and track progress correctly', () => {
      const manager = new ScoreManager();

      manager.completeQuest();
      expect(manager.calculateScore()).toBe(25);

      manager.completeQuest();
      manager.completeQuest();
      manager.completeQuest();
      expect(manager.calculateScore()).toBe(100);
    });

    it('should submit to earth game type', async () => {
      const manager = new ScoreManager();
      manager.completeQuest();
      await manager.submitScore();

      expect(ServerCalls.pushGameResults).toHaveBeenCalledWith(25, 'Earth');
    });
  });
});

