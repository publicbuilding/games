/**
 * Water & Nature Effects - Reflective water, koi, blossoms, fireflies, birds, wind
 * Premium environmental animations for Asian dynasty aesthetic
 */

export interface KoiFish {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  time: number;
  color: string; // Gold, white, black patterns
}

export interface Firefly {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  brightness: number;
  life: number;
}

export interface Bird {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  wingPhase: number;
  type: 'sparrow' | 'crane'; // Different silhouettes
}

export class WaterAndNatureEffects {
  private koiFishes: KoiFish[] = [];
  private fireflies: Firefly[] = [];
  private birds: Bird[] = [];
  private blossomParticles: Array<{ x: number; y: number; vy: number; rotation: number; angularVel: number }> = [];
  private windDirection: { x: number; y: number } = { x: 0.5, y: 0 };
  private windStrength: number = 1;
  private koiIdCounter: number = 0;
  private fireflyIdCounter: number = 0;
  private birdIdCounter: number = 0;

  constructor() {
    this.initializeKoi();
    this.initializeFireflies();
    this.initializeBirds();
  }

  /**
   * Initialize koi fish in a pond
   */
  private initializeKoi(): void {
    const koiCount = 4;
    const koiColors = ['#ff8c00', '#ffffff', '#000000', '#ffcc00']; // Gold, white, black, yellow

    for (let i = 0; i < koiCount; i++) {
      this.koiFishes.push({
        id: `koi_${i}`,
        x: Math.random() * 100 - 50,
        y: Math.random() * 80 - 40,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        angle: Math.random() * Math.PI * 2,
        time: Math.random() * 1000,
        color: koiColors[i % koiColors.length],
      });
    }
  }

  /**
   * Initialize fireflies for dusk/night
   */
  private initializeFireflies(): void {
    const fireflyCount = 8;

    for (let i = 0; i < fireflyCount; i++) {
      this.fireflies.push({
        id: `firefly_${i}`,
        x: Math.random() * 200 - 100,
        y: Math.random() * 150 - 75,
        targetX: Math.random() * 200 - 100,
        targetY: Math.random() * 150 - 75,
        brightness: Math.random(),
        life: 1,
      });
    }
  }

  /**
   * Initialize birds in the sky
   */
  private initializeBirds(): void {
    const birdCount = 2;
    const types: Array<'sparrow' | 'crane'> = ['sparrow', 'crane'];

    for (let i = 0; i < birdCount; i++) {
      this.birds.push({
        id: `bird_${i}`,
        x: -100 + i * 200,
        y: -80 + Math.random() * 60,
        vx: 0.2 + Math.random() * 0.1,
        vy: (Math.random() - 0.5) * 0.05,
        wingPhase: 0,
        type: types[i % types.length],
      });
    }
  }

  /**
   * Draw reflective water with ripples
   */
  drawWaterWithReflections(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    tileWidth: number,
    tileHeight: number,
    animationFrame: number
  ): void {
    // Base water color with gradient
    const gradient = ctx.createLinearGradient(screenX - tileWidth / 2, screenY - tileHeight / 2, screenX + tileWidth / 2, screenY + tileHeight / 2);
    gradient.addColorStop(0, '#3a7fb5');
    gradient.addColorStop(0.5, '#4a90e2');
    gradient.addColorStop(1, '#2d5a8c');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - tileHeight); // Top
    ctx.lineTo(screenX + tileWidth / 2, screenY); // Right
    ctx.lineTo(screenX, screenY + tileHeight); // Bottom
    ctx.lineTo(screenX - tileWidth / 2, screenY); // Left
    ctx.closePath();
    ctx.fill();

    // Ripple animations
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;

    for (let i = 0; i < 3; i++) {
      const rippleTime = (animationFrame + i * 200) % 400;
      const ripplePhase = rippleTime / 100;
      const rippleX = screenX + Math.cos(ripplePhase) * 5;
      const rippleY = screenY + Math.sin(ripplePhase) * 3;
      const rippleRadius = 5 + (rippleTime / 400) * 15;

      ctx.beginPath();
      ctx.arc(rippleX, rippleY, rippleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Water surface reflection shimmer
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
      const shimmerY = screenY - tileHeight / 2 + i * 3 + Math.sin(animationFrame * 0.05 + i) * 1;
      ctx.beginPath();
      ctx.moveTo(screenX - tileWidth / 2, shimmerY);
      ctx.lineTo(screenX + tileWidth / 2, shimmerY);
      ctx.stroke();
    }
  }

  /**
   * Draw koi fish swimming in pond
   */
  drawKoiFish(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, animationFrame: number): void {
    for (const koi of this.koiFishes) {
      koi.time += 16;

      // Sine wave swimming pattern
      koi.x += koi.vx;
      koi.y += koi.vy;
      koi.angle = Math.atan2(koi.vy, koi.vx);

      // Boundary wrapping
      if (koi.x > 60) koi.x = -60;
      if (koi.x < -60) koi.x = 60;
      if (koi.y > 50) koi.y = -50;
      if (koi.y < -50) koi.y = 50;

      // Occasional direction change
      if (koi.time % 300 === 0) {
        koi.vx = (Math.random() - 0.5) * 0.4;
        koi.vy = (Math.random() - 0.5) * 0.4;
      }

      const fishScreenX = screenX + koi.x;
      const fishScreenY = screenY + koi.y;

      ctx.save();
      ctx.translate(fishScreenX, fishScreenY);
      ctx.rotate(koi.angle);

      // Fish body
      ctx.fillStyle = koi.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Fish tail
      ctx.beginPath();
      ctx.moveTo(-6, -1);
      ctx.lineTo(-10, -3);
      ctx.lineTo(-10, 3);
      ctx.closePath();
      ctx.fillStyle = this.darkenColor(koi.color, 0.7);
      ctx.fill();

      // Fish eye
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(4, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Draw cherry blossom petals drifting
   */
  drawCherryBlossoms(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    animationFrame: number
  ): void {
    if (season !== 'spring') return;

    // Create blossoms on demand
    while (this.blossomParticles.length < 40) {
      this.blossomParticles.push({
        x: Math.random() * canvasWidth,
        y: -10,
        vy: 0.15 + Math.random() * 0.1,
        rotation: Math.random() * Math.PI * 2,
        angularVel: (Math.random() - 0.5) * 0.1,
      });
    }

    // Update and draw blossoms
    this.blossomParticles = this.blossomParticles.filter(blossom => {
      blossom.y += blossom.vy;
      blossom.rotation += blossom.angularVel;
      blossom.x += Math.sin(blossom.rotation) * 0.2;

      if (blossom.y > canvasHeight) return false;

      ctx.save();
      ctx.translate(blossom.x, blossom.y);
      ctx.rotate(blossom.rotation);

      // Petal shape (simplified sakura)
      ctx.fillStyle = 'rgba(255, 200, 220, 0.7)';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.cos(angle) * 3;
        const y = Math.sin(angle) * 3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      return true;
    });
  }

  /**
   * Draw fireflies with flickering light
   */
  drawFireflies(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    dayTime: number,
    animationFrame: number
  ): void {
    // Fireflies active at dusk/night
    if (dayTime > 0.3 && dayTime < 0.8) return;

    for (const firefly of this.fireflies) {
      // Wander toward target
      const dx = firefly.targetX - firefly.x;
      const dy = firefly.targetY - firefly.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5 || Math.random() < 0.01) {
        firefly.targetX = Math.random() * canvasWidth;
        firefly.targetY = Math.random() * canvasHeight * 0.6; // Upper half
      }

      firefly.x += (dx / dist) * 0.5;
      firefly.y += (dy / dist) * 0.5;

      // Flickering brightness
      firefly.brightness = 0.3 + Math.sin(animationFrame * 0.1 + parseInt(firefly.id) * 0.5) * 0.4;

      ctx.save();
      ctx.globalAlpha = firefly.brightness;

      // Glow
      const glowGradient = ctx.createRadialGradient(firefly.x, firefly.y, 0, firefly.x, firefly.y, 8);
      glowGradient.addColorStop(0, 'rgba(255, 255, 100, 1)');
      glowGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(firefly.x - 8, firefly.y - 8, 16, 16);

      // Core
      ctx.fillStyle = 'rgba(255, 255, 150, 1)';
      ctx.beginPath();
      ctx.arc(firefly.x, firefly.y, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Draw birds flying across sky
   */
  drawBirds(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    animationFrame: number
  ): void {
    for (const bird of this.birds) {
      bird.x += bird.vx;
      bird.y += bird.vy;
      bird.wingPhase += 0.15;

      // Wrap around screen
      if (bird.x > canvasWidth + 50) bird.x = -50;

      ctx.save();
      ctx.translate(bird.x, bird.y);

      if (bird.type === 'crane') {
        this.drawCrane(ctx, bird.wingPhase);
      } else {
        this.drawSparrow(ctx, bird.wingPhase);
      }

      ctx.restore();
    }
  }

  /**
   * Draw crane silhouette
   */
  private drawCrane(ctx: CanvasRenderingContext2D, wingPhase: number): void {
    ctx.fillStyle = '#333333';

    // Neck
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-2, -15);
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.arc(-2, -18, 2, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings (flapping animation)
    const wingBeat = Math.sin(wingPhase) * 0.3;
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.lineTo(-12 + wingBeat, -8);
    ctx.lineTo(-10, 2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(2, -2);
    ctx.lineTo(12 - wingBeat, -8);
    ctx.lineTo(10, 2);
    ctx.closePath();
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(4, 8);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw sparrow silhouette
   */
  private drawSparrow(ctx: CanvasRenderingContext2D, wingPhase: number): void {
    ctx.fillStyle = '#555555';

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(3, -2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    const wingBeat = Math.sin(wingPhase) * 0.2;
    ctx.beginPath();
    ctx.moveTo(-1, -1);
    ctx.lineTo(-8 + wingBeat, -4);
    ctx.lineTo(-6, 2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(1, -1);
    ctx.lineTo(8 - wingBeat, -4);
    ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(-2, 6);
    ctx.lineTo(2, 6);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Apply wind effect to objects (sway animation)
   */
  getWindSway(time: number, intensity: number = 1): { x: number; y: number } {
    const windCycle = (time * 0.01) % (Math.PI * 2);
    return {
      x: Math.sin(windCycle) * intensity * 2,
      y: Math.cos(windCycle * 0.5) * intensity,
    };
  }

  /**
   * Update wind conditions based on weather/season
   */
  setWind(strength: number, directionX: number, directionY: number): void {
    this.windStrength = strength;
    const length = Math.sqrt(directionX * directionX + directionY * directionY);
    this.windDirection = {
      x: directionX / length,
      y: directionY / length,
    };
  }

  /**
   * Darken color utility
   */
  private darkenColor(color: string, factor: number): string {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.floor(((num >> 16) & 255) * factor);
    const g = Math.floor(((num >> 8) & 255) * factor);
    const b = Math.floor((num & 255) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }
}
