import { Card } from './card.model';
import { PendingEffect } from './effect.model';

// --- Constants ---
export const STARTING_REPUTATION = 20;
export const STARTING_HAND_SIZE = 5;
export const STARTING_BUDGET = 1;

// --- Enums ---
export enum GamePhase {
  Mulligan = 'Mulligan',
  Budget = 'Budget',
  Draw = 'Pioche',
  Hiring = 'Embauche',
  Work_Attack = 'Travail — Attaque',
  Work_Block = 'Travail — Blocage',
  Work_Damage = 'Travail — Dégâts',
  End = 'Fin',
}

export enum CardZone {
  Deck = 'deck',
  Hand = 'hand',
  Field = 'field',
  Graveyard = 'graveyard',
}

// --- Card Instance (runtime wrapper) ---
export interface CardModifier {
  productivityDelta: number;
  resilienceDelta: number;
  description: string;
  permanent: boolean;
}

export interface CardInstance {
  instanceId: string;
  card: Card;
  zone: CardZone;
  ownerId: string;
  tapped: boolean;
  summonedThisTurn: boolean;
  damageThisTurn: number;
  modifiers: CardModifier[];
  faceDown: boolean;
  constructionBonuses: number;
  attachedTo?: string; // instanceId of card this tool is attached to
}

// --- Combat ---
export interface AttackDeclaration {
  attackerInstanceId: string;
}

export interface BlockAssignment {
  blockerInstanceId: string;
  attackerInstanceId: string;
}

export interface CombatState {
  attackers: AttackDeclaration[];
  blockers: BlockAssignment[];
  resolved: boolean;
}

// --- Log ---
export interface GameLogEntry {
  turn: number;
  phase: GamePhase;
  playerId: string;
  message: string;
  timestamp: number;
}

// --- Player ---
export interface PlayerState {
  id: string;
  name: string;
  reputation: number;
  budgetMax: number;
  budgetRemaining: number;
  deck: CardInstance[];
  hand: CardInstance[];
  field: CardInstance[];
  graveyard: CardInstance[];
  deckId: string;
  mulliganUsed: boolean;
}

// --- Game State ---
export interface GameState {
  gameId: string;
  player1: PlayerState;
  player2: PlayerState;
  activePlayerId: string;
  turnNumber: number;
  phase: GamePhase;
  combat: CombatState | null;
  pendingEffect: PendingEffect | null;
  winner: string | null;
  log: GameLogEntry[];
  isAiGame: boolean;
  isRankedGame: boolean;
  gameStartTime?: number; // Timestamp when game actually started (after mulligan)
}

// --- Keyword Detection ---
export const KEYWORD_PATTERNS: Record<string, RegExp> = {
  'Première Frappe': /premi[eè]re frappe/i,
  'Célérité': /c[eé]l[eé]rit[eé]/i,
  'Construction': /construction/i,
  'Portée': /port[eé]e/i,
};

export function detectKeywords(abilityText: string): string[] {
  return Object.entries(KEYWORD_PATTERNS)
    .filter(([, regex]) => regex.test(abilityText))
    .map(([name]) => name);
}
