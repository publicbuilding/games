/**
 * UI Polish - Sekiro-inspired premium UI design
 * Brush stroke borders, paper textures, ink wash, elegant fonts, red seals
 */

export interface UIPanel {
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  content?: string;
}

export class UIPolish {
  /**
   * Draw panel with brush stroke border (Sekiro-style)
   */
  drawPanelWithBrushBorder(
    ctx: CanvasRenderingContext2D,
    panel: UIPanel,
    backgroundColor: string = 'rgba(245, 237, 220, 0.95)',
    borderColor: string = '#1a1a1a'
  ): void {
    ctx.save();

    // Paper texture background
    this.drawPaperTexture(ctx, panel.x, panel.y, panel.width, panel.height);

    // Brush stroke border
    this.drawBrushStrokeBorder(ctx, panel.x, panel.y, panel.width, panel.height, borderColor);

    // Title with ink effect
    if (panel.title) {
      ctx.font = 'bold 18px "Georgia", serif';
      ctx.fillStyle = borderColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Slight shadow for depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillText(panel.title, panel.x + 12, panel.y + 8);

      // Main text
      ctx.fillStyle = borderColor;
      ctx.fillText(panel.title, panel.x + 11, panel.y + 7);
    }

    ctx.restore();
  }

  /**
   * Draw paper texture background
   */
  drawPaperTexture(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // Base color
    ctx.fillStyle = 'rgba(245, 237, 220, 0.98)';
    ctx.fillRect(x, y, width, height);

    // Paper fiber texture
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 100; i++) {
      const px = x + Math.random() * width;
      const py = y + Math.random() * height;
      const psize = 0.5 + Math.random() * 1;

      ctx.fillStyle = '#8b7355';
      ctx.fillRect(px, py, psize, psize * 0.5);
    }
    ctx.restore();

    // Subtle gradient shadow on edges
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.02)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
  }

  /**
   * Draw brush stroke border with varying thickness
   */
  drawBrushStrokeBorder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string = '#1a1a1a',
    thickness: number = 2
  ): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Top border (varying thickness like brush)
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    for (let i = 0; i <= width; i += 5) {
      const randomThickness = thickness * (0.7 + Math.random() * 0.6);
      ctx.lineWidth = randomThickness;
      ctx.lineTo(x + i, y + 1 + Math.random());
    }
    ctx.stroke();

    // Right border
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(x + width - 2, y);
    for (let i = 0; i <= height; i += 5) {
      const randomThickness = thickness * (0.7 + Math.random() * 0.6);
      ctx.lineWidth = randomThickness;
      ctx.lineTo(x + width - 1 + Math.random(), y + i);
    }
    ctx.stroke();

    // Bottom border
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(x + width, y + height - 2);
    for (let i = width; i >= 0; i -= 5) {
      const randomThickness = thickness * (0.7 + Math.random() * 0.6);
      ctx.lineWidth = randomThickness;
      ctx.lineTo(x + i, y + height - 1 + Math.random());
    }
    ctx.stroke();

    // Left border
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + height);
    for (let i = height; i >= 0; i -= 5) {
      const randomThickness = thickness * (0.7 + Math.random() * 0.6);
      ctx.lineWidth = randomThickness;
      ctx.lineTo(x + 1 + Math.random(), y + i);
    }
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw ink wash style icon
   */
  drawInkWashIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    iconType: string,
    size: number = 24
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // Ink wash background
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, 'rgba(50, 50, 50, 0.8)');
    gradient.addColorStop(0.6, 'rgba(100, 100, 100, 0.4)');
    gradient.addColorStop(1, 'rgba(150, 150, 150, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();

    // Icon based on type
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `bold ${size * 0.8}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const icons: Record<string, string> = {
      rice: '🌾',
      tea: '🫖',
      silk: '🪡',
      jade: '💎',
      iron: '⚒️',
      bamboo: '🎋',
      gold: '💰',
      population: '👥',
      time: '⏰',
      research: '📜',
    };

    const icon = icons[iconType] || iconType.charAt(0).toUpperCase();
    ctx.fillText(icon, 0, 0);

    ctx.restore();
  }

  /**
   * Draw red seal/stamp (Japanese style)
   */
  drawRedSeal(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    text: string = '',
    size: number = 40
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // Stamp rotation for authenticity
    const rotation = (Math.random() - 0.5) * 0.1;
    ctx.rotate(rotation);

    // Red square background
    ctx.fillStyle = '#c41e3a';
    ctx.fillRect(-size / 2, -size / 2, size, size);

    // Seal border
    ctx.strokeStyle = '#8b0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    // Aged effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < 20; i++) {
      const px = (Math.random() - 0.5) * size;
      const py = (Math.random() - 0.5) * size;
      ctx.fillRect(px - 1, py - 1, 2, 2);
    }

    // Text in seal
    if (text) {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${size * 0.3}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 0);
    }

    ctx.restore();
  }

  /**
   * Draw ink splatter accent
   */
  drawInkSplatter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number = 20,
    intensity: number = 0.6
  ): void {
    ctx.save();
    ctx.globalAlpha = intensity;
    ctx.fillStyle = '#1a1a1a';

    // Main splatter blob
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Smaller splatters
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const distance = size * (1 + Math.random() * 0.5);
      const splatX = x + Math.cos(angle) * distance;
      const splatY = y + Math.sin(angle) * distance;
      const splatSize = size * (0.2 + Math.random() * 0.3);

      ctx.beginPath();
      ctx.arc(splatX, splatY, splatSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draw elegant serif button with ink styling
   */
  drawButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    isHovered: boolean = false
  ): void {
    ctx.save();

    // Button background
    ctx.fillStyle = isHovered ? 'rgba(220, 220, 200, 0.9)' : 'rgba(240, 230, 210, 0.85)';
    ctx.fillRect(x, y, width, height);

    // Brush stroke border
    this.drawBrushStrokeBorder(ctx, x, y, width, height, isHovered ? '#8b0000' : '#1a1a1a', 1.5);

    // Button text (serif font)
    ctx.font = 'bold 14px "Georgia", serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + width / 2, y + height / 2);

    ctx.restore();
  }

  /**
   * Draw resource bar with decorative ends
   */
  drawResourceBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    fillPercentage: number,
    color: string = '#ffd700',
    label: string = ''
  ): void {
    ctx.save();

    // Background
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Fill
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, (width - 2) * Math.max(0, Math.min(1, fillPercentage)), height - 2);

    // Decorative corner caps
    ctx.fillStyle = '#8b7355';
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x, y + height / 2);
    ctx.lineTo(x - 3, y + height);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + width + 3, y);
    ctx.lineTo(x + width, y + height / 2);
    ctx.lineTo(x + width + 3, y + height);
    ctx.fill();

    // Label
    if (label) {
      ctx.font = 'bold 11px "Georgia", serif';
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + width / 2, y + height / 2);
    }

    ctx.restore();
  }

  /**
   * Draw notification with ink styling
   */
  drawNotification(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    message: string,
    type: 'success' | 'warning' | 'error' = 'success'
  ): void {
    ctx.save();

    const colors = {
      success: { bg: 'rgba(100, 150, 100, 0.9)', border: '#2d5016', text: '#fff' },
      warning: { bg: 'rgba(200, 150, 50, 0.9)', border: '#8b6f47', text: '#fff' },
      error: { bg: 'rgba(200, 50, 50, 0.9)', border: '#8b0000', text: '#fff' },
    };

    const color = colors[type];

    // Background with paper texture
    ctx.fillStyle = color.bg;
    ctx.fillRect(x, y, 300, 50);

    // Border
    ctx.strokeStyle = color.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 300, 50);

    // Text
    ctx.font = 'bold 14px "Georgia", serif';
    ctx.fillStyle = color.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, x + 15, y + 25);

    // Seal accent on right
    this.drawRedSeal(ctx, x + 270, y + 25, '', 20);

    ctx.restore();
  }

  /**
   * Draw decorative scroll/divider
   */
  drawScrollDivider(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number
  ): void {
    ctx.save();

    // Left scroll
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Paper line
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 8, y);
    ctx.lineTo(x + width - 8, y);
    ctx.stroke();

    // Right scroll
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.arc(x + width, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8b7355';
    ctx.stroke();

    ctx.restore();
  }
}
