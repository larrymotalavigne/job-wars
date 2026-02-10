import { Injectable } from '@angular/core';
import { Card, CardType, Domain, Rarity } from '../models/card.model';
import { ALL_CARDS } from '../data';

export interface CardFilter {
  domains?: Domain[];
  types?: CardType[];
  rarities?: Rarity[];
  costMin?: number;
  costMax?: number;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class CardService {
  getAllCards(): Card[] {
    return ALL_CARDS;
  }

  getCardById(id: string): Card | undefined {
    return ALL_CARDS.find(c => c.id === id);
  }

  getCardsByDomain(domain: Domain): Card[] {
    return ALL_CARDS.filter(c => c.domain === domain);
  }

  filterCards(filter: CardFilter): Card[] {
    return ALL_CARDS.filter(card => {
      if (filter.domains?.length && !filter.domains.includes(card.domain)) return false;
      if (filter.types?.length && !filter.types.includes(card.type)) return false;
      if (filter.rarities?.length && !filter.rarities.includes(card.rarity)) return false;
      if (filter.costMin != null && card.cost < filter.costMin) return false;
      if (filter.costMax != null && card.cost > filter.costMax) return false;
      if (filter.search) {
        const term = filter.search.toLowerCase();
        const searchable = [card.name, card.domain, card.type].join(' ').toLowerCase();
        if (!searchable.includes(term)) return false;
      }
      return true;
    });
  }

  getDomains(): Domain[] {
    return Object.values(Domain);
  }

  getMaxCost(): number {
    return Math.max(...ALL_CARDS.map(c => c.cost));
  }
}
