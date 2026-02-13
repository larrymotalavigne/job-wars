import { Injectable } from '@angular/core';
import { GamePhase } from '../models/game.model';

export interface TutorialStep {
  id: number;
  phase: GamePhase | null;
  title: string;
  message: string;
  highlightSelector?: string;
  position: 'top' | 'bottom' | 'center';
  waitFor: 'click' | 'action' | 'phase';
  targetPhase?: GamePhase;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 0,
    phase: null,
    title: 'Bienvenue dans Job Wars !',
    message: 'Ce tutoriel va vous guider a travers vos premiers tours de jeu. Cliquez sur Suivant pour continuer.',
    position: 'center',
    waitFor: 'click',
  },
  {
    id: 1,
    phase: GamePhase.Budget,
    title: 'Phase de Budget',
    message: 'Chaque tour, vous recevez du Budget pour embaucher des Metiers et jouer des cartes. Votre budget augmente de 1 chaque tour.',
    highlightSelector: '.phase-bar',
    position: 'top',
    waitFor: 'click',
  },
  {
    id: 2,
    phase: GamePhase.Draw,
    title: 'Phase de Pioche',
    message: 'Vous piochez 1 carte par tour (sauf au premier tour). Votre main est en bas de l\'ecran.',
    highlightSelector: '.hand-zone',
    position: 'bottom',
    waitFor: 'click',
  },
  {
    id: 3,
    phase: GamePhase.Hiring,
    title: 'Votre Main',
    message: 'Voici votre main. Chaque carte coute du Budget a jouer. Les Metiers vont sur le terrain, les Evenements ont un effet immediat.',
    highlightSelector: '.hand-zone',
    position: 'bottom',
    waitFor: 'click',
  },
  {
    id: 4,
    phase: GamePhase.Hiring,
    title: 'Embauchez un Metier',
    message: 'Cliquez sur une carte de votre main pour l\'embaucher. Son cout sera deduit de votre budget.',
    highlightSelector: '.hand-zone',
    position: 'bottom',
    waitFor: 'action',
  },
  {
    id: 5,
    phase: GamePhase.Hiring,
    title: 'Metier deploye !',
    message: 'Votre Metier est sur le terrain ! Il ne peut pas attaquer le tour ou il est embauche (sauf avec Celerite).',
    highlightSelector: '.field-zone',
    position: 'bottom',
    waitFor: 'click',
  },
  {
    id: 6,
    phase: null,
    title: 'Passer les phases',
    message: 'Appuyez sur Espace ou cliquez le bouton Suivant dans la barre de phases pour avancer. Passons au tour suivant.',
    highlightSelector: '.phase-bar',
    position: 'top',
    waitFor: 'click',
  },
  {
    id: 7,
    phase: GamePhase.Work_Attack,
    title: 'Phase d\'Attaque',
    message: 'C\'est votre phase de travail ! Cliquez sur un Metier pour l\'envoyer attaquer l\'adversaire.',
    position: 'center',
    waitFor: 'phase',
    targetPhase: GamePhase.Work_Attack,
  },
  {
    id: 8,
    phase: GamePhase.Work_Block,
    title: 'Phase de Blocage',
    message: 'L\'adversaire peut assigner des bloqueurs pour defendre. Les bloqueurs interceptent les attaquants.',
    position: 'center',
    waitFor: 'phase',
    targetPhase: GamePhase.Work_Block,
  },
  {
    id: 9,
    phase: GamePhase.Work_Damage,
    title: 'Resolution des degats',
    message: 'Les degats sont resolus. Les attaques non bloquees touchent la Reputation adverse. Les combats bloques sont resolus carte contre carte.',
    position: 'center',
    waitFor: 'phase',
    targetPhase: GamePhase.Work_Damage,
  },
  {
    id: 10,
    phase: null,
    title: 'Effets automatiques',
    message: 'Certaines cartes ont des effets automatiques — regardez le log de partie pour voir ce qui se passe ! Les effets sont resolus automatiquement.',
    highlightSelector: '.log-toggle',
    position: 'bottom',
    waitFor: 'click',
  },
  {
    id: 11,
    phase: null,
    title: 'Vous etes pret !',
    message: 'Vous connaissez maintenant les bases de Job Wars. Bonne chance et amusez-vous bien !',
    position: 'center',
    waitFor: 'click',
  },
];

@Injectable({ providedIn: 'root' })
export class TutorialService {
  isActive = false;
  currentStepIndex = 0;

  get currentStep(): TutorialStep | null {
    if (!this.isActive) return null;
    return TUTORIAL_STEPS[this.currentStepIndex] ?? null;
  }

  get totalSteps(): number {
    return TUTORIAL_STEPS.length;
  }

  start(): void {
    this.isActive = true;
    this.currentStepIndex = 0;
  }

  advance(): void {
    if (!this.isActive) return;
    this.currentStepIndex++;
    if (this.currentStepIndex >= TUTORIAL_STEPS.length) {
      this.stop();
    }
  }

  onPhaseChange(phase: GamePhase): void {
    if (!this.isActive) return;
    const step = this.currentStep;
    if (!step) return;

    if (step.waitFor === 'phase' && step.targetPhase === phase) {
      this.advance();
    }
  }

  onAction(): void {
    if (!this.isActive) return;
    const step = this.currentStep;
    if (!step) return;

    if (step.waitFor === 'action') {
      this.advance();
    }
  }

  stop(): void {
    this.isActive = false;
    this.currentStepIndex = 0;
  }
}
