// Input handling: keyboard and touch controls

import { Direction } from './types';

export type DirectionCallback = (direction: Direction) => void;
export type PauseCallback = () => void;

const SWIPE_THRESHOLD = 30; // Minimum swipe distance in pixels

export class Controls {
  private onDirection: DirectionCallback;
  private onPause: PauseCallback;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private gameContainer: HTMLElement;
  
  constructor(
    gameContainer: HTMLElement,
    onDirection: DirectionCallback,
    onPause: PauseCallback
  ) {
    this.gameContainer = gameContainer;
    this.onDirection = onDirection;
    this.onPause = onPause;
    
    this.setupKeyboardControls();
    this.setupTouchControls();
  }
  
  private setupKeyboardControls(): void {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          this.onDirection(Direction.Up);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          this.onDirection(Direction.Down);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          this.onDirection(Direction.Left);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          this.onDirection(Direction.Right);
          break;
        case ' ':
        case 'Escape':
        case 'p':
        case 'P':
          e.preventDefault();
          this.onPause();
          break;
      }
    });
  }
  
  private setupTouchControls(): void {
    // Prevent default touch behaviors (scrolling, zooming)
    this.gameContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
      }
    }, { passive: false });
    
    this.gameContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
    
    this.gameContainer.addEventListener('touchend', (e) => {
      e.preventDefault();
      
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const deltaTime = Date.now() - this.touchStartTime;
        
        // Check if it's a tap (short time, minimal movement)
        if (deltaTime < 200 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
          this.onPause();
          return;
        }
        
        // Check if it's a swipe
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        if (Math.max(absX, absY) < SWIPE_THRESHOLD) {
          // Not a significant swipe
          return;
        }
        
        // Determine swipe direction
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            this.onDirection(Direction.Right);
          } else {
            this.onDirection(Direction.Left);
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            this.onDirection(Direction.Down);
          } else {
            this.onDirection(Direction.Up);
          }
        }
      }
    }, { passive: false });
  }
  
  /**
   * Cleanup event listeners (if needed)
   */
  destroy(): void {
    // In a full implementation, we'd remove event listeners here
    // For this game, we don't need to since it runs for the lifetime of the page
  }
}
