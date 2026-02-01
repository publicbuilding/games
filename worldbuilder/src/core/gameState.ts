import { GameState, Tile, TileType, Resources } from '../types';

const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;

export function createInitialState(): GameState {
  return {
    resources: { rice: 100, tea: 50, silk: 0, jade: 0, iron: 0, bamboo: 50, gold: 200 },
    maxResources: { rice: 300, tea: 200, silk: 100, jade: 150, iron: 200, bamboo: 300, gold: 500 },
    population: 8,
    maxPopulation: 8,
    populationTypes: { farmer: 5, merchant: 2, warrior: 1, monk: 0, fisherman: 0 },
    workers: 8,
    usedWorkers: 0,
    map: generateMap(),
    buildings: [],
    particles: [],
    lastUpdate: Date.now(),
    totalPlayTime: 0,
    premiumCurrency: 10,
    season: 'spring',
    dayTime: 0.5, // Start at midday
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
      let type: TileType = 'plains';
      const r = random();
      
      // Create clusters of Asian terrain
      if (r < 0.12) {
        type = 'forest'; // Bamboo forests and ancient trees
      } else if (r < 0.18) {
        type = 'mountain'; // Jade mountains
      } else if (r < 0.24) {
        type = 'river'; // Rivers and water
      } else if (r < 0.30) {
        type = 'bamboo'; // Bamboo groves
      }

      row.push({
        type,
        x,
        y,
        resourceAmount: type === 'bamboo' ? 100 : type === 'mountain' ? 80 : type === 'forest' ? 90 : undefined,
        animationPhase: random(),
      });
    }
    map.push(row);
  }

  // Ensure starting area has plains
  for (let y = 6; y < 9; y++) {
    for (let x = 8; x < 12; x++) {
      if (map[y] && map[y][x]) {
        map[y][x].type = 'plains';
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
