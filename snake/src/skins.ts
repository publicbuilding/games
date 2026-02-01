// Snake skin system

import type { Skin } from './types';

const STORAGE_KEY_SKINS = 'snake_unlocked_skins';
const STORAGE_KEY_SELECTED = 'snake_selected_skin';

export const DEFAULT_SKINS: Skin[] = [
  {
    id: 'classic',
    name: 'Classic Green',
    headColor: '#00ff88',
    bodyColor: '#00cc6a',
    unlocked: true,
    unlockCondition: 'Free',
    requiredScore: 0,
  },
  {
    id: 'neon-blue',
    name: 'Neon Blue',
    headColor: '#00d4ff',
    bodyColor: '#0099cc',
    unlocked: false,
    unlockCondition: 'Score 50 points',
    requiredScore: 50,
  },
  {
    id: 'fire',
    name: 'Fire Snake',
    headColor: '#ff6b35',
    bodyColor: '#ff4500',
    unlocked: false,
    unlockCondition: 'Score 100 points',
    requiredScore: 100,
  },
  {
    id: 'purple-haze',
    name: 'Purple Haze',
    headColor: '#bf40bf',
    bodyColor: '#9932cc',
    unlocked: false,
    unlockCondition: 'Score 150 points',
    requiredScore: 150,
  },
  {
    id: 'gold',
    name: 'Golden Snake',
    headColor: '#ffd700',
    bodyColor: '#daa520',
    unlocked: false,
    unlockCondition: 'Score 200 points',
    requiredScore: 200,
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    headColor: '#ff0000',
    bodyColor: 'rainbow', // Special handling in renderer
    unlocked: false,
    unlockCondition: 'Score 300 points',
    requiredScore: 300,
  },
];

export class SkinManager {
  private skins: Skin[];
  private selectedSkinId: string;

  constructor() {
    this.skins = this.loadSkins();
    this.selectedSkinId = this.loadSelectedSkin();
  }

  private loadSkins(): Skin[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SKINS);
      if (stored) {
        const unlockedIds: string[] = JSON.parse(stored);
        return DEFAULT_SKINS.map(skin => ({
          ...skin,
          unlocked: skin.unlocked || unlockedIds.includes(skin.id),
        }));
      }
    } catch (e) {
      console.warn('Failed to load skins from localStorage:', e);
    }
    // Return deep copies to prevent mutation of DEFAULT_SKINS
    return DEFAULT_SKINS.map(skin => ({ ...skin }));
  }

  private loadSelectedSkin(): string {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SELECTED);
      if (stored && this.skins.some(s => s.id === stored && s.unlocked)) {
        return stored;
      }
    } catch (e) {
      console.warn('Failed to load selected skin:', e);
    }
    return 'classic';
  }

  private saveSkins(): void {
    try {
      const unlockedIds = this.skins
        .filter(s => s.unlocked && s.requiredScore > 0)
        .map(s => s.id);
      localStorage.setItem(STORAGE_KEY_SKINS, JSON.stringify(unlockedIds));
    } catch (e) {
      console.warn('Failed to save skins:', e);
    }
  }

  private saveSelectedSkin(): void {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED, this.selectedSkinId);
    } catch (e) {
      console.warn('Failed to save selected skin:', e);
    }
  }

  getSkins(): Skin[] {
    return this.skins;
  }

  getSelectedSkin(): Skin {
    return this.skins.find(s => s.id === this.selectedSkinId) || this.skins[0];
  }

  getSelectedSkinId(): string {
    return this.selectedSkinId;
  }

  selectSkin(skinId: string): boolean {
    const skin = this.skins.find(s => s.id === skinId);
    if (skin && skin.unlocked) {
      this.selectedSkinId = skinId;
      this.saveSelectedSkin();
      return true;
    }
    return false;
  }

  /**
   * Check and unlock skins based on the provided high score.
   * Returns array of newly unlocked skin IDs.
   */
  checkUnlocks(highScore: number): string[] {
    const newlyUnlocked: string[] = [];
    
    for (const skin of this.skins) {
      if (!skin.unlocked && skin.requiredScore > 0 && highScore >= skin.requiredScore) {
        skin.unlocked = true;
        newlyUnlocked.push(skin.id);
      }
    }
    
    if (newlyUnlocked.length > 0) {
      this.saveSkins();
    }
    
    return newlyUnlocked;
  }

  getSkinById(id: string): Skin | undefined {
    return this.skins.find(s => s.id === id);
  }
}
