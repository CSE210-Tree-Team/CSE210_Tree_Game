import { useState, useCallback, useEffect } from 'react';

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

    // Fetch questions from server
    const fetchedQuestions = await fetchQuestions("Earth");

    // Extend questions field to include game logic fields
    const fetchedQuests: Quest[] = fetchedQuestions.map((q) => ({
      ...q,
      submitted: {},
      completed: false,
    }));

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

  const movePlayer = useCallback((direction: Direction) => {
    setGameState((prev) => {
      if (prev.phase !== 'playing') return prev;

      const nextPosition = getNextPosition(prev.playerPosition, direction);

      // Check boundaries
      if (nextPosition == null) {
        return {
          ...prev,
          terminalLog: [
            ...prev.terminalLog,
            '',
            `You cannot move ${DIRECTION_LABELS[direction]}.`,
          ],
        };
      }


      const locationInfo = formatLocationInfo(nextPosition, prev.map);

      return {
        ...prev,
        playerPosition: nextPosition,
        terminalLog: [
          ...prev.terminalLog,
          '',
          `You move ${DIRECTION_LABELS[direction]}.`,
          ...locationInfo,
        ],
      };
    });
  }, []);

  // ---- The follow commands are notes for later, do not use them ----
  const handleCommand = useCallback((rawInput: string) => {
    const logUserCommand = `> ${rawInput}`;
    // 1. Validate using the helper
    if (!isValidCommand(rawInput)) {
      setGameState(prev => ({
        ...prev,
        terminalLog: [...prev.terminalLog, '', logUserCommand, `Unknown command: "${rawInput}". Look at the bottom-right for valid commands.`]
      }));
      return;
    }
    // 2. Parse and Route
    const cmd = parseCommand(rawInput);

    setGameState(prev => ({
      ...prev,
      terminalLog: [...prev.terminalLog, '', logUserCommand]
    }));
    if (['w', 'a', 's', 'd'].includes(cmd)) {
      movePlayer(cmd as Direction);
    }
    // will add collect and quest shit later. 


  }, [movePlayer]);



  const completeGame = useCallback(async () => {
    // TODO: Replace with actual POST /api/soil-game/complete
    console.log(`Game complete! Quests completed: ${state.questsCompleted}`);
    return {
      success: true,
      progress_added: state.questsCompleted * 25,
      new_soil_level: state.questsCompleted * 25,
    };
  }, [state.questsCompleted]);

  useEffect(() => {
    if (state.map.length > 0) {
      const debugGrid = state.map.map((row, y) =>
        row.map((node, x) => {
          if (x === state.playerPosition.x && y === state.playerPosition.y) return "🏃";
          if (node.collected) return "✅";
          if (!node.resources) return "·";
          return "📦";
        })
      );
      console.log(`--- Soil Map Matrix [Player @ ${state.playerPosition.x}, ${state.playerPosition.y}] ---`);
      console.table(debugGrid);
    }
  }, [state.map, state.playerPosition]);

  return {
    state,
    setPhase,
    startGame,
    handleCommand
    // TODO: Add additional commands here
  };
}