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

export type GameScreen = "start" | "tutorial" | "game" | "end";
