import { UIState, BuildingType, GameState } from '../types';
import { BUILDINGS } from '../core/buildings';
import { getMapDimensions } from '../core/gameState';

const TILE_SIZE = 48;

export type InputCallback = (action: InputAction) => void;

export type InputAction =
  | { type: 'selectBuilding'; building: BuildingType | null }
  | { type: 'placeBuilding'; x: number; y: number }
  | { type: 'demolish'; x: number; y: number }
  | { type: 'tileClick'; x: number; y: number; shift: boolean }
  | { type: 'pan'; dx: number; dy: number }
  | { type: 'zoom'; delta: number; centerX: number; centerY: number }
  | { type: 'hover'; x: number; y: number }
  | { type: 'unhover' }
  | { type: 'miniMapClick'; normalizedX: number; normalizedY: number };

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private callback: InputCallback;
  private ui: UIState;
  private renderer: any; // Reference to ProRenderer for hover state updates
  private lastMousePos: { x: number; y: number } | null = null;

  // Touch state
  private touches: Map<number, { x: number; y: number }> = new Map();
  private lastPinchDist: number = 0;
  private isPanning: boolean = false;
  private lastPanPos: { x: number; y: number } | null = null;

  constructor(canvas: HTMLCanvasElement, ui: UIState, callback: InputCallback) {
    this.canvas = canvas;
    this.callback = callback;
    this.ui = ui;

    this.setupMouseEvents();
    this.setupTouchEvents();
    this.setupKeyboardEvents();
  }

  private setupMouseEvents(): void {
    const canvas = this.canvas;

    // Click to place/select
    canvas.addEventListener('click', (e) => this.handleClick(e));
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.callback({ type: 'selectBuilding', building: null });
    });

    // Wheel to zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      this.callback({
        type: 'zoom',
        delta: e.deltaY > 0 ? -0.05 : 0.05,
        centerX: e.clientX - rect.left,
        centerY: e.clientY - rect.top,
      });
    });

    // Drag to pan
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        this.isPanning = true;
        this.lastPanPos = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.isPanning && this.lastPanPos) {
        const dx = e.clientX - this.lastPanPos.x;
        const dy = e.clientY - this.lastPanPos.y;
        this.callback({ type: 'pan', dx: -dx / this.ui.zoom, dy: -dy / this.ui.zoom });
        this.lastPanPos = { x: e.clientX, y: e.clientY };
      }
    });

    canvas.addEventListener('mouseup', () => {
      this.isPanning = false;
      this.lastPanPos = null;
    });

    canvas.addEventListener('mouseleave', () => {
      this.isPanning = false;
      this.lastPanPos = null;
      this.callback({ type: 'unhover' });
    });

    // Hover tracking for tooltips
    canvas.addEventListener('mousemove', (e) => {
      if (!this.isPanning) {
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Update building palette hover
        this.updateBuildingPaletteHover(screenX, screenY, rect.width, rect.height);

        // Convert to world coordinates
        const worldPos = this.screenToWorld(screenX, screenY, rect.width, rect.height);
        const tileX = Math.floor(worldPos.x / TILE_SIZE);
        const tileY = Math.floor(worldPos.y / TILE_SIZE);

        const { width, height } = getMapDimensions();
        if (tileX >= 0 && tileX < width && tileY >= 0 && tileY < height) {
          this.callback({ type: 'hover', x: tileX, y: tileY });
        } else {
          this.callback({ type: 'unhover' });
        }
      }
    });
  }

  private setupTouchEvents(): void {
    const canvas = this.canvas;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        this.touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
      }

      if (this.touches.size === 2) {
        const [t1, t2] = Array.from(this.touches.values());
        this.lastPinchDist = Math.hypot(t2.x - t1.x, t2.y - t1.y);
      }
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();

      // Update touch positions
      const prevTouches = new Map(this.touches);
      for (const touch of e.changedTouches) {
        this.touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
      }

      if (this.touches.size === 1) {
        // Single finger pan
        const [id] = this.touches.keys();
        const curr = this.touches.get(id)!;
        const prev = prevTouches.get(id);
        if (prev) {
          const dx = curr.x - prev.x;
          const dy = curr.y - prev.y;
          this.callback({ type: 'pan', dx: -dx / this.ui.zoom, dy: -dy / this.ui.zoom });
        }
      } else if (this.touches.size === 2) {
        // Pinch to zoom
        const [t1, t2] = Array.from(this.touches.values());
        const dist = Math.hypot(t2.x - t1.x, t2.y - t1.y);
        
        if (this.lastPinchDist > 0) {
          const delta = (dist - this.lastPinchDist) * 0.01;
          const centerX = (t1.x + t2.x) / 2;
          const centerY = (t1.y + t2.y) / 2;
          const rect = canvas.getBoundingClientRect();
          this.callback({
            type: 'zoom',
            delta,
            centerX: centerX - rect.left,
            centerY: centerY - rect.top,
          });
        }
        this.lastPinchDist = dist;
      }
    });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      
      // Check for tap (quick touch without much movement)
      if (e.changedTouches.length === 1 && this.touches.size === 1) {
        const touch = e.changedTouches[0];
        const start = this.touches.get(touch.identifier);
        if (start) {
          const dist = Math.hypot(touch.clientX - start.x, touch.clientY - start.y);
          if (dist < 10) {
            // It's a tap, treat as click
            this.handleTap(touch.clientX, touch.clientY);
          }
        }
      }

      for (const touch of e.changedTouches) {
        this.touches.delete(touch.identifier);
      }
      
      if (this.touches.size < 2) {
        this.lastPinchDist = 0;
      }
    });
  }

  private setupKeyboardEvents(): void {
    document.addEventListener('keydown', (e) => {
      // Number keys to select buildings
      const num = parseInt(e.key);
      if (num >= 1 && num <= 8) {
        const types = Object.keys(BUILDINGS) as BuildingType[];
        if (types[num - 1]) {
          this.callback({ type: 'selectBuilding', building: types[num - 1] });
        }
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        this.callback({ type: 'selectBuilding', building: null });
      }

      // Arrow keys to pan
      const panSpeed = 20;
      if (e.key === 'ArrowUp') this.callback({ type: 'pan', dx: 0, dy: -panSpeed });
      if (e.key === 'ArrowDown') this.callback({ type: 'pan', dx: 0, dy: panSpeed });
      if (e.key === 'ArrowLeft') this.callback({ type: 'pan', dx: -panSpeed, dy: 0 });
      if (e.key === 'ArrowRight') this.callback({ type: 'pan', dx: panSpeed, dy: 0 });

      // +/- to zoom
      if (e.key === '+' || e.key === '=') {
        const rect = this.canvas.getBoundingClientRect();
        this.callback({ type: 'zoom', delta: 0.05, centerX: rect.width / 2, centerY: rect.height / 2 });
      }
      if (e.key === '-') {
        const rect = this.canvas.getBoundingClientRect();
        this.callback({ type: 'zoom', delta: -0.05, centerX: rect.width / 2, centerY: rect.height / 2 });
      }
    });
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Check if click is in mini-map (bottom-left corner, 120x120)
    const miniMapSize = 120;
    const miniMapX = 10;
    const miniMapY = rect.height - miniMapSize - 10;
    
    if (
      screenX >= miniMapX &&
      screenX <= miniMapX + miniMapSize &&
      screenY >= miniMapY &&
      screenY <= miniMapY + miniMapSize
    ) {
      // Mini-map click detected
      const relX = (screenX - miniMapX) / miniMapSize;
      const relY = (screenY - miniMapY) / miniMapSize;
      this.callback({ type: 'miniMapClick', normalizedX: relX, normalizedY: relY });
      return;
    }

    // Check if click is in building palette
    if (screenY > rect.height - 100) {
      this.handlePaletteClick(screenX, rect.width);
      return;
    }

    // Convert to world coordinates
    const worldPos = this.screenToWorld(screenX, screenY, rect.width, rect.height);
    const tileX = Math.floor(worldPos.x / TILE_SIZE);
    const tileY = Math.floor(worldPos.y / TILE_SIZE);

    const { width, height } = getMapDimensions();
    if (tileX >= 0 && tileX < width && tileY >= 0 && tileY < height) {
      this.callback({ type: 'tileClick', x: tileX, y: tileY, shift: e.shiftKey });
    }
  }

  private handleTap(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    // Check if tap is in mini-map (bottom-left corner, 120x120)
    const miniMapSize = 120;
    const miniMapX = 10;
    const miniMapY = rect.height - miniMapSize - 10;
    
    if (
      screenX >= miniMapX &&
      screenX <= miniMapX + miniMapSize &&
      screenY >= miniMapY &&
      screenY <= miniMapY + miniMapSize
    ) {
      // Mini-map tap detected
      const relX = (screenX - miniMapX) / miniMapSize;
      const relY = (screenY - miniMapY) / miniMapSize;
      this.callback({ type: 'miniMapClick', normalizedX: relX, normalizedY: relY });
      return;
    }

    // Check if tap is in building palette
    if (screenY > rect.height - 100) {
      this.handlePaletteClick(screenX, rect.width);
      return;
    }

    // Convert to world coordinates
    const worldPos = this.screenToWorld(screenX, screenY, rect.width, rect.height);
    const tileX = Math.floor(worldPos.x / TILE_SIZE);
    const tileY = Math.floor(worldPos.y / TILE_SIZE);

    const { width, height } = getMapDimensions();
    if (tileX >= 0 && tileX < width && tileY >= 0 && tileY < height) {
      this.callback({ type: 'tileClick', x: tileX, y: tileY, shift: false });
    }
  }

  private handlePaletteClick(screenX: number, canvasWidth: number): void {
    const buildingTypes = Object.keys(BUILDINGS) as BuildingType[];
    const btnSize = 60;
    const spacing = 10;
    const totalWidth = buildingTypes.length * (btnSize + spacing);
    let startX = (canvasWidth - totalWidth) / 2;

    if (totalWidth > canvasWidth - 40) {
      startX = 20;
    }

    for (let i = 0; i < buildingTypes.length; i++) {
      const x = startX + i * (btnSize + spacing);
      if (screenX >= x && screenX <= x + btnSize) {
        const currentType = buildingTypes[i];
        // Toggle selection
        if (this.ui.selectedBuilding === currentType) {
          this.callback({ type: 'selectBuilding', building: null });
        } else {
          this.callback({ type: 'selectBuilding', building: currentType });
        }
        return;
      }
    }
  }

  private screenToWorld(screenX: number, screenY: number, canvasWidth: number, canvasHeight: number): { x: number; y: number } {
    // Reverse the camera transform
    const x = (screenX - canvasWidth / 2) / this.ui.zoom + this.ui.cameraX;
    const y = (screenY - canvasHeight / 2) / this.ui.zoom + this.ui.cameraY;
    return { x, y };
  }

  updateUI(ui: UIState): void {
    this.ui = ui;
  }

  /**
   * Set renderer reference for hover state updates
   */
  setRenderer(renderer: any): void {
    this.renderer = renderer;
  }

  /**
   * Update building palette hover state based on current mouse position
   */
  updateBuildingPaletteHover(mouseX: number, mouseY: number, canvasWidth: number, canvasHeight: number): void {
    if (!this.renderer || mouseY < canvasHeight - 100) {
      // Not in palette area, clear hover
      this.renderer?.setHoveredBuilding(null, null);
      return;
    }

    const buildingTypes = Object.keys(BUILDINGS) as BuildingType[];
    const btnSize = 60;
    const spacing = 10;
    const totalWidth = buildingTypes.length * (btnSize + spacing);
    let startX = (canvasWidth - totalWidth) / 2;

    if (totalWidth > canvasWidth - 40) {
      startX = 20;
    }

    // Check if mouse is over any building button
    for (let i = 0; i < buildingTypes.length; i++) {
      const x = startX + i * (btnSize + spacing);
      const y = canvasHeight - 100 + 10;
      
      if (mouseX >= x && mouseX <= x + btnSize && mouseY >= y && mouseY <= y + btnSize) {
        const type = buildingTypes[i];
        // DEBUG: Log building hover detection
        if (Math.random() < 0.02) { // Log ~2% of frames to reduce spam
          console.log(`[DEBUG INPUT] Hovering over ${type} at screen pos (${mouseX}, ${mouseY}), button bounds (${x}, ${y}) to (${x + btnSize}, ${y + btnSize})`);
        }
        this.renderer.setHoveredBuilding(type, { x: mouseX, y: mouseY });
        return;
      }
    }

    // Not over any button, clear hover
    this.renderer?.setHoveredBuilding(null, null);
  }
}
