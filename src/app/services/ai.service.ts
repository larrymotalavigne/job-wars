import { Injectable, OnDestroy } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { GameService } from './game.service';
import { EffectService } from './effect.service';
import {
  GameState,
  GamePhase,
  CardInstance,
  PlayerState,
} from '../models/game.model';
import { isJobCard } from '../models/card.model';
import { EffectType, TargetType } from '../models/effect.model';

const AI_PLAYER_ID = 'player2';
const AI_DELAY = 400;

@Injectable({ providedIn: 'root' })
export class AiService implements OnDestroy {
  private sub: Subscription | null = null;
  private acting = false;
  private paused = false;
  private active = false;

  constructor(
    private gameService: GameService,
    private effectService: EffectService,
  ) {}

  activate(): void {
    if (this.active) return;
    this.active = true;
    this.sub = this.gameService.gameState$.subscribe(state => {
      if (state && !this.acting && !this.paused) {
        this.evaluate(state);
      }
    });
  }

  deactivate(): void {
    this.active = false;
    this.sub?.unsubscribe();
    this.sub = null;
    this.acting = false;
    this.paused = false;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
    const state = this.gameService.state;
    if (state && !this.acting) {
      this.evaluate(state);
    }
  }

  ngOnDestroy(): void {
    this.deactivate();
  }

  private evaluate(state: GameState): void {
    if (!state.isAiGame || state.winner) return;

    // 1. Pending effect for AI → resolve targeting
    if (state.pendingEffect && state.pendingEffect.ownerId === AI_PLAYER_ID) {
      this.delayedAction(() => this.resolveAiTargeting(state));
      return;
    }

    // 2. AI is defender during Work_Block (human attacking) → auto-block
    if (
      state.phase === GamePhase.Work_Block &&
      state.activePlayerId !== AI_PLAYER_ID &&
      state.combat
    ) {
      this.delayedAction(() => this.autoBlock(state));
      return;
    }

    // 3. AI mulligan
    if (state.phase === GamePhase.Mulligan && !state.player2.mulliganUsed) {
      this.delayedAction(() => this.doMulligan(state));
      return;
    }

    // 4. Not AI's turn → return
    if (state.activePlayerId !== AI_PLAYER_ID) return;

    // 5. Switch on phase
    switch (state.phase) {
      case GamePhase.Budget:
      case GamePhase.Draw:
        this.delayedAction(() => this.gameService.advancePhase());
        break;
      case GamePhase.Hiring:
        this.delayedAction(() => this.playCards(state));
        break;
      case GamePhase.Work_Attack:
        this.delayedAction(() => this.declareAttacks(state));
        break;
      case GamePhase.Work_Block:
        // AI is attacking, human blocks — do nothing
        break;
      case GamePhase.Work_Damage:
        this.delayedAction(() => this.gameService.resolveCombat());
        break;
      case GamePhase.End:
        this.delayedAction(() => this.gameService.endTurn());
        break;
    }
  }

  private delayedAction(action: () => void): void {
    if (this.acting) return;
    this.acting = true;
    timer(AI_DELAY).subscribe(() => {
      if (!this.active || this.paused) {
        this.acting = false;
        return;
      }
      action();
      this.acting = false;
    });
  }

  // --- Mulligan ---

  private doMulligan(state: GameState): void {
    const hand = state.player2.hand;
    const toReplace = hand
      .filter(c => c.card.cost > 3)
      .map(c => c.instanceId);
    this.gameService.mulligan(AI_PLAYER_ID, toReplace);
  }

  // --- Hiring ---

  private playCards(state: GameState): void {
    const player = state.player2;
    const affordable = player.hand
      .filter(c => c.card.cost <= player.budgetRemaining)
      .sort((a, b) => a.card.cost - b.card.cost);

    if (affordable.length > 0) {
      this.gameService.playCard(affordable[0].instanceId);
      // The state re-emission will trigger another evaluate → play next card
    } else {
      this.gameService.advancePhase();
    }
  }

  // --- Attack ---

  private declareAttacks(state: GameState): void {
    const player = state.player2;
    const eligible = player.field.filter(c => this.gameService.canAttack(c.instanceId));

    for (const card of eligible) {
      this.gameService.declareAttacker(card.instanceId);
    }

    this.gameService.confirmAttackers();
  }

  // --- Blocking (AI is defender) ---

  private autoBlock(state: GameState): void {
    if (!state.combat) {
      this.gameService.confirmBlockers();
      return;
    }

    const aiPlayer = state.player2;
    const availableBlockers = aiPlayer.field.filter(c =>
      this.gameService.canBlock(c.instanceId),
    );

    // Sort attackers by productivity descending (block biggest threats first)
    const attackers = state.combat.attackers
      .map(a => this.findCard(a.attackerInstanceId, state))
      .filter((c): c is CardInstance => c !== null && isJobCard(c.card))
      .sort((a, b) => this.gameService.getEffectiveProductivity(b) - this.gameService.getEffectiveProductivity(a));

    const usedBlockers = new Set<string>();

    for (const attacker of attackers) {
      const atkProd = this.gameService.getEffectiveProductivity(attacker);

      // Find cheapest blocker that survives (resilience > attacker productivity)
      let bestBlocker: CardInstance | null = null;
      for (const blocker of availableBlockers) {
        if (usedBlockers.has(blocker.instanceId)) continue;
        const blkRes = this.gameService.getEffectiveResilience(blocker);
        if (blkRes > atkProd) {
          if (!bestBlocker || blocker.card.cost < bestBlocker.card.cost) {
            bestBlocker = blocker;
          }
        }
      }

      // If no surviving blocker and attacker prod >= 3, chump-block with cheapest
      if (!bestBlocker && atkProd >= 3) {
        for (const blocker of availableBlockers) {
          if (usedBlockers.has(blocker.instanceId)) continue;
          if (!bestBlocker || blocker.card.cost < bestBlocker.card.cost) {
            bestBlocker = blocker;
          }
        }
      }

      if (bestBlocker) {
        this.gameService.assignBlocker(bestBlocker.instanceId, attacker.instanceId);
        usedBlockers.add(bestBlocker.instanceId);
      }
    }

    this.gameService.confirmBlockers();
  }

  // --- Targeting ---

  private resolveAiTargeting(state: GameState): void {
    if (!state.pendingEffect) return;

    const effect = state.pendingEffect.effects[state.pendingEffect.currentIndex];
    const isOffensive = [
      EffectType.Damage,
      EffectType.Destroy,
      EffectType.Tap,
      EffectType.Debuff,
      EffectType.Bounce,
    ].includes(effect.type);

    // Gather valid targets
    const allField = [...state.player1.field, ...state.player2.field];
    const validTargets = allField.filter(c =>
      this.effectService.isValidTarget(state.pendingEffect!, c.instanceId, state),
    );

    if (validTargets.length === 0) {
      this.gameService.cancelPendingEffect();
      return;
    }

    let chosen: CardInstance;
    if (isOffensive) {
      // Pick highest productivity enemy
      chosen = validTargets.sort(
        (a, b) => this.gameService.getEffectiveProductivity(b) - this.gameService.getEffectiveProductivity(a),
      )[0];
    } else {
      // Buff → pick weakest ally
      chosen = validTargets.sort(
        (a, b) => this.gameService.getEffectiveProductivity(a) - this.gameService.getEffectiveProductivity(b),
      )[0];
    }

    this.gameService.resolveTargetedEffect(chosen.instanceId);
  }

  // --- Helpers ---

  private findCard(instanceId: string, state: GameState): CardInstance | null {
    for (const player of [state.player1, state.player2]) {
      const card = player.field.find(c => c.instanceId === instanceId);
      if (card) return card;
    }
    return null;
  }
}
