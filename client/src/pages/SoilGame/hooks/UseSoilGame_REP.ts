import { useState, useCallback, useEffect } from 'react';

import type {
  GameState,
  GamePhase,
  Quest,
  Position,
  Inventory,
  ElementType,
  Direction
} from '../types/SoilGame_REP.type';

import { 
  type Node,
  getNodeAt,
  hasUncollectedResource,
} from '../types/Node.type';

import {SYMBOL_TO_ELEMENT} from '../types/stringMappings';

import {
  getNextPosition,
  createEmptyInventory,
  addToInventory,
  submitElementToQuest,
  formatLocationInfo,
  getElementSymbol,
  parseCommand,
  isValidCommand,
} from '../utils/GameHelper_REP';

import { fetchQuestions } from './ServerCollab_REP';

const MAP_SIZE = 5; // TODO: Make this dependent on the game difficulty
const TOTAL_QUESTS = 4; // TODO: Make this dependent on the game difficulty
const SPAWN_PROBABILITY = 0.2; // 20% chance to spawn a resource in each cell

/**
 * Random number generator 
 * e.g. randomInt(1, 10) returns a random integer between 1 and 10
 */
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// ========================
// Map Generation (client-side fallback / mock)
// ========================

// Generates a empty map

// NOTE: Added "quests" inputa
function generateMap(quests: Quest[]): Node[][] {
  const map: Node[][] = [];

  // Initialize empty grid
  for (let y = 0; y < MAP_SIZE; y++) {
    const row: Node[] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      row.push({ x, y, resources: null, collected: false });
    }
    map.push(row);
  }

  const requiredElements: ElementType[] = []

  // Uses input list of elements to propagate requiredElements
  for (const quest of quests) {
    for (const [symbol, count] of Object.entries(quest.required)) {
      const element = SYMBOL_TO_ELEMENT[symbol];
      if (!element) {
        throw new Error(`Unknown element symbol "${symbol}" in quest ${quest.moleculeName}`);
      }
      for (let i = 0; i < count; i++) {
        requiredElements.push(element as ElementType);
      }
    }
  }

  // Initialize random Nodes with the resources needed to complete the game
  for (let i = requiredElements.length - 1; i >= 0; i--) {
    const currNode = map[randomInt(0, MAP_SIZE-1)][randomInt(0, MAP_SIZE-1)]
    if (currNode.resources === null) {
      currNode.resources = {[requiredElements[i]]: 1} as Record<ElementType, number>;
    } else {
      currNode.resources[requiredElements[i]] = (currNode.resources[requiredElements[i]] ?? 0) + 1;;
    }
  }

  // TODO Add addional resources with probabilty

  return map;
}
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
    inventory: createEmptyInventory(),
    terminalLog: [],
    questsCompleted: 0,
  };
}

// ========================
// Hook
// ========================

export function useSoilGame() {

  // Set Initial State
  const [state, setState] = useState<GameState>(createInitialState);

  // Conducts Phase Transitions
  const setPhase = useCallback((phase: GamePhase) => {
    setState((prev) => ({ ...prev, phase }));
  }, []);

  //
  const startGame = useCallback(async () => {
    // TODO: (Not Sure If We Still Need This) Replace with actual API call to GET /api/soil-game/start
    const fetchedQuests: Quest[] = await fetchQuestions();
    const map = generateMap(fetchedQuests);
    // const quests = initializeQuests();
    const startPos: Position = { x: 0, y: 0 };

    const initialLog = [
      'Welcome to the Roots:',
      '',
      ...formatLocationInfo(startPos, map),
    ];

    setState((prev) => ({
      ...prev,
      phase: 'playing',
      map,
      fetchedQuests,
      playerPosition: startPos,
      inventory: createEmptyInventory(),
      terminalLog: initialLog,
      questsCompleted: 0,
    }));
  }, []);
  
  // ---- Command handler ----
  const handleCommand = useCallback((rawInput: string) => {
    // TODO: Implement command handling logic
    console.log('Command received:', rawInput);
    setState((prev) => ({
      ...prev,
      terminalLog: [...prev.terminalLog, '', `> ${rawInput}`],
    }));
  }, []);

  // // ---- Complete game (POST API) ----

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
    handleCommand,
    completeGame,
  };
}