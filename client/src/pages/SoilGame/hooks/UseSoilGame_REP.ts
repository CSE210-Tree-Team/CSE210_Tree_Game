import { useState, useCallback, useEffect } from 'react';

import type {
  GameState,
  GamePhase,
  Node,
  Quest,
  Position,
  Inventory,
  ElementType,
  Direction
  // StartGameResponse,
} from '../types/SoilGame_REP.type';

import {SYMBOL_TO_ELEMENT} from '../types/SoilGame_REP.type';

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
} from '../utils/GameHelper_REP';

import { fetchQuestions } from './ServerCollab_REP';

const MAP_SIZE = 5; // TODO: Make this dependent on the game difficulty
const TOTAL_QUESTS = 4; // TODO: Make this dependent on the game difficulty
const SPAWN_PROBABILITY = 0.2; // 20% chance to spawn a resource in each cell

/**
 * Test Quests we use for development.
 * TODO: Replace with API call or read to gather randomized quests
 * TODO: Randomize the quest list
 * TODO: Abstract the QUEST_DEFINITIONS to a separate file and import it here. 
 */

// const QUEST_DEFINITIONS: Array<{
//   id: number;
//   name: string;
//   formula: string;
//   required: Record<string, number>;
// }> = [

//   // TODO: Decide how to represent subscripts (we don't know if they'll be supported).
//   { id: 1, name: 'ammonia', formula: 'NH₃', required: { Nitrogen: 1, Hydrogen: 3 } },
//   { id: 2, name: 'water', formula: 'H₂O', required: { Hydrogen: 2, Oxygen: 1 } },
//   { id: 3, name: 'carbon dioxide', formula: 'CO₂', required: { Carbon: 1, Oxygen: 2 } },
//   { id: 4, name: 'methane', formula: 'CH₄', required: { Carbon: 1, Hydrogen: 4 } },
// ];

// Server-provided questions (fetched at mount)
 
// TODO
// const [serverQuests, setServerQuests] = useState<Quest[]>([]);

// useEffect(() => {
//   let mounted = true;
//   fetchQuestions().then((qs) => {
//       if (mounted) setServerQuests(qs);
//     })
//     .catch((err) => {
//       console.error('Failed to fetch server questions:', err);
//     });
//   return () => {
//     mounted = false;
//   };
// }, []);

/**
 * Random number generator 
 * e.g. randomInt(1, 10) returns a random integer between 1 and 10
 */
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// async function testQ() {
//   try {
//     const quests = await fetchQuestions(); // Promise → Quest[]
//   } catch (err) {
//     console.error("Failed to load quests", err);
//   }


// }

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

  // const requiredElements: ElementType[] = quests.flatMap((quest) =>
  //   Object.entries(quest.required).flatMap(([symbol, count]) => {
  //     const element = SYMBOL_TO_ELEMENT[symbol];
  //     if (!element) {
  //       throw new Error(`Unknown element symbol "${symbol}" in quest ${quest.moleculeName}`);
  //     }
  //     return Array(count).fill(element);
  //   })
  // );

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

// function initializeQuests(): Quest[] {
//   return QUEST_DEFINITIONS.map((def) => ({
//     ...def,
//     submitted: Object.fromEntries(Object.keys(def.required).map((k) => [k, 0])),
//     completed: false,
//   }));
// }

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
  
  // ---- Player actions ----
  /** 
   * TODO: The following has merely been generated to get something working
   *       Refactor to remove player movement into a separate file.
   */

  
  // const movePlayer = useCallback((direction: Direction) => {
  //   setState((prev) => {
  //     if (prev.phase !== 'playing') return prev;

  //     const nextPos = getNextPosition(prev.playerPosition, direction, prev.mapSize);
  //     if (!nextPos) {
  //       return {
  //         ...prev,
  //         terminalLog: [...prev.terminalLog, '', `> ${direction}`, 'You can\'t move that way!'],
  //       };
  //     }

  //     const dirLabel =
  //       direction === 'w' ? 'up' : direction === 'a' ? 'left' : direction === 's' ? 'down' : 'right';

  //     const newLog = [
  //       ...prev.terminalLog,
  //       '',
  //       `> ${direction}`,
  //       `You moved ${dirLabel}`,
  //       '',
  //       ...formatLocationInfo(nextPos, prev.map),
  //     ];

  //     return {
  //       ...prev,
  //       playerPosition: nextPos,
  //       terminalLog: newLog,
  //     };
  //   });
  // }, []);

  // const collectResource = useCallback(() => {
  //   setState((prev) => {
  //     if (prev.phase !== 'playing') return prev;

  //     const node = getNodeAt(prev.map, prev.playerPosition);
  //     if (!node || !node.resource || node.collected) {
  //       return {
  //         ...prev,
  //         terminalLog: [...prev.terminalLog, '', '> collect', 'Nothing to collect here.'],
  //       };
  //     }

  //     const element = node.resource;
  //     const symbol = getElementSymbol(element);

  //     // Mark node as collected
  //     const newMap = prev.map.map((row) =>
  //       row.map((n) =>
  //         n.x === node.x && n.y === node.y ? { ...n, collected: true } : n
  //       )
  //     );

  //     const newInventory = addToInventory(prev.inventory, element);

  //     const newLog = [
  //       ...prev.terminalLog,
  //       '',
  //       '> collect',
  //       `You collected ${element.toLowerCase()}! Your inventory has been updated.`,
  //     ];

  //     return {
  //       ...prev,
  //       map: newMap,
  //       inventory: newInventory,
  //       terminalLog: newLog,
  //     };
  //   });
  // }, []);

  // const submitToQuest = useCallback((questNumber: number) => {
  //   setState((prev) => {
  //     if (prev.phase !== 'playing') return prev;

  //     const questIndex = questNumber - 1;
  //     if (questIndex < 0 || questIndex >= prev.quests.length) {
  //       return {
  //         ...prev,
  //         terminalLog: [...prev.terminalLog, '', `> ${questNumber}`, 'Invalid quest number.'],
  //       };
  //     }

  //     const quest = prev.quests[questIndex];
  //     if (quest.completed) {
  //       return {
  //         ...prev,
  //         terminalLog: [
  //           ...prev.terminalLog,
  //           '',
  //           `> ${questNumber}`,
  //           `Quest ${questNumber} is already completed!`,
  //         ],
  //       };
  //     }

  //     const result = submitElementToQuest(quest, prev.inventory);
  //     if (!result) {
  //       return {
  //         ...prev,
  //         terminalLog: [
  //           ...prev.terminalLog,
  //           '',
  //           `> ${questNumber}`,
  //           `You don't have the elements needed for quest ${questNumber}, or it's already complete.`,
  //         ],
  //       };
  //     }

  //     const { updatedQuest, updatedInventory, elementUsed } = result;

  //     const newQuests = prev.quests.map((q, i) => (i === questIndex ? updatedQuest : q));

  //     const newLog = [
  //       ...prev.terminalLog,
  //       '',
  //       `> ${questNumber}`,
  //       `Submitted ${elementUsed.toLowerCase()} to Quest ${questNumber}: ${quest.name}.`,
  //     ];

  //     let newQuestsCompleted = prev.questsCompleted;

  //     // Check if quest just got completed
  //     if (updatedQuest.completed) {
  //       newQuestsCompleted++;
  //       const progress = Math.round((newQuestsCompleted / TOTAL_QUESTS) * 100);

  //       newLog.push('');
  //       newLog.push('PROGRESS UPDATE:');
  //       newLog.push(
  //         `You have completed <Quest ${questNumber}: Collect the elements in ${quest.name}>.`
  //       );
  //       newLog.push(`Soil Fertility: ${progress}% [${newQuestsCompleted}/${TOTAL_QUESTS} Quests Complete]`);
  //       newLog.push('Continue to fully fertilize the soil and bring your tree back to life!');
  //     }

  //     // Check if ALL quests are done
  //     const allComplete = newQuests.every((q) => q.completed);

  //     return {
  //       ...prev,
  //       quests: newQuests,
  //       inventory: updatedInventory,
  //       terminalLog: newLog,
  //       questsCompleted: newQuestsCompleted,
  //       phase: allComplete ? 'complete' : prev.phase,
  //     };
  //   });
  // }, []);

  // // ---- Command handler ----

  // const handleCommand = useCallback(
  //   (rawInput: string) => {
  //     if (!isValidCommand(rawInput)) {
  //       setState((prev) => ({
  //         ...prev,
  //         terminalLog: [
  //           ...prev.terminalLog,
  //           '',
  //           `> ${rawInput}`,
  //           'Unknown command. Use W/A/S/D to move, "collect" to pick up, or 1-4 to submit to a quest.',
  //         ],
  //       }));
  //       return;
  //     }

  //     const cmd = parseCommand(rawInput);

  //     switch (cmd) {
  //       case 'w':
  //       case 'a':
  //       case 's':
  //       case 'd':
  //         movePlayer(cmd as Direction);
  //         break;
  //       case 'c':
  //         collectResource();
  //         break;
  //       case '1':
  //       case '2':
  //       case '3':
  //       case '4':
  //         submitToQuest(parseInt(cmd, 10));
  //         break;
  //     }
  //   },
  //   [movePlayer, collectResource, submitToQuest]
  // );

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