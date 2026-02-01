/**
 * Activity Indicators System
 * Shows working/idle state of buildings with visual feedback
 */

import { Building } from '../../types';
import { getBuildingDef } from '../../core/buildings';

export interface ActivityIndicator {
  building: Building;
  isWorking: boolean;
  smokePuffTimer: number;
  smokeAngle: number;
}

export class ActivityIndicatorSystem {
  private indicators: Map<string, ActivityIndicator> = new Map();

  /**
   * Update activity for a building
   */
  updateActivity(building: Building): void {
    const id = `${building.x}_${building.y}`;
    const def = getBuildingDef(building.type);
    
    // Check if building is working
    const isWorking = building.workers >= def.workers && def.production;

    let indicator = this.indicators.get(id);
    if (!indicator) {
      indicator = {
        building,
        isWorking,
        smokePuffTimer: 0,
        smokeAngle: Math.random() * Math.PI * 2,
      };
      this.indicators.set(id, indicator);
    } else {
      indicator.isWorking = isWorking;
      indicator.building = building;
    }
  }

  /**
   * Update all activity indicators
   */
  update(buildings: Building[], deltaTime: number): void {
    // Update existing indicators
    for (const indicator of this.indicators.values()) {
      if (indicator.isWorking) {
        indicator.smokePuffTimer += deltaTime;
        // Puff every 200ms
        if (indicator.smokePuffTimer > 200) {
          indicator.smokePuffTimer = 0;
          indicator.smokeAngle = Math.random() * Math.PI * 2;
        }
      }
    }

    // Update activity status for all buildings
    for (const building of buildings) {
      this.updateActivity(building);
    }
  }

  /**
   * Get indicator for a building
   */
  getIndicator(x: number, y: number): ActivityIndicator | undefined {
    return this.indicators.get(`${x}_${y}`);
  }

  /**
   * Draw activity indicator (smoke, glow, etc)
   */
  drawActivityIndicator(
    ctx: CanvasRenderingContext2D,
    building: Building,
    screenX: number,
    screenY: number,
    tileSize: number,
    zoom: number
  ): void {
    const indicator = this.getIndicator(building.x, building.y);
    if (!indicator) return;

    const def = getBuildingDef(building.type);

    if (indicator.isWorking) {
      // Draw animated smoke puffs
      const smokeY = screenY - tileSize * 0.5;
      const smokeX = screenX + tileSize * 0.3;

      // Smoke puff animation
      const puffPhase = indicator.smokePuffTimer / 200; // 0-1
      ctx.save();
      ctx.globalAlpha = 1 - puffPhase; // Fade out
      ctx.fillStyle = 'rgba(150, 150, 150, 0.6)';
      ctx.beginPath();
      const puffSize = tileSize * 0.2 * (0.5 + puffPhase);
      ctx.arc(smokeX, smokeY - puffPhase * tileSize * 0.3, puffSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Glow effect for working building
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 500) * 0.2;
      ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(screenX + tileSize * 0.5, screenY + tileSize * 0.5, tileSize * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (def.workers > 0) {
      // Idle/dimmed state
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(screenX, screenY, tileSize, tileSize);
      
      // Draw "Zzz" for idle buildings
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#888';
      ctx.font = `${Math.floor(tileSize * 0.4)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Zzz', screenX + tileSize * 0.75, screenY + tileSize * 0.25);
      ctx.restore();
    }

    // Draw production progress bar if producing
    if (indicator.isWorking && building.productionProgress > 0) {
      const barWidth = tileSize * 0.8;
      const barHeight = 3;
      const barX = screenX + (tileSize - barWidth) / 2;
      const barY = screenY + tileSize + 5;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Progress
      ctx.fillStyle = 'rgba(100, 200, 100, 0.8)';
      ctx.fillRect(barX, barY, barWidth * Math.min(building.productionProgress, 1), barHeight);

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
  }

  /**
   * Clear all indicators
   */
  clear(): void {
    this.indicators.clear();
  }
}

export const activityIndicatorSystem = new ActivityIndicatorSystem();
