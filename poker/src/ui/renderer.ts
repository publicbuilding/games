import { GameState, Card, Player, GamePhase } from '../core/types';
import { cardToString, dealCards } from '../core/deck';
import { getTotalPot } from '../core/betting';
import { handToString } from '../core/handEvaluator';

export interface RendererConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  onPlayerAction?: (playerId: string) => void;
}

interface Button {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  action: string;
  amount?: number;
  enabled: boolean;
}

export class PokerRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private state: GameState | null = null;
  private buttons: Button[] = [];
  private humanPlayerId: string = 'player_0';
  private showAllCards: boolean = false;
  private raiseAmount: number = 0;
  private message: string = '';
  private messageTimeout: number | null = null;
  
  // Callbacks
  public onAction?: (action: string, amount?: number) => void;
  public onNewRound?: () => void;
  
  // Colors
  private colors = {
    felt: '#1a472a',
    feltLight: '#2d5a3d',
    cardWhite: '#ffffff',
    cardRed: '#d32f2f',
    cardBlack: '#212121',
    gold: '#ffd700',
    chipRed: '#e53935',
    chipBlue: '#1e88e5',
    chipGreen: '#43a047',
    chipBlack: '#424242',
    button: '#2196f3',
    buttonDisabled: '#757575',
    buttonHover: '#1976d2',
    text: '#ffffff',
    textDark: '#333333',
  };
  
  constructor(config: RendererConfig) {
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d')!;
    this.width = config.width;
    this.height = config.height;
    
    this.canvas.width = config.width;
    this.canvas.height = config.height;
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Mouse click
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;
      this.handleTap(x, y);
    });
  }
  
  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    this.handleTap(x, y);
  }
  
  private handleTap(x: number, y: number): void {
    for (const button of this.buttons) {
      if (button.enabled &&
          x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        
        if (button.action === 'new_round') {
          if (this.onNewRound) this.onNewRound();
        } else if (button.action === 'raise_up') {
          this.raiseAmount = Math.min(this.raiseAmount + this.state!.bigBlind, 
            this.getHumanPlayer()?.chips || 0);
          this.render();
        } else if (button.action === 'raise_down') {
          this.raiseAmount = Math.max(this.raiseAmount - this.state!.bigBlind, 
            this.state!.bigBlind);
          this.render();
        } else if (this.onAction) {
          const amount = button.action === 'raise' ? 
            this.state!.currentBet + this.raiseAmount : button.amount;
          this.onAction(button.action, amount);
        }
        return;
      }
    }
  }
  
  updateState(state: GameState): void {
    this.state = state;
    this.showAllCards = state.phase === 'showdown';
    
    // Reset raise amount when state changes
    if (state.phase !== 'showdown' && state.phase !== 'ended') {
      this.raiseAmount = state.bigBlind;
    }
    
    this.render();
  }
  
  setHumanPlayerId(id: string): void {
    this.humanPlayerId = id;
  }
  
  showMessage(msg: string, duration: number = 2000): void {
    this.message = msg;
    this.render();
    
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
    
    this.messageTimeout = window.setTimeout(() => {
      this.message = '';
      this.render();
    }, duration);
  }
  
  private getHumanPlayer(): Player | null {
    if (!this.state) return null;
    return this.state.players.find(p => p.id === this.humanPlayerId) || null;
  }
  
  render(): void {
    if (!this.state) {
      this.renderWaitingScreen();
      return;
    }
    
    this.buttons = [];
    
    // Clear canvas
    this.ctx.fillStyle = this.colors.felt;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw table
    this.drawTable();
    
    // Draw community cards
    this.drawCommunityCards();
    
    // Draw pot
    this.drawPot();
    
    // Draw players
    this.drawPlayers();
    
    // Draw action buttons if it's human's turn
    if (this.isHumanTurn()) {
      this.drawActionButtons();
    }
    
    // Draw phase indicator
    this.drawPhaseIndicator();
    
    // Draw message
    if (this.message) {
      this.drawMessage();
    }
    
    // Draw showdown results
    if (this.state.phase === 'showdown' && this.state.winners) {
      this.drawShowdownResults();
    }
  }
  
  private renderWaitingScreen(): void {
    this.ctx.fillStyle = this.colors.felt;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Texas Hold\'em', this.width / 2, this.height / 2 - 20);
    
    this.ctx.font = '18px Arial';
    this.ctx.fillText('Click "Deal" to start', this.width / 2, this.height / 2 + 20);
  }
  
  private drawTable(): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2 - 30;
    const radiusX = this.width * 0.4;
    const radiusY = this.height * 0.3;
    
    // Table shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(centerX + 5, centerY + 5, radiusX, radiusY, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Table felt
    this.ctx.fillStyle = this.colors.feltLight;
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Table border
    this.ctx.strokeStyle = '#5d4037';
    this.ctx.lineWidth = 8;
    this.ctx.stroke();
  }
  
  private drawCommunityCards(): void {
    if (!this.state) return;
    
    const cards = this.state.communityCards;
    const cardWidth = 50;
    const cardHeight = 70;
    const spacing = 10;
    const totalWidth = (cardWidth + spacing) * 5 - spacing;
    const startX = (this.width - totalWidth) / 2;
    const y = this.height / 2 - cardHeight / 2 - 30;
    
    for (let i = 0; i < 5; i++) {
      const x = startX + i * (cardWidth + spacing);
      if (i < cards.length) {
        this.drawCard(x, y, cardWidth, cardHeight, cards[i]);
      } else {
        this.drawCardBack(x, y, cardWidth, cardHeight, true);
      }
    }
  }
  
  private drawCard(x: number, y: number, width: number, height: number, card: Card): void {
    // Card background
    this.ctx.fillStyle = this.colors.cardWhite;
    this.ctx.beginPath();
    this.roundRect(x, y, width, height, 5);
    this.ctx.fill();
    
    // Card border
    this.ctx.strokeStyle = '#ccc';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    // Card text
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    this.ctx.fillStyle = isRed ? this.colors.cardRed : this.colors.cardBlack;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(cardToString(card), x + width / 2, y + height / 2 + 5);
  }
  
  private drawCardBack(x: number, y: number, width: number, height: number, faded: boolean = false): void {
    this.ctx.fillStyle = faded ? 'rgba(50, 80, 130, 0.3)' : '#325082';
    this.ctx.beginPath();
    this.roundRect(x, y, width, height, 5);
    this.ctx.fill();
    
    if (!faded) {
      // Pattern
      this.ctx.strokeStyle = '#4a6ba8';
      this.ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + 10 + i * 12, y + 10);
        this.ctx.lineTo(x + 10 + i * 12, y + height - 10);
        this.ctx.stroke();
      }
    }
    
    this.ctx.strokeStyle = faded ? 'rgba(0,0,0,0.1)' : '#1a3a6a';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
  
  private drawPot(): void {
    if (!this.state) return;
    
    const pot = getTotalPot(this.state);
    const x = this.width / 2;
    const y = this.height / 2 + 50;
    
    // Pot chips visual
    this.drawChipStack(x - 20, y, pot);
    
    // Pot amount text
    this.ctx.fillStyle = this.colors.gold;
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Pot: $${pot}`, x, y + 35);
  }
  
  private drawChipStack(x: number, y: number, amount: number): void {
    const chipCount = Math.min(Math.ceil(amount / 100), 8);
    
    for (let i = 0; i < chipCount; i++) {
      const chipY = y - i * 4;
      const colors = [this.colors.chipRed, this.colors.chipBlue, this.colors.chipGreen];
      this.ctx.fillStyle = colors[i % colors.length];
      this.ctx.beginPath();
      this.ctx.ellipse(x, chipY, 15, 8, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }
  
  private drawPlayers(): void {
    if (!this.state) return;
    
    const positions = this.getPlayerPositions();
    
    this.state.players.forEach((player, index) => {
      const pos = positions[index];
      this.drawPlayer(player, pos.x, pos.y, pos.cardOffset);
    });
  }
  
  private getPlayerPositions(): { x: number; y: number; cardOffset: 'above' | 'below' }[] {
    const centerX = this.width / 2;
    const centerY = this.height / 2 - 30;
    const radiusX = this.width * 0.42;
    const radiusY = this.height * 0.38;
    
    const count = this.state!.players.length;
    const positions: { x: number; y: number; cardOffset: 'above' | 'below' }[] = [];
    
    // Human player at bottom
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI / 2) + (i * 2 * Math.PI / count);
      const x = centerX + Math.cos(angle) * radiusX;
      const y = centerY + Math.sin(angle) * radiusY;
      const cardOffset = y < centerY ? 'below' : 'above';
      positions.push({ x, y, cardOffset });
    }
    
    return positions;
  }
  
  private drawPlayer(player: Player, x: number, y: number, cardOffset: 'above' | 'below'): void {
    const isHuman = player.id === this.humanPlayerId;
    const isCurrentPlayer = this.state?.currentPlayerIndex === this.state?.players.indexOf(player);
    
    // Highlight current player
    if (isCurrentPlayer && !player.hasFolded) {
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 55, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Player circle
    this.ctx.fillStyle = player.hasFolded ? 'rgba(100, 100, 100, 0.5)' : 
      (isHuman ? '#1565c0' : '#6a1b9a');
    this.ctx.beginPath();
    this.ctx.arc(x, y, 40, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = player.isDealer ? this.colors.gold : '#333';
    this.ctx.lineWidth = player.isDealer ? 3 : 2;
    this.ctx.stroke();
    
    // Player name
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(player.name, x, y - 5);
    
    // Chips
    this.ctx.font = '11px Arial';
    this.ctx.fillStyle = this.colors.gold;
    this.ctx.fillText(`$${player.chips}`, x, y + 10);
    
    // Current bet
    if (player.currentBet > 0) {
      this.ctx.fillStyle = '#ff9800';
      this.ctx.font = '10px Arial';
      this.ctx.fillText(`Bet: $${player.currentBet}`, x, y + 22);
    }
    
    // Status badges
    if (player.isAllIn) {
      this.drawBadge(x + 30, y - 30, 'ALL IN', '#f44336');
    }
    if (player.hasFolded) {
      this.drawBadge(x + 30, y - 30, 'FOLD', '#757575');
    }
    if (player.isDealer) {
      this.drawBadge(x - 35, y - 30, 'D', this.colors.gold);
    }
    if (player.isSmallBlind) {
      this.drawBadge(x - 35, y + 25, 'SB', '#9c27b0');
    }
    if (player.isBigBlind) {
      this.drawBadge(x - 35, y + 25, 'BB', '#673ab7');
    }
    
    // Draw hole cards
    if (player.holeCards.length === 2) {
      const cardWidth = 35;
      const cardHeight = 50;
      const cardY = cardOffset === 'above' ? y - 85 : y + 50;
      const cardX = x - cardWidth - 5;
      
      const showCards = isHuman || this.showAllCards || player.hasFolded;
      
      if (showCards && !player.hasFolded) {
        this.drawCard(cardX, cardY, cardWidth, cardHeight, player.holeCards[0]);
        this.drawCard(cardX + cardWidth + 5, cardY, cardWidth, cardHeight, player.holeCards[1]);
      } else if (!player.hasFolded) {
        this.drawCardBack(cardX, cardY, cardWidth, cardHeight);
        this.drawCardBack(cardX + cardWidth + 5, cardY, cardWidth, cardHeight);
      }
    }
  }
  
  private drawBadge(x: number, y: number, text: string, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 12, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = 'bold 8px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, x, y + 3);
  }
  
  private drawActionButtons(): void {
    if (!this.state) return;
    
    const humanPlayer = this.getHumanPlayer();
    if (!humanPlayer) return;
    
    const buttonY = this.height - 70;
    const buttonWidth = 80;
    const buttonHeight = 40;
    const spacing = 10;
    
    const callAmount = Math.min(
      this.state.currentBet - humanPlayer.currentBet,
      humanPlayer.chips
    );
    
    const actions: { label: string; action: string; enabled: boolean; amount?: number }[] = [];
    
    // Fold
    actions.push({ label: 'Fold (F)', action: 'fold', enabled: true });
    
    // Check or Call
    if (callAmount === 0) {
      actions.push({ label: 'Check (C)', action: 'check', enabled: true });
    } else {
      actions.push({ 
        label: `Call $${callAmount} (C)`, 
        action: 'call', 
        enabled: true,
        amount: callAmount 
      });
    }
    
    // Raise
    if (humanPlayer.chips > callAmount) {
      actions.push({ 
        label: 'Raise (R)', 
        action: 'raise', 
        enabled: true,
        amount: this.state.currentBet + this.raiseAmount
      });
    }
    
    // All-in
    actions.push({ 
      label: `All-In $${humanPlayer.chips} (A)`, 
      action: 'all-in', 
      enabled: humanPlayer.chips > 0,
      amount: humanPlayer.chips
    });
    
    const totalWidth = actions.length * (buttonWidth + spacing) - spacing;
    let startX = (this.width - totalWidth) / 2;
    
    for (const action of actions) {
      this.drawButton(startX, buttonY, buttonWidth, buttonHeight, action.label, 
        action.action, action.enabled, action.amount);
      startX += buttonWidth + spacing;
    }
    
    // Raise amount controls
    if (humanPlayer.chips > callAmount) {
      const raiseControlY = buttonY - 45;
      const raiseControlX = this.width / 2;
      
      // Raise amount display
      this.ctx.fillStyle = this.colors.text;
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`Raise: $${this.state.currentBet + this.raiseAmount}`, 
        raiseControlX, raiseControlY + 10);
      
      // +/- buttons
      this.drawButton(raiseControlX - 80, raiseControlY - 5, 30, 25, '-', 
        'raise_down', this.raiseAmount > this.state.bigBlind);
      this.drawButton(raiseControlX + 50, raiseControlY - 5, 30, 25, '+', 
        'raise_up', this.state.currentBet + this.raiseAmount < humanPlayer.chips);
    }
  }
  
  private drawButton(x: number, y: number, width: number, height: number, 
    label: string, action: string, enabled: boolean, amount?: number): void {
    
    this.ctx.fillStyle = enabled ? this.colors.button : this.colors.buttonDisabled;
    this.ctx.beginPath();
    this.roundRect(x, y, width, height, 5);
    this.ctx.fill();
    
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = 'bold 11px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x + width / 2, y + height / 2 + 4);
    
    this.buttons.push({ x, y, width, height, label, action, amount, enabled });
  }
  
  private drawPhaseIndicator(): void {
    if (!this.state) return;
    
    const phaseNames: Record<GamePhase, string> = {
      waiting: 'Waiting',
      preflop: 'Pre-Flop',
      flop: 'Flop',
      turn: 'Turn',
      river: 'River',
      showdown: 'Showdown',
      ended: 'Game Over',
    };
    
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Round ${this.state.roundNumber} - ${phaseNames[this.state.phase]}`, 
      20, 30);
    
    // Blinds info
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`Blinds: $${this.state.smallBlind}/$${this.state.bigBlind}`, 20, 50);
  }
  
  private drawMessage(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(this.width / 2 - 150, this.height / 2 - 25, 300, 50);
    
    this.ctx.fillStyle = this.colors.gold;
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.message, this.width / 2, this.height / 2 + 7);
  }
  
  private drawShowdownResults(): void {
    if (!this.state?.winners) return;
    
    const y = this.height - 130;
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, y - 20, this.width, 60);
    
    // Winners text
    this.ctx.fillStyle = this.colors.gold;
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    
    const winnerTexts = this.state.winners.map(w => {
      const player = this.state!.players.find(p => p.id === w.playerId)!;
      const handStr = w.hand ? ` with ${handToString(w.hand)}` : '';
      return `${player.name} wins $${w.amount}${handStr}`;
    });
    
    this.ctx.fillText(winnerTexts.join(' | '), this.width / 2, y);
    
    // New round button
    this.drawButton(this.width / 2 - 60, y + 15, 120, 35, 'Deal Next Hand', 
      'new_round', true);
  }
  
  private isHumanTurn(): boolean {
    if (!this.state) return false;
    if (this.state.phase === 'waiting' || this.state.phase === 'showdown' || 
        this.state.phase === 'ended') return false;
    
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    return currentPlayer?.id === this.humanPlayerId && 
           !currentPlayer.hasFolded && 
           !currentPlayer.isAllIn;
  }
  
  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }
  
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.render();
  }
}
