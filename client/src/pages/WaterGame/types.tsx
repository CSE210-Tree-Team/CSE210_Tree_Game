export type RaindropAnswer = {
  text: string;
  isCorrect: boolean;
};

export type RaindropData = {
  id: number;
  x: number;
  y: number;
  velocity: number;
  answer: string;
  isCorrect: boolean;
};

export type PointData = {
  id: number;
  x: number;
  y: number;
  variant: "correct" | "incorrect";
};

export type GamePhase = "title" | "tutorial" | "game" | "end";

/**
 * @interface
 * phase: Current state of the game
 * map: (N x N) array housing the Map backend
 * mapSize: Size of the map (N x N)
 * quests: List of quests the player must complete
 * playerPosition: Tuple position of player in Map
 * inventory: <ElementType, number> dictionary
 * terminalLog: List of strings representing the terminal log
 * score: Current score (managed by ScoreManager, cached here for display)
 * requiredElements: Set of all element names needed for any quest
 */
export interface GameState {
  phase: GamePhase;
  correct: number;
  incorrect: number;
}
