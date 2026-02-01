/**
 * Atmospheric Effects - Premium lighting, shadows, fog, god rays
 * Implements dynamic day/night lighting, ambient occlusion, volumetric effects
 */

export interface LightSource {
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string; // For lanterns, fires
  time?: number;
}

export interface AtmosphericState {
  dayTime: number; // 0-1, 0 = midnight, 0.5 = noon
  fogDensity: number;
  godRayIntensity: number;
  ambientOcclusionIntensity: number;
  lightSources: LightSource[];
}

export class AtmosphericEffects {
  private godRayParticles: Array<{ x: number; y: number; opacity: number; width: number; life: number }> = [];
  private ambientOcclusionMap: Map<string, number> = new Map();

  /**
   * Calculate ambient light color based on time of day
   */
  getAmbientLightColor(dayTime: number): { r: number; g: number; b: number; intensity: number } {
    // dayTime: 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 1 = midnight
    
    if (dayTime < 0.25) {
      // Midnight to sunrise: deep blue to orange
      const t = dayTime / 0.25;
      return {
        r: 20 + t * 100,
        g: 20 + t * 60,
        b: 40 + (1 - t) * 80,
        intensity: 0.2 + t * 0.3,
      };
    } else if (dayTime < 0.5) {
      // Sunrise to noon: orange to bright yellow
      const t = (dayTime - 0.25) / 0.25;
      return {
        r: 120 + t * 60,
        g: 80 + t * 80,
        b: 60 + (1 - t) * 30,
        intensity: 0.5 + t * 0.5,
      };
    } else if (dayTime < 0.75) {
      // Noon to sunset: bright yellow to deep orange
      const t = (dayTime - 0.5) / 0.25;
      return {
        r: 180 - t * 60,
        g: 160 - t * 80,
        b: 30 + t * 40,
        intensity: 1.0 - t * 0.2,
      };
    } else {
      // Sunset to midnight: deep orange to blue
      const t = (dayTime - 0.75) / 0.25;
      return {
        r: 120 - t * 100,
        g: 80 - t * 60,
        b: 70 + t * 30,
        intensity: 0.8 - t * 0.6,
      };
    }
  }

  /**
   * Calculate shadow direction based on sun position
   */
  getShadowDirection(dayTime: number): { dx: number; dy: number } {
    // Sun moves from left to right during day
    const sunX = Math.cos((dayTime - 0.5) * Math.PI) * 100;
    const sunY = -Math.sin((dayTime - 0.5) * Math.PI) * 80 - 50;
    
    const length = Math.sqrt(sunX * sunX + sunY * sunY);
    return {
      dx: sunX / length,
      dy: sunY / length,
    };
  }

  /**
   * Draw dynamic shadow for a building
   */
  drawDynamicShadow(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    buildingWidth: number,
    buildingHeight: number,
    dayTime: number
  ): void {
    const shadowDir = this.getShadowDirection(dayTime);
    const shadowLength = 15 + Math.abs(Math.sin(dayTime * Math.PI)) * 30;
    const shadowOpacity = 0.1 + Math.abs(Math.sin(dayTime * Math.PI)) * 0.25;

    ctx.save();
    ctx.globalAlpha = shadowOpacity;
    ctx.fillStyle = '#000000';

    // Cast shadow at angle based on sun position
    ctx.beginPath();
    ctx.moveTo(screenX - buildingWidth / 2, screenY);
    ctx.lineTo(screenX + buildingWidth / 2, screenY);
    ctx.lineTo(
      screenX + buildingWidth / 2 + shadowDir.dx * shadowLength,
      screenY + shadowDir.dy * shadowLength
    );
    ctx.lineTo(
      screenX - buildingWidth / 2 + shadowDir.dx * shadowLength,
      screenY + shadowDir.dy * shadowLength
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Apply volumetric fog/mist effect
   */
  applyVolumetricFog(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    dayTime: number
  ): void {
    let fogOpacity = 0;
    let fogColor = 'rgba(200, 200, 200, ';

    // Morning mist (strong at 0.2-0.3)
    if (dayTime > 0.15 && dayTime < 0.35) {
      const morningness = 1 - Math.abs(dayTime - 0.25) / 0.1;
      fogOpacity = morningness * 0.15;
      fogColor = 'rgba(220, 220, 210, ';
    }
    // Evening golden fog (0.65-0.8)
    else if (dayTime > 0.6 && dayTime < 0.85) {
      const eveningness = 1 - Math.abs(dayTime - 0.72) / 0.15;
      fogOpacity = eveningness * 0.12;
      fogColor = 'rgba(255, 200, 140, ';
    }
    // Late night fog (0.8-1.0 and 0-0.15)
    else if (dayTime > 0.8 || dayTime < 0.15) {
      fogOpacity = 0.08;
      fogColor = 'rgba(150, 150, 160, ';
    }

    if (fogOpacity > 0) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(0, `${fogColor}0)`);
      gradient.addColorStop(0.3, `${fogColor}${fogOpacity})`);
      gradient.addColorStop(1, `${fogColor}${fogOpacity * 0.5})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
  }

  /**
   * Draw god rays (light shafts) from sky
   */
  drawGodRays(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    dayTime: number,
    animationFrame: number
  ): void {
    // God rays strongest during golden hour
    let rayIntensity = 0;
    if (dayTime > 0.2 && dayTime < 0.4) {
      rayIntensity = Math.sin((dayTime - 0.2) / 0.2 * Math.PI) * 0.08;
    } else if (dayTime > 0.6 && dayTime < 0.8) {
      rayIntensity = Math.sin((dayTime - 0.6) / 0.2 * Math.PI) * 0.1;
    }

    if (rayIntensity <= 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen'; // Additive blending

    // Create 3-4 god rays
    const rayCount = 3;
    for (let i = 0; i < rayCount; i++) {
      const rayX = (canvasWidth / (rayCount + 1)) * (i + 1);
      const rayWidth = 80 + Math.sin(animationFrame * 0.05 + i) * 20;
      const rayOpacity = rayIntensity * (0.6 + Math.sin(animationFrame * 0.03 + i) * 0.4);

      const gradient = ctx.createLinearGradient(
        rayX - rayWidth / 2,
        0,
        rayX + rayWidth / 2,
        0
      );
      gradient.addColorStop(0, `rgba(255, 255, 200, 0)`);
      gradient.addColorStop(0.5, `rgba(255, 255, 150, ${rayOpacity})`);
      gradient.addColorStop(1, `rgba(255, 255, 200, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(rayX - rayWidth / 2, 0, rayWidth, canvasHeight);
    }

    ctx.restore();
  }

  /**
   * Apply ambient occlusion darkening in corners and under objects
   */
  applyAmbientOcclusion(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    intensity: number = 0.15
  ): void {
    ctx.save();

    // Vignette-style ambient occlusion
    const gradient = ctx.createRadialGradient(
      canvasWidth / 2,
      canvasHeight / 2,
      Math.min(canvasWidth, canvasHeight) * 0.3,
      canvasWidth / 2,
      canvasHeight / 2,
      Math.max(canvasWidth, canvasHeight)
    );

    gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(0.5, `rgba(0, 0, 0, ${intensity * 0.3})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Corner darkening
    const cornerGradient = ctx.createLinearGradient(0, 0, 30, 30);
    cornerGradient.addColorStop(0, `rgba(0, 0, 0, ${intensity * 0.8})`);
    cornerGradient.addColorStop(1, `rgba(0, 0, 0, 0)`);

    ctx.fillStyle = cornerGradient;
    ctx.fillRect(0, 0, 40, 40); // Top-left
    ctx.fillRect(canvasWidth - 40, 0, 40, 40); // Top-right

    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvasWidth, 0);
    ctx.fillRect(0, canvasHeight - 40, 40, 40); // Bottom-left
    ctx.restore();

    ctx.fillRect(canvasWidth - 40, canvasHeight - 40, 40, 40); // Bottom-right

    ctx.restore();
  }

  /**
   * Draw particle dust motes in sunlight
   */
  drawDustMotes(
    ctx: CanvasRenderingContext2D,
    dayTime: number,
    animationFrame: number
  ): void {
    // Dust visible during golden hours
    if ((dayTime > 0.2 && dayTime < 0.4) || (dayTime > 0.6 && dayTime < 0.8)) {
      const dustCount = 30;
      ctx.save();

      for (let i = 0; i < dustCount; i++) {
        const x = (animationFrame * 0.5 + i * 12.3) % ctx.canvas.width;
        const y = 50 + Math.sin(animationFrame * 0.01 + i * 0.5) * 20 + i * 3;

        const opacity = Math.sin(dayTime * Math.PI) * 0.08;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.beginPath();
        ctx.arc(x, y, 1 + Math.sin(i * 0.1) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /**
   * Draw sun/moon in sky
   */
  drawCelestialBody(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    dayTime: number
  ): void {
    // Sun position based on time
    const sunX = canvasWidth * 0.2 + (dayTime * 0.6) * canvasWidth;
    const sunY = canvasHeight * 0.2 + Math.sin(dayTime * Math.PI) * canvasHeight * 0.15;

    ctx.save();

    if (dayTime > 0.2 && dayTime < 0.8) {
      // Sun
      const sunIntensity = Math.sin(dayTime * Math.PI);
      
      // Sun glow
      const glowGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 50);
      glowGradient.addColorStop(0, `rgba(255, 200, 50, ${sunIntensity * 0.4})`);
      glowGradient.addColorStop(1, `rgba(255, 150, 0, 0)`);
      
      ctx.fillStyle = glowGradient;
      ctx.fillRect(sunX - 50, sunY - 50, 100, 100);

      // Sun disk
      ctx.fillStyle = `rgba(255, 200, 50, ${sunIntensity})`;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 25, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Moon
      const moonPhase = dayTime < 0.5 ? dayTime * 2 : (1 - dayTime) * 2;
      
      ctx.fillStyle = 'rgba(240, 240, 220, 0.8)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 20, 0, Math.PI * 2);
      ctx.fill();

      // Moon shadow (crater effect)
      ctx.fillStyle = 'rgba(100, 100, 120, 0.6)';
      ctx.beginPath();
      ctx.arc(sunX + 5, sunY - 5, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Update light sources for dynamic lighting
   */
  addLightSource(light: LightSource): void {
    // Placeholder for future dynamic light accumulation
  }

  /**
   * Apply dynamic lighting from all sources
   */
  applyDynamicLighting(
    ctx: CanvasRenderingContext2D,
    lightSources: LightSource[],
    canvasWidth: number,
    canvasHeight: number
  ): void {
    ctx.save();

    for (const light of lightSources) {
      const gradient = ctx.createRadialGradient(
        light.x,
        light.y,
        0,
        light.x,
        light.y,
        light.radius
      );

      const color = light.color || 'rgba(255, 200, 100, ';
      gradient.addColorStop(0, `${color}${light.intensity})`);
      gradient.addColorStop(1, `${color}0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(
        light.x - light.radius,
        light.y - light.radius,
        light.radius * 2,
        light.radius * 2
      );
    }

    ctx.restore();
  }
}
