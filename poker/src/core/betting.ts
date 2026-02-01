import { Player, GameState, PlayerAction, ActionResult, Pot } from './types';

/**
 * Calculate the amount needed to call for a player
 */
export function calculateCallAmount(player: Player, currentBet: number): number {
  return Math.min(currentBet - player.currentBet, player.chips);
}

/**
 * Validate if a player can perform an action
 */
export function validateAction(
  state: GameState,
  playerId: string,
  action: PlayerAction,
  raiseAmount?: number
): ActionResult {
  const player = state.players.find(p => p.id === playerId);
  
  if (!player) {
    return { success: false, message: 'Player not found' };
  }
  
  if (player.hasFolded) {
    return { success: false, message: 'Player has already folded' };
  }
  
  if (player.isAllIn) {
    return { success: false, message: 'Player is all-in' };
  }
  
  const currentPlayerIdx = state.currentPlayerIndex;
  const currentPlayer = state.players[currentPlayerIdx];
  
  if (currentPlayer.id !== playerId) {
    return { success: false, message: 'Not your turn' };
  }
  
  switch (action) {
    case 'fold':
      return { success: true };
      
    case 'check':
      if (player.currentBet < state.currentBet) {
        return { success: false, message: 'Cannot check, must call or fold' };
      }
      return { success: true };
      
    case 'call':
      if (player.currentBet >= state.currentBet) {
        return { success: false, message: 'Nothing to call, use check instead' };
      }
      return { success: true };
      
    case 'raise':
      if (raiseAmount === undefined || raiseAmount <= 0) {
        return { success: false, message: 'Must specify raise amount' };
      }
      const minRaise = state.currentBet - player.currentBet + state.bigBlind;
      if (raiseAmount < minRaise && raiseAmount < player.chips) {
        return { success: false, message: `Minimum raise is ${minRaise}` };
      }
      if (raiseAmount > player.chips) {
        return { success: false, message: 'Not enough chips' };
      }
      return { success: true };
      
    case 'all-in':
      if (player.chips <= 0) {
        return { success: false, message: 'No chips to go all-in with' };
      }
      return { success: true };
      
    default:
      return { success: false, message: 'Invalid action' };
  }
}

/**
 * Execute a player action and update game state
 * Returns a new state (immutable)
 */
export function executeAction(
  state: GameState,
  playerId: string,
  action: PlayerAction,
  raiseAmount?: number
): GameState {
  const validation = validateAction(state, playerId, action, raiseAmount);
  if (!validation.success) {
    throw new Error(validation.message);
  }
  
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const playerIndex = newState.players.findIndex(p => p.id === playerId);
  const player = newState.players[playerIndex];
  
  switch (action) {
    case 'fold':
      player.hasFolded = true;
      break;
      
    case 'check':
      // No action needed
      break;
      
    case 'call': {
      const callAmount = calculateCallAmount(player, newState.currentBet);
      player.chips -= callAmount;
      player.currentBet += callAmount;
      player.totalBetThisRound += callAmount;
      if (player.chips === 0) {
        player.isAllIn = true;
      }
      break;
    }
      
    case 'raise': {
      const totalBet = raiseAmount!;
      const additionalChips = totalBet - player.currentBet;
      player.chips -= additionalChips;
      player.totalBetThisRound += additionalChips;
      player.currentBet = totalBet;
      newState.currentBet = totalBet;
      newState.minimumBet = totalBet + (totalBet - state.currentBet);
      if (player.chips === 0) {
        player.isAllIn = true;
      }
      break;
    }
      
    case 'all-in': {
      const allInAmount = player.chips;
      player.totalBetThisRound += allInAmount;
      player.currentBet += allInAmount;
      player.chips = 0;
      player.isAllIn = true;
      if (player.currentBet > newState.currentBet) {
        newState.currentBet = player.currentBet;
      }
      break;
    }
  }
  
  newState.lastAction = { playerId, action, amount: player.currentBet };
  
  return newState;
}

/**
 * Move to the next active player
 */
export function nextPlayer(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const activePlayers = newState.players.filter(p => !p.hasFolded && !p.isAllIn);
  
  if (activePlayers.length === 0) {
    return newState;
  }
  
  let nextIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
  let attempts = 0;
  
  while (attempts < newState.players.length) {
    const player = newState.players[nextIndex];
    if (!player.hasFolded && !player.isAllIn) {
      newState.currentPlayerIndex = nextIndex;
      return newState;
    }
    nextIndex = (nextIndex + 1) % newState.players.length;
    attempts++;
  }
  
  return newState;
}

/**
 * Check if betting round is complete
 */
export function isBettingRoundComplete(state: GameState): boolean {
  const activePlayers = state.players.filter(p => !p.hasFolded);
  
  // Only one player left - they win
  if (activePlayers.length === 1) {
    return true;
  }
  
  const playersWhoCanAct = activePlayers.filter(p => !p.isAllIn);
  
  // Everyone is all-in or folded
  if (playersWhoCanAct.length === 0) {
    return true;
  }
  
  // Only one player can act (others all-in)
  if (playersWhoCanAct.length === 1 && playersWhoCanAct[0].currentBet >= state.currentBet) {
    return true;
  }
  
  // Check if all active players have matched the current bet
  for (const player of playersWhoCanAct) {
    if (player.currentBet < state.currentBet) {
      return false;
    }
  }
  
  // Check if we've gone around at least once (everyone has acted)
  // This is implicit if everyone has matched
  return true;
}

/**
 * Calculate side pots for all-in situations
 */
export function calculatePots(state: GameState): Pot[] {
  const activePlayers = state.players.filter(p => !p.hasFolded);
  
  if (activePlayers.length === 0) {
    return [{ amount: 0, eligiblePlayers: [] }];
  }
  
  // Get all unique bet amounts
  const betAmounts = [...new Set(activePlayers.map(p => p.totalBetThisRound))].sort((a, b) => a - b);
  
  const pots: Pot[] = [];
  let previousLevel = 0;
  
  for (const betLevel of betAmounts) {
    if (betLevel === previousLevel) continue;
    
    const levelDiff = betLevel - previousLevel;
    const eligiblePlayers = activePlayers
      .filter(p => p.totalBetThisRound >= betLevel)
      .map(p => p.id);
    
    // Count how many players contributed at this level
    const contributors = state.players.filter(p => 
      p.totalBetThisRound > previousLevel
    );
    
    const potAmount = contributors.reduce((sum, p) => {
      const contribution = Math.min(p.totalBetThisRound - previousLevel, levelDiff);
      return sum + contribution;
    }, 0);
    
    if (potAmount > 0) {
      pots.push({
        amount: potAmount,
        eligiblePlayers,
      });
    }
    
    previousLevel = betLevel;
  }
  
  // Merge pots with same eligible players
  const mergedPots: Pot[] = [];
  for (const pot of pots) {
    const existing = mergedPots.find(p => 
      p.eligiblePlayers.length === pot.eligiblePlayers.length &&
      p.eligiblePlayers.every(id => pot.eligiblePlayers.includes(id))
    );
    if (existing) {
      existing.amount += pot.amount;
    } else {
      mergedPots.push(pot);
    }
  }
  
  return mergedPots.length > 0 ? mergedPots : [{ amount: 0, eligiblePlayers: activePlayers.map(p => p.id) }];
}

/**
 * Reset bets for new betting round
 */
export function resetBetsForNewRound(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  for (const player of newState.players) {
    player.currentBet = 0;
  }
  
  newState.currentBet = 0;
  newState.minimumBet = newState.bigBlind;
  
  // Start with first active player after dealer
  let startIndex = (newState.dealerIndex + 1) % newState.players.length;
  while (newState.players[startIndex].hasFolded || newState.players[startIndex].isAllIn) {
    startIndex = (startIndex + 1) % newState.players.length;
    if (startIndex === newState.dealerIndex) break;
  }
  newState.currentPlayerIndex = startIndex;
  
  return newState;
}

/**
 * Get available actions for current player
 */
export function getAvailableActions(state: GameState): { action: PlayerAction; minAmount?: number; maxAmount?: number }[] {
  const player = state.players[state.currentPlayerIndex];
  
  if (!player || player.hasFolded || player.isAllIn) {
    return [];
  }
  
  const actions: { action: PlayerAction; minAmount?: number; maxAmount?: number }[] = [];
  
  // Can always fold
  actions.push({ action: 'fold' });
  
  const callAmount = calculateCallAmount(player, state.currentBet);
  
  if (callAmount === 0) {
    // Can check when nothing to call
    actions.push({ action: 'check' });
  } else {
    // Must call or fold
    actions.push({ action: 'call', minAmount: callAmount, maxAmount: callAmount });
  }
  
  // Can raise if have enough chips
  const minRaise = state.currentBet + state.bigBlind;
  if (player.chips > callAmount) {
    actions.push({
      action: 'raise',
      minAmount: Math.min(minRaise, player.chips + player.currentBet),
      maxAmount: player.chips + player.currentBet,
    });
  }
  
  // Can always go all-in
  if (player.chips > 0) {
    actions.push({ action: 'all-in', minAmount: player.chips, maxAmount: player.chips });
  }
  
  return actions;
}

/**
 * Get total pot amount
 */
export function getTotalPot(state: GameState): number {
  // Sum of all pots plus current round bets
  const potsTotal = state.pots.reduce((sum, pot) => sum + pot.amount, 0);
  const currentBets = state.players.reduce((sum, p) => sum + p.currentBet, 0);
  return potsTotal + currentBets;
}
