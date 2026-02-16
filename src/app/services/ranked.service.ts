import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  RankedStats,
  RankInfo,
  RankedMatch,
  RankTier,
  Season,
  getTierFromMMR,
  formatRank,
  MMR_RANGES,
  STARS_PER_TIER
} from '../models/ranked.model';

/**
 * Ranked Service
 * Manages competitive ranked mode with MMR and seasonal rankings
 */
@Injectable({
  providedIn: 'root'
})
export class RankedService {
  private readonly STORAGE_KEY = 'jobwars-ranked';
  private readonly VERSION_KEY = 'jobwars-ranked-version';
  private readonly CURRENT_VERSION = 1;
  private readonly K_FACTOR = 32; // ELO K-factor
  private readonly MAX_MATCH_HISTORY = 20;

  private statsSubject = new BehaviorSubject<RankedStats>(this.getDefaultStats());
  public stats$: Observable<RankedStats> = this.statsSubject.asObservable();

  constructor() {}

  /**
   * Initialize ranked system - load from storage or create new
   */
  initializeRanked(): void {
    try {
      const storedVersion = localStorage.getItem(this.VERSION_KEY);
      const storedStats = localStorage.getItem(this.STORAGE_KEY);

      if (storedVersion === this.CURRENT_VERSION.toString() && storedStats) {
        const stats = JSON.parse(storedStats) as RankedStats;

        // Check if season changed
        const currentSeason = this.getCurrentSeason();
        if (stats.seasonId !== currentSeason.id) {
          this.resetForNewSeason(stats, currentSeason);
        }

        this.statsSubject.next(stats);
      } else {
        const defaultStats = this.getDefaultStats();
        this.saveStats(defaultStats);
        this.statsSubject.next(defaultStats);
      }
    } catch (error) {
      console.error('Error initializing ranked:', error);
      const defaultStats = this.getDefaultStats();
      this.statsSubject.next(defaultStats);
      this.saveStats(defaultStats);
    }
  }

  /**
   * Get current ranked stats
   */
  getStats(): RankedStats {
    return this.statsSubject.value;
  }

  /**
   * Record a ranked match result
   */
  recordRankedMatch(result: 'win' | 'loss', opponentMMR: number, opponentName: string = 'Adversaire'): void {
    const stats = this.getStats();
    const rankBefore = formatRank(stats.currentRank);

    // Calculate MMR change
    const mmrChange = this.calculateMMRChange(stats.currentRank.mmr, opponentMMR, result);
    stats.currentRank.mmr = Math.max(0, stats.currentRank.mmr + mmrChange);

    // Update tier based on new MMR
    this.updateRankFromMMR(stats.currentRank);

    // Update stars
    if (result === 'win') {
      stats.currentRank.stars++;
      stats.rankedWins++;

      // Check for promotion
      while (stats.currentRank.stars >= stats.currentRank.starsRequired) {
        this.promoteRank(stats.currentRank);
      }
    } else {
      // Loss - lose star (but not in Bronze)
      if (stats.currentRank.tier !== RankTier.Bronze || stats.currentRank.division !== 3) {
        stats.currentRank.stars--;

        // Check for demotion
        if (stats.currentRank.stars < 0) {
          this.demoteRank(stats.currentRank);
        }
      }
    }

    stats.rankedGames++;
    const rankAfter = formatRank(stats.currentRank);

    // Update season high rank
    if (this.isRankHigher(stats.currentRank, stats.seasonHighRank)) {
      stats.seasonHighRank = { ...stats.currentRank };
    }

    // Add to match history
    const match: RankedMatch = {
      id: `match_${Date.now()}`,
      timestamp: Date.now(),
      result,
      opponentName,
      opponentMMR,
      mmrChange,
      rankBefore,
      rankAfter
    };

    stats.matchHistory.unshift(match);
    if (stats.matchHistory.length > this.MAX_MATCH_HISTORY) {
      stats.matchHistory = stats.matchHistory.slice(0, this.MAX_MATCH_HISTORY);
    }

    this.statsSubject.next(stats);
    this.saveStats(stats);
  }

  /**
   * Calculate MMR change using ELO formula
   */
  calculateMMRChange(playerMMR: number, opponentMMR: number, result: 'win' | 'loss'): number {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentMMR - playerMMR) / 400));
    const actualScore = result === 'win' ? 1 : 0;
    return Math.round(this.K_FACTOR * (actualScore - expectedScore));
  }

  /**
   * Get current season info
   */
  getCurrentSeason(): Season {
    // Simple season system: 3-month seasons starting Jan 1, 2026
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    const seasonNumber = Math.floor(month / 3) + 1; // 1-4
    const seasonStart = new Date(year, (seasonNumber - 1) * 3, 1);
    const seasonEnd = new Date(year, seasonNumber * 3, 0, 23, 59, 59, 999);

    return {
      id: `S${year}-${seasonNumber}`,
      name: `Saison ${seasonNumber} ${year}`,
      startDate: seasonStart.getTime(),
      endDate: seasonEnd.getTime(),
      isActive: true
    };
  }

  /**
   * Get time until season ends
   */
  getTimeUntilSeasonEnd(): number {
    const season = this.getCurrentSeason();
    return season.endDate - Date.now();
  }

  /**
   * Get win rate percentage
   */
  getWinRate(): number {
    const stats = this.getStats();
    if (stats.rankedGames === 0) return 0;
    return Math.round((stats.rankedWins / stats.rankedGames) * 100);
  }

  // Private helper methods

  private getDefaultStats(): RankedStats {
    const startingMMR = 1000;
    const currentSeason = this.getCurrentSeason();

    return {
      currentRank: this.createRankInfo(startingMMR),
      seasonHighRank: this.createRankInfo(startingMMR),
      seasonId: currentSeason.id,
      rankedGames: 0,
      rankedWins: 0,
      matchHistory: []
    };
  }

  private createRankInfo(mmr: number): RankInfo {
    const tier = getTierFromMMR(mmr);
    const starsRequired = STARS_PER_TIER[tier];

    return {
      tier,
      division: 3, // Start at lowest division
      mmr,
      stars: 0,
      starsRequired
    };
  }

  private updateRankFromMMR(rank: RankInfo): void {
    rank.tier = getTierFromMMR(rank.mmr);
    rank.starsRequired = STARS_PER_TIER[rank.tier];
  }

  private promoteRank(rank: RankInfo): void {
    rank.stars -= rank.starsRequired;

    if (rank.division > 1) {
      // Promote within tier
      rank.division--;
    } else {
      // Promote to next tier
      const tiers = Object.values(RankTier);
      const currentIndex = tiers.indexOf(rank.tier);

      if (currentIndex < tiers.length - 1) {
        rank.tier = tiers[currentIndex + 1];
        rank.division = 3;
        rank.starsRequired = STARS_PER_TIER[rank.tier];
        rank.stars = 0;
      } else {
        // Already at Master - keep stars
        rank.stars = Math.min(rank.stars, rank.starsRequired - 1);
      }
    }
  }

  private demoteRank(rank: RankInfo): void {
    if (rank.tier === RankTier.Bronze && rank.division === 3) {
      // Can't demote from Bronze 3
      rank.stars = 0;
      return;
    }

    if (rank.division < 3) {
      // Demote within tier
      rank.division++;
      rank.stars = rank.starsRequired - 1;
    } else {
      // Demote to previous tier
      const tiers = Object.values(RankTier);
      const currentIndex = tiers.indexOf(rank.tier);

      if (currentIndex > 0) {
        rank.tier = tiers[currentIndex - 1];
        rank.division = 1;
        rank.starsRequired = STARS_PER_TIER[rank.tier];
        rank.stars = rank.starsRequired - 1;
      }
    }
  }

  private isRankHigher(rank1: RankInfo, rank2: RankInfo): boolean {
    const tiers = Object.values(RankTier);
    const tier1Index = tiers.indexOf(rank1.tier);
    const tier2Index = tiers.indexOf(rank2.tier);

    if (tier1Index > tier2Index) return true;
    if (tier1Index < tier2Index) return false;

    // Same tier - check division (lower division number = higher rank)
    return rank1.division < rank2.division;
  }

  private resetForNewSeason(stats: RankedStats, newSeason: Season): void {
    // Soft MMR reset (move toward 1200)
    const newMMR = Math.floor((stats.currentRank.mmr + 1200) / 2);

    stats.currentRank = this.createRankInfo(newMMR);
    stats.seasonHighRank = { ...stats.currentRank };
    stats.seasonId = newSeason.id;
    stats.rankedGames = 0;
    stats.rankedWins = 0;
    stats.matchHistory = [];

    this.saveStats(stats);
  }

  private saveStats(stats: RankedStats): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION.toString());
    } catch (error) {
      console.error('Error saving ranked stats:', error);
    }
  }
}
