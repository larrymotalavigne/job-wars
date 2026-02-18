import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { Card as PCard } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { DeckService } from '../../../services/deck.service';
import { GameService } from '../../../services/game.service';
import { TutorialService } from '../../../services/tutorial.service';
import { SoundService, SoundEffect } from '../../../services/sound.service';
import { MultiplayerService, ConnectionState, MessageType } from '../../../services/multiplayer.service';
import { Deck, DeckValidation, StarterDeck } from '../../../models/deck.model';

interface DeckOption {
  label: string;
  value: string;
  totalCards: number;
}

interface DeckGroup {
  label: string;
  items: DeckOption[];
}

interface WaitingRoom {
  code: string;
  hostName: string;
  hostDeckId: string;
  createdAt: number;
  playersCount: number;
}

@Component({
  selector: 'app-game-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, InputText, Select, Button, PCard, Tag, RouterLink, Toast],
  providers: [MessageService],
  templateUrl: './game-lobby.component.html',
  styleUrl: './game-lobby.component.scss',
})
export class GameLobbyComponent implements OnInit, OnDestroy {
  // Game mode
  gameMode: 'local' | 'online' = 'local';

  // Local game settings
  p1Name = 'Joueur 1';
  p2Name = 'Joueur 2';
  p1DeckId = '';
  p2DeckId = '';
  deckOptions: DeckGroup[] = [];
  starterDecks: StarterDeck[] = [];
  p1Validation: DeckValidation | null = null;
  p2Validation: DeckValidation | null = null;

  // Online multiplayer settings
  playerName = '';
  selectedDeckId = '';
  roomCodeInput = '';
  currentRoomCode = '';
  isWaitingForOpponent = false;
  isSearchingMatch = false;
  opponentName = '';

  // Connection state
  ConnectionState = ConnectionState;
  connectionState: ConnectionState = ConnectionState.DISCONNECTED;

  // Lobby browser
  availableRooms: WaitingRoom[] = [];
  loadingRooms = false;
  showLobbyBrowser = false;

  private subscriptions: Subscription[] = [];
  private apiUrl = 'http://localhost:3001/api';
  private roomRefreshInterval?: any;

  constructor(
    private deckService: DeckService,
    private gameService: GameService,
    private tutorialService: TutorialService,
    private soundService: SoundService,
    private multiplayerService: MultiplayerService,
    private messageService: MessageService,
    private router: Router,
    private http: HttpClient,
    private ngZone: NgZone,
  ) {
    // In production, use the same host
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      this.apiUrl = `${window.location.protocol}//${window.location.hostname}/api`;
    }
  }

  ngOnInit(): void {
    this.loadDecks();

    // Subscribe to connection state
    this.subscriptions.push(
      this.multiplayerService.connectionState$.subscribe(state => {
        this.connectionState = state;
      })
    );

    // Subscribe to room info
    this.subscriptions.push(
      this.multiplayerService.roomInfo$.subscribe(roomInfo => {
        if (roomInfo) {
          this.currentRoomCode = roomInfo.code;
          this.isWaitingForOpponent = !roomInfo.opponentId;
          if (roomInfo.opponentName) {
            this.opponentName = roomInfo.opponentName;
          }
        } else {
          this.currentRoomCode = '';
          this.isWaitingForOpponent = false;
          this.isSearchingMatch = false;
        }
      })
    );

    // Subscribe to multiplayer messages
    this.subscriptions.push(
      this.multiplayerService.messages$.subscribe(message => {
        this.handleMultiplayerMessage(message);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // Clean up room refresh interval
    if (this.roomRefreshInterval) {
      clearInterval(this.roomRefreshInterval);
    }
  }

  private loadDecks(): void {
    this.starterDecks = this.deckService.getStarterDecks();

    const starterItems: DeckOption[] = this.starterDecks.map(s => {
      const total = s.entries.reduce((sum, e) => sum + e.quantity, 0);
      return { label: `${s.name} (${total} cartes)`, value: s.id, totalCards: total };
    });

    const userDecks = this.deckService.getAllDecks();
    const userItems: DeckOption[] = userDecks.map(d => {
      const total = d.entries.reduce((sum, e) => sum + e.quantity, 0);
      return { label: `${d.name} (${total} cartes)`, value: d.id, totalCards: total };
    });

    this.deckOptions = [];
    if (starterItems.length > 0) {
      this.deckOptions.push({ label: 'Decks Prédéfinis', items: starterItems });
    }
    if (userItems.length > 0) {
      this.deckOptions.push({ label: 'Mes Decks', items: userItems });
    }
  }

  onP1DeckChange(): void {
    if (this.p1DeckId) {
      const deck = this.deckService.getDeckById(this.p1DeckId);
      this.p1Validation = deck ? this.deckService.validateDeck(deck) : null;
    } else {
      this.p1Validation = null;
    }
  }

  onP2DeckChange(): void {
    if (this.p2DeckId) {
      const deck = this.deckService.getDeckById(this.p2DeckId);
      this.p2Validation = deck ? this.deckService.validateDeck(deck) : null;
    } else {
      this.p2Validation = null;
    }
  }

  get canStart(): boolean {
    return !!(this.p1DeckId && this.p2DeckId && this.p1Validation?.isValid && this.p2Validation?.isValid);
  }

  startGame(): void {
    if (!this.canStart) return;
    this.gameService.startGame(
      this.p1Name || 'Joueur 1',
      this.p1DeckId,
      this.p2Name || 'Joueur 2',
      this.p2DeckId,
    );
    this.router.navigate(['/game/play']);
  }

  startQuickGame(): void {
    this.gameService.startQuickGame(
      this.p1Name || 'Joueur 1',
      this.p2Name || 'Joueur 2',
    );
    this.router.navigate(['/game/play']);
  }

  startAiGame(): void {
    const starters = this.deckService.getStarterDecks();
    const aiDeck = starters[Math.floor(Math.random() * starters.length)];
    if (this.p1DeckId && this.p1Validation?.isValid) {
      this.gameService.startAiGame(this.p1Name || 'Joueur 1', this.p1DeckId, aiDeck.id);
    } else {
      this.gameService.startQuickAiGame(this.p1Name || 'Joueur 1');
    }
    this.router.navigate(['/game/play']);
  }

  startTutorial(): void {
    // Use Cyber Assault starter deck — guaranteed multiple 1-cost cards
    this.gameService.startGame('Vous', 'starter-cyber-assault', 'Adversaire', 'starter-cyber-assault');
    // Auto-complete mulligan for both players so tutorial skips to Budget
    this.gameService.mulligan('player1', []);
    this.gameService.mulligan('player2', []);
    this.tutorialService.start();
    this.router.navigate(['/game/play']);
  }

  selectStarterDeck(deckId: string, player: 1 | 2): void {
    if (player === 1) {
      this.p1DeckId = deckId;
      this.onP1DeckChange();
    } else {
      this.p2DeckId = deckId;
      this.onP2DeckChange();
    }
  }

  // --- Online Multiplayer Methods ---

  get canCreateRoom(): boolean {
    return !!(this.playerName && this.selectedDeckId && this.connectionState === ConnectionState.CONNECTED);
  }

  get canJoinRoom(): boolean {
    return !!(this.playerName && this.selectedDeckId && this.roomCodeInput && this.connectionState === ConnectionState.CONNECTED);
  }

  async connectToServer(): Promise<void> {
    try {
      await this.multiplayerService.connect();
      this.messageService.add({
        severity: 'success',
        summary: 'Connecté',
        detail: 'Connecté au serveur multijoueur',
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur de connexion',
        detail: 'Impossible de se connecter au serveur',
      });
    }
  }

  createRoom(): void {
    if (!this.canCreateRoom) return;
    this.multiplayerService.createRoom(this.playerName, this.selectedDeckId);
    this.isWaitingForOpponent = true;
  }

  joinRoom(): void {
    if (!this.canJoinRoom) return;
    this.multiplayerService.joinRoom(this.roomCodeInput, this.playerName, this.selectedDeckId);
  }

  findRandomMatch(): void {
    if (!this.canCreateRoom) return;
    this.multiplayerService.findMatch(this.playerName, this.selectedDeckId);
    this.isSearchingMatch = true;
  }

  leaveRoom(): void {
    this.multiplayerService.leaveRoom();
    this.isWaitingForOpponent = false;
    this.isSearchingMatch = false;
    this.currentRoomCode = '';
    this.opponentName = '';
  }

  copyRoomCode(): void {
    if (this.currentRoomCode) {
      navigator.clipboard.writeText(this.currentRoomCode);
      this.messageService.add({
        severity: 'success',
        summary: 'Copié',
        detail: 'Code de la salle copié dans le presse-papier',
      });
    }
  }

  // Lobby browser methods
  toggleLobbyBrowser(): void {
    this.showLobbyBrowser = !this.showLobbyBrowser;
    if (this.showLobbyBrowser) {
      // Defer first load to next tick so showLobbyBrowser CD completes first
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => this.ngZone.run(() => this.loadAvailableRooms()));
        // Run interval outside zone — only re-enter zone for actual data updates
        this.roomRefreshInterval = setInterval(
          () => this.ngZone.run(() => this.loadAvailableRooms()),
          5000,
        );
      });
    } else {
      if (this.roomRefreshInterval) {
        clearInterval(this.roomRefreshInterval);
        this.roomRefreshInterval = undefined;
      }
    }
  }

  async loadAvailableRooms(): Promise<void> {
    this.loadingRooms = true;
    try {
      const rooms = await this.http.get<WaitingRoom[]>(`${this.apiUrl}/rooms`).toPromise();
      this.availableRooms = rooms || [];
    } catch (error) {
      console.error('Failed to load rooms:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de charger la liste des salles',
      });
    } finally {
      this.loadingRooms = false;
    }
  }

  joinRoomFromBrowser(room: WaitingRoom): void {
    this.roomCodeInput = room.code;
    this.joinRoom();
    this.showLobbyBrowser = false;
    // Stop auto-refresh
    if (this.roomRefreshInterval) {
      clearInterval(this.roomRefreshInterval);
      this.roomRefreshInterval = undefined;
    }
  }

  formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `il y a ${minutes}m`;
    } else {
      return `il y a ${seconds}s`;
    }
  }

  getDeckName(deckId: string): string {
    const deck = this.deckService.getDeckById(deckId);
    return deck?.name || 'Deck Inconnu';
  }

  private handleMultiplayerMessage(message: any): void {
    switch (message.type) {
      case MessageType.ROOM_CREATED:
        this.messageService.add({
          severity: 'success',
          summary: 'Salle créée',
          detail: `Code: ${message.roomCode}`,
        });
        this.soundService.play(SoundEffect.ButtonClick);
        break;

      case MessageType.PLAYER_JOINED:
        if (message.playerId !== this.multiplayerService.roomInfo?.playerId) {
          this.messageService.add({
            severity: 'info',
            summary: 'Joueur rejoint',
            detail: `${message.playerName} a rejoint la partie`,
          });
          this.soundService.play(SoundEffect.PlayerJoined);
        }
        break;

      case MessageType.GAME_START:
        // Game is starting, navigate to game board
        this.messageService.add({
          severity: 'success',
          summary: 'Partie lancée',
          detail: 'La partie commence!',
        });
        this.soundService.play(SoundEffect.GameStart);
        // Store online game info for game service
        (this.gameService as any).onlineGameInfo = message.gameState;
        this.router.navigate(['/game/play']);
        break;

      case MessageType.PLAYER_LEFT:
        this.messageService.add({
          severity: 'warn',
          summary: 'Joueur parti',
          detail: 'Votre adversaire a quitté la partie',
        });
        this.soundService.play(SoundEffect.PlayerLeft);
        break;

      case MessageType.ERROR:
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: message.message,
        });
        this.isWaitingForOpponent = false;
        this.isSearchingMatch = false;
        break;
    }
  }
}
