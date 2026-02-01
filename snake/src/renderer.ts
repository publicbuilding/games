// Canvas rendering

import type { GameConfig, GameState, Point, Skin } from './types';

const RAINBOW_COLORS = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;
  
  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context');
    }
    this.ctx = ctx;
    this.config = config;
    
    // Set canvas size
    const size = config.gridSize * config.cellSize;
    canvas.width = size;
    canvas.height = size;
  }
  
  /**
   * Clear the canvas
   */
  clear(): void {
    const size = this.config.gridSize * this.config.cellSize;
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, size, size);
    
    // Draw subtle grid
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i <= this.config.gridSize; i++) {
      const pos = i * this.config.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, size);
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(size, pos);
      this.ctx.stroke();
    }
  }
  
  /**
   * Draw a cell at grid position
   */
  private drawCell(point: Point, color: string, isHead: boolean = false): void {
    const x = point.x * this.config.cellSize;
    const y = point.y * this.config.cellSize;
    const size = this.config.cellSize;
    const padding = 1;
    
    this.ctx.fillStyle = color;
    
    if (isHead) {
      // Draw head as rounded rectangle
      const radius = size / 4;
      this.ctx.beginPath();
      this.ctx.roundRect(x + padding, y + padding, size - padding * 2, size - padding * 2, radius);
      this.ctx.fill();
      
      // Draw eyes
      this.ctx.fillStyle = '#fff';
      const eyeSize = 3;
      const eyeOffset = 5;
      this.ctx.beginPath();
      this.ctx.arc(x + eyeOffset, y + size / 2 - 2, eyeSize, 0, Math.PI * 2);
      this.ctx.arc(x + size - eyeOffset, y + size / 2 - 2, eyeSize, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(x + eyeOffset, y + size / 2 - 2, eyeSize / 2, 0, Math.PI * 2);
      this.ctx.arc(x + size - eyeOffset, y + size / 2 - 2, eyeSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Draw body segment as slightly rounded rectangle
      const radius = size / 6;
      this.ctx.beginPath();
      this.ctx.roundRect(x + padding, y + padding, size - padding * 2, size - padding * 2, radius);
      this.ctx.fill();
    }
  }
  
  /**
   * Draw the snake
   */
  drawSnake(snake: Point[], skin: Skin): void {
    // Draw body segments (reverse order so head is on top)
    for (let i = snake.length - 1; i >= 0; i--) {
      const segment = snake[i];
      const isHead = i === 0;
      
      let color: string;
      if (isHead) {
        color = skin.headColor;
      } else if (skin.bodyColor === 'rainbow') {
        // Rainbow skin: cycle through colors
        color = RAINBOW_COLORS[i % RAINBOW_COLORS.length];
      } else {
        // Slight gradient effect on body
        const alpha = 0.7 + (0.3 * (snake.length - i) / snake.length);
        color = this.adjustBrightness(skin.bodyColor, alpha);
      }
      
      this.drawCell(segment, color, isHead);
    }
  }
  
  /**
   * Adjust color brightness
   */
  private adjustBrightness(hex: string, factor: number): string {
    // Parse hex color
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Adjust brightness
    const newR = Math.min(255, Math.round(r * factor));
    const newG = Math.min(255, Math.round(g * factor));
    const newB = Math.min(255, Math.round(b * factor));
    
    return `rgb(${newR}, ${newG}, ${newB})`;
  }
  
  /**
   * Draw the food
   */
  drawFood(food: Point): void {
    if (food.x < 0) return; // Win condition - no food
    
    const x = food.x * this.config.cellSize + this.config.cellSize / 2;
    const y = food.y * this.config.cellSize + this.config.cellSize / 2;
    const radius = this.config.cellSize / 2 - 2;
    
    // Glowing effect
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
    gradient.addColorStop(0, '#ff4444');
    gradient.addColorStop(0.5, '#ff2222');
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Main apple
    this.ctx.fillStyle = '#ff3333';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(x - 3, y - 3, radius / 3, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  /**
   * Render the full game state
   */
  render(state: GameState, skin: Skin): void {
    this.clear();
    this.drawFood(state.food);
    this.drawSnake(state.snake, skin);
  }
  
  /**
   * Draw pause indicator
   */
  drawPauseIndicator(): void {
    const size = this.config.gridSize * this.config.cellSize;
    
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, size, size);
    
    // Pause icon
    this.ctx.fillStyle = '#fff';
    const barWidth = 15;
    const barHeight = 50;
    const gap = 15;
    const startX = (size - barWidth * 2 - gap) / 2;
    const startY = (size - barHeight) / 2;
    
    this.ctx.fillRect(startX, startY, barWidth, barHeight);
    this.ctx.fillRect(startX + barWidth + gap, startY, barWidth, barHeight);
  }
}
