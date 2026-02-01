// Resource types - Asian themed
export type ResourceType = 'rice' | 'tea' | 'silk' | 'jade' | 'iron' | 'bamboo' | 'gold';

export interface Resources {
  rice: number;
  tea: number;
  silk: number;
  jade: number;
  iron: number;
  bamboo: number;
  gold: number;
}

// Tile types - Asian themed terrain
export type TileType = 'plains' | 'river' | 'bamboo' | 'mountain' | 'forest';

export interface Tile {
  type: TileType;
  x: number;
  y: number;
  building?: Building;
  resourceAmount?: number; // For bamboo/mountain - how much left
  animationPhase?: number; // For water/forest animation
}

// Building types - Asian themed (phase 1 initial set)
export type BuildingType = 'ricePaddy' | 'teaPlantation' | 'silkFarm' | 'jadeMine' | 'blacksmith' | 'house' | 'temple' | 'market' | 'warehouse' | 'dojo';

export interface BuildingDefinition {
  type: BuildingType;
  name: string;
  cost: Partial<Resources>;
  workers: number;
  workerTypePreference?: PopulationType[]; // Preferred worker types
  production?: {
    output: ResourceType;
    rate: number; // per second
    requires?: TileType; // Adjacent tile type needed
  };
  housing?: number; // Population capacity
  storage?: Partial<Resources>; // Storage increase
  description: string;
  sprite?: string; // Reference to Asian pixel art sprite
}

export interface Building {
  type: BuildingType;
  x: number;
  y: number;
  level: number;
  workers: number;
  workerTypes?: Record<PopulationType, number>; // Specialized workers
  productionProgress: number;
  constructionProgress?: number; // 0-1 for building animations
  speedBoostUntil?: number; // Premium speed boost timestamp
  animationFrame?: number; // For worker/water animations
}

// Population types for diversity
export type PopulationType = 'farmer' | 'merchant' | 'warrior' | 'monk' | 'fisherman';

// Particle system
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0-1, starts at 1
  type: 'smoke' | 'leaf' | 'sparkle' | 'dust';
  color?: string;
}

// Game state
export interface GameState {
  resources: Resources;
  maxResources: Resources;
  population: number;
  maxPopulation: number;
  populationTypes: Record<PopulationType, number>; // Distribution of population types
  workers: number;
  usedWorkers: number;
  map: Tile[][];
  buildings: Building[];
  particles: Particle[]; // For animations
  lastUpdate: number;
  totalPlayTime: number;
  premiumCurrency: number; // Gems
  season: 'spring' | 'summer' | 'autumn' | 'winter'; // For seasonal changes
  dayTime: number; // 0-1, for day/night cycle
}

// UI state
export interface UIState {
  selectedBuilding: BuildingType | null;
  cameraX: number;
  cameraY: number;
  zoom: number;
  showPremiumModal: boolean;
  notification: string | null;
  notificationTimeout: number | null;
}
