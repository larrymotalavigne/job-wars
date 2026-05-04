import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { GameState, GamePhase } from '../../../models/game.model';

@Component({
  selector: 'app-phase-bar',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './phase-bar.component.html',
  styleUrl: './phase-bar.component.scss',
})
export class PhaseBarComponent {
  @Input({ required: true }) state!: GameState;
  @Output() advance = new EventEmitter<void>();
  @Output() toggleLog = new EventEmitter<void>();

  readonly phases = Object.values(GamePhase);

  private shortLabels: Record<string, string> = {
    [GamePhase.Mulligan]: 'Mul',
    [GamePhase.Budget]: 'Bud',
    [GamePhase.Draw]: 'Pio',
    [GamePhase.Hiring]: 'Emb',
    [GamePhase.Work_Attack]: 'Atq',
    [GamePhase.Work_Block]: 'Blq',
    [GamePhase.Work_Damage]: 'Dég',
    [GamePhase.End]: 'Fin',
  };

  get activePlayer() {
    return this.state.activePlayerId === this.state.player1.id
      ? this.state.player1
      : this.state.player2;
  }

  get isWorkPhase(): boolean {
    return (
      this.state.phase === GamePhase.Work_Attack ||
      this.state.phase === GamePhase.Work_Block ||
      this.state.phase === GamePhase.Work_Damage
    );
  }

  get isMulliganPhase(): boolean {
    return this.state.phase === GamePhase.Mulligan;
  }

  get canAdvance(): boolean {
    return !this.isWorkPhase && !this.isMulliganPhase && !this.state.winner;
  }

  getShortLabel(phase: GamePhase): string {
    return this.shortLabels[phase] ?? phase;
  }

  isCurrentPhase(phase: GamePhase): boolean {
    return this.state.phase === phase;
  }

  isPastPhase(phase: GamePhase): boolean {
    return this.phases.indexOf(phase) < this.phases.indexOf(this.state.phase);
  }
}
