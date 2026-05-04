import { Injectable } from '@angular/core';
import { GameState, PlayerState } from '../models/game.model';

export interface GameResult {
  gameId: string;
  timestamp: number;
  playerName: string;
  opponentName: string;
  playerDeckId: string;
  opponentDeckId: string;
  won: boolean;
  isAiGame: boolean;
  finalReputation: number;
  opponentFinalReputation: number;
  turnCount: number;
  duration: number; // in milliseconds
}

export interface DeckStats {
  deckId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  averageTurns: number;
  totalDamageDealt: number;
  totalDamageReceived: number;
}

export interface PlayerStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  aiGames: number;
  aiWins: number;
  longestWinStreak: number;
  currentWinStreak: number;
  averageGameLength: number;
  favoriteDecks: string[]; // deck IDs sorted by usage
  recentGames: GameResult[];
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly STORAGE_KEY = 'jobWarsStats';
  private readonly MAX_RECENT_GAMES = 50;

  private gameStartTimes = new Map<string, number>();

  constructor() {}

  /**
   * Record when a game starts
   */
  startGame(gameId: string): void {
    this.gameStartTimes.set(gameId, Date.now());
  }

  /**
   * Record a completed game
   */
  recordGame(finalState: GameState): void {
    if (!finalState.winner) return;

    const startTime = this.gameStartTimes.get(finalState.gameId) || Date.now();
    const duration = Date.now() - startTime;
    this.gameStartTimes.delete(finalState.gameId);

    const player1Won = finalState.winner === finalState.player1.id;

    // Record result for player1
    const result: GameResult = {
      gameId: finalState.gameId,
      timestamp: Date.now(),
      playerName: finalState.player1.name,
      opponentName: finalState.player2.name,
      playerDeckId: finalState.player1.deckId,
      opponentDeckId: finalState.player2.deckId,
      won: player1Won,
      isAiGame: finalState.isAiGame,
      finalReputation: finalState.player1.reputation,
      opponentFinalReputation: finalState.player2.reputation,
      turnCount: finalState.turnNumber,
      duration,
    };

    this.saveGameResult(result);
  }

  /**
   * Get all player statistics
   */
  getPlayerStats(): PlayerStats {
    const results = this.getAllResults();

    if (results.length === 0) {
      return {
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        aiGames: 0,
        aiWins: 0,
        longestWinStreak: 0,
        currentWinStreak: 0,
        averageGameLength: 0,
        favoriteDecks: [],
        recentGames: [],
      };
    }

    const totalGames = results.length;
    const totalWins = results.filter((r) => r.won).length;
    const totalLosses = totalGames - totalWins;
    const aiGames = results.filter((r) => r.isAiGame).length;
    const aiWins = results.filter((r) => r.isAiGame && r.won).length;

    const streaks = this.calculateStreaks(results);
    const averageGameLength = results.reduce((sum, r) => sum + r.turnCount, 0) / totalGames;

    // Count deck usage
    const deckCounts = new Map<string, number>();
    results.forEach((r) => {
      deckCounts.set(r.playerDeckId, (deckCounts.get(r.playerDeckId) || 0) + 1);
    });
    const favoriteDecks = Array.from(deckCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([deckId]) => deckId)
      .slice(0, 5);

    return {
      totalGames,
      totalWins,
      totalLosses,
      winRate: totalGames > 0 ? totalWins / totalGames : 0,
      aiGames,
      aiWins,
      longestWinStreak: streaks.longest,
      currentWinStreak: streaks.current,
      averageGameLength,
      favoriteDecks,
      recentGames: results.slice(-10).reverse(),
    };
  }

  /**
   * Get statistics for a specific deck
   */
  getDeckStats(deckId: string): DeckStats {
    const results = this.getAllResults().filter((r) => r.playerDeckId === deckId);

    if (results.length === 0) {
      return {
        deckId,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        averageTurns: 0,
        totalDamageDealt: 0,
        totalDamageReceived: 0,
      };
    }

    const gamesPlayed = results.length;
    const wins = results.filter((r) => r.won).length;
    const losses = gamesPlayed - wins;
    const averageTurns = results.reduce((sum, r) => sum + r.turnCount, 0) / gamesPlayed;

    // Calculate damage (20 - final reputation = damage dealt)
    const totalDamageDealt = results.reduce((sum, r) => sum + (20 - r.opponentFinalReputation), 0);
    const totalDamageReceived = results.reduce((sum, r) => sum + (20 - r.finalReputation), 0);

    return {
      deckId,
      gamesPlayed,
      wins,
      losses,
      winRate: gamesPlayed > 0 ? wins / gamesPlayed : 0,
      averageTurns,
      totalDamageDealt,
      totalDamageReceived,
    };
  }

  /**
   * Get recent game history
   */
  getRecentGames(limit: number = 10): GameResult[] {
    const results = this.getAllResults();
    return results.slice(-limit).reverse();
  }

  /**
   * Clear all statistics
   */
  clearStats(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear stats:', err);
    }
  }

  /**
   * Export statistics as JSON
   */
  exportStats(): string {
    const stats = this.getPlayerStats();
    const allResults = this.getAllResults();
    return JSON.stringify({ stats, results: allResults }, null, 2);
  }

  private saveGameResult(result: GameResult): void {
    try {
      const results = this.getAllResults();
      results.push(result);

      // Keep only the most recent games
      if (results.length > this.MAX_RECENT_GAMES) {
        results.splice(0, results.length - this.MAX_RECENT_GAMES);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(results));
    } catch (err) {
      console.warn('Failed to save game result:', err);
    }
  }

  private getAllResults(): GameResult[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn('Failed to load game results:', err);
    }
    return [];
  }

  private calculateStreaks(results: GameResult[]): { longest: number; current: number } {
    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;

    // Sort by timestamp
    const sorted = [...results].sort((a, b) => a.timestamp - b.timestamp);

    for (const result of sorted) {
      if (result.won) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate current streak from end
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].won) {
        currentStreak++;
      } else {
        break;
      }
    }

    return { longest: longestStreak, current: currentStreak };
  }
}
