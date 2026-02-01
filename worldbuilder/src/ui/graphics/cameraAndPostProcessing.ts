/**
 * Camera & Post-Processing Effects
 * Smooth camera pan/zoom with easing, camera shake, depth of field, vignette
 */

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  targetX?: number;
  targetY?: number;
  targetZoom?: number;
  shakeAmount: number;
  shakeDecay: number;
}

export class CameraAndPostProcessing {
  private cameraState: CameraState = {
    x: 0,
    y: 0,
    zoom: 1,
    shakeAmount: 0,
    shakeDecay: 0.95,
  };

  private depthOfFieldStrength: number = 0;
  private vignetteStrength: number = 0.3;
  private cameraEasingDuration: number = 500; // ms
  private cameraEasingStart: number = 0;
  private easeProgression: number = 0;

  /**
   * Get current camera state
   */
  getCamera(): CameraState {
    return this.cameraState;
  }

  /**
   * Smoothly pan camera to target
   */
  panToTarget(targetX: number, targetY: number, duration: number = 500): void {
    this.cameraState.targetX = targetX;
    this.cameraState.targetY = targetY;
    this.cameraEasingDuration = duration;
    this.cameraEasingStart = Date.now();
    this.easeProgression = 0;
  }

  /**
   * Smoothly zoom camera
   */
  zoomTo(targetZoom: number, duration: number = 300): void {
    this.cameraState.targetZoom = targetZoom;
    this.cameraEasingDuration = duration;
    this.cameraEasingStart = Date.now();
    this.easeProgression = 0;
  }

  /**
   * Apply camera shake (for impact events)
   */
  shake(intensity: number = 1, duration: number = 200): void {
    this.cameraState.shakeAmount = intensity;
    this.cameraState.shakeDecay = Math.pow(0.95, 16 / (duration / 16)); // Decay over duration
  }

  /**
   * Update camera position with easing
   */
  updateCamera(deltaTime: number): void {
    const now = Date.now();
    const elapsed = now - this.cameraEasingStart;
    const progress = Math.min(1, elapsed / this.cameraEasingDuration);

    // Ease camera pan
    if (this.cameraState.targetX !== undefined) {
      const easedProgress = this.easeOutCubic(progress);
      this.cameraState.x += 
        (this.cameraState.targetX - this.cameraState.x) * (easedProgress - this.easeProgression) / (1 - this.easeProgression);
    }

    if (this.cameraState.targetY !== undefined) {
      const easedProgress = this.easeOutCubic(progress);
      this.cameraState.y += 
        (this.cameraState.targetY - this.cameraState.y) * (easedProgress - this.easeProgression) / (1 - this.easeProgression);
    }

    // Ease camera zoom
    if (this.cameraState.targetZoom !== undefined) {
      const easedProgress = this.easeOutCubic(progress);
      this.cameraState.zoom += 
        (this.cameraState.targetZoom - this.cameraState.zoom) * (easedProgress - this.easeProgression) / (1 - this.easeProgression);
    }

    this.easeProgression = this.easeOutCubic(progress);

    // Update camera shake
    if (this.cameraState.shakeAmount > 0) {
      this.cameraState.shakeAmount *= this.cameraState.shakeDecay;
      if (this.cameraState.shakeAmount < 0.01) {
        this.cameraState.shakeAmount = 0;
      }
    }
  }

  /**
   * Get camera offset with shake
   */
  getCameraWithShake(): { x: number; y: number; zoom: number } {
    const shakeX = (Math.random() - 0.5) * this.cameraState.shakeAmount * 2;
    const shakeY = (Math.random() - 0.5) * this.cameraState.shakeAmount * 2;

    return {
      x: this.cameraState.x + shakeX,
      y: this.cameraState.y + shakeY,
      zoom: this.cameraState.zoom,
    };
  }

  /**
   * Apply depth of field (blur distant elements)
   */
  applyDepthOfField(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    strength: number = 0.2
  ): void {
    if (strength <= 0) return;

    ctx.save();

    // Create radial blur effect
    const gradient = ctx.createRadialGradient(
      canvasWidth / 2,
      canvasHeight / 2,
      Math.min(canvasWidth, canvasHeight) * 0.2,
      canvasWidth / 2,
      canvasHeight / 2,
      Math.min(canvasWidth, canvasHeight) * 0.8
    );

    gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(0.5, `rgba(0, 0, 0, ${strength * 0.1})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${strength * 0.25})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Outer blur is handled by vignette overlaid
    ctx.restore();
  }

  /**
   * Apply vignette effect (darker edges)
   */
  applyVignette(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    strength: number = 0.3
  ): void {
    ctx.save();

    const gradient = ctx.createRadialGradient(
      canvasWidth / 2,
      canvasHeight / 2,
      Math.min(canvasWidth, canvasHeight) * 0.4,
      canvasWidth / 2,
      canvasHeight / 2,
      Math.min(canvasWidth, canvasHeight) * 0.95
    );

    gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(0.5, `rgba(0, 0, 0, ${strength * 0.15})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${strength})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Corner vignette (stronger in corners)
    const cornerGradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
    cornerGradient.addColorStop(0, `rgba(0, 0, 0, ${strength * 0.2})`);
    cornerGradient.addColorStop(0.5, `rgba(0, 0, 0, 0)`);
    cornerGradient.addColorStop(1, `rgba(0, 0, 0, ${strength * 0.2})`);

    ctx.fillStyle = cornerGradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.restore();
  }

  /**
   * Apply chromatic aberration (color shift on edges)
   */
  applyChromaticAberration(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    strength: number = 2
  ): void {
    if (strength <= 0) return;

    ctx.save();

    // Red channel shift right
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
    ctx.fillRect(canvasWidth - strength, 0, strength, canvasHeight);

    // Blue channel shift left
    ctx.fillStyle = 'rgba(0, 0, 255, 1)';
    ctx.fillRect(0, 0, strength, canvasHeight);

    ctx.restore();
  }

  /**
   * Draw focus effect on important area
   */
  drawFocusRectangle(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    focusX: number,
    focusY: number,
    focusWidth: number,
    focusHeight: number,
    strength: number = 0.4
  ): void {
    ctx.save();

    // Darken everything except focus area
    ctx.globalAlpha = strength;
    ctx.fillStyle = '#000000';

    // Top rectangle
    ctx.fillRect(0, 0, canvasWidth, focusY);

    // Bottom rectangle
    ctx.fillRect(0, focusY + focusHeight, canvasWidth, canvasHeight - (focusY + focusHeight));

    // Left rectangle
    ctx.fillRect(0, focusY, focusX, focusHeight);

    // Right rectangle
    ctx.fillRect(focusX + focusWidth, focusY, canvasWidth - (focusX + focusWidth), focusHeight);

    // Focus area border highlight
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(focusX, focusY, focusWidth, focusHeight);

    ctx.restore();
  }

  /**
   * Draw cinematic bars (letter box effect)
   */
  drawCinematicBars(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    barHeight: number = 50
  ): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';

    // Top bar
    ctx.fillRect(0, 0, canvasWidth, barHeight);

    // Bottom bar
    ctx.fillRect(0, canvasHeight - barHeight, canvasWidth, barHeight);

    ctx.restore();
  }

  /**
   * Apply screen flash effect (for achievements, events)
   */
  drawScreenFlash(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    flashProgress: number, // 0-1
    color: string = 'rgba(255, 255, 255, '
  ): void {
    // Flash fades in then out
    let alpha = 0;
    if (flashProgress < 0.5) {
      alpha = (0.5 - flashProgress) / 0.5 * 0.6;
    } else {
      alpha = (flashProgress - 0.5) / 0.5 * 0.6;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `${color}1)`;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  }

  /**
   * Apply bloom effect (glow on bright areas)
   */
  applyBloom(
    ctx: CanvasRenderingContext2D,
    bloomStrength: number = 0.1
  ): void {
    if (bloomStrength <= 0) return;

    ctx.save();
    ctx.globalAlpha = bloomStrength;

    // Bloom is typically done with blur, but we approximate with glow
    ctx.fillStyle = 'rgba(255, 255, 150, 0.2)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.restore();
  }

  /**
   * Easing functions
   */
  private easeOutCubic(t: number): number {
    const t1 = t - 1;
    return t1 * t1 * t1 + 1;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /**
   * Set depth of field strength
   */
  setDepthOfFieldStrength(strength: number): void {
    this.depthOfFieldStrength = Math.max(0, Math.min(1, strength));
  }

  /**
   * Set vignette strength
   */
  setVignetteStrength(strength: number): void {
    this.vignetteStrength = Math.max(0, Math.min(1, strength));
  }

  /**
   * Get vignette strength
   */
  getVignetteStrength(): number {
    return this.vignetteStrength;
  }

  /**
   * Get depth of field strength
   */
  getDepthOfFieldStrength(): number {
    return this.depthOfFieldStrength;
  }
}
