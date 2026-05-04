import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dialog } from 'primeng/dialog';
import { TabPanel, Tabs, TabList, Tab, TabPanels } from 'primeng/tabs';
import { PlayerState, GameState, GamePhase } from '../../../models/game.model';
import { HandZoneComponent } from '../hand-zone/hand-zone.component';
import { FieldZoneComponent } from '../field-zone/field-zone.component';
import { GameCardComponent } from '../game-card/game-card.component';

@Component({
  selector: 'app-player-area',
  standalone: true,
  imports: [
    CommonModule,
    HandZoneComponent,
    FieldZoneComponent,
    GameCardComponent,
    Dialog,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
  ],
  templateUrl: './player-area.component.html',
  styleUrl: './player-area.component.scss',
})
export class PlayerAreaComponent implements OnChanges {
  @Input({ required: true }) player!: PlayerState;
  @Input() isActive = false;
  @Input({ required: true }) state!: GameState;

  showGraveyard = false;
  damagePopup: number | null = null;
  private previousReputation = -1;
  private damageTimeout: any;

  get isP1(): boolean {
    return this.player.id === this.state.player1.id;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['player'] || changes['state']) {
      const rep = this.player.reputation;
      if (this.previousReputation >= 0 && rep < this.previousReputation) {
        const damage = this.previousReputation - rep;
        this.showDamagePopup(damage);
      }
      this.previousReputation = rep;
    }
  }

  openGraveyard(): void {
    this.showGraveyard = true;
  }

  private showDamagePopup(damage: number): void {
    this.damagePopup = damage;
    clearTimeout(this.damageTimeout);
    this.damageTimeout = setTimeout(() => {
      this.damagePopup = null;
    }, 1200);
  }
}
