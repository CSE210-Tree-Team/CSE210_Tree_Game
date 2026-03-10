/*
  useGameLifecycle

  Manages the overall game lifecycle for the Soil minigame.
  Handles phase transitions (title → tutorial → playing → complete),
  fetching and initializing quests and the map when the game starts,
  and submitting the player's final score when all quests are completed.
  Auto-triggers game completion via a useEffect when all quests are done.
*/

import { useCallback, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import {
  type GamePhase,
  type GameState,
  type Quest,
  type Position,
  SYMBOL_TO_ELEMENT,
} from '../types/Abstract.types';

import { generateMap } from '../utils/MapHelper';
import { createEmptyInventory } from '../utils/InventoryHelper';
import { formatLocationInfo } from '../utils/QuestListHelper';
import { fetchSoilQuestions, SOIL_QUESTION_COUNT } from '../managers/SoilGameQuestionManager';
import { toSoilQuest } from '../utils/QuestionAdapter';
import { ScoreManager } from '../managers/ScoreManager';

const isValidQuest = (quest: Quest | null): quest is Quest => quest != null;

export function useGameLifecycle(
  phase: GamePhase,
  setGameState: Dispatch<SetStateAction<GameState>>,
  scoreManager: ScoreManager,
) {
  const setPhase = useCallback((nextPhase: GamePhase) => {
    setGameState((prev) => ({ ...prev, phase: nextPhase }));
  }, [setGameState]);

  const startGame = useCallback(async () => {
    scoreManager.reset();

    const fetchedQuestions = await fetchSoilQuestions();
    const parsedQuests = fetchedQuestions.map((q) => toSoilQuest(q));
    const fetchedQuests: Quest[] = parsedQuests.filter(isValidQuest);
    if (fetchedQuests.length !== SOIL_QUESTION_COUNT) {
      console.error('Failed to parse all questions into quests. Expected:', SOIL_QUESTION_COUNT, 'Got:', fetchedQuests.length);
      // print out questions
      console.error('Fetched questions:', fetchedQuestions);

      throw new Error('Some questions failed to parse into quests');
    }

    const uniqueElements = new Set<string>();
    let calculatedCap = 0;
    fetchedQuests.forEach((quest) => {
      let questRequiredTotal = 0;
      Object.keys(quest.required).forEach((symbol) => {
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

    const requiredElementsSet = new Set<string>();
    fetchedQuests.forEach((quest) => {
      Object.keys(quest.required).forEach((symbol) => {
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
  }, [scoreManager, setGameState]);

  const completeGame = useCallback(async () => {
    const result = await scoreManager.submitScore();
    const finalScore = scoreManager.calculateScore();

    if (result.success) {
      setGameState((prev) => ({
        ...prev,
        phase: 'complete',
        score: finalScore,
        showCompletionPopup: true,
        terminalLog: [...prev.terminalLog, '', 'Database updated successfully!'],
      }));
    } else {
      console.error('Failed to submit progress:', result.error);
      setGameState((prev) => ({
        ...prev,
        score: finalScore,
        terminalLog: [...prev.terminalLog, '', `Error saving progress: ${result.error}`],
      }));
    }

    return {
      success: result.success,
      progress_added: result.scoreAdded,
      new_soil_level: result.scoreAdded,
    };
  }, [scoreManager, setGameState]);

  // Auto-complete when all quests are done
  useEffect(() => {
    if (phase === 'playing' && scoreManager.getQuestsCompleted() === SOIL_QUESTION_COUNT) {
      completeGame();
    }
  }, [scoreManager, phase, completeGame]);

  return { setPhase, startGame, completeGame };
}
