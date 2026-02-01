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
  isStartingArea?: boolean; // Mark as part of starting village area
  territory?: string; // Territory ID if part of discovered territory
}

// Building types - Asian themed (phase 2: expanded)
export type BuildingType = 
  // Agriculture
  'ricePaddy' | 'teaPlantation' | 'silkFarm' | 'fishingDock' | 
  // Resources
  'jadeMine' | 'ironMine' | 'bambooGrove' |
  // Production & Crafting
  'blacksmith' | 'teaHouse' | 'market' | 'warehouse' |
  // Military & Defense
  'watchtower' | 'dojo' | 'castle' |
  // Cultural & Residential
  'house' | 'temple' | 'inn' | 'harbor' | 'shipyard';

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
  isStartingBuilding?: boolean; // Mark as starting Town Hall
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

// Quest system
export type QuestType = 'explore' | 'build' | 'trade' | 'population' | 'defense' | 'culture';
export type QuestStatus = 'available' | 'active' | 'completed' | 'failed';

export interface QuestObjective {
  type: 'buildBuilding' | 'gatherResource' | 'reachPopulation' | 'exploreArea' | 'establishTrade' | 'defendAttack' | 'buildTemple';
  buildingType?: BuildingType;
  resourceType?: ResourceType;
  targetAmount?: number;
  targetArea?: { x: number; y: number; radius: number };
  description: string;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  objectives: QuestObjective[];
  reward: {
    gold: number;
    resources?: Partial<Resources>;
    population?: number;
  };
  timeLimit?: number; // milliseconds, undefined = no limit
  progress: number; // 0-1
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
  quests: Quest[]; // Active and completed quests
  completedQuests: string[]; // Quest IDs that have been completed
  exploredAreas: string[]; // Map coordinates explored (JSON-serializable array)
  visibilityGrid?: boolean[][]; // Fog of war grid
  discoveredTerritories?: Record<string, any>; // New territories found (JSON-serializable object)
  tutorialStep: number; // 0 = none, >0 = tutorial in progress
  settlementLevel: number; // 1-10, tracks current settlement level
  lastSettlementLevel: number; // Previous level for detecting level-ups
  mapSeed?: number; // Seed for reproducible maps
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
