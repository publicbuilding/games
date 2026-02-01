import { GameState, Player, PlayerAction, Card } from '../core/types';
import { evaluateHand } from '../core/handEvaluator';
import { getAvailableActions, calculateCallAmount } from '../core/betting';

export interface AIDecision {
  action: PlayerAction;
  amount?: number;
}

/**
 * Calculate hand strength (0-1) based on hole cards and community cards
 */
export function calculateHandStrength(holeCards: Card[], communityCards: Card[]): number {
  if (communityCards.length === 0) {
    // Preflop hand strength based on starting hand
    return evaluatePreflopStrength(holeCards);
  }
  
  const allCards = [...holeCards, ...communityCards];
  if (allCards.length < 5) return 0.5;
  
  const hand = evaluateHand(allCards);
  
  // Base strength from hand rank
  let strength = (hand.rank - 1) / 9; // 0 to 1
  
  // Adjust for high cards within rank
  const highCardBonus = (hand.highCards[0] - 2) / 12 * 0.1;
  strength += highCardBonus;
  
  return Math.min(1, Math.max(0, strength));
}

/**
 * Evaluate preflop hand strength
 */
function evaluatePreflopStrength(holeCards: Card[]): number {
  if (holeCards.length !== 2) return 0.5;
  
  const [card1, card2] = holeCards;
  const isPair = card1.rank === card2.rank;
  const isSuited = card1.suit === card2.suit;
  const highCard = Math.max(card1.rank, card2.rank);
  const lowCard = Math.min(card1.rank, card2.rank);
  const gap = highCard - lowCard;
  
  let strength = 0;
  
  // Pairs
  if (isPair) {
    strength = 0.5 + (card1.rank - 2) / 24; // AA = 1.0, 22 = 0.5
    return strength;
  }
  
  // High cards
  strength = (highCard + lowCard - 4) / 24; // Base from card values
  
  // Suited bonus
  if (isSuited) {
    strength += 0.05;
  }
  
  // Connected cards bonus
  if (gap <= 1) {
    strength += 0.05;
  } else if (gap <= 3) {
    strength += 0.02;
  }
  
  // Premium hands boost
  if (highCard >= 14 && lowCard >= 12) { // AK, AQ, KQ
    strength += 0.15;
  } else if (highCard >= 14 && lowCard >= 10) { // AT+
    strength += 0.08;
  }
  
  return Math.min(1, Math.max(0, strength));
}

/**
 * Calculate pot odds
 */
export function calculatePotOdds(callAmount: number, potSize: number): number {
  if (callAmount === 0) return 1;
  return potSize / (potSize + callAmount);
}

/**
 * Make AI decision based on personality and game state
 */
export function makeAIDecision(
  state: GameState,
  playerId: string
): AIDecision {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { action: 'fold' };
  }
  
  const availableActions = getAvailableActions(state);
  if (availableActions.length === 0) {
    return { action: 'fold' };
  }
  
  const handStrength = calculateHandStrength(player.holeCards, state.communityCards);
  const callAmount = calculateCallAmount(player, state.currentBet);
  const potSize = state.pots.reduce((sum, p) => sum + p.amount, 0) + 
    state.players.reduce((sum, p) => sum + p.currentBet, 0);
  const potOdds = calculatePotOdds(callAmount, potSize);
  
  // Get personality modifiers
  const personality = player.aiPersonality || 'passive';
  const modifiers = getPersonalityModifiers(personality);
  
  // Adjust thresholds based on personality
  const foldThreshold = 0.25 * modifiers.tightness;
  const callThreshold = 0.45 * modifiers.tightness;
  const raiseThreshold = 0.65 * modifiers.tightness;
  
  // Add some randomness
  const noise = (Math.random() - 0.5) * 0.15;
  const adjustedStrength = handStrength + noise;
  
  // Decision logic
  if (callAmount === 0) {
    // Can check
    if (adjustedStrength >= raiseThreshold && Math.random() < modifiers.aggression) {
      // Raise with strong hands
      const raiseAction = availableActions.find(a => a.action === 'raise');
      if (raiseAction) {
        const raiseAmount = calculateRaiseAmount(
          state, player, adjustedStrength, modifiers
        );
        return { action: 'raise', amount: raiseAmount };
      }
    }
    return { action: 'check' };
  }
  
  // Need to call or fold
  if (adjustedStrength < foldThreshold) {
    return { action: 'fold' };
  }
  
  // Consider pot odds
  const impliedOdds = handStrength >= potOdds;
  
  if (adjustedStrength >= raiseThreshold && impliedOdds && Math.random() < modifiers.aggression) {
    // Raise with strong hands
    const raiseAction = availableActions.find(a => a.action === 'raise');
    if (raiseAction) {
      const raiseAmount = calculateRaiseAmount(
        state, player, adjustedStrength, modifiers
      );
      return { action: 'raise', amount: raiseAmount };
    }
  }
  
  if (adjustedStrength >= callThreshold || impliedOdds) {
    // Check if should go all-in
    if (adjustedStrength >= 0.8 && Math.random() < 0.3) {
      return { action: 'all-in' };
    }
    return { action: 'call' };
  }
  
  // Bluff occasionally for aggressive personalities
  if (modifiers.bluffFrequency > Math.random()) {
    const raiseAction = availableActions.find(a => a.action === 'raise');
    if (raiseAction && callAmount < player.chips * 0.2) {
      return { action: 'call' };
    }
  }
  
  return { action: 'fold' };
}

interface PersonalityModifiers {
  tightness: number;      // Higher = tighter (folds more)
  aggression: number;     // Higher = raises more
  bluffFrequency: number; // Higher = bluffs more
}

function getPersonalityModifiers(personality: string): PersonalityModifiers {
  switch (personality) {
    case 'tight':
      return { tightness: 1.3, aggression: 0.4, bluffFrequency: 0.05 };
    case 'loose':
      return { tightness: 0.7, aggression: 0.5, bluffFrequency: 0.2 };
    case 'aggressive':
      return { tightness: 1.0, aggression: 0.8, bluffFrequency: 0.3 };
    case 'passive':
    default:
      return { tightness: 1.0, aggression: 0.3, bluffFrequency: 0.1 };
  }
}

function calculateRaiseAmount(
  state: GameState,
  player: Player,
  handStrength: number,
  modifiers: PersonalityModifiers
): number {
  const potSize = state.pots.reduce((sum, p) => sum + p.amount, 0) +
    state.players.reduce((sum, p) => sum + p.currentBet, 0);
  
  // Base raise: 50-100% of pot depending on strength
  const potPercentage = 0.5 + (handStrength * 0.5);
  let raiseAmount = Math.floor(potSize * potPercentage * modifiers.aggression);
  
  // Minimum raise is current bet + big blind
  const minRaise = state.currentBet + state.bigBlind;
  raiseAmount = Math.max(raiseAmount, minRaise);
  
  // Cap at player's stack
  raiseAmount = Math.min(raiseAmount, player.chips + player.currentBet);
  
  return raiseAmount;
}

/**
 * Get a delay for AI thinking (makes it feel more natural)
 */
export function getAIThinkingDelay(personality: string): number {
  const baseDelay = 800;
  const variance = Math.random() * 1200;
  
  switch (personality) {
    case 'tight':
      return baseDelay + variance + 400; // Takes more time
    case 'aggressive':
      return baseDelay + variance * 0.5; // Quick decisions
    default:
      return baseDelay + variance;
  }
}

/**
 * Generate a comment for the AI's action (for UI flavor)
 */
export function getAIComment(
  action: PlayerAction,
  personality: string,
  _handStrength: number
): string | null {
  if (Math.random() > 0.3) return null; // Only comment 30% of the time
  
  const comments: Record<string, Record<PlayerAction, string[]>> = {
    tight: {
      'fold': ['Not worth it.', 'I\'ll wait for better.', 'Too risky.'],
      'check': ['Let\'s see...', 'I\'ll check.'],
      'call': ['Fine, I\'ll play.', 'I\'ll see it.'],
      'raise': ['I like this hand.', 'Let\'s make it interesting.'],
      'all-in': ['All in!', 'I\'m confident.'],
    },
    loose: {
      'fold': ['Meh.', 'Not feeling it.'],
      'check': ['Sure.', 'Check it.'],
      'call': ['I\'m in!', 'Let\'s see what happens!'],
      'raise': ['Pump it up!', 'Let\'s go!'],
      'all-in': ['YOLO!', 'All in, baby!'],
    },
    aggressive: {
      'fold': ['...fine.', 'Not this time.'],
      'check': ['For now...', 'Checking.'],
      'call': ['I\'ll call that.', 'Easy call.'],
      'raise': ['Raise!', 'Pay to play.', 'Let\'s raise the stakes.'],
      'all-in': ['ALL IN!', 'Come at me!'],
    },
    passive: {
      'fold': ['I fold.', 'Not for me.'],
      'check': ['Check.', 'I check.'],
      'call': ['Call.', 'I\'ll call.'],
      'raise': ['Small raise.', 'I\'ll raise a bit.'],
      'all-in': ['All in...', 'Going all in.'],
    },
  };
  
  const personalityComments = comments[personality] || comments['passive'];
  const actionComments = personalityComments[action] || [];
  
  if (actionComments.length === 0) return null;
  
  return actionComments[Math.floor(Math.random() * actionComments.length)];
}
