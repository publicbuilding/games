import { BuildingDefinition, BuildingType } from '../types';

export const BUILDINGS: Record<BuildingType, BuildingDefinition> = {
  lumberMill: {
    type: 'lumberMill',
    name: 'Lumber Mill',
    cost: { gold: 50, stone: 10 },
    workers: 2,
    production: {
      output: 'wood',
      rate: 2, // 2 wood per second when working
      requires: 'trees',
    },
    description: 'Produces wood from nearby trees. Place next to forests!',
  },
  quarry: {
    type: 'quarry',
    name: 'Quarry',
    cost: { gold: 75, wood: 20 },
    workers: 3,
    production: {
      output: 'stone',
      rate: 1.5,
      requires: 'rocks',
    },
    description: 'Extracts stone from nearby rocks. Place next to mountains!',
  },
  farm: {
    type: 'farm',
    name: 'Farm',
    cost: { gold: 40, wood: 15 },
    workers: 2,
    production: {
      output: 'food',
      rate: 3,
    },
    description: 'Grows food to feed your population. No adjacency needed.',
  },
  house: {
    type: 'house',
    name: 'House',
    cost: { gold: 30, wood: 20, stone: 10 },
    workers: 0,
    housing: 4,
    description: 'Provides housing for 4 people. More people = more workers!',
  },
  market: {
    type: 'market',
    name: 'Market',
    cost: { gold: 100, wood: 30, stone: 20 },
    workers: 1,
    description: 'Sell excess resources for gold. Click to trade!',
  },
  warehouse: {
    type: 'warehouse',
    name: 'Warehouse',
    cost: { gold: 60, wood: 25 },
    workers: 0,
    storage: { wood: 100, stone: 100, food: 50, gold: 200 },
    description: 'Increases storage capacity for all resources.',
  },
  premiumFactory: {
    type: 'premiumFactory',
    name: '⭐ Auto Factory',
    cost: { gold: 500 },
    workers: 0,
    production: {
      output: 'gold',
      rate: 5,
    },
    premium: true,
    description: 'Generates gold automatically! No workers needed. (Premium)',
  },
  premiumMansion: {
    type: 'premiumMansion',
    name: '⭐ Mansion',
    cost: { gold: 300 },
    workers: 0,
    housing: 12,
    premium: true,
    description: 'Luxurious housing for 12 people! (Premium)',
  },
};

export const MARKET_PRICES: Record<string, number> = {
  wood: 5,
  stone: 8,
  food: 3,
};

export function getBuildingDef(type: BuildingType): BuildingDefinition {
  return BUILDINGS[type];
}
