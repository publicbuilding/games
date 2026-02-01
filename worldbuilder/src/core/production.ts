import { GameState, Building, Tile, TileType } from '../types';
import { getBuildingDef, BUILDINGS } from './buildings';

const FOOD_CONSUMPTION_RATE = 0.5; // Food per person per second
const MIN_FOOD_FOR_GROWTH = 20;
const POPULATION_GROWTH_RATE = 0.1; // New person per second when food > threshold

/**
 * Get adjacent tiles to a position
 */
export function getAdjacentTiles(map: Tile[][], x: number, y: number): Tile[] {
  const adjacent: Tile[] = [];
  const directions = [
    [0, -1], [0, 1], [-1, 0], [1, 0], // Cardinal
    [-1, -1], [-1, 1], [1, -1], [1, 1], // Diagonal
  ];

  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (map[ny] && map[ny][nx]) {
      adjacent.push(map[ny][nx]);
    }
  }

  return adjacent;
}

/**
 * Check if a building has the required adjacent tile type
 */
export function hasRequiredAdjacency(map: Tile[][], building: Building): boolean {
  const def = getBuildingDef(building.type);
  if (!def.production?.requires) return true;

  const adjacent = getAdjacentTiles(map, building.x, building.y);
  return adjacent.some(
    (tile) => tile.type === def.production!.requires && (tile.resourceAmount ?? 0) > 0
  );
}

/**
 * Deplete resources from adjacent tiles
 */
export function depleteAdjacentResource(
  map: Tile[][],
  building: Building,
  amount: number
): number {
  const def = getBuildingDef(building.type);
  if (!def.production?.requires) return amount;

  const adjacent = getAdjacentTiles(map, building.x, building.y);
  let remaining = amount;

  for (const tile of adjacent) {
    if (tile.type === def.production.requires && (tile.resourceAmount ?? 0) > 0) {
      const depleted = Math.min(tile.resourceAmount!, remaining * 0.1); // Slow depletion
      tile.resourceAmount! -= depleted;
      remaining -= depleted * 10;

      // If resource depleted, convert to grass
      if (tile.resourceAmount! <= 0) {
        tile.type = 'grass';
        tile.resourceAmount = undefined;
      }

      if (remaining <= 0) break;
    }
  }

  return amount - Math.max(0, remaining);
}

/**
 * Process production for all buildings
 */
export function processProduction(state: GameState, deltaSeconds: number): void {
  for (const building of state.buildings) {
    const def = getBuildingDef(building.type);

    if (!def.production) continue;

    // Check if building has workers (unless premium/no workers needed)
    const hasWorkers = def.workers === 0 || building.workers >= def.workers;
    if (!hasWorkers) continue;

    // Check adjacency requirements
    if (def.production.requires && !hasRequiredAdjacency(state.map, building)) {
      continue;
    }

    // Calculate production rate (with speed boost)
    let rate = def.production.rate;
    if (building.speedBoostUntil && building.speedBoostUntil > Date.now()) {
      rate *= 2; // 2x speed boost
    }

    // Produce resources
    const produced = rate * deltaSeconds;
    const resourceType = def.production.output;
    const maxAmount = state.maxResources[resourceType];
    const newAmount = Math.min(state.resources[resourceType] + produced, maxAmount);
    const actualProduced = newAmount - state.resources[resourceType];

    state.resources[resourceType] = newAmount;

    // Deplete source resources
    if (def.production.requires) {
      depleteAdjacentResource(state.map, building, actualProduced);
    }
  }
}

/**
 * Process population consumption and growth
 */
export function processPopulation(state: GameState, deltaSeconds: number): void {
  // Food consumption
  const foodNeeded = state.population * FOOD_CONSUMPTION_RATE * deltaSeconds;
  
  if (state.resources.food >= foodNeeded) {
    state.resources.food -= foodNeeded;

    // Population growth if food surplus
    if (state.resources.food > MIN_FOOD_FOR_GROWTH && state.population < state.maxPopulation) {
      const growth = POPULATION_GROWTH_RATE * deltaSeconds;
      state.population = Math.min(state.population + growth, state.maxPopulation);
      state.workers = Math.floor(state.population);
    }
  } else {
    // Starvation - consume all food, population decreases
    state.resources.food = 0;
    const starvationRate = 0.2 * deltaSeconds; // Lose 0.2 people per second
    state.population = Math.max(1, state.population - starvationRate); // Never go below 1
    state.workers = Math.floor(state.population);

    // Remove workers from buildings if needed
    while (state.usedWorkers > state.workers) {
      const buildingWithWorkers = state.buildings.find((b) => b.workers > 0);
      if (buildingWithWorkers) {
        buildingWithWorkers.workers--;
        state.usedWorkers--;
      } else {
        break;
      }
    }
  }
}

/**
 * Calculate total housing capacity
 */
export function calculateMaxPopulation(state: GameState): number {
  let capacity = 5; // Base capacity

  for (const building of state.buildings) {
    const def = getBuildingDef(building.type);
    if (def.housing) {
      capacity += def.housing;
    }
  }

  return capacity;
}

/**
 * Calculate total storage capacity
 */
export function calculateMaxStorage(state: GameState): { wood: number; stone: number; food: number; gold: number } {
  const base = { wood: 200, stone: 200, food: 100, gold: 500 };

  for (const building of state.buildings) {
    const def = getBuildingDef(building.type);
    if (def.storage) {
      base.wood += def.storage.wood ?? 0;
      base.stone += def.storage.stone ?? 0;
      base.food += def.storage.food ?? 0;
      base.gold += def.storage.gold ?? 0;
    }
  }

  return base;
}

/**
 * Main game tick - process all game systems
 */
export function gameTick(state: GameState): void {
  const now = Date.now();
  const deltaMs = now - state.lastUpdate;
  const deltaSeconds = Math.min(deltaMs / 1000, 5); // Cap at 5 seconds to prevent huge jumps

  if (deltaSeconds <= 0) return;

  // Update capacities
  state.maxPopulation = calculateMaxPopulation(state);
  state.maxResources = calculateMaxStorage(state);

  // Process systems
  processProduction(state, deltaSeconds);
  processPopulation(state, deltaSeconds);

  // Update timing
  state.lastUpdate = now;
  state.totalPlayTime += deltaMs;
}
