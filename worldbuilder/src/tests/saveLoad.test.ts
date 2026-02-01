import { describe, it, expect } from 'vitest';
import { GameState } from '../types';
import { createInitialState } from '../core/gameState';

describe('Save/Load System - JSON Serialization', () => {
  // Note: localStorage tests skipped in Node environment, but JSON serialization tests work

  it('should serialize exploredAreas as an array (not Set)', () => {
    const state = createInitialState();
    
    // exploredAreas should be an array
    expect(Array.isArray(state.exploredAreas)).toBe(true);
    expect(state.exploredAreas.length).toBeGreaterThan(0);
    
    // Verify we can serialize to JSON without issues
    const json = JSON.stringify(state);
    expect(json).toBeDefined();
    expect(json.length).toBeGreaterThan(0);
  });

  it('should serialize discoveredTerritories as an object (not Map)', () => {
    const state = createInitialState();
    
    // discoveredTerritories should be a plain object
    expect(typeof state.discoveredTerritories).toBe('object');
    expect(state.discoveredTerritories).not.toBeNull();
    
    // Verify it's a plain object, not a Map
    expect(state.discoveredTerritories instanceof Map).toBe(false);
    
    // Should be JSON serializable
    const json = JSON.stringify(state);
    expect(json).toBeDefined();
  });

  it('should preserve exploredAreas through JSON serialize/deserialize cycle', () => {
    const state = createInitialState();
    const initialLength = state.exploredAreas.length;
    
    // Add another explored area
    state.exploredAreas.push('50,50');
    expect(state.exploredAreas.length).toBe(initialLength + 1);
    
    // Serialize and deserialize
    const json = JSON.stringify(state);
    const loadedState = JSON.parse(json) as GameState;
    
    // Verify data integrity
    expect(loadedState.exploredAreas).toBeDefined();
    expect(Array.isArray(loadedState.exploredAreas)).toBe(true);
    expect(loadedState.exploredAreas.length).toBe(initialLength + 1);
    expect(loadedState.exploredAreas.includes('50,50')).toBe(true);
  });

  it('should preserve discoveredTerritories through JSON serialize/deserialize cycle', () => {
    const state = createInitialState();
    
    // Add some territories
    state.discoveredTerritories = {
      territory1: { name: 'Mountain Pass', explored: true },
      territory2: { name: 'River Valley', resources: ['jade', 'rice'] },
    };
    
    // Serialize and deserialize
    const json = JSON.stringify(state);
    const loadedState = JSON.parse(json) as GameState;
    
    // Verify data integrity
    expect(loadedState.discoveredTerritories).toBeDefined();
    expect(loadedState.discoveredTerritories?.territory1?.name).toBe('Mountain Pass');
    expect(loadedState.discoveredTerritories?.territory2?.resources).toContain('jade');
  });

  it('should handle complex state serialization', () => {
    const state = createInitialState();
    
    // Simulate some gameplay
    state.resources.rice += 100;
    state.population += 10;
    state.exploredAreas.push('25,25');
    state.exploredAreas.push('26,26');
    state.discoveredTerritories = {
      northPass: { discovered: true, resources: ['jade', 'iron'] },
    };
    
    // This should not throw
    const json = JSON.stringify(state);
    
    // And should be parseable back
    const reparsed = JSON.parse(json) as GameState;
    expect(reparsed.resources.rice).toBe(180);
    expect(reparsed.population).toBe(15);
    expect(reparsed.exploredAreas.length).toBeGreaterThan(2);
    expect(reparsed.discoveredTerritories?.northPass?.resources).toContain('jade');
  });

  it('should not lose array indices for exploredAreas through serialization', () => {
    const state = createInitialState();
    const originalLength = state.exploredAreas.length;
    
    // Verify all initial explored areas are preserved
    state.exploredAreas.forEach((area, index) => {
      expect(typeof area).toBe('string');
      expect(area).toMatch(/^\d+,\d+$/); // Format: "x,y"
    });
    
    // Serialize and deserialize
    const json = JSON.stringify(state);
    const loadedState = JSON.parse(json) as GameState;
    
    // Verify array structure is preserved
    expect(loadedState.exploredAreas.length).toBe(originalLength);
    loadedState.exploredAreas.forEach((area) => {
      expect(typeof area).toBe('string');
      expect(area).toMatch(/^\d+,\d+$/);
    });
  });

  it('JSON.stringify should not produce empty objects for exploredAreas or discoveredTerritories', () => {
    const state = createInitialState();
    const json = JSON.stringify(state);
    const parsed = JSON.parse(json);
    
    // Check that these fields are properly serialized
    expect(parsed.exploredAreas).toBeDefined();
    expect(Array.isArray(parsed.exploredAreas)).toBe(true);
    expect(parsed.exploredAreas.length).toBeGreaterThan(0);
    
    expect(parsed.discoveredTerritories).toBeDefined();
    expect(typeof parsed.discoveredTerritories).toBe('object');
  });
});
