import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Card, CardType, isJobCard, isEventCard } from '../models/card.model';
import {
  GameState,
  PlayerState,
  CardInstance,
  CardZone,
  GamePhase,
  CombatState,
  CardModifier,
  GameLogEntry,
  AttackDeclaration,
  BlockAssignment,
  STARTING_REPUTATION,
  STARTING_HAND_SIZE,
  STARTING_BUDGET,
  KEYWORD_PATTERNS,
} from '../models/game.model';
import { EffectTrigger } from '../models/effect.model';
import { CardService } from './card.service';
import { DeckService } from './deck.service';
import { EffectService } from './effect.service';
import { SoundService, SoundEffect } from './sound.service';
import { StatsService } from './stats.service';
import { CollectionService } from './collection.service';
import { UnlockNotificationService } from './unlock-notification.service';
import { MultiplayerService, GameAction, MessageType } from './multiplayer.service';
import { CurrencyService } from './currency.service';
import { QuestService } from './quest.service';
import { QuestType } from '../models/quest.model';
import { RankedService } from './ranked.service';
import { BattlePassService } from './battle-pass.service';

@Injectable({ providedIn: 'root' })
export class GameService {
  private stateSubject = new BehaviorSubject<GameState | null>(null);
  gameState$ = this.stateSubject.asObservable();

  // Online multiplayer
  private isOnlineGame = false;
  private localPlayerId: string | null = null;
  private multiplayerSubscription: Subscription | null = null;

  constructor(
    private cardService: CardService,
    private deckService: DeckService,
    private effectService: EffectService,
    private soundService: SoundService,
    private statsService: StatsService,
    private collectionService: CollectionService,
    private unlockNotificationService: UnlockNotificationService,
    private multiplayerService: MultiplayerService,
    private currencyService: CurrencyService,
    private questService: QuestService,
    private rankedService: RankedService,
    private battlePassService: BattlePassService,
  ) {
    // Subscribe to multiplayer messages
    this.multiplayerSubscription = this.multiplayerService.messages$.subscribe(message => {
      this.handleMultiplayerMessage(message);
    });
  }

  get state(): GameState | null {
    return this.stateSubject.value;
  }

  // --- Game Setup ---

  startGame(p1Name: string, p1DeckId: string, p2Name: string, p2DeckId: string): void {
    const p1Id = 'player1';
    const p2Id = 'player2';

    const p1Cards = this.expandDeckToInstances(p1DeckId, p1Id);
    const p2Cards = this.expandDeckToInstances(p2DeckId, p2Id);

    this.shuffle(p1Cards);
    this.shuffle(p2Cards);

    const p1Hand = p1Cards.splice(0, STARTING_HAND_SIZE);
    p1Hand.forEach(c => c.zone = CardZone.Hand);
    const p2Hand = p2Cards.splice(0, STARTING_HAND_SIZE);
    p2Hand.forEach(c => c.zone = CardZone.Hand);

    const player1: PlayerState = {
      id: p1Id,
      name: p1Name,
      reputation: STARTING_REPUTATION,
      budgetMax: STARTING_BUDGET,
      budgetRemaining: STARTING_BUDGET,
      deck: p1Cards,
      hand: p1Hand,
      field: [],
      graveyard: [],
      deckId: p1DeckId,
      mulliganUsed: false,
    };

    const player2: PlayerState = {
      id: p2Id,
      name: p2Name,
      reputation: STARTING_REPUTATION,
      budgetMax: STARTING_BUDGET,
      budgetRemaining: STARTING_BUDGET,
      deck: p2Cards,
      hand: p2Hand,
      field: [],
      graveyard: [],
      deckId: p2DeckId,
      mulliganUsed: false,
    };

    const firstPlayer = Math.random() < 0.5 ? p1Id : p2Id;

    const gameState: GameState = {
      gameId: crypto.randomUUID(),
      player1,
      player2,
      activePlayerId: firstPlayer,
      turnNumber: 1,
      phase: GamePhase.Mulligan,
      combat: null,
      pendingEffect: null,
      winner: null,
      log: [],
      isAiGame: false,
      isRankedGame: false,
    };

    this.stateSubject.next(gameState);
    this.statsService.startGame(gameState.gameId);
    const firstName = firstPlayer === p1Id ? p1Name : p2Name;
    this.addLog(`La partie commence ! ${firstName} joue en premier.`);
    this.addLog(`Phase de Mulligan — chaque joueur peut remplacer des cartes.`);
    this.soundService.play(SoundEffect.PhaseChange);
    this.emit();
  }

  startQuickGame(p1Name: string, p2Name: string): void {
    const allCards = this.cardService.getAllCards();
    const p1Id = 'player1';
    const p2Id = 'player2';

    const p1Cards = this.buildRandomDeck(allCards, p1Id);
    const p2Cards = this.buildRandomDeck(allCards, p2Id);

    this.shuffle(p1Cards);
    this.shuffle(p2Cards);

    const p1Hand = p1Cards.splice(0, STARTING_HAND_SIZE);
    p1Hand.forEach(c => c.zone = CardZone.Hand);
    const p2Hand = p2Cards.splice(0, STARTING_HAND_SIZE);
    p2Hand.forEach(c => c.zone = CardZone.Hand);

    const player1: PlayerState = {
      id: p1Id,
      name: p1Name,
      reputation: STARTING_REPUTATION,
      budgetMax: STARTING_BUDGET,
      budgetRemaining: STARTING_BUDGET,
      deck: p1Cards,
      hand: p1Hand,
      field: [],
      graveyard: [],
      deckId: 'quick',
      mulliganUsed: false,
    };

    const player2: PlayerState = {
      id: p2Id,
      name: p2Name,
      reputation: STARTING_REPUTATION,
      budgetMax: STARTING_BUDGET,
      budgetRemaining: STARTING_BUDGET,
      deck: p2Cards,
      hand: p2Hand,
      field: [],
      graveyard: [],
      deckId: 'quick',
      mulliganUsed: false,
    };

    const firstPlayer = Math.random() < 0.5 ? p1Id : p2Id;

    const gameState: GameState = {
      gameId: crypto.randomUUID(),
      player1,
      player2,
      activePlayerId: firstPlayer,
      turnNumber: 1,
      phase: GamePhase.Mulligan,
      combat: null,
      pendingEffect: null,
      winner: null,
      log: [],
      isAiGame: false,
      isRankedGame: false,
    };

    this.stateSubject.next(gameState);
    this.statsService.startGame(gameState.gameId);
    const firstName = firstPlayer === p1Id ? p1Name : p2Name;
    this.addLog(`Partie rapide ! ${firstName} joue en premier.`);
    this.addLog(`Phase de Mulligan — chaque joueur peut remplacer des cartes.`);
    this.soundService.play(SoundEffect.PhaseChange);
    this.emit();
  }

  // --- Online Multiplayer ---

  startOnlineGame(onlineGameInfo: any): void {
    this.isOnlineGame = true;
    this.localPlayerId = onlineGameInfo.yourPlayerId;

    const { player1, player2 } = onlineGameInfo;

    // Determine which player is local
    const isPlayer1 = this.localPlayerId === player1.id;
    const localDeckId = isPlayer1 ? player1.deckId : player2.deckId;
    const remoteDeckId = isPlayer1 ? player2.deckId : player1.deckId;

    // Expand decks
    const p1Cards = this.expandDeckToInstances(player1.deckId, player1.id);
    const p2Cards = this.expandDeckToInstances(player2.deckId, player2.id);

    this.shuffle(p1Cards);
    this.shuffle(p2Cards);

    const p1Hand = p1Cards.splice(0, STARTING_HAND_SIZE);
    p1Hand.forEach(c => c.zone = CardZone.Hand);
    const p2Hand = p2Cards.splice(0, STARTING_HAND_SIZE);
    p2Hand.forEach(c => c.zone = CardZone.Hand);

    const player1State: PlayerState = {
      id: player1.id,
      name: player1.name,
      reputation: STARTING_REPUTATION,
      budgetMax: STARTING_BUDGET,
      budgetRemaining: STARTING_BUDGET,
      deck: p1Cards,
      hand: p1Hand,
      field: [],
      graveyard: [],
      deckId: player1.deckId,
      mulliganUsed: false,
    };

    const player2State: PlayerState = {
      id: player2.id,
      name: player2.name,
      reputation: STARTING_REPUTATION,
      budgetMax: STARTING_BUDGET,
      budgetRemaining: STARTING_BUDGET,
      deck: p2Cards,
      hand: p2Hand,
      field: [],
      graveyard: [],
      deckId: player2.deckId,
      mulliganUsed: false,
    };

    // Randomly determine first player (both clients will use same seed or server determines)
    const firstPlayer = player1.id;

    const gameState: GameState = {
      gameId: crypto.randomUUID(),
      player1: player1State,
      player2: player2State,
      activePlayerId: firstPlayer,
      turnNumber: 1,
      phase: GamePhase.Mulligan,
      combat: null,
      pendingEffect: null,
      winner: null,
      log: [],
      isAiGame: false,
      isRankedGame: false,
    };

    this.stateSubject.next(gameState);
    this.statsService.startGame(gameState.gameId);
    const firstName = firstPlayer === player1.id ? player1.name : player2.name;
    this.addLog(`Partie en ligne ! ${firstName} joue en premier.`);
    this.addLog(`Phase de Mulligan — chaque joueur peut remplacer des cartes.`);
    this.soundService.play(SoundEffect.PhaseChange);
    this.emit();
  }

  private handleMultiplayerMessage(message: any): void {
    if (!this.isOnlineGame) return;

    switch (message.type) {
      case MessageType.GAME_ACTION:
        this.applyOpponentAction(message.action);
        break;
      case MessageType.PLAYER_LEFT:
        // Opponent disconnected
        this.addLog('Votre adversaire s\'est déconnecté.');
        break;
    }
  }

  private applyOpponentAction(action: GameAction): void {
    // Apply opponent's action locally
    console.log('Applying opponent action:', action);

    switch (action.type) {
      case 'play_card':
        this.playCard(action.data.instanceId);
        break;
      case 'attack':
        this.declareAttacker(action.data.instanceId);
        break;
      case 'declare_blocker':
        this.assignBlocker(action.data.blockerInstanceId, action.data.attackerInstanceId);
        break;
      case 'end_turn':
        this.endTurn();
        break;
      case 'mulligan':
        this.mulligan(action.playerId, action.data.cardInstanceIds);
        break;
      case 'keep_hand':
        this.mulligan(action.playerId, []);
        break;
    }
  }

  private sendAction(actionType: string, data?: any): void {
    if (!this.isOnlineGame || !this.localPlayerId) return;

    const action: GameAction = {
      type: actionType as any,
      playerId: this.localPlayerId,
      data,
    };

    this.multiplayerService.sendGameAction(action);
  }

  private isLocalPlayer(playerId: string): boolean {
    return !this.isOnlineGame || playerId === this.localPlayerId;
  }

  startAiGame(p1Name: string, p1DeckId: string, aiDeckId: string): void {
    const p1Id = 'player1';
    const p2Id = 'player2';

    const p1Cards = this.expandDeckToInstances(p1DeckId, p1Id);
    const p2Cards = this.expandDeckToInstances(aiDeckId, p2Id);

    this.shuffle(p1Cards);
    this.shuffle(p2Cards);

    const p1Hand = p1Cards.splice(0, STARTING_HAND_SIZE);
    p1Hand.forEach(c => c.zone = CardZone.Hand);
    const p2Hand = p2Cards.splice(0, STARTING_HAND_SIZE);
    p2Hand.forEach(c => c.zone = CardZone.Hand);

    const player1: PlayerState = {
      id: p1Id,
      name: p1Name,
      reputation: STARTING_REPUTATION,
      budgetMax: STARTING_BUDGET,
      budgetRemaining: STARTING_BUDGET,
      deck: p1Cards,
      hand: p1Hand,
      field: [],
      graveyard: [],
      deckId: p1DeckId,
      mulliganUsed: false,
    };

    const player2: PlayerState = {
      id: p2Id,
      name: 'IA',
      reputation: STARTING_REPUTATION,
      budgetMax: STARTING_BUDGET,
      budgetRemaining: STARTING_BUDGET,
      deck: p2Cards,
      hand: p2Hand,
      field: [],
      graveyard: [],
      deckId: aiDeckId,
      mulliganUsed: false,
    };

    const gameState: GameState = {
      gameId: crypto.randomUUID(),
      player1,
      player2,
      activePlayerId: p1Id,
      turnNumber: 1,
      phase: GamePhase.Mulligan,
      combat: null,
      pendingEffect: null,
      winner: null,
      log: [],
      isAiGame: true,
      isRankedGame: false,
    };

    this.stateSubject.next(gameState);
    this.statsService.startGame(gameState.gameId);
    this.addLog(`Partie contre l'IA ! ${p1Name} joue en premier.`);
    this.addLog(`Phase de Mulligan — choisissez vos cartes à remplacer.`);
    this.soundService.play(SoundEffect.PhaseChange);
    this.emit();
  }

  startQuickAiGame(p1Name: string): void {
    const allCards = this.cardService.getAllCards();
    const p1Id = 'player1';
    const p2Id = 'player2';

    const p1Cards = this.buildRandomDeck(allCards, p1Id);
    const p2Cards = this.buildRandomDeck(allCards, p2Id);

    this.shuffle(p1Cards);
    this.shuffle(p2Cards);

    const p1Hand = p1Cards.splice(0, STARTING_HAND_SIZE);
    p1Hand.forEach(c => c.zone = CardZone.Hand);
    const p2Hand = p2Cards.splice(0, STARTING_HAND_SIZE);
    p2Hand.forEach(c => c.zone = CardZone.Hand);

    const player1: PlayerState = {
      id: p1Id,
      name: p1Name,
      reputation: STARTING_REPUTATION,
      budgetMax: STARTING_BUDGET,
      budgetRemaining: STARTING_BUDGET,
      deck: p1Cards,
      hand: p1Hand,
      field: [],
      graveyard: [],
      deckId: 'quick',
      mulliganUsed: false,
    };

    const player2: PlayerState = {
      id: p2Id,
      name: 'IA',
      reputation: STARTING_REPUTATION,
      budgetMax: STARTING_BUDGET,
      budgetRemaining: STARTING_BUDGET,
      deck: p2Cards,
      hand: p2Hand,
      field: [],
      graveyard: [],
      deckId: 'quick',
      mulliganUsed: false,
    };

    const gameState: GameState = {
      gameId: crypto.randomUUID(),
      player1,
      player2,
      activePlayerId: p1Id,
      turnNumber: 1,
      phase: GamePhase.Mulligan,
      combat: null,
      pendingEffect: null,
      winner: null,
      log: [],
      isAiGame: true,
      isRankedGame: false,
    };

    this.stateSubject.next(gameState);
    this.statsService.startGame(gameState.gameId);
    this.addLog(`Partie rapide contre l'IA ! ${p1Name} joue en premier.`);
    this.addLog(`Phase de Mulligan — choisissez vos cartes à remplacer.`);
    this.soundService.play(SoundEffect.PhaseChange);
    this.emit();
  }

  // --- Phase Management ---

  // --- Mulligan ---

  mulligan(playerId: string, cardInstanceIds: string[]): void {
    const state = this.state;
    if (!state || state.phase !== GamePhase.Mulligan) return;

    const player = this.getPlayer(playerId);
    if (!player || player.mulliganUsed) return;

    // Send action to server if online and local player
    if (this.isLocalPlayer(playerId)) {
      this.sendAction(cardInstanceIds.length > 0 ? 'mulligan' : 'keep_hand', { cardInstanceIds });
    }

    if (cardInstanceIds.length > 0) {
      // Return selected cards to deck
      for (const id of cardInstanceIds) {
        const idx = player.hand.findIndex(c => c.instanceId === id);
        if (idx >= 0) {
          const card = player.hand.splice(idx, 1)[0];
          card.zone = CardZone.Deck;
          player.deck.push(card);
        }
      }

      // Shuffle deck
      this.shuffle(player.deck);
      this.soundService.play(SoundEffect.Shuffle);

      // Draw same count
      this.drawCards(player, cardInstanceIds.length);
      this.addLog(`${player.name} remplace ${cardInstanceIds.length} carte(s).`);
    } else {
      this.addLog(`${player.name} garde sa main.`);
    }

    player.mulliganUsed = true;
    this.checkMulliganComplete();
  }

  private checkMulliganComplete(): void {
    const state = this.state;
    if (!state) return;

    if (state.player1.mulliganUsed && state.player2.mulliganUsed) {
      // Track when game actually starts (after mulligan)
      state.gameStartTime = Date.now();
      state.phase = GamePhase.Budget;
      this.addLog(`Phase : ${GamePhase.Budget}`);
      this.soundService.play(SoundEffect.PhaseChange);
      this.executeBudgetPhase();
    } else {
      this.emit();
    }
  }

  advancePhase(): void {
    const state = this.state;
    if (!state || state.winner) return;

    // Guard: don't advance during Mulligan
    if (state.phase === GamePhase.Mulligan) return;

    const phases = Object.values(GamePhase);
    const currentIdx = phases.indexOf(state.phase);

    if (state.phase === GamePhase.End) {
      this.endTurn();
      return;
    }

    const nextPhase = phases[currentIdx + 1];
    state.phase = nextPhase;
    this.addLog(`Phase : ${nextPhase}`);
    this.soundService.play(SoundEffect.PhaseChange);

    switch (nextPhase) {
      case GamePhase.Draw:
        this.executeDrawPhase();
        break;
      case GamePhase.Work_Attack:
        this.initCombat();
        break;
      case GamePhase.Work_Block:
        // Handled by combat overlay
        break;
      case GamePhase.Work_Damage:
        // Handled by combat overlay
        break;
    }

    this.emit();
  }

  skipToEnd(): void {
    const state = this.state;
    if (!state || state.winner) return;
    state.phase = GamePhase.End;
    this.addLog(`Phase : ${GamePhase.End}`);
    this.soundService.play(SoundEffect.PhaseChange);
    this.emit();
  }

  // --- Budget Phase ---

  private executeBudgetPhase(): void {
    const state = this.state;
    if (!state) return;

    const player = this.getActivePlayer();
    if (state.turnNumber > 1 || player.id !== state.activePlayerId) {
      player.budgetMax = Math.min(player.budgetMax + 1, 10);
    }
    player.budgetRemaining = player.budgetMax;

    this.addLog(`${player.name} a ${player.budgetMax} budget disponible.`);

    // Trigger OnTurnStart for active player's field cards
    for (const card of player.field) {
      this.effectService.executeAutoEffects(
        card, EffectTrigger.OnTurnStart, state,
        (msg: string) => this.addLog(msg),
        (p: PlayerState, n: number) => this.drawCards(p, n),
        (id: string) => this.destroyCard(id),
      );
    }

    this.emit();
  }

  // --- Draw Phase ---

  private executeDrawPhase(): void {
    const state = this.state;
    if (!state) return;

    // Skip draw on very first turn of the game for first player
    if (state.turnNumber === 1) {
      this.addLog(`Premier tour — pas de pioche.`);
      return;
    }

    const player = this.getActivePlayer();
    this.drawCards(player, 1);
  }

  // --- Hiring Phase ---

  canPlayCard(instanceId: string): boolean {
    const state = this.state;
    if (!state || state.phase !== GamePhase.Hiring) return false;

    const player = this.getActivePlayer();
    const card = player.hand.find(c => c.instanceId === instanceId);
    if (!card) return false;

    return card.card.cost <= player.budgetRemaining;
  }

  playCard(instanceId: string): void {
    const state = this.state;
    if (!state || state.phase !== GamePhase.Hiring) return;

    const player = this.getActivePlayer();
    const cardIdx = player.hand.findIndex(c => c.instanceId === instanceId);
    if (cardIdx === -1) return;

    const cardInstance = player.hand[cardIdx];
    if (cardInstance.card.cost > player.budgetRemaining) return;

    // Send action to server if online and local player
    if (this.isLocalPlayer(player.id)) {
      this.sendAction('play_card', { instanceId });
    }

    player.budgetRemaining -= cardInstance.card.cost;
    player.hand.splice(cardIdx, 1);

    if (isEventCard(cardInstance.card)) {
      cardInstance.zone = CardZone.Graveyard;
      player.graveyard.push(cardInstance);
      this.addLog(`${player.name} joue l'événement ${cardInstance.card.name} (coût: ${cardInstance.card.cost}).`);
      this.soundService.play(SoundEffect.CardPlay);
    } else {
      cardInstance.zone = CardZone.Field;
      cardInstance.summonedThisTurn = true;
      player.field.push(cardInstance);
      this.addLog(`${player.name} embauche ${cardInstance.card.name} (coût: ${cardInstance.card.cost}).`);
      this.soundService.play(SoundEffect.CardPlay);
    }

    // Track quest progress for player1
    if (player.id === state.player1.id) {
      this.questService.updateQuestProgress(QuestType.PlayCards, 1);
    }

    // Trigger effects
    const trigger = isEventCard(cardInstance.card) ? EffectTrigger.OnCast : EffectTrigger.OnHire;
    const pending = this.effectService.executeAutoEffects(
      cardInstance, trigger, state,
      (msg: string) => this.addLog(msg),
      (p: PlayerState, n: number) => this.drawCards(p, n),
      (id: string) => this.destroyCard(id),
    );
    if (pending) {
      state.pendingEffect = pending;
    }

    this.checkWinCondition();
    this.emit();
  }

  // --- Combat ---

  private initCombat(): void {
    const state = this.state;
    if (!state) return;

    state.combat = {
      attackers: [],
      blockers: [],
      resolved: false,
    };
  }

  canAttack(instanceId: string): boolean {
    const state = this.state;
    if (!state || state.phase !== GamePhase.Work_Attack) return false;

    const player = this.getActivePlayer();
    const card = player.field.find(c => c.instanceId === instanceId);
    if (!card) return false;
    if (!isJobCard(card.card)) return false;
    if (card.tapped) return false;

    // Summoning sickness: can't attack if summoned this turn (unless Célérité)
    if (card.summonedThisTurn && !this.hasKeyword(card, 'Célérité')) return false;

    return true;
  }

  declareAttacker(instanceId: string): void {
    const state = this.state;
    if (!state?.combat || state.phase !== GamePhase.Work_Attack) return;

    if (!this.canAttack(instanceId)) return;

    // Send action to server if online and local player
    const player = this.getActivePlayer();
    if (this.isLocalPlayer(player.id)) {
      this.sendAction('attack', { instanceId });
    }

    const existing = state.combat.attackers.findIndex(a => a.attackerInstanceId === instanceId);
    if (existing >= 0) {
      state.combat.attackers.splice(existing, 1);
    } else {
      state.combat.attackers.push({ attackerInstanceId: instanceId });
    }

    this.emit();
  }

  confirmAttackers(): void {
    const state = this.state;
    if (!state?.combat || state.phase !== GamePhase.Work_Attack) return;

    if (state.combat.attackers.length === 0) {
      this.addLog(`${this.getActivePlayer().name} ne déclare aucun attaquant.`);
      state.combat = null;
      state.phase = GamePhase.End;
      this.addLog(`Phase : ${GamePhase.End}`);
      this.emit();
      return;
    }

    // Tap all attackers
    for (const atk of state.combat.attackers) {
      const card = this.findCardInstance(atk.attackerInstanceId);
      if (card) card.tapped = true;
    }

    const names = state.combat.attackers.map(a => {
      const c = this.findCardInstance(a.attackerInstanceId);
      return c?.card.name ?? '?';
    }).join(', ');
    this.addLog(`${this.getActivePlayer().name} attaque avec : ${names}`);
    this.soundService.play(SoundEffect.Combat);

    state.phase = GamePhase.Work_Block;
    this.addLog(`Phase : ${GamePhase.Work_Block}`);
    this.soundService.play(SoundEffect.PhaseChange);
    this.emit();
  }

  canBlock(blockerInstanceId: string): boolean {
    const state = this.state;
    if (!state?.combat || state.phase !== GamePhase.Work_Block) return false;

    const defender = this.getInactivePlayer();
    const card = defender.field.find(c => c.instanceId === blockerInstanceId);
    if (!card) return false;
    if (!isJobCard(card.card)) return false;
    if (card.tapped) return false;

    return true;
  }

  assignBlocker(blockerInstanceId: string, attackerInstanceId: string): void {
    const state = this.state;
    if (!state?.combat || state.phase !== GamePhase.Work_Block) return;

    if (!this.canBlock(blockerInstanceId)) return;

    // Check attacker is valid and has no Portée
    const attacker = this.findCardInstance(attackerInstanceId);
    if (!attacker || !state.combat.attackers.find(a => a.attackerInstanceId === attackerInstanceId)) return;

    // Portée: can't be blocked
    if (this.hasKeyword(attacker, 'Portée')) return;

    // Send action to server if online and local player
    const defender = this.getInactivePlayer();
    if (this.isLocalPlayer(defender.id)) {
      this.sendAction('declare_blocker', { blockerInstanceId, attackerInstanceId });
    }

    // Remove existing assignment for this blocker
    state.combat.blockers = state.combat.blockers.filter(b => b.blockerInstanceId !== blockerInstanceId);

    state.combat.blockers.push({ blockerInstanceId, attackerInstanceId });
    this.emit();
  }

  removeBlocker(blockerInstanceId: string): void {
    const state = this.state;
    if (!state?.combat || state.phase !== GamePhase.Work_Block) return;

    state.combat.blockers = state.combat.blockers.filter(b => b.blockerInstanceId !== blockerInstanceId);
    this.emit();
  }

  confirmBlockers(): void {
    const state = this.state;
    if (!state?.combat || state.phase !== GamePhase.Work_Block) return;

    if (state.combat.blockers.length > 0) {
      const names = state.combat.blockers.map(b => {
        const blocker = this.findCardInstance(b.blockerInstanceId);
        const attacker = this.findCardInstance(b.attackerInstanceId);
        return `${blocker?.card.name ?? '?'} bloque ${attacker?.card.name ?? '?'}`;
      }).join(', ');
      this.addLog(`${this.getInactivePlayer().name} bloque : ${names}`);
    } else {
      this.addLog(`${this.getInactivePlayer().name} ne bloque pas.`);
    }

    state.phase = GamePhase.Work_Damage;
    this.addLog(`Phase : ${GamePhase.Work_Damage}`);
    this.soundService.play(SoundEffect.PhaseChange);
    this.emit();
  }

  resolveCombat(): void {
    const state = this.state;
    if (!state?.combat || state.phase !== GamePhase.Work_Damage) return;

    const defender = this.getInactivePlayer();
    const destroyed: CardInstance[] = [];

    for (const atk of state.combat.attackers) {
      const attacker = this.findCardInstance(atk.attackerInstanceId);
      if (!attacker || !isJobCard(attacker.card)) continue;

      const blockerAssignments = state.combat.blockers.filter(b => b.attackerInstanceId === atk.attackerInstanceId);

      if (blockerAssignments.length === 0) {
        // Unblocked — deal damage to reputation
        const damage = this.getEffectiveProductivity(attacker);
        defender.reputation -= damage;
        this.addLog(`${attacker.card.name} inflige ${damage} dégâts à ${defender.name}.`);
        this.soundService.play(SoundEffect.Damage);
        // Track quest progress for player1
        if (attacker.ownerId === state.player1.id) {
          this.questService.updateQuestProgress(QuestType.DealDamage, damage);
        }
      } else {
        // Blocked — combat between cards
        const hasFirstStrike = this.hasKeyword(attacker, 'Première Frappe');

        for (const ba of blockerAssignments) {
          const blocker = this.findCardInstance(ba.blockerInstanceId);
          if (!blocker || !isJobCard(blocker.card)) continue;

          const atkProd = this.getEffectiveProductivity(attacker);
          const atkRes = this.getEffectiveResilience(attacker);
          const blkProd = this.getEffectiveProductivity(blocker);
          const blkRes = this.getEffectiveResilience(blocker);

          const blockerHasFirstStrike = this.hasKeyword(blocker, 'Première Frappe');

          // First strike resolution
          if (hasFirstStrike && !blockerHasFirstStrike) {
            // Attacker hits first
            if (atkProd >= blkRes) {
              destroyed.push(blocker);
              this.addLog(`${attacker.card.name} détruit ${blocker.card.name} (Première Frappe).`);
              continue; // Blocker destroyed before dealing damage
            }
          }
          if (blockerHasFirstStrike && !hasFirstStrike) {
            if (blkProd >= atkRes) {
              destroyed.push(attacker);
              this.addLog(`${blocker.card.name} détruit ${attacker.card.name} (Première Frappe).`);
              continue;
            }
          }

          // Simultaneous damage
          attacker.damageThisTurn += blkProd;
          blocker.damageThisTurn += atkProd;

          if (atkProd >= blkRes) {
            destroyed.push(blocker);
            this.addLog(`${attacker.card.name} détruit ${blocker.card.name}.`);
            this.soundService.play(SoundEffect.CardDestroy);
          }
          if (blkProd >= atkRes) {
            destroyed.push(attacker);
            this.addLog(`${blocker.card.name} détruit ${attacker.card.name}.`);
            this.soundService.play(SoundEffect.CardDestroy);
          }
        }
      }
    }

    // Move destroyed cards to graveyard and trigger OnDestroy
    const destroyedIds = new Set(destroyed.map(c => c.instanceId));
    for (const id of destroyedIds) {
      const card = this.findCardInstance(id);
      if (card) {
        this.effectService.executeAutoEffects(
          card, EffectTrigger.OnDestroy, state,
          (msg: string) => this.addLog(msg),
          (p: PlayerState, n: number) => this.drawCards(p, n),
          (cid: string) => this.destroyCard(cid),
        );
      }
      this.destroyCard(id);
    }

    state.combat.resolved = true;
    state.combat = null;
    state.phase = GamePhase.End;
    this.addLog(`Phase : ${GamePhase.End}`);
    this.soundService.play(SoundEffect.PhaseChange);

    this.checkWinCondition();
    this.emit();
  }

  // --- End Turn ---

  endTurn(): void {
    const state = this.state;
    if (!state || state.winner) return;

    const player = this.getActivePlayer();

    // Send action if this is local player in online game
    if (this.isLocalPlayer(player.id)) {
      this.sendAction('end_turn');
    }

    // Trigger OnTurnEnd for active player's field cards
    for (const card of player.field) {
      this.effectService.executeAutoEffects(
        card, EffectTrigger.OnTurnEnd, state,
        (msg: string) => this.addLog(msg),
        (p: PlayerState, n: number) => this.drawCards(p, n),
        (id: string) => this.destroyCard(id),
      );
    }

    // Clear temporary modifiers
    for (const card of player.field) {
      card.modifiers = card.modifiers.filter(m => m.permanent);
      card.damageThisTurn = 0;
      card.summonedThisTurn = false;
      card.tapped = false;

      // Construction: +1/+1 at end of each turn
      if (this.hasKeyword(card, 'Construction')) {
        card.constructionBonuses++;
        this.addLog(`${card.card.name} gagne +1/+1 (Construction, total: +${card.constructionBonuses}/+${card.constructionBonuses}).`);
      }
    }

    // Also untap opponent's cards and clear their temp state
    const opponent = this.getInactivePlayer();
    for (const card of opponent.field) {
      card.modifiers = card.modifiers.filter(m => m.permanent);
      card.damageThisTurn = 0;
    }

    // Switch active player
    state.activePlayerId = state.activePlayerId === state.player1.id ? state.player2.id : state.player1.id;
    state.turnNumber++;
    state.phase = GamePhase.Budget;

    const newActive = this.getActivePlayer();
    this.addLog(`--- Tour ${state.turnNumber} : ${newActive.name} ---`);

    this.executeBudgetPhase();
  }

  // --- Manual Tabletop Actions ---

  adjustReputation(playerId: string, delta: number): void {
    const player = this.getPlayer(playerId);
    if (!player) return;
    player.reputation += delta;
    this.addLog(`${player.name} : réputation ${delta > 0 ? '+' : ''}${delta} (→ ${player.reputation}).`);
    this.checkWinCondition();
    this.emit();
  }

  adjustBudget(playerId: string, delta: number): void {
    const player = this.getPlayer(playerId);
    if (!player) return;
    player.budgetRemaining = Math.max(0, player.budgetRemaining + delta);
    this.addLog(`${player.name} : budget ${delta > 0 ? '+' : ''}${delta} (→ ${player.budgetRemaining}).`);
    this.emit();
  }

  moveCard(instanceId: string, toZone: CardZone): void {
    const state = this.state;
    if (!state) return;

    const { player, card, index } = this.findCardWithContext(instanceId);
    if (!player || !card || index === -1) return;

    // Remove from current zone
    this.removeFromZone(player, card.zone, index);

    // Add to new zone
    card.zone = toZone;
    if (toZone === CardZone.Field) card.summonedThisTurn = true;
    this.addToZone(player, toZone, card);

    this.addLog(`${card.card.name} déplacé vers ${toZone}.`);
    this.emit();
  }

  drawExtraCards(playerId: string, count: number): void {
    const player = this.getPlayer(playerId);
    if (!player) return;
    this.drawCards(player, count);
    this.emit();
  }

  addModifier(instanceId: string, modifier: CardModifier): void {
    const card = this.findCardInstance(instanceId);
    if (!card) return;
    card.modifiers.push(modifier);
    this.addLog(`${card.card.name} reçoit ${modifier.description}.`);
    this.emit();
  }

  toggleTapped(instanceId: string): void {
    const card = this.findCardInstance(instanceId);
    if (!card) return;
    card.tapped = !card.tapped;
    this.addLog(`${card.card.name} ${card.tapped ? 'engagé' : 'dégagé'}.`);
    this.emit();
  }

  toggleFaceDown(instanceId: string): void {
    const card = this.findCardInstance(instanceId);
    if (!card) return;
    card.faceDown = !card.faceDown;
    this.emit();
  }

  shuffleDeck(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (!player) return;
    this.shuffle(player.deck);
    this.addLog(`${player.name} mélange son deck.`);
    this.soundService.play(SoundEffect.Shuffle);
    this.emit();
  }

  destroyCardManual(instanceId: string): void {
    this.destroyCard(instanceId);
    this.soundService.play(SoundEffect.CardDestroy);
    this.emit();
  }

  resolveTargetedEffect(targetInstanceId: string): void {
    const state = this.state;
    if (!state?.pendingEffect) return;
    const next = this.effectService.resolveTargetedEffect(
      state.pendingEffect, targetInstanceId, state,
      (msg: string) => this.addLog(msg),
      (p: PlayerState, n: number) => this.drawCards(p, n),
      (id: string) => this.destroyCard(id),
    );
    state.pendingEffect = next;
    this.checkWinCondition();
    this.emit();
  }

  cancelPendingEffect(): void {
    const state = this.state;
    if (!state) return;
    state.pendingEffect = null;
    this.addLog('Effet annule.');
    this.emit();
  }

  endGame(): void {
    this.stateSubject.next(null);
  }

  // --- Helpers ---

  getActivePlayer(): PlayerState {
    const state = this.state!;
    return state.activePlayerId === state.player1.id ? state.player1 : state.player2;
  }

  getInactivePlayer(): PlayerState {
    const state = this.state!;
    return state.activePlayerId === state.player1.id ? state.player2 : state.player1;
  }

  getPlayer(playerId: string): PlayerState | null {
    const state = this.state;
    if (!state) return null;
    if (state.player1.id === playerId) return state.player1;
    if (state.player2.id === playerId) return state.player2;
    return null;
  }

  getEffectiveProductivity(card: CardInstance): number {
    if (!isJobCard(card.card)) return 0;
    let base = card.card.productivity + card.constructionBonuses;
    for (const mod of card.modifiers) {
      base += mod.productivityDelta;
    }
    return Math.max(0, base);
  }

  getEffectiveResilience(card: CardInstance): number {
    if (!isJobCard(card.card)) return 0;
    let base = card.card.resilience + card.constructionBonuses;
    for (const mod of card.modifiers) {
      base += mod.resilienceDelta;
    }
    return Math.max(0, base);
  }

  hasKeyword(card: CardInstance, keyword: string): boolean {
    const pattern = KEYWORD_PATTERNS[keyword];
    if (!pattern) return false;
    const abilityText = this.getAbilityText(card);
    return pattern.test(abilityText);
  }

  isAttacking(instanceId: string): boolean {
    return !!this.state?.combat?.attackers.some(a => a.attackerInstanceId === instanceId);
  }

  isBlocking(instanceId: string): boolean {
    return !!this.state?.combat?.blockers.some(b => b.blockerInstanceId === instanceId);
  }

  getBlockTarget(blockerInstanceId: string): string | undefined {
    return this.state?.combat?.blockers.find(b => b.blockerInstanceId === blockerInstanceId)?.attackerInstanceId;
  }

  private getAbilityText(card: CardInstance): string {
    if (card.card.type === CardType.Job) return (card.card as any).ability ?? '';
    if (card.card.type === CardType.Tool) return (card.card as any).ability ?? '';
    if (card.card.type === CardType.Event) return (card.card as any).effect ?? '';
    return '';
  }

  private drawCards(player: PlayerState, count: number): void {
    for (let i = 0; i < count; i++) {
      if (player.deck.length === 0) {
        this.addLog(`${player.name} n'a plus de cartes à piocher !`);
        return;
      }
      const card = player.deck.shift()!;
      card.zone = CardZone.Hand;
      player.hand.push(card);
      this.addLog(`${player.name} pioche une carte.`);
      this.soundService.play(SoundEffect.CardDraw);
    }
  }

  private destroyCard(instanceId: string): void {
    const { player, card, index } = this.findCardWithContext(instanceId);
    if (!player || !card || index === -1) return;

    this.removeFromZone(player, card.zone, index);
    card.zone = CardZone.Graveyard;
    card.tapped = false;
    card.modifiers = [];
    card.constructionBonuses = 0;
    card.damageThisTurn = 0;
    player.graveyard.push(card);
    this.addLog(`${card.card.name} est détruit.`);
  }

  private findCardInstance(instanceId: string): CardInstance | null {
    const state = this.state;
    if (!state) return null;

    for (const player of [state.player1, state.player2]) {
      for (const zone of [player.deck, player.hand, player.field, player.graveyard]) {
        const card = zone.find(c => c.instanceId === instanceId);
        if (card) return card;
      }
    }
    return null;
  }

  private findCardWithContext(instanceId: string): { player: PlayerState | null; card: CardInstance | null; index: number } {
    const state = this.state;
    if (!state) return { player: null, card: null, index: -1 };

    for (const player of [state.player1, state.player2]) {
      const zones: { zone: CardZone; cards: CardInstance[] }[] = [
        { zone: CardZone.Deck, cards: player.deck },
        { zone: CardZone.Hand, cards: player.hand },
        { zone: CardZone.Field, cards: player.field },
        { zone: CardZone.Graveyard, cards: player.graveyard },
      ];
      for (const { cards } of zones) {
        const idx = cards.findIndex(c => c.instanceId === instanceId);
        if (idx >= 0) return { player, card: cards[idx], index: idx };
      }
    }
    return { player: null, card: null, index: -1 };
  }

  private removeFromZone(player: PlayerState, zone: CardZone, index: number): void {
    switch (zone) {
      case CardZone.Deck: player.deck.splice(index, 1); break;
      case CardZone.Hand: player.hand.splice(index, 1); break;
      case CardZone.Field: player.field.splice(index, 1); break;
      case CardZone.Graveyard: player.graveyard.splice(index, 1); break;
    }
  }

  private addToZone(player: PlayerState, zone: CardZone, card: CardInstance): void {
    switch (zone) {
      case CardZone.Deck: player.deck.push(card); break;
      case CardZone.Hand: player.hand.push(card); break;
      case CardZone.Field: player.field.push(card); break;
      case CardZone.Graveyard: player.graveyard.push(card); break;
    }
  }

  private checkWinCondition(): void {
    const state = this.state;
    if (!state) return;

    let gameEnded = false;
    let winnerId: string | null = null;

    if (state.player1.reputation <= 0) {
      state.winner = state.player2.id;
      winnerId = state.player2.id;
      this.addLog(`${state.player2.name} remporte la partie !`);
      this.statsService.recordGame(state);
      this.checkCollectionUnlocks();
      // Award currency (loss)
      this.currencyService.addCurrency('Pièces', 25, 'Partie jouée');
      // Update quest progress (loss)
      this.questService.updateQuestProgress(QuestType.GamesPlayed, 1);
      // Track ranked match (loss)
      if (state.isRankedGame && !state.isAiGame) {
        const opponentMMR = this.rankedService.getStats().currentRank.mmr; // Simplified - use player's own MMR as opponent for now
        this.rankedService.recordRankedMatch('loss', opponentMMR, state.player2.name);
      }
      // Award Battle Pass XP (loss)
      this.battlePassService.addXP(25, 'game_loss', 'Partie jouée');
      // Play defeat sound for player1, victory for player2
      this.soundService.play(SoundEffect.Defeat);
      gameEnded = true;
    } else if (state.player2.reputation <= 0) {
      state.winner = state.player1.id;
      winnerId = state.player1.id;
      this.addLog(`${state.player1.name} remporte la partie !`);
      this.statsService.recordGame(state);
      this.checkCollectionUnlocks();
      // Award currency (win)
      const baseCoins = 75;
      const rankedBonus = state.isRankedGame ? 75 : 0; // Extra coins for ranked wins
      this.currencyService.addCurrency('Pièces', baseCoins + rankedBonus, state.isRankedGame ? 'Victoire classée' : 'Victoire');
      // Update quest progress (win)
      this.questService.updateQuestProgress(QuestType.GamesPlayed, 1);
      this.questService.updateQuestProgress(QuestType.GamesWon, 1);
      // Track win with domain
      const deck = this.deckService.getDeckById(state.player1.deckId);
      if (deck?.domain) {
        this.questService.updateQuestProgress(QuestType.WinWithDomain, 1, { domain: deck.domain });
      }
      // Track ranked match (win)
      if (state.isRankedGame && !state.isAiGame) {
        const opponentMMR = this.rankedService.getStats().currentRank.mmr; // Simplified - use player's own MMR as opponent for now
        this.rankedService.recordRankedMatch('win', opponentMMR, state.player2.name);
      }
      // Award Battle Pass XP (win)
      this.battlePassService.addXP(50, 'game_win', 'Victoire');
      // Play victory sound for player1
      this.soundService.play(SoundEffect.Victory);
      gameEnded = true;
    }

    // Send GAME_END message to server for match history
    if (gameEnded && this.isOnlineGame && state.gameStartTime) {
      this.multiplayerService.sendGameEnd(winnerId, state.turnNumber, state.gameStartTime);
    }
  }

  private checkCollectionUnlocks(): void {
    const newUnlocks = this.collectionService.checkUnlocks();
    if (newUnlocks.length > 0) {
      console.log(`🎉 ${newUnlocks.length} nouvelles cartes débloquées!`, newUnlocks);
      this.unlockNotificationService.showUnlockNotifications(newUnlocks);

      const stats = this.collectionService.getCollectionStats();
      this.unlockNotificationService.showProgressNotification(stats.unlockedCards, stats.totalCards);
    }
  }

  private expandDeckToInstances(deckId: string, ownerId: string): CardInstance[] {
    const deck = this.deckService.getDeckById(deckId);
    if (!deck) return [];
    const cards = this.deckService.expandDeck(deck);
    return cards.map(card => this.createInstance(card, ownerId));
  }

  private buildRandomDeck(allCards: Card[], ownerId: string): CardInstance[] {
    const pool = [...allCards];
    const instances: CardInstance[] = [];
    // Build a 40-card random deck
    for (let i = 0; i < 40 && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      instances.push(this.createInstance(pool[idx], ownerId));
      // Allow duplicates from pool but cap at 3 of same card
      const sameCount = instances.filter(c => c.card.id === pool[idx].id).length;
      if (sameCount >= 3) {
        pool.splice(idx, 1);
      }
    }
    return instances;
  }

  private createInstance(card: Card, ownerId: string): CardInstance {
    return {
      instanceId: crypto.randomUUID(),
      card,
      zone: CardZone.Deck,
      ownerId,
      tapped: false,
      summonedThisTurn: false,
      damageThisTurn: 0,
      modifiers: [],
      faceDown: false,
      constructionBonuses: 0,
    };
  }

  private shuffle(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private addLog(message: string): void {
    const state = this.state;
    if (!state) return;

    state.log.push({
      turn: state.turnNumber,
      phase: state.phase,
      playerId: state.activePlayerId,
      message,
      timestamp: Date.now(),
    });
  }

  private emit(): void {
    // Emit a new reference so async pipe detects changes
    this.stateSubject.next(this.state ? { ...this.state } : null);
  }
}
