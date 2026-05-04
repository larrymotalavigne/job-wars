import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { MultiplayerService } from '../../../services/multiplayer.service';

export interface Emote {
  id: string;
  text: string;
  icon: string;
}

export const EMOTES: Emote[] = [
  { id: 'hello', text: 'Bonjour !', icon: '👋' },
  { id: 'gg', text: 'Bien joué !', icon: '🎮' },
  { id: 'thinking', text: 'Réflexion...', icon: '🤔' },
  { id: 'oops', text: 'Oups !', icon: '😅' },
  { id: 'nice', text: 'Joli coup !', icon: '👏' },
  { id: 'thanks', text: 'Merci !', icon: '🙏' },
];

@Component({
  selector: 'app-emote-menu',
  standalone: true,
  imports: [CommonModule, Button, Menu],
  template: `
    <div class="emote-menu">
      <p-button
        icon="pi pi-comment"
        [rounded]="true"
        severity="secondary"
        [text]="true"
        (onClick)="menu.toggle($event)"
        pTooltip="Émotes"
        tooltipPosition="left"
      />
      <p-menu #menu [model]="emoteItems" [popup]="true" />
    </div>
  `,
  styles: [
    `
      .emote-menu {
        position: fixed;
        bottom: 5rem;
        right: 1rem;
        z-index: 50;
      }

      @media (max-width: 480px) {
        .emote-menu {
          bottom: 4rem;
          right: 0.5rem;
        }
      }
    `,
  ],
})
export class EmoteMenuComponent {
  emoteItems: MenuItem[] = [];

  constructor(private multiplayerService: MultiplayerService) {
    this.emoteItems = EMOTES.map((emote) => ({
      label: `${emote.icon} ${emote.text}`,
      command: () => this.sendEmote(emote.id),
    }));
  }

  sendEmote(emoteId: string): void {
    this.multiplayerService.sendEmote(emoteId);
  }
}
