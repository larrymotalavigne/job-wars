import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { Slider } from 'primeng/slider';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { CardComponent, CardDesign } from '../card/card.component';
import { CardService } from '../../services/card.service';
import { Card, CardType, Domain, Rarity, isJobCard } from '../../models/card.model';

@Component({
  selector: 'app-card-gallery',
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
    CardComponent,
  ],
  templateUrl: './card-gallery.component.html',
  styleUrl: './card-gallery.component.scss',
})
export class CardGalleryComponent implements OnInit {
  allCards: Card[] = [];
  filteredCards: Card[] = [];
  selectedCards = new Set<string>();
  detailCard: Card | null = null;
  showDetail = false;

  // Design
  currentDesign: CardDesign = 'classique';
  designOptions: { label: string; value: CardDesign }[] = [
    { label: 'Classique', value: 'classique' },
    { label: 'Moderne', value: 'moderne' },
    { label: 'Rétro', value: 'retro' },
    { label: 'Élégant', value: 'elegant' },
  ];

  // Filter options
  domainOptions = Object.values(Domain).map(d => ({ label: d, value: d }));
  typeOptions = Object.values(CardType).map(t => ({ label: t, value: t }));
  rarityOptions = Object.values(Rarity).map(r => ({ label: r, value: r }));

  // Filter values
  selectedDomains: Domain[] = [];
  selectedTypes: CardType[] = [];
  selectedRarities: Rarity[] = [];
  costRange: number[] = [0, 7];
  searchText = '';

  constructor(
    private cardService: CardService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.allCards = this.cardService.getAllCards();
    this.costRange = [0, this.cardService.getMaxCost()];
    this.applyFilters();
  }

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

  toggleSelection(card: Card) {
    if (this.selectedCards.has(card.id)) {
      this.selectedCards.delete(card.id);
    } else {
      this.selectedCards.add(card.id);
    }
  }

  isSelected(card: Card): boolean {
    return this.selectedCards.has(card.id);
  }

  selectAll() {
    this.filteredCards.forEach(c => this.selectedCards.add(c.id));
  }

  clearSelection() {
    this.selectedCards.clear();
  }

  printSelected() {
    const ids = Array.from(this.selectedCards);
    this.router.navigate(['/print'], { queryParams: { cards: ids.join(','), design: this.currentDesign } });
  }

  openDetail(card: Card) {
    this.detailCard = card;
    this.showDetail = true;
  }

  isJobCard = isJobCard;
}
