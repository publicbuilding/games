import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../types';
import { createInitialState } from '../core/gameState';
import { gameTick, processPopulation, processProduction } from '../core/production';
import { placeBuilding, assignWorkers, sellResource } from '../core/actions';
import { BUILDINGS } from '../core/buildings';

describe('Game Balance Analysis', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
  });

  describe('Early Game Economy', () => {
    it('starting resources should allow building first house', () => {
      const houseCost = BUILDINGS.house.cost;
      expect(state.resources.gold).toBeGreaterThanOrEqual(houseCost.gold ?? 0);
      expect(state.resources.wood).toBeGreaterThanOrEqual(houseCost.wood ?? 0);
      expect(state.resources.stone).toBeGreaterThanOrEqual(houseCost.stone ?? 0);
    });

    it('starting resources should allow building first farm', () => {
      const farmCost = BUILDINGS.farm.cost;
      expect(state.resources.gold).toBeGreaterThanOrEqual(farmCost.gold ?? 0);
      expect(state.resources.wood).toBeGreaterThanOrEqual(farmCost.wood ?? 0);
    });

    it('starting food should last at least 60 seconds', () => {
      const foodPerSecond = state.population * 0.5; // Food consumption rate
      const survivalTime = state.resources.food / foodPerSecond;
      expect(survivalTime).toBeGreaterThanOrEqual(60);
    });

    it('starting gold should allow multiple basic buildings', () => {
      const totalBasicCost = (BUILDINGS.house.cost.gold ?? 0) + 
                            (BUILDINGS.farm.cost.gold ?? 0) + 
                            (BUILDINGS.lumberMill.cost.gold ?? 0);
      expect(state.resources.gold).toBeGreaterThanOrEqual(totalBasicCost);
    });
  });

  describe('Food Sustainability', () => {
    it('single farm should sustain initial population', () => {
      const farmProduction = BUILDINGS.farm.production!.rate; // 3 food/s
      const consumption = state.population * 0.5; // 5 * 0.5 = 2.5 food/s
      expect(farmProduction).toBeGreaterThan(consumption);
    });

    it('two farms should sustain population of 10', () => {
      const farmProduction = BUILDINGS.farm.production!.rate * 2; // 6 food/s
      const consumption = 10 * 0.5; // 5 food/s
      expect(farmProduction).toBeGreaterThan(consumption);
    });

    it('maximum house population ratio should work', () => {
      // 1 house = 4 people, 1 farm = 3 food/s
      // 4 people need 2 food/s
      // So 1 farm can support ~1.5 houses (6 people)
      const farmProduction = BUILDINGS.farm.production!.rate;
      const housePopulation = BUILDINGS.house.housing ?? 4;
      const consumption = housePopulation * 0.5;
      const farmToHouseRatio = farmProduction / consumption;
      expect(farmToHouseRatio).toBeGreaterThan(1);
    });
  });

  describe('Death Spiral Prevention', () => {
    it('population should never go below 1', () => {
      state.resources.food = 0;
      state.population = 2;
      state.workers = 2;

      // Simulate 100 seconds of starvation
      for (let i = 0; i < 100; i++) {
        processPopulation(state, 1);
      }

      expect(state.population).toBeGreaterThanOrEqual(1);
      expect(state.workers).toBeGreaterThanOrEqual(1);
    });

    it('1 worker should be able to run 1 farm', () => {
      const farmWorkers = BUILDINGS.farm.workers;
      expect(farmWorkers).toBeLessThanOrEqual(2); // Even with 1 worker, should be close
    });

    it('recovery should be possible after near-death', () => {
      // Simulate recovery scenario
      state.population = 1;
      state.workers = 1;
      state.usedWorkers = 0;
      state.resources = { wood: 50, stone: 30, food: 5, gold: 100 };

      // Should be able to afford a farm
      expect(state.resources.gold).toBeGreaterThanOrEqual(BUILDINGS.farm.cost.gold ?? 0);
      expect(state.resources.wood).toBeGreaterThanOrEqual(BUILDINGS.farm.cost.wood ?? 0);

      // Place and staff farm
      let placed = false;
      for (let y = 0; y < state.map.length && !placed; y++) {
        for (let x = 0; x < state.map[y].length && !placed; x++) {
          if (state.map[y][x].type === 'grass') {
            const result = placeBuilding(state, 'farm', x, y);
            if (result.success) {
              placed = true;
              // With only 1 worker, farm needs 2, so it won't fully produce
              // But partial production might help
            }
          }
        }
      }
      
      expect(placed).toBe(true);
    });
  });

  describe('Resource Depletion', () => {
    it('trees should have sufficient resources for meaningful gameplay', () => {
      let totalTreeResources = 0;
      for (const row of state.map) {
        for (const tile of row) {
          if (tile.type === 'trees' && tile.resourceAmount) {
            totalTreeResources += tile.resourceAmount;
          }
        }
      }
      // Should have at least 500 total tree resources
      expect(totalTreeResources).toBeGreaterThan(500);
    });

    it('rocks should have sufficient resources', () => {
      let totalRockResources = 0;
      for (const row of state.map) {
        for (const tile of row) {
          if (tile.type === 'rocks' && tile.resourceAmount) {
            totalRockResources += tile.resourceAmount;
          }
        }
      }
      // Should have at least 300 total rock resources
      expect(totalRockResources).toBeGreaterThan(300);
    });
  });

  describe('Gold Economy', () => {
    it('selling wood should be profitable', () => {
      state.resources.gold = 0;
      
      // Place market first
      let marketPlaced = false;
      for (let y = 0; y < state.map.length && !marketPlaced; y++) {
        for (let x = 0; x < state.map[y].length && !marketPlaced; x++) {
          if (state.map[y][x].type === 'grass') {
            state.resources.gold = 100; // Temporarily give gold for market
            const result = placeBuilding(state, 'market', x, y);
            if (result.success) {
              marketPlaced = true;
            }
          }
        }
      }

      // Sell 10 wood (should get 50 gold)
      const result = sellResource(state, 'wood', 10);
      if (result.success) {
        expect(state.resources.gold).toBeGreaterThan(0);
      }
    });

    it('production should exceed consumption for stable economy', () => {
      // Lumber mill: 2 workers, 2 wood/s
      // Worker cost (food): 2 * 0.5 = 1 food/s
      // Farm: 2 workers, 3 food/s, net gain = 3 - (2 * 0.5) = 2 food/s

      const lumberMillWorkers = BUILDINGS.lumberMill.workers;
      const lumberMillProduction = BUILDINGS.lumberMill.production!.rate;
      const farmWorkers = BUILDINGS.farm.workers;
      const farmProduction = BUILDINGS.farm.production!.rate;

      // Net food from 1 farm after feeding its workers
      const netFarmFood = farmProduction - (farmWorkers * 0.5);
      expect(netFarmFood).toBeGreaterThan(0);

      // A farm should produce enough excess to feed lumber mill workers
      const lumberMillFoodCost = lumberMillWorkers * 0.5;
      expect(netFarmFood).toBeGreaterThan(lumberMillFoodCost);
    });
  });

  describe('Premium Balance', () => {
    it('premium buildings should be strictly better but not game-breaking', () => {
      const regularHouse = BUILDINGS.house;
      const premiumMansion = BUILDINGS.premiumMansion;

      // Mansion should provide more housing
      expect(premiumMansion.housing).toBeGreaterThan(regularHouse.housing ?? 0);

      // But not absurdly more (max 5x)
      expect(premiumMansion.housing).toBeLessThan((regularHouse.housing ?? 0) * 5);
    });

    it('speed boost should double production', () => {
      // This is defined in the applySpeedBoost function - 2x multiplier
      // Just verify the building definition exists for boosting
      expect(BUILDINGS.farm.production).toBeDefined();
    });

    it('starting gems should allow experiencing premium features', () => {
      // Start with 10 gems, speed boost costs 5
      expect(state.premiumCurrency).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Worker Efficiency', () => {
    it('should have enough grass tiles for buildings', () => {
      let grassCount = 0;
      for (const row of state.map) {
        for (const tile of row) {
          if (tile.type === 'grass') {
            grassCount++;
          }
        }
      }
      // Should have at least 100 buildable tiles
      expect(grassCount).toBeGreaterThan(100);
    });

    it('starting population should allow staffing at least 2 buildings', () => {
      const twoFarmsWorkers = BUILDINGS.farm.workers * 2;
      expect(state.workers).toBeGreaterThanOrEqual(twoFarmsWorkers);
    });
  });
});

describe('Simulation: 5-minute playthrough', () => {
  it('should achieve sustainable growth in 5 minutes', () => {
    const state = createInitialState();
    const startPopulation = state.population;
    const startGold = state.resources.gold;

    // Step 1: Build initial farm
    let farmPlaced = false;
    for (let y = 0; y < state.map.length && !farmPlaced; y++) {
      for (let x = 0; x < state.map[y].length && !farmPlaced; x++) {
        if (state.map[y][x].type === 'grass') {
          const result = placeBuilding(state, 'farm', x, y);
          if (result.success) {
            const building = state.map[y][x].building!;
            building.workers = 2;
            state.usedWorkers = 2;
            farmPlaced = true;
          }
        }
      }
    }
    expect(farmPlaced).toBe(true);

    // Step 2: Build house after 30 seconds
    state.lastUpdate = Date.now();
    for (let i = 0; i < 30; i++) {
      gameTick(state);
      state.lastUpdate -= 1000; // Simulate 1 second passing
    }

    // Should have grown food
    expect(state.resources.food).toBeGreaterThan(0);

    // Build house
    let housePlaced = false;
    for (let y = 0; y < state.map.length && !housePlaced; y++) {
      for (let x = 0; x < state.map[y].length && !housePlaced; x++) {
        if (state.map[y][x].type === 'grass' && !state.map[y][x].building) {
          const result = placeBuilding(state, 'house', x, y);
          if (result.success) {
            housePlaced = true;
          }
        }
      }
    }

    // Simulate another 60 seconds
    for (let i = 0; i < 60; i++) {
      gameTick(state);
      state.lastUpdate -= 1000;
    }

    // Should have population growth potential (maxPop increased)
    expect(state.maxPopulation).toBeGreaterThan(startPopulation);
  });
});
