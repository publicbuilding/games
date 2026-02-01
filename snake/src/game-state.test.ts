// Unit tests for game logic

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkSelfCollision,
  createInitialState,
  DEFAULT_CONFIG,
  generateFood,
  getNextHeadPosition,
  getOppositeDirection,
  isOutOfBounds,
  pointsEqual,
  pointInArray,
  setDirection,
  tick,
  togglePause,
} from './game-state';
import { Direction, GameConfig, GameState, GameStatus, Point } from './types';

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Point utilities', () => {
  it('pointsEqual returns true for same coordinates', () => {
    expect(pointsEqual({ x: 5, y: 10 }, { x: 5, y: 10 })).toBe(true);
  });

  it('pointsEqual returns false for different coordinates', () => {
    expect(pointsEqual({ x: 5, y: 10 }, { x: 5, y: 11 })).toBe(false);
    expect(pointsEqual({ x: 4, y: 10 }, { x: 5, y: 10 })).toBe(false);
  });

  it('pointInArray finds point in array', () => {
    const arr: Point[] = [{ x: 1, y: 1 }, { x: 2, y: 3 }, { x: 5, y: 5 }];
    expect(pointInArray({ x: 2, y: 3 }, arr)).toBe(true);
  });

  it('pointInArray returns false when point not in array', () => {
    const arr: Point[] = [{ x: 1, y: 1 }, { x: 2, y: 3 }];
    expect(pointInArray({ x: 9, y: 9 }, arr)).toBe(false);
  });
});

describe('Direction utilities', () => {
  it('getOppositeDirection returns correct opposites', () => {
    expect(getOppositeDirection(Direction.Up)).toBe(Direction.Down);
    expect(getOppositeDirection(Direction.Down)).toBe(Direction.Up);
    expect(getOppositeDirection(Direction.Left)).toBe(Direction.Right);
    expect(getOppositeDirection(Direction.Right)).toBe(Direction.Left);
  });
});

describe('Movement', () => {
  const gridSize = 20;

  it('getNextHeadPosition moves up correctly', () => {
    const result = getNextHeadPosition({ x: 10, y: 10 }, Direction.Up, gridSize);
    expect(result).toEqual({ x: 10, y: 9 });
  });

  it('getNextHeadPosition moves down correctly', () => {
    const result = getNextHeadPosition({ x: 10, y: 10 }, Direction.Down, gridSize);
    expect(result).toEqual({ x: 10, y: 11 });
  });

  it('getNextHeadPosition moves left correctly', () => {
    const result = getNextHeadPosition({ x: 10, y: 10 }, Direction.Left, gridSize);
    expect(result).toEqual({ x: 9, y: 10 });
  });

  it('getNextHeadPosition moves right correctly', () => {
    const result = getNextHeadPosition({ x: 10, y: 10 }, Direction.Right, gridSize);
    expect(result).toEqual({ x: 11, y: 10 });
  });
});

describe('Collision detection', () => {
  it('isOutOfBounds detects top boundary', () => {
    expect(isOutOfBounds({ x: 5, y: -1 }, 20)).toBe(true);
  });

  it('isOutOfBounds detects bottom boundary', () => {
    expect(isOutOfBounds({ x: 5, y: 20 }, 20)).toBe(true);
  });

  it('isOutOfBounds detects left boundary', () => {
    expect(isOutOfBounds({ x: -1, y: 5 }, 20)).toBe(true);
  });

  it('isOutOfBounds detects right boundary', () => {
    expect(isOutOfBounds({ x: 20, y: 5 }, 20)).toBe(true);
  });

  it('isOutOfBounds returns false for valid position', () => {
    expect(isOutOfBounds({ x: 10, y: 10 }, 20)).toBe(false);
    expect(isOutOfBounds({ x: 0, y: 0 }, 20)).toBe(false);
    expect(isOutOfBounds({ x: 19, y: 19 }, 20)).toBe(false);
  });

  it('checkSelfCollision detects collision with body', () => {
    const snake: Point[] = [
      { x: 5, y: 5 },   // head
      { x: 4, y: 5 },   // body
      { x: 3, y: 5 },   // body
      { x: 3, y: 6 },   // body
      { x: 4, y: 6 },   // body
      { x: 5, y: 6 },   // body - snake turned back
    ];
    // Head at position that collides with body segment
    expect(checkSelfCollision({ x: 4, y: 5 }, snake)).toBe(true);
    expect(checkSelfCollision({ x: 3, y: 6 }, snake)).toBe(true);
  });

  it('checkSelfCollision returns false when no collision', () => {
    const snake: Point[] = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ];
    expect(checkSelfCollision({ x: 6, y: 5 }, snake)).toBe(false);
    expect(checkSelfCollision({ x: 10, y: 10 }, snake)).toBe(false);
  });

  it('checkSelfCollision ignores head position (index 0)', () => {
    const snake: Point[] = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
    ];
    // Head position should not count as collision with itself
    expect(checkSelfCollision({ x: 5, y: 5 }, snake)).toBe(false);
  });
});

describe('Food generation', () => {
  it('generateFood creates food not on snake', () => {
    const snake: Point[] = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    
    // Run multiple times to ensure randomness doesn't place on snake
    for (let i = 0; i < 100; i++) {
      const food = generateFood(snake, 20);
      expect(pointInArray(food, snake)).toBe(false);
    }
  });

  it('generateFood returns (-1,-1) when grid is full', () => {
    // Create a snake that fills a 3x3 grid
    const snake: Point[] = [];
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        snake.push({ x, y });
      }
    }
    
    const food = generateFood(snake, 3);
    expect(food).toEqual({ x: -1, y: -1 });
  });
});

describe('Game state', () => {
  let state: GameState;
  
  beforeEach(() => {
    localStorageMock.clear();
    state = createInitialState(DEFAULT_CONFIG, 'classic');
  });

  it('createInitialState sets up correct initial state', () => {
    expect(state.snake.length).toBe(3);
    expect(state.direction).toBe(Direction.Right);
    expect(state.nextDirection).toBe(Direction.Right);
    expect(state.score).toBe(0);
    expect(state.status).toBe(GameStatus.Ready);
    expect(state.speed).toBe(DEFAULT_CONFIG.initialSpeed);
  });

  it('setDirection changes nextDirection', () => {
    state.status = GameStatus.Playing;
    setDirection(state, Direction.Up);
    expect(state.nextDirection).toBe(Direction.Up);
  });

  it('setDirection prevents 180° turns', () => {
    state.direction = Direction.Right;
    state.nextDirection = Direction.Right;
    setDirection(state, Direction.Left);
    expect(state.nextDirection).toBe(Direction.Right); // Should remain unchanged
  });

  it('setDirection allows 90° turns', () => {
    state.direction = Direction.Right;
    setDirection(state, Direction.Up);
    expect(state.nextDirection).toBe(Direction.Up);
    
    state.direction = Direction.Up;
    setDirection(state, Direction.Left);
    expect(state.nextDirection).toBe(Direction.Left);
  });

  it('togglePause switches between Playing and Paused', () => {
    state.status = GameStatus.Playing;
    togglePause(state);
    expect(state.status).toBe(GameStatus.Paused);
    
    togglePause(state);
    expect(state.status).toBe(GameStatus.Playing);
  });

  it('togglePause does nothing when not Playing or Paused', () => {
    state.status = GameStatus.Ready;
    togglePause(state);
    expect(state.status).toBe(GameStatus.Ready);
    
    state.status = GameStatus.GameOver;
    togglePause(state);
    expect(state.status).toBe(GameStatus.GameOver);
  });
});

describe('Game tick', () => {
  let state: GameState;
  
  beforeEach(() => {
    localStorageMock.clear();
    state = createInitialState(DEFAULT_CONFIG, 'classic');
    state.status = GameStatus.Playing;
  });

  it('tick moves snake forward', () => {
    const initialHead = { ...state.snake[0] };
    tick(state, DEFAULT_CONFIG);
    
    // Snake should have moved right
    expect(state.snake[0].x).toBe(initialHead.x + 1);
    expect(state.snake[0].y).toBe(initialHead.y);
  });

  it('tick applies buffered direction', () => {
    state.nextDirection = Direction.Up;
    const initialHead = { ...state.snake[0] };
    tick(state, DEFAULT_CONFIG);
    
    expect(state.snake[0].x).toBe(initialHead.x);
    expect(state.snake[0].y).toBe(initialHead.y - 1);
    expect(state.direction).toBe(Direction.Up);
  });

  it('tick maintains snake length when not eating', () => {
    const initialLength = state.snake.length;
    tick(state, DEFAULT_CONFIG);
    expect(state.snake.length).toBe(initialLength);
  });

  it('tick increases snake length and score when eating food', () => {
    // Place food directly in front of snake
    const head = state.snake[0];
    state.food = { x: head.x + 1, y: head.y };
    
    const initialLength = state.snake.length;
    const initialScore = state.score;
    
    tick(state, DEFAULT_CONFIG);
    
    expect(state.snake.length).toBe(initialLength + 1);
    expect(state.score).toBe(initialScore + 10);
  });

  it('tick increases speed when eating food', () => {
    const head = state.snake[0];
    state.food = { x: head.x + 1, y: head.y };
    
    const initialSpeed = state.speed;
    tick(state, DEFAULT_CONFIG);
    
    expect(state.speed).toBe(initialSpeed - DEFAULT_CONFIG.speedIncrement);
  });

  it('tick speed does not go below minimum', () => {
    state.speed = DEFAULT_CONFIG.minSpeed;
    const head = state.snake[0];
    state.food = { x: head.x + 1, y: head.y };
    
    tick(state, DEFAULT_CONFIG);
    
    expect(state.speed).toBe(DEFAULT_CONFIG.minSpeed);
  });

  it('tick sets GameOver on wall collision', () => {
    // Move snake to edge
    state.snake[0] = { x: DEFAULT_CONFIG.gridSize - 1, y: 10 };
    state.direction = Direction.Right;
    state.nextDirection = Direction.Right;
    
    tick(state, DEFAULT_CONFIG);
    
    expect(state.status).toBe(GameStatus.GameOver);
  });

  it('tick sets GameOver on self collision', () => {
    // Create a snake that will collide with itself
    state.snake = [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 5, y: 6 },
      { x: 4, y: 6 },
      { x: 4, y: 5 },
    ];
    state.direction = Direction.Left;
    state.nextDirection = Direction.Left;
    
    // Moving left will put head at (4, 5) which is already occupied
    tick(state, DEFAULT_CONFIG);
    
    expect(state.status).toBe(GameStatus.GameOver);
  });

  it('tick does nothing when not Playing', () => {
    state.status = GameStatus.Paused;
    const initialSnake = [...state.snake.map(p => ({ ...p }))];
    
    tick(state, DEFAULT_CONFIG);
    
    expect(state.snake).toEqual(initialSnake);
  });

  it('tick updates high score when beating it', () => {
    state.highScore = 0;
    const head = state.snake[0];
    state.food = { x: head.x + 1, y: head.y };
    
    tick(state, DEFAULT_CONFIG);
    
    expect(state.highScore).toBe(10);
  });

  it('tick does not decrease high score', () => {
    state.highScore = 100;
    const head = state.snake[0];
    state.food = { x: head.x + 1, y: head.y };
    
    tick(state, DEFAULT_CONFIG);
    
    expect(state.highScore).toBe(100);
  });
});

describe('Edge cases', () => {
  it('snake can navigate through tight spaces', () => {
    // Simulate snake navigating a U-turn
    localStorageMock.clear();
    const state = createInitialState(DEFAULT_CONFIG, 'classic');
    state.status = GameStatus.Playing;
    
    // Move in a pattern that creates a U shape
    const moves = [
      Direction.Up,
      Direction.Up,
      Direction.Left,
      Direction.Down,
      Direction.Down,
    ];
    
    for (const dir of moves) {
      setDirection(state, dir);
      const result = tick(state, DEFAULT_CONFIG);
      // Should not self-collide during normal navigation
      if (!result) break;
    }
    
    expect(state.status).toBe(GameStatus.Playing);
  });

  it('rapid direction changes are handled correctly', () => {
    localStorageMock.clear();
    const state = createInitialState(DEFAULT_CONFIG, 'classic');
    state.status = GameStatus.Playing;
    
    // Try to change direction multiple times before tick
    setDirection(state, Direction.Up);
    setDirection(state, Direction.Left); // Should override Up since no tick yet
    
    tick(state, DEFAULT_CONFIG);
    
    // Only the last valid direction should be applied
    expect(state.direction).toBe(Direction.Left);
  });
});
