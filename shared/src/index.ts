// Shared utilities for PublicBuilding games

// ============ Storage ============
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage unavailable:', e);
    }
  },
  
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
};

// ============ Canvas Helpers ============
export function createCanvas(container: HTMLElement, width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.maxWidth = '100%';
  canvas.style.height = 'auto';
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

export function clearCanvas(ctx: CanvasRenderingContext2D, color = '#1a1a2e'): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// ============ Input Handling ============
export type Direction = 'up' | 'down' | 'left' | 'right';

export function setupKeyboardControls(onDirection: (dir: Direction) => void): () => void {
  const handler = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': onDirection('up'); break;
      case 'ArrowDown': case 's': case 'S': onDirection('down'); break;
      case 'ArrowLeft': case 'a': case 'A': onDirection('left'); break;
      case 'ArrowRight': case 'd': case 'D': onDirection('right'); break;
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}

export function setupTouchControls(
  element: HTMLElement,
  onDirection: (dir: Direction) => void,
  threshold = 30
): () => void {
  let startX = 0;
  let startY = 0;
  
  const touchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };
  
  const touchEnd = (e: TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - startX;
    const dy = endY - startY;
    
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      onDirection(dx > 0 ? 'right' : 'left');
    } else {
      onDirection(dy > 0 ? 'down' : 'up');
    }
  };
  
  element.addEventListener('touchstart', touchStart);
  element.addEventListener('touchend', touchEnd);
  
  return () => {
    element.removeEventListener('touchstart', touchStart);
    element.removeEventListener('touchend', touchEnd);
  };
}

// ============ Game Loop ============
export function createGameLoop(
  update: (dt: number) => void,
  render: () => void,
  targetFps = 60
): { start: () => void; stop: () => void; isRunning: () => boolean } {
  let running = false;
  let lastTime = 0;
  let animationId: number;
  const frameTime = 1000 / targetFps;
  
  const loop = (currentTime: number) => {
    if (!running) return;
    
    const dt = currentTime - lastTime;
    if (dt >= frameTime) {
      update(dt / 1000);
      render();
      lastTime = currentTime - (dt % frameTime);
    }
    
    animationId = requestAnimationFrame(loop);
  };
  
  return {
    start() {
      if (running) return;
      running = true;
      lastTime = performance.now();
      animationId = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(animationId);
    },
    isRunning: () => running
  };
}

// ============ UI Helpers ============
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export function showToast(message: string, duration = 2000): void {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: sans-serif;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ============ Freemium Hooks ============
export interface FreemiumItem {
  id: string;
  name: string;
  price: number; // in "gems" or premium currency
  owned: boolean;
}

export function createFreemiumStore(gameId: string) {
  const key = `${gameId}_purchases`;
  
  return {
    getOwned(): string[] {
      return storage.get<string[]>(key, []);
    },
    
    purchase(itemId: string): boolean {
      // Mock purchase - in reality would go through payment
      const owned = this.getOwned();
      if (!owned.includes(itemId)) {
        owned.push(itemId);
        storage.set(key, owned);
        return true;
      }
      return false;
    },
    
    isOwned(itemId: string): boolean {
      return this.getOwned().includes(itemId);
    }
  };
}

// ============ Audio (placeholder) ============
export const audio = {
  play(sound: string): void {
    console.log(`[Audio] Playing: ${sound}`);
    // TODO: Implement actual audio
  },
  
  setVolume(volume: number): void {
    console.log(`[Audio] Volume: ${volume}`);
  }
};
