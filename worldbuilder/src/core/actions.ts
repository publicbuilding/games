import { GameState, Building, BuildingType, ResourceType } from '../types';
import { getBuildingDef, MARKET_PRICES } from './buildings';
import { getAdjacentTiles } from './production';
import { getCurrentSettlementLevel, isBuildingUnlocked, getBuildingUnlockLevel } from './progression';

export interface ActionResult {
  success: boolean;
  message: string;
}

/**
 * Check if player can afford a building
 */
export function canAfford(state: GameState, type: BuildingType): boolean {
  const def = getBuildingDef(type);
  for (const [resource, amount] of Object.entries(def.cost)) {
    if ((state.resources[resource as ResourceType] ?? 0) < (amount ?? 0)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if a tile is valid for building placement
 */
export function canPlaceBuilding(
  state: GameState,
  type: BuildingType,
  x: number,
  y: number
): ActionResult {
  // Check bounds
  if (!state.map[y] || !state.map[y][x]) {
    return { success: false, message: 'Invalid position' };
  }

  const tile = state.map[y][x];

  // Check if tile is buildable (only on plains)
  if (tile.type !== 'plains') {
    return { success: false, message: `Cannot build on ${tile.type}` };
  }

  // Check if tile already has building
  if (tile.building) {
    return { success: false, message: 'Tile already has a building' };
  }

  // Check building unlock level
  const currentLevel = getCurrentSettlementLevel(state);
  if (!isBuildingUnlocked(type, currentLevel)) {
    const unlockLevel = getBuildingUnlockLevel(type);
    return {
      success: false,
      message: `Unlocked at Level ${unlockLevel}`,
    };
  }

  // Check if player can afford
  if (!canAfford(state, type)) {
    return { success: false, message: 'Not enough resources' };
  }

  const def = getBuildingDef(type);

  // Check premium status
  if (def.premium && state.premiumCurrency < 50) {
    return { success: false, message: 'Requires 50 gems (Premium)' };
  }

  // Check adjacency requirements for production buildings
  if (def.production?.requires) {
    const adjacent = getAdjacentTiles(state.map, x, y);
    const hasRequired = adjacent.some(
      (t) => t.type === def.production!.requires && (t.resourceAmount ?? 0) > 0
    );
    if (!hasRequired) {
      return {
        success: false,
        message: `Must be placed next to ${def.production.requires}`,
      };
    }
  }

  return { success: true, message: 'OK' };
}

/**
 * Place a building on the map
 */
export function placeBuilding(
  state: GameState,
  type: BuildingType,
  x: number,
  y: number
): ActionResult {
  const canPlace = canPlaceBuilding(state, type, x, y);
  if (!canPlace.success) return canPlace;

  const def = getBuildingDef(type);

  // Deduct cost
  for (const [resource, amount] of Object.entries(def.cost)) {
    state.resources[resource as ResourceType] -= amount ?? 0;
  }

  // Deduct premium currency if premium building
  if (def.premium) {
    state.premiumCurrency -= 50;
  }

  // Create building
  const building: Building = {
    type,
    x,
    y,
    level: 1,
    workers: 0,
    productionProgress: 0,
  };

  state.buildings.push(building);
  state.map[y][x].building = building;

  return { success: true, message: `Built ${def.name}!` };
}

/**
 * Demolish a building
 */
export function demolishBuilding(
  state: GameState,
  x: number,
  y: number
): ActionResult {
  const tile = state.map[y]?.[x];
  if (!tile?.building) {
    return { success: false, message: 'No building here' };
  }

  const building = tile.building;
  const def = getBuildingDef(building.type);

  // Return workers
  state.usedWorkers -= building.workers;

  // Refund 50% of resources
  for (const [resource, amount] of Object.entries(def.cost)) {
    const refund = Math.floor((amount ?? 0) * 0.5);
    state.resources[resource as ResourceType] = Math.min(
      state.resources[resource as ResourceType] + refund,
      state.maxResources[resource as ResourceType]
    );
  }

  // Remove building
  state.buildings = state.buildings.filter((b) => b !== building);
  tile.building = undefined;

  return { success: true, message: `Demolished ${def.name}. 50% resources refunded.` };
}

/**
 * Assign workers to a building
 */
export function assignWorkers(
  state: GameState,
  building: Building,
  count: number
): ActionResult {
  const def = getBuildingDef(building.type);
  const availableWorkers = state.workers - state.usedWorkers;
  const neededWorkers = def.workers - building.workers;
  const toAssign = Math.min(count, availableWorkers, neededWorkers);

  if (toAssign <= 0) {
    return { success: false, message: 'No workers available or building fully staffed' };
  }

  building.workers += toAssign;
  state.usedWorkers += toAssign;

  return { success: true, message: `Assigned ${toAssign} worker(s)` };
}

/**
 * Remove workers from a building
 */
export function removeWorkers(
  state: GameState,
  building: Building,
  count: number
): ActionResult {
  const toRemove = Math.min(count, building.workers);
  if (toRemove <= 0) {
    return { success: false, message: 'No workers to remove' };
  }

  building.workers -= toRemove;
  state.usedWorkers -= toRemove;

  return { success: true, message: `Removed ${toRemove} worker(s)` };
}

/**
 * Sell resources at market
 */
export function sellResource(
  state: GameState,
  resource: ResourceType,
  amount: number
): ActionResult {
  if (resource === 'gold') {
    return { success: false, message: "Can't sell gold" };
  }

  // Check if player has a market
  const hasMarket = state.buildings.some((b) => b.type === 'market');
  if (!hasMarket) {
    return { success: false, message: 'Build a Market first!' };
  }

  const available = state.resources[resource];
  const toSell = Math.min(amount, available);

  if (toSell <= 0) {
    return { success: false, message: `No ${resource} to sell` };
  }

  const price = MARKET_PRICES[resource] ?? 1;
  const goldGained = Math.floor(toSell * price);

  state.resources[resource] -= toSell;
  state.resources.gold = Math.min(
    state.resources.gold + goldGained,
    state.maxResources.gold
  );

  return { success: true, message: `Sold ${Math.floor(toSell)} ${resource} for ${goldGained} gold` };
}

/**
 * Apply speed boost to a building (premium feature)
 */
export function applySpeedBoost(
  state: GameState,
  building: Building,
  durationMs: number = 60000
): ActionResult {
  const gemCost = 5;
  if (state.premiumCurrency < gemCost) {
    return { success: false, message: 'Not enough gems' };
  }

  state.premiumCurrency -= gemCost;
  building.speedBoostUntil = Date.now() + durationMs;

  return { success: true, message: `Speed boost active for ${durationMs / 1000}s!` };
}

/**
 * Scout and reveal new territory
 * Expands the fog of war based on direction
 */
export function scoutTerritory(
  state: GameState,
  direction: 'north' | 'south' | 'east' | 'west',
  scoutCost: number = 50
): ActionResult {
  // Check if player can afford scouting
  if (state.resources.gold < scoutCost) {
    return { success: false, message: `Need ${scoutCost} gold to scout (currently have ${state.resources.gold})` };
  }

  const { width, height } = { width: state.map[0]?.length || 40, height: state.map.length || 30 };
  const tileSize = 20; // Reveal 20x20 tile area
  
  // Determine scout area based on direction
  let revealX = 0, revealY = 0;
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  
  switch (direction) {
    case 'north':
      revealY = Math.max(0, centerY - 25);
      revealX = centerX - Math.floor(tileSize / 2);
      break;
    case 'south':
      revealY = Math.min(height - tileSize, centerY + 15);
      revealX = centerX - Math.floor(tileSize / 2);
      break;
    case 'east':
      revealX = Math.min(width - tileSize, centerX + 15);
      revealY = centerY - Math.floor(tileSize / 2);
      break;
    case 'west':
      revealX = Math.max(0, centerX - 25);
      revealY = centerY - Math.floor(tileSize / 2);
      break;
  }

  // Reveal the scouted territory
  let revealedCount = 0;
  for (let y = revealY; y < Math.min(revealY + tileSize, height); y++) {
    for (let x = revealX; x < Math.min(revealX + tileSize, width); x++) {
      if (state.visibilityGrid?.[y] && !state.visibilityGrid[y][x]) {
        state.visibilityGrid[y][x] = true;
        revealedCount++;
      }
      if (state.exploredAreas && !state.exploredAreas.has(`${x},${y}`)) {
        state.exploredAreas.add(`${x},${y}`);
      }
    }
  }

  // Deduct cost
  state.resources.gold -= scoutCost;

  return {
    success: true,
    message: `Scouted ${direction}! Revealed ${revealedCount} new tiles.`,
  };
}
