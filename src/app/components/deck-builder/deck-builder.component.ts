import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { Slider } from 'primeng/slider';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { Tag } from 'primeng/tag';
import { Splitter } from 'primeng/splitter';
import { Tabs, Tab, TabList, TabPanel, TabPanels } from 'primeng/tabs';
import { Drawer } from 'primeng/drawer';
import { Textarea } from 'primeng/textarea';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CardComponent, CardDesign, ImageStyle } from '../card/card.component';
import { DeckStatsComponent } from './deck-stats/deck-stats.component';
import { CardService } from '../../services/card.service';
import { DeckService } from '../../services/deck.service';
import {
  DeckRecommendationService,
  CardRecommendation,
  DeckAnalysis,
} from '../../services/deck-recommendation.service';
import {
  Card,
  CardType,
  Domain,
  Rarity,
  DOMAIN_COLORS,
  DOMAIN_ICONS,
  RARITY_COLORS,
  isJobCard,
} from '../../models/card.model';
import {
  Deck,
  DeckEntry,
  DeckStats,
  DeckValidation,
  DECK_MIN_CARDS,
  DECK_MAX_CARDS,
} from '../../models/deck.model';

interface DeckEntryView {
  card: Card;
  quantity: number;
  maxCopies: number;
}

interface DeckCodePreview {
  name: string;
  entries: DeckEntry[];
  totalCards: number;
  cardNames: string[];
}

@Component({
  selector: 'app-deck-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MultiSelect,
    Select,
    Slider,
    InputText,
    Button,
    Dialog,
    ConfirmDialog,
    Toast,
    Tooltip,
    Tag,
    Splitter,
    Tabs,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Drawer,
    Textarea,
    CardComponent,
    DeckStatsComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './deck-builder.component.html',
  styleUrl: './deck-builder.component.scss',
})
export class DeckBuilderComponent implements OnInit {
  // Browse panel
  filteredCards: Card[] = [];
  detailCard: Card | null = null;
  showDetail = false;
  currentDesign: CardDesign = 'classique';
  currentImageStyle: ImageStyle = 'pixel';
  imageStyleOptions: { label: string; value: ImageStyle }[] = [
    { label: 'Pixel Art', value: 'pixel' },
    { label: 'Pixel Art v2', value: 'pixel-v2' },
    { label: 'Réaliste', value: 'realistic' },
    { label: 'Icône', value: 'icone' },
  ];

  // Filters
  domainOptions = Object.values(Domain).map((d) => ({ label: d, value: d }));
  typeOptions = Object.values(CardType).map((t) => ({ label: t, value: t }));
  rarityOptions = Object.values(Rarity).map((r) => ({ label: r, value: r }));
  selectedDomains: Domain[] = [];
  selectedTypes: CardType[] = [];
  selectedRarities: Rarity[] = [];
  costRange: number[] = [0, 7];
  searchText = '';

  // Deck state
  currentDeck: Deck | null = null;
  deckName = 'Nouveau Deck';
  savedDecks: Deck[] = [];
  deckSelectorOptions: { label: string; value: string }[] = [];
  selectedDeckId: string | null = null;

  // Deck panel
  deckEntries: DeckEntryView[] = [];
  deckStats: DeckStats = {
    totalCards: 0,
    costCurve: {},
    domainDistribution: {},
    typeDistribution: {},
    rarityDistribution: {},
    averageCost: 0,
  };
  deckValidation: DeckValidation = { isValid: false, errors: [], warnings: [] };
  groupBy = 'type';
  groupByOptions = [
    { label: 'Type', value: 'type' },
    { label: 'Domaine', value: 'domain' },
    { label: 'Coût', value: 'cost' },
  ];

  // Mobile drawer
  showDeckDrawer = false;

  // Import dialog — JSON (legacy)
  showImportDialog = false;
  importJson = '';

  // Deck code export dialog
  showExportCodeDialog = false;
  exportedCode = '';

  // Deck code import dialog
  showImportCodeDialog = false;
  importCode = '';
  importCodePreview: DeckCodePreview | null = null;
  importCodeError = '';

  // Recommendations
  deckAnalysis: DeckAnalysis | null = null;
  recommendations: CardRecommendation[] = [];

  DECK_MIN_CARDS = DECK_MIN_CARDS;
  DECK_MAX_CARDS = DECK_MAX_CARDS;
  DOMAIN_COLORS = DOMAIN_COLORS;
  DOMAIN_ICONS = DOMAIN_ICONS;
  RARITY_COLORS = RARITY_COLORS;

  constructor(
    private cardService: CardService,
    private deckService: DeckService,
    private recommendationService: DeckRecommendationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.costRange = [0, this.cardService.getMaxCost()];
    this.applyFilters();
    this.refreshSavedDecks();

    this.route.queryParams.subscribe((qp) => {
      const code = qp['code'];
      if (code) {
        this.openImportCodeDialogWithValue(code);
      }
    });

    this.route.params.subscribe((params) => {
      if (params['deckId']) {
        this.loadDeck(params['deckId']);
      } else {
        this.newDeck();
      }
    });
  }

  // --- Filters ---

  applyFilters() {
    this.filteredCards = this.cardService.filterCards({
      domains: this.selectedDomains,
      types: this.selectedTypes,
      rarities: this.selectedRarities,
      costMin: this.costRange[0],
      costMax: this.costRange[1],
      search: this.searchText,
    });
  }

  // --- Deck CRUD ---

  newDeck() {
    this.currentDeck = {
      id: crypto.randomUUID(),
      name: 'Nouveau Deck',
      entries: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.deckName = this.currentDeck.name;
    this.selectedDeckId = null;
    this.refreshDeckView();
  }

  saveDeck() {
    if (!this.currentDeck) return;
    if (!this.deckValidation.isValid) return;
    this.currentDeck.name = this.deckName;
    this.deckService.saveDeck(this.currentDeck);
    this.refreshSavedDecks();
    this.selectedDeckId = this.currentDeck.id;
    this.messageService.add({
      severity: 'success',
      summary: 'Deck sauvegardé',
      detail: `"${this.currentDeck.name}" a été sauvegardé.`,
    });
  }

  loadDeck(deckId: string) {
    const deck = this.deckService.getDeckById(deckId);
    if (!deck) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Deck non trouvé.' });
      return;
    }
    this.currentDeck = { ...deck, entries: deck.entries.map((e) => ({ ...e })) };
    this.deckName = this.currentDeck.name;
    this.selectedDeckId = deckId;
    this.refreshDeckView();
  }

  onDeckSelect() {
    if (this.selectedDeckId) {
      this.loadDeck(this.selectedDeckId);
    }
  }

  deleteDeck(deckId: string) {
    const deck = this.deckService.getDeckById(deckId);
    this.confirmationService.confirm({
      message: `Supprimer le deck "${deck?.name ?? deckId}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.deckService.deleteDeck(deckId);
        this.refreshSavedDecks();
        if (this.currentDeck?.id === deckId) {
          this.newDeck();
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Supprimé',
          detail: 'Le deck a été supprimé.',
        });
      },
    });
  }

  duplicateDeck(deckId: string) {
    const source = this.deckService.getDeckById(deckId);
    if (!source) return;
    const copy = this.deckService.duplicateDeck(deckId, source.name + ' (copie)');
    if (copy) {
      this.refreshSavedDecks();
      this.loadDeck(copy.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Dupliqué',
        detail: `"${copy.name}" créé.`,
      });
    }
  }

  // --- Card operations ---

  addCardToDeck(card: Card) {
    if (!this.currentDeck) return;
    const added = this.deckService.addCard(this.currentDeck, card.id);
    if (!added) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Limite atteinte',
        detail: `Maximum de copies de "${card.name}" atteint.`,
      });
      return;
    }
    this.refreshDeckView();
  }

  incrementCard(cardId: string) {
    if (!this.currentDeck) return;
    const card = this.cardService.getCardById(cardId);
    if (card) this.addCardToDeck(card);
  }

  decrementCard(cardId: string) {
    if (!this.currentDeck) return;
    this.deckService.removeCard(this.currentDeck, cardId);
    this.refreshDeckView();
  }

  getCardQuantity(cardId: string): number {
    if (!this.currentDeck) return 0;
    return this.deckService.getCardQuantity(this.currentDeck, cardId);
  }

  isAtMaxCopies(cardId: string): boolean {
    if (!this.currentDeck) return false;
    return this.getCardQuantity(cardId) >= this.deckService.getMaxCopies(cardId);
  }

  openDetail(card: Card) {
    this.detailCard = card;
    this.showDetail = true;
  }

  // --- Deck view ---

  refreshDeckView() {
    if (!this.currentDeck) {
      this.deckEntries = [];
      this.deckAnalysis = null;
      this.recommendations = [];
      return;
    }
    this.deckEntries = this.currentDeck.entries
      .map((e) => {
        const card = this.cardService.getCardById(e.cardId);
        if (!card) return null;
        return {
          card,
          quantity: e.quantity,
          maxCopies: this.deckService.getMaxCopies(e.cardId),
        };
      })
      .filter((e): e is DeckEntryView => e !== null);
    this.deckStats = this.deckService.computeStats(this.currentDeck);
    this.deckValidation = this.deckService.validateDeck(this.currentDeck);
    this.refreshRecommendations();
  }

  refreshRecommendations() {
    if (!this.currentDeck || this.currentDeck.entries.length === 0) {
      this.deckAnalysis = null;
      this.recommendations = [];
      return;
    }
    this.deckAnalysis = this.recommendationService.analyzeDeck(this.currentDeck);
    this.recommendations = this.recommendationService.recommendCards(this.currentDeck, 10);
  }

  refreshSavedDecks() {
    this.savedDecks = this.deckService.getAllDecks();
    this.deckSelectorOptions = this.savedDecks.map((d) => ({ label: d.name, value: d.id }));
  }

  get groupedEntries(): { label: string; entries: DeckEntryView[] }[] {
    const groups = new Map<string, DeckEntryView[]>();
    for (const entry of this.deckEntries) {
      let key: string;
      if (this.groupBy === 'domain') {
        key = entry.card.domain;
      } else if (this.groupBy === 'cost') {
        key = `Coût ${entry.card.cost}`;
      } else {
        key = entry.card.type;
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, entries]) => ({
        label,
        entries: entries.sort(
          (a, b) => a.card.cost - b.card.cost || a.card.name.localeCompare(b.card.name),
        ),
      }));
  }

  // --- Inline progress indicator ---

  get cardCountProgress(): number {
    return Math.min(100, (this.deckStats.totalCards / DECK_MIN_CARDS) * 100);
  }

  get cardCountLabel(): string {
    const total = this.deckStats.totalCards;
    if (total < DECK_MIN_CARDS) {
      const need = DECK_MIN_CARDS - total;
      return `${total}/${DECK_MIN_CARDS} — encore ${need} carte${need > 1 ? 's' : ''}`;
    }
    if (total > DECK_MAX_CARDS) {
      const over = total - DECK_MAX_CARDS;
      return `${total}/${DECK_MAX_CARDS} — ${over} carte${over > 1 ? 's' : ''} en trop`;
    }
    return `${total} cartes`;
  }

  get cardCountStatus(): 'error' | 'warn' | 'success' {
    const total = this.deckStats.totalCards;
    if (total > DECK_MAX_CARDS) return 'error';
    if (total < DECK_MIN_CARDS) return 'warn';
    return 'success';
  }

  get saveTooltip(): string {
    if (this.deckValidation.isValid) return '';
    return this.deckValidation.errors.join(' | ');
  }

  // --- Domain distribution bars ---

  get domainBars(): { domain: string; count: number; percent: number; color: string }[] {
    const dist = this.deckStats.domainDistribution;
    const total = this.deckStats.totalCards;
    if (total === 0) return [];
    return Object.entries(dist)
      .sort(([, a], [, b]) => b - a)
      .map(([domain, count]) => {
        const domainKey = Object.values(Domain).find((v) => v === domain) as Domain | undefined;
        const color = domainKey ? (DOMAIN_COLORS[domainKey]?.primary ?? '#999') : '#999';
        return { domain, count, percent: (count / total) * 100, color };
      });
  }

  // --- Deck code export ---

  openExportCodeDialog() {
    if (!this.currentDeck) return;
    this.currentDeck.name = this.deckName;
    this.exportedCode = this.deckService.exportDeckCode(this.currentDeck);
    this.showExportCodeDialog = true;
  }

  copyCode() {
    navigator.clipboard.writeText(this.exportedCode).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copié',
        detail: 'Code copié dans le presse-papier.',
      });
    });
  }

  copyShareUrl() {
    const url = `${window.location.origin}/deck-builder?code=${encodeURIComponent(this.exportedCode)}`;
    navigator.clipboard.writeText(url).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Lien copié',
        detail: 'URL de partage copiée dans le presse-papier.',
      });
    });
  }

  // --- Deck code import ---

  openImportCodeDialog() {
    this.importCode = '';
    this.importCodePreview = null;
    this.importCodeError = '';
    this.showImportCodeDialog = true;
  }

  private openImportCodeDialogWithValue(code: string) {
    this.importCode = code;
    this.importCodePreview = null;
    this.importCodeError = '';
    this.showImportCodeDialog = true;
    this.previewImportCode();
  }

  previewImportCode() {
    this.importCodePreview = null;
    this.importCodeError = '';
    if (!this.importCode.trim()) return;
    try {
      const preview = this.deckService.previewDeckCode(this.importCode.trim());
      const totalCards = preview.entries.reduce((s, e) => s + e.quantity, 0);
      const cardNames = preview.entries.slice(0, 8).map((e) => {
        const card = this.cardService.getCardById(e.cardId);
        return card ? `${card.name} x${e.quantity}` : e.cardId;
      });
      this.importCodePreview = {
        name: preview.name,
        entries: preview.entries,
        totalCards,
        cardNames,
      };
    } catch (e: any) {
      this.importCodeError = e.message ?? 'Code invalide';
    }
  }

  confirmImportCode() {
    if (!this.importCode.trim()) return;
    try {
      const deck = this.deckService.importDeckCode(this.importCode.trim());
      this.refreshSavedDecks();
      this.loadDeck(deck.id);
      this.showImportCodeDialog = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Importé',
        detail: `"${deck.name}" a été importé.`,
      });
    } catch (e: any) {
      this.importCodeError = e.message ?? 'Code invalide';
    }
  }

  // --- Legacy JSON import/export ---

  exportDeck() {
    if (!this.currentDeck) return;
    this.currentDeck.name = this.deckName;
    const json = this.deckService.exportDeck(this.currentDeck);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentDeck.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.messageService.add({
      severity: 'success',
      summary: 'Exporté',
      detail: 'Le deck a été exporté.',
    });
  }

  openImportDialog() {
    this.importJson = '';
    this.showImportDialog = true;
  }

  importDeck() {
    try {
      const deck = this.deckService.importDeck(this.importJson);
      this.refreshSavedDecks();
      this.loadDeck(deck.id);
      this.showImportDialog = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Importé',
        detail: `"${deck.name}" a été importé.`,
      });
    } catch (e: any) {
      this.messageService.add({
        severity: 'error',
        summary: "Erreur d'import",
        detail: e.message || 'Format invalide.',
      });
    }
  }

  // --- Print ---

  printDeck() {
    if (!this.currentDeck) return;
    const cards = this.deckService.expandDeck(this.currentDeck);
    const ids = cards.map((c) => c.id).join(',');
    this.router.navigate(['/print'], {
      queryParams: { cards: ids, design: this.currentDesign, imageStyle: this.currentImageStyle },
    });
  }

  // --- Helpers ---

  getAbilityText(card: Card): string {
    if (card.type === CardType.Job) return (card as any).ability;
    if (card.type === CardType.Tool) return (card as any).ability;
    if (card.type === CardType.Event) return (card as any).effect;
    return '';
  }

  getPrioritySeverity(priority: 'high' | 'medium' | 'low'): 'danger' | 'warn' | 'info' {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warn';
      case 'low':
        return 'info';
    }
  }

  getPriorityLabel(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high':
        return 'Haute';
      case 'medium':
        return 'Moyenne';
      case 'low':
        return 'Basse';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'synergy':
        return 'pi-bolt';
      case 'curve':
        return 'pi-chart-line';
      case 'removal':
        return 'pi-times-circle';
      case 'utility':
        return 'pi-wrench';
      case 'finisher':
        return 'pi-star';
      default:
        return 'pi-circle';
    }
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'synergy':
        return 'Synergie';
      case 'curve':
        return 'Courbe';
      case 'removal':
        return 'Destruction';
      case 'utility':
        return 'Utilité';
      case 'finisher':
        return 'Finisseur';
      default:
        return category;
    }
  }

  getDomainIcon(domain: Domain): string {
    return DOMAIN_ICONS[domain] ?? '';
  }

  getDomainColor(domain: Domain): string {
    return DOMAIN_COLORS[domain]?.primary ?? '#999';
  }

  getRarityColor(rarity: Rarity): string {
    return RARITY_COLORS[rarity] ?? '#999';
  }

  isJobCard = isJobCard;

  trackByCardId(_: number, entry: DeckEntryView): string {
    return entry.card.id;
  }

  trackByCard(_: number, card: Card): string {
    return card.id;
  }
}
