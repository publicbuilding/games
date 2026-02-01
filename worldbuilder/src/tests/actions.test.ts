import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../types';
import { createInitialState } from '../core/gameState';
import { placeBuilding, demolishBuilding, assignWorkers, sellResource, canAfford, removeWorkers } from '../core/actions';
import { BUILDINGS } from '../core/buildings';

describe('Building Placement Validation', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('should allow placement on plains tiles', () => {
    // Find a plains tile
    let found = false;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains' && !state.map[y][x].building) {
          const result = placeBuilding(state, 'house', x, y);
          expect(result.success).toBe(true);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    expect(found).toBe(true);
  });

  it('should reject placement on water', () => {
    // Find or create a river tile
    let riverTile = null;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'river') {
          riverTile = { x, y };
          break;
        }
      }
      if (riverTile) break;
    }

    if (riverTile) {
      const result = placeBuilding(state, 'house', riverTile.x, riverTile.y);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot build');
    }
  });

  it('should reject placement on occupied tiles', () => {
    // Place first building
    let placedAt: { x: number; y: number } | null = null;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains') {
          const result = placeBuilding(state, 'house', x, y);
          if (result.success) {
            placedAt = { x, y };
            break;
          }
        }
      }
      if (placedAt) break;
    }

    expect(placedAt).not.toBeNull();

    // Try to place another building on the same tile
    const result = placeBuilding(state, 'ricePaddy', placedAt!.x, placedAt!.y);
    expect(result.success).toBe(false);
    expect(result.message).toContain('already');
  });

  it('should reject placement when cannot afford', () => {
    state.resources.gold = 0;

    let found = false;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains') {
          const result = placeBuilding(state, 'jadeMine', x, y);
          expect(result.success).toBe(false);
          expect(result.message).toContain('resources');
          found = true;
          break;
        }
      }
      if (found) break;
    }
    expect(found).toBe(true);
  });

  it('should reject out-of-bounds placement', () => {
    const result = placeBuilding(state, 'house', 1000, 1000);
    expect(result.success).toBe(false);
  });
});

describe('Building Placement and Cost Deduction', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('should deduct resources when placing building', () => {
    const houseCost = BUILDINGS.house.cost;
    const initialGold = state.resources.gold;

    let placed = false;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains') {
          const result = placeBuilding(state, 'house', x, y);
          if (result.success) {
            placed = true;
            break;
          }
        }
      }
      if (placed) break;
    }

    expect(placed).toBe(true);
    expect(state.resources.gold).toBe(initialGold - (houseCost.gold ?? 0));
  });

  it('should add building to state and map', () => {
    const initialBuildings = state.buildings.length;

    let placed = false;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains') {
          const result = placeBuilding(state, 'house', x, y);
          if (result.success) {
            placed = true;
            expect(state.buildings.length).toBe(initialBuildings + 1);
            expect(state.map[y][x].building).toBeDefined();
            break;
          }
        }
      }
      if (placed) break;
    }

    expect(placed).toBe(true);
  });
});

describe('Building Demolition', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('should refund 50% of resources when demolishing', () => {
    const houseCost = BUILDINGS.house.cost;
    const initialGold = state.resources.gold;

    let placedAt: { x: number; y: number } | null = null;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains') {
          const result = placeBuilding(state, 'house', x, y);
          if (result.success) {
            placedAt = { x, y };
            break;
          }
        }
      }
      if (placedAt) break;
    }

    // After placing: gold = initialGold - houseCost.gold
    const goldAfterPlace = state.resources.gold;
    expect(goldAfterPlace).toBe(initialGold - (houseCost.gold ?? 0));

    const result = demolishBuilding(state, placedAt!.x, placedAt!.y);

    expect(result.success).toBe(true);
    expect(state.resources.gold).toBe(goldAfterPlace + Math.floor((houseCost.gold ?? 0) * 0.5));
  });

  it('should remove building from state and map', () => {
    let placedAt: { x: number; y: number } | null = null;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains') {
          const result = placeBuilding(state, 'house', x, y);
          if (result.success) {
            placedAt = { x, y };
            break;
          }
        }
      }
      if (placedAt) break;
    }

    const buildingCountBefore = state.buildings.length;

    const result = demolishBuilding(state, placedAt!.x, placedAt!.y);
    expect(result.success).toBe(true);
    expect(state.buildings.length).toBe(buildingCountBefore - 1);
    expect(state.map[placedAt!.y][placedAt!.x].building).toBeUndefined();
  });

  it('should return workers when demolishing', () => {
    let placedAt: { x: number; y: number } | null = null;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains') {
          const result = placeBuilding(state, 'ricePaddy', x, y);
          if (result.success) {
            placedAt = { x, y };
            break;
          }
        }
      }
      if (placedAt) break;
    }

    const building = state.map[placedAt!.y][placedAt!.x].building!;
    assignWorkers(state, building, 2);

    expect(state.usedWorkers).toBe(2);

    demolishBuilding(state, placedAt!.x, placedAt!.y);

    expect(state.usedWorkers).toBe(0);
  });

  it('should fail when no building exists', () => {
    const result = demolishBuilding(state, 5, 5);
    expect(result.success).toBe(false);
  });
});

describe('Worker Management', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('should assign workers to buildings', () => {
    let building = null;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains') {
          const result = placeBuilding(state, 'ricePaddy', x, y);
          if (result.success) {
            building = state.map[y][x].building!;
            break;
          }
        }
      }
      if (building) break;
    }

    const result = assignWorkers(state, building, 2);

    expect(result.success).toBe(true);
    expect(building.workers).toBe(2);
    expect(state.usedWorkers).toBe(2);
  });

  it('should not assign more workers than available', () => {
    let building = null;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains') {
          const result = placeBuilding(state, 'ricePaddy', x, y);
          if (result.success) {
            building = state.map[y][x].building!;
            break;
          }
        }
      }
      if (building) break;
    }

    state.workers = 1;

    const result = assignWorkers(state, building, 10);

    expect(result.success).toBe(true);
    expect(building.workers).toBeLessThanOrEqual(1);
  });

  it('should not exceed building worker capacity', () => {
    let building = null;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains') {
          const result = placeBuilding(state, 'ricePaddy', x, y);
          if (result.success) {
            building = state.map[y][x].building!;
            break;
          }
        }
      }
      if (building) break;
    }

    const maxWorkers = BUILDINGS.ricePaddy.workers;
    assignWorkers(state, building, 100);

    expect(building.workers).toBeLessThanOrEqual(maxWorkers);
  });

  it('should remove workers from buildings', () => {
    let building = null;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains') {
          const result = placeBuilding(state, 'ricePaddy', x, y);
          if (result.success) {
            building = state.map[y][x].building!;
            break;
          }
        }
      }
      if (building) break;
    }

    assignWorkers(state, building, 2);
    expect(building.workers).toBe(2);

    const result = removeWorkers(state, building, 1);

    expect(result.success).toBe(true);
    expect(building.workers).toBe(1);
    expect(state.usedWorkers).toBe(1);
  });
});

describe('Market Trading', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('should require a market to sell', () => {
    state.resources.rice = 50;

    const result = sellResource(state, 'rice', 10);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Market');
  });

  it('should sell resources for gold', () => {
    // Place a market
    let marketPlaced = false;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains') {
          const result = placeBuilding(state, 'market', x, y);
          if (result.success) {
            marketPlaced = true;
            break;
          }
        }
      }
      if (marketPlaced) break;
    }

    expect(marketPlaced).toBe(true);

    const initialRice = state.resources.rice;
    const initialGold = state.resources.gold;

    const result = sellResource(state, 'rice', 10);

    expect(result.success).toBe(true);
    expect(state.resources.rice).toBe(initialRice - 10);
    // Rice sells for 1g each (basic food)
    expect(state.resources.gold).toBe(initialGold + 10);
  });

  it('should not allow selling gold', () => {
    let marketPlaced = false;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains') {
          const result = placeBuilding(state, 'market', x, y);
          if (result.success) {
            marketPlaced = true;
            break;
          }
        }
      }
      if (marketPlaced) break;
    }

    const result = sellResource(state, 'gold', 10);

    expect(result.success).toBe(false);
  });

  it('should only sell available resources', () => {
    let marketPlaced = false;
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'plains') {
          const result = placeBuilding(state, 'market', x, y);
          if (result.success) {
            marketPlaced = true;
            break;
          }
        }
      }
      if (marketPlaced) break;
    }

    state.resources.rice = 5;
    const initialGold = state.resources.gold;

    const result = sellResource(state, 'rice', 100);

    expect(result.success).toBe(true);
    expect(state.resources.rice).toBe(0);
    expect(state.resources.gold).toBe(initialGold + 5); // 5 * 1g
  });
});

describe('Affordability Checks', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('should correctly check affordability', () => {
    // House costs 30 gold, 15 bamboo
    state.resources = { rice: 50, tea: 0, silk: 0, jade: 0, iron: 0, bamboo: 15, gold: 30 };
    expect(canAfford(state, 'house')).toBe(true);

    state.resources.gold = 29;
    expect(canAfford(state, 'house')).toBe(false);

    state.resources.gold = 30;
    state.resources.bamboo = 14;
    expect(canAfford(state, 'house')).toBe(false);
  });
});
