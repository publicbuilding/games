import { GameState, Tile, TileType, Resources, Building, BuildingType } from '../types';
import { generateIntelligentMap } from './mapGeneration';

const MAP_WIDTH = 40;  // Expanded map for exploration
const MAP_HEIGHT = 30;
const INITIAL_VISIBLE_WIDTH = 20;  // Initial visible area
const INITIAL_VISIBLE_HEIGHT = 20;
const STARTING_X = Math.floor(MAP_WIDTH / 2) - Math.floor(INITIAL_VISIBLE_WIDTH / 2);
const STARTING_Y = Math.floor(MAP_HEIGHT / 2) - Math.floor(INITIAL_VISIBLE_HEIGHT / 2);

export function createInitialState(seed?: number): GameState {
  const { map, seed: usedSeed } = generateIntelligentMap(seed);
  const buildings = initializeStartingArea(map);
  
  return {
    resources: { rice: 80, tea: 50, silk: 0, jade: 0, iron: 0, bamboo: 50, gold: 150 },
    maxResources: { rice: 300, tea: 200, silk: 100, jade: 150, iron: 200, bamboo: 300, gold: 500 },
    population: 5,
    maxPopulation: 5,
    populationTypes: { farmer: 3, merchant: 1, warrior: 1, monk: 0, fisherman: 0 },
    workers: 5,
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
    discoveredTerritories: {},
    settlementLevel: 1,
    lastSettlementLevel: 1,
    mapSeed: usedSeed,  // Store seed for display and sharing
  };
}

/**
 * Initialize explored areas with starting visible region
 * Returns an array instead of Set for JSON serialization
 */
function initializeExploredAreas(): string[] {
  const explored: string[] = [];
  const startCenterX = STARTING_X + Math.floor(INITIAL_VISIBLE_WIDTH / 2);
  const startCenterY = STARTING_Y + Math.floor(INITIAL_VISIBLE_HEIGHT / 2);
  
  for (let y = STARTING_Y; y < STARTING_Y + INITIAL_VISIBLE_HEIGHT; y++) {
    for (let x = STARTING_X; x < STARTING_X + INITIAL_VISIBLE_WIDTH; x++) {
      explored.push(`${x},${y}`);
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
  
  // Place a starting house nearby (west of town hall)
  const startingHouseX = startCenterX - 2;
  const startingHouseY = startCenterY;
  if (map[startingHouseY] && map[startingHouseY][startingHouseX]) {
    const startingHouse: Building = {
      type: 'house',
      x: startingHouseX,
      y: startingHouseY,
      level: 1,
      workers: 0,
      productionProgress: 0,
      isStartingBuilding: true,  // Mark as starting building
    };
    buildings.push(startingHouse);
    map[startingHouseY][startingHouseX].building = startingHouse;
  }
  
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

// Map generation moved to mapGeneration.ts with intelligent terrain placement,
// river systems, mountain ranges, and biome clustering.

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
