/**
 * Card cosmetics system models
 * Visual customization for cards (non-gameplay)
 */

export enum CosmeticType {
  AlternateArt = 'alternate_art',
  Foil = 'foil',
  Animation = 'animation',
  CardBack = 'card_back'
}

export enum CosmeticRarity {
  Common = 'Commune',
  Rare = 'Rare',
  Epic = 'Épique',
  Legendary = 'Légendaire'
}

export type CosmeticSource = 'battle_pass' | 'quest' | 'achievement' | 'shop';

/**
 * Card cosmetic definition
 */
export interface CardCosmetic {
  id: string;
  cardId?: string;         // Specific card (undefined for card backs)
  type: CosmeticType;
  name: string;
  rarity: CosmeticRarity;
  unlocked: boolean;
  source: CosmeticSource;
  imageUrl?: string;       // For alternate art
  effectClass?: string;    // CSS class for foil/animation
  description?: string;
}

/**
 * Player's cosmetic loadout (persisted)
 */
export interface CosmeticLoadout {
  cardCosmetics: Map<string, string>; // cardId -> cosmeticId
  activeCardBack: string;              // Active card back ID
}

/**
 * Cosmetic collection state
 */
export interface CosmeticsState {
  unlockedCosmetics: string[];         // Array of cosmetic IDs
  loadout: {
    cardCosmetics: { [cardId: string]: string }; // For JSON serialization
    activeCardBack: string;
  };
}
