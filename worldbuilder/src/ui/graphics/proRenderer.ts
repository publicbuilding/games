/**
 * Professional Graphics Renderer - AAA Visual Polish
 * Integrates isometric, sprites, animations, and premium visual effects
 * Inspired by Anno 1800, StarCraft II, Sekiro
 */

import { GameState, Building, Tile, UIState, BuildingType, TileType, PopulationType } from '../../types';
import { getBuildingDef, BUILDINGS } from '../../core/buildings';
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
import { PremiumEffects } from './premiumEffects';
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

// Color palette for UI
const COLORS: Record<string, string> = {
  grass: '#4a7c23',
  grassAlt: '#5a8c33',
  water: '#3498db',
  trees: '#2d5016',
  rocks: '#7f8c8d',
  building: '#8b4513',
  buildingHover: '#a0522d',
  selected: '#f1c40f',
  premium: '#9b59b6',
  grid: 'rgba(0,0,0,0.1)',
};

const BUILDING_COLORS: Record<BuildingType, string> = {
  ricePaddy: '#8b7355',
  teaPlantation: '#6b9d3e',
  silkFarm: '#d4a5a5',
  fishingDock: '#8b6f47',
  jadeMine: '#696969',
  ironMine: '#555555',
  bambooGrove: '#7db542',
  blacksmith: '#8b4513',
  teaHouse: '#d4a5a5',
  market: '#f4c430',
  warehouse: '#9a9a9a',
  watchtower: '#696969',
  dojo: '#c41e3a',
  castle: '#8b7355',
  house: '#8b6f47',
  temple: '#c41e3a',
  inn: '#d4a5a5',
  harbor: '#8b7355',
  shipyard: '#8b6f47',
};

const BUILDING_ICONS: Record<BuildingType, string> = {
  ricePaddy: '🌾',
  teaPlantation: '🫖',
  silkFarm: '🪡',
  fishingDock: '🎣',
  jadeMine: '💎',
  ironMine: '⛏️',
  bambooGrove: '🎋',
  blacksmith: '🔨',
  teaHouse: '☕',
  market: '🏪',
  warehouse: '📦',
  watchtower: '🏯',
  dojo: '🥋',
  castle: '🏰',
  house: '🏠',
  temple: '⛩️',
  inn: '🏨',
  harbor: '⚓',
  shipyard: '🚢',
};

export class ProRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spriteGenerator: SpriteGenerator;
  private isometricRenderer: IsometricRenderer;
  private animationSystem: AnimationSystem;
  private atmosphericEffects: AtmosphericEffects;
  private waterAndNatureEffects: WaterAndNatureEffects;
  private buildingDetailsRenderer: BuildingDetailsRenderer;
  private characterPolishRenderer: CharacterPolishRenderer;
  private uiPolish: UIPolish;
  private weatherAndSeasons: WeatherAndSeasons;
  private cameraAndPostProcessing: CameraAndPostProcessing;
  private premiumEffects: PremiumEffects;
  private animationFrameCount: number = 0;
  private buildingAnimations: Map<string, string> = new Map();
  private characterAnimations: Map<string, string> = new Map();
  private showGridOverlay: boolean = false;
  private hoveredTile: { x: number; y: number } | null = null;
  private weatherState: WeatherState = { type: 'clear', intensity: 0, season: 'spring', temperature: 20 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.spriteGenerator = new SpriteGenerator();
    this.isometricRenderer = new IsometricRenderer();
    this.animationSystem = new AnimationSystem();
    this.atmosphericEffects = new AtmosphericEffects();
    this.waterAndNatureEffects = new WaterAndNatureEffects();
    this.buildingDetailsRenderer = new BuildingDetailsRenderer();
    this.characterPolishRenderer = new CharacterPolishRenderer();
    this.uiPolish = new UIPolish();
    this.weatherAndSeasons = new WeatherAndSeasons();
    this.cameraAndPostProcessing = new CameraAndPostProcessing();
    this.premiumEffects = new PremiumEffects();
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
   * Main render function with AAA visual polish
   */
  render(state: GameState, ui: UIState): void {
    this.animationFrameCount++;
    const { width, height } = this.canvas.getBoundingClientRect();
    const ctx = this.ctx;

    // Update animations and effects
    this.animationSystem.updateAnimations(16);
    this.cameraAndPostProcessing.updateCamera(16);

    // Get ambient light from atmospheric effects
    const ambientLight = this.atmosphericEffects.getAmbientLightColor(state.dayTime);
    const bgColor = `rgba(${ambientLight.r}, ${ambientLight.g}, ${ambientLight.b}, 1)`;
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Draw celestial body (sun/moon)
    this.atmosphericEffects.drawCelestialBody(ctx, width, height, state.dayTime);

    // Add sun flare during daytime
    if (state.dayTime > 0.2 && state.dayTime < 0.8) {
      const sunIntensity = Math.sin(state.dayTime * Math.PI) * 0.6;
      const sunX = width * 0.2 + (state.dayTime * 0.6) * width;
      const sunY = height * 0.2 + Math.sin(state.dayTime * Math.PI) * height * 0.15;
      this.premiumEffects.drawSunFlare(ctx, sunX, sunY, sunIntensity);
    }

    // Draw god rays
    this.atmosphericEffects.drawGodRays(ctx, width, height, state.dayTime, this.animationFrameCount);

    // Apply volumetric fog
    this.atmosphericEffects.applyVolumetricFog(ctx, width, height, state.dayTime);

    // Draw dust motes
    this.atmosphericEffects.drawDustMotes(ctx, state.dayTime, this.animationFrameCount);

    // Apply atmospheric perspective (distant haze)
    this.premiumEffects.applyAtmosphericPerspective(ctx, width, height, 0.12);

    // Apply seasonal tinting
    this.weatherAndSeasons.applySeasonalTint(ctx, this.weatherState.season, width, height);

    ctx.save();

    // Apply camera transform with easing
    const camera = this.cameraAndPostProcessing.getCameraWithShake();
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Render layers in order
    this.renderMap(state, ui);
    this.renderWaterAndNature(state, ui);
    this.renderBuildings(state, ui);
    this.renderCharacters(state, ui);
    this.renderParticles(ctx, ui);

    ctx.restore();

    // Weather effects (rain, snow, leaves)
    this.drawWeatherEffects(ctx, width, height);

    // Post-processing effects
    this.atmosphericEffects.applyAmbientOcclusion(ctx, width, height, 0.25); // Slightly stronger AO
    
    // Enhanced vignette for cinematic feel
    const vignetteStrength = 0.35 + Math.sin(state.dayTime * Math.PI) * 0.1;
    this.cameraAndPostProcessing.applyVignette(ctx, width, height, vignetteStrength);
    
    // Subtle depth of field
    this.cameraAndPostProcessing.applyDepthOfField(ctx, width, height, 0.15);

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
   * Render water and nature effects (before buildings for proper layering)
   */
  private renderWaterAndNature(state: GameState, ui: UIState): void {
    const ctx = this.ctx;

    // Draw water reflections and ripples
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        const tile = state.map[y][x];
        if (tile.type === 'river') {
          const pos = this.isometricRenderer.gridToIsometric(tile.x, tile.y, 0);
          this.waterAndNatureEffects.drawWaterWithReflections(
            ctx,
            pos.screenX,
            pos.screenY,
            48,
            24,
            this.animationFrameCount
          );
        }
      }
    }

    // Draw seasonal effects
    if (this.weatherState.season === 'spring') {
      this.waterAndNatureEffects.drawCherryBlossoms(
        ctx,
        this.canvas.getBoundingClientRect().width,
        this.canvas.getBoundingClientRect().height,
        'spring',
        this.animationFrameCount
      );
    }

    // Draw fireflies at night
    this.waterAndNatureEffects.drawFireflies(
      ctx,
      this.canvas.getBoundingClientRect().width,
      this.canvas.getBoundingClientRect().height,
      state.dayTime,
      this.animationFrameCount
    );

    // Draw birds
    this.waterAndNatureEffects.drawBirds(
      ctx,
      this.canvas.getBoundingClientRect().width,
      this.canvas.getBoundingClientRect().height,
      this.animationFrameCount
    );
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

    // Draw dynamic shadow based on time of day
    this.atmosphericEffects.drawDynamicShadow(ctx, pos.screenX, pos.screenY, 20, buildingHeight, state.dayTime);

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

    // Draw building details (roof tiles, lanterns, etc.)
    this.buildingDetailsRenderer.drawRoofTiles(
      ctx,
      pos.screenX,
      pos.screenY,
      20,
      buildingHeight * 0.6,
      palette.roof
    );

    // Draw window glow at night
    this.buildingDetailsRenderer.drawWindowGlow(
      ctx,
      pos.screenX,
      pos.screenY,
      20,
      buildingHeight,
      state.dayTime
    );

    // Add light bloom to glowing windows
    const nightness = (state.dayTime > 0.75 || state.dayTime < 0.25) ? 1 - Math.abs(state.dayTime - (state.dayTime < 0.5 ? 0 : 1)) : 0;
    if (nightness > 0.3) {
      // Window glow bloom positions
      const windowPositions = [
        { x: -buildingHeight / 3, y: -buildingHeight / 3 },
        { x: 0, y: -buildingHeight / 3 },
        { x: buildingHeight / 3, y: -buildingHeight / 3 },
      ];
      for (const windowPos of windowPositions) {
        this.premiumEffects.drawLightBloom(
          ctx,
          pos.screenX + windowPos.x,
          pos.screenY + windowPos.y,
          15,
          nightness * 0.5,
          'rgba(255, 200, 100, '
        );
      }
    }

    // Draw hanging lanterns on larger buildings
    if (buildingHeight > 25) {
      const lanternPositions = [
        { x: -8, y: -5 },
        { x: 8, y: -5 },
        { x: -10, y: 5 },
        { x: 10, y: 5 },
      ];
      this.buildingDetailsRenderer.drawHangingLanterns(
        ctx,
        pos.screenX,
        pos.screenY,
        lanternPositions,
        state.dayTime,
        this.animationFrameCount
      );

      // Add light bloom to lanterns at night
      if (state.dayTime > 0.7 || state.dayTime < 0.3) {
        for (const lanternPos of lanternPositions) {
          const lanternScreenX = pos.screenX + lanternPos.x;
          const lanternScreenY = pos.screenY + lanternPos.y;
          this.premiumEffects.drawLightBloom(
            ctx,
            lanternScreenX,
            lanternScreenY,
            25,
            0.6,
            'rgba(255, 180, 80, '
          );
        }
      }
    }

    // Draw stone foundation
    this.buildingDetailsRenderer.drawStoneFoundation(ctx, pos.screenX, pos.screenY + buildingHeight * 0.5, 20);

    // Add construction progress indicator
    if (building.constructionProgress !== undefined && building.constructionProgress < 1) {
      const progress = Math.floor(building.constructionProgress * 100);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${progress}%`, pos.screenX, pos.screenY - 40);

      // Draw construction scaffolding
      this.buildingDetailsRenderer.drawConstructionScaffolding(
        ctx,
        pos.screenX,
        pos.screenY,
        20,
        buildingHeight,
        building.constructionProgress
      );

      // Emit construction dust
      if (Math.random() < 0.08) {
        this.animationSystem.emitDust(pos.screenX, pos.screenY - 15, 4, 'rgba(180, 160, 140, 0.5)');
      }
    }

    // Add working indicator (enhanced smoke physics)
    if (def.production && building.constructionProgress === undefined) {
      if (this.animationFrameCount % 25 === 0) {
        // Emit smoke with better physics
        for (let i = 0; i < 2; i++) {
          const offsetX = (Math.random() - 0.5) * 4;
          const offsetY = Math.random() * -3;
          this.animationSystem.emitSmoke(
            pos.screenX + offsetX,
            pos.screenY - 20 + offsetY,
            3,
            'rgba(220, 220, 220, 0.6)'
          );
        }
      }

      // Draw chimney with smoke
      this.buildingDetailsRenderer.drawChimneyWithSmoke(
        ctx,
        pos.screenX + 8,
        pos.screenY - buildingHeight * 0.3,
        this.animationFrameCount
      );
    }

    // Draw building icon/indicator
    ctx.fillStyle = palette.secondary;
    ctx.font = 'bold 12px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.getBuildingSymbol(building.type), pos.screenX, pos.screenY - 5);

    // Draw decorative flags on castle/temple
    if ((building.type === 'castle' || building.type === 'temple' || building.type === 'dojo') && buildingHeight > 28) {
      const flagPositions = [
        { x: -12, y: -buildingHeight * 0.4, size: 'large' as const },
        { x: 12, y: -buildingHeight * 0.35, size: 'small' as const },
      ];
      this.buildingDetailsRenderer.drawFlags(
        ctx,
        pos.screenX,
        pos.screenY,
        flagPositions,
        this.animationFrameCount
      );
    }

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

    // Draw Sekiro-inspired background panel with paper texture
    const panelHeight = 110;
    this.uiPolish.drawPanelWithBrushBorder(
      ctx,
      { x: 0, y: 0, width: width, height: panelHeight },
      'rgba(245, 237, 220, 0.85)',
      '#1a1a1a'
    );
    
    // Alternative: Semi-transparent background for UI elements (expanded for settlement level)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, panelHeight);

    // Settlement level and progress bar
    this.renderSettlementLevelBar(state, ctx, width);

    // Resources with enhanced styling
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const resources = [
      { icon: '🌾', label: 'Rice', value: Math.floor(state.resources.rice), color: '#d4a574' },
      { icon: '🫖', label: 'Tea', value: Math.floor(state.resources.tea), color: '#6b9d3e' },
      { icon: '🪡', label: 'Silk', value: Math.floor(state.resources.silk), color: '#d4a5a5' },
      { icon: '💎', label: 'Jade', value: Math.floor(state.resources.jade), color: '#696969' },
      { icon: '⛏️', label: 'Iron', value: Math.floor(state.resources.iron), color: '#555555' },
      { icon: '🎋', label: 'Bamboo', value: Math.floor(state.resources.bamboo), color: '#7db542' },
      { icon: '💰', label: 'Gold', value: Math.floor(state.resources.gold), color: '#ffd700' },
    ];

    let x = 10;
    for (const res of resources) {
      // Draw resource box with color accent
      ctx.fillStyle = `${res.color}40`; // Transparent tint
      ctx.fillRect(x, 48, 110, 20);
      
      ctx.strokeStyle = res.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, 48, 110, 20);
      
      // Resource text
      ctx.fillStyle = '#1a1a1a';
      ctx.fillText(`${res.icon} ${res.value}`, x + 5, 53);
      x += 115;
      if (x > width - 100) break; // Don't overflow
    }

    // Population info with styled display
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText(`👥 Population: ${state.population}/${state.maxPopulation}`, 10, 78);

    // Render notifications
    this.renderNotifications(ctx, width, height);

    // Render celebration screen effects (flash overlay)
    celebrationSystem.renderScreenEffects(ctx, width, height);

    // Zoom level and Seed display
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`🔍 ${(ui.zoom * 100).toFixed(0)}%`, width - 10, height - 10);

    // Display map seed for sharing
    if (state.mapSeed !== undefined) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Seed: ${state.mapSeed.toString(16).toUpperCase()}`, width - 10, height - 26);
    }

    // Help text for grid toggle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Press G for grid`, width - 10, height - 40);

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

    // Render building palette for placement
    this.renderBuildingPalette(state, ui, width, height);
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

    // Draw panel with brush border
    ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
    ctx.fillRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
    
    // Sekiro-style border
    this.uiPolish.drawBrushStrokeBorder(ctx, miniMapX, miniMapY, miniMapSize, miniMapSize, 'rgba(100, 150, 255, 0.8)', 1.5);
    
    // Label
    ctx.fillStyle = 'rgba(100, 150, 255, 0.8)';
    ctx.font = 'bold 10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('MAP', miniMapX + miniMapSize / 2, miniMapY - 8);

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

  private renderBuildingPalette(
    state: GameState,
    ui: UIState,
    width: number,
    height: number
  ): void {
    const ctx = this.ctx;
    const paletteHeight = 100;
    const y = height - paletteHeight;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, y, width, paletteHeight);

    // Building buttons
    const buildingTypes = Object.keys(BUILDINGS) as BuildingType[];
    const btnSize = 60;
    const spacing = 10;
    const totalWidth = buildingTypes.length * (btnSize + spacing);
    let startX = (width - totalWidth) / 2;

    // Scroll if too many buildings
    if (totalWidth > width - 40) {
      startX = 20;
    }

    buildingTypes.forEach((type, i) => {
      const def = BUILDINGS[type];
      const x = startX + i * (btnSize + spacing);
      const btnY = y + 10;

      // Button background
      const isSelected = ui.selectedBuilding === type;
      const canBuild = this.canAffordQuick(state, type);

      ctx.fillStyle = isSelected 
        ? COLORS.selected 
        : (canBuild ? BUILDING_COLORS[type] : '#444');
      ctx.fillRect(x, btnY, btnSize, btnSize);

      // Border
      ctx.strokeStyle = def.premium ? COLORS.premium : (isSelected ? '#fff' : '#666');
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.strokeRect(x, btnY, btnSize, btnSize);

      // Icon
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(BUILDING_ICONS[type], x + btnSize / 2, btnY + btnSize / 2 - 5);

      // Cost hint
      const mainCost = Object.entries(def.cost)[0];
      if (mainCost) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = canBuild ? '#fff' : '#888';
        ctx.fillText(`${mainCost[1]}g`, x + btnSize / 2, btnY + btnSize - 8);
      }

      // Premium badge
      if (def.premium) {
        ctx.fillStyle = COLORS.premium;
        ctx.font = '10px sans-serif';
        ctx.fillText('⭐', x + btnSize - 10, btnY + 10);
      }
    });

    // Instructions
    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      ui.selectedBuilding 
        ? 'Click map to place | Right-click to cancel | Shift+click to demolish'
        : 'Select a building below | Scroll to zoom | Drag to pan',
      width / 2,
      y + 85
    );
  }

  private canAffordQuick(state: GameState, type: BuildingType): boolean {
    const def = BUILDINGS[type];
    for (const [resource, amount] of Object.entries(def.cost)) {
      if ((state.resources[resource as keyof typeof state.resources] ?? 0) < (amount ?? 0)) {
        return false;
      }
    }
    if (def.premium && state.premiumCurrency < 50) return false;
    return true;
  }
}
