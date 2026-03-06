/*
  useSoilGame

  The top-level hook that wires together all Soil minigame state and logic.
  Composes useGameLifecycle, usePlayerMovement, useInventoryActions, and
  useQuestActions into a single interface consumed by the SoilGame page.
  Also owns the command parser — mapping raw terminal input strings (e.g.
  "w", "collect nitrogen 2", "1") to the appropriate sub-hook actions.
*/

import { useState, useCallback } from 'react';

import {
  type GameState,
  type Direction,
  DEFAULT_MAP_SIZE,
} from '../types/Abstract.types';

import { ScoreManager } from '../managers/ScoreManager';
import { renderMapLines } from '../utils/MapHelper';
import { isValidCommand, parseCommand } from '../utils/CommandParser';

import { useGameLifecycle } from './useGameLifecycle';
import { usePlayerMovement } from './usePlayerMovement';
import { useInventoryActions } from './useInventoryActions';
import { useQuestActions } from './useQuestActions';

// ========================
// Initial State
// ========================

function createInitialState(): GameState {
  return {
    phase: 'title',
    map: [],
    mapSize: DEFAULT_MAP_SIZE,
    quests: [],
    playerPosition: { x: 0, y: 0 },
    inventory: {},
    inventoryCapacity: 0,
    terminalLog: [],
    score: 0,
    showCompletionPopup: false,
    requiredElements: new Set<string>(),
  };
}

// ========================
// Hook
// ========================

export function useSoilGame() {
  const [state, setGameState] = useState<GameState>(createInitialState);
  const [scoreManager] = useState(() => new ScoreManager());

  const { setPhase, startGame, completeGame } = useGameLifecycle(state.phase, setGameState, scoreManager);
  const { movePlayer } = usePlayerMovement(setGameState);
  const { collectResources, dropResources } = useInventoryActions(state, setGameState, scoreManager);
  const { submitQuest } = useQuestActions(state, setGameState, scoreManager);

  const handleCommand = useCallback((rawInput: string) => {
    if (!isValidCommand(rawInput)) {
      setGameState((prev) => ({
        ...prev,
        terminalLog: [
          ...prev.terminalLog,
          '',
          `> ${rawInput}`,
          `Unknown command: "${rawInput}". Look at the bottom-right for valid commands. And Scroll down for more info!`,
        ],
      }));
      return;
    }

    const cmd = parseCommand(rawInput);
    const parts = cmd.split(/\s+/);
    const base = parts[0];

    // Echo the command to the terminal
    setGameState((prev) => ({
      ...prev,
      terminalLog: [...prev.terminalLog, '', `> ${rawInput}`],
    }));

    if (['w', 'a', 's', 'd'].includes(base)) {
      movePlayer(base as Direction);
    } else if (base === 'i') {
      setGameState((prev) => ({
        ...prev,
        terminalLog: [
          ...prev.terminalLog,
          '',
          ...renderMapLines(prev.mapSize, prev.playerPosition),
        ],
      }));
    } else if (base === 'collect' && parts.length === 3) {
      collectResources(parts[1], parseInt(parts[2], 10));
    } else if (base === 'drop' && parts.length === 3) {
      dropResources(parts[1], parseInt(parts[2], 10));
    } else if (['1', '2', '3'].includes(base)) {
      submitQuest(parseInt(base) - 1);
    } else if (base === 'exit') {
      setGameState((prev) => ({
        ...prev,
        terminalLog: [...prev.terminalLog, '', 'Exiting game. Calculating final score...'],
      }));
      completeGame();
    }
  }, [movePlayer, collectResources, dropResources, submitQuest, completeGame]);

  // @testing-only — used in test files to sync score manager state
  const setQuestsCompleted = (value: number) => {
    scoreManager.setQuestsCompleted(value);
    const newScore = scoreManager.calculateRawScore();
    setGameState((prev) => ({ ...prev, score: newScore }));
  };

  return {
    state,
    setPhase,
    startGame,
    handleCommand,
    collectResources,
    dropResources,
    completeGame,
    setQuestsCompleted,
    getScoreState: () => scoreManager.getScoreState(),
  };
}
