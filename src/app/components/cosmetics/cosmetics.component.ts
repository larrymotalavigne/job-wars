import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card as PrimeCard } from 'primeng/card';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { CosmeticsService } from '../../services/cosmetics.service';
import { CardCosmetic, CosmeticType, CosmeticRarity } from '../../models/cosmetics.model';

@Component({
  selector: 'app-cosmetics',
  standalone: true,
  imports: [CommonModule, PrimeCard, Button, Tag, Tabs, TabList, Tab, TabPanels, TabPanel],
  templateUrl: './cosmetics.component.html',
  styleUrl: './cosmetics.component.scss'
})
export class CosmeticsComponent implements OnInit {
  get state$() {
    return this.cosmeticsService.state$;
  }

  allCosmetics: CardCosmetic[] = [];

  CosmeticType = CosmeticType;

  constructor(public cosmeticsService: CosmeticsService) {}

  ngOnInit(): void {
    this.cosmeticsService.initializeCosmetics();
    this.loadCosmetics();
  }

  loadCosmetics(): void {
    this.allCosmetics = this.cosmeticsService.getAllCosmetics();
  }

  getCosmeticsByType(type: CosmeticType): CardCosmetic[] {
    return this.allCosmetics.filter(c => c.type === type);
  }

  getRaritySeverity(rarity: CosmeticRarity): 'success' | 'info' | 'warn' | 'danger' {
    switch (rarity) {
      case CosmeticRarity.Common: return 'success';
      case CosmeticRarity.Rare: return 'info';
      case CosmeticRarity.Epic: return 'warn';
      case CosmeticRarity.Legendary: return 'danger';
      default: return 'info';
    }
  }

  getSourceLabel(source: string): string {
    switch (source) {
      case 'battle_pass': return 'Battle Pass';
      case 'quest': return 'Quête';
      case 'achievement': return 'Succès';
      case 'shop': return 'Boutique';
      default: return source;
    }
  }

  getTypeIcon(type: CosmeticType): string {
    switch (type) {
      case CosmeticType.AlternateArt: return 'pi-image';
      case CosmeticType.Foil: return 'pi-sparkles';
      case CosmeticType.Animation: return 'pi-bolt';
      case CosmeticType.CardBack: return 'pi-book';
      default: return 'pi-star';
    }
  }
}
