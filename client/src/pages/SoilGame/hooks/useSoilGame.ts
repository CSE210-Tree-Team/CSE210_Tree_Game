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
  SOIL_QUESTION_COUNT
} from '../SoilGameQuestionManager';

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
  checkAndCompleteQuest,
  formatQuestProgress,
  getElementSymbol,
  formatLocationInfo,
  isValidCommand,
  parseCommand
} from '../utils/QuestListHelper';

import { pushGameResults } from '../../ServerCalls/ServerCalls';

import {
  isValidPosition,
  getNextPosition,
  getPossibleMoves
} from '../utils/PositionHelper';

import {
  fetchSoilQuestions,
} from '../SoilGameQuestionManager';
import { toSoilQuest } from '../utils/QuestionAdapter'

import { audioSystem } from '../AudioSystem';

const MAP_SIZE = 5;

const isValidQuest = (quest: Quest | null): quest is Quest => quest != null;

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
    inventory: {},
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
    const fetchedQuestions = await fetchSoilQuestions();

    const parsedQuests = fetchedQuestions.map((question) => toSoilQuest(question));
    const fetchedQuests: Quest[] = parsedQuests.filter(isValidQuest);
    if (fetchedQuests.length !== SOIL_QUESTION_COUNT) {
      console.log(fetchedQuests)
      throw new Error("Some questions failed to parse into quests");
    }

    // Extract all unique elements needed for quests
    const uniqueElements = new Set<string>();
    fetchedQuests.forEach(quest => {
      Object.keys(quest.required).forEach(symbol => {
        const elementName = SYMBOL_TO_ELEMENT[symbol] || symbol;
        uniqueElements.add(elementName);
      });
    });

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
      inventory: createEmptyInventory(Array.from(uniqueElements)),
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

  /**
   * Collect all resources at the current player position
   */
  const collectResources = useCallback(() => {
    setGameState((prev) => {
      if (prev.phase !== 'playing') return prev;

      const node = getNodeAt(prev.map, prev.playerPosition);
      if (!node || !node.resources || node.collected) {
        return {
          ...prev,
          terminalLog: [
            ...prev.terminalLog,
            '',
            'There are no resources to collect here.',
          ],
        };
      }

      // Add ALL resources from the node to the inventory
      let newInventory = { ...prev.inventory };
      const collectedItems: string[] = [];

      Object.entries(node.resources).forEach(([element, amount]) => {
        if (amount > 0) {
          newInventory = addToInventory(newInventory, element, amount);
          collectedItems.push(`${amount} ${element}`);
        }
      });

      // If for some reason there were 0 entries but resources existed
      if (collectedItems.length === 0) {
        return {
          ...prev,
          terminalLog: [
            ...prev.terminalLog,
            '',
            'Area is empty.',
          ],
        };
      }

      // Mark the node as collected across the entire map
      const newMap = prev.map.map((row) =>
        row.map((n) =>
          n.x === node.x && n.y === node.y ? { ...n, collected: true } : n
        )
      );

      const collectionMessage = `Gathered: ${collectedItems.join(', ')}.`;

      return {
        ...prev,
        inventory: newInventory,
        map: newMap,
        terminalLog: [
          ...prev.terminalLog,
          '',
          collectionMessage,
          'Area cleared.',
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
    } else if (cmd === 'c') {
      collectResources();
    } else if (['1', '2', '3'].includes(cmd)) {
      const questIndex = parseInt(cmd) - 1;
      setGameState((prev) => {
        if (prev.phase !== 'playing') return prev;
        const quest = prev.quests[questIndex];
        if (!quest) return prev;

        if (quest.completed) {
          return {
            ...prev,
            terminalLog: [...prev.terminalLog, '', 'You have already completed this quest!']
          };
        }

        const result = checkAndCompleteQuest(quest, prev.inventory);
        if (result) {
          const newQuests = [...prev.quests];
          newQuests[questIndex] = result.updatedQuest;
          const newQuestsCompleted = prev.questsCompleted + 1;

          let nextLog = [...prev.terminalLog, '', 'GOOD job you completed a quest!'];

          return {
            ...prev,
            inventory: result.updatedInventory,
            quests: newQuests,
            questsCompleted: newQuestsCompleted,
            terminalLog: nextLog
          };
        } else {
          return {
            ...prev,
            terminalLog: [...prev.terminalLog, '', 'Incorrect formula. keep searching.']
          };
        }
      });
    }
  }, [movePlayer, collectResources]);



  const completeGame = useCallback(async () => {
    const totalProgress = state.questsCompleted * 25;
    const success = await pushGameResults(totalProgress, 'earth');

    if (success) {
      console.log('Database updated successfully!');
      setGameState(prev => ({
        ...prev,
        phase: 'complete',
        terminalLog: [...prev.terminalLog, '', 'Database updated successfully!']
      }));
    }

    return {
      success,
      progress_added: totalProgress,
      new_soil_level: totalProgress, // This would normally come from the response if it returned it
    };
  }, [state.questsCompleted]);

  // Check for game completion
  useEffect(() => {
    if (state.phase === 'playing' && state.questsCompleted === SOIL_QUESTION_COUNT) {
      completeGame();
    }
  }, [state.questsCompleted, state.phase, completeGame]);

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

  useEffect(() => {
    if (state.phase === "playing") {
      console.log("Playing game music")
      audioSystem.playAmbient();
    }

    if (state.phase === "complete") {
      console.log("Fade game music")
      audioSystem.fadeOut(3000);
    }
  }, [state.phase]);

  useEffect(() => {
    return () => {
      audioSystem.stopAmbient();
    };
  }, []);


  return {
    state,
    setPhase,
    startGame,
    handleCommand,
    collectResources
  };
}

// When questions are fetched show the questions on screen
// Test command event handlers
// Upon completion send questions back to database
// Unit vs end to end tests.