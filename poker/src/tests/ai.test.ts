import { describe, it, expect } from 'vitest';
import {
  calculateHandStrength,
  calculatePotOdds,
  makeAIDecision,
  getAIThinkingDelay,
  getAIComment
} from '../ai/botPlayer';
import { GameState, Player, Card } from '../core/types';

// Helper to create cards
function card(rank: number, suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'): Card {
  return { rank: rank as any, suit };
}

// Helper to create test player
function createPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'test_player',
    name: 'Test',
    type: 'ai',
    chips: 1000,
    holeCards: [],
    currentBet: 0,
    totalBetThisRound: 0,
    hasFolded: false,
    isAllIn: false,
    isDealer: false,
    isBigBlind: false,
    isSmallBlind: false,
    aiPersonality: 'passive',
    ...overrides
  };
}

// Helper to create game state
function createGameState(overrides: Partial<GameState> = {}): GameState {
  const players = overrides.players || [
    createPlayer({ id: 'player_0' }),
    createPlayer({ id: 'player_1' }),
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

describe('AI Player', () => {
  describe('calculateHandStrength', () => {
    describe('preflop hands', () => {
      it('should rate pocket aces highly', () => {
        const holeCards = [card(14, 'hearts'), card(14, 'spades')];
        const strength = calculateHandStrength(holeCards, []);
        expect(strength).toBeGreaterThan(0.9);
      });
      
      it('should rate pocket twos lower', () => {
        const holeCards = [card(2, 'hearts'), card(2, 'spades')];
        const strength = calculateHandStrength(holeCards, []);
        expect(strength).toBeGreaterThan(0.4);
        expect(strength).toBeLessThan(0.6);
      });
      
      it('should rate suited connectors moderately to good', () => {
        const holeCards = [card(10, 'hearts'), card(9, 'hearts')];
        const strength = calculateHandStrength(holeCards, []);
        expect(strength).toBeGreaterThan(0.5); // Suited connectors are good
        expect(strength).toBeLessThan(0.85); // But not as good as premium pairs
      });
      
      it('should rate junk hands low', () => {
        const holeCards = [card(7, 'hearts'), card(2, 'spades')];
        const strength = calculateHandStrength(holeCards, []);
        expect(strength).toBeLessThan(0.4);
      });
      
      it('should add bonus for suited cards', () => {
        const suitedHand = calculateHandStrength(
          [card(10, 'hearts'), card(8, 'hearts')], 
          []
        );
        const unsuitedHand = calculateHandStrength(
          [card(10, 'hearts'), card(8, 'spades')],
          []
        );
        expect(suitedHand).toBeGreaterThan(unsuitedHand);
      });
    });
    
    describe('postflop hands', () => {
      it('should recognize strong made hands', () => {
        // Pocket aces with an ace on the board = three of a kind
        const holeCards = [card(14, 'hearts'), card(14, 'spades')];
        const community = [
          card(14, 'diamonds'),
          card(7, 'clubs'),
          card(3, 'hearts'),
          card(9, 'spades'),
          card(2, 'clubs')
        ];
        
        const strength = calculateHandStrength(holeCards, community);
        expect(strength).toBeGreaterThan(0.4); // Three of a kind
      });
      
      it('should recognize flush', () => {
        const holeCards = [card(14, 'hearts'), card(10, 'hearts')];
        const community = [
          card(7, 'hearts'),
          card(5, 'hearts'),
          card(2, 'hearts'),
          card(9, 'spades'),
          card(3, 'clubs')
        ];
        
        const strength = calculateHandStrength(holeCards, community);
        expect(strength).toBeGreaterThan(0.5); // Flush
      });
    });
  });
  
  describe('calculatePotOdds', () => {
    it('should return 1 when nothing to call', () => {
      expect(calculatePotOdds(0, 100)).toBe(1);
    });
    
    it('should calculate correct pot odds', () => {
      // Call 50 into pot of 100 = 100/(100+50) = 0.667
      const odds = calculatePotOdds(50, 100);
      expect(odds).toBeCloseTo(0.667, 2);
    });
    
    it('should handle large pots', () => {
      const odds = calculatePotOdds(100, 1000);
      expect(odds).toBeCloseTo(0.909, 2);
    });
  });
  
  describe('makeAIDecision', () => {
    it('should return a valid action', () => {
      const players = [
        createPlayer({ 
          id: 'player_0', 
          holeCards: [card(14, 'hearts'), card(14, 'spades')],
          aiPersonality: 'passive'
        }),
        createPlayer({ id: 'player_1' }),
      ];
      
      const state = createGameState({ players, currentBet: 20 });
      const decision = makeAIDecision(state, 'player_0');
      
      expect(['fold', 'check', 'call', 'raise', 'all-in']).toContain(decision.action);
    });
    
    it('should fold bad hands sometimes', () => {
      const players = [
        createPlayer({ 
          id: 'player_0', 
          holeCards: [card(2, 'hearts'), card(7, 'spades')],
          aiPersonality: 'tight'
        }),
        createPlayer({ id: 'player_1' }),
      ];
      
      const state = createGameState({ players, currentBet: 100 }); // Big bet to call
      
      // Run multiple times to account for randomness
      let foldCount = 0;
      for (let i = 0; i < 20; i++) {
        const decision = makeAIDecision(state, 'player_0');
        if (decision.action === 'fold') foldCount++;
      }
      
      // Tight player should fold weak hand against big bet most of the time
      expect(foldCount).toBeGreaterThan(5);
    });
    
    it('should be more aggressive with strong hands', () => {
      const players = [
        createPlayer({ 
          id: 'player_0', 
          holeCards: [card(14, 'hearts'), card(14, 'spades')],
          aiPersonality: 'aggressive'
        }),
        createPlayer({ id: 'player_1' }),
      ];
      
      const state = createGameState({ players, currentBet: 20 });
      
      // Run multiple times
      let raiseCount = 0;
      for (let i = 0; i < 20; i++) {
        const decision = makeAIDecision(state, 'player_0');
        if (decision.action === 'raise' || decision.action === 'all-in') raiseCount++;
      }
      
      // Aggressive player with aces should raise often
      expect(raiseCount).toBeGreaterThan(5);
    });
    
    it('should check when possible with medium hands', () => {
      const players = [
        createPlayer({ 
          id: 'player_0', 
          holeCards: [card(9, 'hearts'), card(8, 'spades')],
          currentBet: 0,
          aiPersonality: 'passive'
        }),
        createPlayer({ id: 'player_1' }),
      ];
      
      const state = createGameState({ players, currentBet: 0 });
      
      // Check should be common when free
      let checkCount = 0;
      for (let i = 0; i < 20; i++) {
        const decision = makeAIDecision(state, 'player_0');
        if (decision.action === 'check') checkCount++;
      }
      
      expect(checkCount).toBeGreaterThan(0);
    });
    
    it('should return fold for unknown player', () => {
      const state = createGameState();
      const decision = makeAIDecision(state, 'unknown_player');
      expect(decision.action).toBe('fold');
    });
  });
  
  describe('getAIThinkingDelay', () => {
    it('should return a positive delay', () => {
      const delay = getAIThinkingDelay('passive');
      expect(delay).toBeGreaterThan(0);
    });
    
    it('should vary by personality', () => {
      // Run multiple times and check averages
      let aggressiveTotal = 0;
      let tightTotal = 0;
      
      for (let i = 0; i < 100; i++) {
        aggressiveTotal += getAIThinkingDelay('aggressive');
        tightTotal += getAIThinkingDelay('tight');
      }
      
      // Tight players should think longer on average
      expect(tightTotal).toBeGreaterThan(aggressiveTotal);
    });
  });
  
  describe('getAIComment', () => {
    it('should return null sometimes', () => {
      let nullCount = 0;
      for (let i = 0; i < 100; i++) {
        if (getAIComment('fold', 'passive', 0.5) === null) {
          nullCount++;
        }
      }
      
      // Should return null ~70% of the time
      expect(nullCount).toBeGreaterThan(50);
    });
    
    it('should return appropriate comments for actions', () => {
      // Get a non-null comment
      let comment: string | null = null;
      for (let i = 0; i < 100 && !comment; i++) {
        comment = getAIComment('all-in', 'aggressive', 0.9);
      }
      
      // If we got a comment, it should be a string
      if (comment) {
        expect(typeof comment).toBe('string');
        expect(comment.length).toBeGreaterThan(0);
      }
    });
    
    it('should have different comments for different personalities', () => {
      // Collect comments from different personalities
      const comments = new Set<string>();
      
      const personalities = ['tight', 'loose', 'aggressive', 'passive'];
      const actions = ['fold', 'call', 'raise', 'all-in'] as const;
      
      for (const personality of personalities) {
        for (const action of actions) {
          for (let i = 0; i < 50; i++) {
            const comment = getAIComment(action, personality, 0.5);
            if (comment) comments.add(comment);
          }
        }
      }
      
      // Should have variety of comments
      expect(comments.size).toBeGreaterThan(5);
    });
  });
  
  describe('personality effects', () => {
    it('tight personality should fold more often', () => {
      const createTightState = () => {
        const players = [
          createPlayer({ 
            id: 'player_0', 
            holeCards: [card(5, 'hearts'), card(6, 'spades')],
            aiPersonality: 'tight'
          }),
          createPlayer({ id: 'player_1' }),
        ];
        return createGameState({ players, currentBet: 40 });
      };
      
      const createLooseState = () => {
        const players = [
          createPlayer({ 
            id: 'player_0', 
            holeCards: [card(5, 'hearts'), card(6, 'spades')],
            aiPersonality: 'loose'
          }),
          createPlayer({ id: 'player_1' }),
        ];
        return createGameState({ players, currentBet: 40 });
      };
      
      let tightFolds = 0;
      let looseFolds = 0;
      
      for (let i = 0; i < 50; i++) {
        if (makeAIDecision(createTightState(), 'player_0').action === 'fold') tightFolds++;
        if (makeAIDecision(createLooseState(), 'player_0').action === 'fold') looseFolds++;
      }
      
      expect(tightFolds).toBeGreaterThan(looseFolds);
    });
    
    it('aggressive personality should raise more often', () => {
      const createAggressiveState = () => {
        const players = [
          createPlayer({ 
            id: 'player_0', 
            holeCards: [card(13, 'hearts'), card(12, 'spades')],
            aiPersonality: 'aggressive'
          }),
          createPlayer({ id: 'player_1' }),
        ];
        return createGameState({ players, currentBet: 20 });
      };
      
      const createPassiveState = () => {
        const players = [
          createPlayer({ 
            id: 'player_0', 
            holeCards: [card(13, 'hearts'), card(12, 'spades')],
            aiPersonality: 'passive'
          }),
          createPlayer({ id: 'player_1' }),
        ];
        return createGameState({ players, currentBet: 20 });
      };
      
      let aggressiveRaises = 0;
      let passiveRaises = 0;
      
      for (let i = 0; i < 50; i++) {
        const aggAction = makeAIDecision(createAggressiveState(), 'player_0').action;
        const passAction = makeAIDecision(createPassiveState(), 'player_0').action;
        
        if (aggAction === 'raise' || aggAction === 'all-in') aggressiveRaises++;
        if (passAction === 'raise' || passAction === 'all-in') passiveRaises++;
      }
      
      expect(aggressiveRaises).toBeGreaterThan(passiveRaises);
    });
  });
});
