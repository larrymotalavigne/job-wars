/**
 * Server-side game state validator
 * Prevents cheating by validating all game actions
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface CardInstance {
  instanceId: string;
  cardId: string;
  cost: number;
  attack: number;
  defense: number;
  zone: 'deck' | 'hand' | 'field' | 'graveyard';
  ownerId: string;
  tapped?: boolean;
  summonedThisTurn?: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  reputation: number;
  budgetMax: number;
  budgetRemaining: number;
  hand: CardInstance[];
  field: CardInstance[];
  deck: CardInstance[];
  graveyard: CardInstance[];
}

export interface GameState {
  gameId: string;
  player1: PlayerState;
  player2: PlayerState;
  activePlayerId: string;
  turnNumber: number;
  phase: 'mulligan' | 'budget' | 'main' | 'combat' | 'end';
}

export class GameValidator {
  /**
   * Validate a card play action
   */
  validatePlayCard(
    gameState: GameState,
    playerId: string,
    instanceId: string
  ): ValidationResult {
    // Check if it's the player's turn
    if (gameState.activePlayerId !== playerId) {
      return { valid: false, error: 'Not your turn' };
    }

    // Check if we're in the main phase
    if (gameState.phase !== 'main') {
      return { valid: false, error: 'Can only play cards during main phase' };
    }

    const player = this.getPlayer(gameState, playerId);
    if (!player) {
      return { valid: false, error: 'Player not found' };
    }

    // Find the card in hand
    const card = player.hand.find(c => c.instanceId === instanceId);
    if (!card) {
      return { valid: false, error: 'Card not in hand' };
    }

    // Check budget
    if (card.cost > player.budgetRemaining) {
      return { valid: false, error: 'Insufficient budget' };
    }

    return { valid: true };
  }

  /**
   * Validate an attack declaration
   */
  validateAttack(
    gameState: GameState,
    playerId: string,
    attackerInstanceId: string
  ): ValidationResult {
    // Check if it's the player's turn
    if (gameState.activePlayerId !== playerId) {
      return { valid: false, error: 'Not your turn' };
    }

    // Check if we're in combat phase
    if (gameState.phase !== 'combat') {
      return { valid: false, error: 'Can only attack during combat phase' };
    }

    const player = this.getPlayer(gameState, playerId);
    if (!player) {
      return { valid: false, error: 'Player not found' };
    }

    // Find the card on field
    const attacker = player.field.find(c => c.instanceId === attackerInstanceId);
    if (!attacker) {
      return { valid: false, error: 'Card not on field' };
    }

    // Check if card is tapped
    if (attacker.tapped) {
      return { valid: false, error: 'Card is tapped' };
    }

    // Check if card was summoned this turn
    if (attacker.summonedThisTurn) {
      return { valid: false, error: 'Cannot attack on same turn as summoned' };
    }

    return { valid: true };
  }

  /**
   * Validate a blocker assignment
   */
  validateBlocker(
    gameState: GameState,
    playerId: string,
    blockerInstanceId: string,
    attackerInstanceId: string
  ): ValidationResult {
    // Blocker must be defending player (not active player)
    if (gameState.activePlayerId === playerId) {
      return { valid: false, error: 'Cannot block on your own turn' };
    }

    // Must be in combat phase
    if (gameState.phase !== 'combat') {
      return { valid: false, error: 'Can only block during combat phase' };
    }

    const defender = this.getPlayer(gameState, playerId);
    if (!defender) {
      return { valid: false, error: 'Player not found' };
    }

    // Find blocker on field
    const blocker = defender.field.find(c => c.instanceId === blockerInstanceId);
    if (!blocker) {
      return { valid: false, error: 'Blocker not on field' };
    }

    // Check if blocker is tapped
    if (blocker.tapped) {
      return { valid: false, error: 'Blocker is tapped' };
    }

    // Verify attacker exists (basic validation)
    const attacker = this.getPlayer(gameState, gameState.activePlayerId);
    const attackerCard = attacker?.field.find(c => c.instanceId === attackerInstanceId);
    if (!attackerCard) {
      return { valid: false, error: 'Attacker not found' };
    }

    return { valid: true };
  }

  /**
   * Validate end turn action
   */
  validateEndTurn(gameState: GameState, playerId: string): ValidationResult {
    if (gameState.activePlayerId !== playerId) {
      return { valid: false, error: 'Not your turn' };
    }

    return { valid: true };
  }

  /**
   * Validate mulligan action
   */
  validateMulligan(gameState: GameState, playerId: string): ValidationResult {
    if (gameState.phase !== 'mulligan') {
      return { valid: false, error: 'Not in mulligan phase' };
    }

    return { valid: true };
  }

  private getPlayer(gameState: GameState, playerId: string): PlayerState | null {
    if (gameState.player1.id === playerId) return gameState.player1;
    if (gameState.player2.id === playerId) return gameState.player2;
    return null;
  }
}
