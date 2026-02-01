/**
 * Weather & Seasons System - Rain, snow, autumn leaves, heat shimmer
 * Premium weather effects for full environmental immersion
 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog';

export interface WeatherState {
  type: WeatherType;
  intensity: number; // 0-1
  season: Season;
  temperature: number; // -30 to 40
}

export interface Raindrop {
  x: number;
  y: number;
  vy: number;
  length: number;
}

export interface Snowflake {
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  rotation: number;
  angularVelocity: number;
}

export interface AutumnLeaf {
  x: number;
  y: number;
  vy: number;
  vx: number;
  rotation: number;
  angularVelocity: number;
  color: string;
}

export class WeatherAndSeasons {
  private raindrops: Raindrop[] = [];
  private snowflakes: Snowflake[] = [];
  private autumnLeaves: AutumnLeaf[] = [];
  private accumulatedSnow: number = 0; // 0-1, how much snow on ground
  private roofSnowAccumulation: Map<string, number> = new Map();

  /**
   * Get season-specific color palette
   */
  getSeasonPalette(season: Season): { primary: string; secondary: string; skyColor: string } {
    const palettes = {
      spring: {
        primary: '#90ee90',
        secondary: '#98fb98',
        skyColor: '#87ceeb',
      },
      summer: {
        primary: '#228b22',
        secondary: '#32cd32',
        skyColor: '#1e90ff',
      },
      autumn: {
        primary: '#ff6347',
        secondary: '#ffa500',
        skyColor: '#daa520',
      },
      winter: {
        primary: '#add8e6',
        secondary: '#e0ffff',
        skyColor: '#b0c4de',
      },
    };
    return palettes[season];
  }

  /**
   * Draw rain effect
   */
  drawRain(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    intensity: number,
    animationFrame: number
  ): void {
    if (intensity <= 0) {
      this.raindrops = [];
      return;
    }

    // Create raindrops
    const targetDropCount = Math.floor(intensity * 200);
    while (this.raindrops.length < targetDropCount) {
      this.raindrops.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight - canvasHeight,
        vy: 3 + Math.random() * 2,
        length: 5 + Math.random() * 5,
      });
    }

    // Update and draw raindrops
    ctx.save();
    ctx.strokeStyle = `rgba(200, 220, 255, ${intensity * 0.6})`;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    this.raindrops = this.raindrops.filter(drop => {
      drop.y += drop.vy;
      drop.x += Math.sin(drop.y * 0.02) * 0.5; // Wind sway

      if (drop.y > canvasHeight) return false;

      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 0.5, drop.y - drop.length);
      ctx.stroke();

      return true;
    });

    ctx.restore();
  }

  /**
   * Draw puddle reflections (rain effect on ground)
   */
  drawPuddleReflections(
    ctx: CanvasRenderingContext2D,
    canvasHeight: number,
    intensity: number
  ): void {
    if (intensity <= 0) return;

    ctx.save();
    ctx.globalAlpha = intensity * 0.3;

    // Horizontal shimmer lines for water reflection
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, canvasHeight - 40 + i * 8);
      ctx.lineTo(canvasWidth, canvasHeight - 40 + i * 8);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draw snow effect
   */
  drawSnow(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    intensity: number,
    animationFrame: number
  ): void {
    if (intensity <= 0) {
      this.snowflakes = [];
      this.accumulatedSnow = 0;
      return;
    }

    // Accumulate snow on ground
    this.accumulatedSnow = Math.min(1, this.accumulatedSnow + intensity * 0.001);

    // Create snowflakes
    const targetFlakeCount = Math.floor(intensity * 150);
    while (this.snowflakes.length < targetFlakeCount) {
      this.snowflakes.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight - canvasHeight,
        vy: 0.5 + Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 0.5,
        size: 2 + Math.random() * 3,
        rotation: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.1,
      });
    }

    // Update and draw snowflakes
    ctx.save();

    this.snowflakes = this.snowflakes.filter(flake => {
      flake.y += flake.vy;
      flake.x += flake.vx;
      flake.rotation += flake.angularVelocity;

      if (flake.y > canvasHeight) return false;

      ctx.save();
      ctx.translate(flake.x, flake.y);
      ctx.rotate(flake.rotation);
      ctx.globalAlpha = 0.8;

      // Six-pointed snowflake
      ctx.strokeStyle = '#e0ffff';
      ctx.lineWidth = 0.5;

      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i / 6) * Math.PI * 2);

        // Main point
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, flake.size);
        ctx.stroke();

        // Side branches
        ctx.beginPath();
        ctx.moveTo(0, flake.size * 0.5);
        ctx.lineTo(-flake.size * 0.3, flake.size * 0.8);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, flake.size * 0.5);
        ctx.lineTo(flake.size * 0.3, flake.size * 0.8);
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore();
      return true;
    });

    ctx.restore();
  }

  /**
   * Draw snow accumulation on ground
   */
  drawSnowOnGround(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (this.accumulatedSnow < 0.05) return;

    ctx.save();
    ctx.globalAlpha = this.accumulatedSnow * 0.7;

    // Snow blanket on bottom
    const snowHeight = this.accumulatedSnow * 60;
    ctx.fillStyle = '#f0ffff';
    ctx.fillRect(0, canvasHeight - snowHeight, canvasWidth, snowHeight);

    // Snow drift lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, canvasHeight - snowHeight + i * 15);
      ctx.quadraticCurveTo(
        canvasWidth / 2,
        canvasHeight - snowHeight + i * 15 - 3,
        canvasWidth,
        canvasHeight - snowHeight + i * 15
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draw snow accumulation on roofs
   */
  drawSnowOnRoof(
    ctx: CanvasRenderingContext2D,
    roofX: number,
    roofY: number,
    roofWidth: number,
    intensity: number
  ): void {
    const buildingId = `${roofX},${roofY}`;
    const currentSnow = this.roofSnowAccumulation.get(buildingId) || 0;
    const targetSnow = intensity;

    // Smoothly accumulate/melt snow
    const newSnow = currentSnow + (targetSnow - currentSnow) * 0.1;
    this.roofSnowAccumulation.set(buildingId, newSnow);

    if (newSnow < 0.05) return;

    ctx.save();
    ctx.globalAlpha = newSnow * 0.8;
    ctx.fillStyle = '#f0ffff';

    // Snow cap on roof
    const snowDepth = newSnow * 8;
    ctx.beginPath();
    ctx.moveTo(roofX - roofWidth / 2, roofY);
    ctx.lineTo(roofX, roofY - snowDepth);
    ctx.lineTo(roofX + roofWidth / 2, roofY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw autumn leaves falling
   */
  drawAutumnLeaves(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    season: Season,
    animationFrame: number
  ): void {
    if (season !== 'autumn') {
      this.autumnLeaves = [];
      return;
    }

    // Create leaves
    const targetLeafCount = 60;
    while (this.autumnLeaves.length < targetLeafCount) {
      const colors = ['#ff6347', '#ffa500', '#ff8c00', '#dc143c', '#ff4500'];
      this.autumnLeaves.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight - canvasHeight,
        vy: 0.3 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 0.8,
        rotation: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Update and draw leaves
    ctx.save();

    this.autumnLeaves = this.autumnLeaves.filter(leaf => {
      leaf.y += leaf.vy;
      leaf.x += leaf.vx;
      leaf.rotation += leaf.angularVelocity;

      if (leaf.y > canvasHeight) return false;

      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.rotation);

      // Leaf shape
      ctx.fillStyle = leaf.color;
      ctx.beginPath();
      // Simplified leaf shape
      ctx.ellipse(0, 0, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Vein
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(0, 3);
      ctx.stroke();

      ctx.restore();
      return true;
    });

    ctx.restore();
  }

  /**
   * Draw heat shimmer (summer effect)
   */
  drawHeatShimmer(
    ctx: CanvasRenderingContext2D,
    temperature: number,
    canvasHeight: number,
    animationFrame: number
  ): void {
    if (temperature < 25) return;

    const shimmerIntensity = Math.max(0, (temperature - 25) / 15) * 0.3;
    if (shimmerIntensity <= 0) return;

    ctx.save();
    ctx.globalAlpha = shimmerIntensity;

    // Wavy distortion effect on horizon
    const waveAmount = 3 + (temperature - 25) * 0.3;
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)';
    ctx.lineWidth = 2;

    for (let i = 0; i < 3; i++) {
      const lineY = canvasHeight * 0.7 - i * 15;
      ctx.beginPath();

      for (let x = 0; x < ctx.canvas.width; x += 10) {
        const wave = Math.sin((x * 0.01) + (animationFrame * 0.1) + i) * waveAmount;
        if (x === 0) ctx.moveTo(x, lineY + wave);
        else ctx.lineTo(x, lineY + wave);
      }

      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Apply seasonal color tinting to terrain
   */
  applySeasonalTint(
    ctx: CanvasRenderingContext2D,
    season: Season,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    ctx.save();

    const tints = {
      spring: 'rgba(144, 238, 144, 0.05)', // Light green
      summer: 'rgba(50, 205, 50, 0.05)', // Bright green
      autumn: 'rgba(255, 165, 0, 0.08)', // Orange
      winter: 'rgba(176, 196, 222, 0.08)', // Light blue
    };

    ctx.globalAlpha = 0.08;
    ctx.fillStyle = tints[season];
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.restore();
  }

  /**
   * Get season based on day progress
   */
  getSeasonFromDayProgress(dayProgress: number): Season {
    // dayProgress: 0-1, cycles through year
    if (dayProgress < 0.25) return 'winter';
    if (dayProgress < 0.5) return 'spring';
    if (dayProgress < 0.75) return 'summer';
    return 'autumn';
  }

  /**
   * Update weather state
   */
  updateWeather(weatherState: WeatherState): void {
    // Process weather type updates
  }

  /**
   * Clear all weather particles
   */
  clearWeather(): void {
    this.raindrops = [];
    this.snowflakes = [];
    this.autumnLeaves = [];
  }
}
