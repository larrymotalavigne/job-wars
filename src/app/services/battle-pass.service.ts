import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  BattlePassProgress,
  BattlePassReward,
  BattlePassRewardType,
  BattlePassTrack,
  XPSource,
  getXPForLevel,
  getTotalXPForLevel,
  getLevelFromXP,
  getProgressInLevel
} from '../models/battle-pass.model';
import { CurrencyService } from './currency.service';
import { CosmeticsService } from './cosmetics.service';

/**
 * Battle Pass Service
 * Manages seasonal progression with free and premium reward tracks
 */
@Injectable({
  providedIn: 'root'
})
export class BattlePassService {
  private readonly STORAGE_KEY = 'jobwars-battlepass';
  private readonly VERSION_KEY = 'jobwars-battlepass-version';
  private readonly XP_HISTORY_KEY = 'jobwars-battlepass-xp';
  private readonly CURRENT_VERSION = 1;
  private readonly MAX_LEVEL = 50;
  private readonly PREMIUM_COST_GEMS = 1000;

  private progressSubject = new BehaviorSubject<BattlePassProgress>(this.getDefaultProgress());
  public progress$: Observable<BattlePassProgress> = this.progressSubject.asObservable();

  private xpHistorySubject = new BehaviorSubject<XPSource[]>([]);
  public xpHistory$: Observable<XPSource[]> = this.xpHistorySubject.asObservable();

  constructor(
    private currencyService: CurrencyService,
    private cosmeticsService: CosmeticsService
  ) {}

  /**
   * Initialize battle pass system
   */
  initializeBattlePass(): void {
    try {
      const storedVersion = localStorage.getItem(this.VERSION_KEY);
      const storedProgress = localStorage.getItem(this.STORAGE_KEY);

      if (storedVersion === this.CURRENT_VERSION.toString() && storedProgress) {
        const progress = JSON.parse(storedProgress) as BattlePassProgress;

        // Check if season changed
        const currentSeasonId = this.getCurrentSeasonId();
        if (progress.seasonId !== currentSeasonId) {
          this.resetForNewSeason(currentSeasonId);
        } else {
          this.progressSubject.next(progress);
        }
      } else {
        const defaultProgress = this.getDefaultProgress();
        this.saveProgress(defaultProgress);
        this.progressSubject.next(defaultProgress);
      }

      // Load XP history
      const storedHistory = localStorage.getItem(this.XP_HISTORY_KEY);
      if (storedHistory) {
        const history = JSON.parse(storedHistory) as XPSource[];
        this.xpHistorySubject.next(history);
      }
    } catch (error) {
      console.error('Error initializing battle pass:', error);
      const defaultProgress = this.getDefaultProgress();
      this.progressSubject.next(defaultProgress);
      this.saveProgress(defaultProgress);
    }
  }

  /**
   * Get current battle pass progress
   */
  getProgress(): BattlePassProgress {
    return this.progressSubject.value;
  }

  /**
   * Add XP to battle pass
   */
  addXP(amount: number, source: XPSource['type'], description: string): void {
    if (amount <= 0) {
      console.warn('Cannot add non-positive XP:', amount);
      return;
    }

    const progress = this.getProgress();

    // Add XP
    progress.totalXP += amount;
    progress.currentXP += amount;

    // Check for level ups
    const xpForCurrentLevel = getXPForLevel(progress.currentLevel + 1);
    while (progress.currentXP >= xpForCurrentLevel && progress.currentLevel < this.MAX_LEVEL) {
      progress.currentLevel++;
      progress.currentXP -= xpForCurrentLevel;

      console.log(`🎉 Battle Pass niveau ${progress.currentLevel} atteint!`);
    }

    // Cap at max level
    if (progress.currentLevel >= this.MAX_LEVEL) {
      progress.currentLevel = this.MAX_LEVEL;
      progress.currentXP = 0;
    }

    this.progressSubject.next(progress);
    this.saveProgress(progress);

    // Record XP source
    this.recordXPSource({
      type: source,
      amount,
      timestamp: Date.now(),
      description
    });
  }

  /**
   * Claim a reward
   */
  claimReward(level: number, track: BattlePassTrack): boolean {
    const progress = this.getProgress();

    // Check if level is unlocked
    if (level > progress.currentLevel) {
      console.warn('Level not reached yet:', level);
      return false;
    }

    // Find reward
    const reward = progress.rewards.find(r => r.level === level && r.track === track);
    if (!reward) {
      console.warn('Reward not found:', level, track);
      return false;
    }

    // Check if already claimed
    if (reward.claimed) {
      console.warn('Reward already claimed:', level, track);
      return false;
    }

    // Check if premium track requires purchase
    if (track === 'premium' && !progress.isPremium) {
      console.warn('Premium track not unlocked');
      return false;
    }

    // Award reward
    this.awardReward(reward);

    // Mark as claimed
    reward.claimed = true;
    this.progressSubject.next(progress);
    this.saveProgress(progress);

    return true;
  }

  /**
   * Purchase premium battle pass
   */
  purchasePremium(): boolean {
    const progress = this.getProgress();

    if (progress.isPremium) {
      console.warn('Premium already purchased');
      return false;
    }

    // Check if player has enough gems
    if (!this.currencyService.hasEnough(0, this.PREMIUM_COST_GEMS)) {
      console.warn('Not enough gems for premium');
      return false;
    }

    // Deduct gems
    const success = this.currencyService.spendCurrency('Gemmes', this.PREMIUM_COST_GEMS, 'Battle Pass Premium');
    if (!success) {
      return false;
    }

    // Unlock premium
    progress.isPremium = true;
    progress.purchaseDate = Date.now();

    this.progressSubject.next(progress);
    this.saveProgress(progress);

    return true;
  }

  /**
   * Get XP progress percentage for current level
   */
  getLevelProgress(): number {
    const progress = this.getProgress();
    if (progress.currentLevel >= this.MAX_LEVEL) {
      return 100;
    }

    const xpForLevel = getXPForLevel(progress.currentLevel + 1);
    return Math.floor((progress.currentXP / xpForLevel) * 100);
  }

  /**
   * Get rewards available to claim
   */
  getAvailableRewards(): BattlePassReward[] {
    const progress = this.getProgress();
    return progress.rewards.filter(r => {
      if (r.claimed) return false;
      if (r.level > progress.currentLevel) return false;
      if (r.track === 'premium' && !progress.isPremium) return false;
      return true;
    });
  }

  /**
   * Get current season ID
   */
  getCurrentSeasonId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const seasonNumber = Math.floor(month / 3) + 1;
    return `S${year}-${seasonNumber}`;
  }

  /**
   * Get premium cost
   */
  getPremiumCost(): number {
    return this.PREMIUM_COST_GEMS;
  }

  // Private helper methods

  private getDefaultProgress(): BattlePassProgress {
    const seasonId = this.getCurrentSeasonId();

    return {
      seasonId,
      currentLevel: 0,
      currentXP: 0,
      totalXP: 0,
      isPremium: false,
      rewards: this.generateRewards()
    };
  }

  private generateRewards(): BattlePassReward[] {
    const rewards: BattlePassReward[] = [];

    for (let level = 1; level <= this.MAX_LEVEL; level++) {
      // Free track reward
      const freeReward = this.generateFreeReward(level);
      if (freeReward) {
        rewards.push(freeReward);
      }

      // Premium track reward
      const premiumReward = this.generatePremiumReward(level);
      if (premiumReward) {
        rewards.push(premiumReward);
      }
    }

    return rewards;
  }

  private generateFreeReward(level: number): BattlePassReward | null {
    // Free rewards: coins + occasional gems at milestones
    const baseCoins = 50 + (level * 10);

    if (level % 10 === 0) {
      // Milestone: gems
      return {
        level,
        track: 'free',
        type: 'gems',
        amount: 25,
        claimed: false
      };
    } else {
      // Regular: coins
      return {
        level,
        track: 'free',
        type: 'coins',
        amount: baseCoins,
        claimed: false
      };
    }
  }

  private generatePremiumReward(level: number): BattlePassReward | null {
    // Premium rewards: more coins/gems + cosmetics at milestones
    const baseCoins = 100 + (level * 20);

    if (level % 10 === 0) {
      // Major milestone: cosmetic
      return {
        level,
        track: 'premium',
        type: level % 20 === 0 ? 'card_back' : 'avatar',
        itemId: `bp_${this.getCurrentSeasonId()}_${level}`,
        itemName: `Récompense Niveau ${level}`,
        claimed: false
      };
    } else if (level % 5 === 0) {
      // Minor milestone: gems
      return {
        level,
        track: 'premium',
        type: 'gems',
        amount: 50,
        claimed: false
      };
    } else {
      // Regular: coins
      return {
        level,
        track: 'premium',
        type: 'coins',
        amount: baseCoins,
        claimed: false
      };
    }
  }

  private awardReward(reward: BattlePassReward): void {
    switch (reward.type) {
      case 'coins':
        this.currencyService.addCurrency('Pièces', reward.amount!, `Battle Pass Niveau ${reward.level}`);
        break;
      case 'gems':
        this.currencyService.addCurrency('Gemmes', reward.amount!, `Battle Pass Niveau ${reward.level}`);
        break;
      case 'card_back':
      case 'avatar':
      case 'card_cosmetic':
        if (reward.itemId) {
          this.cosmeticsService.unlockCosmetic(reward.itemId);
        }
        break;
    }
  }

  private recordXPSource(source: XPSource): void {
    const history = [...this.xpHistorySubject.value];
    history.unshift(source);

    // Keep last 50 sources
    if (history.length > 50) {
      history.pop();
    }

    this.xpHistorySubject.next(history);
    this.saveXPHistory(history);
  }

  private resetForNewSeason(newSeasonId: string): void {
    const progress = this.getDefaultProgress();
    progress.seasonId = newSeasonId;

    this.progressSubject.next(progress);
    this.saveProgress(progress);

    // Clear XP history
    this.xpHistorySubject.next([]);
    localStorage.removeItem(this.XP_HISTORY_KEY);
  }

  private saveProgress(progress: BattlePassProgress): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION.toString());
    } catch (error) {
      console.error('Error saving battle pass progress:', error);
    }
  }

  private saveXPHistory(history: XPSource[]): void {
    try {
      localStorage.setItem(this.XP_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving XP history:', error);
    }
  }
}
