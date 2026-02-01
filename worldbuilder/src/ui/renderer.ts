import { GameState, Tile, Building, UIState, BuildingType, TileType } from '../types';
import { getBuildingDef, BUILDINGS } from '../core/buildings';
import { getMapDimensions } from '../core/gameState';

const TILE_SIZE = 48;

// Color palette
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
  lumberMill: '#8B4513',
  quarry: '#696969',
  farm: '#DAA520',
  house: '#CD853F',
  market: '#FFD700',
  warehouse: '#A0522D',
  premiumFactory: '#9b59b6',
  premiumMansion: '#8e44ad',
};

const BUILDING_ICONS: Record<BuildingType, string> = {
  lumberMill: '🪓',
  quarry: '⛏️',
  farm: '🌾',
  house: '🏠',
  market: '🏪',
  warehouse: '📦',
  premiumFactory: '⚙️',
  premiumMansion: '🏰',
};

const TILE_ICONS: Record<TileType, string> = {
  grass: '',
  water: '🌊',
  trees: '🌲',
  rocks: '🪨',
};

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrame: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
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

    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    // Apply camera transform
    ctx.translate(width / 2, height / 2);
    ctx.scale(ui.zoom, ui.zoom);
    ctx.translate(-ui.cameraX, -ui.cameraY);

    // Render map
    this.renderMap(state, ui);

    // Render buildings
    this.renderBuildings(state, ui);

    ctx.restore();

    // Render UI overlay
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

        // Base color with subtle checkerboard
        const isAlt = (x + y) % 2 === 0;
        ctx.fillStyle = tile.type === 'grass' 
          ? (isAlt ? COLORS.grass : COLORS.grassAlt)
          : COLORS[tile.type];
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Grid lines
        ctx.strokeStyle = COLORS.grid;
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

        // Tile icons for resources
        if (tile.type !== 'grass' && !tile.building) {
          ctx.font = `${TILE_SIZE * 0.6}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            TILE_ICONS[tile.type],
            px + TILE_SIZE / 2,
            py + TILE_SIZE / 2
          );

          // Resource amount indicator
          if (tile.resourceAmount !== undefined && tile.resourceAmount < 50) {
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText(
              Math.round(tile.resourceAmount).toString(),
              px + TILE_SIZE / 2,
              py + TILE_SIZE - 5
            );
          }
        }
      }
    }
  }

  private renderBuildings(state: GameState, ui: UIState): void {
    const ctx = this.ctx;

    for (const building of state.buildings) {
      const px = building.x * TILE_SIZE;
      const py = building.y * TILE_SIZE;
      const def = getBuildingDef(building.type);

      // Building background
      ctx.fillStyle = BUILDING_COLORS[building.type];
      ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);

      // Building border
      ctx.strokeStyle = def.premium ? COLORS.premium : '#333';
      ctx.lineWidth = def.premium ? 3 : 2;
      ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);

      // Building icon
      ctx.font = `${TILE_SIZE * 0.5}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        BUILDING_ICONS[building.type],
        px + TILE_SIZE / 2,
        py + TILE_SIZE / 2
      );

      // Worker indicator
      const neededWorkers = def.workers;
      if (neededWorkers > 0) {
        const hasEnough = building.workers >= neededWorkers;
        ctx.fillStyle = hasEnough ? '#2ecc71' : '#e74c3c';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE - 8, py + 8, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Speed boost indicator
      if (building.speedBoostUntil && building.speedBoostUntil > Date.now()) {
        ctx.fillStyle = '#f1c40f';
        ctx.font = '12px sans-serif';
        ctx.fillText('⚡', px + 8, py + 12);
      }
    }

    // Highlight selected building type placement preview
    if (ui.selectedBuilding) {
      // This would be handled by mouse position tracking
    }
  }

  private renderUI(state: GameState, ui: UIState, width: number, height: number): void {
    const ctx = this.ctx;

    // Resource bar at top
    this.renderResourceBar(state, width);

    // Building palette at bottom
    this.renderBuildingPalette(state, ui, width, height);

    // Notification
    if (ui.notification) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(width / 2 - 150, 100, 300, 40);
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ui.notification, width / 2, 120);
    }
  }

  private renderResourceBar(state: GameState, width: number): void {
    const ctx = this.ctx;
    const barHeight = 50;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, width, barHeight);

    // Resources
    const resources = [
      { icon: '🪵', value: state.resources.wood, max: state.maxResources.wood, color: '#8B4513' },
      { icon: '🪨', value: state.resources.stone, max: state.maxResources.stone, color: '#7f8c8d' },
      { icon: '🍎', value: state.resources.food, max: state.maxResources.food, color: '#e74c3c' },
      { icon: '🪙', value: state.resources.gold, max: state.maxResources.gold, color: '#f1c40f' },
      { icon: '💎', value: state.premiumCurrency, max: 999, color: '#9b59b6' },
    ];

    const startX = 10;
    const spacing = Math.min(120, (width - 20) / resources.length);

    resources.forEach((r, i) => {
      const x = startX + i * spacing;
      
      ctx.font = '20px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.icon, x, 25);

      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = r.color;
      ctx.fillText(`${Math.floor(r.value)}/${r.max}`, x + 28, 25);
    });

    // Population
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
      `👥 ${Math.floor(state.population)}/${state.maxPopulation} | 👷 ${state.workers - state.usedWorkers}/${state.workers}`,
      width - 10,
      25
    );
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

  getTileSize(): number {
    return TILE_SIZE;
  }
}
