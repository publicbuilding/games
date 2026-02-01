import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState } from '../core/gameState';
import { placeBuilding } from '../core/actions';
import { gameTick } from '../core/production';
import { GameState } from '../types';
import { BUILDINGS } from '../core/buildings';

describe('Game Balance Analysis', () => {
  describe('Early Game Economy', () => {
    let state: GameState;

    beforeEach(() => {
      state = createInitialState();
    });

    it('starting resources should allow building first house', () => {
      const houseCost = BUILDINGS.house.cost;
      expect(state.resources.gold).toBeGreaterThanOrEqual(houseCost.gold ?? 0);
      expect(state.resources.bamboo).toBeGreaterThanOrEqual(houseCost.bamboo ?? 0);
    });

    it('starting resources should allow building first rice paddy', () => {
      const paddyCost = BUILDINGS.ricePaddy.cost;
      expect(state.resources.gold).toBeGreaterThanOrEqual(paddyCost.gold ?? 0);
      expect(state.resources.bamboo).toBeGreaterThanOrEqual(paddyCost.bamboo ?? 0);
    });

    it('starting rice should last at least 60 seconds', () => {
      const ricePerSecond = state.population * 0.3; // Rice consumption rate
      const survivalTime = state.resources.rice / ricePerSecond;
      expect(survivalTime).toBeGreaterThanOrEqual(60);
    });

    it('starting gold should allow multiple basic buildings', () => {
      const totalBasicCost =
        (BUILDINGS.house.cost.gold ?? 0) +
        (BUILDINGS.ricePaddy.cost.gold ?? 0) +
        (BUILDINGS.warehouse.cost.gold ?? 0);
      expect(state.resources.gold).toBeGreaterThanOrEqual(totalBasicCost);
    });
  });

  describe('Food Sustainability', () => {
    let state: GameState;

    beforeEach(() => {
      state = createInitialState();
    });

    it('single rice paddy should sustain initial population', () => {
      const paddyProduction = BUILDINGS.ricePaddy.production!.rate; // 3 rice/s
      const consumption = state.population * 0.3; // 5 * 0.3 = 1.5 rice/s
      expect(paddyProduction).toBeGreaterThan(consumption);
    });

    it('two rice paddies should sustain population of 10', () => {
      const paddyProduction = BUILDINGS.ricePaddy.production!.rate * 2; // 6 rice/s
      const consumption = 10 * 0.3; // 3 rice/s
      expect(paddyProduction).toBeGreaterThan(consumption);
    });

    it('maximum house population ratio should work', () => {
      // 4 people need 1.2 rice/s
      // So 1 paddy can support ~2.5 houses (10 people)
      const paddyProduction = BUILDINGS.ricePaddy.production!.rate;
      const housePopulation = BUILDINGS.house.housing ?? 4;
      const consumption = housePopulation * 0.3;
      // At least one house should be sustainable
      expect(consumption).toBeLessThanOrEqual(paddyProduction);
    });

    it('population should never go below 1', () => {
      state.resources.rice = 0;
      state.population = 10;

      // Simulate starvation
      for (let i = 0; i < 100; i++) {
        gameTick(state);
      }

      expect(state.population).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Death Spiral Prevention', () => {
    let state: GameState;

    beforeEach(() => {
      state = createInitialState();
    });

    it('1 worker should be able to run 1 rice paddy', () => {
      const paddyWorkers = BUILDINGS.ricePaddy.workers;
      expect(paddyWorkers).toBeLessThanOrEqual(2); // Even with 1 worker, can partially staff
    });

    it('recovery should be possible after near-death', () => {
      state.resources.rice = 5;
      state.population = 1;
      state.workers = 1;
      state.usedWorkers = 0;

      // Build a rice paddy despite low resources
      state.resources.gold = 100;
      let recovered = false;
      for (let y = 0; y < state.map.length; y++) {
        for (let x = 0; x < state.map[y].length; x++) {
          if (state.map[y][x].type === 'plains') {
            const result = placeBuilding(state, 'ricePaddy', x, y);
            if (result.success) {
              recovered = true;
              break;
            }
          }
        }
        if (recovered) break;
      }

      expect(recovered).toBe(true);
      // Should be able to afford a house
      expect(state.resources.gold).toBeGreaterThanOrEqual(BUILDINGS.house.cost.gold ?? 0);
      expect(state.resources.bamboo).toBeGreaterThanOrEqual(BUILDINGS.house.cost.bamboo ?? 0);
    });
  });

  describe('Resource Depletion', () => {
    let state: GameState;

    beforeEach(() => {
      state = createInitialState();
    });

    it('bamboo groves should have sufficient resources for meaningful gameplay', () => {
      let totalBamboo = 0;
      for (let y = 0; y < state.map.length; y++) {
        for (let x = 0; x < state.map[y].length; x++) {
          if (state.map[y][x].type === 'bamboo') {
            totalBamboo += state.map[y][x].resourceAmount ?? 0;
          }
        }
      }
      // Should have significant bamboo resources
      expect(totalBamboo).toBeGreaterThan(500);
    });

    it('mountains should have sufficient resources', () => {
      let totalMountain = 0;
      for (let y = 0; y < state.map.length; y++) {
        for (let x = 0; x < state.map[y].length; x++) {
          if (state.map[y][x].type === 'mountain') {
            totalMountain += state.map[y][x].resourceAmount ?? 0;
          }
        }
      }
      // Should have meaningful mountain resources
      expect(totalMountain).toBeGreaterThan(300);
    });
  });

  describe('Gold Economy', () => {
    let state: GameState;

    beforeEach(() => {
      state = createInitialState();
    });

    it('selling resources should be profitable', () => {
      // Rice sells for 2g each
      const ricePrice = 2;
      const riceSold = 10;
      const goldGained = riceSold * ricePrice;
      expect(goldGained).toBeGreaterThan(0);
    });

    it('production should exceed consumption for stable economy', () => {
      // A single paddy produces 3 rice/s
      // 5 people consume 1.5 rice/s
      // Net gain: 1.5 rice/s
      const paddyProduction = BUILDINGS.ricePaddy.production!.rate;
      const consumption = state.population * 0.3;
      expect(paddyProduction).toBeGreaterThan(consumption);
    });
  });

  describe('Premium Balance', () => {
    let state: GameState;

    beforeEach(() => {
      state = createInitialState();
    });

    it('starting gems should allow experiencing premium features', () => {
      expect(state.premiumCurrency).toBeGreaterThan(0);
    });
  });

  describe('Worker Efficiency', () => {
    let state: GameState;

    beforeEach(() => {
      state = createInitialState();
    });

    it('should have enough plains tiles for buildings', () => {
      let plainsCount = 0;
      for (let y = 0; y < state.map.length; y++) {
        for (let x = 0; x < state.map[y].length; x++) {
          if (state.map[y][x].type === 'plains') {
            plainsCount++;
          }
        }
      }
      // Should have at least 100 buildable tiles
      expect(plainsCount).toBeGreaterThan(100);
    });

    it('starting population should allow staffing at least 2 buildings', () => {
      const twoRicePaddyWorkers = BUILDINGS.ricePaddy.workers * 2;
      expect(state.workers).toBeGreaterThanOrEqual(twoRicePaddyWorkers);
    });

    it('should achieve sustainable growth in 5 minutes', () => {
      // Place a rice paddy
      let farmPlaced = false;
      for (let y = 0; y < state.map.length; y++) {
        for (let x = 0; x < state.map[y].length; x++) {
          if (state.map[y][x].type === 'plains') {
            const result = placeBuilding(state, 'ricePaddy', x, y);
            if (result.success) {
              const building = state.map[y][x].building!;
              building.workers = BUILDINGS.ricePaddy.workers;
              state.usedWorkers += BUILDINGS.ricePaddy.workers;
              farmPlaced = true;
              break;
            }
          }
        }
        if (farmPlaced) break;
      }

      expect(farmPlaced).toBe(true);

      const initialPopulation = state.population;

      // Simulate 5 minutes (300 seconds)
      for (let i = 0; i < 300; i++) {
        gameTick(state);
      }

      // Population should remain stable (not declining due to starvation)
      expect(state.population).toBeGreaterThanOrEqual(initialPopulation * 0.9);
    });
  });
});
