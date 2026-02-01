// Game state management and core logic

import { Direction, GameConfig, GameState, GameStatus, Point } from './types';

const STORAGE_KEY_HIGH_SCORE = 'snake_high_score';

export const DEFAULT_CONFIG: GameConfig = {
  gridSize: 20,
  cellSize: 20,
  initialSpeed: 150,
  speedIncrement: 3,
  minSpeed: 50,
};

/**
 * Get the opposite direction (used to prevent 180° turns)
 */
export function getOppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case Direction.Up: return Direction.Down;
    case Direction.Down: return Direction.Up;
    case Direction.Left: return Direction.Right;
    case Direction.Right: return Direction.Left;
  }
}

/**
 * Check if two points are equal
 */
export function pointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Check if a point exists in an array of points
 */
export function pointInArray(point: Point, arr: Point[]): boolean {
  return arr.some(p => pointsEqual(p, point));
}

/**
 * Load high score from localStorage
 */
export function loadHighScore(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_HIGH_SCORE);
    if (stored) {
      const score = parseInt(stored, 10);
      return isNaN(score) ? 0 : score;
    }
  } catch (e) {
    console.warn('Failed to load high score:', e);
  }
  return 0;
}

/**
 * Save high score to localStorage
 */
export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_HIGH_SCORE, score.toString());
  } catch (e) {
    console.warn('Failed to save high score:', e);
  }
}

/**
 * Generate random food position that doesn't overlap with snake
 */
export function generateFood(snake: Point[], gridSize: number): Point {
  const occupied = new Set(snake.map(p => `${p.x},${p.y}`));
  const available: Point[] = [];
  
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (!occupied.has(`${x},${y}`)) {
        available.push({ x, y });
      }
    }
  }
  
  if (available.length === 0) {
    // Snake fills the entire grid - this is a win condition!
    return { x: -1, y: -1 };
  }
  
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Calculate the next head position based on current direction
 */
export function getNextHeadPosition(head: Point, direction: Direction, gridSize: number): Point {
  let { x, y } = head;
  
  switch (direction) {
    case Direction.Up:
      y = y - 1;
      break;
    case Direction.Down:
      y = y + 1;
      break;
    case Direction.Left:
      x = x - 1;
      break;
    case Direction.Right:
      x = x + 1;
      break;
  }
  
  // Wrap around edges (optional - could also be game over)
  // For classic feel, we'll make wall collision a game over
  return { x, y };
}

/**
 * Check if head position is out of bounds
 */
export function isOutOfBounds(point: Point, gridSize: number): boolean {
  return point.x < 0 || point.x >= gridSize || point.y < 0 || point.y >= gridSize;
}

/**
 * Check if head collides with snake body (self collision)
 */
export function checkSelfCollision(head: Point, body: Point[]): boolean {
  // Check against body segments (excluding head itself which is at index 0)
  return body.slice(1).some(segment => pointsEqual(head, segment));
}

/**
 * Create initial game state
 */
export function createInitialState(config: GameConfig, selectedSkinId: string): GameState {
  const centerX = Math.floor(config.gridSize / 2);
  const centerY = Math.floor(config.gridSize / 2);
  
  // Start with snake of length 3, going right
  const snake: Point[] = [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];
  
  return {
    snake,
    food: generateFood(snake, config.gridSize),
    direction: Direction.Right,
    nextDirection: Direction.Right,
    score: 0,
    highScore: loadHighScore(),
    status: GameStatus.Ready,
    speed: config.initialSpeed,
    selectedSkinId,
  };
}

/**
 * Set direction (with validation to prevent 180° turns)
 */
export function setDirection(state: GameState, newDirection: Direction): void {
  // Can't reverse direction (would cause immediate self-collision)
  if (getOppositeDirection(state.direction) !== newDirection) {
    state.nextDirection = newDirection;
  }
}

/**
 * Process one game tick - returns true if game should continue
 */
export function tick(state: GameState, config: GameConfig): boolean {
  if (state.status !== GameStatus.Playing) {
    return true;
  }
  
  // Apply buffered direction
  state.direction = state.nextDirection;
  
  // Calculate new head position
  const head = state.snake[0];
  const newHead = getNextHeadPosition(head, state.direction, config.gridSize);
  
  // Check wall collision
  if (isOutOfBounds(newHead, config.gridSize)) {
    state.status = GameStatus.GameOver;
    return false;
  }
  
  // Check self collision (check against current body, before adding new head)
  if (checkSelfCollision(newHead, state.snake)) {
    state.status = GameStatus.GameOver;
    return false;
  }
  
  // Move snake: add new head
  state.snake.unshift(newHead);
  
  // Check if food is eaten
  if (pointsEqual(newHead, state.food)) {
    // Snake grows (don't remove tail)
    state.score += 10;
    
    // Update high score
    if (state.score > state.highScore) {
      state.highScore = state.score;
      saveHighScore(state.highScore);
    }
    
    // Increase speed
    state.speed = Math.max(config.minSpeed, state.speed - config.speedIncrement);
    
    // Generate new food
    state.food = generateFood(state.snake, config.gridSize);
    
    // Check for win condition (food returned -1,-1)
    if (state.food.x === -1) {
      // Player won! (filled entire grid)
      state.status = GameStatus.GameOver;
      return false;
    }
  } else {
    // Remove tail (snake moves without growing)
    state.snake.pop();
  }
  
  return true;
}

/**
 * Toggle pause state
 */
export function togglePause(state: GameState): void {
  if (state.status === GameStatus.Playing) {
    state.status = GameStatus.Paused;
  } else if (state.status === GameStatus.Paused) {
    state.status = GameStatus.Playing;
  }
}
