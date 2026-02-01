// Unit tests for skin system

import { describe, it, expect, beforeEach } from 'vitest';
import { SkinManager, DEFAULT_SKINS } from './skins';

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('SkinManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('initialization', () => {
    it('loads with default skins', () => {
      const manager = new SkinManager();
      const skins = manager.getSkins();
      
      expect(skins.length).toBe(DEFAULT_SKINS.length);
      expect(skins[0].id).toBe('classic');
    });

    it('classic skin is unlocked by default', () => {
      const manager = new SkinManager();
      const skins = manager.getSkins();
      
      const classic = skins.find(s => s.id === 'classic');
      expect(classic?.unlocked).toBe(true);
    });

    it('premium skins are locked by default', () => {
      const manager = new SkinManager();
      const skins = manager.getSkins();
      
      const locked = skins.filter(s => s.id !== 'classic');
      expect(locked.every(s => s.unlocked === false)).toBe(true);
    });

    it('selects classic skin by default', () => {
      const manager = new SkinManager();
      expect(manager.getSelectedSkinId()).toBe('classic');
    });
  });

  describe('skin selection', () => {
    it('can select an unlocked skin', () => {
      const manager = new SkinManager();
      const result = manager.selectSkin('classic');
      
      expect(result).toBe(true);
      expect(manager.getSelectedSkinId()).toBe('classic');
    });

    it('cannot select a locked skin', () => {
      const manager = new SkinManager();
      const result = manager.selectSkin('gold');
      
      expect(result).toBe(false);
      expect(manager.getSelectedSkinId()).toBe('classic'); // Still classic
    });

    it('getSelectedSkin returns the full skin object', () => {
      const manager = new SkinManager();
      const skin = manager.getSelectedSkin();
      
      expect(skin.id).toBe('classic');
      expect(skin.headColor).toBe('#00ff88');
      expect(skin.bodyColor).toBe('#00cc6a');
    });

    it('persists skin selection across instances', () => {
      const manager1 = new SkinManager();
      manager1.selectSkin('classic');
      
      const manager2 = new SkinManager();
      expect(manager2.getSelectedSkinId()).toBe('classic');
    });
  });

  describe('skin unlocking', () => {
    it('unlocks skins when score threshold is met', () => {
      const manager = new SkinManager();
      
      // Score of 50 should unlock neon-blue
      const unlocked = manager.checkUnlocks(50);
      
      expect(unlocked).toContain('neon-blue');
      
      const skins = manager.getSkins();
      const neonBlue = skins.find(s => s.id === 'neon-blue');
      expect(neonBlue?.unlocked).toBe(true);
    });

    it('unlocks multiple skins at once', () => {
      const manager = new SkinManager();
      
      // Score of 200 should unlock neon-blue, fire, purple-haze, and gold
      const unlocked = manager.checkUnlocks(200);
      
      expect(unlocked).toContain('neon-blue');
      expect(unlocked).toContain('fire');
      expect(unlocked).toContain('purple-haze');
      expect(unlocked).toContain('gold');
      expect(unlocked.length).toBe(4);
    });

    it('does not re-report already unlocked skins', () => {
      const manager = new SkinManager();
      
      // First check
      manager.checkUnlocks(50);
      
      // Second check with same score
      const unlocked = manager.checkUnlocks(50);
      
      expect(unlocked.length).toBe(0);
    });

    it('persists unlocked skins across instances', () => {
      const manager1 = new SkinManager();
      manager1.checkUnlocks(100);
      
      const manager2 = new SkinManager();
      const skins = manager2.getSkins();
      
      const fire = skins.find(s => s.id === 'fire');
      expect(fire?.unlocked).toBe(true);
    });

    it('can select newly unlocked skin', () => {
      const manager = new SkinManager();
      
      // Initially locked
      expect(manager.selectSkin('fire')).toBe(false);
      
      // Unlock it
      manager.checkUnlocks(100);
      
      // Now can select
      expect(manager.selectSkin('fire')).toBe(true);
      expect(manager.getSelectedSkinId()).toBe('fire');
    });
  });

  describe('getSkinById', () => {
    it('returns skin by id', () => {
      const manager = new SkinManager();
      const skin = manager.getSkinById('classic');
      
      expect(skin?.name).toBe('Classic Green');
    });

    it('returns undefined for invalid id', () => {
      const manager = new SkinManager();
      const skin = manager.getSkinById('nonexistent');
      
      expect(skin).toBeUndefined();
    });
  });

  describe('skin properties', () => {
    it('all skins have required properties', () => {
      const manager = new SkinManager();
      const skins = manager.getSkins();
      
      for (const skin of skins) {
        expect(skin.id).toBeDefined();
        expect(skin.name).toBeDefined();
        expect(skin.headColor).toBeDefined();
        expect(skin.bodyColor).toBeDefined();
        expect(typeof skin.unlocked).toBe('boolean');
        expect(skin.unlockCondition).toBeDefined();
        expect(typeof skin.requiredScore).toBe('number');
      }
    });

    it('rainbow skin has special body color', () => {
      const manager = new SkinManager();
      const rainbow = manager.getSkinById('rainbow');
      
      expect(rainbow?.bodyColor).toBe('rainbow');
    });
  });
});
