// Card types
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J, 12=Q, 13=K, 14=A

export interface Card {
  suit: Suit;
  rank: Rank;
}

// Hand rankings
export enum HandRank {
  HIGH_CARD = 1,
  PAIR = 2,
  TWO_PAIR = 3,
  THREE_OF_A_KIND = 4,
  STRAIGHT = 5,
  FLUSH = 6,
  FULL_HOUSE = 7,
  FOUR_OF_A_KIND = 8,
  STRAIGHT_FLUSH = 9,
  ROYAL_FLUSH = 10,
}

export interface EvaluatedHand {
  rank: HandRank;
  rankName: string;
  highCards: Rank[]; // For tiebreakers, sorted high to low
  cards: Card[]; // The 5 cards making up the hand
}

// Player types
export type PlayerType = 'human' | 'ai';
export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  chips: number;
  holeCards: Card[];
  currentBet: number;
  totalBetThisRound: number;
  hasFolded: boolean;
  isAllIn: boolean;
  isDealer: boolean;
  isBigBlind: boolean;
  isSmallBlind: boolean;
  aiPersonality?: 'tight' | 'loose' | 'aggressive' | 'passive';
}

// Game state
export type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'ended';

export interface Pot {
  amount: number;
  eligiblePlayers: string[]; // Player IDs eligible to win this pot
}

export interface GameState {
  players: Player[];
  communityCards: Card[];
  deck: Card[];
  pots: Pot[];
  currentPlayerIndex: number;
  dealerIndex: number;
  phase: GamePhase;
  minimumBet: number;
  currentBet: number;
  smallBlind: number;
  bigBlind: number;
  roundNumber: number;
  lastAction?: { playerId: string; action: PlayerAction; amount?: number };
  winners?: { playerId: string; amount: number; hand?: EvaluatedHand }[];
}

export interface RoundHistoryEntry {
  roundNumber: number;
  winners: { playerId: string; playerName: string; amount: number; hand?: string }[];
  communityCards: Card[];
  potTotal: number;
}

export interface ActionResult {
  success: boolean;
  message?: string;
  nextPhase?: GamePhase;
}
