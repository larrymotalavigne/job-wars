import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { StatsService, PlayerStats, GameResult } from '../../services/stats.service';
import { DeckService } from '../../services/deck.service';
import { Card as PrimeCard } from 'primeng/card';
import { Button } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { Dialog } from 'primeng/dialog';

interface ServerPlayerStats {
  player_id: string;
  player_name: string;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  avg_game_duration: number;
  favorite_deck: string | null;
}

interface MatchRecord {
  id: number;
  player1_id: string;
  player1_name: string;
  player2_id: string;
  player2_name: string;
  winner_id: string | null;
  start_time: number;
  end_time: number;
  turn_count: number;
  deck1_id: string;
  deck2_id: string;
}

interface TotalStats {
  totalMatches: number;
  totalPlayers: number;
  avgMatchDuration: number;
}

@Component({
  selector: 'app-stats',
  imports: [
    CommonModule,
    PrimeCard,
    Button,
    TableModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Dialog,
  ],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
})
export class StatsComponent implements OnInit {
  playerStats: PlayerStats | null = null;
  showClearDialog = false;

  // Server-side stats
  serverLoading = true;
  serverError: string | null = null;
  totalStats: TotalStats | null = null;
  leaderboard: ServerPlayerStats[] = [];
  recentMatches: MatchRecord[] = [];

  private apiUrl = 'http://localhost:3001/api';

  constructor(
    public statsService: StatsService,
    private deckService: DeckService,
    private router: Router,
    private http: HttpClient,
  ) {
    // In production, use the same host
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      this.apiUrl = `${window.location.protocol}//${window.location.hostname}/api`;
    }
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadServerStats();
  }

  loadStats(): void {
    this.playerStats = this.statsService.getPlayerStats();
  }

  async loadServerStats(): Promise<void> {
    this.serverLoading = true;
    this.serverError = null;

    try {
      // Load all server stats in parallel
      const [totalStats, leaderboard, recentMatches] = await Promise.all([
        this.http.get<TotalStats>(`${this.apiUrl}/stats`).toPromise(),
        this.http.get<ServerPlayerStats[]>(`${this.apiUrl}/leaderboard`).toPromise(),
        this.http.get<MatchRecord[]>(`${this.apiUrl}/matches/recent`).toPromise(),
      ]);

      this.totalStats = totalStats || null;
      this.leaderboard = leaderboard || [];
      this.recentMatches = recentMatches || [];
    } catch (err) {
      console.error('Failed to load server stats:', err);
      this.serverError =
        'Impossible de charger les statistiques du serveur. Le serveur est-il actif ?';
    } finally {
      this.serverLoading = false;
    }
  }

  getDeckName(deckId: string): string {
    if (deckId === 'quick') return 'Deck Aléatoire';
    const deck = this.deckService.getDeckById(deckId);
    return deck?.name || 'Deck Inconnu';
  }

  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getWinRateColor(winRate: number): string {
    if (winRate >= 0.6) return 'success';
    if (winRate >= 0.4) return 'warn';
    return 'danger';
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  confirmClearStats(): void {
    this.showClearDialog = true;
  }

  clearStats(): void {
    this.statsService.clearStats();
    this.loadStats();
    this.showClearDialog = false;
  }

  exportStats(): void {
    const data = this.statsService.exportStats();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-wars-stats-${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Server stats helper methods
  getWinnerName(match: MatchRecord): string {
    if (!match.winner_id) return 'Match nul';
    if (match.winner_id === match.player1_id) return match.player1_name;
    if (match.winner_id === match.player2_id) return match.player2_name;
    return '?';
  }

  getMatchDuration(match: MatchRecord): string {
    return this.formatDuration(match.end_time - match.start_time);
  }
}
