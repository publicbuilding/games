// Main game entry point

import { Controls } from './controls';
import {
  createInitialState,
  DEFAULT_CONFIG,
  setDirection,
  tick,
  togglePause,
} from './game-state';
import { Renderer } from './renderer';
import { SkinManager } from './skins';
import { Direction, GameState, GameStatus } from './types';

class SnakeGame {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private state: GameState;
  private skinManager: SkinManager;
  // Controls instance sets up event listeners on construction, kept for potential cleanup
  private readonly controls: Controls;
  private gameLoop: number | null = null;
  private lastTick: number = 0;
  
  // UI elements
  private overlay: HTMLElement;
  private overlayTitle: HTMLElement;
  private overlayMessage: HTMLElement;
  private finalScore: HTMLElement;
  private startBtn: HTMLElement;
  private skinsBtn: HTMLElement;
  private skinSelector: HTMLElement;
  private scoreDisplay: HTMLElement;
  private highScoreDisplay: HTMLElement;
  
  constructor() {
    // Get canvas
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }
    
    // Initialize skin manager
    this.skinManager = new SkinManager();
    
    // Initialize renderer
    this.renderer = new Renderer(this.canvas, DEFAULT_CONFIG);
    
    // Create initial state
    this.state = createInitialState(DEFAULT_CONFIG, this.skinManager.getSelectedSkinId());
    
    // Get UI elements
    this.overlay = document.getElementById('overlay')!;
    this.overlayTitle = document.getElementById('overlay-title')!;
    this.overlayMessage = document.getElementById('overlay-message')!;
    this.finalScore = document.getElementById('final-score')!;
    this.startBtn = document.getElementById('start-btn')!;
    this.skinsBtn = document.getElementById('skins-btn')!;
    this.skinSelector = document.getElementById('skin-selector')!;
    this.scoreDisplay = document.getElementById('score')!;
    this.highScoreDisplay = document.getElementById('high-score')!;
    
    // Initialize controls
    const gameContainer = document.getElementById('game-container')!;
    this._controls = new Controls(
      gameContainer,
      (direction) => this.handleDirection(direction),
      () => this.handlePause()
    );
    
    // Setup UI handlers
    this.setupUI();
    
    // Initial render
    this.updateUI();
    this.render();
  }
  
  private setupUI(): void {
    this.startBtn.addEventListener('click', () => this.startGame());
    this.skinsBtn.addEventListener('click', () => this.toggleSkinSelector());
    
    // Build skin selector
    this.buildSkinSelector();
  }
  
  private buildSkinSelector(): void {
    // Clear existing options (keep the label)
    const label = this.skinSelector.querySelector('p');
    this.skinSelector.innerHTML = '';
    if (label) this.skinSelector.appendChild(label);
    
    const skins = this.skinManager.getSkins();
    const selectedId = this.skinManager.getSelectedSkinId();
    
    for (const skin of skins) {
      const option = document.createElement('div');
      option.className = 'skin-option';
      option.style.background = skin.bodyColor === 'rainbow' 
        ? 'linear-gradient(135deg, red, orange, yellow, green, blue, purple)'
        : skin.bodyColor;
      option.title = skin.unlocked 
        ? skin.name 
        : `${skin.name} - ${skin.unlockCondition}`;
      
      if (!skin.unlocked) {
        option.classList.add('locked');
      }
      
      if (skin.id === selectedId) {
        option.classList.add('selected');
      }
      
      option.addEventListener('click', () => {
        if (skin.unlocked) {
          this.skinManager.selectSkin(skin.id);
          this.state.selectedSkinId = skin.id;
          this.buildSkinSelector(); // Refresh to show selection
          this.render();
        } else {
          // Show unlock condition
          alert(`${skin.name}\nUnlock: ${skin.unlockCondition}`);
        }
      });
      
      this.skinSelector.appendChild(option);
    }
  }
  
  private toggleSkinSelector(): void {
    const isVisible = this.skinSelector.style.display !== 'none';
    this.skinSelector.style.display = isVisible ? 'none' : 'flex';
    this.skinsBtn.textContent = isVisible ? 'Choose Skin' : 'Hide Skins';
    this.buildSkinSelector(); // Refresh unlocked status
  }
  
  private handleDirection(direction: Direction): void {
    if (this.state.status === GameStatus.Playing) {
      setDirection(this.state, direction);
    }
  }
  
  private handlePause(): void {
    if (this.state.status === GameStatus.Playing || this.state.status === GameStatus.Paused) {
      togglePause(this.state);
      this.updateUI();
      
      if (this.state.status === GameStatus.Paused) {
        this.renderer.drawPauseIndicator();
      }
    }
  }
  
  private startGame(): void {
    // Reset state
    this.state = createInitialState(DEFAULT_CONFIG, this.skinManager.getSelectedSkinId());
    this.state.status = GameStatus.Playing;
    
    // Hide overlay
    this.overlay.classList.add('hidden');
    
    // Update UI
    this.updateUI();
    
    // Start game loop
    this.lastTick = performance.now();
    this.gameLoop = requestAnimationFrame((t) => this.loop(t));
  }
  
  private stopGame(): void {
    if (this.gameLoop !== null) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }
  }
  
  private loop(timestamp: number): void {
    // Check if game is still active
    if (this.state.status !== GameStatus.Playing) {
      if (this.state.status === GameStatus.Paused) {
        // Keep the loop running to resume
        this.gameLoop = requestAnimationFrame((t) => this.loop(t));
      } else {
        this.showGameOver();
      }
      return;
    }
    
    // Check if enough time has passed for next tick
    const elapsed = timestamp - this.lastTick;
    
    if (elapsed >= this.state.speed) {
      this.lastTick = timestamp;
      
      // Process game tick (may change game status)
      const gameEnded = !tick(this.state, DEFAULT_CONFIG);
      
      // Update score display
      this.updateUI();
      
      // Check for game over
      if (gameEnded) {
        this.showGameOver();
        return;
      }
    }
    
    // Render
    this.render();
    
    // Continue loop
    this.gameLoop = requestAnimationFrame((t) => this.loop(t));
  }
  
  private render(): void {
    const skin = this.skinManager.getSelectedSkin();
    this.renderer.render(this.state, skin);
    
    if (this.state.status === GameStatus.Paused) {
      this.renderer.drawPauseIndicator();
    }
  }
  
  private updateUI(): void {
    this.scoreDisplay.textContent = this.state.score.toString();
    this.highScoreDisplay.textContent = this.state.highScore.toString();
  }
  
  private showGameOver(): void {
    this.stopGame();
    
    // Check for skin unlocks
    const newUnlocks = this.skinManager.checkUnlocks(this.state.highScore);
    
    // Check if player won (filled entire grid)
    // Win = snake length equals grid size squared
    const isWin = this.state.snake.length >= DEFAULT_CONFIG.gridSize * DEFAULT_CONFIG.gridSize;
    
    // Update overlay
    this.overlayTitle.textContent = isWin ? '🎉 You Win!' : 'Game Over';
    this.overlayMessage.textContent = isWin 
      ? 'Amazing! You filled the entire grid!'
      : (this.state.score > this.state.highScore 
        ? '🏆 New High Score!' 
        : 'Try again!');
    this.finalScore.style.display = 'block';
    this.finalScore.textContent = `Score: ${this.state.score}`;
    this.startBtn.textContent = 'Play Again';
    
    // Show unlock notification
    if (newUnlocks.length > 0) {
      const unlockedSkins = newUnlocks
        .map(id => this.skinManager.getSkinById(id)?.name || id)
        .join(', ');
      setTimeout(() => {
        alert(`🎉 New skin${newUnlocks.length > 1 ? 's' : ''} unlocked: ${unlockedSkins}!`);
      }, 100);
    }
    
    // Show overlay
    this.overlay.classList.remove('hidden');
    
    // Refresh skin selector to show new unlocks
    this.buildSkinSelector();
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SnakeGame();
});
