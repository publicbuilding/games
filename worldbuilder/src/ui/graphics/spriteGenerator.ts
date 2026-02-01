/**
 * Sprite Generator - Creates pixel art sprites for buildings, characters, and resources
 * Generates sprite sheets and manages sprite rendering
 */

export type SpriteType = 'building' | 'character' | 'resource' | 'terrain' | 'effect';

export interface SpriteSheet {
  name: string;
  canvas: OffscreenCanvas;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  animationFrameTime?: number; // ms per frame
}

export class SpriteGenerator {
  private spriteCache: Map<string, SpriteSheet> = new Map();
  private pixelSize = 2; // Size of each pixel for scaling

  /**
   * Generate a building sprite sheet
   */
  generateBuildingSprite(
    buildingType: string,
    color: string,
    accentColor: string,
    width: number = 48,
    height: number = 64
  ): SpriteSheet {
    const cacheKey = `building_${buildingType}_${color}_${accentColor}`;
    if (this.spriteCache.has(cacheKey)) {
      return this.spriteCache.get(cacheKey)!;
    }

    const canvas = new OffscreenCanvas(width, height * 4); // 4 frames: idle, building, working, upgrade
    const ctx = canvas.getContext('2d')!;

    // Frame 0: Idle
    this.drawBuildingFrame(ctx, 0, 0, width, height, color, accentColor, 'idle');

    // Frame 1: Building (under construction)
    this.drawBuildingFrame(ctx, 0, height, width, height, color, accentColor, 'construction');

    // Frame 2: Working
    this.drawBuildingFrame(ctx, 0, height * 2, width, height, color, accentColor, 'working');

    // Frame 3: Idle variant
    this.drawBuildingFrame(ctx, 0, height * 3, width, height, color, accentColor, 'idle2');

    const sprite: SpriteSheet = {
      name: cacheKey,
      canvas,
      frameWidth: width,
      frameHeight: height,
      frameCount: 4,
      animationFrameTime: 300,
    };

    this.spriteCache.set(cacheKey, sprite);
    return sprite;
  }

  private drawBuildingFrame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    accentColor: string,
    state: 'idle' | 'construction' | 'working' | 'idle2'
  ): void {
    const p = this.pixelSize;
    const w = width / p;
    const h = height / p;

    // Draw base structure with 3D perspective
    this.fillPixels(ctx, x, y, w - 4, 2, color, p); // Top edge
    this.fillPixels(ctx, x, y, 2, h - 4, color, p); // Left edge
    this.fillPixels(ctx, x + w - 2, y, 2, h - 4, color, p); // Right edge

    // Building sides for 3D effect
    this.fillPixels(ctx, x + 2, y + 2, w - 4, h - 6, color, p); // Main body

    // Roof
    const roofY = y;
    this.fillPixels(ctx, x + 4, roofY, w - 8, 3, accentColor, p);

    // Door/window
    const doorX = x + (w / 2 - 2);
    const doorY = y + h - 8;
    this.fillPixels(ctx, doorX, doorY, 4, 4, '#333', p);
    this.fillPixels(ctx, doorX + 1, doorY + 1, 2, 2, '#aaa', p);

    // State-specific details
    if (state === 'construction') {
      // Scaffolding effect
      this.fillPixels(ctx, x + 3, y + 6, 1, h - 10, '#666', p);
      this.fillPixels(ctx, x + w - 5, y + 6, 1, h - 10, '#666', p);
    } else if (state === 'working') {
      // Smoke effect
      this.fillPixels(ctx, x + (w / 2 - 2), y + 2, 2, 2, '#aaa', p);
      this.fillPixels(ctx, x + (w / 2 - 1), y, 1, 1, '#ddd', p);
    }

    // Shadow underneath
    this.fillPixels(ctx, x + 2, y + h - 2, w - 4, 2, 'rgba(0,0,0,0.3)', p);
  }

  /**
   * Generate character sprite sheet with walking animation
   */
  generateCharacterSprite(
    popType: string,
    skinColor: string,
    clothColor: string,
    width: number = 32,
    height: number = 48
  ): SpriteSheet {
    const cacheKey = `char_${popType}_${skinColor}_${clothColor}`;
    if (this.spriteCache.has(cacheKey)) {
      return this.spriteCache.get(cacheKey)!;
    }

    // 8 frames for walking animation (4 directions x 2 phases)
    const canvas = new OffscreenCanvas(width * 8, height);
    const ctx = canvas.getContext('2d')!;

    const directions = ['down', 'right', 'up', 'left'] as const;
    let frameIdx = 0;

    for (const dir of directions) {
      // Frame 0: Standing
      this.drawCharacterFrame(
        ctx,
        frameIdx * width,
        0,
        width,
        height,
        skinColor,
        clothColor,
        popType,
        dir,
        0
      );
      frameIdx++;

      // Frame 1: Walking
      this.drawCharacterFrame(
        ctx,
        frameIdx * width,
        0,
        width,
        height,
        skinColor,
        clothColor,
        popType,
        dir,
        1
      );
      frameIdx++;
    }

    const sprite: SpriteSheet = {
      name: cacheKey,
      canvas,
      frameWidth: width,
      frameHeight: height,
      frameCount: 8,
      animationFrameTime: 200,
    };

    this.spriteCache.set(cacheKey, sprite);
    return sprite;
  }

  private drawCharacterFrame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    skinColor: string,
    clothColor: string,
    popType: string,
    direction: 'down' | 'right' | 'up' | 'left',
    walkPhase: number
  ): void {
    const p = this.pixelSize;
    const w = width / p;
    const h = height / p;

    const bodyY = y + h * 0.3;
    const legOffset = walkPhase === 0 ? 0 : 1;

    // Head
    this.fillPixels(ctx, x + w / 2 - 2, y, 4, 4, skinColor, p);

    // Body (clothing)
    this.fillPixels(ctx, x + w / 2 - 2, bodyY, 4, 4, clothColor, p);

    // Arms
    this.fillPixels(ctx, x + w / 2 - 5, bodyY + 1, 2, 3, skinColor, p);
    this.fillPixels(ctx, x + w / 2 + 3, bodyY + 1, 2, 3, skinColor, p);

    // Legs with walking animation
    const leg1Y = bodyY + 4 + legOffset;
    const leg2Y = bodyY + 4 + (1 - legOffset);
    this.fillPixels(ctx, x + w / 2 - 2, leg1Y, 2, 2, '#333', p);
    this.fillPixels(ctx, x + w / 2, leg2Y, 2, 2, '#333', p);

    // Pop type specific details
    if (popType === 'farmer') {
      // Straw hat
      this.fillPixels(ctx, x + w / 2 - 3, y - 1, 6, 1, '#c9a961', p);
    } else if (popType === 'merchant') {
      // Turban/hat
      this.fillPixels(ctx, x + w / 2 - 2, y - 1, 4, 1, '#8b0000', p);
    } else if (popType === 'warrior') {
      // Helmet
      this.fillPixels(ctx, x + w / 2 - 2, y - 1, 4, 2, '#666', p);
      this.fillPixels(ctx, x + w / 2 - 3, y, 1, 1, '#888', p);
      this.fillPixels(ctx, x + w / 2 + 2, y, 1, 1, '#888', p);
    } else if (popType === 'monk') {
      // Robes - fuller silhouette
      this.fillPixels(ctx, x + w / 2 - 3, bodyY, 6, 5, clothColor, p);
    } else if (popType === 'fisherman') {
      // Hat and fishing rod
      this.fillPixels(ctx, x + w / 2 - 2, y - 1, 4, 1, '#8b4513', p);
      this.fillPixels(ctx, x + w / 2 + 4, y + 1, 1, 3, '#666', p);
    }
  }

  /**
   * Generate resource sprite sheets
   */
  generateResourceSprite(resourceType: string, colors: string[]): SpriteSheet {
    const cacheKey = `resource_${resourceType}_${colors.join('_')}`;
    if (this.spriteCache.has(cacheKey)) {
      return this.spriteCache.get(cacheKey)!;
    }

    const width = 32;
    const height = 32;
    const canvas = new OffscreenCanvas(width * 2, height); // 2 frames for animation
    const ctx = canvas.getContext('2d')!;

    // Frame 0: Normal
    this.drawResourceFrame(ctx, 0, 0, width, height, resourceType, colors, 0);

    // Frame 1: Animated
    this.drawResourceFrame(ctx, width, 0, width, height, resourceType, colors, 1);

    const sprite: SpriteSheet = {
      name: cacheKey,
      canvas,
      frameWidth: width,
      frameHeight: height,
      frameCount: 2,
      animationFrameTime: 400,
    };

    this.spriteCache.set(cacheKey, sprite);
    return sprite;
  }

  private drawResourceFrame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    resourceType: string,
    colors: string[],
    frame: number
  ): void {
    const p = this.pixelSize;
    const w = width / p;
    const h = height / p;

    const primaryColor = colors[0];
    const secondaryColor = colors[1] || primaryColor;

    switch (resourceType) {
      case 'rice':
        // Rice paddy field with water and shoots
        this.fillPixels(ctx, x, y, w, h, '#4a90e2', p); // Water
        // Green shoots
        for (let i = 0; i < 4; i++) {
          this.fillPixels(ctx, x + i * 8, y + 10, 1, 6, '#7db542', p);
        }
        break;

      case 'tea':
        // Tea bushes
        this.fillPixels(ctx, x + 2, y + 8, 6, 8, '#7db542', p); // Main bush
        this.fillPixels(ctx, x + 10, y + 10, 5, 6, '#96d646', p); // Lighter bush
        break;

      case 'bamboo':
        // Bamboo stalks
        for (let i = 0; i < 3; i++) {
          this.fillPixels(ctx, x + 4 + i * 6, y, 2, h, '#7db542', p);
          this.fillPixels(ctx, x + 5 + i * 6, y + 4 + frame * 2, 1, 3, '#96d646', p); // Leaves
        }
        break;

      case 'jade':
        // Jade rocks with colored veins
        this.fillPixels(ctx, x + 2, y + 4, 8, 8, '#4a90e2', p); // Stone
        this.fillPixels(ctx, x + 3, y + 5, 6, 6, '#5ba3f5', p); // Jade color
        this.fillPixels(ctx, x + 5, y + 7, 4, 2, '#6ba3f5', p); // Vein highlight
        break;

      case 'iron':
        // Iron ore
        this.fillPixels(ctx, x + 2, y + 4, 8, 8, '#696969', p); // Dark iron
        this.fillPixels(ctx, x + 4, y + 6, 4, 4, '#a9a9a9', p); // Ore sparkle
        break;

      case 'silk':
        // Silk rolls/fabric
        this.fillPixels(ctx, x + 4, y + 6, 8, 4, '#d4a5a5', p);
        this.fillPixels(ctx, x + 5, y + 7, 6, 2, '#e0b8b8', p); // Highlight
        break;

      case 'gold':
        // Gold coins
        this.fillPixels(ctx, x + 4, y + 8, 8, 2, '#f4c430', p);
        this.fillPixels(ctx, x + 6, y + 6, 4, 2, '#ffd700', p); // Coin highlight
        break;
    }
  }

  /**
   * Utility to fill a rectangular area with pixels
   */
  private fillPixels(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    pixelSize: number
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * pixelSize, h * pixelSize);
  }

  /**
   * Get a cached sprite or generate if not exists
   */
  getSprite(key: string): SpriteSheet | null {
    return this.spriteCache.get(key) || null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.spriteCache.clear();
  }
}
