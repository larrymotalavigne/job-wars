import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { GameState, GamePhase, CardInstance } from '../../../models/game.model';
import { GameService } from '../../../services/game.service';
import { GameCardComponent } from '../game-card/game-card.component';
import { isJobCard } from '../../../models/card.model';

@Component({
  selector: 'app-combat-overlay',
  standalone: true,
  imports: [CommonModule, Button, GameCardComponent],
  templateUrl: './combat-overlay.component.html',
  styleUrl: './combat-overlay.component.scss',
})
export class CombatOverlayComponent {
  @Input({ required: true }) state!: GameState;

  selectedBlocker: string | null = null;

  constructor(public gameService: GameService) {}

  get phase(): GamePhase {
    return this.state.phase;
  }

  get isAttackPhase(): boolean {
    return this.phase === GamePhase.Work_Attack;
  }

  get isBlockPhase(): boolean {
    return this.phase === GamePhase.Work_Block;
  }

  get isDamagePhase(): boolean {
    return this.phase === GamePhase.Work_Damage;
  }

  get attacker() {
    return this.gameService.getActivePlayer();
  }

  get defender() {
    return this.gameService.getInactivePlayer();
  }

  get attackerJobs(): CardInstance[] {
    return this.attacker.field.filter((c) => isJobCard(c.card));
  }

  get defenderJobs(): CardInstance[] {
    return this.defender.field.filter((c) => isJobCard(c.card));
  }

  get attackerCards(): CardInstance[] {
    if (!this.state.combat) return [];
    return this.state.combat.attackers
      .map((a) => this.findCard(a.attackerInstanceId))
      .filter((c): c is CardInstance => c !== null);
  }

  canAttack(instanceId: string): boolean {
    return this.gameService.canAttack(instanceId);
  }

  isAttacking(instanceId: string): boolean {
    return this.gameService.isAttacking(instanceId);
  }

  canBlock(instanceId: string): boolean {
    return this.gameService.canBlock(instanceId);
  }

  isBlocking(instanceId: string): boolean {
    return this.gameService.isBlocking(instanceId);
  }

  toggleAttacker(instanceId: string): void {
    this.gameService.declareAttacker(instanceId);
  }

  confirmAttackers(): void {
    this.gameService.confirmAttackers();
  }

  skipCombat(): void {
    this.gameService.confirmAttackers(); // With 0 attackers, skips combat
  }

  selectBlocker(instanceId: string): void {
    if (!this.canBlock(instanceId)) return;
    this.selectedBlocker = this.selectedBlocker === instanceId ? null : instanceId;
  }

  assignBlock(attackerInstanceId: string): void {
    if (!this.selectedBlocker) return;
    this.gameService.assignBlocker(this.selectedBlocker, attackerInstanceId);
    this.selectedBlocker = null;
  }

  confirmBlockers(): void {
    this.gameService.confirmBlockers();
  }

  resolveCombat(): void {
    this.gameService.resolveCombat();
  }

  getBlockerFor(attackerInstanceId: string): CardInstance | null {
    const assignment = this.state.combat?.blockers.find(
      (b) => b.attackerInstanceId === attackerInstanceId,
    );
    if (!assignment) return null;
    return this.findCard(assignment.blockerInstanceId);
  }

  private findCard(instanceId: string): CardInstance | null {
    for (const p of [this.state.player1, this.state.player2]) {
      const card = p.field.find((c) => c.instanceId === instanceId);
      if (card) return card;
    }
    return null;
  }
}
