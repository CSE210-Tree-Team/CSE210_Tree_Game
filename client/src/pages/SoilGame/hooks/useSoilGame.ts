import { useState, useCallback } from 'react';

import { 
  type ElementType,
  type GamePhase, 
  type Inventory,
  type Position,
  type Node,
  type Quest,
  type GameState,
  type CompleteGameRequest,
  type CompleteGameResponse,
  type Direction,
  type PlayerCommand,
  DIRECTION_DELTAS,
  SYMBOL_TO_ELEMENT,
  DIRECTION_LABELS
} from '../types/Abstract.types';

import {
  getNodeAt,
  hasUncollectedResource,
  generateMap
} from '../utils/MapHelper'

import {
  createEmptyInventory,
  addToInventory,
  removeFromInventory
} from '../utils/InventoryHelper';

import {
  isQuestComplete,
  getNextNeededElement,
  submitElementToQuest,
  formatQuestProgress,
  getElementSymbol,
  formatLocationInfo,
  isValidCommand,
  parseCommand
} from '../utils/QuestListHelper';

import {
  isValidPosition,
  getNextPosition,
  getPossibleMoves
} from '../utils/PositionHelper';

import {
  fetchQuestions,
} from '../../ServerCalls/ServerCalls'

const MAP_SIZE = 5;

// ========================
// Initial State
// ========================

function createInitialState(): GameState {
  return {
    phase: 'title',
    map: [],
    mapSize: MAP_SIZE,
    quests: [],
    playerPosition: { x: 0, y: 0 },
    inventory: { Nitrogen: 0, Hydrogen: 0, Carbon: 0, Oxygen: 0 }, // hard coded for now but later need to get it from the backend
    terminalLog: [],
    questsCompleted: 0,
  };
}

// ========================
// Hook
// ========================

export function useSoilGame() {
  const [state, setGameState] = useState<GameState>(createInitialState);

  /**
   * Change the game phase (title → tutorial)
   */
  const setPhase = useCallback((phase: GamePhase) => {
    setGameState((prev) => ({ ...prev, phase }));
  }, []);

  //
  const startGame = useCallback(async () => {
    // TODO: (Not Sure If We Still Need This) Replace with actual API call to GET /api/soil-game/start
    const fetchedQuests: Quest[] = await fetchQuestions();
    const map = generateMap(fetchedQuests);
    const startPos: Position = { x: 0, y: 0 };

    const initialLog = [
      'Welcome to the Roots:',
      ...formatLocationInfo(startPos, map),
    ];

    setGameState((prev) => ({
      ...prev,
      phase: 'playing',
      map,
      quests: fetchedQuests,
      playerPosition: startPos,
      inventory: createEmptyInventory(),
      terminalLog: initialLog,
      questsCompleted: 0,
    }));
  }, []);

  // ---- The follow commands are notes for later, do not use them ----
  const handleCommand = useCallback((rawInput: string) => {
    // TODO: Implement command handling logic
    console.log('Command received:', rawInput);
    setGameState((prev) => ({
      ...prev,
      terminalLog: [...prev.terminalLog, '', `> ${rawInput}`],
    }));
  }, []);

  const completeGame = useCallback(async () => {
    // TODO: Replace with actual POST /api/soil-game/complete
    console.log(`Game complete! Quests completed: ${state.questsCompleted}`);
    return {
      success: true,
      progress_added: state.questsCompleted * 25,
      new_soil_level: state.questsCompleted * 25,
    };
  }, [state.questsCompleted]);

  return {
    state,
    setPhase,
    startGame,
    // TODO: Add additional commands here
  };
}