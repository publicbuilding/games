/**
 * Character Polish Renderer - Premium character visuals
 * Distinct silhouettes, clothing detail, idle and work animations
 */

export interface CharacterType {
  type: 'farmer' | 'merchant' | 'warrior' | 'monk' | 'fisherman';
  x: number;
  y: number;
  direction: 0 | 1 | 2 | 3; // 0=down, 1=right, 2=up, 3=left
  animation: 'idle' | 'walk' | 'work' | 'harvest' | 'carry';
  animationTime: number;
}

export class CharacterPolishRenderer {
  /**
   * Draw character with detailed costume
   */
  drawCharacter(
    ctx: CanvasRenderingContext2D,
    character: CharacterType,
    animationFrame: number
  ): void {
    ctx.save();
    ctx.translate(character.x, character.y);

    // Apply direction rotation
    if (character.direction === 1) ctx.scale(-1, 1);
    else if (character.direction === 2) ctx.rotate(Math.PI);
    else if (character.direction === 3) ctx.scale(-1, 1);

    switch (character.type) {
      case 'farmer':
        this.drawFarmer(ctx, character.animation, animationFrame);
        break;
      case 'merchant':
        this.drawMerchant(ctx, character.animation, animationFrame);
        break;
      case 'warrior':
        this.drawWarrior(ctx, character.animation, animationFrame);
        break;
      case 'monk':
        this.drawMonk(ctx, character.animation, animationFrame);
        break;
      case 'fisherman':
        this.drawFisherman(ctx, character.animation, animationFrame);
        break;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw farmer character
   */
  private drawFarmer(ctx: CanvasRenderingContext2D, animation: string, frame: number): void {
    // Wide-brimmed hat
    ctx.fillStyle = '#8b6f47';
    ctx.beginPath();
    ctx.ellipse(0, -5, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hat brim
    ctx.fillStyle = '#a0826d';
    ctx.beginPath();
    ctx.ellipse(0, -5, 7, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(0, -2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Loose farming clothes (robes)
    ctx.fillStyle = '#7d6b4f';
    ctx.beginPath();
    ctx.ellipse(0, 2, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Clothing folds
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.quadraticCurveTo(-3, 3, -2, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.quadraticCurveTo(3, 3, 2, 7);
    ctx.stroke();

    // Arms (dynamic based on animation)
    const armBend = animation === 'harvest' ? Math.sin(frame * 0.1) * 15 : 0;
    this.drawArm(ctx, -3, -1, -4 + armBend, 3, '#d4a574');
    this.drawArm(ctx, 3, -1, 4 - armBend, 3, '#d4a574');

    // Legs
    this.drawLeg(ctx, -1.5, 7, 0);
    this.drawLeg(ctx, 1.5, 7, 0);

    // Tool (hoe)
    if (animation === 'harvest' || animation === 'work') {
      const toolRotation = Math.sin(frame * 0.1) * 0.3;
      ctx.save();
      ctx.translate(-3, 2);
      ctx.rotate(toolRotation);
      ctx.strokeStyle = '#8b7355';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 8);
      ctx.stroke();

      // Hoe head
      ctx.fillStyle = '#696969';
      ctx.fillRect(-2, 8, 4, 1);
      ctx.restore();
    }
  }

  /**
   * Draw merchant character
   */
  private drawMerchant(ctx: CanvasRenderingContext2D, animation: string, frame: number): void {
    // Merchant hat (round)
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.arc(0, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Hat detail
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -5, 3.5, 0, Math.PI * 2);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(0, -1, 3, 0, Math.PI * 2);
    ctx.fill();

    // Elegant robe with pattern
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.ellipse(0, 3, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gold embroidery
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 0.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 1.5, 1);
      ctx.quadraticCurveTo(i * 1.5 + 1, 5, i * 1.5, 7);
      ctx.stroke();
    }

    // Arms (scroll carrying)
    this.drawArm(ctx, -3.5, 0, -5, 2, '#d4a574');
    this.drawArm(ctx, 3.5, 0, 5, 2, '#d4a574');

    // Scroll in hands
    ctx.fillStyle = '#f5deb3';
    ctx.fillRect(-5, 1, 2, 3);
    ctx.fillRect(3, 1, 2, 3);

    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-4, 1);
    ctx.lineTo(-4, 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, 1);
    ctx.lineTo(4, 4);
    ctx.stroke();

    // Legs
    this.drawLeg(ctx, -1.5, 8, 0);
    this.drawLeg(ctx, 1.5, 8, 0);
  }

  /**
   * Draw warrior character
   */
  private drawWarrior(ctx: CanvasRenderingContext2D, animation: string, frame: number): void {
    // Helmet
    ctx.fillStyle = '#556b7f';
    ctx.beginPath();
    ctx.arc(0, -5, 3.5, Math.PI, 0, false);
    ctx.fill();

    // Helmet faceguard
    ctx.strokeStyle = '#3a4650';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.lineTo(-1, 1);
    ctx.moveTo(2, -2);
    ctx.lineTo(1, 1);
    ctx.stroke();

    // Armor shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(-1, -4, 1, 0, Math.PI * 2);
    ctx.fill();

    // Head (barely visible under helmet)
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(0, -1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Armor chest plate
    ctx.fillStyle = '#696969';
    ctx.beginPath();
    ctx.ellipse(0, 2, 4.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Armor segments
    ctx.strokeStyle = '#3a4650';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-4, 0 + i * 2);
      ctx.lineTo(4, 0 + i * 2);
      ctx.stroke();
    }

    // Armor glints
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(-2, 1, 1, 2);
    ctx.fillRect(1, 2, 1, 2);

    // Arms with armor
    this.drawArmedArm(ctx, -3.5, 0, -5, 2);
    this.drawArmedArm(ctx, 3.5, 0, 5, 2);

    // Weapon (sword)
    if (animation === 'work') {
      const swordRotation = Math.sin(frame * 0.08) * 0.4;
      ctx.save();
      ctx.translate(-5, 1);
      ctx.rotate(swordRotation);

      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(-1, 0, 2, 8);

      ctx.fillStyle = '#8b0000';
      ctx.fillRect(-2, 8, 4, 1);

      ctx.restore();
    }

    // Legs with armor
    this.drawArmedLeg(ctx, -1.5, 8);
    this.drawArmedLeg(ctx, 1.5, 8);
  }

  /**
   * Draw monk character
   */
  private drawMonk(ctx: CanvasRenderingContext2D, animation: string, frame: number): void {
    // Simple head covering
    ctx.fillStyle = '#c0c0c0';
    ctx.beginPath();
    ctx.arc(0, -5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Simple meditation/prayer pose
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.ellipse(0, 3, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Meditation glow (aura)
    if (animation === 'idle') {
      const auaraIntensity = 0.2 + Math.sin(frame * 0.05) * 0.1;
      ctx.strokeStyle = `rgba(200, 200, 255, ${auaraIntensity})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 1, 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Arms in meditation pose (crossed)
    this.drawArm(ctx, -3, 1, -2, 4, '#d4a574');
    this.drawArm(ctx, 3, 1, 2, 4, '#d4a574');

    // Legs (crossed sitting)
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.ellipse(-1.5, 8, 2, 1.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1.5, 8, 2, 1.5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Prayer beads
    ctx.strokeStyle = '#8b0000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * 2;
      const y = 2 + Math.sin(angle) * 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  /**
   * Draw fisherman character
   */
  private drawFisherman(ctx: CanvasRenderingContext2D, animation: string, frame: number): void {
    // Bamboo hat
    ctx.fillStyle = '#9a8c7a';
    ctx.beginPath();
    ctx.ellipse(0, -5, 6.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hat weave pattern
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 0.5;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 2, -6);
      ctx.lineTo(i * 2 + 1, -4);
      ctx.stroke();
    }

    // Head
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(0, -1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Fishing clothes
    ctx.fillStyle = '#4a7c23';
    ctx.beginPath();
    ctx.ellipse(0, 3, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wet clothes effect
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, 2);
    ctx.quadraticCurveTo(-4, 5, -2, 7);
    ctx.stroke();

    // Arms (fishing pose)
    const castAngle = animation === 'work' ? Math.sin(frame * 0.1) * 0.5 : 0;
    ctx.save();
    ctx.translate(-3, 0);
    ctx.rotate(-Math.PI / 4 + castAngle);
    this.drawFishingArm(ctx, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(3, 1);
    ctx.rotate(Math.PI / 4 - castAngle);
    this.drawFishingArm(ctx, 0, 0);
    ctx.restore();

    // Fishing rod
    if (animation === 'work') {
      const rodRotation = Math.sin(frame * 0.1) * 0.3;
      ctx.save();
      ctx.translate(-2, 0);
      ctx.rotate(-Math.PI / 3 + rodRotation);

      ctx.strokeStyle = '#8b7355';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 12);
      ctx.stroke();

      // Fishing line
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.6)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(2, 15);
      ctx.stroke();

      ctx.restore();
    }

    // Legs
    this.drawLeg(ctx, -1.5, 8, 0);
    this.drawLeg(ctx, 1.5, 8, 0);
  }

  /**
   * Draw arm limb
   */
  private drawArm(ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, color: string): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Hand
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(endX, endY, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw armed warrior arm
   */
  private drawArmedArm(ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number): void {
    ctx.strokeStyle = '#696969';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Arm guard
    ctx.fillStyle = '#556b7f';
    ctx.beginPath();
    ctx.ellipse(endX, endY, 1.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw leg limb
   */
  private drawLeg(ctx: CanvasRenderingContext2D, x: number, y: number, offset: number): void {
    ctx.strokeStyle = '#8b6f47';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 7);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Foot
    ctx.fillStyle = '#8b6f47';
    ctx.beginPath();
    ctx.ellipse(x, y + 1, 1.5, 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw armored leg
   */
  private drawArmedLeg(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.strokeStyle = '#556b7f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 7);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Boot with armor
    ctx.fillStyle = '#3a4650';
    ctx.fillRect(x - 1.5, y - 1, 3, 2);
  }

  /**
   * Draw fishing arm pose
   */
  private drawFishingArm(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2, y + 4);
    ctx.stroke();

    // Hand
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(x + 2, y + 4, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}
