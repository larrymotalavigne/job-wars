import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  PlayerProfile,
  PlayerAvatar,
  PlayerTitle,
  PlayerBadge,
  getLevelFromXP,
  getXPProgress
} from '../models/profile.model';

/**
 * Profile Service
 * Manages player identity and customization
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly STORAGE_KEY = 'jobwars-profile';
  private readonly VERSION_KEY = 'jobwars-profile-version';
  private readonly CURRENT_VERSION = 1;

  private profileSubject = new BehaviorSubject<PlayerProfile>(this.getDefaultProfile());
  public profile$: Observable<PlayerProfile> = this.profileSubject.asObservable();

  // Catalogs
  private avatarsCatalog: PlayerAvatar[] = [];
  private titlesCatalog: PlayerTitle[] = [];
  private badgesCatalog: PlayerBadge[] = [];

  constructor() {
    this.initializeCatalogs();
  }

  /**
   * Initialize profile system
   */
  initializeProfile(): void {
    try {
      const storedVersion = localStorage.getItem(this.VERSION_KEY);
      const storedProfile = localStorage.getItem(this.STORAGE_KEY);

      if (storedVersion === this.CURRENT_VERSION.toString() && storedProfile) {
        const profile = JSON.parse(storedProfile) as PlayerProfile;
        this.profileSubject.next(profile);
      } else {
        const defaultProfile = this.getDefaultProfile();
        this.saveProfile(defaultProfile);
        this.profileSubject.next(defaultProfile);
      }
    } catch (error) {
      console.error('Error initializing profile:', error);
      const defaultProfile = this.getDefaultProfile();
      this.profileSubject.next(defaultProfile);
      this.saveProfile(defaultProfile);
    }
  }

  /**
   * Get current profile
   */
  getProfile(): PlayerProfile {
    return this.profileSubject.value;
  }

  /**
   * Set display name
   */
  setDisplayName(name: string): void {
    const profile = this.getProfile();
    profile.displayName = name;
    this.profileSubject.next(profile);
    this.saveProfile(profile);
  }

  /**
   * Set avatar
   */
  setAvatar(avatarId: string): boolean {
    const avatar = this.avatarsCatalog.find(a => a.id === avatarId);
    if (!avatar || !avatar.unlocked) {
      console.warn('Avatar not available:', avatarId);
      return false;
    }

    const profile = this.getProfile();
    profile.avatarId = avatarId;
    this.profileSubject.next(profile);
    this.saveProfile(profile);
    return true;
  }

  /**
   * Set title
   */
  setTitle(titleId: string): boolean {
    const title = this.titlesCatalog.find(t => t.id === titleId);
    if (!title || !title.unlocked) {
      console.warn('Title not available:', titleId);
      return false;
    }

    const profile = this.getProfile();
    profile.titleId = titleId;
    this.profileSubject.next(profile);
    this.saveProfile(profile);
    return true;
  }

  /**
   * Clear title
   */
  clearTitle(): void {
    const profile = this.getProfile();
    profile.titleId = undefined;
    this.profileSubject.next(profile);
    this.saveProfile(profile);
  }

  /**
   * Set badges (up to 3)
   */
  setBadges(badgeIds: string[]): boolean {
    if (badgeIds.length > 3) {
      console.warn('Maximum 3 badges allowed');
      return false;
    }

    // Check all badges are unlocked
    for (const badgeId of badgeIds) {
      const badge = this.badgesCatalog.find(b => b.id === badgeId);
      if (!badge || !badge.unlocked) {
        console.warn('Badge not available:', badgeId);
        return false;
      }
    }

    const profile = this.getProfile();
    profile.badges = badgeIds;
    this.profileSubject.next(profile);
    this.saveProfile(profile);
    return true;
  }

  /**
   * Add XP (shared with battle pass)
   */
  addXP(amount: number): void {
    const profile = this.getProfile();
    const oldLevel = profile.level;

    profile.xp += amount;
    profile.level = getLevelFromXP(profile.xp);

    // Check for level up
    if (profile.level > oldLevel) {
      console.log(`🎉 Level Up! Now level ${profile.level}`);
      this.checkLevelRewards(profile.level);
    }

    this.profileSubject.next(profile);
    this.saveProfile(profile);
  }

  /**
   * Get all avatars
   */
  getAllAvatars(): PlayerAvatar[] {
    const profile = this.getProfile();
    return this.avatarsCatalog.map(avatar => ({
      ...avatar,
      unlocked: avatar.unlocked || (avatar.source === 'level' && profile.level >= 5)
    }));
  }

  /**
   * Get all titles
   */
  getAllTitles(): PlayerTitle[] {
    return this.titlesCatalog;
  }

  /**
   * Get all badges
   */
  getAllBadges(): PlayerBadge[] {
    return this.badgesCatalog;
  }

  /**
   * Get XP progress
   */
  getXPProgress(): { current: number; required: number; percentage: number } {
    const profile = this.getProfile();
    return getXPProgress(profile.xp);
  }

  // Private helper methods

  private getDefaultProfile(): PlayerProfile {
    return {
      playerId: crypto.randomUUID(),
      displayName: 'Joueur',
      avatarId: 'avatar_default',
      badges: [],
      level: 1,
      xp: 0,
      profileCreated: Date.now()
    };
  }

  private saveProfile(profile: PlayerProfile): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION.toString());
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }

  private checkLevelRewards(level: number): void {
    // Unlock avatars/titles at milestone levels
    if (level === 5) {
      console.log('Unlocked new avatar at level 5!');
    }
    if (level === 10) {
      console.log('Unlocked new title at level 10!');
    }
  }

  private initializeCatalogs(): void {
    // Default avatars
    this.avatarsCatalog = [
      {
        id: 'avatar_default',
        name: 'Avatar Par Défaut',
        iconClass: 'pi-user',
        unlocked: true,
        source: 'starter'
      },
      {
        id: 'avatar_star',
        name: 'Étoile',
        iconClass: 'pi-star',
        unlocked: false,
        source: 'level',
        unlockRequirement: 'Niveau 5'
      },
      {
        id: 'avatar_crown',
        name: 'Couronne',
        iconClass: 'pi-crown',
        unlocked: false,
        source: 'battle_pass',
        unlockRequirement: 'Battle Pass Niveau 20'
      }
    ];

    // Titles
    this.titlesCatalog = [
      {
        id: 'title_rookie',
        title: 'Débutant',
        unlocked: true,
        requirement: 'Par défaut',
        source: 'level'
      },
      {
        id: 'title_veteran',
        title: 'Vétéran',
        unlocked: false,
        requirement: 'Niveau 10',
        source: 'level'
      },
      {
        id: 'title_master',
        title: 'Maître',
        unlocked: false,
        requirement: 'Atteindre le rang Master',
        source: 'ranked'
      }
    ];

    // Badges
    this.badgesCatalog = [
      {
        id: 'badge_first_win',
        name: 'Première Victoire',
        iconClass: 'pi-trophy',
        unlocked: false,
        requirement: 'Gagner votre première partie',
        source: 'achievement'
      },
      {
        id: 'badge_collector',
        name: 'Collectionneur',
        iconClass: 'pi-star-fill',
        unlocked: false,
        requirement: 'Débloquer 50 cartes',
        source: 'collection'
      },
      {
        id: 'badge_ranked',
        name: 'Compétiteur',
        iconClass: 'pi-shield',
        unlocked: false,
        requirement: 'Jouer 10 parties classées',
        source: 'ranked'
      }
    ];
  }
}
