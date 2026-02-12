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
  Card,
  CardType,
  Domain,
  Rarity,
  DOMAIN_COLORS,
  DOMAIN_ICONS,
  RARITY_COLORS,
  isJobCard,
} from '../../models/card.model';
import { Deck, DeckStats, DeckValidation, DECK_MIN_CARDS } from '../../models/deck.model';

interface DeckEntryView {
  card: Card;
  quantity: number;
  maxCopies: number;
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
  domainOptions = Object.values(Domain).map(d => ({ label: d, value: d }));
  typeOptions = Object.values(CardType).map(t => ({ label: t, value: t }));
  rarityOptions = Object.values(Rarity).map(r => ({ label: r, value: r }));
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

  // Import dialog
  showImportDialog = false;
  importJson = '';

  DECK_MIN_CARDS = DECK_MIN_CARDS;
  DOMAIN_COLORS = DOMAIN_COLORS;
  DOMAIN_ICONS = DOMAIN_ICONS;
  RARITY_COLORS = RARITY_COLORS;

  constructor(
    private cardService: CardService,
    private deckService: DeckService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.costRange = [0, this.cardService.getMaxCost()];
    this.applyFilters();
    this.refreshSavedDecks();

    this.route.params.subscribe(params => {
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
    this.currentDeck = { ...deck, entries: deck.entries.map(e => ({ ...e })) };
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
      return;
    }
    this.deckEntries = this.currentDeck.entries
      .map(e => {
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
  }

  refreshSavedDecks() {
    this.savedDecks = this.deckService.getAllDecks();
    this.deckSelectorOptions = this.savedDecks.map(d => ({ label: d.name, value: d.id }));
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
        entries: entries.sort((a, b) => a.card.cost - b.card.cost || a.card.name.localeCompare(b.card.name)),
      }));
  }

  getAbilityText(card: Card): string {
    if (card.type === CardType.Job) return (card as any).ability;
    if (card.type === CardType.Tool) return (card as any).ability;
    if (card.type === CardType.Event) return (card as any).effect;
    return '';
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

  // --- Import / Export ---

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
        summary: 'Erreur d\'import',
        detail: e.message || 'Format invalide.',
      });
    }
  }

  // --- Print ---

  printDeck() {
    if (!this.currentDeck) return;
    const cards = this.deckService.expandDeck(this.currentDeck);
    const ids = cards.map(c => c.id).join(',');
    this.router.navigate(['/print'], { queryParams: { cards: ids, design: this.currentDesign, imageStyle: this.currentImageStyle } });
  }

  // --- Helpers ---

  isJobCard = isJobCard;

  trackByCardId(_: number, entry: DeckEntryView): string {
    return entry.card.id;
  }

  trackByCard(_: number, card: Card): string {
    return card.id;
  }
}
