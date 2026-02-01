import { GameState, Tile, TileType, Resources } from '../types';

const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;

export function createInitialState(): GameState {
  return {
    resources: { wood: 100, stone: 50, food: 200, gold: 200 },
    maxResources: { wood: 200, stone: 200, food: 300, gold: 500 },
    population: 5,
    maxPopulation: 5,
    workers: 5,
    usedWorkers: 0,
    map: generateMap(),
    buildings: [],
    lastUpdate: Date.now(),
    totalPlayTime: 0,
    premiumCurrency: 10, // Start with some gems to taste
  };
}

function generateMap(): Tile[][] {
  const map: Tile[][] = [];
  
  // Seeded random for reproducible maps
  const seed = 12345;
  let rng = seed;
  const random = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  };

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      let type: TileType = 'grass';
      const r = random();
      
      // Create clusters of resources
      if (r < 0.15) {
        type = 'trees';
      } else if (r < 0.22) {
        type = 'rocks';
      } else if (r < 0.27) {
        type = 'water';
      }

      row.push({
        type,
        x,
        y,
        resourceAmount: type === 'trees' ? 100 : type === 'rocks' ? 80 : undefined,
      });
    }
    map.push(row);
  }

  // Ensure starting area has some grass
  for (let y = 6; y < 9; y++) {
    for (let x = 8; x < 12; x++) {
      if (map[y] && map[y][x]) {
        map[y][x].type = 'grass';
        map[y][x].resourceAmount = undefined;
      }
    }
  }

  return map;
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
