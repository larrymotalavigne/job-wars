import { Domain } from './card.model';

/**
 * Quest types for daily quest system
 */
export enum QuestType {
  GamesPlayed = 'games_played',
  GamesWon = 'games_won',
  WinWithDomain = 'win_with_domain',
  PlayCards = 'play_cards',
  DealDamage = 'deal_damage',
}

/**
 * Daily quest definition
 */
export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  requirement: number;      // How many to complete (e.g., win 3 games)
  progress: number;          // Current progress (0 to requirement)
  completed: boolean;        // Progress >= requirement
  claimed: boolean;          // Rewards collected
  reward: {
    coins: number;
    gems: number;
  };
  expiresAt: number;         // Timestamp when quest expires
  metadata?: QuestMetadata;  // Additional data (domain, etc.)
}

/**
 * Quest-specific metadata
 */
export interface QuestMetadata {
  domain?: Domain;           // For domain-specific quests
  [key: string]: any;
}

/**
 * Daily reward for login streak
 */
export interface DailyReward {
  day: number;               // Day 1-7
  claimed: boolean;
  reward: {
    coins: number;
    gems: number;
  };
}

/**
 * Daily quest state (persisted)
 */
export interface DailyQuestState {
  lastReset: number;         // Timestamp of last daily reset
  dailyQuests: Quest[];      // Current 3 daily quests
  loginStreak: number;       // Consecutive days logged in
  lastLoginDate: string;     // YYYY-MM-DD format
  dailyRewards: DailyReward[]; // 7-day login rewards
}

/**
 * Quest template for generation
 */
export interface QuestTemplate {
  type: QuestType;
  titleTemplate: string;     // e.g., "Gagner {0} parties"
  descriptionTemplate: string;
  difficulty: 'easy' | 'medium' | 'hard';
  requirement: number;
  reward: {
    coins: number;
    gems: number;
  };
  metadata?: Partial<QuestMetadata>;
}
