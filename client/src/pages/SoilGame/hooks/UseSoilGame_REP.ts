import { useState, useCallback, useEffect } from 'react';

import type {
  GameState,
  GamePhase,
  Node,
  Quest,
  Position,
  Inventory,
  ElementType,
  Direction,
  StartGameResponse,
} from '../types/soilGame.types';

import {
  getNextPosition,
  getNodeAt,
  hasUncollectedResource,
  createEmptyInventory,
  addToInventory,
  submitElementToQuest,
  formatLocationInfo,
  getElementSymbol,
  parseCommand,
  isValidCommand,
} from '../utils/gameHelpers';

import { fetchQuestions } from './ServerCollab';

const MAP_SIZE = 5; // TODO: Make this dependent on the game difficulty
const TOTAL_QUESTS = 4; // TODO: Make this dependent on the game difficulty
const SPAWN_PROBABILITY = 0.2; // 20% chance to spawn a resource in each cell

/**
 * Test Quests we use for development.
 * TODO: Replace with API call or read to gather randomized quests
 * TODO: Randomize the quest list
 * TODO: Abstract the QUEST_DEFINITIONS to a separate file and import it here. 
 */

const QUEST_DEFINITIONS: Array<{
  id: number;
  name: string;
  formula: string;
  required: Record<string, number>;
}> = [

  // TODO: Decide how to represent subscripts (we don't know if they'll be supported).
  { id: 1, name: 'ammonia', formula: 'NH₃', required: { Nitrogen: 1, Hydrogen: 3 } },
  { id: 2, name: 'water', formula: 'H₂O', required: { Hydrogen: 2, Oxygen: 1 } },
  { id: 3, name: 'carbon dioxide', formula: 'CO₂', required: { Carbon: 1, Oxygen: 2 } },
  { id: 4, name: 'methane', formula: 'CH₄', required: { Carbon: 1, Hydrogen: 4 } },
];

// Server-provided questions (fetched at mount)

const [serverQuests, setServerQuests] = useState<Quest[]>([]);

useEffect(() => {
  let mounted = true;
  fetchQuestions()
    .then((qs) => {
      if (mounted) setServerQuests(qs);
    })
    .catch((err) => {
      console.error('Failed to fetch server questions:', err);
    });
  return () => {
    mounted = false;
  };
}, []);

/**
 * Random number generator 
 * e.g. randomInt(1, 10) returns a random integer between 1 and 10
 */
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

async function startGame() {
  try {
    const quests = await fetchQuestions(); // Promise → Quest[]
  } catch (err) {
    console.error("Failed to load quests", err);
  }


}

// ========================
// Map Generation (client-side fallback / mock)
// ========================

// Generates a empty map
function generateMap(): Node[][] {
  const map: Node[][] = [];

  // Initialize empty grid
  for (let y = 0; y < MAP_SIZE; y++) {
    const row: Node[] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      row.push({ x, y, resource: null, collected: false });
    }
    map.push(row);
  }

  const requiredElements: ElementType[] = []

  for (let i = requiredElements.length - 1; i >= 0; i--) {
    // TODO: we have to make changes as resource is a dictionary of element counts, not a single element
    map[randomInt(0, MAP_SIZE-1)][randomInt(0, MAP_SIZE-1)].resource = requiredElements[i];
  }
  // TODO:
  return map;
}