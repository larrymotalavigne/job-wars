import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { ProgressBar } from 'primeng/progressbar';
import { Tag } from 'primeng/tag';
import { QuestService } from '../../services/quest.service';
import { Quest, DailyReward } from '../../models/quest.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-quests',
  standalone: true,
  imports: [CommonModule, Card, Button, ProgressBar, Tag],
  templateUrl: './quests.component.html',
  styleUrl: './quests.component.scss'
})
export class QuestsComponent implements OnInit {
  questState$ = this.questService.state$;
  timeUntilReset = '';

  constructor(public questService: QuestService) {}

  ngOnInit(): void {
    this.questService.checkDailyReset();
    this.updateResetTimer();

    // Update timer every minute
    setInterval(() => this.updateResetTimer(), 60000);
  }

  claimQuest(questId: string): void {
    const success = this.questService.claimQuest(questId);
    if (success) {
      console.log('Quest claimed successfully!');
    }
  }

  claimDailyReward(day: number): void {
    const success = this.questService.claimDailyReward(day);
    if (success) {
      console.log(`Day ${day} reward claimed!`);
    }
  }

  getProgressPercent(quest: Quest): number {
    return Math.floor((quest.progress / quest.requirement) * 100);
  }

  getDifficultyColor(reward: { coins: number; gems: number }): string {
    if (reward.coins >= 150 || reward.gems > 0) return 'danger';
    if (reward.coins >= 100) return 'warning';
    return 'success';
  }

  getDifficultyLabel(reward: { coins: number; gems: number }): string {
    if (reward.coins >= 150 || reward.gems > 0) return 'Difficile';
    if (reward.coins >= 100) return 'Moyen';
    return 'Facile';
  }

  canClaimDailyReward(reward: DailyReward, loginStreak: number): boolean {
    return reward.day <= loginStreak && !reward.claimed;
  }

  private updateResetTimer(): void {
    const ms = this.questService.getTimeUntilReset();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    this.timeUntilReset = `${hours}h ${minutes}m`;
  }
}
