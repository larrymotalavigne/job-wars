import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService } from '../../../services/game.service';
import { AiService } from '../../../services/ai.service';
import { SoundService, SoundEffect } from '../../../services/sound.service';
import {
  MultiplayerService,
  ConnectionState,
  MessageType,
} from '../../../services/multiplayer.service';
import { GameState, GamePhase } from '../../../models/game.model';
import { TutorialService } from '../../../services/tutorial.service';
import { PhaseBarComponent } from '../phase-bar/phase-bar.component';
import { PlayerAreaComponent } from '../player-area/player-area.component';
import { TurnTransitionComponent } from '../turn-transition/turn-transition.component';
import { CombatOverlayComponent } from '../combat-overlay/combat-overlay.component';
import { MulliganOverlayComponent } from '../mulligan-overlay/mulligan-overlay.component';
import { TargetingOverlayComponent } from '../targeting-overlay/targeting-overlay.component';
import { TutorialOverlayComponent } from '../tutorial-overlay/tutorial-overlay.component';
import { GameLogComponent } from '../game-log/game-log.component';
import { ManualActionsComponent } from '../manual-actions/manual-actions.component';
import { EmoteMenuComponent } from '../emote-menu/emote-menu.component';
import { EmoteDisplayComponent } from '../emote-display/emote-display.component';
import { ChatPanelComponent } from '../chat-panel/chat-panel.component';
import { TurnTimerComponent } from '../turn-timer/turn-timer.component';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [
    CommonModule,
    PhaseBarComponent,
    PlayerAreaComponent,
    TurnTransitionComponent,
    CombatOverlayComponent,
    MulliganOverlayComponent,
    TargetingOverlayComponent,
    TutorialOverlayComponent,
    GameLogComponent,
    ManualActionsComponent,
    EmoteMenuComponent,
    EmoteDisplayComponent,
    ChatPanelComponent,
    TurnTimerComponent,
    Button,
    Dialog,
  ],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss',
})
export class GameBoardComponent implements OnInit, OnDestroy {
  state: GameState | null = null;
  showTransition = false;
  showLog = false;
  showVictory = false;
  private previousActivePlayer = '';
  private subscriptions: Subscription[] = [];

  private aiActivated = false;
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;

  // Reconnection state
  opponentDisconnected = false;
  disconnectDeadline: number | null = null;
  isReconnecting = false;

  // Online game state
  get isOnlineGame(): boolean {
    return this.multiplayerService.connectionState === ConnectionState.IN_GAME;
  }

  constructor(
    public gameService: GameService,
    public tutorialService: TutorialService,
    private aiService: AiService,
    private soundService: SoundService,
    private multiplayerService: MultiplayerService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Check if this is an online game
    const onlineGameInfo = (this.gameService as any).onlineGameInfo;
    if (onlineGameInfo) {
      this.gameService.startOnlineGame(onlineGameInfo);
      // Clear the info after using it
      (this.gameService as any).onlineGameInfo = null;
    }

    this.subscriptions.push(
      this.gameService.gameState$.subscribe((state) => {
        if (!state) return;

        // Activate AI on first AI-game state emission
        if (state.isAiGame && !this.aiActivated) {
          this.aiActivated = true;
          this.aiService.activate();
        }

        // Detect player switch for transition
        if (this.previousActivePlayer && this.previousActivePlayer !== state.activePlayerId) {
          this.showTransition = true;

          // Play turn change sound for online games
          if (this.isOnlineGame) {
            this.soundService.play(SoundEffect.TurnChange);
          }

          // In AI games, auto-dismiss transition after 1.5s when switching to AI turn
          if (state.isAiGame && state.activePlayerId === 'player2') {
            this.aiService.pause();
            if (this.transitionTimer) clearTimeout(this.transitionTimer);
            this.transitionTimer = setTimeout(() => {
              this.showTransition = false;
              this.aiService.resume();
              this.transitionTimer = null;
            }, 1500);
          }
        }
        this.previousActivePlayer = state.activePlayerId;

        // Detect victory
        if (state.winner && !this.showVictory) {
          this.showVictory = true;
        }

        // Notify tutorial of phase changes
        this.tutorialService.onPhaseChange(state.phase);

        this.state = state;
      }),
    );

    // Subscribe to opponent disconnection status
    this.subscriptions.push(
      this.multiplayerService.opponentDisconnected$.subscribe((status) => {
        this.opponentDisconnected = status.disconnected;
        this.disconnectDeadline = status.deadline || null;
      }),
    );

    // Subscribe to connection state for reconnection indicator
    this.subscriptions.push(
      this.multiplayerService.connectionState$.subscribe((state) => {
        this.isReconnecting = state === ConnectionState.CONNECTING;
      }),
    );

    // Subscribe to multiplayer messages for sounds
    this.subscriptions.push(
      this.multiplayerService.messages$.subscribe((message) => {
        this.handleMultiplayerSound(message);
      }),
    );
  }

  private handleMultiplayerSound(message: any): void {
    const myPlayerId = this.multiplayerService.roomInfo?.playerId;

    switch (message.type) {
      case MessageType.GAME_ACTION:
        // Play sound for opponent actions
        if (message.action?.playerId !== myPlayerId) {
          this.soundService.play(SoundEffect.OpponentAction);
        }
        break;

      case MessageType.CHAT:
        // Play sound for incoming chat messages (not our own)
        if (message['playerId'] !== myPlayerId) {
          this.soundService.play(SoundEffect.ChatMessage);
        }
        break;

      case MessageType.EMOTE:
        // Play sound for emotes
        this.soundService.play(SoundEffect.EmoteSent);
        break;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.aiService.deactivate();
    if (this.transitionTimer) clearTimeout(this.transitionTimer);
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.showTransition || this.showVictory) return;
    if (this.state?.phase === GamePhase.Mulligan) return;
    if (this.state?.pendingEffect) return;
    if (this.isAiTurn) return;
    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault();
      this.gameService.advancePhase();
    }
  }

  get isMulliganPhase(): boolean {
    return this.state?.phase === GamePhase.Mulligan || false;
  }

  get isAiTurn(): boolean {
    return !!this.state?.isAiGame && this.state.activePlayerId === 'player2';
  }

  get shouldHideCombatOverlay(): boolean {
    if (!this.state?.isAiGame) return false;
    // Hide when AI is the attacker (AI declared attacks, now in block/damage)
    // Human needs the overlay when AI attacks (human must block)
    // Hide when AI is the defender (human attacked, AI auto-blocks)
    if (this.state.activePlayerId === 'player2') {
      // AI's turn: AI attacks. Block phase = human blocks (show overlay).
      // Damage phase = just resolve (hide).
      return (
        this.state.phase === GamePhase.Work_Attack || this.state.phase === GamePhase.Work_Damage
      );
    } else {
      // Human's turn: human attacks. Block phase = AI auto-blocks (hide).
      // Damage phase = just resolve (hide).
      return (
        this.state.phase === GamePhase.Work_Block || this.state.phase === GamePhase.Work_Damage
      );
    }
  }

  onTransitionDismiss(): void {
    this.showTransition = false;
  }

  toggleLog(): void {
    this.showLog = !this.showLog;
  }

  getWinnerName(): string {
    if (!this.state?.winner) return '';
    return this.state.winner === this.state.player1.id
      ? this.state.player1.name
      : this.state.player2.name;
  }

  exitGame(): void {
    this.gameService.endGame();
    this.router.navigate(['/game']);
  }

  get showCombatOverlay(): boolean {
    return (
      !!this.state?.combat &&
      (this.state.phase === GamePhase.Work_Attack ||
        this.state.phase === GamePhase.Work_Block ||
        this.state.phase === GamePhase.Work_Damage)
    );
  }
}
