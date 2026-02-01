import { GameState, UIState, BuildingType } from './types';
import { createInitialState, saveGame, loadGame, deleteSave, getMapDimensions } from './core/gameState';
import { gameTick } from './core/production';
import { placeBuilding, demolishBuilding, canPlaceBuilding, assignWorkers, sellResource, scoutTerritory } from './core/actions';
import { getBuildingDef, MARKET_PRICES } from './core/buildings';
import { ProRenderer } from './ui/graphics';
import { InputHandler, InputAction } from './ui/input';
import { soundManager } from './core/sounds';
import { floatingNumberSystem } from './ui/feedback/floatingNumbers';
import { celebrationSystem } from './ui/feedback/celebrations';
import { activityIndicatorSystem } from './ui/feedback/activityIndicators';
import { notificationSystem } from './ui/feedback/notifications';
import './style.css';

class Game {
  private state: GameState;
  private ui: UIState;
  private renderer: ProRenderer;
  private input: InputHandler;
  private canvas: HTMLCanvasElement;
  private lastSave: number = 0;
  private autoSaveInterval: number = 30000; // 30 seconds

  constructor() {
    // Initialize canvas
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    
    // Initialize sound manager
    soundManager.init();
    
    // Try to load saved game
    const saved = loadGame();
    this.state = saved || createInitialState();

    // Initialize UI state
    const { width, height } = getMapDimensions();
    this.ui = {
      selectedBuilding: null,
      cameraX: (width * 48) / 2,
      cameraY: (height * 48) / 2,
      zoom: 1,
      showPremiumModal: false,
      notification: null,
      notificationTimeout: null,
    };

    // Initialize professional graphics renderer
    this.renderer = new ProRenderer(this.canvas);
    this.input = new InputHandler(this.canvas, this.ui, (action) => this.handleInput(action));

    // Setup UI buttons
    this.setupUIButtons();

    // Show welcome notification and tutorial
    if (!saved) {
      // Show welcome popup that requires interaction (tutorial mode)
      notificationSystem.important('🏠 BUILD A HOUSE FIRST! Start your settlement by building a house to grow your population.');
      // Show tutorial quest markers on next frame
      setTimeout(() => {
        this.showTutorialMarkers();
      }, 100);
    } else {
      notificationSystem.success('Welcome back to the Eastern Realm!');
    }

    // Start game loop
    this.gameLoop();
  }

  private setupUIButtons(): void {
    // Save button
    document.getElementById('btn-save')?.addEventListener('click', () => {
      soundManager.playUISound('click');
      saveGame(this.state);
      notificationSystem.success('Game saved!');
    });

    // Reset button
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      soundManager.playUISound('click');
      if (confirm('Are you sure you want to reset? All progress will be lost!')) {
        soundManager.playSoundEffect('reset_confirm');
        deleteSave();
        this.state = createInitialState();
        notificationSystem.important('Game reset!');
      }
    });

    // Market buttons
    document.getElementById('btn-sell-rice')?.addEventListener('click', () => {
      soundManager.playUISound('click');
      const result = sellResource(this.state, 'rice', 10);
      soundManager.playResourceSound('rice');
      if (result.success) {
        notificationSystem.success(result.message);
        floatingNumberSystem.addResourceProduction(window.innerWidth / 2, 100, 'gold', 10);
      } else {
        notificationSystem.warning(result.message);
        soundManager.playUISound('error');
      }
    });

    document.getElementById('btn-sell-tea')?.addEventListener('click', () => {
      soundManager.playUISound('click');
      const result = sellResource(this.state, 'tea', 10);
      soundManager.playResourceSound('tea');
      if (result.success) {
        notificationSystem.success(result.message);
        floatingNumberSystem.addResourceProduction(window.innerWidth / 2, 100, 'gold', 80);
      } else {
        notificationSystem.warning(result.message);
        soundManager.playUISound('error');
      }
    });

    document.getElementById('btn-sell-silk')?.addEventListener('click', () => {
      soundManager.playUISound('click');
      const result = sellResource(this.state, 'silk', 10);
      soundManager.playResourceSound('silk');
      if (result.success) {
        notificationSystem.success(result.message);
        floatingNumberSystem.addResourceProduction(window.innerWidth / 2, 100, 'gold', 150);
      } else {
        notificationSystem.warning(result.message);
        soundManager.playUISound('error');
      }
    });

    document.getElementById('btn-sell-jade')?.addEventListener('click', () => {
      soundManager.playUISound('click');
      const result = sellResource(this.state, 'jade', 5);
      soundManager.playResourceSound('jade');
      if (result.success) {
        notificationSystem.success(result.message);
        floatingNumberSystem.addResourceProduction(window.innerWidth / 2, 100, 'gold', 100);
      } else {
        notificationSystem.warning(result.message);
        soundManager.playUISound('error');
      }
    });

    // Scout buttons for exploration
    const directions: Array<'north' | 'south' | 'east' | 'west'> = ['north', 'south', 'east', 'west'];
    for (const direction of directions) {
      document.getElementById(`btn-scout-${direction}`)?.addEventListener('click', () => {
        soundManager.playUISound('click');
        const result = scoutTerritory(this.state, direction, 50);
        if (result.success) {
          notificationSystem.success(result.message);
          celebrationSystem.createScreenFlash('#4a90e2', 100);
        } else {
          notificationSystem.warning(result.message);
          soundManager.playUISound('error');
        }
      });
    }

    // Premium modal
    document.getElementById('btn-premium')?.addEventListener('click', () => {
      soundManager.playUISound('click');
      this.showPremiumModal();
    });

    document.getElementById('modal-close')?.addEventListener('click', () => {
      soundManager.playUISound('click');
      this.hidePremiumModal();
    });

    document.getElementById('btn-buy-gems')?.addEventListener('click', () => {
      soundManager.playUISound('click');
      // Mock purchase - in real game, this would integrate payment
      this.state.premiumCurrency += 100;
      celebrationSystem.createConfettiBurst(window.innerWidth / 2, window.innerHeight / 2, 50);
      soundManager.playCelebrationSound('fanfare');
      notificationSystem.success('🎉 +100 Gems (mock purchase)');
      floatingNumberSystem.add(window.innerWidth / 2, window.innerHeight / 2, '+100 💎', '#a6e3a1', true);
      this.hidePremiumModal();
    });
  }

  private handleInput(action: InputAction): void {
    switch (action.type) {
      case 'selectBuilding':
        this.ui.selectedBuilding = action.building;
        if (action.building) {
          soundManager.playUISound('click');
          const def = getBuildingDef(action.building);
          notificationSystem.show(`${def.name}: ${def.description}`, 'info', 3000);
        }
        break;

      case 'tileClick':
        this.handleTileClick(action.x, action.y, action.shift);
        break;

      case 'pan':
        this.ui.cameraX += action.dx;
        this.ui.cameraY += action.dy;
        // Clamp camera
        const { width, height } = getMapDimensions();
        const tileSize = this.renderer.getTileSize();
        this.ui.cameraX = Math.max(0, Math.min(this.ui.cameraX, width * tileSize));
        this.ui.cameraY = Math.max(0, Math.min(this.ui.cameraY, height * tileSize));
        break;

      case 'zoom':
        const oldZoom = this.ui.zoom;
        this.ui.zoom = Math.max(0.5, Math.min(2, this.ui.zoom + action.delta));
        // Zoom towards cursor position could be added here
        break;

      case 'hover':
        this.renderer.setHoveredTile(action.x, action.y);
        break;

      case 'unhover':
        this.renderer.clearHoveredTile();
        break;
    }

    this.input.updateUI(this.ui);
  }

  private handleTileClick(x: number, y: number, shift: boolean): void {
    const tile = this.state.map[y]?.[x];
    if (!tile) return;

    // Shift+click to demolish
    if (shift && tile.building) {
      soundManager.playUISound('click');
      const result = demolishBuilding(this.state, x, y);
      if (result.success) {
        notificationSystem.success(result.message);
        celebrationSystem.createScreenFlash('#ff6b6b', 150);
      } else {
        notificationSystem.warning(result.message);
        soundManager.playUISound('error');
      }
      return;
    }

    // If we have a selected building, try to place it
    if (this.ui.selectedBuilding) {
      soundManager.playUISound('click');
      const result = placeBuilding(this.state, this.ui.selectedBuilding, x, y);
      
      if (result.success) {
        soundManager.playUISound('place_building');
        notificationSystem.success(result.message);
        const building = tile.building;
        if (building) {
          // Floating number popup showing building name
          floatingNumberSystem.addMilestone(x * 48 + 24, y * 48 + 24, `${this.ui.selectedBuilding}!`);
          const def = getBuildingDef(building.type);
          if (def.workers > 0) {
            assignWorkers(this.state, building, def.workers);
          }
          
          // Advance tutorial
          if (this.state.tutorialStep > 0) {
            if (this.state.tutorialStep === 1 && this.ui.selectedBuilding === 'house') {
              this.state.tutorialStep = 2;
              setTimeout(() => this.showTutorialMarkers(), 500);
            } else if (this.state.tutorialStep === 2 && this.ui.selectedBuilding === 'ricePaddy') {
              this.state.tutorialStep = 3;
              setTimeout(() => this.showTutorialMarkers(), 500);
            } else if (this.state.tutorialStep === 3 && this.ui.selectedBuilding === 'ricePaddy') {
              this.state.tutorialStep = 4;
              setTimeout(() => this.showTutorialMarkers(), 500);
            }
          }
        }
      } else {
        soundManager.playUISound('error');
        notificationSystem.warning(result.message);
        floatingNumberSystem.addError(x * 48 + 24, y * 48 + 24, 'Cannot build!');
      }
      return;
    }

    // Click on existing building - show info and manage workers
    if (tile.building) {
      soundManager.playUISound('click');
      const building = tile.building;
      const def = getBuildingDef(building.type);
      
      let info = `${def.name} - Workers: ${building.workers}/${def.workers}`;
      
      if (def.production) {
        info += ` | Produces: ${def.production.rate}/s ${def.production.output}`;
      }
      
      if (def.housing) {
        info += ` | Housing: +${def.housing}`;
      }

      // Try to assign more workers if needed
      if (building.workers < def.workers) {
        const assigned = assignWorkers(this.state, building, 1);
        if (assigned.success) {
          info += ' | +1 worker assigned';
          floatingNumberSystem.add(x * 48 + 24, y * 48 + 24, '+1 👤', '#a6e3a1', false);
        }
      }

      notificationSystem.show(info, 'info', 3000);
      return;
    }

    // Click on empty tile - show tile info
    if (tile.type !== 'grass') {
      soundManager.playUISound('click');
      let info = `${tile.type.charAt(0).toUpperCase() + tile.type.slice(1)}`;
      if (tile.resourceAmount !== undefined) {
        info += ` - ${Math.round(tile.resourceAmount)} remaining`;
      }
      notificationSystem.show(info, 'info', 3000);
    }
  }

  private showNotification(message: string): void {
    // Deprecated: use notificationSystem instead
    notificationSystem.show(message, 'info', 3000);
  }

  private showPremiumModal(): void {
    const modal = document.getElementById('premium-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  private hidePremiumModal(): void {
    const modal = document.getElementById('premium-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private showTutorialMarkers(): void {
    // Show step-by-step tutorial guidance for first 3 buildings
    if (this.state.tutorialStep === 1) {
      notificationSystem.show('💡 Step 1: Click "house" in the left panel to select it', 'info', 5000);
    } else if (this.state.tutorialStep === 2) {
      notificationSystem.show('💡 Step 2: Click a nearby empty tile to place your house', 'info', 5000);
    } else if (this.state.tutorialStep === 3) {
      notificationSystem.show('🌾 Step 3: Build a Rice Paddy to produce food for your people!', 'info', 5000);
    } else if (this.state.tutorialStep >= 4) {
      notificationSystem.show('✨ Great progress! Continue building to grow your settlement!', 'success', 3000);
      this.state.tutorialStep = 0; // Tutorial complete
    }
  }

  private gameLoop = (): void => {
    // Update game state
    gameTick(this.state);

    // Update feedback systems (use delta time for smooth animations)
    const deltaMs = 16; // ~60fps
    floatingNumberSystem.update(deltaMs);
    celebrationSystem.update(deltaMs);
    activityIndicatorSystem.update(this.state.buildings, deltaMs);
    notificationSystem.update(deltaMs);

    // Auto-save periodically
    const now = Date.now();
    if (now - this.lastSave > this.autoSaveInterval) {
      saveGame(this.state);
      this.lastSave = now;
    }

    // Render
    this.renderer.render(this.state, this.ui);

    // Continue loop
    requestAnimationFrame(this.gameLoop);
  };
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Game();
});
