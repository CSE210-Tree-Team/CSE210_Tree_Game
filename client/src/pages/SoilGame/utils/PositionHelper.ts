import {
  SYMBOL_TO_ELEMENT,
  DIRECTION_LABELS,
} from '../types/stringMappings'

import {
  type Position,
  type Direction,
  type Inventory,
  type Quest,
  type ElementType,
  DIRECTION_DELTAS,
} from '../types/SoilGame_REP.type';
import {
  type Node,
  getNodeAt,
  hasUncollectedResource,
} from '../types/Map.type';
  
const MAP_SIZE = 5;

// ========================
// Movement Helpers
// ========================

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
  const moves: string[] = [];
  const directions: Direction[] = ['w', 'a', 's', 'd'];

  for (const dir of directions) {
    if (getNextPosition(pos, dir, mapSize) !== null) {
      moves.push(DIRECTION_LABELS[dir]);
    }
  }
  return moves;
}

// ========================
// Map Helpers
// ========================

/** Get the node at a given position */
// export function getNodeAt(map: Node[][], pos: Position): Node | null {
//   if (!isValidPosition(pos, map.length)) return null;
//   return map[pos.y][pos.x];
// }

/** Check if current node has an uncollected resource */
// export function hasUncollectedResource(map: Node[][], pos: Position): boolean {
//   const node = getNodeAt(map, pos);
//   return node !== null && node.resources !== null && !node.collected;
// }