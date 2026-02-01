import { GameState, Tile, Building, UIState, BuildingType, TileType, Particle } from '../types';
import { getBuildingDef, BUILDINGS } from '../core/buildings';
import { getMapDimensions } from '../core/gameState';

const TILE_SIZE = 48;

/**
 * Asian-themed color palette inspired by East Asian art
 * Muted, natural tones with accent colors for temples and important buildings
 */
const COLORS = {
  // Terrain colors
  plains: '#d4a574', // Tan earth
  plainsAlt: '#c9935f', // Darker tan
  river: '#4a90e2', // Blue water
  riverLight: '#6ba3f5', // Lighter blue for animation
  bamboo: '#7db542', // Green bamboo
  bambooLight: '#96d646', // Light green for animation
  forest: '#2d5016', // Dark forest green
  forestLight: '#4a7c23', // Lighter forest green
  mountain: '#8b8680', // Stone/mountain gray
  mountainLight: '#a39a93', // Light mountain
  
  // Building colors
  buildingWood: '#8b6f47', // Wood brown
  buildingSilk: '#d4a5a5', // Silk pink/beige
  buildingStone: '#9a9a9a', // Gray stone
  buildingGold: '#f4c430', // Gold
  buildingRed: '#c41e3a', // Traditional red for temples/dojos
  buildingBlue: '#4a90e2', // Blue for official buildings
  
  // UI and effects
  grid: 'rgba(0,0,0,0.05)',
  text: '#2c2c2c',
  textLight: '#f5f5f5',
  selected: '#f1c40f',
  positive: '#2ecc71',
  negative: '#e74c3c',
  shadow: 'rgba(0,0,0,0.3)',
  highlight: 'rgba(255,255,255,0.2)',
};

// Building color mappings
const BUILDING_COLORS: Record<BuildingType, string> = {
  ricePaddy: '#d4a574',
  teaPlantation: '#7db542',
  silkFarm: '#d4a5a5',
  jadeMine: '#4a90e2',
  blacksmith: '#696969',
  house: '#8b6f47',
  temple: '#c41e3a',
  market: '#f4c430',
  warehouse: '#9a9a9a',
  dojo: '#c41e3a',
};

// Building emoji icons
const BUILDING_ICONS: Record<BuildingType, string> = {
  ricePaddy: '🌾',
  teaPlantation: '🫖',
  silkFarm: '🪡',
  jadeMine: '⛏️',
  blacksmith: '🔨',
  house: '🏯',
  temple: '⛩️',
  market: '🏪',
  warehouse: '📦',
  dojo: '🥋',
};

// Terrain emoji icons
const TERRAIN_ICONS: Record<TileType, string> = {
  plains: '',
  river: '🌊',
  bamboo: '🎋',
  mountain: '⛰️',
  forest: '🌲',
};

export class AsianRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrame: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
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

  render(state: GameState, ui: UIState): void {
    this.animationFrame++;
    const { width, height } = this.canvas.getBoundingClientRect();
    const ctx = this.ctx;

    // Clear with ambient light based on day/night cycle
    const dayBrightness = Math.sin(state.dayTime * Math.PI) * 0.15 + 0.2;
    const bgColor = `rgba(40, 40, 50, ${0.8 + dayBrightness})`;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    // Apply camera transform
    ctx.translate(width / 2, height / 2);
    ctx.scale(ui.zoom, ui.zoom);
    ctx.translate(-ui.cameraX, -ui.cameraY);

    // Render map with Asian aesthetic
    this.renderMap(state, ui);

    // Render buildings with animations
    this.renderBuildings(state, ui);

    // Render particle effects
    this.renderParticles(state);

    ctx.restore();

    // Render UI overlay with Asian aesthetic
    this.renderUI(state, ui, width, height);
  }

  private renderMap(state: GameState, ui: UIState): void {
    const ctx = this.ctx;
    const { width, height } = getMapDimensions();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = state.map[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        // Render tile base
        this.renderTile(ctx, tile, px, py);

        // Render tile features (resources, water animation, etc.)
        this.renderTileFeatures(ctx, tile, px, py);
      }
    }
  }

  private renderTile(ctx: CanvasRenderingContext2D, tile: Tile, px: number, py: number): void {
    const tileSize = TILE_SIZE;
    let baseColor: string;
    let altColor: string;

    switch (tile.type) {
      case 'plains':
        baseColor = COLORS.plains;
        altColor = COLORS.plainsAlt;
        break;
      case 'river':
        // Animated water
        const waterPhase = ((this.animationFrame * 0.02 + (tile.animationPhase || 0)) % 1);
        baseColor = waterPhase < 0.5 ? COLORS.river : COLORS.riverLight;
        altColor = baseColor;
        break;
      case 'bamboo':
        baseColor = COLORS.bamboo;
        altColor = COLORS.bambooLight;
        break;
      case 'forest':
        baseColor = COLORS.forest;
        altColor = COLORS.forestLight;
        break;
      case 'mountain':
        baseColor = COLORS.mountain;
        altColor = COLORS.mountainLight;
        break;
      default:
        baseColor = COLORS.plains;
        altColor = COLORS.plainsAlt;
    }

    // Checkerboard pattern for terrain variation
    const isAlt = (tile.x + tile.y) % 2 === 0;
    ctx.fillStyle = isAlt ? baseColor : altColor;
    ctx.fillRect(px, py, tileSize, tileSize);

    // Subtle grid lines
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(px, py, tileSize, tileSize);
  }

  private renderTileFeatures(ctx: CanvasRenderingContext2D, tile: Tile, px: number, py: number): void {
    if (tile.building) return; // Building will cover tile features

    // Render terrain features
    if (tile.type !== 'plains' && !tile.building) {
      ctx.font = `${TILE_SIZE * 0.55}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillText(
        TERRAIN_ICONS[tile.type],
        px + TILE_SIZE / 2 + 1,
        py + TILE_SIZE / 2 + 1
      );
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText(
        TERRAIN_ICONS[tile.type],
        px + TILE_SIZE / 2,
        py + TILE_SIZE / 2
      );

      // Resource depletion indicator
      if (tile.resourceAmount !== undefined && tile.resourceAmount < 50) {
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#ff6b6b';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(Math.round(tile.resourceAmount).toString(), px + TILE_SIZE - 2, py + TILE_SIZE - 2);
      }
    }
  }

  private renderBuildings(state: GameState, ui: UIState): void {
    const ctx = this.ctx;

    for (const building of state.buildings) {
      const px = building.x * TILE_SIZE;
      const py = building.y * TILE_SIZE;
      const def = getBuildingDef(building.type);

      // Building shadow for depth
      ctx.fillStyle = COLORS.shadow;
      ctx.fillRect(px + 3, py + TILE_SIZE - 3, TILE_SIZE - 6, 4);

      // Building body
      this.renderBuildingBody(ctx, building, px, py, def);

      // Building details and animations
      this.renderBuildingDetails(ctx, building, px, py, def);
    }
  }

  private renderBuildingBody(
    ctx: CanvasRenderingContext2D,
    building: Building,
    px: number,
    py: number,
    def: any
  ): void {
    const tileSize = TILE_SIZE;
    const color = BUILDING_COLORS[building.type];

    // Main building rectangle with border to look like pixel art
    ctx.fillStyle = color;
    ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

    // Dark border for definition
    ctx.strokeStyle = '#2c2c2c';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

    // Highlight for 3D effect
    ctx.strokeStyle = COLORS.highlight;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 3, py + 3, tileSize - 6, tileSize - 6);

    // Construction animation if building is under construction
    if (building.constructionProgress && building.constructionProgress < 1) {
      ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
      const progressWidth = (tileSize - 4) * building.constructionProgress;
      ctx.fillRect(px + 2, py + tileSize - 6, progressWidth, 4);
    }
  }

  private renderBuildingDetails(
    ctx: CanvasRenderingContext2D,
    building: Building,
    px: number,
    py: number,
    def: any
  ): void {
    const tileSize = TILE_SIZE;

    // Building icon
    ctx.font = `${tileSize * 0.45}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(BUILDING_ICONS[building.type], px + tileSize / 2, py + tileSize / 2 - 2);

    // Worker status indicator
    if (def.workers > 0) {
      const hasEnough = building.workers >= def.workers;
      ctx.fillStyle = hasEnough ? COLORS.positive : COLORS.negative;
      ctx.beginPath();
      ctx.arc(px + tileSize - 8, py + 8, 5, 0, Math.PI * 2);
      ctx.fill();

      // Worker count
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(building.workers.toString(), px + tileSize - 8, py + 8);
    }

    // Production animation (pulsing glow for active production)
    if (def.production && building.workers >= def.workers) {
      const pulse = Math.sin(this.animationFrame * 0.05) * 0.5 + 0.5;
      ctx.strokeStyle = `rgba(100, 200, 100, ${pulse * 0.5})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
    }
  }

  private renderParticles(state: GameState): void {
    const ctx = this.ctx;

    for (const particle of state.particles) {
      const opacity = particle.life;
      
      ctx.save();
      ctx.globalAlpha = opacity;

      switch (particle.type) {
        case 'smoke':
          ctx.fillStyle = particle.color || 'rgba(100, 100, 100)';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 8 * (1 - particle.life), 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'leaf':
          ctx.fillStyle = particle.color || '#7db542';
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(this.animationFrame * 0.05);
          ctx.fillRect(-3, -1, 6, 2);
          ctx.restore();
          break;

        case 'sparkle':
          ctx.fillStyle = particle.color || '#f4c430';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 2 * opacity, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'dust':
          ctx.fillStyle = particle.color || 'rgba(200, 180, 140)';
          ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
          break;
      }

      ctx.restore();
    }
  }

  private renderUI(state: GameState, ui: UIState, width: number, height: number): void {
    const ctx = this.ctx;

    // Resource bar at top with Asian aesthetic
    this.renderResourceBar(state, width);

    // Building palette at bottom
    this.renderBuildingPalette(state, ui, width, height);

    // Top-right: Season and time indicator
    this.renderTimeInfo(state, width, height);

    // Notification
    if (ui.notification) {
      this.renderNotification(ctx, ui.notification, width, height);
    }
  }

  private renderResourceBar(state: GameState, width: number): void {
    const ctx = this.ctx;
    const barHeight = 60;

    // Background with paper texture effect
    ctx.fillStyle = '#f5f1e8';
    ctx.fillRect(0, 0, width, barHeight);

    // Top border line (brush stroke style)
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, barHeight);
    ctx.lineTo(width, barHeight);
    ctx.stroke();

    // Resources with Asian-inspired icons
    const resources = [
      { key: 'rice', icon: '🌾', color: '#d4a574' },
      { key: 'tea', icon: '🫖', color: '#7db542' },
      { key: 'silk', icon: '🪡', color: '#d4a5a5' },
      { key: 'jade', icon: '💚', color: '#4a90e2' },
      { key: 'iron', icon: '⚙️', color: '#696969' },
      { key: 'bamboo', icon: '🎋', color: '#8b6f47' },
      { key: 'gold', icon: '🪙', color: '#f4c430' },
    ];

    const startX = 10;
    const spacing = Math.min(100, (width - 20) / resources.length);

    resources.forEach((r, i) => {
      const x = startX + i * spacing;

      ctx.font = 'bold 16px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.icon, x, 20);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = r.color;
      const value = Math.floor((state.resources as any)[r.key]);
      const max = Math.floor((state.maxResources as any)[r.key]);
      ctx.fillText(`${value}/${max}`, x + 24, 20);
    });

    // Population and workers info
    ctx.fillStyle = '#2c2c2c';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
      `👥 ${Math.floor(state.population)}/${state.maxPopulation}  |  👷 ${state.workers - state.usedWorkers}/${state.workers}`,
      width - 10,
      20
    );

    // Population type breakdown
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#666';
    const popTypes = Object.entries(state.populationTypes).map(([type, count]) => `${type}: ${count}`).join(' | ');
    ctx.fillText(popTypes, width - 10, 38);
  }

  private renderTimeInfo(state: GameState, width: number, height: number): void {
    const ctx = this.ctx;
    const seasonEmoji: Record<string, string> = {
      spring: '🌸',
      summer: '☀️',
      autumn: '🍂',
      winter: '❄️',
    };

    const timeEmoji = state.dayTime > 0.25 && state.dayTime < 0.75 ? '☀️' : '🌙';

    ctx.fillStyle = '#f5f1e8';
    ctx.fillRect(width - 90, 10, 80, 40);

    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 1;
    ctx.strokeRect(width - 90, 10, 80, 40);

    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2c2c2c';
    ctx.fillText(`${seasonEmoji[state.season]} ${timeEmoji}`, width - 50, 30);
  }

  private renderBuildingPalette(state: GameState, ui: UIState, width: number, height: number): void {
    const ctx = this.ctx;
    const paletteHeight = 110;
    const y = height - paletteHeight;

    // Background with paper texture
    ctx.fillStyle = '#f5f1e8';
    ctx.fillRect(0, y, width, paletteHeight);

    // Top border
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    // Building buttons
    const buildingTypes = Object.keys(BUILDINGS) as BuildingType[];
    const btnSize = 60;
    const spacing = 8;
    const totalWidth = buildingTypes.length * (btnSize + spacing);
    let startX = (width - totalWidth) / 2;

    // Scroll if too many buildings
    if (totalWidth > width - 40) {
      startX = 20;
    }

    buildingTypes.forEach((type, i) => {
      const def = BUILDINGS[type];
      const x = startX + i * (btnSize + spacing);
      const btnY = y + 15;

      // Button background
      const isSelected = ui.selectedBuilding === type;
      const canBuild = this.canAffordQuick(state, type);

      ctx.fillStyle = isSelected ? COLORS.selected : (canBuild ? BUILDING_COLORS[type] : '#ccc');
      ctx.fillRect(x, btnY, btnSize, btnSize);

      // Border
      ctx.strokeStyle = isSelected ? '#333' : '#8b7355';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.strokeRect(x, btnY, btnSize, btnSize);

      // Icon
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = canBuild ? '#2c2c2c' : '#999';
      ctx.fillText(BUILDING_ICONS[type], x + btnSize / 2, btnY + btnSize / 2 - 5);

      // Affordability indicator
      if (!canBuild) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, btnY, btnSize, btnSize);
      }
    });

    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      ui.selectedBuilding
        ? 'Click map to place | Right-click to cancel | Shift+click to demolish'
        : 'Select a building below | Scroll to zoom | Drag to pan',
      width / 2,
      y + 90
    );
  }

  private renderNotification(ctx: CanvasRenderingContext2D, message: string, width: number, height: number): void {
    const boxWidth = Math.min(400, width - 40);
    const boxHeight = 50;
    const x = (width - boxWidth) / 2;
    const y = height / 3;

    // Notification box with Asian aesthetic
    ctx.fillStyle = '#f5f1e8';
    ctx.fillRect(x, y, boxWidth, boxHeight);

    // Border
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    // Text
    ctx.fillStyle = '#2c2c2c';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, x + boxWidth / 2, y + boxHeight / 2);
  }

  private canAffordQuick(state: GameState, type: BuildingType): boolean {
    const def = BUILDINGS[type];
    for (const [resource, amount] of Object.entries(def.cost)) {
      const value = (state.resources as any)[resource];
      if ((value ?? 0) < (amount ?? 0)) {
        return false;
      }
    }
    return true;
  }

  getTileSize(): number {
    return TILE_SIZE;
  }
}
