import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MultiplayerService, MessageType } from '../../../services/multiplayer.service';
import { EMOTES } from '../emote-menu/emote-menu.component';

interface DisplayedEmote {
  playerName: string;
  text: string;
  icon: string;
  id: number;
}

@Component({
  selector: 'app-emote-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="emote-container">
      @for (emote of displayedEmotes; track emote.id) {
        <div class="emote-bubble" [@fadeInOut]>
          <div class="emote-icon">{{ emote.icon }}</div>
          <div class="emote-text">
            <div class="player-name">{{ emote.playerName }}</div>
            <div class="emote-message">{{ emote.text }}</div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .emote-container {
        position: fixed;
        top: 5rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 200;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        pointer-events: none;
      }

      .emote-bubble {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.25rem;
        background: rgba(0, 0, 0, 0.9);
        border-radius: 24px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        animation:
          slideDown 0.3s ease-out,
          fadeOut 0.3s ease-in 2.7s;
      }

      .emote-icon {
        font-size: 2rem;
        line-height: 1;
      }

      .emote-text {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }

      .player-name {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 600;
      }

      .emote-message {
        font-size: 0.9rem;
        color: #fff;
        font-weight: 500;
      }

      @keyframes slideDown {
        from {
          transform: translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }

      @media (max-width: 480px) {
        .emote-container {
          top: 3.5rem;
        }

        .emote-bubble {
          padding: 0.5rem 1rem;
        }

        .emote-icon {
          font-size: 1.5rem;
        }

        .emote-message {
          font-size: 0.8rem;
        }
      }
    `,
  ],
})
export class EmoteDisplayComponent implements OnInit, OnDestroy {
  displayedEmotes: DisplayedEmote[] = [];
  private subscription?: Subscription;
  private nextId = 0;

  constructor(private multiplayerService: MultiplayerService) {}

  ngOnInit(): void {
    this.subscription = this.multiplayerService.messages$.subscribe((message) => {
      if (message.type === MessageType.EMOTE) {
        this.showEmote(message['playerName'], message['emoteId']);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private showEmote(playerName: string, emoteId: string): void {
    const emote = EMOTES.find((e) => e.id === emoteId);
    if (!emote) return;

    const displayEmote: DisplayedEmote = {
      playerName,
      text: emote.text,
      icon: emote.icon,
      id: this.nextId++,
    };

    this.displayedEmotes.push(displayEmote);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      this.displayedEmotes = this.displayedEmotes.filter((e) => e.id !== displayEmote.id);
    }, 3000);
  }
}
