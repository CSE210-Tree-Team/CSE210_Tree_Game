/*
  useQuestActions

  Handles quest submission during gameplay.
  Checks whether the player's current inventory satisfies a quest's required
  elements. On success, marks the quest complete, updates the score, and
  consumes the used inventory items. On failure, logs a hint to keep searching.
*/

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { type GameState } from '../types/Abstract.types';
import { checkAndCompleteQuest } from '../utils/QuestListHelper';
import { ScoreManager } from '../managers/ScoreManager';

export function useQuestActions(
  state: GameState,
  setGameState: Dispatch<SetStateAction<GameState>>,
  scoreManager: ScoreManager,
) {
  const submitQuest = useCallback((questIndex: number) => {
    if (state.phase !== 'playing') return;

    const quest = state.quests[questIndex];
    if (!quest) return;

    if (quest.completed) {
      setGameState((prev) => ({
        ...prev,
        terminalLog: [...prev.terminalLog, '', 'You have already completed this quest!'],
      }));
      return;
    }

    const result = checkAndCompleteQuest(quest, state.inventory);
    if (result) {
      const newQuests = [...state.quests];
      newQuests[questIndex] = result.updatedQuest;
      const completedQuestCount = newQuests.filter((q) => q.completed).length;

      scoreManager.setQuestsCompleted(completedQuestCount);
      const newScore = scoreManager.calculateRawScore();

      setGameState((prev) => ({
        ...prev,
        inventory: result.updatedInventory,
        quests: newQuests,
        score: newScore,
        terminalLog: [...prev.terminalLog, '', 'GOOD job you completed a quest!'],
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        terminalLog: [...prev.terminalLog, '', 'Incorrect formula. keep searching.'],
      }));
    }
  }, [state, scoreManager, setGameState]);

  return { submitQuest };
}
