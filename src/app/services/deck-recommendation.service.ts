import { Injectable } from '@angular/core';
import { Card, CardType, Domain, isJobCard, Rarity } from '../models/card.model';
import { Deck, DeckEntry, DeckStats } from '../models/deck.model';
import { CardService } from './card.service';
import { DeckService } from './deck.service';

export interface CardRecommendation {
  card: Card;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  category: 'synergy' | 'curve' | 'removal' | 'utility' | 'finisher';
}

export interface DeckAnalysis {
  costCurveIssues: string[];
  domainBalance: string[];
  typeBalance: string[];
  suggestions: string[];
  missingElements: string[];
  strengths: string[];
}

@Injectable({ providedIn: 'root' })
export class DeckRecommendationService {
  constructor(
    private cardService: CardService,
    private deckService: DeckService,
  ) {}

  /**
   * Analyze a deck and provide recommendations
   */
  analyzeDeck(deck: Deck): DeckAnalysis {
    const stats = this.deckService.computeStats(deck);
    const cards = this.deckService.expandDeck(deck);

    const costCurveIssues = this.analyzeCostCurve(stats);
    const domainBalance = this.analyzeDomainBalance(stats, cards);
    const typeBalance = this.analyzeTypeBalance(stats);
    const missingElements = this.findMissingElements(cards);
    const strengths = this.identifyStrengths(stats, cards);
    const suggestions = this.generateSuggestions(stats, cards);

    return {
      costCurveIssues,
      domainBalance,
      typeBalance,
      suggestions,
      missingElements,
      strengths,
    };
  }

  /**
   * Recommend cards to add to the deck
   */
  recommendCards(deck: Deck, limit: number = 10): CardRecommendation[] {
    const stats = this.deckService.computeStats(deck);
    const currentCards = this.deckService.expandDeck(deck);
    const allCards = this.cardService.getAllCards();

    const recommendations: CardRecommendation[] = [];

    // Get primary domains
    const domains = this.getPrimaryDomains(stats);

    // Find cards not in deck
    const currentCardIds = new Set(currentCards.map((c) => c.id));
    const availableCards = allCards.filter((c) => !currentCardIds.has(c.id));

    // Recommend based on different criteria
    recommendations.push(...this.recommendForCostCurve(availableCards, stats, domains));
    recommendations.push(...this.recommendForSynergy(availableCards, currentCards, domains));
    recommendations.push(...this.recommendUtilityCards(availableCards, currentCards, domains));
    recommendations.push(...this.recommendFinishers(availableCards, stats, domains));

    // Sort by priority and limit
    const sorted = recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return sorted.slice(0, limit);
  }

  /**
   * Find similar successful decks (if stats available)
   */
  findSimilarDecks(deck: Deck): Deck[] {
    const allDecks = this.deckService.getAllDecks();
    const stats = this.deckService.computeStats(deck);

    // Calculate similarity score for each deck
    const scored = allDecks
      .filter((d) => d.id !== deck.id)
      .map((d) => ({
        deck: d,
        score: this.calculateSimilarity(stats, this.deckService.computeStats(d)),
      }))
      .filter((s) => s.score > 0.5) // At least 50% similar
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 5).map((s) => s.deck);
  }

  // --- Private methods ---

  private analyzeCostCurve(stats: DeckStats): string[] {
    const issues: string[] = [];
    const curve = stats.costCurve;

    // Check for too many high-cost cards
    const highCostCount = Object.entries(curve)
      .filter(([cost]) => parseInt(cost) >= 6)
      .reduce((sum, [, count]) => sum + count, 0);

    if (highCostCount > stats.totalCards * 0.25) {
      issues.push('Trop de cartes coûteuses (6+) — risque de main lente');
    }

    // Check for too few low-cost cards
    const lowCostCount = (curve[1] || 0) + (curve[2] || 0);
    if (lowCostCount < stats.totalCards * 0.3) {
      issues.push('Pas assez de cartes économiques (1-2) — début de partie difficile');
    }

    // Check for gaps in curve
    for (let cost = 1; cost <= 5; cost++) {
      if (!curve[cost] || curve[cost] === 0) {
        issues.push(`Aucune carte à ${cost} coût — courbe de mana irrégulière`);
      }
    }

    return issues;
  }

  private analyzeDomainBalance(stats: DeckStats, cards: Card[]): string[] {
    const issues: string[] = [];
    const domains = Object.keys(stats.domainDistribution);

    if (domains.length > 3) {
      issues.push('Trop de domaines différents — manque de cohérence');
    }

    if (domains.length === 1) {
      issues.push('Mono-domaine — vulnérable aux contres spécifiques');
    }

    // Check for unbalanced splits in 2-color decks
    if (domains.length === 2) {
      const counts = Object.values(stats.domainDistribution);
      const ratio = Math.max(...counts) / Math.min(...counts);
      if (ratio > 3) {
        issues.push('Domaines déséquilibrés — ajoutez plus de cartes du domaine minoritaire');
      }
    }

    return issues;
  }

  private analyzeTypeBalance(stats: DeckStats): string[] {
    const issues: string[] = [];
    const types = stats.typeDistribution;

    const jobCount = types[CardType.Job] || 0;
    const eventCount = types[CardType.Event] || 0;
    const toolCount = types[CardType.Tool] || 0;

    if (jobCount < stats.totalCards * 0.5) {
      issues.push("Pas assez de jobs — base de l'équipe trop faible");
    }

    if (eventCount > stats.totalCards * 0.3) {
      issues.push("Trop d'événements — pas assez de présence sur le terrain");
    }

    if (toolCount === 0) {
      issues.push('Aucun outil — manque de synergie et de bonus');
    }

    return issues;
  }

  private findMissingElements(cards: Card[]): string[] {
    const missing: string[] = [];

    // Check for removal/interaction
    const hasRemoval = cards.some(
      (c) =>
        c.name.toLowerCase().includes('détruit') ||
        c.name.toLowerCase().includes('retire') ||
        (c.type === CardType.Event && c.name.toLowerCase().includes('attaque')),
    );

    if (!hasRemoval) {
      missing.push('Aucun sort de destruction — difficile de gérer les menaces adverses');
    }

    // Check for card draw
    const hasCardDraw = cards.some((c) => {
      const text = (c as any).effect || (c as any).ability || '';
      return text.toLowerCase().includes('pioche');
    });

    if (!hasCardDraw) {
      missing.push('Aucune pioche de cartes — risque de manquer de ressources');
    }

    // Check for win conditions
    const hasFinishers = cards.some((c) => c.cost >= 6);
    if (!hasFinishers) {
      missing.push('Aucune carte puissante (6+) — difficulté à finir la partie');
    }

    return missing;
  }

  private identifyStrengths(stats: DeckStats, cards: Card[]): string[] {
    const strengths: string[] = [];

    // Check curve
    const earlyGameCount = (stats.costCurve[1] || 0) + (stats.costCurve[2] || 0);
    if (earlyGameCount > stats.totalCards * 0.35) {
      strengths.push('Excellent début de partie — pression rapide');
    }

    // Check for construction synergy
    const constructionCards = cards.filter((c) => {
      const text = (c as any).ability || '';
      return text.toLowerCase().includes('construction');
    });
    if (constructionCards.length >= 5) {
      strengths.push('Synergie Construction — croissance à long terme');
    }

    // Check for tool synergy
    const toolCount = cards.filter((c) => c.type === CardType.Tool).length;
    if (toolCount >= 8) {
      strengths.push("Nombreux outils — bonus d'équipement significatifs");
    }

    // Check domain focus
    const domains = Object.keys(stats.domainDistribution);
    if (domains.length <= 2) {
      strengths.push('Domaines cohérents — synergie forte');
    }

    return strengths;
  }

  private generateSuggestions(stats: DeckStats, cards: Card[]): string[] {
    const suggestions: string[] = [];

    // Based on cost curve
    if (stats.averageCost < 2.5) {
      suggestions.push('Deck agressif — jouez vite et maintenez la pression');
    } else if (stats.averageCost > 3.5) {
      suggestions.push('Deck lent — concentrez-vous sur la survie en début de partie');
    }

    // Based on domains
    const domains = Object.keys(stats.domainDistribution);
    if (domains.includes(Domain.IT) && domains.includes(Domain.Police)) {
      suggestions.push('Combo IT/Police — misez sur la vitesse et les attaques surprises');
    }

    if (domains.includes(Domain.Crafts)) {
      suggestions.push("Domaine Artisan présent — équipez des outils pour maximiser l'effet");
    }

    return suggestions;
  }

  private recommendForCostCurve(
    available: Card[],
    stats: DeckStats,
    domains: Domain[],
  ): CardRecommendation[] {
    const recommendations: CardRecommendation[] = [];

    // Find gaps in cost curve
    const lowCostCount = (stats.costCurve[1] || 0) + (stats.costCurve[2] || 0);

    if (lowCostCount < stats.totalCards * 0.3) {
      // Recommend cheap cards
      const cheapCards = available
        .filter((c) => c.cost <= 2 && domains.includes(c.domain))
        .slice(0, 3);

      for (const card of cheapCards) {
        recommendations.push({
          card,
          reason: `Carte économique (coût ${card.cost}) pour améliorer le début de partie`,
          priority: 'high',
          category: 'curve',
        });
      }
    }

    return recommendations;
  }

  private recommendForSynergy(
    available: Card[],
    current: Card[],
    domains: Domain[],
  ): CardRecommendation[] {
    const recommendations: CardRecommendation[] = [];

    // Check for construction synergy
    const hasConstruction = current.some((c) => {
      const text = (c as any).ability || '';
      return text.toLowerCase().includes('construction');
    });

    if (hasConstruction) {
      const constructionCards = available
        .filter((c) => {
          const text = (c as any).ability || '';
          return text.toLowerCase().includes('construction') && domains.includes(c.domain);
        })
        .slice(0, 2);

      for (const card of constructionCards) {
        recommendations.push({
          card,
          reason: 'Synergie Construction avec vos cartes existantes',
          priority: 'medium',
          category: 'synergy',
        });
      }
    }

    return recommendations;
  }

  private recommendUtilityCards(
    available: Card[],
    current: Card[],
    domains: Domain[],
  ): CardRecommendation[] {
    const recommendations: CardRecommendation[] = [];

    // Recommend removal if missing
    const hasRemoval = current.some((c) => {
      const text = (c as any).effect || '';
      return text.toLowerCase().includes('détruit');
    });

    if (!hasRemoval) {
      const removalCards = available
        .filter((c) => {
          const text = (c as any).effect || '';
          return text.toLowerCase().includes('détruit') && domains.includes(c.domain);
        })
        .slice(0, 2);

      for (const card of removalCards) {
        recommendations.push({
          card,
          reason: 'Sort de destruction pour gérer les menaces',
          priority: 'high',
          category: 'removal',
        });
      }
    }

    // Recommend card draw
    const hasCardDraw = current.some((c) => {
      const text = (c as any).effect || (c as any).ability || '';
      return text.toLowerCase().includes('pioche');
    });

    if (!hasCardDraw) {
      const drawCards = available
        .filter((c) => {
          const text = (c as any).effect || (c as any).ability || '';
          return text.toLowerCase().includes('pioche') && domains.includes(c.domain);
        })
        .slice(0, 2);

      for (const card of drawCards) {
        recommendations.push({
          card,
          reason: "Pioche de cartes pour maintenir l'avantage",
          priority: 'medium',
          category: 'utility',
        });
      }
    }

    return recommendations;
  }

  private recommendFinishers(
    available: Card[],
    stats: DeckStats,
    domains: Domain[],
  ): CardRecommendation[] {
    const recommendations: CardRecommendation[] = [];

    const highCostCount = Object.entries(stats.costCurve)
      .filter(([cost]) => parseInt(cost) >= 6)
      .reduce((sum, [, count]) => sum + count, 0);

    if (highCostCount < 3) {
      const finishers = available
        .filter((c) => c.cost >= 6 && isJobCard(c) && domains.includes(c.domain))
        .sort((a, b) => {
          const aPower = isJobCard(a) ? a.productivity + a.resilience : 0;
          const bPower = isJobCard(b) ? b.productivity + b.resilience : 0;
          return bPower - aPower;
        })
        .slice(0, 2);

      for (const card of finishers) {
        recommendations.push({
          card,
          reason: 'Carte puissante pour terminer la partie',
          priority: 'medium',
          category: 'finisher',
        });
      }
    }

    return recommendations;
  }

  private getPrimaryDomains(stats: DeckStats): Domain[] {
    return Object.entries(stats.domainDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([domain]) => domain as Domain);
  }

  private calculateSimilarity(stats1: DeckStats, stats2: DeckStats): number {
    let score = 0;

    // Compare domains
    const domains1 = new Set(Object.keys(stats1.domainDistribution));
    const domains2 = new Set(Object.keys(stats2.domainDistribution));
    const commonDomains = [...domains1].filter((d) => domains2.has(d)).length;
    const totalDomains = Math.max(domains1.size, domains2.size);
    score += (commonDomains / totalDomains) * 0.4;

    // Compare average cost (within 0.5 is similar)
    const costDiff = Math.abs(stats1.averageCost - stats2.averageCost);
    score += Math.max(0, 1 - costDiff / 2) * 0.3;

    // Compare total cards
    const cardDiff = Math.abs(stats1.totalCards - stats2.totalCards);
    score += Math.max(0, 1 - cardDiff / 40) * 0.3;

    return score;
  }
}
