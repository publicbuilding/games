/**
 * Celebration Effects System
 * Handles confetti, fireworks, glows, and other visual celebrations
 */

export interface CelebrationParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0-1
  maxLife: number;
  type: 'confetti' | 'firework' | 'glow';
  color: string;
  size: number;
}

export interface ScreenEffect {
  id: string;
  type: 'flash' | 'shake' | 'pulse';
  intensity: number; // 0-1
  duration: number;
  elapsed: number;
}

let celebrationIdCounter = 0;

export class CelebrationSystem {
  private particles: CelebrationParticle[] = [];
  private screenEffects: ScreenEffect[] = [];
  private effectIdCounter = 0;

  /**
   * Create a confetti burst (for population milestones)
   */
  createConfettiBurst(x: number, y: number, count: number = 30): void {
    const colors = ['#ff6b6b', '#ffd700', '#51cf66', '#15aabf', '#a6e3a1', '#ffe066'];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 3;
      
      const particle: CelebrationParticle = {
        id: `confetti_${celebrationIdCounter++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Burst upward
        life: 1,
        maxLife: 1500,
        type: 'confetti',
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 2,
      };
      this.particles.push(particle);
    }
  }

  /**
   * Create a firework explosion (for quest completion)
   */
  createFireworks(x: number, y: number, count: number = 50): void {
    const colors = ['#ff6b6b', '#ffd700', '#51cf66', '#15aabf'];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      
      const particle: CelebrationParticle = {
        id: `firework_${celebrationIdCounter++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1000,
        type: 'firework',
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 2,
      };
      this.particles.push(particle);
    }
  }

  /**
   * Create a golden glow effect (for building completion)
   */
  createGoldenGlow(x: number, y: number, count: number = 20): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 1.5;
      
      const particle: CelebrationParticle = {
        id: `glow_${celebrationIdCounter++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1, // Slight upward bias
        life: 1,
        maxLife: 800,
        type: 'glow',
        color: '#ffd700',
        size: 5 + Math.random() * 3,
      };
      this.particles.push(particle);
    }
  }

  /**
   * Create a screen flash effect
   */
  createScreenFlash(color: string = '#ffffff', duration: number = 200): void {
    this.screenEffects.push({
      id: `flash_${this.effectIdCounter++}`,
      type: 'flash',
      intensity: 1,
      duration,
      elapsed: 0,
    });
  }

  /**
   * Create a screen shake effect
   */
  createScreenShake(intensity: number = 10, duration: number = 300): void {
    this.screenEffects.push({
      id: `shake_${this.effectIdCounter++}`,
      type: 'shake',
      intensity: intensity / 100, // Normalize
      duration,
      elapsed: 0,
    });
  }

  /**
   * Create a level up celebration (flash + particles + shake)
   */
  createLevelUpCelebration(x: number, y: number): void {
    this.createScreenFlash('#ffd700', 300);
    this.createScreenShake(15, 300);
    this.createFireworks(x, y, 60);
    console.log('🎉 Level Up Celebration triggered');
  }

  /**
   * Update celebration particles
   */
  update(deltaTime: number): void {
    // Update particles
    this.particles = this.particles.filter(p => {
      p.life -= deltaTime / p.maxLife;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // Gravity
      p.vx *= 0.98; // Friction
      return p.life > 0;
    });

    // Update screen effects
    this.screenEffects = this.screenEffects.filter(effect => {
      effect.elapsed += deltaTime;
      effect.intensity = Math.max(0, 1 - effect.elapsed / effect.duration);
      return effect.elapsed < effect.duration;
    });
  }

  /**
   * Get all celebration particles
   */
  getParticles(): CelebrationParticle[] {
    return this.particles;
  }

  /**
   * Get all screen effects
   */
  getScreenEffects(): ScreenEffect[] {
    return this.screenEffects;
  }

  /**
   * Get current shake offset (for screen shake effect)
   */
  getShakeOffset(): { x: number; y: number } {
    let offsetX = 0;
    let offsetY = 0;

    for (const effect of this.screenEffects) {
      if (effect.type === 'shake') {
        offsetX += (Math.random() - 0.5) * effect.intensity * 20;
        offsetY += (Math.random() - 0.5) * effect.intensity * 20;
      }
    }

    return { x: offsetX, y: offsetY };
  }

  /**
   * Render celebration particles
   */
  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, zoom: number): void {
    for (const p of this.particles) {
      const screenX = (p.x - cameraX) * zoom;
      const screenY = (p.y - cameraY) * zoom;

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;

      if (p.type === 'confetti') {
        ctx.fillRect(screenX, screenY, p.size * zoom, p.size * zoom);
      } else if (p.type === 'firework') {
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * zoom, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'glow') {
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  /**
   * Render screen effects (flash overlay)
   */
  renderScreenEffects(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    for (const effect of this.screenEffects) {
      if (effect.type === 'flash') {
        ctx.fillStyle = `rgba(255, 255, 255, ${effect.intensity * 0.5})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
    }
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.particles = [];
    this.screenEffects = [];
  }
}

export const celebrationSystem = new CelebrationSystem();
