import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { ProgressBar } from 'primeng/progressbar';
import { Tag } from 'primeng/tag';
import { ScrollPanel } from 'primeng/scrollpanel';
import { BattlePassService } from '../../services/battle-pass.service';
import { BattlePassProgress, BattlePassReward, BattlePassTrack } from '../../models/battle-pass.model';
import { getXPForLevel } from '../../models/battle-pass.model';

@Component({
  selector: 'app-battle-pass',
  standalone: true,
  imports: [CommonModule, Card, Button, ProgressBar, Tag, ScrollPanel],
  templateUrl: './battle-pass.component.html',
  styleUrl: './battle-pass.component.scss'
})
export class BattlePassComponent implements OnInit {
  get progress$() {
    return this.battlePassService.progress$;
  }

  get xpHistory$() {
    return this.battlePassService.xpHistory$;
  }

  get premiumCost() {
    return this.battlePassService.getPremiumCost();
  }

  constructor(public battlePassService: BattlePassService) {}

  ngOnInit(): void {
    this.battlePassService.initializeBattlePass();
  }

  claimReward(level: number, track: BattlePassTrack): void {
    const success = this.battlePassService.claimReward(level, track);
    if (success) {
      console.log(`Claimed reward: Level ${level} ${track}`);
    }
  }

  purchasePremium(): void {
    const success = this.battlePassService.purchasePremium();
    if (success) {
      console.log('Premium Battle Pass purchased!');
    } else {
      console.warn('Failed to purchase premium');
    }
  }

  getLevelProgress(progress: BattlePassProgress): number {
    return this.battlePassService.getLevelProgress();
  }

  getXPForNextLevel(progress: BattlePassProgress): number {
    if (progress.currentLevel >= 50) return 0;
    return getXPForLevel(progress.currentLevel + 1);
  }

  getRewardIcon(reward: BattlePassReward): string {
    switch (reward.type) {
      case 'coins': return 'pi-circle-fill';
      case 'gems': return 'pi-star-fill';
      case 'card_back': return 'pi-book';
      case 'avatar': return 'pi-user';
      case 'card_cosmetic': return 'pi-palette';
      default: return 'pi-gift';
    }
  }

  getRewardColor(reward: BattlePassReward): string {
    switch (reward.type) {
      case 'coins': return '#f59e0b';
      case 'gems': return '#3b82f6';
      case 'card_back': return '#8b5cf6';
      case 'avatar': return '#10b981';
      case 'card_cosmetic': return '#f97316';
      default: return '#6b7280';
    }
  }

  getRewardLabel(reward: BattlePassReward): string {
    switch (reward.type) {
      case 'coins': return `${reward.amount} Pièces`;
      case 'gems': return `${reward.amount} Gemmes`;
      case 'card_back': return reward.itemName || 'Carte Dos';
      case 'avatar': return reward.itemName || 'Avatar';
      case 'card_cosmetic': return reward.itemName || 'Cosmétique';
      default: return 'Récompense';
    }
  }

  canClaimReward(reward: BattlePassReward, progress: BattlePassProgress): boolean {
    if (reward.claimed) return false;
    if (reward.level > progress.currentLevel) return false;
    if (reward.track === 'premium' && !progress.isPremium) return false;
    return true;
  }

  isRewardLocked(reward: BattlePassReward, progress: BattlePassProgress): boolean {
    return reward.level > progress.currentLevel;
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
