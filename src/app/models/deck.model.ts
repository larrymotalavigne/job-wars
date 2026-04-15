import { Domain } from './card.model';

export const DECK_MIN_CARDS = 40;
export const DECK_MAX_CARDS = 60;
export const DECK_MAX_COPIES = 3;
export const DECK_MAX_LEGENDARY_COPIES = 1;

export interface DeckEntry {
  cardId: string;
  quantity: number;
}

export interface Deck {
  id: string;
  name: string;
  entries: DeckEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface StarterDeck {
  id: string;
  name: string;
  description: string;
  entries: DeckEntry[];
  domains: Domain[];
}

export interface DeckStats {
  totalCards: number;
  costCurve: Record<number, number>;
  domainDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  rarityDistribution: Record<string, number>;
  averageCost: number;
}

export interface DeckValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DeckExport {
  version: 1;
  name: string;
  entries: DeckEntry[];
  exportedAt: string;
}

export interface DeckCode {
  v: 1;
  n: string;
  e: Array<{ i: string; q: number }>;
}
