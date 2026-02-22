import {
  type Position,
  type Direction,
  type Inventory,
  type Quest,
  type ElementType,
  DIRECTION_DELTAS,
} from '../types/SoilGame_REP.type';

import {
  getNodeAt,
  type Node
} from '../types/Node.type';

import {
    DIRECTION_LABELS,
    SYMBOL_TO_ELEMENT
} from '../types/stringMappings';

// TODO: Might need to make this variable, unsure
const MAP_SIZE = 5;

// ========================
// Movement Helpers
// ========================map

/** Check if a position is within the grid bounds */
export function isValidPosition(pos: Position, mapSize: number = MAP_SIZE): boolean {
  return pos.x >= 0 && pos.x < mapSize && pos.y >= 0 && pos.y < mapSize;
}

/** Calculate new position after a move, returns null if invalid */
export function getNextPosition(
  current: Position,
  direction: Direction,
  mapSize: number = MAP_SIZE
): Position | null {
  const delta = DIRECTION_DELTAS[direction];
  const next: Position = {
    x: current.x + delta.dx,
    y: current.y + delta.dy,
  };
  return isValidPosition(next, mapSize) ? next : null;
}

/** Get list of possible move directions from a position */
export function getPossibleMoves(pos: Position, mapSize: number = MAP_SIZE): string[] {
  const moves: string[] = ['w', 'a', 's', 'd'];
  const directions: Direction[] = ['w', 'a', 's', 'd'];

  for (const dir of directions) {
    if (getNextPosition(pos, dir, mapSize) !== null) {
      moves.push(DIRECTION_LABELS[dir]);
    }
  }
  return moves;
}

// ========================
// Inventory Helpers
// ========================

/** Create an empty inventory */
export function createEmptyInventory(): Inventory {
  // TODO: MAJOR BAD, we need to remove hardcoding here
  return {
    Nitrogen: 0,
    Hydrogen: 0,
    Carbon: 0,
    Oxygen: 0,
  };
}

/** Add an element to inventory */
export function addToInventory(inventory: Inventory, element: ElementType): Inventory {
  return {
    ...inventory,
    [element]: inventory[element] + 1,
  };
}

/** 
 * @param inventory: Current Inventory
 * @param element: Element to be decremented
 * @param amount: Amount to remove (Default = 1)
 * @returns Updated Inventory OR null if amount > inventory[element]
 */
export function removeFromInventory(
  inventory: Inventory,
  element: ElementType,
  amount: number = 1
): Inventory | null {
  if (inventory[element] < amount) return null;
  return {
    ...inventory,
    [element]: inventory[element] - amount,
  };
}

// ========================
// Quest Helpers
// ========================

/** Check if a quest is fully completed (all required elements submitted) */
export function isQuestComplete(quest: Quest): boolean {
  for (const [element, required] of Object.entries(quest.required)) {
    const submitted = quest.submitted[element] || 0;
    if (submitted < required) return false;
  }
  return true;
}

/** Get the next needed element for a quest, returns null if quest is complete */
export function getNextNeededElement(quest: Quest): { element: ElementType; remaining: number } | null {
  for (const [element, required] of Object.entries(quest.required)) {
    const submitted = quest.submitted[element] || 0;
    if (submitted < required) {
      return { element: element as ElementType, remaining: required - submitted };
    }
  }
  return null;
}

/** 
 * @param quest: Quest object to update
 * @param inventory: Current inventory state
 * @description Reads through quest requirements and 
 *              autosubmits the next element that pertains to
 *              the quest
 * TODO: REMOVE THIS FUNCTION. We want the player to select the 
 *       element they wish to submit and the quest that the element 
 *       pertains to, not this!
 * @returns 
 */
export function submitElementToQuest(
  quest: Quest,
  inventory: Inventory
): { updatedQuest: Quest; updatedInventory: Inventory; elementUsed: ElementType } | null {
  if (quest.completed) return null;

  // Find the next element this quest needs that the player has
  for (const [element, required] of Object.entries(quest.required)) {
    const submitted = quest.submitted[element] || 0;
    const elementType = element as ElementType;

    if (submitted < required && inventory[elementType] > 0) {
      const updatedQuest: Quest = {
        ...quest,
        submitted: {
          ...quest.submitted,
          [element]: submitted + 1,
        },
      };
      updatedQuest.completed = isQuestComplete(updatedQuest);

      const updatedInventory = removeFromInventory(inventory, elementType)!;

      return { updatedQuest, updatedInventory, elementUsed: elementType };
    }
  }

  return null;
}

// ========================
// Terminal Log Helpers
// ========================

/** Get chemical symbol for an element 
 * TODO: BAD, we need to remove hardcoding here
 *       also abstract to SoilGame.types.ts
 */
export function getElementSymbol(element: ElementType): string {

  // TODO: BAD, we need to remove hardcoding here
  const symbols: Record<ElementType, string> = {
    Nitrogen: 'N',
    Hydrogen: 'H',
    Carbon: 'C',
    Oxygen: 'O',
  };
  return symbols[element];
}

/** Format the location info block for terminal */
export function formatLocationInfo(pos: Position, map: Node[][]): string[] {
  // TODO: This is a placeholder
  return [
    'formatLocationInfo not implemented yet',
    'Decide on how to represent ElementTypes and Symbols'
  ];
}

/** Format quest progress string */
export function formatQuestProgress(quest: Quest): string {
  const parts: string[] = [];
  for (const [element, required] of Object.entries(quest.required)) {
    const submitted = quest.submitted[element] || 0;
    parts.push(`${submitted}/${required} ${element}`);
  }
  return parts.join(', ');
}

// ========================
// Validation
// ========================

/** Check if a string is a valid player command */
export function isValidCommand(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  return ['w', 'a', 's', 'd', 'c', 'collect', '1', '2', '3', '4'].includes(normalized);
}

/** 
 * Normalizes the input command to Lowercase forma
 * TODO: Either remove collect command or return a different "collect" representation
 * TODO: Rename to a more descriptive function name
 */
export function parseCommand(input: string): string {
  const normalized = input.toLowerCase().trim();
  if (normalized === 'collect') return 'c';
  return normalized;
}