
import { 
    type ElementType,
    type Position,
} from "./soilGame_REP.type";

import { isValidPosition } from "../utils/gameHelper_REP";

// A room on the N x N Map
export interface Node {
  x: number;
  y: number;

  // CHANGED
  resources: Record<ElementType, number> | null;
  collected: boolean;
}

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