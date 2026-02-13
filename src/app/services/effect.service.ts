import { Injectable } from '@angular/core';
import {
  CardEffects,
  EffectDefinition,
  EffectTrigger,
  EffectType,
  PendingEffect,
  TargetType,
} from '../models/effect.model';
import { CardInstance, CardZone, GameState, PlayerState } from '../models/game.model';
import { isJobCard, isToolCard } from '../models/card.model';
import { EFFECT_REGISTRY } from '../data/effect-registry';

@Injectable({ providedIn: 'root' })
export class EffectService {
  private registry = EFFECT_REGISTRY;

  getEffects(cardId: string, trigger: EffectTrigger): CardEffects | null {
    return this.registry.find(e => e.cardId === cardId && e.trigger === trigger) ?? null;
  }

  /**
   * Execute auto-resolvable effects (no targeting needed).
   * Returns a PendingEffect if manual targeting is required, null otherwise.
   */
  executeAutoEffects(
    cardInstance: CardInstance,
    trigger: EffectTrigger,
    state: GameState,
    addLog: (msg: string) => void,
    drawCards: (player: PlayerState, count: number) => void,
    destroyCard: (instanceId: string) => void,
  ): PendingEffect | null {
    const entry = this.getEffects(cardInstance.card.id, trigger);
    if (!entry) return null;

    const owner = this.getOwner(cardInstance.ownerId, state);
    if (!owner) return null;

    for (let i = 0; i < entry.effects.length; i++) {
      const effect = entry.effects[i];
      const needsTarget = this.needsManualTarget(effect);

      if (needsTarget) {
        // Return a pending effect so the UI can ask for target selection
        return {
          sourceInstanceId: cardInstance.instanceId,
          sourceCardName: cardInstance.card.name,
          effects: entry.effects,
          currentIndex: i,
          ownerId: cardInstance.ownerId,
        };
      }

      this.executeEffect(effect, cardInstance, null, state, addLog, drawCards, destroyCard);
    }

    return null;
  }

  /**
   * Resolve a targeted effect after player selects a target.
   * Returns next PendingEffect if more targeting needed, null if done.
   */
  resolveTargetedEffect(
    pending: PendingEffect,
    targetInstanceId: string,
    state: GameState,
    addLog: (msg: string) => void,
    drawCards: (player: PlayerState, count: number) => void,
    destroyCard: (instanceId: string) => void,
  ): PendingEffect | null {
    const effect = pending.effects[pending.currentIndex];
    const source = this.findCardInstance(pending.sourceInstanceId, state)
      ?? this.findCardInGraveyard(pending.sourceInstanceId, state);

    // Build a fake source if the card was already destroyed/moved
    const sourceForExec: CardInstance = source ?? {
      instanceId: pending.sourceInstanceId,
      card: { id: '', name: pending.sourceCardName } as any,
      zone: CardZone.Graveyard,
      ownerId: pending.ownerId,
      tapped: false,
      summonedThisTurn: false,
      damageThisTurn: 0,
      modifiers: [],
      faceDown: false,
      constructionBonuses: 0,
    };

    const target = this.findCardInstance(targetInstanceId, state);
    if (!target) return null;

    this.executeEffect(effect, sourceForExec, target, state, addLog, drawCards, destroyCard);

    // Check if there are more effects to resolve
    for (let i = pending.currentIndex + 1; i < pending.effects.length; i++) {
      const next = pending.effects[i];
      if (this.needsManualTarget(next)) {
        return {
          ...pending,
          currentIndex: i,
        };
      }
      this.executeEffect(next, sourceForExec, null, state, addLog, drawCards, destroyCard);
    }

    return null;
  }

  isValidTarget(pending: PendingEffect, candidateInstanceId: string, state: GameState): boolean {
    const effect = pending.effects[pending.currentIndex];
    const candidate = this.findCardInstance(candidateInstanceId, state);
    if (!candidate) return false;
    if (candidate.zone !== CardZone.Field) return false;

    const owner = this.getOwner(pending.ownerId, state);
    const opponent = this.getOpponent(pending.ownerId, state);
    if (!owner || !opponent) return false;

    switch (effect.target) {
      case TargetType.AllyJob:
        return candidate.ownerId === pending.ownerId && isJobCard(candidate.card);
      case TargetType.EnemyJob:
        return candidate.ownerId !== pending.ownerId && isJobCard(candidate.card)
          && this.checkCondition(effect, candidate, state);
      case TargetType.AnyJob:
        return isJobCard(candidate.card) && this.checkCondition(effect, candidate, state);
      case TargetType.AllyTool:
        return candidate.ownerId === pending.ownerId && isToolCard(candidate.card);
      case TargetType.EnemyTool:
        return candidate.ownerId !== pending.ownerId && isToolCard(candidate.card);
      default:
        return false;
    }
  }

  private needsManualTarget(effect: EffectDefinition): boolean {
    switch (effect.target) {
      case TargetType.AllyJob:
      case TargetType.EnemyJob:
      case TargetType.AnyJob:
      case TargetType.AllyTool:
        return true;
      case TargetType.EnemyTool:
        // "Destroy all enemy tools" is auto; single enemy tool requires targeting
        return effect.type !== EffectType.Destroy || effect.value !== 0
          ? true
          : !this.isDestroyAllTools(effect);
      default:
        return false;
    }
  }

  private isDestroyAllTools(effect: EffectDefinition): boolean {
    // it-011 Cyberattaque destroys ALL enemy tools — no targeting needed
    return effect.type === EffectType.Destroy
      && effect.target === TargetType.EnemyTool
      && effect.description.toLowerCase().includes('tous');
  }

  private executeEffect(
    effect: EffectDefinition,
    source: CardInstance,
    target: CardInstance | null,
    state: GameState,
    addLog: (msg: string) => void,
    drawCards: (player: PlayerState, count: number) => void,
    destroyCard: (instanceId: string) => void,
  ): void {
    const owner = this.getOwner(source.ownerId, state);
    const opponent = this.getOpponent(source.ownerId, state);
    if (!owner || !opponent) return;

    switch (effect.type) {
      case EffectType.Draw:
        this.executeDraw(owner, effect.value, drawCards);
        addLog(`${source.card.name} : ${effect.description}.`);
        break;

      case EffectType.Damage:
        if (target) {
          this.executeDamage(target, effect.value, state, addLog, destroyCard);
          addLog(`${source.card.name} : inflige ${effect.value} degat(s) a ${target.card.name}.`);
        } else if (effect.target === TargetType.AllEnemyJobs) {
          const enemies = opponent.field.filter(c => isJobCard(c.card));
          for (const enemy of [...enemies]) {
            this.executeDamage(enemy, effect.value, state, addLog, destroyCard);
          }
          addLog(`${source.card.name} : ${effect.description}.`);
        }
        break;

      case EffectType.Buff:
        if (target) {
          this.executeBuff(target, effect.value, effect.value2 ?? 0, !!effect.permanent);
          addLog(`${source.card.name} : ${target.card.name} gagne +${effect.value}/+${effect.value2 ?? 0}.`);
        } else if (effect.target === TargetType.AllAllyJobs) {
          for (const card of owner.field.filter(c => isJobCard(c.card))) {
            this.executeBuff(card, effect.value, effect.value2 ?? 0, !!effect.permanent);
          }
          addLog(`${source.card.name} : ${effect.description}.`);
        } else if (effect.target === TargetType.Self) {
          this.executeBuff(source, effect.value, effect.value2 ?? 0, !!effect.permanent);
          addLog(`${source.card.name} : ${effect.description}.`);
        }
        break;

      case EffectType.Debuff:
        if (target) {
          this.executeDebuff(target, effect.value, effect.value2 ?? 0, !!effect.permanent);
          addLog(`${source.card.name} : ${target.card.name} perd ${effect.value}/${effect.value2 ?? 0}.`);
        } else if (effect.target === TargetType.AllEnemyJobs) {
          for (const card of opponent.field.filter(c => isJobCard(c.card))) {
            this.executeDebuff(card, effect.value, effect.value2 ?? 0, !!effect.permanent);
          }
          addLog(`${source.card.name} : ${effect.description}.`);
        }
        break;

      case EffectType.Heal:
        this.executeHeal(owner, effect.value);
        addLog(`${source.card.name} : restaure ${effect.value} Reputation (→ ${owner.reputation}).`);
        break;

      case EffectType.Budget:
        this.executeBudget(owner, effect.value);
        addLog(`${source.card.name} : +${effect.value} Budget (→ ${owner.budgetRemaining}).`);
        break;

      case EffectType.Destroy:
        if (target) {
          addLog(`${source.card.name} : detruit ${target.card.name}.`);
          destroyCard(target.instanceId);
        } else if (effect.target === TargetType.EnemyTool && this.isDestroyAllTools(effect)) {
          const tools = opponent.field.filter(c => isToolCard(c.card));
          for (const tool of [...tools]) {
            destroyCard(tool.instanceId);
          }
          addLog(`${source.card.name} : ${effect.description}.`);
        }
        break;

      case EffectType.Tap:
        if (target) {
          this.executeTap(target);
          addLog(`${source.card.name} : ${target.card.name} est engage.`);
        }
        break;

      case EffectType.Bounce:
        if (target) {
          this.executeBounce(target, state);
          addLog(`${source.card.name} : ${target.card.name} renvoye en main.`);
        }
        break;
    }
  }

  private executeDraw(player: PlayerState, value: number, drawCards: (p: PlayerState, n: number) => void): void {
    drawCards(player, value);
  }

  private executeDamage(
    target: CardInstance,
    value: number,
    state: GameState,
    addLog: (msg: string) => void,
    destroyCard: (instanceId: string) => void,
  ): void {
    target.damageThisTurn += value;
    if (isJobCard(target.card)) {
      const effectiveRes = target.card.resilience + target.constructionBonuses
        + target.modifiers.reduce((sum, m) => sum + m.resilienceDelta, 0);
      if (target.damageThisTurn >= effectiveRes) {
        destroyCard(target.instanceId);
      }
    }
  }

  private executeBuff(target: CardInstance, prodDelta: number, resDelta: number, permanent: boolean): void {
    target.modifiers.push({
      productivityDelta: prodDelta,
      resilienceDelta: resDelta,
      description: `+${prodDelta}/+${resDelta}`,
      permanent,
    });
  }

  private executeDebuff(target: CardInstance, prodDelta: number, resDelta: number, permanent: boolean): void {
    target.modifiers.push({
      productivityDelta: prodDelta,
      resilienceDelta: resDelta,
      description: `${prodDelta}/${resDelta}`,
      permanent,
    });
  }

  private executeHeal(player: PlayerState, value: number): void {
    player.reputation += value;
  }

  private executeBudget(player: PlayerState, value: number): void {
    player.budgetRemaining += value;
  }

  private executeTap(target: CardInstance): void {
    target.tapped = true;
  }

  private executeBounce(target: CardInstance, state: GameState): void {
    const owner = this.getOwner(target.ownerId, state);
    if (!owner) return;

    const idx = owner.field.findIndex(c => c.instanceId === target.instanceId);
    if (idx === -1) return;

    owner.field.splice(idx, 1);
    target.zone = CardZone.Hand;
    target.tapped = false;
    target.modifiers = [];
    target.constructionBonuses = 0;
    target.damageThisTurn = 0;
    target.summonedThisTurn = false;
    owner.hand.push(target);
  }

  private checkCondition(effect: EffectDefinition, target: CardInstance, state: GameState): boolean {
    if (!effect.condition) return true;

    switch (effect.condition.type) {
      case 'maxTargetResilience': {
        if (!isJobCard(target.card)) return false;
        const effectiveRes = target.card.resilience + target.constructionBonuses
          + target.modifiers.reduce((sum, m) => sum + m.resilienceDelta, 0);
        return effectiveRes <= effect.condition.value;
      }
      case 'maxTargetCost':
        return target.card.cost <= effect.condition.value;
      default:
        return true;
    }
  }

  private getOwner(ownerId: string, state: GameState): PlayerState | null {
    if (state.player1.id === ownerId) return state.player1;
    if (state.player2.id === ownerId) return state.player2;
    return null;
  }

  private getOpponent(ownerId: string, state: GameState): PlayerState | null {
    if (state.player1.id === ownerId) return state.player2;
    if (state.player2.id === ownerId) return state.player1;
    return null;
  }

  private findCardInstance(instanceId: string, state: GameState): CardInstance | null {
    for (const player of [state.player1, state.player2]) {
      for (const zone of [player.hand, player.field]) {
        const card = zone.find(c => c.instanceId === instanceId);
        if (card) return card;
      }
    }
    return null;
  }

  private findCardInGraveyard(instanceId: string, state: GameState): CardInstance | null {
    for (const player of [state.player1, state.player2]) {
      const card = player.graveyard.find(c => c.instanceId === instanceId);
      if (card) return card;
    }
    return null;
  }
}
