import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CardCollectionEntry } from './collection.service';
import { CardService } from './card.service';

@Injectable({ providedIn: 'root' })
export class UnlockNotificationService {
  constructor(
    private messageService: MessageService,
    private cardService: CardService,
  ) {}

  /**
   * Show notification for newly unlocked cards
   */
  showUnlockNotifications(newUnlocks: CardCollectionEntry[]): void {
    if (newUnlocks.length === 0) return;

    // Show individual notifications for each unlock
    for (const entry of newUnlocks) {
      const card = this.cardService.getCardById(entry.cardId);
      if (!card) continue;

      this.messageService.add({
        severity: 'success',
        summary: 'Nouvelle carte débloquée!',
        detail: `${card.name} est maintenant disponible`,
        life: 5000,
        icon: 'pi pi-star-fill',
      });
    }

    // If multiple cards, also show a summary
    if (newUnlocks.length > 1) {
      this.messageService.add({
        severity: 'info',
        summary: 'Collection mise à jour',
        detail: `${newUnlocks.length} nouvelles cartes débloquées`,
        life: 3000,
      });
    }
  }

  /**
   * Show collection progress notification
   */
  showProgressNotification(unlockedCount: number, totalCount: number): void {
    const percentage = Math.round((unlockedCount / totalCount) * 100);

    if (percentage === 100) {
      this.messageService.add({
        severity: 'success',
        summary: 'Collection complète!',
        detail: 'Vous avez débloqué toutes les cartes!',
        life: 8000,
        icon: 'pi pi-trophy',
      });
    } else if (percentage % 25 === 0 && percentage > 0) {
      // Show milestone notifications at 25%, 50%, 75%
      this.messageService.add({
        severity: 'info',
        summary: `${percentage}% de la collection débloquée`,
        detail: `${unlockedCount} / ${totalCount} cartes`,
        life: 4000,
      });
    }
  }
}
