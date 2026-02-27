// Raindrop dimensions and movement
export const RAINDROP_WIDTH = 96;
export const RAINDROP_HEIGHT = 128;
export const RAINDROP_FALL_SPEED = 1.2; // pixels per tick (tick = 16ms)
export const SPAWN_INTERVAL_MS = 1750; // time between raindrop spawns in milliseconds

// Bucket dimensions
export const BUCKET_WIDTH = 140;
export const BUCKET_HEIGHT = 140;

// Game settings
export const NUM_QUESTIONS = 3; // number of questions fetched per game session

// Point indicator settings
export const NUM_POINTS = 10; // points awarded per correct answer
export const INCORRECT = "X"; // text displayed for an incorrect answer
export const POINT_DURATION_MS = 2000; // time the point indicator remains on screen in milliseconds
export const POINT_WIDTH = 72; // pixels, used to center the point indicator above the bucket
