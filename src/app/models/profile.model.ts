/**
 * Player profile and customization models
 */

export interface PlayerProfile {
  playerId: string;
  displayName: string;
  avatarId: string;
  titleId?: string;
  badges: string[];          // Up to 3 badge IDs
  level: number;
  xp: number;
  profileCreated: number;
}

export interface PlayerAvatar {
  id: string;
  name: string;
  imageUrl?: string;
  iconClass: string;         // PrimeIcons class
  unlocked: boolean;
  source: 'starter' | 'level' | 'battle_pass' | 'achievement';
  unlockRequirement?: string;
}

export interface PlayerTitle {
  id: string;
  title: string;
  unlocked: boolean;
  requirement: string;
  source: 'achievement' | 'ranked' | 'battle_pass' | 'level';
}

export interface PlayerBadge {
  id: string;
  name: string;
  iconClass: string;
  unlocked: boolean;
  requirement: string;
  source: 'achievement' | 'ranked' | 'collection';
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXP(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100));
}

/**
 * Calculate XP required for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  return ((currentLevel + 1) ** 2) * 100;
}

/**
 * Calculate XP progress to next level
 */
export function getXPProgress(totalXP: number): { current: number; required: number; percentage: number } {
  const level = getLevelFromXP(totalXP);
  const xpForCurrentLevel = (level ** 2) * 100;
  const xpForNextLevel = ((level + 1) ** 2) * 100;
  const current = totalXP - xpForCurrentLevel;
  const required = xpForNextLevel - xpForCurrentLevel;
  const percentage = Math.floor((current / required) * 100);

  return { current, required, percentage };
}
