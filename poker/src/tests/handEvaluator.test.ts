import { describe, it, expect } from 'vitest';
import { 
  evaluateHand, 
  evaluate5Cards, 
  compareHands, 
  determineWinners,
  handToString 
} from '../core/handEvaluator';
import { parseCard } from '../core/deck';
import { Card, HandRank } from '../core/types';

// Helper to create cards from string notation
function cards(str: string): Card[] {
  return str.split(' ').map(parseCard);
}

describe('Hand Evaluator', () => {
  describe('evaluate5Cards', () => {
    it('should identify Royal Flush', () => {
      const hand = evaluate5Cards(cards('As Ks Qs Js 10s'));
      expect(hand.rank).toBe(HandRank.ROYAL_FLUSH);
      expect(hand.rankName).toBe('Royal Flush');
    });
    
    it('should identify Straight Flush', () => {
      const hand = evaluate5Cards(cards('9h 8h 7h 6h 5h'));
      expect(hand.rank).toBe(HandRank.STRAIGHT_FLUSH);
      expect(hand.highCards[0]).toBe(9);
    });
    
    it('should identify Wheel Straight Flush (A-2-3-4-5)', () => {
      const hand = evaluate5Cards(cards('Ac 2c 3c 4c 5c'));
      expect(hand.rank).toBe(HandRank.STRAIGHT_FLUSH);
      expect(hand.highCards[0]).toBe(5); // 5-high straight
    });
    
    it('should identify Four of a Kind', () => {
      const hand = evaluate5Cards(cards('Kh Kd Ks Kc 7d'));
      expect(hand.rank).toBe(HandRank.FOUR_OF_A_KIND);
      expect(hand.highCards[0]).toBe(13); // Kings
      expect(hand.highCards[1]).toBe(7); // Kicker
    });
    
    it('should identify Full House', () => {
      const hand = evaluate5Cards(cards('Qh Qd Qs 8c 8d'));
      expect(hand.rank).toBe(HandRank.FULL_HOUSE);
      expect(hand.highCards[0]).toBe(12); // Queens
      expect(hand.highCards[1]).toBe(8); // Eights
    });
    
    it('should identify Flush', () => {
      const hand = evaluate5Cards(cards('Ah 10h 7h 4h 2h'));
      expect(hand.rank).toBe(HandRank.FLUSH);
      expect(hand.highCards[0]).toBe(14); // Ace high
    });
    
    it('should identify Straight', () => {
      const hand = evaluate5Cards(cards('10c 9h 8d 7s 6c'));
      expect(hand.rank).toBe(HandRank.STRAIGHT);
      expect(hand.highCards[0]).toBe(10);
    });
    
    it('should identify Wheel Straight (A-2-3-4-5)', () => {
      const hand = evaluate5Cards(cards('Ah 2d 3c 4s 5h'));
      expect(hand.rank).toBe(HandRank.STRAIGHT);
      expect(hand.highCards[0]).toBe(5); // 5-high
    });
    
    it('should identify Three of a Kind', () => {
      const hand = evaluate5Cards(cards('Jh Jd Js 9c 5d'));
      expect(hand.rank).toBe(HandRank.THREE_OF_A_KIND);
      expect(hand.highCards[0]).toBe(11); // Jacks
    });
    
    it('should identify Two Pair', () => {
      const hand = evaluate5Cards(cards('Ah Ad 8h 8c 3s'));
      expect(hand.rank).toBe(HandRank.TWO_PAIR);
      expect(hand.highCards[0]).toBe(14); // Aces
      expect(hand.highCards[1]).toBe(8); // Eights
      expect(hand.highCards[2]).toBe(3); // Kicker
    });
    
    it('should identify One Pair', () => {
      const hand = evaluate5Cards(cards('10h 10d 8c 6s 2d'));
      expect(hand.rank).toBe(HandRank.PAIR);
      expect(hand.highCards[0]).toBe(10);
    });
    
    it('should identify High Card', () => {
      const hand = evaluate5Cards(cards('Ah Qd 9c 6s 3h'));
      expect(hand.rank).toBe(HandRank.HIGH_CARD);
      expect(hand.highCards[0]).toBe(14); // Ace high
    });
  });
  
  describe('evaluateHand (7 cards)', () => {
    it('should find best 5-card hand from 7 cards', () => {
      // Hole: Ah Kh, Community: Qh Jh 10h 2c 3d (Royal Flush)
      const hand = evaluateHand(cards('Ah Kh Qh Jh 10h 2c 3d'));
      expect(hand.rank).toBe(HandRank.ROYAL_FLUSH);
    });
    
    it('should find flush over straight when both possible', () => {
      // Has both straight and flush, but flush is better
      const hand = evaluateHand(cards('Ah Kh Qh Jd 10h 9h 2c'));
      expect(hand.rank).toBe(HandRank.FLUSH);
      expect(hand.highCards[0]).toBe(14); // Ace-high flush
    });
    
    it('should find full house from trips and two pairs', () => {
      // Three 9s and two pairs (Kings, Queens) - should find 9s full of Kings
      const hand = evaluateHand(cards('9h 9d 9s Kh Kd Qh Qd'));
      expect(hand.rank).toBe(HandRank.FULL_HOUSE);
      expect(hand.highCards[0]).toBe(9);
      expect(hand.highCards[1]).toBe(13); // Kings over Queens
    });
  });
  
  describe('compareHands', () => {
    it('should rank flush higher than straight', () => {
      const flush = evaluate5Cards(cards('Ah 9h 7h 5h 2h'));
      const straight = evaluate5Cards(cards('10c 9h 8d 7s 6c'));
      expect(compareHands(flush, straight)).toBeGreaterThan(0);
    });
    
    it('should compare same rank hands by high cards', () => {
      const pairAces = evaluate5Cards(cards('Ah Ad Kc 8s 3h'));
      const pairKings = evaluate5Cards(cards('Kh Kd Qc 8s 3h'));
      expect(compareHands(pairAces, pairKings)).toBeGreaterThan(0);
    });
    
    it('should compare kickers when pairs are equal', () => {
      const pairAcesKing = evaluate5Cards(cards('Ah Ad Kc 8s 3h'));
      const pairAcesQueen = evaluate5Cards(cards('As Ac Qc 8s 3h'));
      expect(compareHands(pairAcesKing, pairAcesQueen)).toBeGreaterThan(0);
    });
    
    it('should identify a tie', () => {
      const hand1 = evaluate5Cards(cards('Ah Kh Qh Jh 9h'));
      const hand2 = evaluate5Cards(cards('Ad Kd Qd Jd 9d'));
      expect(compareHands(hand1, hand2)).toBe(0);
    });
    
    it('should compare two pair correctly', () => {
      const acesAndKings = evaluate5Cards(cards('Ah Ad Kh Kd 5c'));
      const acesAndQueens = evaluate5Cards(cards('As Ac Qh Qd 5s'));
      expect(compareHands(acesAndKings, acesAndQueens)).toBeGreaterThan(0);
    });
  });
  
  describe('determineWinners', () => {
    it('should identify single winner', () => {
      const hands = [
        evaluate5Cards(cards('Ah Ad Kc 8s 3h')), // Pair of Aces
        evaluate5Cards(cards('Kh Kd Qc 8s 3h')), // Pair of Kings
        evaluate5Cards(cards('Jh Jd 10c 8s 3h')), // Pair of Jacks
      ];
      
      const winners = determineWinners(hands);
      expect(winners).toEqual([0]); // Player 0 wins with Aces
    });
    
    it('should identify multiple winners (split pot)', () => {
      const hands = [
        evaluate5Cards(cards('Ah Kh Qd Jc 9s')), // A-high
        evaluate5Cards(cards('Ad Kd Qs Jh 9c')), // A-high (same)
        evaluate5Cards(cards('Kh Qh Jd 10c 8s')), // K-high
      ];
      
      const winners = determineWinners(hands);
      expect(winners).toEqual([0, 1]); // Players 0 and 1 tie
    });
    
    it('should handle null hands (folded players)', () => {
      const hands = [
        null, // Folded
        evaluate5Cards(cards('Kh Kd Qc 8s 3h')),
        null, // Folded
      ];
      
      const winners = determineWinners(hands);
      expect(winners).toEqual([1]);
    });
  });
  
  describe('handToString', () => {
    it('should describe Royal Flush', () => {
      const hand = evaluate5Cards(cards('As Ks Qs Js 10s'));
      expect(handToString(hand)).toBe('Royal Flush');
    });
    
    it('should describe Full House', () => {
      const hand = evaluate5Cards(cards('Ah Ad As Kh Kd'));
      expect(handToString(hand)).toBe('Full House, Aces over Kings');
    });
    
    it('should describe Two Pair', () => {
      const hand = evaluate5Cards(cards('Qh Qd 8h 8d 3c'));
      expect(handToString(hand)).toBe('Two Pair, Queens and Eights');
    });
    
    it('should describe Pair', () => {
      const hand = evaluate5Cards(cards('7h 7d Ac Kc Qc'));
      expect(handToString(hand)).toBe('Pair of Sevens');
    });
  });
  
  describe('edge cases', () => {
    it('should throw error for less than 5 cards', () => {
      expect(() => evaluateHand(cards('Ah Kh Qh'))).toThrow();
    });
    
    it('should handle Broadway straight correctly', () => {
      const hand = evaluate5Cards(cards('Ah Kd Qc Js 10h'));
      expect(hand.rank).toBe(HandRank.STRAIGHT);
      expect(hand.highCards[0]).toBe(14); // Ace-high
    });
    
    it('should distinguish between straights and almost-straights', () => {
      // 10-9-8-7-5 is NOT a straight
      const hand = evaluate5Cards(cards('10h 9d 8c 7s 5h'));
      expect(hand.rank).toBe(HandRank.HIGH_CARD);
    });
  });
});
