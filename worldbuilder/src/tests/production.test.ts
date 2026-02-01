import { describe, it, expect, beforeEach } from 'vitest';
import { GameState, Building, Tile } from '../types';
import { createInitialState } from '../core/gameState';
import {
  processProduction,
  processPopulation,
  calculateMaxPopulation,
  calculateMaxStorage,
  hasRequiredAdjacency,
  getAdjacentTiles,
} from '../core/production';
import { placeBuilding } from '../core/actions';

describe('Resource Production', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
    // Reset to known values
    state.resources = { wood: 100, stone: 50, food: 100, gold: 500 };
    state.population = 10;
    state.workers = 10;
    state.usedWorkers = 0;
  });

  it('should produce resources from farms without adjacency requirements', () => {
    // Start with a specific food amount to avoid cap issues
    state.resources.food = 50;
    state.maxResources.food = 200;
    
    // Find a grass tile and place a farm
    let placed = false;
    for (let y = 0; y < state.map.length && !placed; y++) {
      for (let x = 0; x < state.map[y].length && !placed; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'farm', x, y);
          if (result.success) {
            const building = state.map[y][x].building!;
            building.workers = 2; // Fully staffed
            state.usedWorkers = 2;
            placed = true;
          }
        }
      }
    }

    expect(placed).toBe(true);
    const initialFood = state.resources.food;
    
    // Process 1 second of production (NOT gameTick which also consumes food)
    processProduction(state, 1);
    
    // Farm produces 3 food/s
    expect(state.resources.food).toBeGreaterThan(initialFood);
    expect(state.resources.food).toBeCloseTo(initialFood + 3, 1);
  });

  it('should not produce without workers', () => {
    // Place a farm but don't assign workers
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          placeBuilding(state, 'farm', x, y);
          break;
        }
      }
      if (state.buildings.length > 0) break;
    }

    const initialFood = state.resources.food;
    processProduction(state, 1);
    
    // No production without workers
    expect(state.resources.food).toBe(initialFood);
  });

  it('should respect resource caps', () => {
    // Set up to hit the cap
    state.resources.food = state.maxResources.food - 1;
    
    // Place and staff a farm
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'farm', x, y);
          if (result.success) {
            state.map[y][x].building!.workers = 2;
            state.usedWorkers = 2;
            break;
          }
        }
      }
      if (state.buildings.length > 0) break;
    }

    processProduction(state, 10); // 10 seconds would produce 30 food
    
    // Should cap at max
    expect(state.resources.food).toBe(state.maxResources.food);
  });

  it('should require adjacency for lumber mills', () => {
    // Find a grass tile NOT next to trees
    for (let y = 2; y < state.map.length - 2; y++) {
      for (let x = 2; x < state.map[y].length - 2; x++) {
        if (state.map[y][x].type === 'grass') {
          const adjacent = getAdjacentTiles(state.map, x, y);
          const hasTreesAdjacent = adjacent.some(t => t.type === 'trees' && (t.resourceAmount ?? 0) > 0);
          
          if (!hasTreesAdjacent) {
            const result = placeBuilding(state, 'lumberMill', x, y);
            expect(result.success).toBe(false);
            expect(result.message).toContain('next to trees');
            return;
          }
        }
      }
    }
    // If all grass has adjacent trees, skip this test
    expect(true).toBe(true);
  });

  it('should deplete adjacent resources over time', () => {
    // Find a grass tile next to trees
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const adjacent = getAdjacentTiles(state.map, x, y);
          const treesTile = adjacent.find(t => t.type === 'trees' && (t.resourceAmount ?? 0) > 0);
          
          if (treesTile) {
            const initialTreeResource = treesTile.resourceAmount!;
            const result = placeBuilding(state, 'lumberMill', x, y);
            
            if (result.success) {
              state.map[y][x].building!.workers = 2;
              state.usedWorkers = 2;
              
              // Process some time
              processProduction(state, 10);
              
              // Resource should be depleted
              expect(treesTile.resourceAmount).toBeLessThan(initialTreeResource);
              return;
            }
          }
        }
      }
    }
  });
});

describe('Population Mechanics', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
    state.resources = { wood: 100, stone: 50, food: 100, gold: 200 };
    state.population = 5;
    state.maxPopulation = 10;
    state.workers = 5;
    state.usedWorkers = 0;
  });

  it('should consume food based on population', () => {
    const initialFood = state.resources.food;
    processPopulation(state, 1);
    
    // 5 population * 0.5 food/s = 2.5 food consumed
    expect(state.resources.food).toBeCloseTo(initialFood - 2.5, 1);
  });

  it('should grow population when food is abundant', () => {
    state.resources.food = 100; // Well above threshold of 20
    state.population = 5;
    state.maxPopulation = 20;
    
    processPopulation(state, 10);
    
    // Should grow (0.1 pop/s when food > 20)
    expect(state.population).toBeGreaterThan(5);
  });

  it('should not grow population beyond max', () => {
    state.resources.food = 100;
    state.population = 10;
    state.maxPopulation = 10;
    
    processPopulation(state, 10);
    
    expect(state.population).toBeLessThanOrEqual(10);
  });

  it('should decrease population during starvation', () => {
    state.resources.food = 0;
    state.population = 10;
    state.workers = 10;
    
    processPopulation(state, 5);
    
    // Population should decrease (0.2/s starvation rate)
    expect(state.population).toBeLessThan(10);
    expect(state.workers).toBeLessThan(10);
  });

  it('should never let population drop below 1', () => {
    state.resources.food = 0;
    state.population = 1;
    state.workers = 1;
    
    processPopulation(state, 100); // Long starvation
    
    expect(state.population).toBeGreaterThanOrEqual(1);
  });

  it('should remove workers from buildings during starvation', () => {
    state.resources.food = 0;
    state.population = 5;
    state.workers = 5;
    
    // Create a mock building with workers
    const building: Building = {
      type: 'farm',
      x: 5,
      y: 5,
      level: 1,
      workers: 2,
      productionProgress: 0,
    };
    state.buildings.push(building);
    state.usedWorkers = 2;
    
    // Starve until workers < usedWorkers
    processPopulation(state, 20);
    
    // Workers should have been removed from buildings
    expect(state.usedWorkers).toBeLessThanOrEqual(state.workers);
  });
});

describe('Housing and Storage', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
    state.resources = { wood: 100, stone: 100, food: 50, gold: 500 };
  });

  it('should calculate max population from houses', () => {
    const baseCapacity = 5;
    expect(calculateMaxPopulation(state)).toBe(baseCapacity);
    
    // Add a house (provides +4 housing)
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'house', x, y);
          if (result.success) {
            expect(calculateMaxPopulation(state)).toBe(baseCapacity + 4);
            return;
          }
        }
      }
    }
  });

  it('should calculate storage capacity from warehouses', () => {
    const baseStorage = calculateMaxStorage(state);
    expect(baseStorage.wood).toBe(200);
    
    // Add a warehouse (+100 wood, +100 stone, +50 food, +200 gold)
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'warehouse', x, y);
          if (result.success) {
            const newStorage = calculateMaxStorage(state);
            expect(newStorage.wood).toBe(300);
            expect(newStorage.stone).toBe(300);
            expect(newStorage.food).toBe(150);
            expect(newStorage.gold).toBe(700);
            return;
          }
        }
      }
    }
  });
});

describe('Adjacency Detection', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('should find adjacent tiles correctly', () => {
    const adjacent = getAdjacentTiles(state.map, 5, 5);
    
    // Should have 8 adjacent tiles (including diagonals)
    expect(adjacent.length).toBe(8);
  });

  it('should handle edge tiles', () => {
    const adjacent = getAdjacentTiles(state.map, 0, 0);
    
    // Corner should have only 3 adjacent tiles
    expect(adjacent.length).toBe(3);
  });

  it('should correctly check adjacency requirements', () => {
    // Find a lumber mill next to trees
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].type === 'grass') {
          const adjacent = getAdjacentTiles(state.map, x, y);
          const hasTreesAdjacent = adjacent.some(t => t.type === 'trees' && (t.resourceAmount ?? 0) > 0);
          
          if (hasTreesAdjacent) {
            const result = placeBuilding(state, 'lumberMill', x, y);
            if (result.success) {
              const building = state.map[y][x].building!;
              expect(hasRequiredAdjacency(state.map, building)).toBe(true);
              return;
            }
          }
        }
      }
    }
  });
});
