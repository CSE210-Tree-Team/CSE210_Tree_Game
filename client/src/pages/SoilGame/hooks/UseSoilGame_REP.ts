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
  generateMap,
} from '../types/Map.type';

import {SYMBOL_TO_ELEMENT} from '../types/stringMappings';

import {
  createEmptyInventory,
  addToInventory,
} from '../utils/InventoryHelper'

import {
  submitElementToQuest,
  formatLocationInfo,
  getElementSymbol,
  parseCommand,
  isValidCommand,
} from '../utils/GameHelper_REP';

import { getNextPosition, } from '../utils/PositionHelper';

import { fetchQuestions } from '../../ServerCalls/ServerCollab_REP';

const MAP_SIZE = 5; // TODO: Make this dependent on the game difficulty
const TOTAL_QUESTS = 4; // TODO: Make this dependent on the game difficulty
const SPAWN_PROBABILITY = 0.2; // 20% chance to spawn a resource in each cell

type questFormat = {
    id: string;
    resource_type: string;
    molecule_name: string;
    molecule_formula: string;
    required: Record<string, number>;
}

// Filter for Soil related questions.
    // const relevantQuestions = raw.filter(
    //     (q) => q.resource_type === "Soil"
    // );

function convertToQuests(raw: questFormat[]): Quest[] {
    const quests: Quest[] = raw.map((q) => ({
        id: Number(q.id),
        moleculeName: q.molecule_name,
        moleculeFormula: q.molecule_formula,
        required: q.required,
        submitted: {}, // Initialize submitted as an empty object
        completed: false,
    }));
    return quests;
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