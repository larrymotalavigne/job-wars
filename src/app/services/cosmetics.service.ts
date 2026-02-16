import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CardCosmetic, CosmeticType, CosmeticRarity, CosmeticsState } from '../models/cosmetics.model';

/**
 * Cosmetics Service
 * Manages card visual customizations (non-gameplay)
 */
@Injectable({
  providedIn: 'root'
})
export class CosmeticsService {
  private readonly STORAGE_KEY = 'jobwars-cosmetics';
  private readonly VERSION_KEY = 'jobwars-cosmetics-version';
  private readonly CURRENT_VERSION = 1;

  private stateSubject = new BehaviorSubject<CosmeticsState>(this.getDefaultState());
  public state$: Observable<CosmeticsState> = this.stateSubject.asObservable();

  // Predefined cosmetics catalog
  private cosmeticsCatalog: CardCosmetic[] = [];

  constructor() {
    this.initializeCatalog();
  }

  /**
   * Initialize cosmetics system
   */
  initializeCosmetics(): void {
    try {
      const storedVersion = localStorage.getItem(this.VERSION_KEY);
      const storedState = localStorage.getItem(this.STORAGE_KEY);

      if (storedVersion === this.CURRENT_VERSION.toString() && storedState) {
        const state = JSON.parse(storedState) as CosmeticsState;
        this.stateSubject.next(state);
      } else {
        const defaultState = this.getDefaultState();
        this.saveState(defaultState);
        this.stateSubject.next(defaultState);
      }
    } catch (error) {
      console.error('Error initializing cosmetics:', error);
      const defaultState = this.getDefaultState();
      this.stateSubject.next(defaultState);
      this.saveState(defaultState);
    }
  }

  /**
   * Get current cosmetics state
   */
  getState(): CosmeticsState {
    return this.stateSubject.value;
  }

  /**
   * Get all cosmetics from catalog
   */
  getAllCosmetics(): CardCosmetic[] {
    const state = this.getState();
    return this.cosmeticsCatalog.map(cosmetic => ({
      ...cosmetic,
      unlocked: state.unlockedCosmetics.includes(cosmetic.id)
    }));
  }

  /**
   * Get cosmetic by ID
   */
  getCosmetic(cosmeticId: string): CardCosmetic | undefined {
    const cosmetic = this.cosmeticsCatalog.find(c => c.id === cosmeticId);
    if (!cosmetic) return undefined;

    const state = this.getState();
    return {
      ...cosmetic,
      unlocked: state.unlockedCosmetics.includes(cosmetic.id)
    };
  }

  /**
   * Unlock a cosmetic
   */
  unlockCosmetic(cosmeticId: string): boolean {
    const state = this.getState();

    if (state.unlockedCosmetics.includes(cosmeticId)) {
      console.warn('Cosmetic already unlocked:', cosmeticId);
      return false;
    }

    const cosmetic = this.cosmeticsCatalog.find(c => c.id === cosmeticId);
    if (!cosmetic) {
      console.warn('Cosmetic not found:', cosmeticId);
      return false;
    }

    state.unlockedCosmetics.push(cosmeticId);
    this.stateSubject.next(state);
    this.saveState(state);

    console.log(`🎨 Cosmetic unlocked: ${cosmetic.name}`);
    return true;
  }

  /**
   * Apply cosmetic to a card
   */
  applyCosmetic(cardId: string, cosmeticId: string): boolean {
    const state = this.getState();

    // Check if cosmetic is unlocked
    if (!state.unlockedCosmetics.includes(cosmeticId)) {
      console.warn('Cosmetic not unlocked:', cosmeticId);
      return false;
    }

    // Check if cosmetic is valid for this card
    const cosmetic = this.cosmeticsCatalog.find(c => c.id === cosmeticId);
    if (!cosmetic) {
      console.warn('Cosmetic not found:', cosmeticId);
      return false;
    }

    if (cosmetic.cardId && cosmetic.cardId !== cardId) {
      console.warn('Cosmetic not valid for this card');
      return false;
    }

    state.loadout.cardCosmetics[cardId] = cosmeticId;
    this.stateSubject.next(state);
    this.saveState(state);

    return true;
  }

  /**
   * Remove cosmetic from a card
   */
  removeCosmetic(cardId: string): boolean {
    const state = this.getState();

    if (!state.loadout.cardCosmetics[cardId]) {
      return false;
    }

    delete state.loadout.cardCosmetics[cardId];
    this.stateSubject.next(state);
    this.saveState(state);

    return true;
  }

  /**
   * Set active card back
   */
  setActiveCardBack(cardBackId: string): boolean {
    const state = this.getState();

    // Check if card back is unlocked
    if (!state.unlockedCosmetics.includes(cardBackId)) {
      console.warn('Card back not unlocked:', cardBackId);
      return false;
    }

    const cardBack = this.cosmeticsCatalog.find(c => c.id === cardBackId && c.type === CosmeticType.CardBack);
    if (!cardBack) {
      console.warn('Card back not found:', cardBackId);
      return false;
    }

    state.loadout.activeCardBack = cardBackId;
    this.stateSubject.next(state);
    this.saveState(state);

    return true;
  }

  /**
   * Get card's applied cosmetic
   */
  getCardCosmetic(cardId: string): CardCosmetic | null {
    const state = this.getState();
    const cosmeticId = state.loadout.cardCosmetics[cardId];

    if (!cosmeticId) return null;

    return this.getCosmetic(cosmeticId) || null;
  }

  /**
   * Get active card back
   */
  getActiveCardBack(): CardCosmetic | null {
    const state = this.getState();
    return this.getCosmetic(state.loadout.activeCardBack) || null;
  }

  // Private helper methods

  private getDefaultState(): CosmeticsState {
    return {
      unlockedCosmetics: ['cardback_default'], // Default card back unlocked
      loadout: {
        cardCosmetics: {},
        activeCardBack: 'cardback_default'
      }
    };
  }

  private saveState(state: CosmeticsState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION.toString());
    } catch (error) {
      console.error('Error saving cosmetics state:', error);
    }
  }

  private initializeCatalog(): void {
    // Default card back
    this.cosmeticsCatalog.push({
      id: 'cardback_default',
      type: CosmeticType.CardBack,
      name: 'Dos de Carte Standard',
      rarity: CosmeticRarity.Common,
      unlocked: true,
      source: 'battle_pass',
      description: 'Le dos de carte par défaut'
    });

    // Foil effects (generic, can apply to any card)
    this.cosmeticsCatalog.push({
      id: 'foil_gold',
      type: CosmeticType.Foil,
      name: 'Effet Doré',
      rarity: CosmeticRarity.Rare,
      unlocked: false,
      source: 'battle_pass',
      effectClass: 'foil-gold',
      description: 'Un effet holographique doré'
    });

    this.cosmeticsCatalog.push({
      id: 'foil_rainbow',
      type: CosmeticType.Foil,
      name: 'Effet Arc-en-ciel',
      rarity: CosmeticRarity.Epic,
      unlocked: false,
      source: 'battle_pass',
      effectClass: 'foil-rainbow',
      description: 'Un effet holographique multicolore'
    });

    // Animation effects
    this.cosmeticsCatalog.push({
      id: 'anim_sparkle',
      type: CosmeticType.Animation,
      name: 'Effet Étincelles',
      rarity: CosmeticRarity.Rare,
      unlocked: false,
      source: 'battle_pass',
      effectClass: 'anim-sparkle',
      description: 'Des particules scintillantes'
    });

    // Premium card backs
    this.cosmeticsCatalog.push({
      id: 'cardback_premium_gold',
      type: CosmeticType.CardBack,
      name: 'Dos Doré Premium',
      rarity: CosmeticRarity.Epic,
      unlocked: false,
      source: 'battle_pass',
      description: 'Un dos de carte doré élégant'
    });

    this.cosmeticsCatalog.push({
      id: 'cardback_legendary',
      type: CosmeticType.CardBack,
      name: 'Dos Légendaire',
      rarity: CosmeticRarity.Legendary,
      unlocked: false,
      source: 'battle_pass',
      description: 'Le dos de carte ultime'
    });
  }
}
