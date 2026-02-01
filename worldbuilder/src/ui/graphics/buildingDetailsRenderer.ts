/**
 * Building Details Renderer - Premium building visuals
 * Roof tiles, window glow, smoke, lanterns, flags, construction details
 */

export interface BuildingDetail {
  type: 'lantern' | 'flag' | 'chimney' | 'window' | 'roof_tile';
  x: number;
  y: number;
  intensity?: number;
  color?: string;
}

export class BuildingDetailsRenderer {
  /**
   * Draw detailed roof tiles with pattern
   */
  drawRoofTiles(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    roofWidth: number,
    roofHeight: number,
    roofColor: string
  ): void {
    // Base roof
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(screenX - roofWidth / 2, screenY);
    ctx.lineTo(screenX, screenY - roofHeight);
    ctx.lineTo(screenX + roofWidth / 2, screenY);
    ctx.closePath();
    ctx.fill();

    // Roof ridge
    ctx.strokeStyle = this.darkenColor(roofColor, 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX - 3, screenY - roofHeight + 2);
    ctx.lineTo(screenX + 3, screenY - roofHeight + 2);
    ctx.stroke();

    // Tile pattern
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 0.5;

    for (let row = 0; row < 3; row++) {
      const rowY = screenY - roofHeight + (row * roofHeight / 3);
      const rowWidth = roofWidth * (1 - row / 6);

      for (let col = 0; col < 4 + row; col++) {
        const tileX = screenX - rowWidth / 2 + (col * rowWidth / (4 + row));
        const tileY = rowY + 2;

        // Tile highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + row * 0.02})`;
        ctx.fillRect(tileX - 2, tileY, 4, 3);

        // Tile outline
        ctx.strokeRect(tileX - 2.5, tileY - 1, 5, 3);
      }
    }

    // Roof eaves shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.moveTo(screenX - roofWidth / 2, screenY);
    ctx.lineTo(screenX - roofWidth / 2 - 3, screenY + 2);
    ctx.lineTo(screenX + roofWidth / 2 + 3, screenY + 2);
    ctx.lineTo(screenX + roofWidth / 2, screenY);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw window glow for night time
   */
  drawWindowGlow(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    buildingWidth: number,
    buildingHeight: number,
    dayTime: number
  ): void {
    const nightness = (dayTime > 0.75 || dayTime < 0.25) ? 1 - Math.abs(dayTime - (dayTime < 0.5 ? 0 : 1)) : 0;
    
    if (nightness < 0.3) return;

    const glowIntensity = nightness * 0.8;

    // Windows arrangement
    const windowPositions = [
      { x: -buildingWidth / 3, y: -buildingHeight / 3 },
      { x: 0, y: -buildingHeight / 3 },
      { x: buildingWidth / 3, y: -buildingHeight / 3 },
      { x: -buildingWidth / 3, y: 0 },
      { x: buildingWidth / 3, y: 0 },
    ];

    for (const pos of windowPositions) {
      const windowX = screenX + pos.x;
      const windowY = screenY + pos.y;

      // Window glow halo
      const glowGradient = ctx.createRadialGradient(windowX, windowY, 0, windowX, windowY, 8);
      glowGradient.addColorStop(0, `rgba(255, 200, 100, ${glowIntensity * 0.6})`);
      glowGradient.addColorStop(1, `rgba(255, 150, 50, 0)`);

      ctx.fillStyle = glowGradient;
      ctx.fillRect(windowX - 8, windowY - 8, 16, 16);

      // Window frame
      ctx.fillStyle = `rgba(255, 200, 100, ${glowIntensity})`;
      ctx.fillRect(windowX - 3, windowY - 3, 6, 6);

      // Window glass reflection
      ctx.fillStyle = `rgba(255, 255, 200, ${glowIntensity * 0.4})`;
      ctx.fillRect(windowX - 2, windowY - 2, 2, 2);
    }
  }

  /**
   * Draw chimney with smoke
   */
  drawChimneyWithSmoke(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    animationFrame: number
  ): void {
    // Chimney structure
    ctx.fillStyle = '#8b6f47';
    ctx.fillRect(screenX - 2, screenY - 20, 4, 20);

    // Chimney rim
    ctx.fillStyle = '#a0826d';
    ctx.fillRect(screenX - 3, screenY - 22, 6, 2);

    // Smoke puffs
    const smokeCount = 3;
    for (let i = 0; i < smokeCount; i++) {
      const smokeTime = (animationFrame + i * 200) % 400;
      const smokePhase = smokeTime / 400;
      const smokeY = screenY - 25 - smokePhase * 30;
      const smokeX = screenX + Math.sin(smokePhase * Math.PI * 2) * 3;
      const smokeRadius = 3 + smokePhase * 4;
      const smokeOpacity = Math.sin(smokePhase * Math.PI) * 0.3;

      ctx.fillStyle = `rgba(200, 200, 200, ${smokeOpacity})`;
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, smokeRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Draw decorative lanterns on building
   */
  drawHangingLanterns(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    lanternPositions: Array<{ x: number; y: number }>,
    dayTime: number,
    animationFrame: number
  ): void {
    for (const pos of lanternPositions) {
      const lanternX = screenX + pos.x;
      const lanternY = screenY + pos.y;

      // Sway animation
      const swayAmount = Math.sin(animationFrame * 0.02) * 2;

      // Lantern structure
      ctx.fillStyle = '#8b0000';
      ctx.beginPath();
      ctx.rect(lanternX + swayAmount - 2, lanternY, 4, 6);
      ctx.fill();

      // Lantern paper sides
      ctx.strokeStyle = '#a0000080';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lanternX + swayAmount - 2, lanternY);
      ctx.lineTo(lanternX + swayAmount - 2, lanternY + 6);
      ctx.moveTo(lanternX + swayAmount + 2, lanternY);
      ctx.lineTo(lanternX + swayAmount + 2, lanternY + 6);
      ctx.stroke();

      // Lantern glow (especially at night)
      const glowIntensity = dayTime > 0.75 || dayTime < 0.25 ? 0.8 : 0.2;
      const glowGradient = ctx.createRadialGradient(lanternX + swayAmount, lanternY + 3, 0, lanternX + swayAmount, lanternY + 3, 8);
      glowGradient.addColorStop(0, `rgba(255, 150, 50, ${glowIntensity * 0.5})`);
      glowGradient.addColorStop(1, `rgba(255, 100, 0, 0)`);

      ctx.fillStyle = glowGradient;
      ctx.fillRect(lanternX + swayAmount - 8, lanternY - 5, 16, 16);

      // Lantern light core
      ctx.fillStyle = `rgba(255, 200, 100, ${glowIntensity * 0.7})`;
      ctx.beginPath();
      ctx.arc(lanternX + swayAmount, lanternY + 3, 2, 0, Math.PI * 2);
      ctx.fill();

      // Chain/rope attachment
      ctx.strokeStyle = '#8b7355';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lanternX + swayAmount, lanternY);
      ctx.lineTo(lanternX + swayAmount - 3, lanternY - 4);
      ctx.stroke();
    }
  }

  /**
   * Draw decorative flags and banners
   */
  drawFlags(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    flagPositions: Array<{ x: number; y: number; size: 'small' | 'large' }>,
    animationFrame: number
  ): void {
    for (const pos of flagPositions) {
      const flagX = screenX + pos.x;
      const flagY = screenY + pos.y;

      const isLarge = pos.size === 'large';
      const flagWidth = isLarge ? 15 : 10;
      const flagHeight = isLarge ? 10 : 7;

      // Flagpole
      ctx.strokeStyle = '#8b7355';
      ctx.lineWidth = isLarge ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(flagX, flagY);
      ctx.lineTo(flagX, flagY + 15);
      ctx.stroke();

      // Flag wave animation
      const waveAmount = Math.sin(animationFrame * 0.05) * 2;
      const wavePhase = animationFrame * 0.1;

      ctx.fillStyle = '#c41e3a'; // Red flag
      ctx.beginPath();
      ctx.moveTo(flagX, flagY);

      // Wavy flag edge
      for (let i = 0; i <= flagWidth; i++) {
        const waveY = flagY + Math.sin((wavePhase + i * 0.3) * Math.PI) * 2;
        ctx.lineTo(flagX + i, waveY);
      }

      ctx.lineTo(flagX + flagWidth, flagY + flagHeight);
      ctx.lineTo(flagX, flagY);
      ctx.closePath();
      ctx.fill();

      // Flag border
      ctx.strokeStyle = '#8b0000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Emblem (gold circle on red)
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(flagX + flagWidth / 2, flagY + flagHeight / 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Draw construction scaffolding
   */
  drawConstructionScaffolding(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    buildingWidth: number,
    buildingHeight: number,
    progressPhase: number // 0-1
  ): void {
    const scaffoldingIntensity = 1 - progressPhase; // Less scaffolding as building progresses

    if (scaffoldingIntensity < 0.1) return;

    ctx.save();
    ctx.globalAlpha = scaffoldingIntensity;

    // Horizontal beams
    const beamCount = Math.ceil(buildingHeight / 8);
    for (let i = 0; i < beamCount; i++) {
      const beamY = screenY - (buildingHeight * (1 - progressPhase)) + (i * 8);

      // Bamboo-like horizontal beams
      ctx.fillStyle = '#c4a57b';
      ctx.fillRect(screenX - buildingWidth / 2 - 3, beamY, buildingWidth + 6, 2);

      // Beam knots
      ctx.fillStyle = '#a0826d';
      ctx.fillRect(screenX - buildingWidth / 2 - 2, beamY + 1, 1, 1);
      ctx.fillRect(screenX + buildingWidth / 2 - 1, beamY + 1, 1, 1);
    }

    // Vertical supports
    for (let i = 0; i < 3; i++) {
      const supportX = screenX - buildingWidth / 2 + (i * buildingWidth / 2);
      ctx.fillStyle = '#9a8c7a';
      ctx.fillRect(supportX - 1, screenY - buildingHeight * (1 - progressPhase), 2, buildingHeight * (1 - progressPhase) + 5);

      // Diagonal braces
      ctx.strokeStyle = '#9a8c7a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(supportX, screenY - buildingHeight * (1 - progressPhase));
      ctx.lineTo(supportX + 8, screenY - buildingHeight * (1 - progressPhase) + 8);
      ctx.stroke();
    }

    // Workers (construction crews)
    for (let i = 0; i < 2; i++) {
      const workerX = screenX - buildingWidth / 4 + i * buildingWidth / 2;
      const workerY = screenY - buildingHeight * (1 - progressPhase) - 5;

      // Worker silhouette
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(workerX, workerY, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(workerX - 1, workerY + 2, 2, 3);
    }

    ctx.restore();
  }

  /**
   * Draw stone foundation/base
   */
  drawStoneFoundation(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    foundationWidth: number
  ): void {
    const stoneSize = 4;
    const stoneCount = Math.ceil(foundationWidth / stoneSize);

    ctx.save();

    for (let i = 0; i < stoneCount; i++) {
      const stoneX = screenX - foundationWidth / 2 + i * stoneSize;

      // Stone block with mortar
      ctx.fillStyle = '#6b5d48';
      ctx.fillRect(stoneX, screenY - 2, stoneSize - 1, 4);

      // Stone texture
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(stoneX, screenY - 2, stoneSize - 1, 4);

      // Mortar lines
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
      ctx.beginPath();
      ctx.moveTo(stoneX + stoneSize - 1, screenY - 2);
      ctx.lineTo(stoneX + stoneSize - 1, screenY + 2);
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
