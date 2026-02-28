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
  DIRECTION_LABELS,
  DEFAULT_MAP_SIZE
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
  checkAndCompleteQuest,
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
  fetchSoilQuestions,
  SOIL_QUESTION_COUNT,
} from '../managers/SoilGameQuestionManager';
import { toSoilQuest } from '../utils/QuestionAdapter'

import {
  ScoreManager,
} from '../managers/ScoreManager';

// import { audioSystem } from '../AudioSystem';

const isValidQuest = (quest: Quest | null): quest is Quest => quest != null;


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
    questsCompleted: 0,
    score: 0,
    showCompletionPopup: false,
  };
}

// ========================
// Hook
// ========================

export function useSoilGame() {
  const [state, setGameState] = useState<GameState>(createInitialState);
  const [scoreManager] = useState(() => new ScoreManager());

  /**
   * Change the game phase (title → tutorial)
   */
  const setPhase = useCallback((phase: GamePhase) => {
    setGameState((prev) => ({ ...prev, phase }));
  }, []);

  const startGame = useCallback(async () => {
    // TODO: (Not Sure If We Still Need This) Replace with actual API call to GET /api/soil-game/start

    // Reset progress tracking for new game
    scoreManager.reset();

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
    let calculatedCap = 0;
    fetchedQuests.forEach(quest => {
      let questRequiredTotal = 0;
      Object.keys(quest.required).forEach(symbol => {
        const elementName = SYMBOL_TO_ELEMENT[symbol] || symbol;
        uniqueElements.add(elementName);
        questRequiredTotal += quest.required[symbol];
      });
      calculatedCap = Math.max(calculatedCap, questRequiredTotal);
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
      inventoryCapacity: calculatedCap,
      terminalLog: initialLog,
      questsCompleted: 0,
      score: 0,
      showCompletionPopup: false,
    }));
  }, [scoreManager]);

  /**
   * Get current score state from ScoreManager
   * Used to sync GameState with the manager's single source of truth
   */
  const getScoreState = useCallback(() => {
    return scoreManager.getScoreState();
  }, [scoreManager]);

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
   * Collect specific resource at the current player position
   */
  const collectResources = useCallback((elementName: string, amountToCollect: number) => {
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

      const properElement = Object.values(SYMBOL_TO_ELEMENT).find(e => e.toLowerCase() === elementName.toLowerCase()) || elementName;

      if (!node.resources[properElement] || node.resources[properElement] < amountToCollect) {
        return {
          ...prev,
          terminalLog: [
            ...prev.terminalLog,
            '',
            `> Not enough ${properElement} here to collect that amount.`,
          ],
        };
      }

      // Check inventory capacity
      const currentInventoryCount = Object.values(prev.inventory).reduce((sum, count) => sum + count, 0);

      if (currentInventoryCount + amountToCollect > prev.inventoryCapacity) {
        return {
          ...prev,
          terminalLog: [
            ...prev.terminalLog,
            '',
            '> Inventory full! You cannot carry more elements.',
          ],
        };
      }

      // Add resource to inventory
      let newInventory = addToInventory(prev.inventory, properElement, amountToCollect);

      // Update node
      const newMap = prev.map.map((row) =>
        row.map((n) => {
          if (n.x === node.x && n.y === node.y) {
            const updatedResources = { ...n.resources };
            updatedResources[properElement] -= amountToCollect;
            const collectedAll = Object.values(updatedResources).every(v => v === 0);
            return { ...n, resources: updatedResources, collected: collectedAll };
          }
          return n;
        })
      );

      const collectionMessage = `Gathered: ${amountToCollect} ${properElement}.`;

      return {
        ...prev,
        inventory: newInventory,
        map: newMap,
        terminalLog: [
          ...prev.terminalLog,
          '',
          collectionMessage
        ],
      };
    });
  }, []);

  const dropResources = useCallback((elementName: string, amountToDrop: number) => {
    setGameState((prev) => {
      if (prev.phase !== 'playing') return prev;

      const properElement = Object.values(SYMBOL_TO_ELEMENT).find(e => e.toLowerCase() === elementName.toLowerCase()) || elementName;
      const currentAmount = prev.inventory[properElement] || 0;

      if (currentAmount < amountToDrop) {
        return {
          ...prev,
          terminalLog: [
            ...prev.terminalLog,
            '',
            `> You do not have ${amountToDrop} ${properElement} to drop.`
          ]
        };
      }

      let newInventory = removeFromInventory(prev.inventory, properElement, amountToDrop) as Inventory;

      // Update map: add dropped resources back to the current node
      const newMap = prev.map.map((row) =>
        row.map((n) => {
          if (n.x === prev.playerPosition.x && n.y === prev.playerPosition.y) {
            const updatedResources = n.resources ? { ...n.resources } : {} as Record<string, number>;
            updatedResources[properElement] = (updatedResources[properElement] || 0) + amountToDrop;
            // Mark as not collected so it shows up in map info again
            return { ...n, resources: updatedResources, collected: false };
          }
          return n;
        })
      );

      return {
        ...prev,
        inventory: newInventory,
        map: newMap,
        terminalLog: [
          ...prev.terminalLog,
          '',
          `Dropped ${amountToDrop} ${properElement}. Space freed.`
        ]
      };
    });
  }, []);


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
    const parts = cmd.split(/\s+/);
    const baseCmd = parts[0];

    setGameState(prev => ({
      ...prev,
      terminalLog: [...prev.terminalLog, '', logUserCommand]
    }));

    if (['w', 'a', 's', 'd'].includes(baseCmd)) {
      movePlayer(baseCmd as Direction);
    } else if (baseCmd === 'i') {
      setGameState(prev => {
        if (prev.phase !== 'playing') return prev;

        const mapLines: string[] = [];
        for (let y = 0; y < prev.mapSize; y++) {
          let rowStr = '';
          for (let x = 0; x < prev.mapSize; x++) {
            if (x === prev.playerPosition.x && y === prev.playerPosition.y) {
              rowStr += '[ * ]   ';
            } else {
              rowStr += '[   ]   ';
            }
          }
          mapLines.push(rowStr.trimEnd());
        }

        return {
          ...prev,
          terminalLog: [
            ...prev.terminalLog,
            '',
            ...mapLines
          ]
        };
      });
    } else if (baseCmd === 'collect' && parts.length === 3) {
      collectResources(parts[1], parseInt(parts[2], 10));
    } else if (baseCmd === 'drop' && parts.length === 3) {
      dropResources(parts[1], parseInt(parts[2], 10));
    } else if (['1', '2', '3'].includes(baseCmd)) {
      const questIndex = parseInt(baseCmd) - 1;
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

          // Sync score manager from authoritative quest completion state
          const completedQuestCount = newQuests.filter((q) => q.completed).length;
          scoreManager.setQuestsCompleted(completedQuestCount);
          const scoreState = scoreManager.getScoreState();

          let nextLog = [...prev.terminalLog, '', 'GOOD job you completed a quest!'];

          return {
            ...prev,
            inventory: result.updatedInventory,
            quests: newQuests,
            questsCompleted: scoreState.questsCompleted,
            score: scoreState.score,
            terminalLog: nextLog
          };
        } else {
          return {
            ...prev,
            terminalLog: [...prev.terminalLog, '', 'Incorrect formula. keep searching.']
          };
        }
      });
    } else if (baseCmd === 'exit') {
      setGameState(prev => ({
        ...prev,
        terminalLog: [...prev.terminalLog, '', 'Exiting game. Calculating final score...']
      }));
      completeGame();
    }

  }, [movePlayer, collectResources, dropResources, scoreManager]);


  const completeGame = useCallback(async () => {
    const result = await scoreManager.submitScore();

    if (result.success) {
      console.log('Database updated successfully!');
      setGameState(prev => ({
        ...prev,
        phase: 'complete',
        showCompletionPopup: true,
        terminalLog: [...prev.terminalLog, '', 'Database updated successfully!']
      }));
    } else {
      console.error('Failed to submit progress:', result.error);
      setGameState(prev => ({
        ...prev,
        terminalLog: [...prev.terminalLog, '', `Error saving progress: ${result.error}`]
      }));
    }

    return {
      success: result.success,
      progress_added: result.scoreAdded,
      new_soil_level: result.scoreAdded,
    };
  }, [scoreManager]);

  // Check for game completion
  useEffect(() => {
    if (state.phase === 'playing' && scoreManager.getQuestsCompleted() === SOIL_QUESTION_COUNT) {
      completeGame();
    }
  }, [scoreManager, state.phase, completeGame]);

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

  // Use for testing completion - updates both state and scoreManager
  const setQuestsCompleted = (value: number) => {
    // Sync scoreManager to desired count
    scoreManager.setQuestsCompleted(value);

    const scoreState = scoreManager.getScoreState();
    setGameState(prev => ({
      ...prev,
      questsCompleted: scoreState.questsCompleted,
      score: scoreState.score
    }));
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
    getScoreState,
  };
}