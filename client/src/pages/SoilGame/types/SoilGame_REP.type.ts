import {
  type Node,
  getNodeAt,
  hasUncollectedResource,
} from './Node.type';

// TODO: EXTEND THIS FOR ELEMENTS IN THE PERIODIC TABLE
export type ElementType = 'Nitrogen' | 'Hydrogen' | 'Carbon' | 'Oxygen';


// Ordered finite states the game can take
export type GamePhase = 'loading' | 'title' | 'tutorial' | 'playing' | 'complete';

/**
 * @interface 
 * id: Unique identifier for each quest
 * moleculeName: Full name of the molecule to construct
 * moleculeFormula: The chemical formula of the molecule to construct
 * required: Element-Value pairs representing the required amount of each element
 * submitted: The number of each element the player has submitted so far
 */
export interface Quest {
  id: number;
  moleculeName: string;
  moleculeFormula: string;

  /** TODO: Consider changing to ElementType, either should work */
  required: Record<string, number>; // e.g. { Nitrogen: 1, Hydrogen: 3 }
  submitted: Record<string, number>; // elements submitted so far
  completed: boolean;
}

// Literally just a tuple representing a position on the map lmao 
export interface Position {
  x: number;
  y: number;
}

// Inventory is a count of each element
export type Inventory = Record<ElementType, number>;

/**
 * @interface
 * phase: Current state of the game
 * map: (N x N) array housing the Map backend
 * mapSize: Size of the map (N x N)
 * quests: List of quests the player must complete
 * playerPosition: Tuple position of player in Map
 * inventory: <ElementType, number> dictionary
 * terminalLog: List of strings representing the terminal log
 * questsCompleted: Number of quests completed so far
 */
export interface GameState {
  phase: GamePhase;
  map: Node[][];
  mapSize: number; // N
  quests: Quest[];
  playerPosition: Position;
  inventory: Inventory;
  terminalLog: string[];
  questsCompleted: number;
}

export interface CompleteGameRequest {
  quests_completed: number;
}

export interface CompleteGameResponse {
  success: boolean;
  progress_added: number;
  new_soil_level: number;
}


/** TODO: Delete the following types and direction layout. 
 *        We want to have directions tied to arrow keys
 */

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