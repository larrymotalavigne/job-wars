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
  Media = 'Médias',
  Transportation = 'Transport',
  Energy = 'Énergie',
  Agriculture = 'Agriculture',
  Tourism = 'Tourisme',
  Sports = 'Sport',
  Science = 'Science',
  Arts = 'Arts et Culture',
  Commerce = 'Commerce',
  Environment = 'Environnement',
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

export const DOMAIN_COLORS: Record<Domain, { primary: string; secondary: string; accent: string }> =
  {
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
    [Domain.Media]: { primary: '#d32f2f', secondary: '#ffebee', accent: '#c62828' },
    [Domain.Transportation]: { primary: '#0277bd', secondary: '#e1f5fe', accent: '#01579b' },
    [Domain.Energy]: { primary: '#f57c00', secondary: '#fff3e0', accent: '#e65100' },
    [Domain.Agriculture]: { primary: '#7cb342', secondary: '#f1f8e9', accent: '#558b2f' },
    [Domain.Tourism]: { primary: '#26c6da', secondary: '#e0f7fa', accent: '#0097a7' },
    [Domain.Sports]: { primary: '#ec407a', secondary: '#fce4ec', accent: '#c2185b' },
    [Domain.Science]: { primary: '#5e35b1', secondary: '#ede7f6', accent: '#4527a0' },
    [Domain.Arts]: { primary: '#ab47bc', secondary: '#f3e5f5', accent: '#8e24aa' },
    [Domain.Commerce]: { primary: '#ff7043', secondary: '#fbe9e7', accent: '#f4511e' },
    [Domain.Environment]: { primary: '#43a047', secondary: '#e8f5e9', accent: '#2e7d32' },
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
  [Domain.Media]: 'pi pi-megaphone',
  [Domain.Transportation]: 'pi pi-car',
  [Domain.Energy]: 'pi pi-sun',
  [Domain.Agriculture]: 'pi pi-home',
  [Domain.Tourism]: 'pi pi-map-marker',
  [Domain.Sports]: 'pi pi-circle',
  [Domain.Science]: 'pi pi-compass',
  [Domain.Arts]: 'pi pi-palette',
  [Domain.Commerce]: 'pi pi-shopping-cart',
  [Domain.Environment]: 'pi pi-leaf',
};

export const RARITY_COLORS: Record<Rarity, string> = {
  [Rarity.Common]: '#1a1a1a',
  [Rarity.Uncommon]: '#607d8b',
  [Rarity.Rare]: '#c9b037',
  [Rarity.Legendary]: '#e65100',
};
