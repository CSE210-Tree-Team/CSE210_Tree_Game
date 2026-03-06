/*
  useInventoryActions

  Handles collecting and dropping resources in the player's inventory.
  Validates collection against available node resources, inventory capacity,
  and quest requirements (penalizing collection of unneeded elements).
  Dropping resources returns them to the current map node.
*/

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import {
  type GameState,
  type Inventory,
  SYMBOL_TO_ELEMENT,
} from '../types/Abstract.types';

import { getNodeAt } from '../utils/MapHelper';
import { addToInventory, removeFromInventory } from '../utils/InventoryHelper';
import { POINTS_PER_INCORRECT, ScoreManager } from '../managers/ScoreManager';

export function useInventoryActions(
  state: GameState,
  setGameState: Dispatch<SetStateAction<GameState>>,
  scoreManager: ScoreManager,
) {
  const collectResources = useCallback((elementName: string, amountToCollect: number) => {
    if (state.phase !== 'playing') return;

    const node = getNodeAt(state.map, state.playerPosition);
    if (!node || !node.resources || node.collected) {
      setGameState((prev) => ({
        ...prev,
        terminalLog: [...prev.terminalLog, '', 'There are no resources to collect here.'],
      }));
      return;
    }

    const properElement =
      Object.values(SYMBOL_TO_ELEMENT).find((e) => e.toLowerCase() === elementName.toLowerCase()) ||
      elementName;

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

    if (hasRequirementContext && !requiredElementsForValidation.has(properElement)) {
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

    const currentInventoryCount = Object.values(state.inventory).reduce(
      (sum, count) => sum + count,
      0
    );

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

    setGameState((prev) => {
      const currentNode = getNodeAt(prev.map, prev.playerPosition);
      if (!currentNode) return prev;

      const newInventory = addToInventory(prev.inventory, properElement, amountToCollect);

      const newMap = prev.map.map((row) =>
        row.map((n) => {
          if (n.x === currentNode.x && n.y === currentNode.y) {
            const updatedResources = { ...n.resources };
            updatedResources[properElement] -= amountToCollect;
            const collectedAll = Object.values(updatedResources).every((v) => v === 0);
            return { ...n, resources: updatedResources, collected: collectedAll };
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
          `Gathered: ${amountToCollect} ${properElement}.`,
        ],
      };
    });
  }, [state, scoreManager, setGameState]);

  const dropResources = useCallback((elementName: string, amountToDrop: number) => {
    setGameState((prev) => {
      if (prev.phase !== 'playing') return prev;

      const properElement =
        Object.values(SYMBOL_TO_ELEMENT).find(
          (e) => e.toLowerCase() === elementName.toLowerCase()
        ) || elementName;

      const currentAmount = prev.inventory[properElement] || 0;

      if (currentAmount < amountToDrop) {
        return {
          ...prev,
          terminalLog: [
            ...prev.terminalLog,
            '',
            `> You do not have ${amountToDrop} ${properElement} to drop.`,
          ],
        };
      }

      const newInventory = removeFromInventory(prev.inventory, properElement, amountToDrop) as Inventory;

      const newMap = prev.map.map((row) =>
        row.map((n) => {
          if (n.x === prev.playerPosition.x && n.y === prev.playerPosition.y) {
            const updatedResources = n.resources
              ? { ...n.resources }
              : ({} as Record<string, number>);
            updatedResources[properElement] = (updatedResources[properElement] || 0) + amountToDrop;
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
          `Dropped ${amountToDrop} ${properElement}. Space freed.`,
        ],
      };
    });
  }, [setGameState]);

  return { collectResources, dropResources };
}
