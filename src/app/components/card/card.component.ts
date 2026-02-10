import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Card,
  CardType,
  Domain,
  DOMAIN_COLORS,
  DOMAIN_ICONS,
  RARITY_COLORS,
  isJobCard,
  isToolCard,
  isEventCard,
} from '../../models/card.model';

export type CardDesign = 'classique' | 'moderne' | 'retro' | 'elegant';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  @Input({ required: true }) card!: Card;
  @Input() selected = false;
  @Input() design: CardDesign = 'classique';

  get colors() {
    return DOMAIN_COLORS[this.card.domain];
  }

  get domainIcon() {
    return DOMAIN_ICONS[this.card.domain];
  }

  get rarityColor() {
    return RARITY_COLORS[this.card.rarity];
  }

  get isJob() {
    return isJobCard(this.card);
  }

  get isTool() {
    return isToolCard(this.card);
  }

  get isEvent() {
    return isEventCard(this.card);
  }

  get jobCard() {
    return isJobCard(this.card) ? this.card : null;
  }

  get abilityText(): string {
    if (this.card.type === CardType.Job) return (this.card as any).ability;
    if (this.card.type === CardType.Tool) return (this.card as any).ability;
    if (this.card.type === CardType.Event) return (this.card as any).effect;
    return '';
  }

  get typeIcon(): string {
    if (this.card.type === CardType.Job) return 'pi pi-user';
    if (this.card.type === CardType.Tool) return 'pi pi-wrench';
    return 'pi pi-bolt';
  }
}
