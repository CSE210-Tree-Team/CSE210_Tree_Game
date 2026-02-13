
/** Chemical elements the player can collect */
export type ElementType = 'Nitrogen' | 'Hydrogen' | 'Carbon' | 'Oxygen';

/** Game phases in order */
export type GamePhase = 'loading' | 'title' | 'tutorial' | 'playing' | 'complete';

/** A single cell on the 5x5 grid */
export interface Node {
  x: number;
  y: number;
  resource: ElementType | null;
  collected: boolean; // tracks if player already picked up the resource
}

/** A quest requiring specific elements to complete */
export interface Quest {
  id: number;
  name: string;
  formula: string;
  required: Record<string, number>; // e.g. { Nitrogen: 1, Hydrogen: 3 }
  submitted: Record<string, number>; // elements submitted so far
  completed: boolean;
}

/** Player's position on the grid */
export interface Position {
  x: number;
  y: number;
}

/** Inventory is a count of each element */
export type Inventory = Record<ElementType, number>;

/** Full game state */
export interface GameState {
  phase: GamePhase;
  map: Node[][];
  mapSize: number;
  quests: Quest[];
  playerPosition: Position;
  inventory: Inventory;
  terminalLog: string[];
  questsCompleted: number;
}

/** API response for GET /api/soil-game/start */
export interface StartGameResponse {
  map: Array<Array<{ x: number; y: number; resource: ElementType | null }>>;
  quests: Array<{
    id: number;
    name: string;
    formula: string;
    required: Record<string, number>;
  }>;
}

/** API request for POST /api/soil-game/complete */
export interface CompleteGameRequest {
  quests_completed: number;
}

/** API response for POST /api/soil-game/complete */
export interface CompleteGameResponse {
  success: boolean;
  progress_added: number;
  new_soil_level: number;
}

/** Direction commands */
export type Direction = 'w' | 'a' | 's' | 'd';

/** All valid player inputs */
export type PlayerCommand = Direction | 'collect' | 'c' | '1' | '2' | '3' | '4';

/** Movement deltas for each direction */
export const DIRECTION_DELTAS: Record<Direction, { dx: number; dy: number }> = {
  w: { dx: 0, dy: -1 },  // up
  a: { dx: -1, dy: 0 },  // left
  s: { dx: 0, dy: 1 },   // down
  d: { dx: 1, dy: 0 },   // right
};

/** Direction labels for display */
export const DIRECTION_LABELS: Record<Direction, string> = {
  w: 'Up',
  a: 'Left',
  s: 'Down',
  d: 'Right',
};