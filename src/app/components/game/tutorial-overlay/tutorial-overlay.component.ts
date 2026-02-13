import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { GameState } from '../../../models/game.model';
import { TutorialService } from '../../../services/tutorial.service';

@Component({
  selector: 'app-tutorial-overlay',
  standalone: true,
  imports: [CommonModule, Button],
  template: `
    @if (tutorialService.currentStep; as step) {
      <div class="tutorial-backdrop" [class.position-top]="step.position === 'top'"
           [class.position-bottom]="step.position === 'bottom'"
           [class.position-center]="step.position === 'center'">
        <div class="tutorial-bubble">
          <div class="tutorial-header">
            <span class="tutorial-step-count">{{ tutorialService.currentStepIndex + 1 }}/{{ tutorialService.totalSteps }}</span>
            <span class="tutorial-title">{{ step.title }}</span>
          </div>
          <p class="tutorial-message">{{ step.message }}</p>
          <div class="tutorial-actions">
            @if (step.waitFor === 'click') {
              <p-button label="Suivant" icon="pi pi-arrow-right" size="small" (onClick)="tutorialService.advance()" />
            } @else {
              <span class="tutorial-wait-hint">En attente d'une action...</span>
            }
            <p-button label="Passer le tutoriel" severity="secondary" size="small" [text]="true" (onClick)="tutorialService.stop()" />
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tutorial-backdrop {
      position: absolute;
      left: 0;
      right: 0;
      z-index: 60;
      display: flex;
      justify-content: center;
      pointer-events: none;
      animation: tutorialSlideIn 0.3s ease;

      &.position-top {
        top: 60px;
      }

      &.position-bottom {
        bottom: 20px;
      }

      &.position-center {
        top: 50%;
        transform: translateY(-50%);
      }
    }

    .tutorial-bubble {
      background: linear-gradient(135deg, #1a237e, #283593);
      border: 2px solid rgba(100, 181, 246, 0.5);
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      max-width: 420px;
      width: 90vw;
      pointer-events: all;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }

    .tutorial-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .tutorial-step-count {
      background: rgba(100, 181, 246, 0.2);
      color: #64b5f6;
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
      font-weight: 600;
    }

    .tutorial-title {
      color: #fff;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .tutorial-message {
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.9rem;
      line-height: 1.5;
      margin: 0 0 1rem;
    }

    .tutorial-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      justify-content: space-between;
    }

    .tutorial-wait-hint {
      color: rgba(100, 181, 246, 0.7);
      font-size: 0.8rem;
      font-style: italic;
    }

    @keyframes tutorialSlideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .position-center {
      @keyframes tutorialSlideIn {
        from {
          opacity: 0;
          transform: translateY(calc(-50% + 10px));
        }
        to {
          opacity: 1;
          transform: translateY(-50%);
        }
      }
    }

    @media (max-width: 480px) {
      .tutorial-bubble {
        padding: 1rem;
        max-width: 95vw;
      }

      .tutorial-title {
        font-size: 1rem;
      }

      .tutorial-message {
        font-size: 0.85rem;
      }

      .tutorial-actions {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `],
})
export class TutorialOverlayComponent {
  @Input({ required: true }) state!: GameState;

  constructor(public tutorialService: TutorialService) {}
}
