import { describe, it, expect } from 'vitest';
import {
  calculateCallAmount,
  validateAction,
  executeAction,
  nextPlayer,
  isBettingRoundComplete,
  calculatePots,
  resetBetsForNewRound,
  getAvailableActions,
  getTotalPot
} from '../core/betting';
import { GameState, Player } from '../core/types';

// Helper to create test players
function createPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: `player_${Math.random()}`,
    name: 'Test Player',
    type: 'human',
    chips: 1000,
    holeCards: [],
    currentBet: 0,
    totalBetThisRound: 0,
    hasFolded: false,
    isAllIn: false,
    isDealer: false,
    isBigBlind: false,
    isSmallBlind: false,
    ...overrides
  };
}

// Helper to create test game state
function createGameState(overrides: Partial<GameState> = {}): GameState {
  const players = overrides.players || [
    createPlayer({ id: 'player_0', chips: 1000 }),
    createPlayer({ id: 'player_1', chips: 1000 }),
    createPlayer({ id: 'player_2', chips: 1000 }),
  ];
  
  return {
    players,
    communityCards: [],
    deck: [],
    pots: [{ amount: 0, eligiblePlayers: players.map(p => p.id) }],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    phase: 'preflop',
    minimumBet: 20,
    currentBet: 20,
    smallBlind: 10,
    bigBlind: 20,
    roundNumber: 1,
    ...overrides
  };
}

describe('Betting Logic', () => {
  describe('calculateCallAmount', () => {
    it('should calculate correct call amount', () => {
      const player = createPlayer({ chips: 1000, currentBet: 0 });
      expect(calculateCallAmount(player, 20)).toBe(20);
    });
    
    it('should account for existing bet', () => {
      const player = createPlayer({ chips: 1000, currentBet: 10 });
      expect(calculateCallAmount(player, 20)).toBe(10);
    });
    
    it('should cap at available chips', () => {
      const player = createPlayer({ chips: 15, currentBet: 0 });
      expect(calculateCallAmount(player, 100)).toBe(15);
    });
    
    it('should return 0 when already matched', () => {
      const player = createPlayer({ chips: 1000, currentBet: 20 });
      expect(calculateCallAmount(player, 20)).toBe(0);
    });
  });
  
  describe('validateAction', () => {
    it('should allow fold', () => {
      const state = createGameState();
      const result = validateAction(state, 'player_0', 'fold');
      expect(result.success).toBe(true);
    });
    
    it('should allow check when no bet to call', () => {
      const state = createGameState({ currentBet: 0 });
      const result = validateAction(state, 'player_0', 'check');
      expect(result.success).toBe(true);
    });
    
    it('should reject check when there is a bet', () => {
      const state = createGameState({ currentBet: 20 });
      const result = validateAction(state, 'player_0', 'check');
      expect(result.success).toBe(false);
    });
    
    it('should allow call when there is a bet', () => {
      const state = createGameState({ currentBet: 20 });
      const result = validateAction(state, 'player_0', 'call');
      expect(result.success).toBe(true);
    });
    
    it('should reject call when nothing to call', () => {
      const state = createGameState({ currentBet: 0 });
      const result = validateAction(state, 'player_0', 'call');
      expect(result.success).toBe(false);
    });
    
    it('should validate raise amount', () => {
      const state = createGameState({ currentBet: 20, bigBlind: 20 });
      // Minimum raise is currentBet + bigBlind = 40
      const tooSmall = validateAction(state, 'player_0', 'raise', 30);
      expect(tooSmall.success).toBe(false);
      
      const valid = validateAction(state, 'player_0', 'raise', 40);
      expect(valid.success).toBe(true);
    });
    
    it('should reject action from wrong player', () => {
      const state = createGameState({ currentPlayerIndex: 1 });
      const result = validateAction(state, 'player_0', 'fold');
      expect(result.success).toBe(false);
    });
    
    it('should reject action from folded player', () => {
      const players = [
        createPlayer({ id: 'player_0', hasFolded: true }),
        createPlayer({ id: 'player_1' }),
      ];
      const state = createGameState({ players, currentPlayerIndex: 0 });
      const result = validateAction(state, 'player_0', 'check');
      expect(result.success).toBe(false);
    });
    
    it('should reject action from all-in player', () => {
      const players = [
        createPlayer({ id: 'player_0', isAllIn: true }),
        createPlayer({ id: 'player_1' }),
      ];
      const state = createGameState({ players, currentPlayerIndex: 0 });
      const result = validateAction(state, 'player_0', 'check');
      expect(result.success).toBe(false);
    });
  });
  
  describe('executeAction', () => {
    it('should execute fold correctly', () => {
      const state = createGameState();
      const newState = executeAction(state, 'player_0', 'fold');
      expect(newState.players[0].hasFolded).toBe(true);
    });
    
    it('should execute call correctly', () => {
      const state = createGameState({ currentBet: 20 });
      const newState = executeAction(state, 'player_0', 'call');
      expect(newState.players[0].chips).toBe(980);
      expect(newState.players[0].currentBet).toBe(20);
      expect(newState.players[0].totalBetThisRound).toBe(20);
    });
    
    it('should execute raise correctly', () => {
      const state = createGameState({ currentBet: 20 });
      const newState = executeAction(state, 'player_0', 'raise', 50);
      expect(newState.players[0].chips).toBe(950);
      expect(newState.players[0].currentBet).toBe(50);
      expect(newState.currentBet).toBe(50);
    });
    
    it('should execute all-in correctly', () => {
      const players = [
        createPlayer({ id: 'player_0', chips: 100 }),
        createPlayer({ id: 'player_1', chips: 1000 }),
      ];
      const state = createGameState({ players, currentBet: 0 });
      const newState = executeAction(state, 'player_0', 'all-in');
      
      expect(newState.players[0].chips).toBe(0);
      expect(newState.players[0].isAllIn).toBe(true);
      expect(newState.players[0].currentBet).toBe(100);
    });
    
    it('should not mutate original state', () => {
      const state = createGameState();
      const originalChips = state.players[0].chips;
      executeAction(state, 'player_0', 'call');
      expect(state.players[0].chips).toBe(originalChips);
    });
  });
  
  describe('nextPlayer', () => {
    it('should move to next player', () => {
      const state = createGameState({ currentPlayerIndex: 0 });
      const newState = nextPlayer(state);
      expect(newState.currentPlayerIndex).toBe(1);
    });
    
    it('should wrap around', () => {
      const state = createGameState({ currentPlayerIndex: 2 });
      const newState = nextPlayer(state);
      expect(newState.currentPlayerIndex).toBe(0);
    });
    
    it('should skip folded players', () => {
      const players = [
        createPlayer({ id: 'player_0' }),
        createPlayer({ id: 'player_1', hasFolded: true }),
        createPlayer({ id: 'player_2' }),
      ];
      const state = createGameState({ players, currentPlayerIndex: 0 });
      const newState = nextPlayer(state);
      expect(newState.currentPlayerIndex).toBe(2);
    });
    
    it('should skip all-in players', () => {
      const players = [
        createPlayer({ id: 'player_0' }),
        createPlayer({ id: 'player_1', isAllIn: true }),
        createPlayer({ id: 'player_2' }),
      ];
      const state = createGameState({ players, currentPlayerIndex: 0 });
      const newState = nextPlayer(state);
      expect(newState.currentPlayerIndex).toBe(2);
    });
  });
  
  describe('isBettingRoundComplete', () => {
    it('should return true when only one player remains', () => {
      const players = [
        createPlayer({ id: 'player_0' }),
        createPlayer({ id: 'player_1', hasFolded: true }),
        createPlayer({ id: 'player_2', hasFolded: true }),
      ];
      const state = createGameState({ players });
      expect(isBettingRoundComplete(state)).toBe(true);
    });
    
    it('should return true when all players matched bet', () => {
      const players = [
        createPlayer({ id: 'player_0', currentBet: 20 }),
        createPlayer({ id: 'player_1', currentBet: 20 }),
        createPlayer({ id: 'player_2', currentBet: 20 }),
      ];
      const state = createGameState({ players, currentBet: 20 });
      expect(isBettingRoundComplete(state)).toBe(true);
    });
    
    it('should return false when player has not matched bet', () => {
      const players = [
        createPlayer({ id: 'player_0', currentBet: 20 }),
        createPlayer({ id: 'player_1', currentBet: 0 }),
        createPlayer({ id: 'player_2', currentBet: 20 }),
      ];
      const state = createGameState({ players, currentBet: 20 });
      expect(isBettingRoundComplete(state)).toBe(false);
    });
    
    it('should return true when all remaining players are all-in', () => {
      const players = [
        createPlayer({ id: 'player_0', isAllIn: true, currentBet: 100 }),
        createPlayer({ id: 'player_1', isAllIn: true, currentBet: 200 }),
        createPlayer({ id: 'player_2', hasFolded: true }),
      ];
      const state = createGameState({ players, currentBet: 200 });
      expect(isBettingRoundComplete(state)).toBe(true);
    });
  });
  
  describe('calculatePots', () => {
    it('should calculate simple main pot', () => {
      const players = [
        createPlayer({ id: 'player_0', totalBetThisRound: 100 }),
        createPlayer({ id: 'player_1', totalBetThisRound: 100 }),
        createPlayer({ id: 'player_2', totalBetThisRound: 100 }),
      ];
      const state = createGameState({ players });
      const pots = calculatePots(state);
      
      expect(pots.length).toBe(1);
      expect(pots[0].amount).toBe(300);
      expect(pots[0].eligiblePlayers.length).toBe(3);
    });
    
    it('should calculate side pot when player is all-in for less', () => {
      const players = [
        createPlayer({ id: 'player_0', totalBetThisRound: 50, isAllIn: true }),
        createPlayer({ id: 'player_1', totalBetThisRound: 100 }),
        createPlayer({ id: 'player_2', totalBetThisRound: 100 }),
      ];
      const state = createGameState({ players });
      const pots = calculatePots(state);
      
      // Main pot: 50 * 3 = 150 (all 3 eligible)
      // Side pot: 50 * 2 = 100 (only players 1 and 2 eligible)
      expect(pots.length).toBe(2);
      
      const mainPot = pots.find(p => p.eligiblePlayers.length === 3);
      const sidePot = pots.find(p => p.eligiblePlayers.length === 2);
      
      expect(mainPot).toBeDefined();
      expect(mainPot!.amount).toBe(150);
      
      expect(sidePot).toBeDefined();
      expect(sidePot!.amount).toBe(100);
    });
    
    it('should exclude folded players from pots', () => {
      const players = [
        createPlayer({ id: 'player_0', totalBetThisRound: 100, hasFolded: true }),
        createPlayer({ id: 'player_1', totalBetThisRound: 100 }),
        createPlayer({ id: 'player_2', totalBetThisRound: 100 }),
      ];
      const state = createGameState({ players });
      const pots = calculatePots(state);
      
      expect(pots[0].eligiblePlayers).not.toContain('player_0');
      expect(pots[0].eligiblePlayers.length).toBe(2);
    });
    
    it('should handle multiple side pots', () => {
      const players = [
        createPlayer({ id: 'player_0', totalBetThisRound: 30, isAllIn: true }),
        createPlayer({ id: 'player_1', totalBetThisRound: 60, isAllIn: true }),
        createPlayer({ id: 'player_2', totalBetThisRound: 100 }),
        createPlayer({ id: 'player_3', totalBetThisRound: 100 }),
      ];
      const state = createGameState({ players });
      const pots = calculatePots(state);
      
      // Main pot: 30 * 4 = 120 (all 4 eligible)
      // Side pot 1: 30 * 3 = 90 (players 1, 2, 3)
      // Side pot 2: 40 * 2 = 80 (players 2, 3)
      expect(pots.length).toBe(3);
    });
  });
  
  describe('getAvailableActions', () => {
    it('should include fold always', () => {
      const state = createGameState();
      const actions = getAvailableActions(state);
      expect(actions.find(a => a.action === 'fold')).toBeDefined();
    });
    
    it('should include check when nothing to call', () => {
      const state = createGameState({ currentBet: 0 });
      const actions = getAvailableActions(state);
      expect(actions.find(a => a.action === 'check')).toBeDefined();
      expect(actions.find(a => a.action === 'call')).toBeUndefined();
    });
    
    it('should include call when there is a bet', () => {
      const state = createGameState({ currentBet: 20 });
      const actions = getAvailableActions(state);
      expect(actions.find(a => a.action === 'call')).toBeDefined();
      expect(actions.find(a => a.action === 'check')).toBeUndefined();
    });
    
    it('should include raise when player has chips', () => {
      const state = createGameState({ currentBet: 20 });
      const actions = getAvailableActions(state);
      const raise = actions.find(a => a.action === 'raise');
      expect(raise).toBeDefined();
      expect(raise!.minAmount).toBeGreaterThan(20);
    });
    
    it('should include all-in', () => {
      const state = createGameState();
      const actions = getAvailableActions(state);
      expect(actions.find(a => a.action === 'all-in')).toBeDefined();
    });
    
    it('should return empty for folded player', () => {
      const players = [
        createPlayer({ id: 'player_0', hasFolded: true }),
        createPlayer({ id: 'player_1' }),
      ];
      const state = createGameState({ players, currentPlayerIndex: 0 });
      const actions = getAvailableActions(state);
      expect(actions.length).toBe(0);
    });
  });
  
  describe('getTotalPot', () => {
    it('should sum pots and current bets', () => {
      const players = [
        createPlayer({ id: 'player_0', currentBet: 50 }),
        createPlayer({ id: 'player_1', currentBet: 50 }),
      ];
      const state = createGameState({
        players,
        pots: [{ amount: 200, eligiblePlayers: ['player_0', 'player_1'] }]
      });
      
      expect(getTotalPot(state)).toBe(300);
    });
  });
  
  describe('resetBetsForNewRound', () => {
    it('should reset all player current bets to 0', () => {
      const players = [
        createPlayer({ id: 'player_0', currentBet: 100 }),
        createPlayer({ id: 'player_1', currentBet: 100 }),
      ];
      const state = createGameState({ players, currentBet: 100 });
      const newState = resetBetsForNewRound(state);
      
      expect(newState.players[0].currentBet).toBe(0);
      expect(newState.players[1].currentBet).toBe(0);
      expect(newState.currentBet).toBe(0);
    });
  });
});
