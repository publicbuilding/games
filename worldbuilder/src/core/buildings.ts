import { BuildingDefinition, BuildingType } from '../types';

/**
 * Asian-themed buildings representing East Asian dynastic architecture
 * - Chinese: Pagodas, Jade Mines, Tea Houses, Markets
 * - Japanese: Dojos, Temples, Harbor Houses
 * - Korean: Rice Paddies, Silk Farms, Watchtowers
 * - Cross-cultural: Monasteries, Inns, Workshops
 */

export const BUILDINGS: Record<BuildingType, BuildingDefinition> = {
  ricePaddy: {
    type: 'ricePaddy',
    name: '🌾 Rice Paddy',
    cost: { gold: 40, bamboo: 10 },
    workers: 2,
    workerTypePreference: ['farmer', 'fisherman'],
    production: {
      output: 'rice',
      rate: 3,
    },
    description: 'Grows rice to feed your people. The lifeblood of the realm. Best worked by farmers.',
    sprite: 'ricePaddy',
  },
  teaPlantation: {
    type: 'teaPlantation',
    name: '🫖 Tea Plantation',
    cost: { gold: 60, bamboo: 20 },
    workers: 2,
    workerTypePreference: ['farmer'],
    production: {
      output: 'tea',
      rate: 2,
      requires: 'forest',
    },
    description: 'Cultivates premium tea. Place near forests. A luxury trade good.',
    sprite: 'teaPlantation',
  },
  silkFarm: {
    type: 'silkFarm',
    name: '🪡 Silk Farm',
    cost: { gold: 80, rice: 15 },
    workers: 3,
    workerTypePreference: ['merchant', 'farmer'],
    production: {
      output: 'silk',
      rate: 1.5,
    },
    description: 'Produces luxurious silk. Highly valued in trade routes.',
    sprite: 'silkFarm',
  },
  jadeMine: {
    type: 'jadeMine',
    name: '⛏️ Jade Mine',
    cost: { gold: 100, bamboo: 15 },
    workers: 3,
    workerTypePreference: ['warrior'],
    production: {
      output: 'jade',
      rate: 1,
      requires: 'mountain',
    },
    description: 'Extracts precious jade from mountains. Sacred and valuable.',
    sprite: 'jadeMine',
  },
  blacksmith: {
    type: 'blacksmith',
    name: '🔨 Blacksmith',
    cost: { gold: 90, iron: 5 },
    workers: 2,
    workerTypePreference: ['warrior'],
    production: {
      output: 'iron',
      rate: 2,
    },
    description: 'Forges iron tools and weapons. Essential for the defense of the realm.',
    sprite: 'blacksmith',
  },
  house: {
    type: 'house',
    name: '🏯 House',
    cost: { gold: 30, bamboo: 15 },
    workers: 0,
    housing: 4,
    description: 'A traditional dwelling for 4 people. More people = more available workers.',
    sprite: 'house',
  },
  temple: {
    type: 'temple',
    name: '⛩️ Temple',
    cost: { gold: 150, jade: 10, bamboo: 20 },
    workers: 1,
    workerTypePreference: ['monk'],
    housing: 2,
    description: 'A sacred temple that attracts monks and provides housing. Blessing for the realm.',
    sprite: 'temple',
  },
  market: {
    type: 'market',
    name: '🏪 Market',
    cost: { gold: 100, bamboo: 25 },
    workers: 1,
    workerTypePreference: ['merchant'],
    description: 'Trade hub. Sell excess resources for gold. Attracts merchants.',
    sprite: 'market',
  },
  warehouse: {
    type: 'warehouse',
    name: '📦 Warehouse',
    cost: { gold: 60, bamboo: 20 },
    workers: 0,
    storage: { rice: 150, tea: 100, silk: 80, jade: 60, iron: 100, bamboo: 200, gold: 300 },
    description: 'Storage facility for resources. Increases capacity for all goods.',
    sprite: 'warehouse',
  },
  dojo: {
    type: 'dojo',
    name: '🥋 Dojo',
    cost: { gold: 120, bamboo: 15 },
    workers: 2,
    workerTypePreference: ['warrior', 'monk'],
    housing: 2,
    description: 'Training hall for warriors and monks. Provides housing and defense training.',
    sprite: 'dojo',
  },
};

export const MARKET_PRICES: Record<string, number> = {
  rice: 2,
  tea: 8,
  silk: 15,
  jade: 20,
  iron: 5,
  bamboo: 1,
};

export function getBuildingDef(type: BuildingType): BuildingDefinition {
  return BUILDINGS[type];
}
