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

const MAP_SIZE = 5;
const TOTAL_QUESTS = 4;

/** The 4 fixed quests */
const QUEST_DEFINITIONS: Array<{
  id: number;
  name: string;
  formula: string;
  required: Record<string, number>;
}> = [
  { id: 1, name: 'ammonia', formula: 'NH₃', required: { Nitrogen: 1, Hydrogen: 3 } },
  { id: 2, name: 'water', formula: 'H₂O', required: { Hydrogen: 2, Oxygen: 1 } },
  { id: 3, name: 'carbon dioxide', formula: 'CO₂', required: { Carbon: 1, Oxygen: 2 } },
  { id: 4, name: 'methane', formula: 'CH₄', required: { Carbon: 1, Hydrogen: 4 } },
];

// ========================
// Map Generation (client-side fallback / mock)
// ========================

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

  // Step 1: Calculate exact elements needed for all 4 quests
  // NH3 = 1N + 3H, H2O = 2H + 1O, CO2 = 1C + 2O, CH4 = 1C + 4H
  // Total: 1N + 9H + 2C + 3O = 15 elements
  const requiredElements: ElementType[] = [
    'Nitrogen',
    'Hydrogen', 'Hydrogen', 'Hydrogen',           // NH3
    'Hydrogen', 'Hydrogen', 'Oxygen',              // H2O
    'Carbon', 'Oxygen', 'Oxygen',                  // CO2
    'Carbon', 'Hydrogen', 'Hydrogen', 'Hydrogen', 'Hydrogen', // CH4
  ];

  // Step 2: Get all positions except [0,0] (player start)
  const positions: Position[] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (x === 0 && y === 0) continue;
      positions.push({ x, y });
    }
  }

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Step 3: Place required elements (guarantees completability)
  for (let i = 0; i < requiredElements.length; i++) {
    const pos = positions[i];
    map[pos.y][pos.x].resource = requiredElements[i];
  }

  // Step 4: Add bonus elements on remaining empty nodes (30% chance)
  const bonusElements: ElementType[] = ['Nitrogen', 'Hydrogen', 'Carbon', 'Oxygen'];
  for (let i = requiredElements.length; i < positions.length; i++) {
    if (Math.random() < 0.3) {
      const pos = positions[i];
      map[pos.y][pos.x].resource =
        bonusElements[Math.floor(Math.random() * bonusElements.length)];
    }
  }

  return map;
}

function initializeQuests(): Quest[] {
  return QUEST_DEFINITIONS.map((def) => ({
    ...def,
    submitted: Object.fromEntries(Object.keys(def.required).map((k) => [k, 0])),
    completed: false,
  }));
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
  const [state, setState] = useState<GameState>(createInitialState);

  // ---- Phase transitions ----

  const setPhase = useCallback((phase: GamePhase) => {
    setState((prev) => ({ ...prev, phase }));
  }, []);

  const startGame = useCallback(() => {
    // TODO: Replace with actual API call to GET /api/soil-game/start
    const map = generateMap();
    const quests = initializeQuests();
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
      quests,
      playerPosition: startPos,
      inventory: createEmptyInventory(),
      terminalLog: initialLog,
      questsCompleted: 0,
    }));
  }, []);

  // ---- Player actions ----

  const movePlayer = useCallback((direction: Direction) => {
    setState((prev) => {
      if (prev.phase !== 'playing') return prev;

      const nextPos = getNextPosition(prev.playerPosition, direction, prev.mapSize);
      if (!nextPos) {
        return {
          ...prev,
          terminalLog: [...prev.terminalLog, '', `> ${direction}`, 'You can\'t move that way!'],
        };
      }

      const dirLabel =
        direction === 'w' ? 'up' : direction === 'a' ? 'left' : direction === 's' ? 'down' : 'right';

      const newLog = [
        ...prev.terminalLog,
        '',
        `> ${direction}`,
        `You moved ${dirLabel}`,
        '',
        ...formatLocationInfo(nextPos, prev.map),
      ];

      return {
        ...prev,
        playerPosition: nextPos,
        terminalLog: newLog,
      };
    });
  }, []);

  const collectResource = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'playing') return prev;

      const node = getNodeAt(prev.map, prev.playerPosition);
      if (!node || !node.resource || node.collected) {
        return {
          ...prev,
          terminalLog: [...prev.terminalLog, '', '> collect', 'Nothing to collect here.'],
        };
      }

      const element = node.resource;
      const symbol = getElementSymbol(element);

      // Mark node as collected
      const newMap = prev.map.map((row) =>
        row.map((n) =>
          n.x === node.x && n.y === node.y ? { ...n, collected: true } : n
        )
      );

      const newInventory = addToInventory(prev.inventory, element);

      const newLog = [
        ...prev.terminalLog,
        '',
        '> collect',
        `You collected ${element.toLowerCase()}! Your inventory has been updated.`,
      ];

      return {
        ...prev,
        map: newMap,
        inventory: newInventory,
        terminalLog: newLog,
      };
    });
  }, []);

  const submitToQuest = useCallback((questNumber: number) => {
    setState((prev) => {
      if (prev.phase !== 'playing') return prev;

      const questIndex = questNumber - 1;
      if (questIndex < 0 || questIndex >= prev.quests.length) {
        return {
          ...prev,
          terminalLog: [...prev.terminalLog, '', `> ${questNumber}`, 'Invalid quest number.'],
        };
      }

      const quest = prev.quests[questIndex];
      if (quest.completed) {
        return {
          ...prev,
          terminalLog: [
            ...prev.terminalLog,
            '',
            `> ${questNumber}`,
            `Quest ${questNumber} is already completed!`,
          ],
        };
      }

      const result = submitElementToQuest(quest, prev.inventory);
      if (!result) {
        return {
          ...prev,
          terminalLog: [
            ...prev.terminalLog,
            '',
            `> ${questNumber}`,
            `You don't have the elements needed for quest ${questNumber}, or it's already complete.`,
          ],
        };
      }

      const { updatedQuest, updatedInventory, elementUsed } = result;

      const newQuests = prev.quests.map((q, i) => (i === questIndex ? updatedQuest : q));

      const newLog = [
        ...prev.terminalLog,
        '',
        `> ${questNumber}`,
        `Submitted ${elementUsed.toLowerCase()} to Quest ${questNumber}: ${quest.name}.`,
      ];

      let newQuestsCompleted = prev.questsCompleted;

      // Check if quest just got completed
      if (updatedQuest.completed) {
        newQuestsCompleted++;
        const progress = Math.round((newQuestsCompleted / TOTAL_QUESTS) * 100);

        newLog.push('');
        newLog.push('PROGRESS UPDATE:');
        newLog.push(
          `You have completed <Quest ${questNumber}: Collect the elements in ${quest.name}>.`
        );
        newLog.push(`Soil Fertility: ${progress}% [${newQuestsCompleted}/${TOTAL_QUESTS} Quests Complete]`);
        newLog.push('Continue to fully fertilize the soil and bring your tree back to life!');
      }

      // Check if ALL quests are done
      const allComplete = newQuests.every((q) => q.completed);

      return {
        ...prev,
        quests: newQuests,
        inventory: updatedInventory,
        terminalLog: newLog,
        questsCompleted: newQuestsCompleted,
        phase: allComplete ? 'complete' : prev.phase,
      };
    });
  }, []);

  // ---- Command handler ----

  const handleCommand = useCallback(
    (rawInput: string) => {
      if (!isValidCommand(rawInput)) {
        setState((prev) => ({
          ...prev,
          terminalLog: [
            ...prev.terminalLog,
            '',
            `> ${rawInput}`,
            'Unknown command. Use W/A/S/D to move, "collect" to pick up, or 1-4 to submit to a quest.',
          ],
        }));
        return;
      }

      const cmd = parseCommand(rawInput);

      switch (cmd) {
        case 'w':
        case 'a':
        case 's':
        case 'd':
          movePlayer(cmd as Direction);
          break;
        case 'c':
          collectResource();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          submitToQuest(parseInt(cmd, 10));
          break;
      }
    },
    [movePlayer, collectResource, submitToQuest]
  );

  // ---- Complete game (POST API) ----

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