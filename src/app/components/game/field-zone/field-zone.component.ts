import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardInstance, GameState, GamePhase } from '../../../models/game.model';
import { GameCardComponent } from '../game-card/game-card.component';
import { GameService } from '../../../services/game.service';

@Component({
  selector: 'app-field-zone',
  standalone: true,
  imports: [CommonModule, GameCardComponent],
  templateUrl: './field-zone.component.html',
  styleUrl: './field-zone.component.scss',
})
export class FieldZoneComponent {
  @Input({ required: true }) cards!: CardInstance[];
  @Input() isActive = false;
  @Input({ required: true }) state!: GameState;

  selectedBlocker: string | null = null;

  constructor(private gameService: GameService) {}

  get isAttackPhase(): boolean {
    return this.state.phase === GamePhase.Work_Attack && this.isActive;
  }

  get isBlockPhase(): boolean {
    return this.state.phase === GamePhase.Work_Block && !this.isActive;
  }

  isSelectable(card: CardInstance): boolean {
    if (this.isAttackPhase) {
      return this.gameService.canAttack(card.instanceId);
    }
    if (this.isBlockPhase) {
      return this.gameService.canBlock(card.instanceId);
    }
    return false;
  }

  isSelected(card: CardInstance): boolean {
    if (this.isAttackPhase) {
      return this.gameService.isAttacking(card.instanceId);
    }
    if (this.isBlockPhase) {
      return (
        this.gameService.isBlocking(card.instanceId) || this.selectedBlocker === card.instanceId
      );
    }
    return false;
  }

  onCardClick(instanceId: string): void {
    if (this.isAttackPhase) {
      this.gameService.declareAttacker(instanceId);
    } else if (this.isBlockPhase) {
      if (!this.selectedBlocker) {
        // First click: select blocker
        if (this.gameService.canBlock(instanceId)) {
          this.selectedBlocker = instanceId;
        }
      } else if (this.selectedBlocker === instanceId) {
        // Deselect
        this.selectedBlocker = null;
      }
    }
  }

  onAttackerClick(attackerInstanceId: string): void {
    if (this.isBlockPhase && this.selectedBlocker) {
      this.gameService.assignBlocker(this.selectedBlocker, attackerInstanceId);
      this.selectedBlocker = null;
    }
  }
}
