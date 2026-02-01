import { GameState, Tile, TileType, Resources, Building, BuildingType } from '../types';

const MAP_WIDTH = 40;  // Expanded map for exploration
const MAP_HEIGHT = 30;
const INITIAL_VISIBLE_WIDTH = 20;  // Initial visible area
const INITIAL_VISIBLE_HEIGHT = 20;
const STARTING_X = Math.floor(MAP_WIDTH / 2) - Math.floor(INITIAL_VISIBLE_WIDTH / 2);
const STARTING_Y = Math.floor(MAP_HEIGHT / 2) - Math.floor(INITIAL_VISIBLE_HEIGHT / 2);

export function createInitialState(): GameState {
  const map = generateMap();
  const buildings = initializeStartingArea(map);
  
  return {
    resources: { rice: 150, tea: 50, silk: 0, jade: 0, iron: 0, bamboo: 50, gold: 200 },
    maxResources: { rice: 300, tea: 200, silk: 100, jade: 150, iron: 200, bamboo: 300, gold: 500 },
    population: 8,
    maxPopulation: 8,
    populationTypes: { farmer: 5, merchant: 2, warrior: 1, monk: 0, fisherman: 0 },
    workers: 8,
    usedWorkers: 0,
    map,
    buildings,
    particles: [],
    lastUpdate: Date.now(),
    totalPlayTime: 0,
    premiumCurrency: 10,
    season: 'spring',
    dayTime: 0.5, // Start at midday
    quests: [],
    completedQuests: [],
    exploredAreas: initializeExploredAreas(),
    tutorialStep: 1, // Start tutorial
    visibilityGrid: generateVisibilityGrid(map),
    discoveredTerritories: new Map(),
    settlementLevel: 1,
    lastSettlementLevel: 1,
  };
}

/**
 * Initialize explored areas with starting visible region
 */
function initializeExploredAreas(): Set<string> {
  const explored = new Set<string>();
  const startCenterX = STARTING_X + Math.floor(INITIAL_VISIBLE_WIDTH / 2);
  const startCenterY = STARTING_Y + Math.floor(INITIAL_VISIBLE_HEIGHT / 2);
  
  for (let y = STARTING_Y; y < STARTING_Y + INITIAL_VISIBLE_HEIGHT; y++) {
    for (let x = STARTING_X; x < STARTING_X + INITIAL_VISIBLE_WIDTH; x++) {
      explored.add(`${x},${y}`);
    }
  }
  return explored;
}

/**
 * Initialize starting area with Town Hall and village plaza
 */
function initializeStartingArea(map: Tile[][]): Building[] {
  const buildings: Building[] = [];
  const startCenterX = STARTING_X + Math.floor(INITIAL_VISIBLE_WIDTH / 2);
  const startCenterY = STARTING_Y + Math.floor(INITIAL_VISIBLE_HEIGHT / 2);
  
  // Clear 5x5 area around center for village plaza
  for (let y = startCenterY - 2; y <= startCenterY + 2; y++) {
    for (let x = startCenterX - 2; x <= startCenterX + 2; x++) {
      if (map[y] && map[y][x]) {
        map[y][x].type = 'plains';
        map[y][x].resourceAmount = undefined;
        map[y][x].isStartingArea = true;
      }
    }
  }
  
  // Place Town Hall at center
  const townHall: Building = {
    type: 'castle',  // Using castle as town hall
    x: startCenterX,
    y: startCenterY,
    level: 1,
    workers: 0,
    productionProgress: 0,
    isStartingBuilding: true,  // Mark as starting building
  };
  buildings.push(townHall);
  map[startCenterY][startCenterX].building = townHall;
  
  return buildings;
}

/**
 * Generate visibility grid for fog of war
 */
function generateVisibilityGrid(map: Tile[][]): boolean[][] {
  const visibility: boolean[][] = [];
  for (let y = 0; y < map.length; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < map[y].length; x++) {
      // Mark explored areas as visible, others as fog of war
      row.push(false);
    }
    visibility.push(row);
  }
  
  // Make starting area visible
  const startCenterX = STARTING_X + Math.floor(INITIAL_VISIBLE_WIDTH / 2);
  const startCenterY = STARTING_Y + Math.floor(INITIAL_VISIBLE_HEIGHT / 2);
  
  for (let y = STARTING_Y; y < STARTING_Y + INITIAL_VISIBLE_HEIGHT; y++) {
    for (let x = STARTING_X; x < STARTING_X + INITIAL_VISIBLE_WIDTH; x++) {
      visibility[y][x] = true;
    }
  }
  
  return visibility;
}

/**
 * Generate procedural map with random terrain placement
 * Uses Perlin-like noise for clustered terrain
 */
function generateMap(): Tile[][] {
  const map: Tile[][] = [];
  
  // Use true random (not seeded)
  const random = () => Math.random();
  
  // Generate base terrain with simple noise
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      let type: TileType = 'plains';
      
      // Distance from starting area - makes resources rarer near start
      const startCenterX = STARTING_X + Math.floor(INITIAL_VISIBLE_WIDTH / 2);
      const startCenterY = STARTING_Y + Math.floor(INITIAL_VISIBLE_HEIGHT / 2);
      const distToStart = Math.hypot(x - startCenterX, y - startCenterY);
      const proximityFactor = Math.min(1, distToStart / 15);  // Beyond 15 tiles, full resource spawn
      
      // Use multiple random values for terrain generation
      const r1 = random();
      const r2 = random();
      const neighbors = countTerrainNeighbors(map, x, y);
      
      // Simple clustering: favor same terrain as neighbors
      if (neighbors.forest > 0 && r1 < 0.35) {
        type = 'forest';
      } else if (neighbors.mountain > 0 && r1 < 0.35) {
        type = 'mountain';
      } else if (neighbors.river > 0 && r1 < 0.3) {
        type = 'river';
      } else if (neighbors.bamboo > 0 && r1 < 0.4) {
        type = 'bamboo';
      } else if (r1 < 0.08 * proximityFactor) {
        type = 'forest';
      } else if (r1 < 0.15 * proximityFactor) {
        type = 'mountain';
      } else if (r1 < 0.22 * proximityFactor) {
        type = 'river';
      } else if (r1 < 0.30 * proximityFactor) {
        type = 'bamboo';
      }

      row.push({
        type,
        x,
        y,
        resourceAmount: 
          type === 'bamboo' ? 100 : 
          type === 'mountain' ? 80 : 
          type === 'forest' ? 90 : 
          undefined,
        animationPhase: random(),
      });
    }
    map.push(row);
  }

  // Ensure starting area has plains for building
  const startCenterX = STARTING_X + Math.floor(INITIAL_VISIBLE_WIDTH / 2);
  const startCenterY = STARTING_Y + Math.floor(INITIAL_VISIBLE_HEIGHT / 2);
  
  for (let y = startCenterY - 3; y <= startCenterY + 3; y++) {
    for (let x = startCenterX - 3; x <= startCenterX + 3; x++) {
      if (map[y] && map[y][x]) {
        map[y][x].type = 'plains';
        map[y][x].resourceAmount = undefined;
      }
    }
  }

  return map;
}

/**
 * Count terrain neighbors for clustering effect
 */
function countTerrainNeighbors(map: Tile[][], x: number, y: number): Record<TileType, number> {
  const counts: Record<TileType, number> = {
    plains: 0,
    forest: 0,
    mountain: 0,
    river: 0,
    bamboo: 0,
  };
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const ny = y + dy;
      const nx = x + dx;
      if (map[ny] && map[ny][nx]) {
        counts[map[ny][nx].type]++;
      }
    }
  }
  return counts;
}

export function getMapDimensions() {
  return { width: MAP_WIDTH, height: MAP_HEIGHT };
}

const SAVE_KEY = 'worldbuilder_save';

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game:', e);
  }
}

export function loadGame(): GameState | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const state = JSON.parse(saved) as GameState;
      state.lastUpdate = Date.now();
      return state;
    }
  } catch (e) {
    console.error('Failed to load game:', e);
  }
  return null;
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
