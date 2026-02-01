/**
 * Isometric Renderer - Converts 2D game coordinates to isometric 3D perspective
 * Implements proper depth sorting, shadows, and 3D effects
 */

export interface IsometricPos {
  screenX: number;
  screenY: number;
}

export interface RenderLayer {
  depth: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export class IsometricRenderer {
  private tileWidth: number = 64;  // Width of isometric tile
  private tileHeight: number = 32; // Height of isometric tile (half width for isometric)
  private layers: RenderLayer[] = [];
  private zMultiplier: number = 1.5; // Height multiplier for elevation

  /**
   * Convert 2D grid coordinates to isometric screen coordinates
   */
  gridToIsometric(gridX: number, gridY: number, elevation: number = 0): IsometricPos {
    // Standard isometric projection
    const screenX = (gridX - gridY) * (this.tileWidth / 2);
    const screenY = (gridX + gridY) * (this.tileHeight / 2) - elevation * this.zMultiplier;

    return { screenX, screenY };
  }

  /**
   * Convert screen coordinates back to grid (useful for mouse picking)
   */
  isometricToGrid(screenX: number, screenY: number): { gridX: number; gridY: number } {
    const x = screenX / (this.tileWidth / 2);
    const y = (screenY / (this.tileHeight / 2));
    
    const gridX = (x + y) / 2;
    const gridY = (y - x) / 2;

    return { gridX: Math.round(gridX), gridY: Math.round(gridY) };
  }

  /**
   * Add a render layer with automatic depth sorting
   */
  addLayer(depth: number, draw: (ctx: CanvasRenderingContext2D) => void): void {
    this.layers.push({ depth, draw });
    // Sort by depth (back to front)
    this.layers.sort((a, b) => a.depth - b.depth);
  }

  /**
   * Clear all layers
   */
  clearLayers(): void {
    this.layers = [];
  }

  /**
   * Render all layers in order
   */
  renderLayers(ctx: CanvasRenderingContext2D): void {
    for (const layer of this.layers) {
      layer.draw(ctx);
    }
  }

  /**
   * Calculate depth value for proper layering (grid-based)
   * Lower y and x = rendered first (background)
   */
  calculateGridDepth(gridX: number, gridY: number, elevation: number = 0, layer: number = 0): number {
    // Combine grid coordinates and elevation for proper sorting
    // Y is primary (rows back to front), X is secondary (left to right)
    return gridY * 1000 + gridX * 100 + elevation * 10 + layer;
  }

  /**
   * Draw an isometric tile
   */
  drawIsometricTile(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    color: string,
    borderColor?: string,
    borderWidth: number = 1
  ): void {
    const w = this.tileWidth;
    const h = this.tileHeight;

    // Isometric diamond shape
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - h); // Top
    ctx.lineTo(screenX + w / 2, screenY); // Right
    ctx.lineTo(screenX, screenY + h); // Bottom
    ctx.lineTo(screenX - w / 2, screenY); // Left
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    if (borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.stroke();
    }
  }

  /**
   * Draw an isometric building with 3D perspective
   */
  drawIsometricBuilding(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    width: number,
    height: number,
    roofColor: string,
    wallColor: string,
    shadowColor: string = 'rgba(0,0,0,0.3)'
  ): void {
    const shadowOffset = 3;

    // Shadow underneath
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.moveTo(screenX - this.tileWidth / 2, screenY + this.tileHeight);
    ctx.lineTo(screenX, screenY + this.tileHeight + shadowOffset);
    ctx.lineTo(screenX + this.tileWidth / 2, screenY + this.tileHeight);
    ctx.closePath();
    ctx.fill();

    // Building base (walls - left side)
    ctx.fillStyle = this.darkenColor(wallColor, 0.8);
    ctx.beginPath();
    ctx.moveTo(screenX - this.tileWidth / 2, screenY); // Left point
    ctx.lineTo(screenX - this.tileWidth / 2, screenY - height); // Top left
    ctx.lineTo(screenX, screenY - height - this.tileHeight / 2); // Inner left top
    ctx.lineTo(screenX, screenY); // Inner bottom
    ctx.closePath();
    ctx.fill();

    // Building right side (walls)
    ctx.fillStyle = wallColor;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY); // Bottom center
    ctx.lineTo(screenX, screenY - height - this.tileHeight / 2); // Top center inner
    ctx.lineTo(screenX + this.tileWidth / 2, screenY - height); // Top right
    ctx.lineTo(screenX + this.tileWidth / 2, screenY); // Right bottom
    ctx.closePath();
    ctx.fill();

    // Roof (isometric top)
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(screenX - this.tileWidth / 2, screenY - height); // Left
    ctx.lineTo(screenX, screenY - height - this.tileHeight / 2); // Top
    ctx.lineTo(screenX + this.tileWidth / 2, screenY - height); // Right
    ctx.lineTo(screenX, screenY - height + this.tileHeight / 2); // Bottom
    ctx.closePath();
    ctx.fill();

    // Roof highlight for dimension
    ctx.fillStyle = this.lightenColor(roofColor, 0.2);
    ctx.beginPath();
    ctx.moveTo(screenX - this.tileWidth / 4, screenY - height - this.tileHeight / 4);
    ctx.lineTo(screenX, screenY - height - this.tileHeight / 2);
    ctx.lineTo(screenX + this.tileWidth / 8, screenY - height - this.tileHeight / 4);
    ctx.lineTo(screenX - this.tileWidth / 8, screenY - height);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw water with wave animation
   */
  drawWater(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    animationPhase: number
  ): void {
    const waveAmplitude = 2;
    const waveFreq = animationPhase * 0.1;

    // Base water
    ctx.fillStyle = '#4a90e2';
    this.drawIsometricTile(ctx, screenX, screenY, '#4a90e2', '#3498db', 1);

    // Wave effect
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    const w = this.tileWidth;
    const h = this.tileHeight;

    // Animate wave pattern
    const waveX = Math.sin(waveFreq) * waveAmplitude;
    ctx.moveTo(screenX - w / 4 + waveX, screenY - h / 4);
    ctx.quadraticCurveTo(screenX, screenY - h / 2 + waveX, screenX + w / 4 + waveX, screenY - h / 4);
    ctx.stroke();

    // Reflection effect
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(screenX - w / 4, screenY);
    ctx.quadraticCurveTo(screenX, screenY + h / 4, screenX + w / 4, screenY);
    ctx.stroke();
  }

  /**
   * Draw a person/character
   */
  drawCharacter(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    skinColor: string,
    clothColor: string,
    direction: number = 0 // 0=down, 1=right, 2=up, 3=left
  ): void {
    const scale = 0.6; // Scale relative to tile
    const w = this.tileWidth * scale;
    const h = this.tileHeight * scale;

    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(screenX, screenY - h / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = clothColor;
    ctx.fillRect(screenX - 3, screenY - h / 2 + 4, 6, 8);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(screenX - 4, screenY + h / 2 - 1, 8, 2);
  }

  /**
   * Draw a tree with layered canopy
   */
  drawTree(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    trunkColor: string,
    foliageColor: string,
    animationPhase: number = 0
  ): void {
    // Trunk
    ctx.fillStyle = trunkColor;
    ctx.fillRect(screenX - 2, screenY - 8, 4, 12);

    // Foliage - layers for depth
    const sway = Math.sin(animationPhase * 0.05) * 2;

    // Back canopy (darker)
    ctx.fillStyle = this.darkenColor(foliageColor, 0.8);
    ctx.beginPath();
    ctx.ellipse(screenX - 6 + sway, screenY - 8, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Front canopy (lighter)
    ctx.fillStyle = foliageColor;
    ctx.beginPath();
    ctx.ellipse(screenX + 2 + sway, screenY - 6, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = this.lightenColor(foliageColor, 0.3);
    ctx.beginPath();
    ctx.ellipse(screenX + 1 + sway, screenY - 10, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw a mountain with snow cap and shadow
   */
  drawMountain(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    baseColor: string,
    snowColor: string = '#fff'
  ): void {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.moveTo(screenX - this.tileWidth / 2, screenY + this.tileHeight);
    ctx.lineTo(screenX + this.tileWidth / 2, screenY + this.tileHeight);
    ctx.lineTo(screenX, screenY + 8);
    ctx.closePath();
    ctx.fill();

    // Mountain body
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(screenX - this.tileWidth / 2, screenY);
    ctx.lineTo(screenX, screenY - this.tileHeight * 1.5);
    ctx.lineTo(screenX + this.tileWidth / 2, screenY);
    ctx.closePath();
    ctx.fill();

    // Snow cap
    ctx.fillStyle = snowColor;
    ctx.beginPath();
    ctx.moveTo(screenX - this.tileWidth / 6, screenY - this.tileHeight * 1.2);
    ctx.lineTo(screenX, screenY - this.tileHeight * 1.5);
    ctx.lineTo(screenX + this.tileWidth / 6, screenY - this.tileHeight * 1.2);
    ctx.closePath();
    ctx.fill();

    // Rocky texture
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX - this.tileWidth / 4, screenY - this.tileHeight * 0.8);
    ctx.lineTo(screenX + this.tileWidth / 4, screenY - this.tileHeight * 0.8);
    ctx.stroke();
  }

  /**
   * Color utilities
   */
  private darkenColor(color: string, factor: number): string {
    // Convert hex to darker
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.floor(((num >> 16) & 255) * factor);
    const g = Math.floor(((num >> 8) & 255) * factor);
    const b = Math.floor((num & 255) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private lightenColor(color: string, factor: number): string {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.floor(((num >> 16) & 255) + factor * 255));
    const g = Math.min(255, Math.floor(((num >> 8) & 255) + factor * 255));
    const b = Math.min(255, Math.floor((num & 255) + factor * 255));
    return `rgb(${r}, ${g}, ${b})`;
  }
}
