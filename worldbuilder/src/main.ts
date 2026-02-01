import { GameState, UIState, BuildingType } from './types';
import { createInitialState, saveGame, loadGame, deleteSave, getMapDimensions } from './core/gameState';
import { gameTick } from './core/production';
import { placeBuilding, demolishBuilding, canPlaceBuilding, assignWorkers, sellResource } from './core/actions';
import { getBuildingDef, MARKET_PRICES } from './core/buildings';
import { AsianRenderer } from './ui/asianRenderer';
import { InputHandler, InputAction } from './ui/input';
import './style.css';

class Game {
  private state: GameState;
  private ui: UIState;
  private renderer: AsianRenderer;
  private input: InputHandler;
  private canvas: HTMLCanvasElement;
  private lastSave: number = 0;
  private autoSaveInterval: number = 30000; // 30 seconds

  constructor() {
    // Initialize canvas
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    
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

    // Initialize renderer and input (with Asian theme)
    this.renderer = new AsianRenderer(this.canvas);
    this.input = new InputHandler(this.canvas, this.ui, (action) => this.handleInput(action));

    // Setup UI buttons
    this.setupUIButtons();

    // Show welcome notification
    if (!saved) {
      this.showNotification('Welcome to the Eastern Realm! Build houses first, then farms for rice.');
    } else {
      this.showNotification('Welcome back to the Eastern Realm!');
    }

    // Start game loop
    this.gameLoop();
  }

  private setupUIButtons(): void {
    // Save button
    document.getElementById('btn-save')?.addEventListener('click', () => {
      saveGame(this.state);
      this.showNotification('Game saved!');
    });

    // Reset button
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset? All progress will be lost!')) {
        deleteSave();
        this.state = createInitialState();
        this.showNotification('Game reset!');
      }
    });

    // Market buttons
    document.getElementById('btn-sell-rice')?.addEventListener('click', () => {
      const result = sellResource(this.state, 'rice', 10);
      this.showNotification(result.message);
    });

    document.getElementById('btn-sell-tea')?.addEventListener('click', () => {
      const result = sellResource(this.state, 'tea', 10);
      this.showNotification(result.message);
    });

    document.getElementById('btn-sell-silk')?.addEventListener('click', () => {
      const result = sellResource(this.state, 'silk', 10);
      this.showNotification(result.message);
    });

    document.getElementById('btn-sell-jade')?.addEventListener('click', () => {
      const result = sellResource(this.state, 'jade', 5);
      this.showNotification(result.message);
    });

    // Premium modal
    document.getElementById('btn-premium')?.addEventListener('click', () => {
      this.showPremiumModal();
    });

    document.getElementById('modal-close')?.addEventListener('click', () => {
      this.hidePremiumModal();
    });

    document.getElementById('btn-buy-gems')?.addEventListener('click', () => {
      // Mock purchase - in real game, this would integrate payment
      this.state.premiumCurrency += 100;
      this.showNotification('🎉 +100 Gems (mock purchase)');
      this.hidePremiumModal();
    });
  }

  private handleInput(action: InputAction): void {
    switch (action.type) {
      case 'selectBuilding':
        this.ui.selectedBuilding = action.building;
        if (action.building) {
          const def = getBuildingDef(action.building);
          this.showNotification(`${def.name}: ${def.description}`);
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
    }

    this.input.updateUI(this.ui);
  }

  private handleTileClick(x: number, y: number, shift: boolean): void {
    const tile = this.state.map[y]?.[x];
    if (!tile) return;

    // Shift+click to demolish
    if (shift && tile.building) {
      const result = demolishBuilding(this.state, x, y);
      this.showNotification(result.message);
      return;
    }

    // If we have a selected building, try to place it
    if (this.ui.selectedBuilding) {
      const result = placeBuilding(this.state, this.ui.selectedBuilding, x, y);
      this.showNotification(result.message);
      
      // Auto-assign workers after placing
      if (result.success) {
        const building = tile.building;
        if (building) {
          const def = getBuildingDef(building.type);
          if (def.workers > 0) {
            assignWorkers(this.state, building, def.workers);
          }
        }
      }
      return;
    }

    // Click on existing building - show info and manage workers
    if (tile.building) {
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
        }
      }

      this.showNotification(info);
      return;
    }

    // Click on empty tile - show tile info
    if (tile.type !== 'grass') {
      let info = `${tile.type.charAt(0).toUpperCase() + tile.type.slice(1)}`;
      if (tile.resourceAmount !== undefined) {
        info += ` - ${Math.round(tile.resourceAmount)} remaining`;
      }
      this.showNotification(info);
    }
  }

  private showNotification(message: string): void {
    this.ui.notification = message;
    
    if (this.ui.notificationTimeout) {
      clearTimeout(this.ui.notificationTimeout);
    }

    this.ui.notificationTimeout = window.setTimeout(() => {
      this.ui.notification = null;
      this.ui.notificationTimeout = null;
    }, 3000);
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

  private gameLoop = (): void => {
    // Update game state
    gameTick(this.state);

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
