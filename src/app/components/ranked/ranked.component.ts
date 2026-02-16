import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { ProgressBar } from 'primeng/progressbar';
import { Tag } from 'primeng/tag';
import { Table } from 'primeng/table';
import { RankedService } from '../../services/ranked.service';
import { RankedStats, RankTier, formatRank } from '../../models/ranked.model';

@Component({
  selector: 'app-ranked',
  standalone: true,
  imports: [CommonModule, Card, Button, ProgressBar, Tag, Table],
  templateUrl: './ranked.component.html',
  styleUrl: './ranked.component.scss'
})
export class RankedComponent implements OnInit {
  stats$ = this.rankedService.stats$;
  seasonEndTime = '';
  RankTier = RankTier; // For template access

  constructor(public rankedService: RankedService) {}

  ngOnInit(): void {
    this.rankedService.initializeRanked();
    this.updateSeasonTimer();

    // Update timer every minute
    setInterval(() => this.updateSeasonTimer(), 60000);
  }

  getStarProgress(stats: RankedStats): number {
    return Math.floor((stats.currentRank.stars / stats.currentRank.starsRequired) * 100);
  }

  getRankTierColor(tier: RankTier): string {
    switch (tier) {
      case RankTier.Bronze: return '#cd7f32';
      case RankTier.Silver: return '#c0c0c0';
      case RankTier.Gold: return '#ffd700';
      case RankTier.Platinum: return '#e5e4e2';
      case RankTier.Diamond: return '#b9f2ff';
      case RankTier.Master: return '#ff6b6b';
      default: return '#666';
    }
  }

  getMatchResultSeverity(result: 'win' | 'loss'): 'success' | 'danger' {
    return result === 'win' ? 'success' : 'danger';
  }

  getMatchResultLabel(result: 'win' | 'loss'): string {
    return result === 'win' ? 'Victoire' : 'Défaite';
  }

  getWinRate(): number {
    return this.rankedService.getWinRate();
  }

  formatRank(stats: RankedStats): string {
    return formatRank(stats.currentRank);
  }

  formatMMRChange(change: number): string {
    return change > 0 ? `+${change}` : `${change}`;
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private updateSeasonTimer(): void {
    const ms = this.rankedService.getTimeUntilSeasonEnd();
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    this.seasonEndTime = `${days}j ${hours}h`;
  }
}
