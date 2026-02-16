/**
 * Battle Pass system models
 * Provides free and premium progression tracks with rewards
 */

export type BattlePassTrack = 'free' | 'premium';
export type BattlePassRewardType = 'coins' | 'gems' | 'card_back' | 'avatar' | 'card_cosmetic';

/**
 * Individual reward at a specific level
 */
export interface BattlePassReward {
  level: number;
  track: BattlePassTrack;
  type: BattlePassRewardType;
  amount?: number;      // For coins/gems
  itemId?: string;      // For cosmetics/avatars
  itemName?: string;    // Display name
  claimed: boolean;
}

/**
 * Battle pass progression state (persisted)
 */
export interface BattlePassProgress {
  seasonId: string;
  currentLevel: number;
  currentXP: number;
  totalXP: number;
  isPremium: boolean;          // Has player purchased premium?
  rewards: BattlePassReward[]; // All rewards (free + premium)
  purchaseDate?: number;       // When premium was purchased
}

/**
 * XP source tracking
 */
export interface XPSource {
  type: 'game_win' | 'game_loss' | 'quest' | 'daily_login' | 'first_win';
  amount: number;
  timestamp: number;
  description: string;
}

/**
 * Calculate XP required for a level
 */
export function getXPForLevel(level: number): number {
  return 100 * level; // Linear: level 1 = 100 XP, level 2 = 200 XP, etc.
}

/**
 * Calculate total XP required to reach a level
 */
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

/**
 * Get level from total XP
 */
export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpSum = 0;

  while (xpSum + getXPForLevel(level) <= totalXP) {
    xpSum += getXPForLevel(level);
    level++;
  }

  return level - 1;
}

/**
 * Get current progress within level
 */
export function getProgressInLevel(totalXP: number, level: number): number {
  const totalForLevel = getTotalXPForLevel(level);
  return totalXP - totalForLevel;
}
