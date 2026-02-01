/**
 * Floating Number Popup System
 * Displays '+3 Rice', '+5 Gold' etc that float up and fade away
 */

export interface FloatingNumber {
  id: string;
  x: number;
  y: number;
  text: string;
  life: number; // 0-1, starts at 1
  maxLife: number;
  color: string;
  fontSize: number;
  isImportant?: boolean; // Larger/longer for important events
}

let floatingNumberIdCounter = 0;

export class FloatingNumberSystem {
  private floatingNumbers: FloatingNumber[] = [];

  /**
   * Add a floating number popup
   */
  add(
    x: number,
    y: number,
    text: string,
    color: string = '#fff',
    isImportant: boolean = false
  ): FloatingNumber {
    const floatingNumber: FloatingNumber = {
      id: `float_${floatingNumberIdCounter++}`,
      x,
      y,
      text,
      life: 1,
      maxLife: isImportant ? 1500 : 1000, // Important numbers stay longer
      color,
      fontSize: isImportant ? 24 : 16,
      isImportant,
    };

    this.floatingNumbers.push(floatingNumber);
    return floatingNumber;
  }

  /**
   * Add resource production popup
   */
  addResourceProduction(x: number, y: number, resource: string, amount: number): void {
    const text = `+${Math.round(amount)} ${resource}`;
    
    // Color by resource type
    const colors: Record<string, string> = {
      rice: '#f4d03f',      // Golden yellow
      tea: '#82c91e',       // Green
      silk: '#ff8fab',      // Pink
      jade: '#15aabf',      // Cyan
      iron: '#748087',      // Gray
      bamboo: '#51cf66',    // Bright green
      gold: '#ffd700',      // Shiny gold
    };

    const color = colors[resource] || '#fff';
    this.add(x, y, text, color, amount >= 10);
  }

  /**
   * Add population growth popup
   */
  addPopulationGrowth(x: number, y: number, amount: number): void {
    const text = `+${Math.round(amount)} 👤`;
    this.add(x, y, text, '#a6e3a1', true);
  }

  /**
   * Add achievement/milestone popup
   */
  addMilestone(x: number, y: number, text: string): void {
    this.add(x, y, text, '#ffd700', true);
  }

  /**
   * Add error/negative popup
   */
  addError(x: number, y: number, text: string): void {
    this.add(x, y, text, '#ff6b6b', false);
  }

  /**
   * Update floating numbers
   */
  update(deltaTime: number): void {
    this.floatingNumbers = this.floatingNumbers.filter(fn => {
      fn.life -= deltaTime / fn.maxLife;
      fn.y -= 1; // Float upward
      return fn.life > 0;
    });
  }

  /**
   * Get all floating numbers
   */
  getFloatingNumbers(): FloatingNumber[] {
    return this.floatingNumbers;
  }

  /**
   * Clear all floating numbers
   */
  clear(): void {
    this.floatingNumbers = [];
  }

  /**
   * Render floating numbers to canvas
   */
  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, zoom: number): void {
    for (const fn of this.floatingNumbers) {
      const screenX = (fn.x - cameraX) * zoom;
      const screenY = (fn.y - cameraY) * zoom;

      ctx.save();
      ctx.globalAlpha = fn.life;
      ctx.fillStyle = fn.color;
      ctx.font = `bold ${fn.fontSize * zoom}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Apply a slight scale animation (scale up then down)
      const scale = 1 + (1 - fn.life) * 0.3; // Grows as it fades
      ctx.translate(screenX, screenY);
      ctx.scale(scale, scale);
      ctx.translate(-screenX, -screenY);

      ctx.fillText(fn.text, screenX, screenY);
      ctx.restore();
    }
  }
}

export const floatingNumberSystem = new FloatingNumberSystem();
