/**
 * Currency system models for Job Wars
 * Supports two currency types: Coins (earned through gameplay) and Gems (premium/rare rewards)
 */

export type CurrencyType = 'Pièces' | 'Gemmes';

export interface CurrencyBalance {
  coins: number;
  gems: number;
  lifetimeCoins: number; // Total coins ever earned (for achievements)
  lifetimeGems: number;  // Total gems ever earned
  lastUpdated: number;   // Timestamp of last update
}

export interface CurrencyTransaction {
  id: string;            // Unique transaction ID
  type: CurrencyType;    // Currency type
  amount: number;        // Positive for additions, negative for spending
  reason: string;        // Description (e.g., "Victoire", "Achat carte dos")
  timestamp: number;     // When transaction occurred
  balance: number;       // Balance after transaction
}

export interface CurrencyReward {
  coins: number;
  gems: number;
  reason: string;
}
