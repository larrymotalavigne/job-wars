export enum Domain {
  IT = 'Informatique',
  UrbanPlanning = 'Urbanisme',
  Teacher = 'Enseignement',
  Police = 'Police',
  Health = 'Santé',
  Firefighter = 'Pompiers',
  Justice = 'Justice',
  Finance = 'Finance',
  Crafts = 'Artisanat',
  Military = 'Armée',
}

export enum CardType {
  Job = 'Métier',
  Tool = 'Outil',
  Event = 'Événement',
}

export enum Rarity {
  Common = 'Commune',
  Uncommon = 'Peu commune',
  Rare = 'Rare',
  Legendary = 'Légendaire',
}

export interface CardBase {
  id: string;
  name: string;
  domain: Domain;
  type: CardType;
  cost: number;
  rarity: Rarity;
  flavorText?: string;
  image?: string;
}

export interface JobCard extends CardBase {
  type: CardType.Job;
  productivity: number;
  resilience: number;
  ability: string;
}

export interface ToolCard extends CardBase {
  type: CardType.Tool;
  ability: string;
}

export interface EventCard extends CardBase {
  type: CardType.Event;
  effect: string;
}

export type Card = JobCard | ToolCard | EventCard;

export function isJobCard(card: Card): card is JobCard {
  return card.type === CardType.Job;
}

export function isToolCard(card: Card): card is ToolCard {
  return card.type === CardType.Tool;
}

export function isEventCard(card: Card): card is EventCard {
  return card.type === CardType.Event;
}

export const DOMAIN_COLORS: Record<Domain, { primary: string; secondary: string; accent: string }> = {
  [Domain.IT]: { primary: '#1a73e8', secondary: '#e8f0fe', accent: '#174ea6' },
  [Domain.UrbanPlanning]: { primary: '#0d652d', secondary: '#e6f4ea', accent: '#0d652d' },
  [Domain.Teacher]: { primary: '#f9a825', secondary: '#fef7e0', accent: '#f57f17' },
  [Domain.Police]: { primary: '#c62828', secondary: '#fce4ec', accent: '#b71c1c' },
  [Domain.Health]: { primary: '#00897b', secondary: '#e0f2f1', accent: '#00695c' },
  [Domain.Firefighter]: { primary: '#ef6c00', secondary: '#fff3e0', accent: '#e65100' },
  [Domain.Justice]: { primary: '#6a1b9a', secondary: '#f3e5f5', accent: '#4a148c' },
  [Domain.Finance]: { primary: '#546e7a', secondary: '#eceff1', accent: '#37474f' },
  [Domain.Crafts]: { primary: '#795548', secondary: '#efebe9', accent: '#4e342e' },
  [Domain.Military]: { primary: '#558b2f', secondary: '#f1f8e9', accent: '#33691e' },
};

export const DOMAIN_ICONS: Record<Domain, string> = {
  [Domain.IT]: 'pi pi-microchip',
  [Domain.UrbanPlanning]: 'pi pi-building',
  [Domain.Teacher]: 'pi pi-book',
  [Domain.Police]: 'pi pi-shield',
  [Domain.Health]: 'pi pi-heart',
  [Domain.Firefighter]: 'pi pi-bolt',
  [Domain.Justice]: 'pi pi-balance-scale',
  [Domain.Finance]: 'pi pi-chart-line',
  [Domain.Crafts]: 'pi pi-wrench',
  [Domain.Military]: 'pi pi-flag',
};

export const RARITY_COLORS: Record<Rarity, string> = {
  [Rarity.Common]: '#1a1a1a',
  [Rarity.Uncommon]: '#607d8b',
  [Rarity.Rare]: '#c9b037',
  [Rarity.Legendary]: '#e65100',
};
