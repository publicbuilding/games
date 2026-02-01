/**
 * Premium Visual Effects - AAA Polish
 * Enhanced visual effects for premium game feel
 * Includes advanced lighting, volumetric effects, and visual polish
 */

export class PremiumEffects {
  /**
   * Draw dynamic light bloom on light sources (lanterns, windows, fires)
   */
  drawLightBloom(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number = 20,
    intensity: number = 0.8,
    color: string = 'rgba(255, 200, 100, '
  ): void {
    ctx.save();

    // Multiple layers for realistic bloom
    for (let i = 0; i < 3; i++) {
      const bloomRadius = radius + (i * 10);
      const bloomOpacity = intensity * (0.6 - i * 0.15);

      const gradient = ctx.createRadialGradient(x, y, radius / 2, x, y, bloomRadius);
      gradient.addColorStop(0, `${color}${bloomOpacity})`);
      gradient.addColorStop(0.5, `${color}${bloomOpacity * 0.5})`);
      gradient.addColorStop(1, `${color}0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, bloomRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draw atmospheric perspective (distant objects appear lighter)
   */
  applyAtmosphericPerspective(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    intensity: number = 0.15
  ): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, `rgba(200, 220, 255, 0)`);
    gradient.addColorStop(0.5, `rgba(200, 220, 255, ${intensity * 0.2})`);
    gradient.addColorStop(1, `rgba(180, 200, 240, ${intensity})`);

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  }

  /**
   * Draw sun flare effect
   */
  drawSunFlare(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    intensity: number = 0.5
  ): void {
    ctx.save();
    ctx.globalAlpha = intensity;

    // Main lens flare
    const flareSize = 40;
    const flareGradient = ctx.createRadialGradient(x, y, 0, x, y, flareSize);
    flareGradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
    flareGradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.4)');
    flareGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

    ctx.fillStyle = flareGradient;
    ctx.beginPath();
    ctx.arc(x, y, flareSize, 0, Math.PI * 2);
    ctx.fill();

    // Secondary flares (lens artifacts)
    const secondaryFlares = [
      { offsetX: -30, offsetY: -30, size: 8 },
      { offsetX: -60, offsetY: -60, size: 6 },
      { offsetX: 40, offsetY: 40, size: 5 },
    ];

    for (const flare of secondaryFlares) {
      ctx.globalAlpha = intensity * 0.3;
      ctx.fillStyle = 'rgba(200, 150, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(x + flare.offsetX, y + flare.offsetY, flare.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draw cinematic letterbox with enhanced styling
   */
  drawCinematicBars(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    barHeight: number = 60,
    textOverlay?: string
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#000000';

    // Top and bottom bars
    ctx.fillRect(0, 0, canvasWidth, barHeight);
    ctx.fillRect(0, canvasHeight - barHeight, canvasWidth, barHeight);

    // Optional text overlay
    if (textOverlay) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(textOverlay, canvasWidth / 2, canvasHeight / 2);
    }

    ctx.restore();
  }

  /**
   * Draw screen fade effect (transition)
   */
  drawScreenFade(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    fadeProgress: number, // 0-1
    fadeIn: boolean = true
  ): void {
    const opacity = fadeIn ? fadeProgress : 1 - fadeProgress;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  }

  /**
   * Draw distortion effect (heat waves, magic effects)
   */
  drawDistortion(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number = 30,
    intensity: number = 3,
    time: number = 0
  ): void {
    ctx.save();

    const distortionWaves = 3;
    for (let i = 0; i < distortionWaves; i++) {
      const waveRadius = radius + (i * 5);
      const waveTime = time * 0.05 + i * 0.2;
      const distortion = Math.sin(waveTime) * intensity;

      ctx.strokeStyle = `rgba(255, 200, 100, ${0.3 * (1 - i / distortionWaves)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, waveRadius + distortion, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draw particle glow effect
   */
  drawParticleGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number = 5,
    color: string = 'rgba(255, 200, 100, ',
    intensity: number = 0.7
  ): void {
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
    glowGradient.addColorStop(0, `${color}${intensity})`);
    glowGradient.addColorStop(0.5, `${color}${intensity * 0.3})`);
    glowGradient.addColorStop(1, `${color}0)`);

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw enhanced shadow with soft edges
   */
  drawSoftShadow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    shadowDistance: number = 5,
    softness: number = 2
  ): void {
    ctx.save();

    // Create soft shadow by drawing multiple semi-transparent layers
    for (let i = 0; i < softness; i++) {
      const opacity = 0.2 * (1 - i / softness);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#000000';

      ctx.beginPath();
      ctx.ellipse(
        x,
        y + shadowDistance + (i * 2),
        width / 2 + i,
        height / 4 + (i * 0.5),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draw crystalline/ice effect
   */
  drawCrystalEffect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number = 20
  ): void {
    ctx.save();

    ctx.strokeStyle = 'rgba(200, 240, 255, 0.6)';
    ctx.lineWidth = 1.5;

    // Draw geometric crystal shape
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      points.push({ x: px, y: py });
    }

    // Draw hexagon
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw internal details
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - size * 0.866, y - size * 0.5);
    ctx.lineTo(x + size * 0.866, y + size * 0.5);
    ctx.stroke();

    // Crystal glow
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5);
    glowGradient.addColorStop(0, 'rgba(200, 240, 255, 0.3)');
    glowGradient.addColorStop(1, 'rgba(150, 200, 255, 0)');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw edge highlight (cel-shading effect)
   */
  drawEdgeHighlight(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    thickness: number = 1.5,
    color: string = 'rgba(0, 0, 0, 0.6)'
  ): void {
    if (points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw glow outline around object
   */
  drawGlowOutline(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    glowColor: string = 'rgba(255, 200, 100, ',
    glowSize: number = 10
  ): void {
    if (points.length < 2) return;

    ctx.save();

    // Draw glow layers
    for (let i = glowSize; i > 0; i--) {
      const opacity = (glowSize - i) / glowSize * 0.3;
      ctx.strokeStyle = `${glowColor}${opacity})`;
      ctx.lineWidth = i * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let j = 1; j < points.length; j++) {
        ctx.lineTo(points[j].x, points[j].y);
      }
      ctx.stroke();
    }

    ctx.restore();
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
