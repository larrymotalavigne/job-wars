import { Injectable } from '@angular/core';
import { Card, Rarity } from '../models/card.model';
import { CardService } from './card.service';
import { StatsService } from './stats.service';

export interface UnlockCondition {
  type: 'games_played' | 'games_won' | 'domain_games' | 'starter' | 'achievement';
  requirement: number | string;
  description: string;
}

export interface CardCollectionEntry {
  cardId: string;
  unlocked: boolean;
  unlockedAt?: string;
  unlockCondition: UnlockCondition;
}

export interface CollectionStats {
  totalCards: number;
  unlockedCards: number;
  percentageUnlocked: number;
  byRarity: Record<Rarity, { total: number; unlocked: number }>;
  recentUnlocks: CardCollectionEntry[];
}

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly STORAGE_KEY = 'jobwars-collection';
  private readonly VERSION_KEY = 'jobwars-collection-version';
  private readonly CURRENT_VERSION = 2; // Increment when card structure changes

  constructor(
    private cardService: CardService,
    private statsService: StatsService,
  ) {}

  /**
   * Initialize collection with all cards (optimized)
   */
  initializeCollection(): void {
    const storedVersion = this.getStoredVersion();
    const allCards = this.cardService.getAllCards();

    // Check if we need to reinitialize (version mismatch or new cards added)
    if (storedVersion !== this.CURRENT_VERSION) {
      console.log('Migrating collection to new version...');
      this.migrateCollection(allCards);
      return;
    }

    const existing = this.loadCollection();
    if (existing.length > 0 && existing.length === allCards.length) {
      return; // Already initialized with correct number of cards
    }

    // Initialize or add missing cards
    this.initializeOrUpdateCollection(allCards, existing);
  }

  private initializeOrUpdateCollection(allCards: Card[], existing: CardCollectionEntry[]): void {
    const existingIds = new Set(existing.map(e => e.cardId));
    const newEntries: CardCollectionEntry[] = [];

    // Add any missing cards
    for (const card of allCards) {
      if (!existingIds.has(card.id)) {
        newEntries.push({
          cardId: card.id,
          unlocked: this.isStarterCard(card),
          unlockedAt: this.isStarterCard(card) ? new Date().toISOString() : undefined,
          unlockCondition: this.getUnlockCondition(card),
        });
      }
    }

    if (newEntries.length > 0 || existing.length === 0) {
      const collection = existing.length === 0
        ? allCards.map(card => ({
            cardId: card.id,
            unlocked: this.isStarterCard(card),
            unlockedAt: this.isStarterCard(card) ? new Date().toISOString() : undefined,
            unlockCondition: this.getUnlockCondition(card),
          }))
        : [...existing, ...newEntries];

      this.saveCollection(collection);
      this.setStoredVersion(this.CURRENT_VERSION);
    }
  }

  private migrateCollection(allCards: Card[]): void {
    const oldCollection = this.loadCollection();
    const unlockedIds = new Set(oldCollection.filter(e => e.unlocked).map(e => e.cardId));

    const newCollection: CardCollectionEntry[] = allCards.map(card => ({
      cardId: card.id,
      unlocked: unlockedIds.has(card.id) || this.isStarterCard(card),
      unlockedAt: unlockedIds.has(card.id) ? new Date().toISOString() :
                  this.isStarterCard(card) ? new Date().toISOString() : undefined,
      unlockCondition: this.getUnlockCondition(card),
    }));

    this.saveCollection(newCollection);
    this.setStoredVersion(this.CURRENT_VERSION);
    console.log(`Migration complete: ${newCollection.length} cards`);
  }

  private getStoredVersion(): number {
    try {
      const version = localStorage.getItem(this.VERSION_KEY);
      return version ? parseInt(version, 10) : 0;
    } catch {
      return 0;
    }
  }

  private setStoredVersion(version: number): void {
    try {
      localStorage.setItem(this.VERSION_KEY, version.toString());
    } catch (err) {
      console.warn('Failed to save version:', err);
    }
  }

  /**
   * Check and unlock cards based on player progress
   */
  checkUnlocks(): CardCollectionEntry[] {
    const collection = this.loadCollection();
    const stats = this.statsService.getPlayerStats();
    const newUnlocks: CardCollectionEntry[] = [];

    for (const entry of collection) {
      if (entry.unlocked) continue;

      const condition = entry.unlockCondition;
      let shouldUnlock = false;

      switch (condition.type) {
        case 'games_played':
          shouldUnlock = stats.totalGames >= (condition.requirement as number);
          break;
        case 'games_won':
          shouldUnlock = stats.totalWins >= (condition.requirement as number);
          break;
        case 'achievement':
          // Check specific achievements
          shouldUnlock = this.checkAchievement(condition.requirement as string, stats);
          break;
      }

      if (shouldUnlock) {
        entry.unlocked = true;
        entry.unlockedAt = new Date().toISOString();
        newUnlocks.push(entry);
      }
    }

    if (newUnlocks.length > 0) {
      this.saveCollection(collection);
    }

    return newUnlocks;
  }

  /**
   * Get collection statistics
   */
  getCollectionStats(): CollectionStats {
    const collection = this.loadCollection();
    const totalCards = collection.length;
    const unlockedCards = collection.filter(e => e.unlocked).length;

    const byRarity: Record<Rarity, { total: number; unlocked: number }> = {
      [Rarity.Common]: { total: 0, unlocked: 0 },
      [Rarity.Uncommon]: { total: 0, unlocked: 0 },
      [Rarity.Rare]: { total: 0, unlocked: 0 },
      [Rarity.Legendary]: { total: 0, unlocked: 0 },
    };

    for (const entry of collection) {
      const card = this.cardService.getCardById(entry.cardId);
      if (!card) continue;

      byRarity[card.rarity].total++;
      if (entry.unlocked) {
        byRarity[card.rarity].unlocked++;
      }
    }

    const recentUnlocks = collection
      .filter(e => e.unlocked && e.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 10);

    return {
      totalCards,
      unlockedCards,
      percentageUnlocked: totalCards > 0 ? (unlockedCards / totalCards) * 100 : 0,
      byRarity,
      recentUnlocks,
    };
  }

  /**
   * Check if a card is unlocked
   */
  isCardUnlocked(cardId: string): boolean {
    const collection = this.loadCollection();
    const entry = collection.find(e => e.cardId === cardId);
    return entry?.unlocked ?? false;
  }

  /**
   * Get all unlocked cards
   */
  getUnlockedCards(): Card[] {
    const collection = this.loadCollection();
    const unlockedIds = collection.filter(e => e.unlocked).map(e => e.cardId);
    return this.cardService.getAllCards().filter(c => unlockedIds.includes(c.id));
  }

  /**
   * Get locked cards with their unlock conditions
   */
  getLockedCards(): Array<{ card: Card; condition: UnlockCondition }> {
    const collection = this.loadCollection();
    const locked = collection.filter(e => !e.unlocked);

    return locked.map(entry => {
      const card = this.cardService.getCardById(entry.cardId);
      return {
        card: card!,
        condition: entry.unlockCondition,
      };
    }).filter(item => item.card !== null);
  }

  /**
   * Manually unlock a card (for testing/admin)
   */
  unlockCard(cardId: string): void {
    const collection = this.loadCollection();
    const entry = collection.find(e => e.cardId === cardId);
    if (entry && !entry.unlocked) {
      entry.unlocked = true;
      entry.unlockedAt = new Date().toISOString();
      this.saveCollection(collection);
    }
  }

  /**
   * Reset collection (for testing)
   */
  resetCollection(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.initializeCollection();
  }

  // --- Private methods ---

  private loadCollection(): CardCollectionEntry[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        console.warn('Invalid collection data, resetting...');
        return [];
      }

      return parsed;
    } catch (err) {
      console.error('Failed to load collection, resetting:', err);
      // Clear corrupted data
      localStorage.removeItem(this.STORAGE_KEY);
      return [];
    }
  }

  private saveCollection(collection: CardCollectionEntry[]): void {
    try {
      const json = JSON.stringify(collection);

      // Check if data is too large (most browsers have ~5-10MB limit)
      if (json.length > 5 * 1024 * 1024) {
        console.error('Collection data too large for localStorage');
        return;
      }

      localStorage.setItem(this.STORAGE_KEY, json);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded. Collection not saved.');
        // Optionally: implement fallback storage or warn user
      } else {
        console.error('Failed to save collection:', err);
      }
    }
  }

  private isStarterCard(card: Card): boolean {
    // Common cards cost 1-3 are starter cards
    return card.rarity === Rarity.Common && card.cost <= 3;
  }

  private getUnlockCondition(card: Card): UnlockCondition {
    // Starter cards
    if (this.isStarterCard(card)) {
      return {
        type: 'starter',
        requirement: 0,
        description: 'Carte de départ',
      };
    }

    // Common cards
    if (card.rarity === Rarity.Common) {
      return {
        type: 'games_played',
        requirement: 3,
        description: 'Jouez 3 parties',
      };
    }

    // Uncommon cards
    if (card.rarity === Rarity.Uncommon) {
      return {
        type: 'games_played',
        requirement: 10,
        description: 'Jouez 10 parties',
      };
    }

    // Rare cards
    if (card.rarity === Rarity.Rare) {
      const winReq = Math.min(5 + Math.floor(card.cost / 2), 20);
      return {
        type: 'games_won',
        requirement: winReq,
        description: `Gagnez ${winReq} parties`,
      };
    }

    // Legendary cards
    if (card.rarity === Rarity.Legendary) {
      return {
        type: 'achievement',
        requirement: `win_streak_5`,
        description: 'Gagnez 5 parties consécutives',
      };
    }

    return {
      type: 'starter',
      requirement: 0,
      description: 'Carte de départ',
    };
  }

  private checkAchievement(achievement: string, stats: any): boolean {
    switch (achievement) {
      case 'win_streak_3':
        return stats.currentWinStreak >= 3;
      case 'win_streak_5':
        return stats.currentWinStreak >= 5;
      case 'win_streak_10':
        return stats.longestWinStreak >= 10;
      case 'games_50':
        return stats.totalGames >= 50;
      case 'wins_25':
        return stats.totalWins >= 25;
      default:
        return false;
    }
  }
}
