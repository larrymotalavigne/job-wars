import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { MultiplayerService, MessageType } from '../../../services/multiplayer.service';

interface ChatMessage {
  playerName: string;
  message: string;
  timestamp: number;
  isOwn: boolean;
}

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, InputText],
  template: `
    <div class="chat-panel" [class.open]="isOpen">
      <!-- Toggle Button -->
      <button class="chat-toggle" (click)="toggleChat()" [class.has-unread]="hasUnread && !isOpen">
        <i [class]="isOpen ? 'pi pi-times' : 'pi pi-comments'"></i>
        @if (unreadCount > 0 && !isOpen) {
          <span class="unread-badge">{{ unreadCount }}</span>
        }
      </button>

      <!-- Chat Window -->
      @if (isOpen) {
        <div class="chat-window">
          <div class="chat-header">
            <i class="pi pi-comments"></i>
            <span>Chat</span>
          </div>

          <div class="chat-messages" #messagesContainer>
            @if (messages.length === 0) {
              <div class="empty-message">
                <i class="pi pi-comment"></i>
                <p>Aucun message pour le moment</p>
              </div>
            }
            @for (msg of messages; track msg.timestamp) {
              <div class="message" [class.own]="msg.isOwn">
                <div class="message-author">{{ msg.playerName }}</div>
                <div class="message-text">{{ msg.message }}</div>
                <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
              </div>
            }
          </div>

          <div class="chat-input">
            <input
              pInputText
              [(ngModel)]="messageInput"
              (keydown.enter)="sendMessage()"
              placeholder="Écrivez un message..."
              maxlength="200"
              [disabled]="!canSend"
            />
            <p-button
              icon="pi pi-send"
              [disabled]="!canSend || !messageInput.trim()"
              (onClick)="sendMessage()"
              size="small"
            />
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .chat-panel {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        z-index: 60;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.5rem;
      }

      .chat-toggle {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 50%;
        border: none;
        background: var(--p-primary-color);
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: all 0.2s;
        position: relative;

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        &.has-unread {
          animation: pulse 2s infinite;
        }
      }

      .unread-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: #ef4444;
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.15rem 0.4rem;
        border-radius: 10px;
        min-width: 1.2rem;
        text-align: center;
      }

      .chat-window {
        width: 320px;
        height: 400px;
        background: var(--p-surface-0);
        border: 1px solid var(--p-surface-200);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.2s ease-out;
      }

      .chat-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: var(--p-primary-color);
        color: white;
        font-weight: 600;
        border-radius: 12px 12px 0 0;

        i {
          font-size: 1.1rem;
        }
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .empty-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--p-text-muted-color);
        gap: 0.5rem;

        i {
          font-size: 2rem;
        }

        p {
          font-size: 0.9rem;
          margin: 0;
        }
      }

      .message {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        max-width: 85%;
        align-self: flex-start;
      }

      .message.own {
        align-self: flex-end;

        .message-author {
          text-align: right;
        }

        .message-text {
          background: var(--p-primary-color);
          color: white;
        }

        .message-time {
          text-align: right;
        }
      }

      .message-author {
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--p-text-muted-color);
        padding: 0 0.5rem;
      }

      .message-text {
        padding: 0.5rem 0.75rem;
        background: var(--p-surface-100);
        border-radius: 12px;
        word-wrap: break-word;
        font-size: 0.9rem;
        line-height: 1.4;
      }

      .message-time {
        font-size: 0.65rem;
        color: var(--p-text-muted-color);
        padding: 0 0.5rem;
      }

      .chat-input {
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem;
        border-top: 1px solid var(--p-surface-200);

        input {
          flex: 1;
        }
      }

      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes pulse {
        0%,
        100% {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        50% {
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6);
        }
      }

      @media (max-width: 480px) {
        .chat-panel {
          bottom: 0.5rem;
          right: 0.5rem;
        }

        .chat-toggle {
          width: 3rem;
          height: 3rem;
          font-size: 1.3rem;
        }

        .chat-window {
          width: calc(100vw - 1rem);
          height: 60vh;
          max-width: 400px;
        }
      }
    `,
  ],
})
export class ChatPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;

  isOpen = false;
  messages: ChatMessage[] = [];
  messageInput = '';
  unreadCount = 0;
  hasUnread = false;
  private subscription?: Subscription;
  private shouldScroll = false;
  private myPlayerId?: string;

  constructor(private multiplayerService: MultiplayerService) {}

  ngOnInit(): void {
    // Get current player ID
    this.myPlayerId = this.multiplayerService.roomInfo?.playerId;

    this.subscription = this.multiplayerService.messages$.subscribe((message) => {
      if (message.type === MessageType.CHAT) {
        const chatMessage: ChatMessage = {
          playerName: message['playerName'],
          message: message['message'],
          timestamp: message.timestamp,
          isOwn: message['playerId'] === this.myPlayerId,
        };

        this.messages.push(chatMessage);
        this.shouldScroll = true;

        if (!this.isOpen && !chatMessage.isOwn) {
          this.unreadCount++;
          this.hasUnread = true;
        }
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.unreadCount = 0;
      this.hasUnread = false;
      this.shouldScroll = true;
    }
  }

  sendMessage(): void {
    if (!this.messageInput.trim()) return;

    this.multiplayerService.sendChat(this.messageInput.trim());
    this.messageInput = '';
  }

  get canSend(): boolean {
    return this.multiplayerService.roomInfo !== null;
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
}
