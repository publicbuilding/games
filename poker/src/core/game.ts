import { 
  GameState, Player, GamePhase, Card, RoundHistoryEntry, 
  PlayerAction, EvaluatedHand 
} from './types';
import { createDeck, shuffleDeck, dealCards } from './deck';
import { evaluateHand, determineWinners, handToString } from './handEvaluator';
import { 
  executeAction, nextPlayer, isBettingRoundComplete, 
  calculatePots, resetBetsForNewRound, getTotalPot 
} from './betting';

export interface GameConfig {
  playerNames: string[];
  playerTypes: ('human' | 'ai')[];
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
  aiPersonalities?: ('tight' | 'loose' | 'aggressive' | 'passive')[];
}

export class PokerGame {
  private state: GameState;
  private history: RoundHistoryEntry[] = [];
  private onStateChange?: (state: GameState) => void;
  private onRoundEnd?: (entry: RoundHistoryEntry) => void;
  
  constructor(config: GameConfig) {
    const players: Player[] = config.playerNames.map((name, i) => ({
      id: `player_${i}`,
      name,
      type: config.playerTypes[i],
      chips: config.startingChips,
      holeCards: [],
      currentBet: 0,
      totalBetThisRound: 0,
      hasFolded: false,
      isAllIn: false,
      isDealer: i === 0,
      isBigBlind: false,
      isSmallBlind: false,
      aiPersonality: config.aiPersonalities?.[i],
    }));
    
    this.state = {
      players,
      communityCards: [],
      deck: [],
      pots: [{ amount: 0, eligiblePlayers: players.map(p => p.id) }],
      currentPlayerIndex: 0,
      dealerIndex: 0,
      phase: 'waiting',
      minimumBet: config.bigBlind,
      currentBet: 0,
      smallBlind: config.smallBlind,
      bigBlind: config.bigBlind,
      roundNumber: 0,
    };
  }
  
  getState(): GameState {
    return JSON.parse(JSON.stringify(this.state));
  }
  
  getHistory(): RoundHistoryEntry[] {
    return [...this.history];
  }
  
  setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }
  
  setOnRoundEnd(callback: (entry: RoundHistoryEntry) => void): void {
    this.onRoundEnd = callback;
  }
  
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }
  
  /**
   * Start a new round
   */
  startNewRound(): void {
    // Reset player states
    for (const player of this.state.players) {
      player.holeCards = [];
      player.currentBet = 0;
      player.totalBetThisRound = 0;
      player.hasFolded = false;
      player.isAllIn = false;
      player.isDealer = false;
      player.isBigBlind = false;
      player.isSmallBlind = false;
    }
    
    // Remove players with no chips
    const activePlayers = this.state.players.filter(p => p.chips > 0);
    if (activePlayers.length < 2) {
      this.state.phase = 'ended';
      this.notifyStateChange();
      return;
    }
    
    // Move dealer button
    this.state.dealerIndex = (this.state.dealerIndex + 1) % this.state.players.length;
    while (this.state.players[this.state.dealerIndex].chips === 0) {
      this.state.dealerIndex = (this.state.dealerIndex + 1) % this.state.players.length;
    }
    
    this.state.players[this.state.dealerIndex].isDealer = true;
    
    // Set blinds
    const sbIndex = this.getNextActivePlayer(this.state.dealerIndex);
    const bbIndex = this.getNextActivePlayer(sbIndex);
    
    this.state.players[sbIndex].isSmallBlind = true;
    this.state.players[bbIndex].isBigBlind = true;
    
    // Post blinds
    this.postBlind(sbIndex, this.state.smallBlind);
    this.postBlind(bbIndex, this.state.bigBlind);
    
    this.state.currentBet = this.state.bigBlind;
    this.state.minimumBet = this.state.bigBlind * 2;
    
    // Create and shuffle deck
    this.state.deck = shuffleDeck(createDeck());
    
    // Deal hole cards
    for (const player of this.state.players) {
      if (player.chips > 0 || player.isAllIn) {
        const [cards, remaining] = dealCards(this.state.deck, 2);
        player.holeCards = cards;
        this.state.deck = remaining;
      }
    }
    
    // Reset community cards and pots
    this.state.communityCards = [];
    this.state.pots = [{ amount: 0, eligiblePlayers: activePlayers.map(p => p.id) }];
    
    // Set first player (left of big blind)
    this.state.currentPlayerIndex = this.getNextActivePlayer(bbIndex);
    
    this.state.phase = 'preflop';
    this.state.roundNumber++;
    
    this.notifyStateChange();
  }
  
  private getNextActivePlayer(fromIndex: number): number {
    let index = (fromIndex + 1) % this.state.players.length;
    while (this.state.players[index].chips === 0 && !this.state.players[index].isAllIn) {
      index = (index + 1) % this.state.players.length;
      if (index === fromIndex) break;
    }
    return index;
  }
  
  private postBlind(playerIndex: number, amount: number): void {
    const player = this.state.players[playerIndex];
    const actualAmount = Math.min(amount, player.chips);
    player.chips -= actualAmount;
    player.currentBet = actualAmount;
    player.totalBetThisRound = actualAmount;
    if (player.chips === 0) {
      player.isAllIn = true;
    }
  }
  
  /**
   * Execute a player action
   */
  performAction(playerId: string, action: PlayerAction, amount?: number): boolean {
    if (this.state.phase === 'waiting' || this.state.phase === 'ended' || this.state.phase === 'showdown') {
      return false;
    }
    
    try {
      this.state = executeAction(this.state, playerId, action, amount);
      this.state = nextPlayer(this.state);
      
      // Check if betting round is complete
      if (this.checkBettingRoundComplete()) {
        this.advancePhase();
      }
      
      this.notifyStateChange();
      return true;
    } catch {
      return false;
    }
  }
  
  private checkBettingRoundComplete(): boolean {
    const activePlayers = this.state.players.filter(p => !p.hasFolded);
    
    // Only one player left
    if (activePlayers.length === 1) {
      return true;
    }
    
    return isBettingRoundComplete(this.state);
  }
  
  private advancePhase(): void {
    const activePlayers = this.state.players.filter(p => !p.hasFolded);
    
    // Only one player left - they win
    if (activePlayers.length === 1) {
      this.endRound([activePlayers[0].id]);
      return;
    }
    
    // Calculate pots before moving to next phase
    this.state.pots = calculatePots(this.state);
    
    // Reset for new betting round
    this.state = resetBetsForNewRound(this.state);
    
    switch (this.state.phase) {
      case 'preflop':
        this.dealFlop();
        this.state.phase = 'flop';
        break;
      case 'flop':
        this.dealTurn();
        this.state.phase = 'turn';
        break;
      case 'turn':
        this.dealRiver();
        this.state.phase = 'river';
        break;
      case 'river':
        this.showdown();
        return;
    }
    
    // Check if all remaining players are all-in
    const canAct = activePlayers.filter(p => !p.isAllIn);
    if (canAct.length <= 1) {
      // Skip to showdown
      while (this.state.phase !== 'river') {
        if (this.state.phase === 'flop') {
          this.dealTurn();
          this.state.phase = 'turn';
        } else if (this.state.phase === 'turn') {
          this.dealRiver();
          this.state.phase = 'river';
        }
      }
      this.showdown();
    }
  }
  
  private dealFlop(): void {
    // Burn one card
    this.state.deck = this.state.deck.slice(1);
    // Deal 3 cards
    const [cards, remaining] = dealCards(this.state.deck, 3);
    this.state.communityCards = cards;
    this.state.deck = remaining;
  }
  
  private dealTurn(): void {
    // Burn one card
    this.state.deck = this.state.deck.slice(1);
    // Deal 1 card
    const [cards, remaining] = dealCards(this.state.deck, 1);
    this.state.communityCards.push(...cards);
    this.state.deck = remaining;
  }
  
  private dealRiver(): void {
    // Burn one card
    this.state.deck = this.state.deck.slice(1);
    // Deal 1 card
    const [cards, remaining] = dealCards(this.state.deck, 1);
    this.state.communityCards.push(...cards);
    this.state.deck = remaining;
  }
  
  private showdown(): void {
    this.state.phase = 'showdown';
    this.state.pots = calculatePots(this.state);
    
    const activePlayers = this.state.players.filter(p => !p.hasFolded);
    
    // Evaluate all hands
    const hands: Map<string, EvaluatedHand> = new Map();
    for (const player of activePlayers) {
      const allCards = [...player.holeCards, ...this.state.communityCards];
      if (allCards.length >= 5) {
        hands.set(player.id, evaluateHand(allCards));
      }
    }
    
    // Determine winners for each pot
    const winnings: Map<string, number> = new Map();
    const winnerHands: Map<string, EvaluatedHand> = new Map();
    
    for (const pot of this.state.pots) {
      const eligibleHands: (EvaluatedHand | null)[] = [];
      const eligibleIds: string[] = [];
      
      for (const playerId of pot.eligiblePlayers) {
        if (hands.has(playerId)) {
          eligibleHands.push(hands.get(playerId)!);
          eligibleIds.push(playerId);
        }
      }
      
      const winnerIndices = determineWinners(eligibleHands);
      const winShare = Math.floor(pot.amount / winnerIndices.length);
      const remainder = pot.amount % winnerIndices.length;
      
      winnerIndices.forEach((idx, i) => {
        const winnerId = eligibleIds[idx];
        const currentWinnings = winnings.get(winnerId) || 0;
        // First winner gets remainder for odd splits
        const extra = i === 0 ? remainder : 0;
        winnings.set(winnerId, currentWinnings + winShare + extra);
        winnerHands.set(winnerId, eligibleHands[idx]!);
      });
    }
    
    // Apply winnings
    this.state.winners = [];
    for (const [playerId, amount] of winnings) {
      const player = this.state.players.find(p => p.id === playerId)!;
      player.chips += amount;
      this.state.winners.push({
        playerId,
        amount,
        hand: winnerHands.get(playerId),
      });
    }
    
    // Record history
    const historyEntry: RoundHistoryEntry = {
      roundNumber: this.state.roundNumber,
      winners: this.state.winners.map(w => ({
        playerId: w.playerId,
        playerName: this.state.players.find(p => p.id === w.playerId)!.name,
        amount: w.amount,
        hand: w.hand ? handToString(w.hand) : undefined,
      })),
      communityCards: [...this.state.communityCards],
      potTotal: getTotalPot(this.state),
    };
    
    this.history.push(historyEntry);
    
    if (this.onRoundEnd) {
      this.onRoundEnd(historyEntry);
    }
    
    this.notifyStateChange();
  }
  
  private endRound(winnerIds: string[]): void {
    this.state.phase = 'showdown';
    this.state.pots = calculatePots(this.state);
    
    const totalPot = this.state.pots.reduce((sum, p) => sum + p.amount, 0) +
      this.state.players.reduce((sum, p) => sum + p.currentBet, 0);
    
    const winShare = Math.floor(totalPot / winnerIds.length);
    
    this.state.winners = winnerIds.map(id => {
      const player = this.state.players.find(p => p.id === id)!;
      player.chips += winShare;
      return { playerId: id, amount: winShare };
    });
    
    const historyEntry: RoundHistoryEntry = {
      roundNumber: this.state.roundNumber,
      winners: this.state.winners.map(w => ({
        playerId: w.playerId,
        playerName: this.state.players.find(p => p.id === w.playerId)!.name,
        amount: w.amount,
      })),
      communityCards: [...this.state.communityCards],
      potTotal: totalPot,
    };
    
    this.history.push(historyEntry);
    
    if (this.onRoundEnd) {
      this.onRoundEnd(historyEntry);
    }
    
    this.notifyStateChange();
  }
  
  /**
   * Get current player who needs to act
   */
  getCurrentPlayer(): Player | null {
    if (this.state.phase === 'waiting' || this.state.phase === 'ended' || this.state.phase === 'showdown') {
      return null;
    }
    return this.state.players[this.state.currentPlayerIndex];
  }
  
  /**
   * Check if game is over (one player has all chips)
   */
  isGameOver(): boolean {
    const playersWithChips = this.state.players.filter(p => p.chips > 0);
    return playersWithChips.length <= 1;
  }
  
  /**
   * Get winner if game is over
   */
  getGameWinner(): Player | null {
    if (!this.isGameOver()) return null;
    return this.state.players.find(p => p.chips > 0) || null;
  }
}

export function createGame(config: GameConfig): PokerGame {
  return new PokerGame(config);
}
