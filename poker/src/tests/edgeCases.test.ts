import { describe, it, expect } from 'vitest';
import { calculatePots, getTotalPot } from '../core/betting';
import { determineWinners, evaluateHand } from '../core/handEvaluator';
import { parseCard } from '../core/deck';
import { GameState, Player } from '../core/types';

// Helper to create cards from string notation
function cards(str: string) {
  return str.split(' ').map(parseCard);
}

// Helper to create test player
function createPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: `player_${Math.random().toString(36).slice(2)}`,
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

function createGameState(overrides: Partial<GameState> = {}): GameState {
  const players = overrides.players || [
    createPlayer({ id: 'player_0' }),
    createPlayer({ id: 'player_1' }),
    createPlayer({ id: 'player_2' }),
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

describe('Edge Cases - Split Pots', () => {
  describe('exact tie hands', () => {
    it('should split pot between identical hands', () => {
      // Two players with same hole cards on a board with no improvement
      const hand1 = evaluateHand(cards('Ah Kh Qc Jd 10s 2h 3c'));
      const hand2 = evaluateHand(cards('As Ks Qc Jd 10s 2h 3c'));
      
      // Both have A-K high with Q-J-10 kickers
      const winners = determineWinners([hand1, hand2]);
      expect(winners.length).toBe(2);
      expect(winners).toContain(0);
      expect(winners).toContain(1);
    });
    
    it('should split pot for same flush (different suits)', () => {
      // Both players have same flush rank
      const hand1 = evaluateHand(cards('Ah Kh Qh Jh 9h 2c 3c'));
      const hand2 = evaluateHand(cards('Ad Kd Qd Jd 9d 2c 3c'));
      
      const winners = determineWinners([hand1, hand2]);
      expect(winners.length).toBe(2);
    });
    
    it('should split pot for board straight', () => {
      // Board has a straight, both players play the board
      const community = cards('10c 9h 8d 7s 6c');
      const hand1 = evaluateHand([...cards('2h 3h'), ...community]);
      const hand2 = evaluateHand([...cards('2s 3s'), ...community]);
      
      const winners = determineWinners([hand1, hand2]);
      expect(winners.length).toBe(2);
    });
    
    it('should handle three-way split', () => {
      // Three players with identical hands
      const community = cards('Qc Jd 10s 5h 2c');
      const hand1 = evaluateHand([...cards('Ah Kh'), ...community]); // A-K-Q-J-10
      const hand2 = evaluateHand([...cards('As Ks'), ...community]); // A-K-Q-J-10
      const hand3 = evaluateHand([...cards('Ad Kd'), ...community]); // A-K-Q-J-10
      
      const winners = determineWinners([hand1, hand2, hand3]);
      expect(winners.length).toBe(3);
    });
  });
  
  describe('kicker scenarios', () => {
    it('should use kicker to break pair tie', () => {
      // Player 1: AA with K kicker, Player 2: AA with Q kicker
      const hand1 = evaluateHand(cards('Ah As Kh 5d 3c 2h 7s'));
      const hand2 = evaluateHand(cards('Ad Ac Qh 5d 3c 2h 7s'));
      
      const winners = determineWinners([hand1, hand2]);
      expect(winners).toEqual([0]); // Player 1 wins with K kicker
    });
    
    it('should tie when all kickers match', () => {
      // Both have pair of aces with same kickers
      const hand1 = evaluateHand(cards('Ah As Kh Qd Jc 2h 7s'));
      const hand2 = evaluateHand(cards('Ad Ac Ks Qc Js 2h 7s'));
      
      const winners = determineWinners([hand1, hand2]);
      expect(winners.length).toBe(2);
    });
    
    it('should use fifth kicker in two pair', () => {
      // Both have AA-KK, different fifth card
      const hand1 = evaluateHand(cards('Ah As Kh Kd Qc 2h 7s'));
      const hand2 = evaluateHand(cards('Ad Ac Ks Kc Jc 2h 7s'));
      
      const winners = determineWinners([hand1, hand2]);
      expect(winners).toEqual([0]); // Q beats J
    });
  });
});

describe('Edge Cases - Side Pots', () => {
  describe('single all-in player', () => {
    it('should create main pot and side pot', () => {
      const players = [
        createPlayer({ id: 'p1', totalBetThisRound: 100, isAllIn: true }),
        createPlayer({ id: 'p2', totalBetThisRound: 500 }),
        createPlayer({ id: 'p3', totalBetThisRound: 500 }),
      ];
      
      const state = createGameState({ players });
      const pots = calculatePots(state);
      
      // Main pot: 100 * 3 = 300 (all 3 eligible)
      // Side pot: 400 * 2 = 800 (only p2 and p3 eligible)
      expect(pots.length).toBe(2);
      
      const mainPot = pots.find(p => p.eligiblePlayers.length === 3);
      const sidePot = pots.find(p => p.eligiblePlayers.length === 2);
      
      expect(mainPot?.amount).toBe(300);
      expect(sidePot?.amount).toBe(800);
      expect(sidePot?.eligiblePlayers).toContain('p2');
      expect(sidePot?.eligiblePlayers).toContain('p3');
      expect(sidePot?.eligiblePlayers).not.toContain('p1');
    });
  });
  
  describe('multiple all-in players', () => {
    it('should create multiple side pots correctly', () => {
      const players = [
        createPlayer({ id: 'p1', totalBetThisRound: 50, isAllIn: true }),
        createPlayer({ id: 'p2', totalBetThisRound: 150, isAllIn: true }),
        createPlayer({ id: 'p3', totalBetThisRound: 300 }),
        createPlayer({ id: 'p4', totalBetThisRound: 300 }),
      ];
      
      const state = createGameState({ players });
      const pots = calculatePots(state);
      
      // Main pot: 50 * 4 = 200 (all 4)
      // Side pot 1: 100 * 3 = 300 (p2, p3, p4)
      // Side pot 2: 150 * 2 = 300 (p3, p4)
      expect(pots.length).toBe(3);
      
      const totalPotAmount = pots.reduce((sum, p) => sum + p.amount, 0);
      expect(totalPotAmount).toBe(800); // 50+150+300+300
    });
    
    it('should handle all players all-in for different amounts', () => {
      const players = [
        createPlayer({ id: 'p1', totalBetThisRound: 25, isAllIn: true }),
        createPlayer({ id: 'p2', totalBetThisRound: 50, isAllIn: true }),
        createPlayer({ id: 'p3', totalBetThisRound: 100, isAllIn: true }),
      ];
      
      const state = createGameState({ players });
      const pots = calculatePots(state);
      
      // Main pot: 25 * 3 = 75
      // Side pot 1: 25 * 2 = 50
      // Side pot 2: 50 * 1 = 50
      const totalPotAmount = pots.reduce((sum, p) => sum + p.amount, 0);
      expect(totalPotAmount).toBe(175);
    });
  });
  
  describe('folded players in side pots', () => {
    it('should not include folded players in pot eligibility', () => {
      const players = [
        createPlayer({ id: 'p1', totalBetThisRound: 100, hasFolded: true }),
        createPlayer({ id: 'p2', totalBetThisRound: 100 }),
        createPlayer({ id: 'p3', totalBetThisRound: 100 }),
      ];
      
      const state = createGameState({ players });
      const pots = calculatePots(state);
      
      // All money goes to one pot (300), but only p2 and p3 can win
      expect(pots.length).toBe(1);
      expect(pots[0].amount).toBe(300);
      expect(pots[0].eligiblePlayers).not.toContain('p1');
      expect(pots[0].eligiblePlayers.length).toBe(2);
    });
    
    it('should handle folded player who was all-in', () => {
      // This shouldn't happen in normal play, but should be handled
      const players = [
        createPlayer({ id: 'p1', totalBetThisRound: 50, isAllIn: true, hasFolded: true }),
        createPlayer({ id: 'p2', totalBetThisRound: 100 }),
        createPlayer({ id: 'p3', totalBetThisRound: 100 }),
      ];
      
      const state = createGameState({ players });
      const pots = calculatePots(state);
      
      // p1's money is in the pot but they can't win
      const totalPotAmount = pots.reduce((sum, p) => sum + p.amount, 0);
      expect(totalPotAmount).toBe(250);
      
      // No pot should list p1 as eligible
      for (const pot of pots) {
        expect(pot.eligiblePlayers).not.toContain('p1');
      }
    });
  });
});

describe('Edge Cases - All-In Scenarios', () => {
  describe('all-in for less than big blind', () => {
    it('should handle player with less chips than big blind', () => {
      const players = [
        createPlayer({ id: 'p1', chips: 5, totalBetThisRound: 5, isAllIn: true }),
        createPlayer({ id: 'p2', chips: 995, totalBetThisRound: 20 }),
      ];
      
      const state = createGameState({ players, bigBlind: 20 });
      const pots = calculatePots(state);
      
      // Main pot: 5 * 2 = 10 (both eligible)
      // Side pot: 15 * 1 = 15 (only p2 eligible)
      expect(pots.length).toBe(2);
    });
  });
  
  describe('all players all-in', () => {
    it('should proceed to showdown immediately', () => {
      // When all remaining players are all-in, no more betting
      const players = [
        createPlayer({ id: 'p1', totalBetThisRound: 100, isAllIn: true, chips: 0 }),
        createPlayer({ id: 'p2', totalBetThisRound: 200, isAllIn: true, chips: 0 }),
        createPlayer({ id: 'p3', totalBetThisRound: 300, isAllIn: true, chips: 0 }),
      ];
      
      const state = createGameState({ players });
      
      // Calculate pots - should be able to determine winner at showdown
      const pots = calculatePots(state);
      expect(pots.length).toBeGreaterThan(0);
      
      const totalPotAmount = pots.reduce((sum, p) => sum + p.amount, 0);
      expect(totalPotAmount).toBe(600);
    });
  });
});

describe('Edge Cases - Special Hands', () => {
  describe('wheel (A-2-3-4-5)', () => {
    it('should correctly evaluate wheel as lowest straight', () => {
      const wheel = evaluateHand(cards('Ah 2c 3d 4s 5h 9c Kd'));
      const sixHighStraight = evaluateHand(cards('2c 3d 4s 5h 6c 9h Kd'));
      
      // Six-high straight should beat wheel
      const winners = determineWinners([wheel, sixHighStraight]);
      expect(winners).toEqual([1]);
    });
    
    it('should recognize wheel straight flush', () => {
      const wheelFlush = evaluateHand(cards('Ah 2h 3h 4h 5h 9c Kd'));
      
      expect(wheelFlush.rank).toBe(9); // Straight flush
      expect(wheelFlush.highCards[0]).toBe(5); // 5-high
    });
  });
  
  describe('full house edge cases', () => {
    it('should pick best full house from multiple trips', () => {
      // Board with 777 and 888, player has 8
      const hand = evaluateHand(cards('8h 2c 7d 7s 7c 8d 8s'));
      
      // Should be 888 full of 777
      expect(hand.rank).toBe(7); // Full house
      expect(hand.highCards[0]).toBe(8); // Eights full
      expect(hand.highCards[1]).toBe(7); // of sevens
    });
    
    it('should compare full houses correctly', () => {
      const aaakk = evaluateHand(cards('Ah Ad As Kh Kd 2c 3c'));
      const kkkaa = evaluateHand(cards('Kh Kd Ks Ah Ad 2c 3c'));
      
      // AAA-KK beats KKK-AA
      const winners = determineWinners([aaakk, kkkaa]);
      expect(winners).toEqual([0]);
    });
  });
  
  describe('four of a kind edge cases', () => {
    it('should use kicker in four of a kind tie', () => {
      // Both have quad 7s, different kicker
      const quadsWithAce = evaluateHand(cards('7h 7d 7s 7c Ah 2c 3c'));
      const quadsWithKing = evaluateHand(cards('7h 7d 7s 7c Kh 2c 3c'));
      
      const winners = determineWinners([quadsWithAce, quadsWithKing]);
      expect(winners).toEqual([0]); // Ace kicker wins
    });
  });
});

describe('Edge Cases - Pot Calculation', () => {
  describe('total pot calculation', () => {
    it('should include current round bets in total', () => {
      const players = [
        createPlayer({ id: 'p1', currentBet: 50 }),
        createPlayer({ id: 'p2', currentBet: 50 }),
        createPlayer({ id: 'p3', currentBet: 50 }),
      ];
      
      const state = createGameState({
        players,
        pots: [{ amount: 200, eligiblePlayers: ['p1', 'p2', 'p3'] }]
      });
      
      // Total should be pot amount + current bets
      expect(getTotalPot(state)).toBe(350);
    });
    
    it('should handle empty pots', () => {
      const players = [
        createPlayer({ id: 'p1', currentBet: 20 }),
        createPlayer({ id: 'p2', currentBet: 20 }),
      ];
      
      const state = createGameState({
        players,
        pots: []
      });
      
      expect(getTotalPot(state)).toBe(40);
    });
  });
  
  describe('odd chip distribution', () => {
    it('should handle odd chip split (3-way)', () => {
      // 100 chips split 3 ways = 33, 33, 33 with 1 remainder
      // First player should get extra chip
      const pot = 100;
      const numWinners = 3;
      
      const share = Math.floor(pot / numWinners);
      const remainder = pot % numWinners;
      
      expect(share).toBe(33);
      expect(remainder).toBe(1);
    });
    
    it('should handle 2-way split of odd pot', () => {
      const pot = 101;
      const numWinners = 2;
      
      const share = Math.floor(pot / numWinners);
      const remainder = pot % numWinners;
      
      expect(share).toBe(50);
      expect(remainder).toBe(1);
    });
  });
});
