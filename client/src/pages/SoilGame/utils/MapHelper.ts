
import {
  type Node,
  type ElementType,
  type Position,
  type Quest,
  SYMBOL_TO_ELEMENT,
} from "../types/Abstract.types";

import { isValidPosition } from "./PositionHelper";

const MAP_SIZE = 5;

/**
 * Random number generator 
 * e.g. randomInt(1, 10) returns a random integer between 1 and 10
 */
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// ========================
// Map Helpers
// ========================

/** Get the node at a given position */
export function getNodeAt(map: Node[][], pos: Position): Node | null {
  if (!isValidPosition(pos, map.length)) return null;
  return map[pos.y][pos.x];
}

/** Check if current node has an uncollected resource */
export function hasUncollectedResource(map: Node[][], pos: Position): boolean {
  const node = getNodeAt(map, pos);
  return node !== null && node.resources !== null && !node.collected;
}

export function generateMap(quests: Quest[], size: number = MAP_SIZE): Node[][] {
  const map: Node[][] = [];

  // Initialize empty grid
  for (let y = 0; y < size; y++) {
    const row: Node[] = [];
    for (let x = 0; x < size; x++) {
      row.push({ x, y, resources: null, collected: false });
    }
    map.push(row);
  }

  const requiredElements: ElementType[] = []

  // Uses input list of elements to propagate requiredElements
  for (const quest of quests) {
    for (const [symbol, count] of Object.entries(quest.required)) {
      const element = SYMBOL_TO_ELEMENT[symbol] || symbol;
      for (let i = 0; i < count; i++) {
        requiredElements.push(element);
      }
    }
  }

  // Initialize random Nodes with the resources needed to complete the game
  for (let i = requiredElements.length - 1; i >= 0; i--) {
    const currNode = map[randomInt(0, size - 1)][randomInt(0, size - 1)]
    if (currNode.resources === null) {
      currNode.resources = { [requiredElements[i]]: 1 } as Record<ElementType, number>;
    } else {
      currNode.resources[requiredElements[i]] = (currNode.resources[requiredElements[i]] ?? 0) + 1;;
    }
  }

  // TODO Add addional resources with probabilty

  return map;
}