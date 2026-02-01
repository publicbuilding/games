import { GameState, BuildingType } from '../types';
import { BUILDINGS } from './buildings';

/**
 * Settlement Levels and Progression System
 * 
 * Each level unlocks new building types and provides rewards for reaching milestones.
 */

export type SettlementLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface LevelDefinition {
  level: SettlementLevel;
  name: string;
  populationRequired: number;
  buildingTypesRequired: number; // Minimum unique building types
  goldProductionRequired: number; // Gold per minute
  questsRequired?: number; // Specific quests that must be completed
  unlockedBuildings: BuildingType[];
  rewards: {
    gold?: number;
    population?: number;
    mapExpansion?: number; // How many new tiles
  };
}

export const SETTLEMENT_LEVELS: Record<SettlementLevel, LevelDefinition> = {
  1: {
    level: 1,
    name: 'Village',
    populationRequired: 0,
    buildingTypesRequired: 0,
    goldProductionRequired: 0,
    unlockedBuildings: [
      'house', 'ricePaddy', 'teaPlantation', 'fishingDock', 'warehouse', 'market', 'bambooGrove', 'jadeMine'
    ],
    rewards: {},
  },
  2: {
    level: 2,
    name: 'Hamlet',
    populationRequired: 15,
    buildingTypesRequired: 2,
    goldProductionRequired: 0.5,
    unlockedBuildings: [
      'teaHouse', 'silkFarm'
    ],
    rewards: { gold: 100, population: 5 },
  },
  3: {
    level: 3,
    name: 'Town',
    populationRequired: 30,
    buildingTypesRequired: 4,
    goldProductionRequired: 1.0,
    unlockedBuildings: [
      'dojo', 'temple', 'watchtower'
    ],
    rewards: { gold: 200, population: 10 },
  },
  4: {
    level: 4,
    name: 'Large Town',
    populationRequired: 50,
    buildingTypesRequired: 6,
    goldProductionRequired: 2.0,
    unlockedBuildings: [
      'harbor', 'shipyard', 'ironMine'
    ],
    rewards: { gold: 300, population: 15 },
  },
  5: {
    level: 5,
    name: 'City',
    populationRequired: 75,
    buildingTypesRequired: 8,
    goldProductionRequired: 3.5,
    unlockedBuildings: [
      'castle', 'blacksmith', 'inn'
    ],
    rewards: { gold: 500, population: 20 },
  },
  6: {
    level: 6,
    name: 'Metropolis',
    populationRequired: 100,
    buildingTypesRequired: 10,
    goldProductionRequired: 5.0,
    unlockedBuildings: [],
    rewards: { gold: 750, population: 25 },
  },
  7: {
    level: 7,
    name: 'Grand Metropolis',
    populationRequired: 130,
    buildingTypesRequired: 12,
    goldProductionRequired: 7.0,
    unlockedBuildings: [],
    rewards: { gold: 1000, population: 30 },
  },
  8: {
    level: 8,
    name: 'Imperial City',
    populationRequired: 160,
    buildingTypesRequired: 14,
    goldProductionRequired: 10.0,
    unlockedBuildings: [],
    rewards: { gold: 1500, population: 35 },
  },
  9: {
    level: 9,
    name: 'Empire Capital',
    populationRequired: 190,
    buildingTypesRequired: 16,
    goldProductionRequired: 13.0,
    unlockedBuildings: [],
    rewards: { gold: 2000, population: 40 },
  },
  10: {
    level: 10,
    name: 'Legendary Kingdom',
    populationRequired: 220,
    buildingTypesRequired: 18,
    goldProductionRequired: 16.0,
    unlockedBuildings: [],
    rewards: { gold: 2500, population: 50 },
  },
};

/**
 * Get the current settlement level based on game state
 */
export function getCurrentSettlementLevel(state: GameState): SettlementLevel {
  // Check from highest level down to find current level
  for (let level = 10; level >= 1; level--) {
    const levelDef = SETTLEMENT_LEVELS[level as SettlementLevel];
    if (canReachLevel(state, levelDef)) {
      return level as SettlementLevel;
    }
  }
  return 1;
}

/**
 * Check if a settlement can reach a specific level
 */
export function canReachLevel(state: GameState, levelDef: LevelDefinition): boolean {
  // Check population requirement
  if (state.population < levelDef.populationRequired) {
    return false;
  }

  // Check building diversity requirement
  const uniqueBuildings = new Set(state.buildings.map(b => b.type));
  if (uniqueBuildings.size < levelDef.buildingTypesRequired) {
    return false;
  }

  // Check gold production requirement
  const goldProduction = calculateGoldProduction(state);
  if (goldProduction < levelDef.goldProductionRequired) {
    return false;
  }

  // Check quest requirements if any
  if (levelDef.questsRequired && levelDef.questsRequired > 0) {
    if (state.completedQuests.length < levelDef.questsRequired) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate current gold production rate (gold per minute)
 */
export function calculateGoldProduction(state: GameState): number {
  let goldPerSecond = 0;

  for (const building of state.buildings) {
    const def = BUILDINGS[building.type];
    if (def.production && def.production.output === 'gold' && building.workers > 0) {
      // Production rate * actual workers / required workers
      const efficiency = building.workers / def.workers;
      goldPerSecond += (def.production.rate || 0) * efficiency;
    }
  }

  return goldPerSecond / 60; // Convert to per-minute
}

/**
 * Get progress information for the next level
 */
export function getLevelProgress(state: GameState): {
  currentLevel: SettlementLevel;
  nextLevel?: LevelDefinition;
  populationProgress: number;
  buildingDiversityProgress: number;
  goldProductionProgress: number;
  populationMissing: number;
  buildingsMissing: number;
  goldMissing: number;
} {
  const currentLevel = getCurrentSettlementLevel(state);
  const nextLevelDef = currentLevel < 10 ? SETTLEMENT_LEVELS[currentLevel + 1 as SettlementLevel] : undefined;

  const uniqueBuildingCount = new Set(state.buildings.map(b => b.type)).size;
  const goldProduction = calculateGoldProduction(state);

  if (!nextLevelDef) {
    return {
      currentLevel,
      populationProgress: 1,
      buildingDiversityProgress: 1,
      goldProductionProgress: 1,
      populationMissing: 0,
      buildingsMissing: 0,
      goldMissing: 0,
    };
  }

  return {
    currentLevel,
    nextLevel: nextLevelDef,
    populationProgress: Math.min(1, state.population / nextLevelDef.populationRequired),
    buildingDiversityProgress: Math.min(1, uniqueBuildingCount / nextLevelDef.buildingTypesRequired),
    goldProductionProgress: Math.min(1, goldProduction / nextLevelDef.goldProductionRequired),
    populationMissing: Math.max(0, nextLevelDef.populationRequired - state.population),
    buildingsMissing: Math.max(0, nextLevelDef.buildingTypesRequired - uniqueBuildingCount),
    goldMissing: Math.max(0, nextLevelDef.goldProductionRequired - goldProduction),
  };
}

/**
 * Check if settlement has leveled up and return level-up data
 */
export function checkLevelUp(state: GameState, previousLevel: SettlementLevel): {
  leveledUp: boolean;
  previousLevel: SettlementLevel;
  newLevel?: SettlementLevel;
  rewards?: any;
} {
  const currentLevel = getCurrentSettlementLevel(state);

  if (currentLevel > previousLevel) {
    const levelDef = SETTLEMENT_LEVELS[currentLevel];
    const rewards = levelDef.rewards;

    // Apply rewards
    if (rewards.gold) {
      state.resources.gold += rewards.gold;
    }
    if (rewards.population) {
      state.population += rewards.population;
      state.maxPopulation += rewards.population;
      // Distribute population types
      state.populationTypes.farmer += Math.ceil(rewards.population * 0.5);
      state.populationTypes.merchant += Math.ceil(rewards.population * 0.2);
      state.populationTypes.warrior += Math.ceil(rewards.population * 0.15);
      state.populationTypes.monk += Math.floor(rewards.population * 0.1);
      state.populationTypes.fisherman += Math.floor(rewards.population * 0.05);
    }

    return {
      leveledUp: true,
      previousLevel,
      newLevel: currentLevel,
      rewards,
    };
  }

  return {
    leveledUp: false,
    previousLevel,
  };
}

/**
 * Get which buildings are unlocked at a given level
 */
export function getUnlockedBuildings(level: SettlementLevel): Set<BuildingType> {
  const unlockedSet = new Set<BuildingType>();

  // Add all buildings from level 1 up to and including the given level
  for (let i = 1; i <= level; i++) {
    const levelDef = SETTLEMENT_LEVELS[i as SettlementLevel];
    levelDef.unlockedBuildings.forEach(building => unlockedSet.add(building));
  }

  return unlockedSet;
}

/**
 * Check if a building is unlocked at a given level
 */
export function isBuildingUnlocked(building: BuildingType, level: SettlementLevel): boolean {
  return getUnlockedBuildings(level).has(building);
}

/**
 * Get the level at which a building is first unlocked
 */
export function getBuildingUnlockLevel(building: BuildingType): SettlementLevel | null {
  for (let level = 1; level <= 10; level++) {
    const levelDef = SETTLEMENT_LEVELS[level as SettlementLevel];
    if (levelDef.unlockedBuildings.includes(building)) {
      return level as SettlementLevel;
    }
  }
  return null;
}
