/**
 * Professional Graphics Renderer - AAA Visual Polish
 * Integrates isometric, sprites, animations, and premium visual effects
 * Inspired by Anno 1800, StarCraft II, Sekiro
 */

import { GameState, Building, Tile, UIState, BuildingType, TileType, PopulationType } from '../../types';
import { getBuildingDef } from '../../core/buildings';
import { getMapDimensions } from '../../core/gameState';
import { SpriteGenerator } from './spriteGenerator';
import { IsometricRenderer } from './isometricRenderer';
import { AnimationSystem } from './animationSystem';
import { AtmosphericEffects } from './atmosphericEffects';
import { WaterAndNatureEffects } from './waterAndNatureEffects';
import { BuildingDetailsRenderer } from './buildingDetailsRenderer';
import { CharacterPolishRenderer, type CharacterType } from './characterPolishRenderer';
import { UIPolish } from './uiPolish';
import { WeatherAndSeasons, type WeatherState } from './weatherAndSeasons';
import { CameraAndPostProcessing } from './cameraAndPostProcessing';
import { getCurrentSettlementLevel, getLevelProgress, SETTLEMENT_LEVELS } from '../../core/progression';
import { floatingNumberSystem } from '../feedback/floatingNumbers';
import { celebrationSystem } from '../feedback/celebrations';
import { activityIndicatorSystem } from '../feedback/activityIndicators';
import { notificationSystem } from '../feedback/notifications';

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
  private showGridOverlay: boolean = false;
  private hoveredTile: { x: number; y: number } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.spriteGenerator = new SpriteGenerator();
    this.isometricRenderer = new IsometricRenderer();
    this.animationSystem = new AnimationSystem();
    this.setupCanvas();
    window.addEventListener('resize', () => this.setupCanvas());
    
    // Toggle grid with 'G' key
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'g') {
        this.showGridOverlay = !this.showGridOverlay;
      }
    });
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
        const isVisible = state.visibilityGrid?.[y]?.[x] ?? false;
        
        // Skip fog of war tiles for now - render them with overlay
        this.renderTile(ctx, tile, state, isVisible);
      }
    }
  }

  /**
   * Render a single terrain tile
   */
  private renderTile(ctx: CanvasRenderingContext2D, tile: Tile, state: GameState, isVisible: boolean = true): void {
    const pos = this.isometricRenderer.gridToIsometric(tile.x, tile.y, 0);
    const palette = TERRAIN_PALETTE[tile.type];
    const isAlt = (tile.x + tile.y) % 2 === 0;
    const color = isAlt ? palette.primary : palette.secondary;

    // Render terrain normally if visible or in starting area
    if (isVisible || tile.isStartingArea) {
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

      // Highlight starting area with subtle glow
      if (tile.isStartingArea) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.15)';
        ctx.beginPath();
        ctx.moveTo(pos.screenX, pos.screenY - 24);
        ctx.lineTo(pos.screenX + 24, pos.screenY);
        ctx.lineTo(pos.screenX, pos.screenY + 24);
        ctx.lineTo(pos.screenX - 24, pos.screenY);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Fog of war - show as dark unexplored area
      ctx.fillStyle = 'rgba(30, 30, 40, 0.7)';
      ctx.beginPath();
      ctx.moveTo(pos.screenX, pos.screenY - 24);
      ctx.lineTo(pos.screenX + 24, pos.screenY);
      ctx.lineTo(pos.screenX, pos.screenY + 24);
      ctx.lineTo(pos.screenX - 24, pos.screenY);
      ctx.closePath();
      ctx.fill();
    }

    // Draw grid overlay if enabled
    if (this.showGridOverlay && isVisible) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pos.screenX, pos.screenY - 24);
      ctx.lineTo(pos.screenX + 24, pos.screenY);
      ctx.lineTo(pos.screenX, pos.screenY + 24);
      ctx.lineTo(pos.screenX - 24, pos.screenY);
      ctx.closePath();
      ctx.stroke();
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
    
    // Render floating numbers
    floatingNumberSystem.render(ctx, ui.cameraX, ui.cameraY, ui.zoom);
    
    // Render celebration particles
    celebrationSystem.render(ctx, ui.cameraX, ui.cameraY, ui.zoom);
  }

  /**
   * Render UI overlay (resources, buttons, etc.)
   */
  private renderUI(state: GameState, ui: UIState, width: number, height: number): void {
    const ctx = this.ctx;

    // Semi-transparent background for UI elements (expanded for settlement level)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, 105);

    // Settlement level and progress bar
    this.renderSettlementLevelBar(state, ctx, width);

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
      ctx.fillText(`${res.icon} ${res.value}`, x, 50);
      x += 120;
      if (x > width - 100) break; // Don't overflow
    }

    // Population info
    ctx.fillText(`👥 Pop: ${state.population}/${state.maxPopulation}`, 10, 72);

    // Render notifications
    this.renderNotifications(ctx, width, height);

    // Render celebration screen effects (flash overlay)
    celebrationSystem.renderScreenEffects(ctx, width, height);

    // Zoom level
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`🔍 ${(ui.zoom * 100).toFixed(0)}%`, width - 10, height - 10);

    // Help text for grid toggle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Press G for grid`, width - 10, height - 25);

    // Render mini-map
    this.renderMiniMap(state, ui, width, height);

    // Render tooltip for hovered tile
    if (this.hoveredTile && (state.visibilityGrid?.[this.hoveredTile.y]?.[this.hoveredTile.x] ?? false)) {
      const tile = state.map[this.hoveredTile.y]?.[this.hoveredTile.x];
      if (tile) {
        const tooltipText = `${tile.type.toUpperCase()} (${tile.x}, ${tile.y})${
          tile.resourceAmount ? ` - Resources: ${Math.round(tile.resourceAmount)}` : ''
        }`;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(10, height - 40, 200, 30);
        ctx.fillStyle = '#fff';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(tooltipText, 15, height - 35);
      }
    }
  }

  /**
   * Render settlement level and progress bar
   */
  private renderSettlementLevelBar(state: GameState, ctx: CanvasRenderingContext2D, width: number): void {
    const currentLevel = getCurrentSettlementLevel(state);
    const levelDef = SETTLEMENT_LEVELS[currentLevel];
    const progress = getLevelProgress(state);

    // Settlement level title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`⭐ Level ${currentLevel}: ${levelDef.name}`, 10, 3);

    // Progress bar background
    const barX = 10;
    const barY = 20;
    const barWidth = Math.min(400, width - 150);
    const barHeight = 10;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress bar border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    if (progress.nextLevel) {
      // Calculate overall progress (average of all three metrics)
      const overallProgress = (
        progress.populationProgress +
        progress.buildingDiversityProgress +
        progress.goldProductionProgress
      ) / 3;

      // Progress bar fill
      ctx.fillStyle = overallProgress > 0.5 ? '#2ecc71' : '#e67e22';
      ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * overallProgress, barHeight - 2);

      // Requirements text - show what's missing
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      
      let requirementText = `Next: `;
      const reqs = [];
      if (progress.populationMissing > 0) reqs.push(`${progress.populationMissing} pop`);
      if (progress.buildingsMissing > 0) reqs.push(`${progress.buildingsMissing} types`);
      if (progress.goldMissing > 0) reqs.push(`${progress.goldMissing.toFixed(1)}g/m`);
      
      requirementText += reqs.length > 0 ? reqs.join(' | ') : 'Ready to advance!';
      ctx.fillText(requirementText, barX + barWidth + 10, barY);
    } else {
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(barX + 1, barY + 1, barWidth - 2, barHeight - 2);
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText('🏆 Maximum Level!', barX + barWidth + 10, barY);
    }
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

  /**
   * Set hovered tile for tooltip display
   */
  setHoveredTile(x: number, y: number): void {
    this.hoveredTile = { x, y };
  }

  /**
   * Clear hovered tile
   */
  clearHoveredTile(): void {
    this.hoveredTile = null;
  }

  /**
   * Get tile size for external calculations
   */
  getTileSize(): number {
    return TILE_SIZE_ISO;
  }

  /**
   * Render mini-map in corner
   */
  private renderMiniMap(state: GameState, ui: UIState, width: number, height: number): void {
    const ctx = this.ctx;
    const miniMapSize = 120;
    const miniMapX = width - miniMapSize - 10;
    const miniMapY = 70;

    const mapWidth = state.map[0]?.length || 40;
    const mapHeight = state.map.length || 30;
    const tileSize = miniMapSize / Math.max(mapWidth, mapHeight);

    // Background
    ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.fillRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
    ctx.strokeRect(miniMapX, miniMapY, miniMapSize, miniMapSize);

    // Draw explored areas
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const isExplored = state.visibilityGrid?.[y]?.[x] ?? false;
        const px = miniMapX + x * tileSize;
        const py = miniMapY + y * tileSize;

        if (isExplored) {
          // Color by terrain
          const tile = state.map[y][x];
          const terrainColors: Record<TileType, string> = {
            plains: '#d4a574',
            river: '#4a90e2',
            bamboo: '#7db542',
            mountain: '#8b8680',
            forest: '#2d5016',
          };
          ctx.fillStyle = terrainColors[tile.type];
          ctx.fillRect(px, py, tileSize, tileSize);
        } else {
          // Fog of war
          ctx.fillStyle = 'rgba(50, 50, 70, 0.6)';
          ctx.fillRect(px, py, tileSize, tileSize);
        }

        // Show buildings as dots
        const tile = state.map[y][x];
        if (tile.building && isExplored) {
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(px + tileSize / 2, py + tileSize / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw camera viewport indicator
    const cameraLeft = ui.cameraX / (mapWidth * 48);
    const cameraTop = ui.cameraY / (mapHeight * 48);
    const cameraWidth = width / ui.zoom / (mapWidth * 48);
    const cameraHeight = height / ui.zoom / (mapHeight * 48);

    ctx.strokeStyle = 'rgba(255, 255, 100, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      miniMapX + cameraLeft * miniMapSize,
      miniMapY + cameraTop * miniMapSize,
      cameraWidth * miniMapSize,
      cameraHeight * miniMapSize
    );

    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MAP', miniMapX + 5, miniMapY - 5);
  }

  /**
   * Render notifications with enhanced styling
   */
  private renderNotifications(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const activeNotifications = notificationSystem.getActive();
    let yOffset = 120;

    for (const notif of activeNotifications) {
      // Color based on type
      const colors: Record<string, { bg: string; text: string; border: string }> = {
        info: { bg: 'rgba(30, 90, 160, 0.9)', text: '#fff', border: '#1e5aa0' },
        success: { bg: 'rgba(40, 130, 60, 0.9)', text: '#fff', border: '#28823c' },
        warning: { bg: 'rgba(180, 100, 30, 0.9)', text: '#fff', border: '#b46400' },
        important: { bg: 'rgba(200, 50, 50, 0.9)', text: '#fff', border: '#c83232' },
      };

      const color = colors[notif.type] || colors.info;
      const notifWidth = 300;
      const notifHeight = 50;
      const notifX = width / 2 - notifWidth / 2;
      const notifY = yOffset;

      // Background with border
      ctx.fillStyle = color.bg;
      ctx.fillRect(notifX, notifY, notifWidth, notifHeight);
      ctx.strokeStyle = color.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(notifX, notifY, notifWidth, notifHeight);

      // Text
      ctx.fillStyle = color.text;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(notif.message, width / 2, notifY + notifHeight / 2);

      // Close hint for important notifications
      if (notif.requiresClick) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText('(click to dismiss)', width / 2, notifY + notifHeight - 8);
      }

      yOffset += notifHeight + 10;
    }

    // Add click handler for dismissing notifications
    if (activeNotifications.length > 0) {
      this.canvas.addEventListener('click', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check if click is within any notification bounds
        let yOffset = 120;
        for (const notif of activeNotifications) {
          const notifWidth = 300;
          const notifHeight = 50;
          const notifX = width / 2 - notifWidth / 2;
          const notifY = yOffset;

          if (
            clickX >= notifX &&
            clickX <= notifX + notifWidth &&
            clickY >= notifY &&
            clickY <= notifY + notifHeight
          ) {
            if (notif.requiresClick) {
              notificationSystem.dismiss(notif.id);
            }
            break;
          }

          yOffset += notifHeight + 10;
        }
      }, { once: true });
    }
  }
}
