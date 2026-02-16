/**
 * Ranked mode models for competitive gameplay
 */

export enum RankTier {
  Bronze = 'Bronze',
  Silver = 'Argent',
  Gold = 'Or',
  Platinum = 'Platine',
  Diamond = 'Diamant',
  Master = 'Maître'
}

/**
 * Rank information for a player
 */
export interface RankInfo {
  tier: RankTier;
  division: number;      // 1-3 (3 is lowest in tier, 1 is highest)
  mmr: number;           // Match Making Rating (ELO-based)
  stars: number;         // Current stars in division
  starsRequired: number; // Stars needed to advance
}

/**
 * Result of a ranked match
 */
export interface RankedMatch {
  id: string;
  timestamp: number;
  result: 'win' | 'loss';
  opponentName: string;
  opponentMMR: number;
  mmrChange: number;     // Positive for win, negative for loss
  rankBefore: string;    // e.g., "Gold 2"
  rankAfter: string;     // e.g., "Gold 1"
}

/**
 * Ranked stats (persisted)
 */
export interface RankedStats {
  currentRank: RankInfo;
  seasonHighRank: RankInfo;
  seasonId: string;           // Current season identifier
  rankedGames: number;
  rankedWins: number;
  matchHistory: RankedMatch[]; // Last 20 matches
}

/**
 * Season information
 */
export interface Season {
  id: string;
  name: string;
  startDate: number;
  endDate: number;
  isActive: boolean;
}

/**
 * MMR ranges for each tier
 */
export const MMR_RANGES: Record<RankTier, { min: number; max: number }> = {
  [RankTier.Bronze]: { min: 0, max: 999 },
  [RankTier.Silver]: { min: 1000, max: 1299 },
  [RankTier.Gold]: { min: 1300, max: 1599 },
  [RankTier.Platinum]: { min: 1600, max: 1899 },
  [RankTier.Diamond]: { min: 1900, max: 2199 },
  [RankTier.Master]: { min: 2200, max: 9999 }
};

/**
 * Stars required per tier
 */
export const STARS_PER_TIER: Record<RankTier, number> = {
  [RankTier.Bronze]: 2,
  [RankTier.Silver]: 3,
  [RankTier.Gold]: 4,
  [RankTier.Platinum]: 5,
  [RankTier.Diamond]: 5,
  [RankTier.Master]: 5
};

/**
 * Get tier from MMR
 */
export function getTierFromMMR(mmr: number): RankTier {
  if (mmr >= 2200) return RankTier.Master;
  if (mmr >= 1900) return RankTier.Diamond;
  if (mmr >= 1600) return RankTier.Platinum;
  if (mmr >= 1300) return RankTier.Gold;
  if (mmr >= 1000) return RankTier.Silver;
  return RankTier.Bronze;
}

/**
 * Format rank as string
 */
export function formatRank(rank: RankInfo): string {
  return `${rank.tier} ${rank.division}`;
}
