import { PokerGame, createGame, GameConfig } from './core/game';
import { GameState, PlayerAction, RoundHistoryEntry } from './core/types';
import { PokerRenderer } from './ui/renderer';
import { makeAIDecision, getAIThinkingDelay, getAIComment } from './ai/botPlayer';
import { FreemiumUI } from './ui/freemiumUI';
// Betting utilities used internally

class PokerApp {
  private game: PokerGame;
  private renderer: PokerRenderer;
  private freemiumUI: FreemiumUI;
  private aiProcessing: boolean = false;
  private history: RoundHistoryEntry[] = [];
  
  constructor() {
    // Create canvas
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const container = document.getElementById('game-container') as HTMLElement;
    
    // Calculate dimensions
    const maxWidth = Math.min(window.innerWidth - 20, 900);
    const maxHeight = Math.min(window.innerHeight - 150, 600);
    
    // Create renderer
    this.renderer = new PokerRenderer({
      canvas,
      width: maxWidth,
      height: maxHeight,
    });
    
    // Create game with 4 players (1 human + 3 AI)
    const config: GameConfig = {
      playerNames: ['You', 'Alex (Bot)', 'Sam (Bot)', 'Jordan (Bot)'],
      playerTypes: ['human', 'ai', 'ai', 'ai'],
      startingChips: 1000,
      smallBlind: 10,
      bigBlind: 20,
      aiPersonalities: ['passive', 'tight', 'aggressive', 'loose'],
    };
    
    this.game = createGame(config);
    
    // Create freemium UI
    this.freemiumUI = new FreemiumUI({
      container,
      onClose: () => this.renderer.render(),
    });
    
    // Setup callbacks
    this.game.setOnStateChange((state) => this.onStateChange(state));
    this.game.setOnRoundEnd((entry) => this.onRoundEnd(entry));
    
    this.renderer.onAction = (action, amount) => this.handlePlayerAction(action, amount);
    this.renderer.onNewRound = () => this.startNewRound();
    
    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Setup UI buttons
    this.setupUIButtons();
    
    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
    
    // Initial render
    this.renderer.updateState(this.game.getState());
  }
  
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if (this.aiProcessing) return;
      
      const state = this.game.getState();
      if (state.phase === 'waiting' || state.phase === 'showdown' || 
          state.phase === 'ended') {
        if (e.key.toLowerCase() === 'd' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          this.startNewRound();
        }
        return;
      }
      
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (currentPlayer.id !== 'player_0') return;
      
      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          this.handlePlayerAction('fold');
          break;
        case 'c':
          e.preventDefault();
          const callAmount = state.currentBet - currentPlayer.currentBet;
          if (callAmount === 0) {
            this.handlePlayerAction('check');
          } else {
            this.handlePlayerAction('call');
          }
          break;
        case 'r':
          e.preventDefault();
          this.handlePlayerAction('raise', state.currentBet + state.bigBlind);
          break;
        case 'a':
          e.preventDefault();
          this.handlePlayerAction('all-in');
          break;
      }
    });
  }
  
  private setupUIButtons(): void {
    const dealBtn = document.getElementById('deal-btn');
    const historyBtn = document.getElementById('history-btn');
    const tournamentBtn = document.getElementById('tournament-btn');
    const storeBtn = document.getElementById('store-btn');
    
    dealBtn?.addEventListener('click', () => this.startNewRound());
    historyBtn?.addEventListener('click', () => this.showHistory());
    tournamentBtn?.addEventListener('click', () => this.freemiumUI.showTournamentTeaser());
    storeBtn?.addEventListener('click', () => this.freemiumUI.showChipPurchase());
  }
  
  private handleResize(): void {
    const maxWidth = Math.min(window.innerWidth - 20, 900);
    const maxHeight = Math.min(window.innerHeight - 150, 600);
    this.renderer.resize(maxWidth, maxHeight);
  }
  
  private startNewRound(): void {
    if (this.game.isGameOver()) {
      const winner = this.game.getGameWinner();
      alert(`Game Over! ${winner?.name || 'Unknown'} wins with ${winner?.chips || 0} chips!`);
      return;
    }
    
    this.game.startNewRound();
    this.checkForAITurn();
  }
  
  private onStateChange(state: GameState): void {
    this.renderer.updateState(state);
    this.updateStatusBar(state);
  }
  
  private onRoundEnd(entry: RoundHistoryEntry): void {
    this.history.push(entry);
    console.log('Round ended:', entry);
  }
  
  private updateStatusBar(state: GameState): void {
    const humanPlayer = state.players.find(p => p.id === 'player_0');
    const statusEl = document.getElementById('status-text');
    
    if (statusEl && humanPlayer) {
      if (state.phase === 'showdown' && state.winners) {
        const winnerNames = state.winners.map(w => 
          state.players.find(p => p.id === w.playerId)?.name
        ).join(', ');
        statusEl.textContent = `Winner: ${winnerNames}`;
      } else if (state.phase === 'waiting') {
        statusEl.textContent = 'Click Deal to start';
      } else {
        const currentPlayer = state.players[state.currentPlayerIndex];
        if (currentPlayer.id === 'player_0') {
          statusEl.textContent = 'Your turn! Choose an action.';
        } else {
          statusEl.textContent = `${currentPlayer.name} is thinking...`;
        }
      }
    }
    
    const chipsEl = document.getElementById('player-chips');
    if (chipsEl && humanPlayer) {
      chipsEl.textContent = `Your Chips: $${humanPlayer.chips}`;
    }
  }
  
  private handlePlayerAction(action: string, amount?: number): void {
    if (this.aiProcessing) return;
    
    const success = this.game.performAction('player_0', action as PlayerAction, amount);
    
    if (success) {
      this.renderer.showMessage(action.charAt(0).toUpperCase() + action.slice(1), 800);
      
      // Check for AI turns
      setTimeout(() => this.checkForAITurn(), 300);
    }
  }
  
  private checkForAITurn(): void {
    const state = this.game.getState();
    
    if (state.phase === 'waiting' || state.phase === 'showdown' || 
        state.phase === 'ended') {
      return;
    }
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    if (currentPlayer.type === 'ai' && !currentPlayer.hasFolded && !currentPlayer.isAllIn) {
      this.processAITurn(currentPlayer.id, currentPlayer.aiPersonality || 'passive');
    }
  }
  
  private async processAITurn(playerId: string, personality: string): Promise<void> {
    this.aiProcessing = true;
    
    // Add thinking delay
    const delay = getAIThinkingDelay(personality);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const state = this.game.getState();
    
    // Make AI decision
    const decision = makeAIDecision(state, playerId);
    
    // Show comment occasionally
    const comment = getAIComment(decision.action, personality, 0.5);
    if (comment) {
      const player = state.players.find(p => p.id === playerId);
      this.renderer.showMessage(`${player?.name}: "${comment}"`, 1500);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Execute action
    this.game.performAction(playerId, decision.action, decision.amount);
    
    this.aiProcessing = false;
    
    // Check for next AI turn
    setTimeout(() => this.checkForAITurn(), 300);
  }
  
  private showHistory(): void {
    const historyEntries = this.history;
    
    if (historyEntries.length === 0) {
      alert('No rounds played yet!');
      return;
    }
    
    let historyText = 'Round History:\n\n';
    
    for (const entry of historyEntries.slice(-10)) {
      historyText += `Round ${entry.roundNumber}:\n`;
      for (const winner of entry.winners) {
        historyText += `  ${winner.playerName} won $${winner.amount}`;
        if (winner.hand) historyText += ` with ${winner.hand}`;
        historyText += '\n';
      }
      historyText += '\n';
    }
    
    alert(historyText);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PokerApp();
});
