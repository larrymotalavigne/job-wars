import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Drawer } from 'primeng/drawer';
import { GameLogEntry } from '../../../models/game.model';

@Component({
  selector: 'app-game-log',
  standalone: true,
  imports: [CommonModule, Drawer],
  templateUrl: './game-log.component.html',
  styleUrl: './game-log.component.scss',
})
export class GameLogComponent implements OnChanges {
  @Input({ required: true }) log!: GameLogEntry[];
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @ViewChild('logList') logList?: ElementRef;

  ngOnChanges(): void {
    // Auto-scroll to bottom when log changes
    setTimeout(() => {
      if (this.logList?.nativeElement) {
        this.logList.nativeElement.scrollTop = this.logList.nativeElement.scrollHeight;
      }
    });
  }

  onVisibleChange(value: boolean): void {
    this.visible = value;
    this.visibleChange.emit(value);
  }

  getPhaseColor(phase: string): string {
    if (phase.includes('Attaque')) return '#f44336';
    if (phase.includes('Blocage')) return '#2196f3';
    if (phase.includes('Dégâts')) return '#ff9800';
    if (phase.includes('Embauche')) return '#4caf50';
    if (phase.includes('Budget')) return '#ffd54f';
    if (phase.includes('Pioche')) return '#90caf9';
    return '#9e9e9e';
  }
}
