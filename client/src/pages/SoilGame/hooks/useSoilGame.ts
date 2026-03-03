import { useState, useCallback, useEffect } from 'react';

import {
  type GamePhase,
  type Inventory,
  type Position,
  type Quest,
  type GameState,
  type Direction,
  SYMBOL_TO_ELEMENT,
  DIRECTION_LABELS,
  DEFAULT_MAP_SIZE
} from '../types/Abstract.types';


import {
  getNodeAt,
  generateMap
} from '../utils/MapHelper'

import {
  createEmptyInventory,
  addToInventory,
  removeFromInventory
} from '../utils/InventoryHelper';

import {
  checkAndCompleteQuest,
  formatLocationInfo,
  isValidCommand,
  parseCommand
} from '../utils/QuestListHelper';



import {
  getNextPosition,
} from '../utils/PositionHelper';

import {
  fetchSoilQuestions,
  SOIL_QUESTION_COUNT,
} from '../managers/SoilGameQuestionManager';
import { toSoilQuest } from '../utils/QuestionAdapter'

import {
  POINTS_PER_INCORRECT,
  ScoreManager,
} from '../managers/ScoreManager';

import { audioSystem } from '../..//../AudioSystem';
import audioFile from '../audio/test_audio.mp3'



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
    score: 0,
    showCompletionPopup: false,
    requiredElements: new Set<string>(),
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

    // Build set of all required elements across all quests.
    // Note: An element is collectible if it's required by ANY quest, even if it's
    // marked as incorrect in other quests (e.g., H might be incorrect for Quest 1
    // but required for Quest 2's Water/H2O).
    const requiredElementsSet = new Set<string>();
    fetchedQuests.forEach(quest => {
      Object.keys(quest.required).forEach(symbol => {
        const elementName = SYMBOL_TO_ELEMENT[symbol] || symbol;
        requiredElementsSet.add(elementName);
      });
    });

    setGameState((prev) => ({
      ...prev,
      phase: 'playing',
      map,
      quests: fetchedQuests,
      playerPosition: startPos,
      inventory: createEmptyInventory(Array.from(uniqueElements)),
      inventoryCapacity: calculatedCap,
      terminalLog: initialLog,
      score: 0,
      showCompletionPopup: false,
      requiredElements: requiredElementsSet,
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
    // Read current state to perform validation
    if (state.phase !== 'playing') return;

    const node = getNodeAt(state.map, state.playerPosition);
    if (!node || !node.resources || node.collected) {
      setGameState((prev) => ({
        ...prev,
        terminalLog: [
          ...prev.terminalLog,
          '',
          'There are no resources to collect here.',
        ],
      }));
      return;
    }

    const properElement = Object.values(SYMBOL_TO_ELEMENT).find(e => e.toLowerCase() === elementName.toLowerCase()) || elementName;

    if (!node.resources[properElement] || node.resources[properElement] < amountToCollect) {
      setGameState((prev) => ({
        ...prev,
        terminalLog: [
          ...prev.terminalLog,
          '',
          `> Not enough ${properElement} here to collect that amount.`,
        ],
      }));
      return;
    }

    const requiredElementsForValidation =
      state.requiredElements.size > 0
        ? state.requiredElements
        : new Set(
          state.quests.flatMap((quest) =>
            Object.keys(quest.required).map((symbol) => SYMBOL_TO_ELEMENT[symbol] || symbol)
          )
        );

    const hasRequirementContext = requiredElementsForValidation.size > 0;

    // Only enforce unnecessary-resource penalties when quest requirements are available.
    // Elements are penalized only if not needed by any quest.
    if (hasRequirementContext && !requiredElementsForValidation.has(properElement)) {
      // This is an incorrect/unnecessary element - penalize and block pickup
      // Update ScoreManager OUTSIDE of setGameState to prevent double-counting
      scoreManager.collectIncorrectElement();
      const newScore = scoreManager.calculateRawScore();
      
      setGameState((prev) => ({
        ...prev,
        score: newScore,
        terminalLog: [
          ...prev.terminalLog,
          '',
          `${properElement} is not needed for any quest! ${POINTS_PER_INCORRECT} points penalty.`,
          'You cannot collect unnecessary nutrients.',
        ],
      }));
      return;
    }

    // Check inventory capacity
    const currentInventoryCount = Object.values(state.inventory).reduce((sum, count) => sum + count, 0);

    if (currentInventoryCount + amountToCollect > state.inventoryCapacity) {
      setGameState((prev) => ({
        ...prev,
        terminalLog: [
          ...prev.terminalLog,
          '',
          '> Inventory full! You cannot carry more elements.',
        ],
      }));
      return;
    }

    // Add resource to inventory and update map
    setGameState((prev) => {
      const node = getNodeAt(prev.map, prev.playerPosition);
      if (!node) return prev;

      const newInventory = addToInventory(prev.inventory, properElement, amountToCollect);

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
  }, [state, scoreManager]);

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
      
      // Read current state to validate and process quest completion
      if (state.phase !== 'playing') return;
      
      const quest = state.quests[questIndex];
      if (!quest) return;

      if (quest.completed) {
        setGameState(prev => ({
          ...prev,
          terminalLog: [...prev.terminalLog, '', 'You have already completed this quest!']
        }));
        return;
      }

      const result = checkAndCompleteQuest(quest, state.inventory);
      if (result) {
        // Calculate new quest completion state
        const newQuests = [...state.quests];
        newQuests[questIndex] = result.updatedQuest;
        const completedQuestCount = newQuests.filter((q) => q.completed).length;
        
        // Update ScoreManager OUTSIDE of setGameState to prevent double-counting
        scoreManager.setQuestsCompleted(completedQuestCount);
        const newScore = scoreManager.calculateRawScore();

        setGameState((prev) => ({
          ...prev,
          inventory: result.updatedInventory,
          quests: newQuests,
          score: newScore,
          terminalLog: [...prev.terminalLog, '', 'GOOD job you completed a quest!']
        }));
      } else {
        setGameState(prev => ({
          ...prev,
          terminalLog: [...prev.terminalLog, '', 'Incorrect formula. keep searching.']
        }));
      }
    } else if (baseCmd === 'exit') {
      setGameState(prev => ({
        ...prev,
        terminalLog: [...prev.terminalLog, '', 'Exiting game. Calculating final score...']
      }));
      completeGame();
    }

  }, [movePlayer, collectResources, dropResources, scoreManager, state]);


  const completeGame = useCallback(async () => {
    const result = await scoreManager.submitScore();
    const finalScore = scoreManager.calculateScore(); // Ensure minimum 0 is applied

    if (result.success) {
      console.log('Database updated successfully!');
      setGameState(prev => ({
        ...prev,
        phase: 'complete',
        score: finalScore,
        showCompletionPopup: true,
        terminalLog: [...prev.terminalLog, '', 'Database updated successfully!']
      }));
    } else {
      console.error('Failed to submit progress:', result.error);
      setGameState(prev => ({
        ...prev,
        score: finalScore,
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

  useEffect(() => {
    if (state.phase === "playing") {
      audioSystem.playAmbient(audioFile);
    }

    if (state.phase === "complete") {
      audioSystem.fadeOut(3000);
    }
  }, [state.phase]);

  useEffect(() => {
    return () => {
      audioSystem.stopAmbient();
    };
  }, []);

  // Use for testing - updates ScoreManager and syncs score to state
  const setQuestsCompleted = (value: number) => {
    // Update ScoreManager (single source of truth)
    scoreManager.setQuestsCompleted(value);

    // Sync score to state for display
    const newScore = scoreManager.calculateRawScore();
    setGameState(prev => ({
      ...prev,
      score: newScore
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