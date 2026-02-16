import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Quest, QuestType, DailyQuestState, DailyReward, QuestTemplate, QuestMetadata } from '../models/quest.model';
import { Domain } from '../models/card.model';
import { CurrencyService } from './currency.service';
import { BattlePassService } from './battle-pass.service';

/**
 * Quest Service
 * Manages daily quests, login streaks, and quest rewards
 */
@Injectable({
  providedIn: 'root'
})
export class QuestService {
  private readonly STORAGE_KEY = 'jobwars-quests';
  private readonly VERSION_KEY = 'jobwars-quests-version';
  private readonly CURRENT_VERSION = 1;
  private readonly QUESTS_PER_DAY = 3;

  private stateSubject = new BehaviorSubject<DailyQuestState>(this.getDefaultState());
  public state$: Observable<DailyQuestState> = this.stateSubject.asObservable();

  constructor(
    private currencyService: CurrencyService,
    private battlePassService: BattlePassService
  ) {}

  /**
   * Initialize quest system - load from storage or create new
   */
  initializeQuests(): void {
    try {
      const storedVersion = localStorage.getItem(this.VERSION_KEY);
      const storedState = localStorage.getItem(this.STORAGE_KEY);

      if (storedVersion === this.CURRENT_VERSION.toString() && storedState) {
        const state = JSON.parse(storedState) as DailyQuestState;
        this.stateSubject.next(state);
      } else {
        const defaultState = this.getDefaultState();
        this.saveState(defaultState);
        this.stateSubject.next(defaultState);
      }

      // Check for daily reset
      this.checkDailyReset();
    } catch (error) {
      console.error('Error initializing quests:', error);
      const defaultState = this.getDefaultState();
      this.stateSubject.next(defaultState);
      this.saveState(defaultState);
    }
  }

  /**
   * Check if it's a new day and reset quests if needed
   */
  checkDailyReset(): void {
    const state = this.getState();
    const now = Date.now();
    const lastReset = new Date(state.lastReset);
    const today = new Date();

    // Reset if it's a new day (UTC midnight)
    if (!this.isSameDay(lastReset, today)) {
      this.performDailyReset();
    }

    // Check login streak
    this.updateLoginStreak();
  }

  /**
   * Get current quest state
   */
  getState(): DailyQuestState {
    return this.stateSubject.value;
  }

  /**
   * Update quest progress based on game events
   */
  updateQuestProgress(type: QuestType, amount: number = 1, metadata?: QuestMetadata): void {
    const state = this.getState();
    let updated = false;

    for (const quest of state.dailyQuests) {
      if (quest.claimed) continue; // Already claimed, skip
      if (quest.type !== type) continue; // Different quest type

      // Check metadata match (e.g., specific domain)
      if (type === QuestType.WinWithDomain && metadata?.domain) {
        if (quest.metadata?.domain !== metadata.domain) continue;
      }

      // Update progress
      quest.progress = Math.min(quest.progress + amount, quest.requirement);

      // Check if completed
      if (quest.progress >= quest.requirement && !quest.completed) {
        quest.completed = true;
        console.log(`Quest completed: ${quest.title}`);
      }

      updated = true;
    }

    if (updated) {
      this.stateSubject.next(state);
      this.saveState(state);
    }
  }

  /**
   * Claim quest rewards
   */
  claimQuest(questId: string): boolean {
    const state = this.getState();
    const quest = state.dailyQuests.find(q => q.id === questId);

    if (!quest) {
      console.warn('Quest not found:', questId);
      return false;
    }

    if (!quest.completed) {
      console.warn('Quest not completed:', questId);
      return false;
    }

    if (quest.claimed) {
      console.warn('Quest already claimed:', questId);
      return false;
    }

    // Award rewards
    if (quest.reward.coins > 0) {
      this.currencyService.addCurrency('Pièces', quest.reward.coins, `Quête: ${quest.title}`);
    }
    if (quest.reward.gems > 0) {
      this.currencyService.addCurrency('Gemmes', quest.reward.gems, `Quête: ${quest.title}`);
    }

    // Award Battle Pass XP
    this.battlePassService.addXP(100, 'quest', `Quête: ${quest.title}`);

    // Mark as claimed
    quest.claimed = true;
    this.stateSubject.next(state);
    this.saveState(state);

    return true;
  }

  /**
   * Claim daily login reward
   */
  claimDailyReward(day: number): boolean {
    const state = this.getState();
    const reward = state.dailyRewards.find(r => r.day === day);

    if (!reward) {
      console.warn('Daily reward not found:', day);
      return false;
    }

    if (reward.claimed) {
      console.warn('Daily reward already claimed:', day);
      return false;
    }

    if (day > state.loginStreak) {
      console.warn('Cannot claim future reward:', day);
      return false;
    }

    // Award rewards
    if (reward.reward.coins > 0) {
      this.currencyService.addCurrency('Pièces', reward.reward.coins, `Connexion jour ${day}`);
    }
    if (reward.reward.gems > 0) {
      this.currencyService.addCurrency('Gemmes', reward.reward.gems, `Connexion jour ${day}`);
    }

    // Mark as claimed
    reward.claimed = true;
    this.stateSubject.next(state);
    this.saveState(state);

    return true;
  }

  /**
   * Get time until next reset (in milliseconds)
   */
  getTimeUntilReset(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0); // Next UTC midnight
    return tomorrow.getTime() - now.getTime();
  }

  // Private helper methods

  private performDailyReset(): void {
    const state = this.getState();

    // Generate new quests
    state.dailyQuests = this.generateDailyQuests();
    state.lastReset = Date.now();

    this.stateSubject.next(state);
    this.saveState(state);
    console.log('Daily quests reset!');
  }

  private updateLoginStreak(): void {
    const state = this.getState();
    const today = this.getTodayString();

    if (state.lastLoginDate === today) {
      // Already logged in today
      return;
    }

    const yesterday = this.getYesterdayString();

    if (state.lastLoginDate === yesterday) {
      // Consecutive day - increment streak
      state.loginStreak = Math.min(state.loginStreak + 1, 7);
    } else if (state.lastLoginDate !== today) {
      // Streak broken - reset to 1
      state.loginStreak = 1;
      // Reset daily rewards
      state.dailyRewards = this.generateDailyRewards();
    }

    state.lastLoginDate = today;
    this.stateSubject.next(state);
    this.saveState(state);
  }

  private generateDailyQuests(): Quest[] {
    const templates = this.getQuestTemplates();
    const selectedTemplates: QuestTemplate[] = [];

    // Select 3 random quests (1 easy, 1 medium, 1 hard)
    const easy = templates.filter(t => t.difficulty === 'easy');
    const medium = templates.filter(t => t.difficulty === 'medium');
    const hard = templates.filter(t => t.difficulty === 'hard');

    if (easy.length > 0) selectedTemplates.push(easy[Math.floor(Math.random() * easy.length)]);
    if (medium.length > 0) selectedTemplates.push(medium[Math.floor(Math.random() * medium.length)]);
    if (hard.length > 0) selectedTemplates.push(hard[Math.floor(Math.random() * hard.length)]);

    // Convert templates to quests
    const quests: Quest[] = selectedTemplates.map((template, index) => {
      let title = template.titleTemplate;
      let description = template.descriptionTemplate;
      const metadata: QuestMetadata = { ...template.metadata };

      // For domain-specific quests, select a random domain
      if (template.type === QuestType.WinWithDomain) {
        const domains = Object.values(Domain);
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        metadata.domain = randomDomain;
        title = title.replace('{domain}', this.getDomainDisplayName(randomDomain));
        description = description.replace('{domain}', this.getDomainDisplayName(randomDomain));
      }

      return {
        id: `quest_${Date.now()}_${index}`,
        type: template.type,
        title,
        description,
        requirement: template.requirement,
        progress: 0,
        completed: false,
        claimed: false,
        reward: template.reward,
        expiresAt: this.getTomorrowMidnight(),
        metadata
      };
    });

    return quests;
  }

  private generateDailyRewards(): DailyReward[] {
    const rewards: DailyReward[] = [];

    for (let day = 1; day <= 7; day++) {
      rewards.push({
        day,
        claimed: false,
        reward: {
          coins: 50 * day,  // 50, 100, 150, ..., 350
          gems: day === 7 ? 25 : 0  // Bonus gems on day 7
        }
      });
    }

    return rewards;
  }

  private getQuestTemplates(): QuestTemplate[] {
    return [
      // Easy quests
      {
        type: QuestType.GamesPlayed,
        titleTemplate: 'Jouer 3 parties',
        descriptionTemplate: 'Jouez 3 parties (victoire ou défaite)',
        difficulty: 'easy',
        requirement: 3,
        reward: { coins: 50, gems: 0 }
      },
      {
        type: QuestType.PlayCards,
        titleTemplate: 'Jouer 15 cartes',
        descriptionTemplate: 'Jouez 15 cartes durant vos parties',
        difficulty: 'easy',
        requirement: 15,
        reward: { coins: 50, gems: 0 }
      },
      // Medium quests
      {
        type: QuestType.GamesWon,
        titleTemplate: 'Gagner 2 parties',
        descriptionTemplate: 'Remportez 2 victoires',
        difficulty: 'medium',
        requirement: 2,
        reward: { coins: 100, gems: 0 }
      },
      {
        type: QuestType.DealDamage,
        titleTemplate: 'Infliger 30 dégâts',
        descriptionTemplate: 'Infligez 30 points de dégâts à l\'adversaire',
        difficulty: 'medium',
        requirement: 30,
        reward: { coins: 100, gems: 0 }
      },
      // Hard quests
      {
        type: QuestType.WinWithDomain,
        titleTemplate: 'Victoire avec {domain}',
        descriptionTemplate: 'Gagnez une partie avec un deck {domain}',
        difficulty: 'hard',
        requirement: 1,
        reward: { coins: 150, gems: 10 }
      },
      {
        type: QuestType.GamesWon,
        titleTemplate: 'Gagner 5 parties',
        descriptionTemplate: 'Remportez 5 victoires',
        difficulty: 'hard',
        requirement: 5,
        reward: { coins: 200, gems: 15 }
      }
    ];
  }

  private getDefaultState(): DailyQuestState {
    return {
      lastReset: Date.now(),
      dailyQuests: this.generateDailyQuests(),
      loginStreak: 1,
      lastLoginDate: this.getTodayString(),
      dailyRewards: this.generateDailyRewards()
    };
  }

  private saveState(state: DailyQuestState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION.toString());
    } catch (error) {
      console.error('Error saving quest state:', error);
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getUTCFullYear() === date2.getUTCFullYear() &&
           date1.getUTCMonth() === date2.getUTCMonth() &&
           date1.getUTCDate() === date2.getUTCDate();
  }

  private getTodayString(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  }

  private getYesterdayString(): string {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    return `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;
  }

  private getTomorrowMidnight(): number {
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    return tomorrow.getTime();
  }

  private getDomainDisplayName(domain: Domain): string {
    const names: Record<Domain, string> = {
      [Domain.IT]: 'IT',
      [Domain.Police]: 'Police',
      [Domain.Health]: 'Santé',
      [Domain.Finance]: 'Finance',
      [Domain.Education]: 'Éducation',
      [Domain.Construction]: 'Construction',
      [Domain.Retail]: 'Commerce',
      [Domain.Hospitality]: 'Hôtellerie',
      [Domain.Transportation]: 'Transport',
      [Domain.Media]: 'Médias',
      [Domain.Legal]: 'Justice',
      [Domain.Science]: 'Sciences',
      [Domain.Arts]: 'Arts',
      [Domain.Government]: 'Gouvernement',
      [Domain.Agriculture]: 'Agriculture',
      [Domain.Energy]: 'Énergie',
      [Domain.Manufacturing]: 'Industrie',
      [Domain.Military]: 'Militaire',
      [Domain.Sports]: 'Sports',
      [Domain.Environment]: 'Environnement'
    };
    return names[domain] || domain;
  }
}
