// Core game types

export interface Point {
  x: number;
  y: number;
}

export enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
}

export interface Skin {
  id: string;
  name: string;
  headColor: string;
  bodyColor: string;
  unlocked: boolean;
  unlockCondition: string;
  requiredScore: number; // Score needed to unlock (0 = free)
}

export interface GameConfig {
  gridSize: number;
  cellSize: number;
  initialSpeed: number; // ms between moves
  speedIncrement: number; // ms reduction per food eaten
  minSpeed: number; // fastest possible speed
}

export enum GameStatus {
  Ready = 'READY',
  Playing = 'PLAYING',
  Paused = 'PAUSED',
  GameOver = 'GAME_OVER',
}

export interface GameState {
  snake: Point[];
  food: Point;
  direction: Direction;
  nextDirection: Direction; // Buffered direction to prevent 180° turns
  score: number;
  highScore: number;
  status: GameStatus;
  speed: number;
  selectedSkinId: string;
}
