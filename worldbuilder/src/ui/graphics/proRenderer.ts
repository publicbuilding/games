/**
 * Professional Graphics Renderer - Integrates isometric, sprites, and animations
 * Main rendering engine for the worldbuilder game
 */

import { GameState, Building, Tile, UIState, BuildingType, TileType, PopulationType } from '../../types';
import { getBuildingDef } from '../../core/buildings';
import { getMapDimensions } from '../../core/gameState';
import { SpriteGenerator } from './spriteGenerator';
import { IsometricRenderer } from './isometricRenderer';
import { AnimationSystem } from './animationSystem';

const TILE_SIZE_ISO = 48; // Size for isometric rendering

/**
 * Building color palette
 */
const BUILDING_PALETTE: Record<BuildingType, { primary: string; secondary: string; roof: string }> = {
  ricePaddy: { primary: '#8b7355', secondary: '#a0826d', roof: '#a67c52' },
  teaPlantation: { primary: '#6b9d3e', secondary: '#7db542', roof: '#5a8c33' },
  silkFarm: { primary: '#d4a5a5', secondary: '#e0b8b8', roof: '#c4957f' },
  fishingDock: { primary: '#8b6f47', secondary: '#a0826d', roof: '#6b5d48' },
  jadeMine: { primary: '#696969', secondary: '#7f8c8d', roof: '#556b7f' },
  ironMine: { primary: '#555555', secondary: '#696969', roof: '#3a4650' },
  bambooGrove: { primary: '#7db542', secondary: '#96d646', roof: '#5a8c33' },
  blacksmith: { primary: '#8b4513', secondary: '#a0522d', roof: '#654321' },
  teaHouse: { primary: '#d4a5a5', secondary: '#e0b8b8', roof: '#8b4513' },
  market: { primary: '#f4c430', secondary: '#ffd700', roof: '#daa520' },
  warehouse: { primary: '#9a9a9a', secondary: '#b0b0b0', roof: '#7a7a7a' },
  watchtower: { primary: '#696969', secondary: '#7f8c8d', roof: '#556b7f' },
  dojo: { primary: '#c41e3a', secondary: '#d63447', roof: '#8b1a27' },
  castle: { primary: '#8b7355', secondary: '#a0826d', roof: '#696969' },
  house: { primary: '#8b6f47', secondary: '#a0826d', roof: '#654321' },
  temple: { primary: '#c41e3a', secondary: '#d63447', roof: '#8b0000' },
  inn: { primary: '#d4a5a5', secondary: '#e0b8b8', roof: '#8b4513' },
  harbor: { primary: '#8b7355', secondary: '#a0826d', roof: '#6b5d48' },
  shipyard: { primary: '#8b6f47', secondary: '#a0826d', roof: '#654321' },
};

/**
 * Population type colors
 */
const POPULATION_COLORS: Record<PopulationType, { skin: string; clothes: string }> = {
  farmer: { skin: '#d4a574', clothes: '#8b7d6b' },
  merchant: { skin: '#d4a574', clothes: '#8b0000' },
  warrior: { skin: '#d4a574', clothes: '#696969' },
  monk: { skin: '#d4a574', clothes: '#c0c0c0' },
  fisherman: { skin: '#d4a574', clothes: '#4a7c23' },
};

/**
 * Terrain color palette
 */
const TERRAIN_PALETTE: Record<TileType, { primary: string; secondary: string }> = {
  plains: { primary: '#d4a574', secondary: '#c9935f' },
  river: { primary: '#4a90e2', secondary: '#3498db' },
  bamboo: { primary: '#7db542', secondary: '#96d646' },
  mountain: { primary: '#8b8680', secondary: '#a39a93' },
  forest: { primary: '#2d5016', secondary: '#4a7c23' },
};

export class ProRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spriteGenerator: SpriteGenerator;
  private isometricRenderer: IsometricRenderer;
  private animationSystem: AnimationSystem;
  private animationFrameCount: number = 0;
  private buildingAnimations: Map<string, string> = new Map(); // Map building ID to animation ID
  private characterAnimations: Map<string, string> = new Map(); // Map character to animation

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.spriteGenerator = new SpriteGenerator();
    this.isometricRenderer = new IsometricRenderer();
    this.animationSystem = new AnimationSystem();
    this.setupCanvas();
    window.addEventListener('resize', () => this.setupCanvas());
  }

  private setupCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  /**
   * Main render function
   */
  render(state: GameState, ui: UIState): void {
    this.animationFrameCount++;
    const { width, height } = this.canvas.getBoundingClientRect();
    const ctx = this.ctx;

    // Update animations
    this.animationSystem.updateAnimations(16); // Assume 60fps (16ms per frame)

    // Clear canvas with gradient background (day/night cycle)
    const dayBrightness = Math.sin(state.dayTime * Math.PI) * 0.15 + 0.3;
    const bgColor = `rgba(${40 + dayBrightness * 30}, ${40 + dayBrightness * 30}, ${50 + dayBrightness * 50}, 1)`;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    // Apply camera transform
    ctx.translate(width / 2, height / 2);
    ctx.scale(ui.zoom, ui.zoom);
    ctx.translate(-ui.cameraX, -ui.cameraY);

    // Render layers in order
    this.renderMap(state, ui);
    this.renderBuildings(state, ui);
    this.renderCharacters(state, ui);
    this.renderParticles(ctx, ui);

    ctx.restore();

    // Render UI overlay
    this.renderUI(state, ui, width, height);
  }

  /**
   * Render map terrain
   */
  private renderMap(state: GameState, ui: UIState): void {
    const ctx = this.ctx;
    const { width, height } = getMapDimensions();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = state.map[y][x];
        this.renderTile(ctx, tile, state);
      }
    }
  }

  /**
   * Render a single terrain tile
   */
  private renderTile(ctx: CanvasRenderingContext2D, tile: Tile, state: GameState): void {
    const pos = this.isometricRenderer.gridToIsometric(tile.x, tile.y, 0);
    const palette = TERRAIN_PALETTE[tile.type];
    const isAlt = (tile.x + tile.y) % 2 === 0;
    const color = isAlt ? palette.primary : palette.secondary;

    if (tile.type === 'river') {
      // Animated water
      this.isometricRenderer.drawWater(ctx, pos.screenX, pos.screenY, this.animationFrameCount);
    } else if (tile.type === 'mountain') {
      // Mountains with elevation
      this.isometricRenderer.drawMountain(ctx, pos.screenX, pos.screenY, color, '#e8e8e8');
    } else if (tile.type === 'forest') {
      // Tile base
      this.isometricRenderer.drawIsometricTile(ctx, pos.screenX, pos.screenY, color, palette.secondary, 0.5);
      // Trees
      this.isometricRenderer.drawTree(ctx, pos.screenX, pos.screenY - 10, '#654321', palette.primary, this.animationFrameCount);
    } else if (tile.type === 'bamboo') {
      // Tile base
      this.isometricRenderer.drawIsometricTile(ctx, pos.screenX, pos.screenY, color, palette.secondary, 0.5);
      // Bamboo stalks
      ctx.fillStyle = palette.primary;
      ctx.fillRect(pos.screenX - 6, pos.screenY - 12, 2, 14);
      ctx.fillRect(pos.screenX, pos.screenY - 12, 2, 14);
      ctx.fillRect(pos.screenX + 6, pos.screenY - 12, 2, 14);
    } else {
      // Standard terrain tile
      this.isometricRenderer.drawIsometricTile(ctx, pos.screenX, pos.screenY, color, palette.secondary, 0.5);
    }
  }

  /**
   * Render buildings
   */
  private renderBuildings(state: GameState, ui: UIState): void {
    const ctx = this.ctx;

    // Sort buildings by depth for proper layering
    const sortedBuildings = [...state.buildings].sort((a, b) => {
      const depthA = this.isometricRenderer.calculateGridDepth(a.x, a.y, 0, 1);
      const depthB = this.isometricRenderer.calculateGridDepth(b.x, b.y, 0, 1);
      return depthA - depthB;
    });

    for (const building of sortedBuildings) {
      this.renderBuilding(ctx, building, state);
    }
  }

  /**
   * Render a single building
   */
  private renderBuilding(ctx: CanvasRenderingContext2D, building: Building, state: GameState): void {
    const pos = this.isometricRenderer.gridToIsometric(building.x, building.y, 0);
    const palette = BUILDING_PALETTE[building.type];
    const def = getBuildingDef(building.type);
    const buildingHeight = 30 + Math.random() * 10; // Vary heights slightly

    // Draw building with 3D effect
    this.isometricRenderer.drawIsometricBuilding(
      ctx,
      pos.screenX,
      pos.screenY,
      20,
      buildingHeight,
      palette.roof,
      palette.primary
    );

    // Add construction progress indicator
    if (building.constructionProgress !== undefined && building.constructionProgress < 1) {
      const progress = Math.floor(building.constructionProgress * 100);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${progress}%`, pos.screenX, pos.screenY - 40);

      // Emit construction dust
      if (Math.random() < 0.05) {
        this.animationSystem.emitDust(pos.screenX, pos.screenY - 15, 3, 'rgba(180, 160, 140, 0.4)');
      }
    }

    // Add working indicator (smoke)
    if (def.production && (this.animationFrameCount % 30 === 0)) {
      this.animationSystem.emitSmoke(pos.screenX, pos.screenY - 20, 2, 'rgba(200, 200, 200, 0.5)');
    }

    // Draw building icon/indicator
    ctx.fillStyle = palette.secondary;
    ctx.font = 'bold 12px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.getBuildingSymbol(building.type), pos.screenX, pos.screenY - 5);

    // Worker count indicator
    if (def.workers > 0) {
      const hasWorkers = building.workers > 0;
      ctx.fillStyle = hasWorkers ? '#2ecc71' : '#e74c3c';
      ctx.beginPath();
      ctx.arc(pos.screenX + 20, pos.screenY - 25, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '8px sans-serif';
      ctx.fillText(building.workers.toString(), pos.screenX + 20, pos.screenY - 25);
    }
  }

  /**
   * Render characters/population
   */
  private renderCharacters(state: GameState, ui: UIState): void {
    const ctx = this.ctx;

    // Distribute characters around buildings and paths
    for (let i = 0; i < Math.min(state.workers, 20); i++) {
      const building = state.buildings[i % state.buildings.length];
      if (!building) continue;

      const offset = (i * 0.7 + this.animationFrameCount * 0.01) % 1;
      const angle = Math.sin(offset * Math.PI * 2) * 20;
      const distance = 25 + Math.cos(offset * Math.PI * 2) * 10;

      const pos = this.isometricRenderer.gridToIsometric(
        building.x + angle / 48,
        building.y + distance / 48,
        0
      );

      // Determine population type
      const popTypes: PopulationType[] = ['farmer', 'merchant', 'warrior', 'monk', 'fisherman'];
      const popType = popTypes[i % popTypes.length];
      const colors = POPULATION_COLORS[popType];

      // Draw character
      this.isometricRenderer.drawCharacter(ctx, pos.screenX, pos.screenY, colors.skin, colors.clothes, i % 4);
    }
  }

  /**
   * Render particle effects
   */
  private renderParticles(ctx: CanvasRenderingContext2D, ui: UIState): void {
    this.animationSystem.updateParticles(16);
    this.animationSystem.renderParticles(ctx, ui.cameraX, ui.cameraY, ui.zoom);
  }

  /**
   * Render UI overlay (resources, buttons, etc.)
   */
  private renderUI(state: GameState, ui: UIState, width: number, height: number): void {
    const ctx = this.ctx;

    // Semi-transparent background for UI elements
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, 60);

    // Resources
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const resources = [
      { icon: '🌾', label: 'Rice', value: Math.floor(state.resources.rice) },
      { icon: '🫖', label: 'Tea', value: Math.floor(state.resources.tea) },
      { icon: '🪡', label: 'Silk', value: Math.floor(state.resources.silk) },
      { icon: '💎', label: 'Jade', value: Math.floor(state.resources.jade) },
      { icon: '🔨', label: 'Iron', value: Math.floor(state.resources.iron) },
      { icon: '🎋', label: 'Bamboo', value: Math.floor(state.resources.bamboo) },
      { icon: '💰', label: 'Gold', value: Math.floor(state.resources.gold) },
    ];

    let x = 10;
    for (const res of resources) {
      ctx.fillText(`${res.icon} ${res.value}`, x, 20);
      x += 120;
      if (x > width - 100) break; // Don't overflow
    }

    // Population info
    ctx.fillText(`👥 Pop: ${state.population}/${state.maxPopulation}`, 10, 42);

    // Notifications
    if (ui.notification) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(width / 2 - 150, 80, 300, 40);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ui.notification, width / 2, 100);
    }

    // Zoom level
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`🔍 ${(ui.zoom * 100).toFixed(0)}%`, width - 10, height - 10);
  }

  /**
   * Get building symbol for display
   */
  private getBuildingSymbol(buildingType: BuildingType): string {
    const symbols: Record<BuildingType, string> = {
      ricePaddy: '🌾',
      teaPlantation: '🫖',
      silkFarm: '🪡',
      fishingDock: '🎣',
      jadeMine: '⛏️',
      ironMine: '⛏️',
      bambooGrove: '🎋',
      blacksmith: '🔨',
      teaHouse: '🏯',
      market: '🏪',
      warehouse: '📦',
      watchtower: '🗼',
      dojo: '🥋',
      castle: '🏰',
      house: '🏠',
      temple: '⛩️',
      inn: '🏨',
      harbor: '⚓',
      shipyard: '⛵',
    };
    return symbols[buildingType] || '⬜';
  }

  /**
   * Get animation system (for external particle effects)
   */
  getAnimationSystem(): AnimationSystem {
    return this.animationSystem;
  }

  /**
   * Get sprite generator (for creating custom sprites)
   */
  getSpriteGenerator(): SpriteGenerator {
    return this.spriteGenerator;
  }

  /**
   * Get isometric renderer (for custom drawing)
   */
  getIsometricRenderer(): IsometricRenderer {
    return this.isometricRenderer;
  }
}
