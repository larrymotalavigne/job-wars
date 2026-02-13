import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { GameState, CardInstance } from '../../../models/game.model';
import { GameService } from '../../../services/game.service';
import { EffectService } from '../../../services/effect.service';
import { GameCardComponent } from '../game-card/game-card.component';
import { isJobCard, isToolCard } from '../../../models/card.model';

@Component({
  selector: 'app-targeting-overlay',
  standalone: true,
  imports: [CommonModule, Button, GameCardComponent],
  templateUrl: './targeting-overlay.component.html',
  styleUrl: './targeting-overlay.component.scss',
})
export class TargetingOverlayComponent {
  @Input({ required: true }) state!: GameState;

  constructor(
    public gameService: GameService,
    private effectService: EffectService,
  ) {}

  get currentEffect() {
    if (!this.state.pendingEffect) return null;
    return this.state.pendingEffect.effects[this.state.pendingEffect.currentIndex];
  }

  get validTargets(): CardInstance[] {
    if (!this.state.pendingEffect) return [];
    const targets: CardInstance[] = [];
    for (const player of [this.state.player1, this.state.player2]) {
      for (const card of player.field) {
        if (this.effectService.isValidTarget(this.state.pendingEffect, card.instanceId, this.state)) {
          targets.push(card);
        }
      }
    }
    return targets;
  }

  isValidTarget(instanceId: string): boolean {
    if (!this.state.pendingEffect) return false;
    return this.effectService.isValidTarget(this.state.pendingEffect, instanceId, this.state);
  }

  selectTarget(instanceId: string): void {
    if (!this.isValidTarget(instanceId)) return;
    this.gameService.resolveTargetedEffect(instanceId);
  }

  cancel(): void {
    this.gameService.cancelPendingEffect();
  }
}
