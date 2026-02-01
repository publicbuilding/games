import { Card, Rank, EvaluatedHand, HandRank } from './types';

/**
 * Evaluate the best 5-card hand from any combination of cards
 * Typically called with 7 cards (2 hole + 5 community)
 */
export function evaluateHand(cards: Card[]): EvaluatedHand {
  if (cards.length < 5) {
    throw new Error('Need at least 5 cards to evaluate a hand');
  }
  
  // Generate all 5-card combinations
  const combinations = getCombinations(cards, 5);
  
  let bestHand: EvaluatedHand | null = null;
  
  for (const combo of combinations) {
    const evaluated = evaluate5Cards(combo);
    if (!bestHand || compareHands(evaluated, bestHand) > 0) {
      bestHand = evaluated;
    }
  }
  
  return bestHand!;
}

/**
 * Evaluate exactly 5 cards
 */
export function evaluate5Cards(cards: Card[]): EvaluatedHand {
  if (cards.length !== 5) {
    throw new Error('Must evaluate exactly 5 cards');
  }
  
  const sortedCards = [...cards].sort((a, b) => b.rank - a.rank);
  const ranks = sortedCards.map(c => c.rank);
  const suits = sortedCards.map(c => c.suit);
  
  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = checkStraight(ranks);
  const isWheel = checkWheel(ranks); // A-2-3-4-5 straight
  
  const rankCounts = getRankCounts(ranks);
  const countValues = Object.values(rankCounts).sort((a, b) => b - a);
  
  // Royal Flush
  if (isFlush && isStraight && ranks[0] === 14 && ranks[1] === 13) {
    return {
      rank: HandRank.ROYAL_FLUSH,
      rankName: 'Royal Flush',
      highCards: ranks,
      cards: sortedCards,
    };
  }
  
  // Straight Flush
  if (isFlush && (isStraight || isWheel)) {
    const highCards = isWheel ? [5, 4, 3, 2, 14] as Rank[] : ranks;
    return {
      rank: HandRank.STRAIGHT_FLUSH,
      rankName: 'Straight Flush',
      highCards,
      cards: sortedCards,
    };
  }
  
  // Four of a Kind
  if (countValues[0] === 4) {
    const quadRank = findRankWithCount(rankCounts, 4);
    const kicker = ranks.find(r => r !== quadRank)!;
    return {
      rank: HandRank.FOUR_OF_A_KIND,
      rankName: 'Four of a Kind',
      highCards: [quadRank, kicker],
      cards: sortedCards,
    };
  }
  
  // Full House
  if (countValues[0] === 3 && countValues[1] === 2) {
    const tripRank = findRankWithCount(rankCounts, 3);
    const pairRank = findRankWithCount(rankCounts, 2);
    return {
      rank: HandRank.FULL_HOUSE,
      rankName: 'Full House',
      highCards: [tripRank, pairRank],
      cards: sortedCards,
    };
  }
  
  // Flush
  if (isFlush) {
    return {
      rank: HandRank.FLUSH,
      rankName: 'Flush',
      highCards: ranks,
      cards: sortedCards,
    };
  }
  
  // Straight
  if (isStraight || isWheel) {
    const highCards = isWheel ? [5, 4, 3, 2, 14] as Rank[] : ranks;
    return {
      rank: HandRank.STRAIGHT,
      rankName: 'Straight',
      highCards,
      cards: sortedCards,
    };
  }
  
  // Three of a Kind
  if (countValues[0] === 3) {
    const tripRank = findRankWithCount(rankCounts, 3);
    const kickers = ranks.filter(r => r !== tripRank);
    return {
      rank: HandRank.THREE_OF_A_KIND,
      rankName: 'Three of a Kind',
      highCards: [tripRank, ...kickers],
      cards: sortedCards,
    };
  }
  
  // Two Pair
  if (countValues[0] === 2 && countValues[1] === 2) {
    const pairs = findAllRanksWithCount(rankCounts, 2).sort((a, b) => b - a);
    const kicker = ranks.find(r => !pairs.includes(r))!;
    return {
      rank: HandRank.TWO_PAIR,
      rankName: 'Two Pair',
      highCards: [...pairs, kicker],
      cards: sortedCards,
    };
  }
  
  // One Pair
  if (countValues[0] === 2) {
    const pairRank = findRankWithCount(rankCounts, 2);
    const kickers = ranks.filter(r => r !== pairRank);
    return {
      rank: HandRank.PAIR,
      rankName: 'Pair',
      highCards: [pairRank, ...kickers],
      cards: sortedCards,
    };
  }
  
  // High Card
  return {
    rank: HandRank.HIGH_CARD,
    rankName: 'High Card',
    highCards: ranks,
    cards: sortedCards,
  };
}

/**
 * Compare two hands. Returns:
 *  > 0 if hand1 wins
 *  < 0 if hand2 wins
 *  0 if tie
 */
export function compareHands(hand1: EvaluatedHand, hand2: EvaluatedHand): number {
  if (hand1.rank !== hand2.rank) {
    return hand1.rank - hand2.rank;
  }
  
  // Same rank - compare high cards for tiebreaker
  for (let i = 0; i < hand1.highCards.length; i++) {
    if (hand1.highCards[i] !== hand2.highCards[i]) {
      return hand1.highCards[i] - hand2.highCards[i];
    }
  }
  
  return 0; // True tie
}

/**
 * Determine winners from multiple hands
 * Returns indices of winning players (can be multiple for split pot)
 */
export function determineWinners(hands: (EvaluatedHand | null)[]): number[] {
  let bestIndices: number[] = [];
  let bestHand: EvaluatedHand | null = null;
  
  for (let i = 0; i < hands.length; i++) {
    const hand = hands[i];
    if (!hand) continue;
    
    if (!bestHand) {
      bestHand = hand;
      bestIndices = [i];
    } else {
      const comparison = compareHands(hand, bestHand);
      if (comparison > 0) {
        bestHand = hand;
        bestIndices = [i];
      } else if (comparison === 0) {
        bestIndices.push(i);
      }
    }
  }
  
  return bestIndices;
}

// Helper functions

function getCombinations<T>(arr: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (arr.length < size) return [];
  
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, size - 1).map(combo => [first, ...combo]);
  const withoutFirst = getCombinations(rest, size);
  
  return [...withFirst, ...withoutFirst];
}

function checkStraight(ranks: Rank[]): boolean {
  const sorted = [...ranks].sort((a, b) => b - a);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i] - sorted[i + 1] !== 1) return false;
  }
  return true;
}

function checkWheel(ranks: Rank[]): boolean {
  const sorted = [...ranks].sort((a, b) => a - b);
  return sorted[0] === 2 && sorted[1] === 3 && sorted[2] === 4 && 
         sorted[3] === 5 && sorted[4] === 14;
}

function getRankCounts(ranks: Rank[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const rank of ranks) {
    counts[rank] = (counts[rank] || 0) + 1;
  }
  return counts;
}

function findRankWithCount(counts: Record<number, number>, count: number): Rank {
  const ranks = Object.entries(counts)
    .filter(([, c]) => c === count)
    .map(([r]) => parseInt(r) as Rank)
    .sort((a, b) => b - a);
  return ranks[0];
}

function findAllRanksWithCount(counts: Record<number, number>, count: number): Rank[] {
  return Object.entries(counts)
    .filter(([, c]) => c === count)
    .map(([r]) => parseInt(r) as Rank);
}

/**
 * Get a human-readable description of a hand
 */
export function handToString(hand: EvaluatedHand): string {
  const rankNames: Record<number, string> = {
    14: 'Aces', 13: 'Kings', 12: 'Queens', 11: 'Jacks', 10: 'Tens',
    9: 'Nines', 8: 'Eights', 7: 'Sevens', 6: 'Sixes', 5: 'Fives',
    4: 'Fours', 3: 'Threes', 2: 'Twos',
  };
  
  const singleRank: Record<number, string> = {
    14: 'Ace', 13: 'King', 12: 'Queen', 11: 'Jack', 10: 'Ten',
    9: 'Nine', 8: 'Eight', 7: 'Seven', 6: 'Six', 5: 'Five',
    4: 'Four', 3: 'Three', 2: 'Two',
  };
  
  switch (hand.rank) {
    case HandRank.ROYAL_FLUSH:
      return 'Royal Flush';
    case HandRank.STRAIGHT_FLUSH:
      return `Straight Flush, ${singleRank[hand.highCards[0]]} high`;
    case HandRank.FOUR_OF_A_KIND:
      return `Four ${rankNames[hand.highCards[0]]}`;
    case HandRank.FULL_HOUSE:
      return `Full House, ${rankNames[hand.highCards[0]]} over ${rankNames[hand.highCards[1]]}`;
    case HandRank.FLUSH:
      return `Flush, ${singleRank[hand.highCards[0]]} high`;
    case HandRank.STRAIGHT:
      return `Straight, ${singleRank[hand.highCards[0]]} high`;
    case HandRank.THREE_OF_A_KIND:
      return `Three ${rankNames[hand.highCards[0]]}`;
    case HandRank.TWO_PAIR:
      return `Two Pair, ${rankNames[hand.highCards[0]]} and ${rankNames[hand.highCards[1]]}`;
    case HandRank.PAIR:
      return `Pair of ${rankNames[hand.highCards[0]]}`;
    case HandRank.HIGH_CARD:
      return `${singleRank[hand.highCards[0]]} high`;
    default:
      return hand.rankName;
  }
}
