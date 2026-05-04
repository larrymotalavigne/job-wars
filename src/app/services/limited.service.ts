import { Injectable } from '@angular/core';
import { Card, Rarity } from '../models/card.model';
import { Deck, DeckEntry } from '../models/deck.model';
import { CardService } from './card.service';

export interface BoosterPack {
  id: string;
  cards: Card[];
  opened: boolean;
}

export interface SealedPool {
  id: string;
  createdAt: string;
  boosters: BoosterPack[];
  builtDeck?: Deck;
  cardPool: Card[];
}

export interface DraftState {
  id: string;
  createdAt: string;
  packs: BoosterPack[];
  currentPackIndex: number;
  currentPickIndex: number;
  pickedCards: Card[];
  aiPicks: Card[][]; // Cards picked by AI opponents
  isComplete: boolean;
}

const CARDS_PER_BOOSTER = 15;
const BOOSTERS_PER_SEALED = 6;
const BOOSTERS_PER_DRAFT = 3;
const PLAYERS_PER_DRAFT = 4; // Solo player + 3 AI

@Injectable({ providedIn: 'root' })
export class LimitedService {
  private readonly SEALED_STORAGE_KEY = 'jobwars-sealed';
  private readonly DRAFT_STORAGE_KEY = 'jobwars-draft';

  constructor(private cardService: CardService) {}

  // --- SEALED FORMAT ---

  /**
   * Generate a new sealed pool with 6 boosters
   */
  generateSealedPool(): SealedPool {
    const boosters: BoosterPack[] = [];

    for (let i = 0; i < BOOSTERS_PER_SEALED; i++) {
      boosters.push(this.generateBooster());
    }

    const cardPool = boosters.flatMap((b) => b.cards);

    const pool: SealedPool = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      boosters,
      cardPool,
    };

    this.saveSealedPool(pool);
    return pool;
  }

  /**
   * Get current sealed pool
   */
  getCurrentSealedPool(): SealedPool | null {
    try {
      const data = localStorage.getItem(this.SEALED_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn('Failed to load sealed pool:', err);
      return null;
    }
  }

  /**
   * Save sealed pool deck
   */
  saveSealedDeck(pool: SealedPool, deck: Deck): void {
    pool.builtDeck = deck;
    this.saveSealedPool(pool);
  }

  /**
   * Clear sealed pool
   */
  clearSealedPool(): void {
    localStorage.removeItem(this.SEALED_STORAGE_KEY);
  }

  // --- DRAFT FORMAT ---

  /**
   * Start a new draft
   */
  startDraft(): DraftState {
    const packs: BoosterPack[] = [];

    // Generate packs for all players
    for (let player = 0; player < PLAYERS_PER_DRAFT; player++) {
      for (let pack = 0; pack < BOOSTERS_PER_DRAFT; pack++) {
        packs.push(this.generateBooster());
      }
    }

    const draft: DraftState = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      packs,
      currentPackIndex: 0,
      currentPickIndex: 0,
      pickedCards: [],
      aiPicks: Array(PLAYERS_PER_DRAFT - 1)
        .fill(null)
        .map(() => []),
      isComplete: false,
    };

    this.saveDraftState(draft);
    return draft;
  }

  /**
   * Get current draft state
   */
  getCurrentDraft(): DraftState | null {
    try {
      const data = localStorage.getItem(this.DRAFT_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn('Failed to load draft:', err);
      return null;
    }
  }

  /**
   * Make a pick in the draft
   */
  makePick(draft: DraftState, cardId: string): DraftState {
    const currentPack = this.getCurrentPlayerPack(draft);
    if (!currentPack) {
      throw new Error('No pack available');
    }

    const cardIndex = currentPack.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error('Card not found in pack');
    }

    // Player picks the card
    const card = currentPack.cards.splice(cardIndex, 1)[0];
    draft.pickedCards.push(card);

    // AI players make picks
    this.aiDraftPicks(draft);

    // Advance to next pick
    draft.currentPickIndex++;

    // Check if pack is empty or draft is complete
    if (currentPack.cards.length === 0 || draft.currentPickIndex >= CARDS_PER_BOOSTER) {
      draft.currentPackIndex++;
      draft.currentPickIndex = 0;

      // Check if draft is complete
      if (draft.currentPackIndex >= BOOSTERS_PER_DRAFT * PLAYERS_PER_DRAFT) {
        draft.isComplete = true;
      }
    }

    this.saveDraftState(draft);
    return draft;
  }

  /**
   * Build deck from draft picks
   */
  buildDraftDeck(draft: DraftState, entries: DeckEntry[], name: string): Deck {
    const deck: Deck = {
      id: crypto.randomUUID(),
      name,
      entries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return deck;
  }

  /**
   * Clear draft state
   */
  clearDraft(): void {
    localStorage.removeItem(this.DRAFT_STORAGE_KEY);
  }

  // --- PRIVATE METHODS ---

  /**
   * Generate a random booster pack
   */
  private generateBooster(): BoosterPack {
    const allCards = this.cardService.getAllCards();
    const pack: Card[] = [];

    // Rarity distribution for a typical booster:
    // 10 commons, 3 uncommons, 1 rare, 1 rare/legendary
    const raritySlots = [
      ...Array(10).fill(Rarity.Common),
      ...Array(3).fill(Rarity.Uncommon),
      Rarity.Rare,
      Math.random() < 0.1 ? Rarity.Legendary : Rarity.Rare, // 10% chance of legendary
    ];

    // Shuffle to randomize order
    this.shuffleArray(raritySlots);

    for (const rarity of raritySlots) {
      const candidates = allCards.filter((c) => c.rarity === rarity && !pack.includes(c));
      if (candidates.length > 0) {
        const card = candidates[Math.floor(Math.random() * candidates.length)];
        pack.push(card);
      }
    }

    return {
      id: crypto.randomUUID(),
      cards: pack,
      opened: false,
    };
  }

  /**
   * Get the current pack for the player
   */
  private getCurrentPlayerPack(draft: DraftState): BoosterPack | null {
    const packIndexForPlayer = draft.currentPackIndex;
    if (packIndexForPlayer >= draft.packs.length) {
      return null;
    }
    return draft.packs[packIndexForPlayer];
  }

  /**
   * Simulate AI picks
   */
  private aiDraftPicks(draft: DraftState): void {
    // Simple AI: each AI picks the highest-value card from their pack
    for (let aiIndex = 0; aiIndex < draft.aiPicks.length; aiIndex++) {
      const aiPackIndex = draft.currentPackIndex + (aiIndex + 1);
      if (aiPackIndex >= draft.packs.length) continue;

      const aiPack = draft.packs[aiPackIndex];
      if (aiPack.cards.length === 0) continue;

      // AI picks highest rarity, then highest cost
      const bestCard = aiPack.cards.reduce((best, card) => {
        const rarityValue = {
          [Rarity.Legendary]: 4,
          [Rarity.Rare]: 3,
          [Rarity.Uncommon]: 2,
          [Rarity.Common]: 1,
        };

        const bestValue = rarityValue[best.rarity] * 100 + best.cost;
        const cardValue = rarityValue[card.rarity] * 100 + card.cost;

        return cardValue > bestValue ? card : best;
      });

      const cardIndex = aiPack.cards.indexOf(bestCard);
      const pickedCard = aiPack.cards.splice(cardIndex, 1)[0];
      draft.aiPicks[aiIndex].push(pickedCard);
    }
  }

  private saveSealedPool(pool: SealedPool): void {
    try {
      localStorage.setItem(this.SEALED_STORAGE_KEY, JSON.stringify(pool));
    } catch (err) {
      console.warn('Failed to save sealed pool:', err);
    }
  }

  private saveDraftState(draft: DraftState): void {
    try {
      localStorage.setItem(this.DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (err) {
      console.warn('Failed to save draft:', err);
    }
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
