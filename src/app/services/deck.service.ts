import { Injectable } from '@angular/core';
import { CardService } from './card.service';
import { Card, Rarity } from '../models/card.model';
import {
  Deck,
  DeckEntry,
  DeckExport,
  DeckStats,
  DeckValidation,
  DECK_MAX_COPIES,
  DECK_MAX_LEGENDARY_COPIES,
  DECK_MIN_CARDS,
} from '../models/deck.model';

const STORAGE_KEY = 'jobwars-decks';

@Injectable({ providedIn: 'root' })
export class DeckService {
  constructor(private cardService: CardService) {}

  private loadDecks(): Deck[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveDecks(decks: Deck[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  }

  getAllDecks(): Deck[] {
    return this.loadDecks();
  }

  getDeckById(id: string): Deck | undefined {
    return this.loadDecks().find(d => d.id === id);
  }

  createDeck(name: string): Deck {
    const deck: Deck = {
      id: crypto.randomUUID(),
      name,
      entries: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const decks = this.loadDecks();
    decks.push(deck);
    this.saveDecks(decks);
    return deck;
  }

  saveDeck(deck: Deck) {
    deck.updatedAt = new Date().toISOString();
    const decks = this.loadDecks();
    const idx = decks.findIndex(d => d.id === deck.id);
    if (idx >= 0) {
      decks[idx] = deck;
    } else {
      decks.push(deck);
    }
    this.saveDecks(decks);
  }

  deleteDeck(id: string) {
    const decks = this.loadDecks().filter(d => d.id !== id);
    this.saveDecks(decks);
  }

  duplicateDeck(deckId: string, newName: string): Deck | undefined {
    const source = this.getDeckById(deckId);
    if (!source) return undefined;
    const copy: Deck = {
      id: crypto.randomUUID(),
      name: newName,
      entries: source.entries.map(e => ({ ...e })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const decks = this.loadDecks();
    decks.push(copy);
    this.saveDecks(decks);
    return copy;
  }

  getMaxCopies(cardId: string): number {
    const card = this.cardService.getCardById(cardId);
    if (!card) return 0;
    return card.rarity === Rarity.Legendary ? DECK_MAX_LEGENDARY_COPIES : DECK_MAX_COPIES;
  }

  getCardQuantity(deck: Deck, cardId: string): number {
    return deck.entries.find(e => e.cardId === cardId)?.quantity ?? 0;
  }

  addCard(deck: Deck, cardId: string): boolean {
    const max = this.getMaxCopies(cardId);
    const entry = deck.entries.find(e => e.cardId === cardId);
    if (entry) {
      if (entry.quantity >= max) return false;
      entry.quantity++;
    } else {
      if (max <= 0) return false;
      deck.entries.push({ cardId, quantity: 1 });
    }
    return true;
  }

  removeCard(deck: Deck, cardId: string) {
    const entry = deck.entries.find(e => e.cardId === cardId);
    if (!entry) return;
    entry.quantity--;
    if (entry.quantity <= 0) {
      deck.entries = deck.entries.filter(e => e.cardId !== cardId);
    }
  }

  setCardQuantity(deck: Deck, cardId: string, qty: number) {
    const max = this.getMaxCopies(cardId);
    const clamped = Math.max(0, Math.min(qty, max));
    if (clamped === 0) {
      deck.entries = deck.entries.filter(e => e.cardId !== cardId);
      return;
    }
    const entry = deck.entries.find(e => e.cardId === cardId);
    if (entry) {
      entry.quantity = clamped;
    } else {
      deck.entries.push({ cardId, quantity: clamped });
    }
  }

  validateDeck(deck: Deck): DeckValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const totalCards = deck.entries.reduce((sum, e) => sum + e.quantity, 0);

    if (totalCards < DECK_MIN_CARDS) {
      errors.push(`Minimum ${DECK_MIN_CARDS} cartes requis (${totalCards} actuellement)`);
    }

    for (const entry of deck.entries) {
      const card = this.cardService.getCardById(entry.cardId);
      if (!card) {
        errors.push(`Carte inconnue : ${entry.cardId}`);
        continue;
      }
      const max = this.getMaxCopies(entry.cardId);
      if (entry.quantity > max) {
        errors.push(`${card.name} : max ${max} copie${max > 1 ? 's' : ''} (${entry.quantity} dans le deck)`);
      }
    }

    const domains = new Set<string>();
    for (const entry of deck.entries) {
      const card = this.cardService.getCardById(entry.cardId);
      if (card) domains.add(card.domain);
    }
    if (domains.size > 4) {
      warnings.push(`${domains.size} domaines différents — envisagez de vous concentrer`);
    }

    return {
      isValid: errors.length === 0 && totalCards >= DECK_MIN_CARDS,
      errors,
      warnings,
    };
  }

  computeStats(deck: Deck): DeckStats {
    const costCurve: Record<number, number> = {};
    const domainDistribution: Record<string, number> = {};
    const typeDistribution: Record<string, number> = {};
    const rarityDistribution: Record<string, number> = {};
    let totalCards = 0;
    let totalCost = 0;

    for (const entry of deck.entries) {
      const card = this.cardService.getCardById(entry.cardId);
      if (!card) continue;

      totalCards += entry.quantity;
      totalCost += card.cost * entry.quantity;

      costCurve[card.cost] = (costCurve[card.cost] ?? 0) + entry.quantity;
      domainDistribution[card.domain] = (domainDistribution[card.domain] ?? 0) + entry.quantity;
      typeDistribution[card.type] = (typeDistribution[card.type] ?? 0) + entry.quantity;
      rarityDistribution[card.rarity] = (rarityDistribution[card.rarity] ?? 0) + entry.quantity;
    }

    return {
      totalCards,
      costCurve,
      domainDistribution,
      typeDistribution,
      rarityDistribution,
      averageCost: totalCards > 0 ? totalCost / totalCards : 0,
    };
  }

  exportDeck(deck: Deck): string {
    const data: DeckExport = {
      version: 1,
      name: deck.name,
      entries: deck.entries.map(e => ({ ...e })),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  importDeck(json: string): Deck {
    const data: DeckExport = JSON.parse(json);
    if (data.version !== 1) {
      throw new Error('Format de deck non reconnu');
    }

    // Validate card IDs exist
    for (const entry of data.entries) {
      if (!this.cardService.getCardById(entry.cardId)) {
        throw new Error(`Carte inconnue : ${entry.cardId}`);
      }
      if (entry.quantity < 1) {
        throw new Error(`Quantité invalide pour ${entry.cardId}`);
      }
    }

    const deck: Deck = {
      id: crypto.randomUUID(),
      name: data.name,
      entries: data.entries.map(e => ({ ...e })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const decks = this.loadDecks();
    decks.push(deck);
    this.saveDecks(decks);
    return deck;
  }

  expandDeck(deck: Deck): Card[] {
    const cards: Card[] = [];
    for (const entry of deck.entries) {
      const card = this.cardService.getCardById(entry.cardId);
      if (!card) continue;
      for (let i = 0; i < entry.quantity; i++) {
        cards.push(card);
      }
    }
    cards.sort((a, b) => {
      if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
      return a.cost - b.cost;
    });
    return cards;
  }
}
