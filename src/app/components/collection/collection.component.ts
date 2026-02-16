import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollectionService, CardCollectionEntry, CollectionStats } from '../../services/collection.service';
import { StatsService } from '../../services/stats.service';
import { CardService } from '../../services/card.service';
import { Card, Rarity, Domain, CardType } from '../../models/card.model';
import { CardComponent } from '../card/card.component';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { Button } from 'primeng/button';
import { ProgressBar } from 'primeng/progressbar';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { Slider } from 'primeng/slider';

interface FilteredCard {
  card: Card;
  entry: CardCollectionEntry;
  unlockedDate?: string; // For sorting by unlock date
}

interface CollectionFilters {
  rarity: Rarity | 'all';
  domain: Domain | 'all';
  status: 'all' | 'unlocked' | 'locked';
  type: CardType | 'all';
  costMin: number;
  costMax: number;
  searchTerm: string;
  sortBy: 'name' | 'cost' | 'rarity' | 'unlocked_date';
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-collection',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Button,
    ProgressBar,
    Select,
    InputText,
    Tag,
    Slider,
  ],
  templateUrl: './collection.component.html',
  styleUrl: './collection.component.scss',
})
export class CollectionComponent implements OnInit {
  stats: CollectionStats | null = null;
  allCards: FilteredCard[] = [];
  filteredCards: FilteredCard[] = [];
  recentUnlocks: CardCollectionEntry[] = [];

  // Filters
  private readonly FILTERS_STORAGE_KEY = 'jobwars-collection-filters';
  filters: CollectionFilters = {
    rarity: 'all',
    domain: 'all',
    status: 'all',
    type: 'all',
    costMin: 0,
    costMax: 10,
    searchTerm: '',
    sortBy: 'name',
    sortOrder: 'asc'
  };
  costRange: number[] = [0, 10];

  rarityOptions = [
    { label: 'Toutes les raretés', value: 'all' },
    { label: 'Commune', value: Rarity.Common },
    { label: 'Peu commune', value: Rarity.Uncommon },
    { label: 'Rare', value: Rarity.Rare },
    { label: 'Légendaire', value: Rarity.Legendary },
  ];

  domainOptions = [
    { label: 'Tous les domaines', value: 'all' },
    { label: 'IT', value: Domain.IT },
    { label: 'Police', value: Domain.Police },
    { label: 'Artisan', value: Domain.Crafts },
    { label: 'Enseignant', value: Domain.Teacher },
    { label: 'Urbanisme', value: Domain.UrbanPlanning },
    { label: 'Justice', value: Domain.Justice },
    { label: 'Santé', value: Domain.Health },
    { label: 'Finance', value: Domain.Finance },
  ];

  statusOptions = [
    { label: 'Toutes', value: 'all' },
    { label: 'Débloquées', value: 'unlocked' },
    { label: 'Verrouillées', value: 'locked' },
  ];

  typeOptions = [
    { label: 'Tous les types', value: 'all' },
    { label: 'Emplois', value: CardType.Job },
    { label: 'Outils', value: CardType.Tool },
    { label: 'Événements', value: CardType.Event },
  ];

  sortByOptions = [
    { label: 'Nom', value: 'name' },
    { label: 'Coût', value: 'cost' },
    { label: 'Rareté', value: 'rarity' },
    { label: 'Date de déverrouillage', value: 'unlocked_date' },
  ];

  sortOrderOptions = [
    { label: 'Croissant', value: 'asc' },
    { label: 'Décroissant', value: 'desc' },
  ];

  constructor(
    private collectionService: CollectionService,
    private cardService: CardService,
    private statsService: StatsService
  ) {}

  ngOnInit(): void {
    this.loadSavedFilters();
    this.loadCollection();
  }

  loadCollection(): void {
    // Get stats
    this.stats = this.collectionService.getCollectionStats();

    // Get all cards with collection status
    const allGameCards = this.cardService.getAllCards();
    const unlockedCards = this.collectionService.getUnlockedCards();
    const unlockedIds = new Set(unlockedCards.map(c => c.id));

    this.allCards = allGameCards.map(card => {
      const isUnlocked = unlockedIds.has(card.id);
      return {
        card,
        entry: {
          cardId: card.id,
          unlocked: isUnlocked,
          unlockCondition: this.getCardUnlockCondition(card),
        },
      };
    });

    // Get recent unlocks from stats
    this.recentUnlocks = this.stats.recentUnlocks;

    // Apply filters
    this.applyFilters();
  }

  private getCardUnlockCondition(card: Card): any {
    // This mirrors the logic from CollectionService
    if (card.cost <= 3 && card.rarity === Rarity.Common) {
      return { type: 'starter', requirement: 0, description: 'Carte de départ' };
    } else if (card.rarity === Rarity.Common) {
      return { type: 'games_played', requirement: 3, description: 'parties jouées' };
    } else if (card.rarity === Rarity.Uncommon) {
      return { type: 'games_played', requirement: 10, description: 'parties jouées' };
    } else if (card.rarity === Rarity.Rare) {
      const winsRequired = Math.max(5, Math.min(20, card.cost * 2));
      return { type: 'games_won', requirement: winsRequired, description: 'victoires' };
    } else {
      return { type: 'achievement', requirement: 'win_streak_5', description: 'Série de 5 victoires' };
    }
  }

  applyFilters(): void {
    // Filter
    this.filteredCards = this.allCards.filter(({ card, entry }) => {
      // Rarity filter
      if (this.filters.rarity !== 'all' && card.rarity !== this.filters.rarity) {
        return false;
      }

      // Domain filter
      if (this.filters.domain !== 'all' && card.domain !== this.filters.domain) {
        return false;
      }

      // Status filter
      if (this.filters.status === 'unlocked' && !entry.unlocked) {
        return false;
      }
      if (this.filters.status === 'locked' && entry.unlocked) {
        return false;
      }

      // Type filter
      if (this.filters.type !== 'all' && card.type !== this.filters.type) {
        return false;
      }

      // Cost range filter
      if (card.cost < this.filters.costMin || card.cost > this.filters.costMax) {
        return false;
      }

      // Search filter
      if (this.filters.searchTerm) {
        const term = this.filters.searchTerm.toLowerCase();
        const nameMatch = card.name.toLowerCase().includes(term);
        return nameMatch;
      }

      return true;
    });

    // Sort
    this.filteredCards.sort((a, b) => {
      let comparison = 0;

      switch (this.filters.sortBy) {
        case 'name':
          comparison = a.card.name.localeCompare(b.card.name);
          break;
        case 'cost':
          comparison = a.card.cost - b.card.cost;
          break;
        case 'rarity':
          const rarityOrder = { [Rarity.Common]: 0, [Rarity.Uncommon]: 1, [Rarity.Rare]: 2, [Rarity.Legendary]: 3 };
          comparison = rarityOrder[a.card.rarity] - rarityOrder[b.card.rarity];
          break;
        case 'unlocked_date':
          // Sort by unlock date (most recent first for desc)
          const aDate = a.unlockedDate ? new Date(a.unlockedDate).getTime() : 0;
          const bDate = b.unlockedDate ? new Date(b.unlockedDate).getTime() : 0;
          comparison = aDate - bDate;
          break;
      }

      return this.filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    // Save filters
    this.saveFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onCostRangeChange(): void {
    this.filters.costMin = this.costRange[0];
    this.filters.costMax = this.costRange[1];
    this.applyFilters();
  }

  applyPreset(preset: 'recent' | 'legendary' | 'locked'): void {
    switch (preset) {
      case 'recent':
        this.filters.status = 'unlocked';
        this.filters.sortBy = 'unlocked_date';
        this.filters.sortOrder = 'desc';
        break;
      case 'legendary':
        this.filters.rarity = Rarity.Legendary;
        this.filters.status = 'all';
        break;
      case 'locked':
        this.filters.status = 'locked';
        this.filters.sortBy = 'name';
        this.filters.sortOrder = 'asc';
        break;
    }
    this.applyFilters();
  }

  private loadSavedFilters(): void {
    try {
      const saved = localStorage.getItem(this.FILTERS_STORAGE_KEY);
      if (saved) {
        const savedFilters = JSON.parse(saved) as CollectionFilters;
        this.filters = { ...this.filters, ...savedFilters };
        this.costRange = [this.filters.costMin, this.filters.costMax];
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }

  private saveFilters(): void {
    try {
      localStorage.setItem(this.FILTERS_STORAGE_KEY, JSON.stringify(this.filters));
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  }

  getProgressPercentage(entry: CardCollectionEntry): number {
    if (entry.unlocked) return 100;
    const condition = entry.unlockCondition;
    const stats = this.statsService.getPlayerStats();

    let currentProgress = 0;
    let requirement = 0;

    if (condition.type === 'games_played') {
      currentProgress = stats.totalGames;
      requirement = condition.requirement as number;
    } else if (condition.type === 'games_won') {
      currentProgress = stats.totalWins;
      requirement = condition.requirement as number;
    } else if (condition.type === 'achievement') {
      currentProgress = stats.longestWinStreak;
      requirement = 5; // win_streak_5
    } else {
      return 0;
    }

    if (requirement === 0) return 0;
    return Math.min(100, (currentProgress / requirement) * 100);
  }

  getProgressLabel(entry: CardCollectionEntry): string {
    if (entry.unlocked) return 'Débloquée';
    const condition = entry.unlockCondition;
    const stats = this.statsService.getPlayerStats();

    let currentProgress = 0;
    let requirement = 0;

    if (condition.type === 'games_played') {
      currentProgress = stats.totalGames;
      requirement = condition.requirement as number;
    } else if (condition.type === 'games_won') {
      currentProgress = stats.totalWins;
      requirement = condition.requirement as number;
    } else if (condition.type === 'achievement') {
      currentProgress = stats.longestWinStreak;
      requirement = 5;
    } else if (condition.type === 'starter') {
      return 'Débloquée au départ';
    } else {
      return 'Verrouillée';
    }

    return `${currentProgress}/${requirement} ${condition.description}`;
  }

  getRarityColor(rarity: Rarity | string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const r = typeof rarity === 'string' ? rarity : rarity;
    switch (r) {
      case Rarity.Common:
      case 'Common':
        return 'secondary';
      case Rarity.Uncommon:
      case 'Uncommon':
        return 'info';
      case Rarity.Rare:
      case 'Rare':
        return 'warn';
      case Rarity.Legendary:
      case 'Legendary':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getRarityLabel(rarity: Rarity): string {
    switch (rarity) {
      case Rarity.Common:
        return 'Commune';
      case Rarity.Uncommon:
        return 'Peu commune';
      case Rarity.Rare:
        return 'Rare';
      case Rarity.Legendary:
        return 'Légendaire';
      default:
        return rarity;
    }
  }

  getCardByEntry(entry: CardCollectionEntry): Card | undefined {
    return this.cardService.getCardById(entry.cardId);
  }

  formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  resetFilters(): void {
    this.filters = {
      rarity: 'all',
      domain: 'all',
      status: 'all',
      type: 'all',
      costMin: 0,
      costMax: 10,
      searchTerm: '',
      sortBy: 'name',
      sortOrder: 'asc'
    };
    this.costRange = [0, 10];
    this.applyFilters();
  }

  getRarityStats(rarityKey: string): { total: number; unlocked: number } {
    if (!this.stats) return { total: 0, unlocked: 0 };
    return this.stats.byRarity[rarityKey as Rarity];
  }
}
