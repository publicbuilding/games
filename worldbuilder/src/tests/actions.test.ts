import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../types';
import { createInitialState } from '../core/gameState';
import {
  canAfford,
  canPlaceBuilding,
  placeBuilding,
  demolishBuilding,
  assignWorkers,
  removeWorkers,
  sellResource,
  applySpeedBoost,
} from '../core/actions';
import { BUILDINGS } from '../core/buildings';

describe('Building Placement Validation', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
    state.resources = { wood: 500, stone: 500, food: 100, gold: 1000 };
    state.premiumCurrency = 100;
  });

  it('should allow placement on grass tiles', () => {
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = canPlaceBuilding(state, 'house', x, y);
          expect(result.success).toBe(true);
          return;
        }
      }
    }
  });

  it('should reject placement on water', () => {
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'water') {
          const result = canPlaceBuilding(state, 'house', x, y);
          expect(result.success).toBe(false);
          expect(result.message).toContain('Cannot build on water');
          return;
        }
      }
    }
  });

  it('should reject placement on occupied tiles', () => {
    // First place a building
    let placedAt: { x: number; y: number } | null = null;
    
    for (let y = 0; y < state.map.length && !placedAt; y++) {
      for (let x = 0; x < state.map[y].length && !placedAt; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'house', x, y);
          if (result.success) {
            placedAt = { x, y };
          }
        }
      }
    }

    expect(placedAt).not.toBeNull();
    
    // Try to place another building on the same tile
    const result = canPlaceBuilding(state, 'farm', placedAt!.x, placedAt!.y);
    expect(result.success).toBe(false);
    expect(result.message).toContain('already has a building');
  });

  it('should reject placement when cannot afford', () => {
    state.resources = { wood: 0, stone: 0, food: 0, gold: 0 };
    
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = canPlaceBuilding(state, 'house', x, y);
          expect(result.success).toBe(false);
          expect(result.message).toContain('Not enough resources');
          return;
        }
      }
    }
  });

  it('should reject premium buildings without enough gems', () => {
    state.premiumCurrency = 0;
    
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = canPlaceBuilding(state, 'premiumFactory', x, y);
          expect(result.success).toBe(false);
          expect(result.message).toContain('gems');
          return;
        }
      }
    }
  });

  it('should reject out-of-bounds placement', () => {
    const result = canPlaceBuilding(state, 'house', -1, -1);
    expect(result.success).toBe(false);
    
    const result2 = canPlaceBuilding(state, 'house', 1000, 1000);
    expect(result2.success).toBe(false);
  });
});

describe('Building Placement Actions', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
    state.resources = { wood: 500, stone: 500, food: 100, gold: 1000 };
    state.premiumCurrency = 100;
  });

  it('should deduct resources when placing building', () => {
    const houseCost = BUILDINGS.house.cost;
    const initialGold = state.resources.gold;
    const initialWood = state.resources.wood;
    const initialStone = state.resources.stone;
    
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'house', x, y);
          if (result.success) {
            expect(state.resources.gold).toBe(initialGold - (houseCost.gold ?? 0));
            expect(state.resources.wood).toBe(initialWood - (houseCost.wood ?? 0));
            expect(state.resources.stone).toBe(initialStone - (houseCost.stone ?? 0));
            return;
          }
        }
      }
    }
  });

  it('should add building to state and map', () => {
    const initialBuildingCount = state.buildings.length;
    
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'house', x, y);
          if (result.success) {
            expect(state.buildings.length).toBe(initialBuildingCount + 1);
            expect(state.map[y][x].building).toBeDefined();
            expect(state.map[y][x].building!.type).toBe('house');
            return;
          }
        }
      }
    }
  });
});

describe('Building Demolition', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
    state.resources = { wood: 500, stone: 500, food: 100, gold: 1000 };
  });

  it('should refund 50% of resources when demolishing', () => {
    // Place a house
    let placedAt: { x: number; y: number } | null = null;
    
    for (let y = 0; y < state.map.length && !placedAt; y++) {
      for (let x = 0; x < state.map[y].length && !placedAt; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'house', x, y);
          if (result.success) {
            placedAt = { x, y };
          }
        }
      }
    }

    const goldBeforeDemolish = state.resources.gold;
    const houseCost = BUILDINGS.house.cost;
    
    const result = demolishBuilding(state, placedAt!.x, placedAt!.y);
    expect(result.success).toBe(true);
    
    // Should refund 50%
    const expectedRefund = Math.floor((houseCost.gold ?? 0) * 0.5);
    expect(state.resources.gold).toBe(goldBeforeDemolish + expectedRefund);
  });

  it('should remove building from state and map', () => {
    // Place a house
    let placedAt: { x: number; y: number } | null = null;
    
    for (let y = 0; y < state.map.length && !placedAt; y++) {
      for (let x = 0; x < state.map[y].length && !placedAt; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'house', x, y);
          if (result.success) {
            placedAt = { x, y };
          }
        }
      }
    }

    const buildingCountBefore = state.buildings.length;
    
    const result = demolishBuilding(state, placedAt!.x, placedAt!.y);
    expect(result.success).toBe(true);
    expect(state.buildings.length).toBe(buildingCountBefore - 1);
    expect(state.map[placedAt!.y][placedAt!.x].building).toBeUndefined();
  });

  it('should return workers when demolishing', () => {
    state.workers = 10;
    state.usedWorkers = 0;
    
    // Place a farm
    let placedAt: { x: number; y: number } | null = null;
    
    for (let y = 0; y < state.map.length && !placedAt; y++) {
      for (let x = 0; x < state.map[y].length && !placedAt; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'farm', x, y);
          if (result.success) {
            placedAt = { x, y };
            // Assign workers
            const building = state.map[y][x].building!;
            assignWorkers(state, building, 2);
          }
        }
      }
    }

    expect(state.usedWorkers).toBe(2);
    
    demolishBuilding(state, placedAt!.x, placedAt!.y);
    
    expect(state.usedWorkers).toBe(0);
  });

  it('should fail when no building exists', () => {
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass' && !state.map[y][x].building) {
          const result = demolishBuilding(state, x, y);
          expect(result.success).toBe(false);
          expect(result.message).toContain('No building');
          return;
        }
      }
    }
  });
});

describe('Worker Assignment', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
    state.resources = { wood: 500, stone: 500, food: 100, gold: 1000 };
    state.workers = 10;
    state.usedWorkers = 0;
  });

  it('should assign workers to buildings', () => {
    // Place a farm
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'farm', x, y);
          if (result.success) {
            const building = state.map[y][x].building!;
            const assignResult = assignWorkers(state, building, 2);
            
            expect(assignResult.success).toBe(true);
            expect(building.workers).toBe(2);
            expect(state.usedWorkers).toBe(2);
            return;
          }
        }
      }
    }
  });

  it('should not assign more workers than available', () => {
    state.workers = 1;
    
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'farm', x, y);
          if (result.success) {
            const building = state.map[y][x].building!;
            const assignResult = assignWorkers(state, building, 5);
            
            // Should only assign 1 (all available)
            expect(building.workers).toBe(1);
            expect(state.usedWorkers).toBe(1);
            return;
          }
        }
      }
    }
  });

  it('should not exceed building worker capacity', () => {
    state.workers = 10;
    
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'farm', x, y);
          if (result.success) {
            const building = state.map[y][x].building!;
            // Farm needs 2 workers
            assignWorkers(state, building, 10);
            
            expect(building.workers).toBe(2);
            return;
          }
        }
      }
    }
  });

  it('should remove workers from buildings', () => {
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'farm', x, y);
          if (result.success) {
            const building = state.map[y][x].building!;
            assignWorkers(state, building, 2);
            
            const removeResult = removeWorkers(state, building, 1);
            
            expect(removeResult.success).toBe(true);
            expect(building.workers).toBe(1);
            expect(state.usedWorkers).toBe(1);
            return;
          }
        }
      }
    }
  });
});

describe('Market Trading', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
    state.resources = { wood: 100, stone: 100, food: 100, gold: 500 };
  });

  it('should require a market to sell', () => {
    const result = sellResource(state, 'wood', 10);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Market');
  });

  it('should sell resources for gold', () => {
    // Place a market
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'market', x, y);
          if (result.success) break;
        }
      }
      if (state.buildings.some(b => b.type === 'market')) break;
    }

    const initialWood = state.resources.wood;
    const initialGold = state.resources.gold;
    
    const result = sellResource(state, 'wood', 10);
    
    expect(result.success).toBe(true);
    expect(state.resources.wood).toBe(initialWood - 10);
    // Wood sells for 5g each
    expect(state.resources.gold).toBe(initialGold + 50);
  });

  it('should not allow selling gold', () => {
    // Place a market first
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'market', x, y);
          if (result.success) break;
        }
      }
      if (state.buildings.some(b => b.type === 'market')) break;
    }

    const result = sellResource(state, 'gold', 10);
    expect(result.success).toBe(false);
  });

  it('should only sell available resources', () => {
    // Place a market
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'market', x, y);
          if (result.success) break;
        }
      }
      if (state.buildings.some(b => b.type === 'market')) break;
    }

    state.resources.wood = 5;
    const initialGold = state.resources.gold;
    
    const result = sellResource(state, 'wood', 100);
    
    expect(result.success).toBe(true);
    expect(state.resources.wood).toBe(0);
    expect(state.resources.gold).toBe(initialGold + 25); // 5 wood * 5g
  });
});

describe('Premium Features', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
    state.resources = { wood: 500, stone: 500, food: 100, gold: 1000 };
    state.premiumCurrency = 100;
  });

  it('should allow premium buildings with enough gems', () => {
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'premiumFactory', x, y);
          if (result.success) {
            expect(state.premiumCurrency).toBe(50); // 100 - 50 cost
            return;
          }
        }
      }
    }
  });

  it('should apply speed boost', () => {
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'farm', x, y);
          if (result.success) {
            const building = state.map[y][x].building!;
            const initialGems = state.premiumCurrency;
            
            const boostResult = applySpeedBoost(state, building, 60000);
            
            expect(boostResult.success).toBe(true);
            expect(state.premiumCurrency).toBe(initialGems - 5);
            expect(building.speedBoostUntil).toBeGreaterThan(Date.now());
            return;
          }
        }
      }
    }
  });

  it('should fail speed boost without gems', () => {
    state.premiumCurrency = 0;
    
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'farm', x, y);
          if (result.success) {
            const building = state.map[y][x].building!;
            const boostResult = applySpeedBoost(state, building, 60000);
            
            expect(boostResult.success).toBe(false);
            return;
          }
        }
      }
    }
  });
});

describe('Affordability Checks', () => {
  it('should correctly check affordability', () => {
    const state = createInitialState();
    
    // House costs 30 gold, 20 wood, 10 stone
    state.resources = { wood: 20, stone: 10, food: 50, gold: 30 };
    expect(canAfford(state, 'house')).toBe(true);
    
    state.resources.gold = 29;
    expect(canAfford(state, 'house')).toBe(false);
    
    state.resources = { wood: 19, stone: 10, food: 50, gold: 30 };
    expect(canAfford(state, 'house')).toBe(false);
  });
});
