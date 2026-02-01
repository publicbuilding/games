/**
 * Animation System - Manages sprite animations and particle effects
 */

export interface AnimationState {
  id: string;
  currentFrame: number;
  frameTime: number;
  totalTime: number;
  fps: number;
  frameCount: number;
  loop: boolean;
  onComplete?: () => void;
}

export interface ParticleEffect {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0-1
  maxLife: number;
  type: 'smoke' | 'sparkle' | 'leaf' | 'dust' | 'water';
  size: number;
  color: string;
  rotation?: number;
  angularVelocity?: number;
}

export class AnimationSystem {
  private animations: Map<string, AnimationState> = new Map();
  private particles: ParticleEffect[] = [];
  private particleIdCounter: number = 0;

  /**
   * Create a new animation
   */
  createAnimation(
    id: string,
    frameCount: number,
    fps: number = 10,
    loop: boolean = true,
    onComplete?: () => void
  ): AnimationState {
    const animation: AnimationState = {
      id,
      currentFrame: 0,
      frameTime: 0,
      totalTime: 0,
      fps,
      frameCount,
      loop,
      onComplete,
    };

    this.animations.set(id, animation);
    return animation;
  }

  /**
   * Update animations
   */
  updateAnimations(deltaTime: number): void {
    for (const [id, animation] of this.animations) {
      animation.frameTime += deltaTime;
      animation.totalTime += deltaTime;

      const frameDuration = 1000 / animation.fps;
      const nextFrame = Math.floor(animation.frameTime / frameDuration);

      if (nextFrame >= animation.frameCount) {
        if (animation.loop) {
          animation.currentFrame = nextFrame % animation.frameCount;
          animation.frameTime %= (animation.frameCount * frameDuration);
        } else {
          animation.currentFrame = animation.frameCount - 1;
          if (animation.onComplete) {
            animation.onComplete();
          }
          this.animations.delete(id);
        }
      } else {
        animation.currentFrame = nextFrame;
      }
    }
  }

  /**
   * Get current frame for an animation
   */
  getFrame(animationId: string): number {
    const animation = this.animations.get(animationId);
    return animation ? animation.currentFrame : 0;
  }

  /**
   * Stop animation
   */
  stopAnimation(animationId: string): void {
    this.animations.delete(animationId);
  }

  /**
   * Get animation state
   */
  getAnimation(animationId: string): AnimationState | undefined {
    return this.animations.get(animationId);
  }

  /**
   * Add smoke particle effect
   */
  emitSmoke(x: number, y: number, count: number = 5, color: string = '#aaa'): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 0.5 + Math.random() * 1;
      const particle: ParticleEffect = {
        id: `particle_${this.particleIdCounter++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed - 0.5, // Rises
        life: 1,
        maxLife: 1500,
        type: 'smoke',
        size: 3 + Math.random() * 2,
        color,
      };
      this.particles.push(particle);
    }
  }

  /**
   * Add sparkle particle effect (for magic/success)
   */
  emitSparkles(x: number, y: number, count: number = 10, color: string = '#ffff00'): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 1 + Math.random() * 1.5;
      const particle: ParticleEffect = {
        id: `particle_${this.particleIdCounter++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 800,
        type: 'sparkle',
        size: 2,
        color,
      };
      this.particles.push(particle);
    }
  }

  /**
   * Add leaf falling particle effect
   */
  emitLeaves(x: number, y: number, count: number = 3, color: string = '#8b6f47'): void {
    for (let i = 0; i < count; i++) {
      const particle: ParticleEffect = {
        id: `particle_${this.particleIdCounter++}`,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.3 + Math.random() * 0.2, // Falls
        life: 1,
        maxLife: 2000,
        type: 'leaf',
        size: 4 + Math.random() * 2,
        color,
        rotation: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.1,
      };
      this.particles.push(particle);
    }
  }

  /**
   * Add dust particle effect
   */
  emitDust(x: number, y: number, count: number = 8, color: string = 'rgba(200, 200, 200, 0.5)'): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 0.3 + Math.random() * 0.7;
      const particle: ParticleEffect = {
        id: `particle_${this.particleIdCounter++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.3,
        life: 1,
        maxLife: 600,
        type: 'dust',
        size: 2 + Math.random() * 1,
        color,
      };
      this.particles.push(particle);
    }
  }

  /**
   * Add water splash particle effect
   */
  emitWaterSplash(x: number, y: number, count: number = 10): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 1 + Math.random() * 0.5;
      const particle: ParticleEffect = {
        id: `particle_${this.particleIdCounter++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 1,
        maxLife: 700,
        type: 'water',
        size: 2,
        color: 'rgba(74, 144, 226, 0.6)',
      };
      this.particles.push(particle);
    }
  }

  /**
   * Update particles
   */
  updateParticles(deltaTime: number): void {
    this.particles = this.particles.filter(particle => {
      particle.life -= deltaTime / particle.maxLife;
      particle.x += particle.vx * deltaTime / 16; // Normalize to 60fps
      particle.y += particle.vy * deltaTime / 16;

      // Apply gravity (except for sparkles)
      if (particle.type !== 'sparkle') {
        particle.vy += 0.01 * deltaTime / 16;
      }

      // Friction
      particle.vx *= 0.99;
      particle.vy *= 0.99;

      // Rotation
      if (particle.angularVelocity !== undefined && particle.rotation !== undefined) {
        particle.rotation += particle.angularVelocity;
      }

      return particle.life > 0;
    });
  }

  /**
   * Get all particles
   */
  getParticles(): ParticleEffect[] {
    return this.particles;
  }

  /**
   * Clear all particles
   */
  clearParticles(): void {
    this.particles = [];
  }

  /**
   * Render particles
   */
  renderParticles(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, zoom: number): void {
    for (const particle of this.particles) {
      ctx.save();

      // Convert world coords to screen coords
      const screenX = (particle.x - cameraX) * zoom;
      const screenY = (particle.y - cameraY) * zoom;

      ctx.globalAlpha = particle.life; // Fade out

      if (particle.rotation !== undefined) {
        ctx.translate(screenX, screenY);
        ctx.rotate(particle.rotation);
        ctx.translate(-screenX, -screenY);
      }

      switch (particle.type) {
        case 'smoke':
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(screenX, screenY, particle.size * zoom, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'sparkle':
          // Draw star shape
          this.drawStar(ctx, screenX, screenY, 4, particle.size * zoom, particle.color);
          break;

        case 'leaf':
          ctx.fillStyle = particle.color;
          ctx.fillRect(screenX - particle.size * zoom / 2, screenY - particle.size * zoom / 2, particle.size * zoom, particle.size * zoom);
          break;

        case 'dust':
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(screenX, screenY, particle.size * zoom, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'water':
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(screenX, screenY, particle.size * zoom, 0, Math.PI * 2);
          ctx.fill();
          break;
      }

      ctx.restore();
    }
  }

  /**
   * Helper to draw star shape
   */
  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    color: string
  ): void {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * (outerRadius / 2), cy + Math.sin(rot) * (outerRadius / 2));
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
}
