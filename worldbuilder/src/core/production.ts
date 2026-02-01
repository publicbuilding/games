import { GameState, Building, Tile, TileType, Particle } from '../types';
import { getBuildingDef, BUILDINGS } from './buildings';
import { updateQuestProgress } from './quests';
import { floatingNumberSystem } from '../ui/feedback/floatingNumbers';
import { soundManager } from './sounds';
import { checkLevelUp } from './progression';

const RICE_CONSUMPTION_RATE = 0.3; // Rice per person per second
const MIN_RICE_FOR_GROWTH = 30;
const POPULATION_GROWTH_RATE = 0.08; // New person per second when rice > threshold

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
  amount: number,
  state: GameState
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

      // Add particle effect for resource gathering
      if (Math.random() < 0.3) {
        state.particles.push({
          x: building.x * 48 + 24,
          y: building.y * 48 + 24,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 - 1,
          life: 1,
          type: 'dust',
          color: 'rgba(200, 180, 140)',
        });
      }

      // If resource depleted, convert to plains
      if (tile.resourceAmount! <= 0) {
        tile.type = 'plains';
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

    // Check if building has workers (unless no workers needed)
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

    // Add production animation and floating number
    if (actualProduced > 0) {
      // Sound effect for production
      if (Math.random() < 0.1) { // Play less frequently to avoid spam
        soundManager.playProductionSound(def.type);
      }

      // Floating number popup occasionally
      if (Math.random() < 0.15) {
        floatingNumberSystem.addResourceProduction(
          building.x * 48 + 24,
          building.y * 48 + 24,
          resourceType,
          actualProduced
        );
      }

      // Particle animation
      if (Math.random() < 0.2) {
        state.particles.push({
          x: building.x * 48 + 24,
          y: building.y * 48 + 24,
          vx: (Math.random() - 0.5) * 1,
          vy: -Math.random() * 2,
          life: 1,
          type: 'smoke',
          color: 'rgba(100, 100, 100, 0.5)',
        });
      }
    }

    // Deplete source resources
    if (def.production.requires) {
      depleteAdjacentResource(state.map, building, actualProduced, state);
    }
  }
}

/**
 * Process population consumption and growth
 */
export function processPopulation(state: GameState, deltaSeconds: number): void {
  // Rice consumption for food
  const riceNeeded = state.population * RICE_CONSUMPTION_RATE * deltaSeconds;
  const previousPop = Math.floor(state.population);
  
  if (state.resources.rice >= riceNeeded) {
    state.resources.rice -= riceNeeded;

    // Population growth if rice surplus
    if (state.resources.rice > MIN_RICE_FOR_GROWTH && state.population < state.maxPopulation) {
      const growth = POPULATION_GROWTH_RATE * deltaSeconds;
      state.population = Math.min(state.population + growth, state.maxPopulation);
      state.workers = Math.floor(state.population);

      // Celebration for population milestones (every 10)
      const currentPop = Math.floor(state.population);
      if (currentPop > previousPop && currentPop % 10 === 0) {
        soundManager.playCelebrationSound('fanfare');
        const defaultX = 300;
        const defaultY = 300;
        const firstBuildingX = state.buildings[0]?.x ?? 0;
        const firstBuildingY = state.buildings[0]?.y ?? 0;
        floatingNumberSystem.addMilestone(
          firstBuildingX * 48 + 24 || defaultX,
          firstBuildingY * 48 + 24 || defaultY,
          `👤 Population ${currentPop}!`
        );
      } else if (currentPop > previousPop) {
        // Regular population growth popup
        const randomBuilding = state.buildings[Math.floor(Math.random() * state.buildings.length)];
        const popX = (randomBuilding?.x ?? 6) * 48 + 24;
        const popY = (randomBuilding?.y ?? 6) * 48 + 24;
        floatingNumberSystem.addPopulationGrowth(
          popX,
          popY,
          currentPop - previousPop
        );
      }
    }
  } else {
    // Starvation - consume all rice, population decreases
    state.resources.rice = 0;
    const starvationRate = 0.15 * deltaSeconds; // Lose 0.15 people per second
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

  // Update day/night cycle
  state.dayTime = (state.dayTime + deltaSeconds * 0.001) % 1; // Full day/night cycle every 1000 seconds

  // Update season every 60 seconds in-game
  const seasonProgress = (state.totalPlayTime / 1000 / 60) % 4;
  const seasons: ('spring' | 'summer' | 'autumn' | 'winter')[] = ['spring', 'summer', 'autumn', 'winter'];
  state.season = seasons[Math.floor(seasonProgress)];
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
export function calculateMaxStorage(state: GameState): any {
  const base: any = { 
    rice: 300, 
    tea: 200, 
    silk: 100, 
    jade: 150, 
    iron: 200, 
    bamboo: 300, 
    gold: 500 
  };

  for (const building of state.buildings) {
    const def = getBuildingDef(building.type);
    if (def.storage) {
      base.rice += (def.storage as any).rice ?? 0;
      base.tea += (def.storage as any).tea ?? 0;
      base.silk += (def.storage as any).silk ?? 0;
      base.jade += (def.storage as any).jade ?? 0;
      base.iron += (def.storage as any).iron ?? 0;
      base.bamboo += (def.storage as any).bamboo ?? 0;
      base.gold += def.storage.gold ?? 0;
    }
  }

  return base;
}

/**
 * Update particle system
 */
function updateParticles(state: GameState, deltaSeconds: number): void {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life -= deltaSeconds * 1.5; // Particle lifespan
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1; // Gravity

    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
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
  updateParticles(state, deltaSeconds);
  updateQuestProgress(state);

  // Check for level up
  const levelUpResult = checkLevelUp(state, state.lastSettlementLevel as any);
  if (levelUpResult.leveledUp) {
    state.lastSettlementLevel = levelUpResult.newLevel as any;
    // Mark that a level-up occurred (can be used for UI notifications)
    (state as any).levelUpNotification = {
      level: levelUpResult.newLevel,
      levelName: require('./progression').SETTLEMENT_LEVELS[levelUpResult.newLevel as any].name,
      rewards: levelUpResult.rewards,
    };
  }

  // Update timing
  state.lastUpdate = now;
  state.totalPlayTime += deltaMs;
}
