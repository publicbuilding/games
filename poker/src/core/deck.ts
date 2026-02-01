import { Card, Suit, Rank } from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

/**
 * Creates a standard 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle algorithm
 * Returns a new shuffled array (does not mutate original)
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Seeded shuffle for testing reproducibility
 */
export function shuffleDeckSeeded(deck: Card[], seed: number): Card[] {
  const shuffled = [...deck];
  let currentSeed = seed;
  
  const seededRandom = (): number => {
    currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
    return currentSeed / 0x7fffffff;
  };
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deal cards from the deck
 * Returns [dealtCards, remainingDeck]
 */
export function dealCards(deck: Card[], count: number): [Card[], Card[]] {
  if (count > deck.length) {
    throw new Error(`Cannot deal ${count} cards from deck of ${deck.length}`);
  }
  return [deck.slice(0, count), deck.slice(count)];
}

/**
 * Get card display string
 */
export function cardToString(card: Card): string {
  const rankStr = 
    card.rank === 14 ? 'A' :
    card.rank === 13 ? 'K' :
    card.rank === 12 ? 'Q' :
    card.rank === 11 ? 'J' :
    card.rank.toString();
  
  const suitSymbol = 
    card.suit === 'hearts' ? '♥' :
    card.suit === 'diamonds' ? '♦' :
    card.suit === 'clubs' ? '♣' : '♠';
  
  return `${rankStr}${suitSymbol}`;
}

/**
 * Parse card string back to Card object (for testing)
 */
export function parseCard(str: string): Card {
  const match = str.match(/^([2-9]|10|[JQKA])([♥♦♣♠hdcs])$/i);
  if (!match) throw new Error(`Invalid card string: ${str}`);
  
  const [, rankStr, suitStr] = match;
  
  const rank: Rank = 
    rankStr === 'A' ? 14 :
    rankStr === 'K' ? 13 :
    rankStr === 'Q' ? 12 :
    rankStr === 'J' ? 11 :
    parseInt(rankStr) as Rank;
  
  const suit: Suit = 
    suitStr === '♥' || suitStr.toLowerCase() === 'h' ? 'hearts' :
    suitStr === '♦' || suitStr.toLowerCase() === 'd' ? 'diamonds' :
    suitStr === '♣' || suitStr.toLowerCase() === 'c' ? 'clubs' : 'spades';
  
  return { suit, rank };
}
