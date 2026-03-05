
import {
  type Position,
  type Direction,
  DIRECTION_DELTAS,
  DIRECTION_LABELS,
  DEFAULT_MAP_SIZE,
} from '../types/Abstract.types';

// ========================
// Movement Helpers
// ========================

/** Check if a position is within the grid bounds */
export function isValidPosition(pos: Position, mapSize: number = DEFAULT_MAP_SIZE): boolean {
  return pos.x >= 0 && pos.x < mapSize && pos.y >= 0 && pos.y < mapSize;
}

/** Calculate new position after a move, returns null if invalid */
export function getNextPosition(
  current: Position,
  direction: Direction,
  mapSize: number = DEFAULT_MAP_SIZE
): Position | null {
  const delta = DIRECTION_DELTAS[direction];
  const next: Position = {
    x: current.x + delta.dx,
    y: current.y + delta.dy,
  };
  return isValidPosition(next, mapSize) ? next : null;
}

/** Get list of possible move directions from a position */
export function getPossibleMoves(pos: Position, mapSize: number = DEFAULT_MAP_SIZE): string[] {

  const moves: string[] = [];
  const directions: Direction[] = ['w', 'a', 's', 'd'];

  for (const dir of directions) {
    if (getNextPosition(pos, dir, mapSize) !== null) {
      moves.push(DIRECTION_LABELS[dir]);
    }
  }
  return moves;
}