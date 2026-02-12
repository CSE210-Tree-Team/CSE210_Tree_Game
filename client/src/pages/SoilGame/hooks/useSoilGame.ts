import { useState, useCallback } from 'react';
import type { GameState, GamePhase } from '../types/soilGame.types';

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
  const [state, setState] = useState<GameState>(createInitialState);

  /**
   * Change the game phase (title → tutorial)
   */
  const setPhase = useCallback((phase: GamePhase) => {
    setState((prev) => ({ ...prev, phase }));
  }, []);

  return {
    state,
    setPhase,
  };
}