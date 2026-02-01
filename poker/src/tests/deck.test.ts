import { describe, it, expect } from 'vitest';
import { 
  createDeck, 
  shuffleDeck, 
  shuffleDeckSeeded, 
  dealCards, 
  cardToString, 
  parseCard 
} from '../core/deck';

describe('Deck', () => {
  describe('createDeck', () => {
    it('should create a 52-card deck', () => {
      const deck = createDeck();
      expect(deck.length).toBe(52);
    });
    
    it('should contain all suits', () => {
      const deck = createDeck();
      const suits = new Set(deck.map(c => c.suit));
      expect(suits.size).toBe(4);
      expect(suits.has('hearts')).toBe(true);
      expect(suits.has('diamonds')).toBe(true);
      expect(suits.has('clubs')).toBe(true);
      expect(suits.has('spades')).toBe(true);
    });
    
    it('should contain all ranks', () => {
      const deck = createDeck();
      const ranks = new Set(deck.map(c => c.rank));
      expect(ranks.size).toBe(13);
      for (let i = 2; i <= 14; i++) {
        expect(ranks.has(i as any)).toBe(true);
      }
    });
    
    it('should have 13 cards per suit', () => {
      const deck = createDeck();
      const heartCards = deck.filter(c => c.suit === 'hearts');
      expect(heartCards.length).toBe(13);
    });
    
    it('should have 4 cards per rank', () => {
      const deck = createDeck();
      const aces = deck.filter(c => c.rank === 14);
      expect(aces.length).toBe(4);
    });
    
    it('should have no duplicate cards', () => {
      const deck = createDeck();
      const cardStrings = deck.map(c => `${c.rank}-${c.suit}`);
      const uniqueCards = new Set(cardStrings);
      expect(uniqueCards.size).toBe(52);
    });
  });
  
  describe('shuffleDeck', () => {
    it('should return same number of cards', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      expect(shuffled.length).toBe(52);
    });
    
    it('should not mutate original deck', () => {
      const deck = createDeck();
      const firstCard = deck[0];
      shuffleDeck(deck);
      expect(deck[0]).toBe(firstCard);
    });
    
    it('should contain all original cards', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      
      const originalStrings = deck.map(c => `${c.rank}-${c.suit}`).sort();
      const shuffledStrings = shuffled.map(c => `${c.rank}-${c.suit}`).sort();
      
      expect(shuffledStrings).toEqual(originalStrings);
    });
    
    it('should produce different orders (statistical test)', () => {
      const deck = createDeck();
      const shuffles: string[] = [];
      
      // Shuffle 10 times and check they're all different
      for (let i = 0; i < 10; i++) {
        const shuffled = shuffleDeck(deck);
        const order = shuffled.map(c => `${c.rank}${c.suit}`).join(',');
        shuffles.push(order);
      }
      
      const uniqueShuffles = new Set(shuffles);
      // Extremely unlikely to get duplicates
      expect(uniqueShuffles.size).toBe(10);
    });
  });
  
  describe('shuffleDeckSeeded', () => {
    it('should produce consistent results with same seed', () => {
      const deck = createDeck();
      const shuffled1 = shuffleDeckSeeded(deck, 12345);
      const shuffled2 = shuffleDeckSeeded(deck, 12345);
      
      for (let i = 0; i < 52; i++) {
        expect(shuffled1[i].rank).toBe(shuffled2[i].rank);
        expect(shuffled1[i].suit).toBe(shuffled2[i].suit);
      }
    });
    
    it('should produce different results with different seeds', () => {
      const deck = createDeck();
      const shuffled1 = shuffleDeckSeeded(deck, 12345);
      const shuffled2 = shuffleDeckSeeded(deck, 54321);
      
      let samePosition = 0;
      for (let i = 0; i < 52; i++) {
        if (shuffled1[i].rank === shuffled2[i].rank && 
            shuffled1[i].suit === shuffled2[i].suit) {
          samePosition++;
        }
      }
      
      // Very unlikely to have many cards in same position
      expect(samePosition).toBeLessThan(10);
    });
  });
  
  describe('dealCards', () => {
    it('should deal correct number of cards', () => {
      const deck = createDeck();
      const [dealt, remaining] = dealCards(deck, 5);
      
      expect(dealt.length).toBe(5);
      expect(remaining.length).toBe(47);
    });
    
    it('should deal from top of deck', () => {
      const deck = createDeck();
      const [dealt] = dealCards(deck, 2);
      
      expect(dealt[0]).toEqual(deck[0]);
      expect(dealt[1]).toEqual(deck[1]);
    });
    
    it('should return remaining deck without dealt cards', () => {
      const deck = createDeck();
      const [, remaining] = dealCards(deck, 5);
      
      expect(remaining[0]).toEqual(deck[5]);
    });
    
    it('should throw error when dealing more cards than available', () => {
      const deck = createDeck();
      expect(() => dealCards(deck, 53)).toThrow();
    });
    
    it('should handle dealing entire deck', () => {
      const deck = createDeck();
      const [dealt, remaining] = dealCards(deck, 52);
      
      expect(dealt.length).toBe(52);
      expect(remaining.length).toBe(0);
    });
  });
  
  describe('cardToString', () => {
    it('should format number cards', () => {
      expect(cardToString({ rank: 2, suit: 'hearts' })).toBe('2♥');
      expect(cardToString({ rank: 10, suit: 'diamonds' })).toBe('10♦');
    });
    
    it('should format face cards', () => {
      expect(cardToString({ rank: 11, suit: 'clubs' })).toBe('J♣');
      expect(cardToString({ rank: 12, suit: 'spades' })).toBe('Q♠');
      expect(cardToString({ rank: 13, suit: 'hearts' })).toBe('K♥');
      expect(cardToString({ rank: 14, suit: 'diamonds' })).toBe('A♦');
    });
  });
  
  describe('parseCard', () => {
    it('should parse number cards with symbols', () => {
      const card = parseCard('2♥');
      expect(card.rank).toBe(2);
      expect(card.suit).toBe('hearts');
    });
    
    it('should parse face cards', () => {
      expect(parseCard('J♣').rank).toBe(11);
      expect(parseCard('Q♠').rank).toBe(12);
      expect(parseCard('K♥').rank).toBe(13);
      expect(parseCard('A♦').rank).toBe(14);
    });
    
    it('should parse cards with letter suits', () => {
      expect(parseCard('Ah').suit).toBe('hearts');
      expect(parseCard('Kd').suit).toBe('diamonds');
      expect(parseCard('Qc').suit).toBe('clubs');
      expect(parseCard('Js').suit).toBe('spades');
    });
    
    it('should parse 10', () => {
      const card = parseCard('10♠');
      expect(card.rank).toBe(10);
      expect(card.suit).toBe('spades');
    });
    
    it('should throw on invalid input', () => {
      expect(() => parseCard('XX')).toThrow();
      expect(() => parseCard('15h')).toThrow();
    });
  });
});
