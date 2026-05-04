import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { MultiplayerService, MessageType } from '../../../services/multiplayer.service';
import { GameState } from '../../../models/game.model';

@Component({
  selector: 'app-turn-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isActive && timeRemaining !== null) {
      <div class="turn-timer" [class.warning]="isWarning">
        <div class="timer-icon">
          <i class="pi pi-clock"></i>
        </div>
        <div class="timer-display">
          <div class="timer-label">{{ isYourTurn ? 'Votre tour' : 'Tour adversaire' }}</div>
          <div class="timer-countdown">{{ formatTime(timeRemaining) }}</div>
        </div>
        @if (isWarning) {
          <div class="warning-pulse"></div>
        }
      </div>
    }
  `,
  styles: [
    `
      .turn-timer {
        position: fixed;
        top: 1rem;
        right: 50%;
        transform: translateX(50%);
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.25rem;
        background: rgba(0, 0, 0, 0.85);
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 24px;
        backdrop-filter: blur(10px);
        color: white;
        font-weight: 600;
        min-width: 200px;
        transition: all 0.3s;

        &.warning {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.9);
          animation: shake 0.5s infinite;
        }
      }

      .timer-icon {
        font-size: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #60a5fa;

        .warning & {
          color: white;
        }
      }

      .timer-display {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        flex: 1;
      }

      .timer-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.8;
      }

      .timer-countdown {
        font-size: 1.3rem;
        font-family: 'Courier New', monospace;
        letter-spacing: 0.05em;
      }

      .warning-pulse {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: white;
        animation: pulse 1s infinite;
      }

      @keyframes shake {
        0%,
        100% {
          transform: translateX(calc(50% + 0px));
        }
        10%,
        30%,
        50%,
        70%,
        90% {
          transform: translateX(calc(50% - 2px));
        }
        20%,
        40%,
        60%,
        80% {
          transform: translateX(calc(50% + 2px));
        }
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.3;
          transform: scale(1.5);
        }
      }

      @media (max-width: 480px) {
        .turn-timer {
          top: 0.5rem;
          padding: 0.5rem 1rem;
          gap: 0.5rem;
          min-width: 160px;
        }

        .timer-icon {
          font-size: 1.2rem;
        }

        .timer-label {
          font-size: 0.6rem;
        }

        .timer-countdown {
          font-size: 1.1rem;
        }
      }
    `,
  ],
})
export class TurnTimerComponent implements OnInit, OnDestroy {
  @Input() state: GameState | null = null;

  isActive = false;
  isYourTurn = false;
  timeRemaining: number | null = null; // in seconds
  isWarning = false;

  private turnStartTime?: number;
  private turnDuration?: number;
  private currentTurnPlayerId?: string;
  private timerSubscription?: Subscription;
  private messageSubscription?: Subscription;

  constructor(private multiplayerService: MultiplayerService) {}

  ngOnInit(): void {
    // Listen for TURN_START messages
    this.messageSubscription = this.multiplayerService.messages$.subscribe((message) => {
      if (message.type === MessageType.TURN_START) {
        this.startTimer(message['playerId'], message['turnDuration'], message.timestamp);
      }
    });

    // Update timer every second
    this.timerSubscription = interval(100).subscribe(() => {
      this.updateTimer();
    });
  }

  ngOnDestroy(): void {
    this.messageSubscription?.unsubscribe();
    this.timerSubscription?.unsubscribe();
  }

  private startTimer(playerId: string, duration: number, startTime: number): void {
    this.isActive = true;
    this.currentTurnPlayerId = playerId;
    this.turnStartTime = startTime;
    this.turnDuration = duration;
    this.isYourTurn = playerId === this.multiplayerService.roomInfo?.playerId;
    this.updateTimer();
  }

  private updateTimer(): void {
    if (!this.isActive || !this.turnStartTime || !this.turnDuration) {
      return;
    }

    const now = Date.now();
    const elapsed = now - this.turnStartTime;
    const remaining = Math.max(0, this.turnDuration - elapsed);

    this.timeRemaining = Math.ceil(remaining / 1000);
    this.isWarning = this.timeRemaining <= 15 && this.timeRemaining > 0;

    if (this.timeRemaining === 0) {
      this.isActive = false;
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
