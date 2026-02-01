import { BuildingDefinition, BuildingType } from '../types';

/**
 * Phase 2: Expanded Asian-themed buildings representing East Asian dynastic architecture
 * - Chinese: Pagodas, Jade Mines, Tea Houses, Markets, Harbors
 * - Japanese: Dojos, Temples, Harbor Houses, Castles
 * - Korean: Rice Paddies, Silk Farms, Watchtowers, Inns
 * - Cross-cultural: Monasteries, Workshops, Fishing Docks, Shipyards
 * 
 * Production Chains:
 * - Rice → Food (population needs)
 * - Tea → Trade Goods (luxury)
 * - Silk → Luxury Trade (high value)
 * - Bamboo → Construction Material (building support)
 * - Iron + Blacksmith → Weapons/Tools
 * - Tea + Tea House → Premium Tea (trading)
 * - Fish + Market → Gold (commerce)
 */

export const BUILDINGS: Record<BuildingType, BuildingDefinition> = {
  // ===== AGRICULTURE =====
  ricePaddy: {
    type: 'ricePaddy',
    name: '🌾 Rice Paddy',
    cost: { gold: 40, bamboo: 10 },
    workers: 2,
    workerTypePreference: ['farmer'],
    production: {
      output: 'rice',
      rate: 3,
    },
    description: 'Grows rice to feed your people. The lifeblood of the realm.',
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
    description: 'Cultivates premium tea in mountain forests. A valuable trade good.',
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
    description: 'Produces luxurious silk through careful cultivation. Highly valued in trade.',
    sprite: 'silkFarm',
  },

  fishingDock: {
    type: 'fishingDock',
    name: '🎣 Fishing Dock',
    cost: { gold: 50, bamboo: 15 },
    workers: 2,
    workerTypePreference: ['fisherman'],
    production: {
      output: 'rice',
      rate: 2.5,
      requires: 'river',
    },
    description: 'Harvests fish and provides additional food from rivers. Must be near water.',
    sprite: 'fishingDock',
  },

  // ===== RESOURCES =====
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
    description: 'Extracts precious jade from mountains. Sacred and invaluable for trade.',
    sprite: 'jadeMine',
  },

  ironMine: {
    type: 'ironMine',
    name: '⛏️ Iron Mine',
    cost: { gold: 110, bamboo: 20 },
    workers: 3,
    workerTypePreference: ['warrior'],
    production: {
      output: 'iron',
      rate: 1.2,
      requires: 'mountain',
    },
    description: 'Mines iron ore from deep within mountains. Essential for tools and weapons.',
    sprite: 'ironMine',
  },

  bambooGrove: {
    type: 'bambooGrove',
    name: '🎋 Bamboo Grove',
    cost: { gold: 35, rice: 10 },
    workers: 2,
    workerTypePreference: ['farmer'],
    production: {
      output: 'bamboo',
      rate: 2.5,
      requires: 'bamboo',
    },
    description: 'Cultivates bamboo groves for construction and crafting. Place near bamboo.',
    sprite: 'bambooGrove',
  },

  // ===== PRODUCTION & CRAFTING =====
  blacksmith: {
    type: 'blacksmith',
    name: '🔨 Blacksmith',
    cost: { gold: 90, iron: 5 },
    workers: 2,
    workerTypePreference: ['warrior'],
    production: {
      output: 'iron',
      rate: 1.8,
    },
    description: 'Forges iron tools and weapons. Transforms raw ore into useful items.',
    sprite: 'blacksmith',
  },

  teaHouse: {
    type: 'teaHouse',
    name: '🏘️ Tea House',
    cost: { gold: 85, silk: 10, bamboo: 15 },
    workers: 2,
    workerTypePreference: ['merchant'],
    production: {
      output: 'gold',
      rate: 2,
    },
    description: 'Premium tea serving establishment. Sells fine tea for substantial profits.',
    sprite: 'teaHouse',
  },

  market: {
    type: 'market',
    name: '🏪 Market',
    cost: { gold: 100, bamboo: 25 },
    workers: 1,
    workerTypePreference: ['merchant'],
    description: 'Central trade hub. Allows selling of resources for gold. Attracts merchants.',
    sprite: 'market',
  },

  warehouse: {
    type: 'warehouse',
    name: '📦 Warehouse',
    cost: { gold: 60, bamboo: 20 },
    workers: 0,
    storage: { 
      rice: 150, tea: 100, silk: 80, jade: 60, iron: 100, bamboo: 200, gold: 300 
    },
    description: 'Massive storage facility. Greatly increases resource capacity for all goods.',
    sprite: 'warehouse',
  },

  // ===== MILITARY & DEFENSE =====
  watchtower: {
    type: 'watchtower',
    name: '🏯 Watchtower',
    cost: { gold: 120, bamboo: 20, iron: 5 },
    workers: 1,
    workerTypePreference: ['warrior'],
    description: 'Defense tower for monitoring and protection. Requires warrior staff.',
    sprite: 'watchtower',
  },

  dojo: {
    type: 'dojo',
    name: '🥋 Dojo',
    cost: { gold: 120, bamboo: 15 },
    workers: 2,
    workerTypePreference: ['warrior', 'monk'],
    housing: 2,
    description: 'Training hall for warriors and monks. Provides housing and martial training.',
    sprite: 'dojo',
  },

  castle: {
    type: 'castle',
    name: '🏯 Castle',
    cost: { gold: 500, jade: 20, iron: 30, silk: 10 },
    workers: 3,
    workerTypePreference: ['warrior'],
    housing: 10,
    description: 'Grand defensive structure and seat of power. Requires extensive resources.',
    sprite: 'castle',
  },

  // ===== CULTURAL & RESIDENTIAL =====
  house: {
    type: 'house',
    name: '🏯 House',
    cost: { gold: 30, bamboo: 15 },
    workers: 0,
    housing: 4,
    description: 'Traditional dwelling for 4 people. More people = more available workers.',
    sprite: 'house',
  },

  temple: {
    type: 'temple',
    name: '⛩️ Temple',
    cost: { gold: 150, jade: 10, bamboo: 20 },
    workers: 1,
    workerTypePreference: ['monk'],
    housing: 2,
    description: 'Sacred temple attracting monks. Provides housing and spiritual benefits.',
    sprite: 'temple',
  },

  inn: {
    type: 'inn',
    name: '🏨 Inn',
    cost: { gold: 100, silk: 5, bamboo: 20 },
    workers: 2,
    workerTypePreference: ['merchant'],
    housing: 4,
    description: 'Wayfarers\' rest stop providing hospitality. Housing + merchant attraction.',
    sprite: 'inn',
  },

  harbor: {
    type: 'harbor',
    name: '⛵ Harbor',
    cost: { gold: 200, bamboo: 30, jade: 5 },
    workers: 2,
    workerTypePreference: ['fisherman', 'merchant'],
    description: 'Port facility for sea trade and transport. Must be near river/ocean.',
    sprite: 'harbor',
  },

  shipyard: {
    type: 'shipyard',
    name: '⛴️ Shipyard',
    cost: { gold: 250, bamboo: 40, iron: 10 },
    workers: 3,
    workerTypePreference: ['merchant'],
    production: {
      output: 'gold',
      rate: 1.5,
    },
    description: 'Ship construction and maintenance. Supports long-distance trade.',
    sprite: 'shipyard',
  },
};

export const MARKET_PRICES: Record<string, number> = {
  rice: 1,        // Basic food
  tea: 8,         // Luxury trade good
  silk: 15,       // Premium luxury
  jade: 20,       // Sacred precious
  iron: 5,        // Industrial resource
  bamboo: 2,      // Common material
};

export function getBuildingDef(type: BuildingType): BuildingDefinition {
  return BUILDINGS[type];
}

/**
 * Production chains for advanced gameplay
 */
export const PRODUCTION_CHAINS = {
  food: {
    source: 'rice',
    ratio: 1, // 1 rice = 1 food unit
  },
  weapons: {
    source: 'iron',
    ratio: 1,
  },
  tradeable: {
    sources: ['tea', 'silk', 'jade'],
    baseMultiplier: 2,
  },
};
