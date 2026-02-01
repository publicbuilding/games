// Resource types
export type ResourceType = 'wood' | 'stone' | 'food' | 'gold';

export interface Resources {
  wood: number;
  stone: number;
  food: number;
  gold: number;
}

// Tile types
export type TileType = 'grass' | 'water' | 'trees' | 'rocks';

export interface Tile {
  type: TileType;
  x: number;
  y: number;
  building?: Building;
  resourceAmount?: number; // For trees/rocks - how much left
}

// Building types
export type BuildingType = 'lumberMill' | 'quarry' | 'farm' | 'house' | 'market' | 'warehouse' | 'premiumFactory' | 'premiumMansion';

export interface BuildingDefinition {
  type: BuildingType;
  name: string;
  cost: Partial<Resources>;
  workers: number;
  production?: {
    output: ResourceType;
    rate: number; // per second
    requires?: TileType; // Adjacent tile type needed
  };
  housing?: number; // Population capacity
  storage?: Partial<Resources>; // Storage increase
  premium?: boolean;
  description: string;
}

export interface Building {
  type: BuildingType;
  x: number;
  y: number;
  level: number;
  workers: number;
  productionProgress: number;
  speedBoostUntil?: number; // Premium speed boost timestamp
}

// Game state
export interface GameState {
  resources: Resources;
  maxResources: Resources;
  population: number;
  maxPopulation: number;
  workers: number;
  usedWorkers: number;
  map: Tile[][];
  buildings: Building[];
  lastUpdate: number;
  totalPlayTime: number;
  premiumCurrency: number; // Gems
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
