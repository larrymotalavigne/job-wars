import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

// Message types (synced with server)
export enum MessageType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',
  RECONNECTED = 'reconnected',
  PLAYER_DISCONNECTED = 'player_disconnected',
  CREATE_ROOM = 'create_room',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  FIND_MATCH = 'find_match',
  ROOM_CREATED = 'room_created',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  GAME_START = 'game_start',
  GAME_ACTION = 'game_action',
  GAME_STATE = 'game_state',
  TURN_START = 'turn_start',
  GAME_END = 'game_end',
  CHAT = 'chat',
  EMOTE = 'emote',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong',
}

export interface MultiplayerMessage {
  type: MessageType;
  timestamp: number;
  [key: string]: any;
}

export interface GameAction {
  type: 'play_card' | 'attack' | 'declare_blocker' | 'end_turn' | 'mulligan' | 'keep_hand';
  playerId: string;
  data?: any;
}

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  IN_ROOM = 'in_room',
  IN_GAME = 'in_game',
}

export interface RoomInfo {
  code: string;
  playerId: string;
  opponentId?: string;
  opponentName?: string;
  isHost: boolean;
}

@Injectable({ providedIn: 'root' })
export class MultiplayerService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private reconnectTimer: any = null;
  private isReconnecting = false;

  // LocalStorage keys
  private readonly STORAGE_KEY_ROOM = 'jobwars_room_info';

  // Observables
  private connectionStateSubject = new BehaviorSubject<ConnectionState>(
    ConnectionState.DISCONNECTED,
  );
  private messagesSubject = new Subject<MultiplayerMessage>();
  private roomInfoSubject = new BehaviorSubject<RoomInfo | null>(null);
  private opponentDisconnectedSubject = new BehaviorSubject<{
    disconnected: boolean;
    deadline?: number;
  }>({
    disconnected: false,
  });

  public connectionState$ = this.connectionStateSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public roomInfo$ = this.roomInfoSubject.asObservable();
  public opponentDisconnected$ = this.opponentDisconnectedSubject.asObservable();

  // Server URL from environment (fallback to localhost for dev)
  private serverUrl = 'ws://localhost:3001';

  constructor() {
    // Check if we're in production
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      // In production, use wss:// and get from environment or config
      const hostname = window.location.hostname;
      this.serverUrl = `wss://${hostname}/ws`;
    }
  }

  get connectionState(): ConnectionState {
    return this.connectionStateSubject.value;
  }

  get roomInfo(): RoomInfo | null {
    return this.roomInfoSubject.value;
  }

  /**
   * Connect to the multiplayer server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.connectionStateSubject.next(ConnectionState.CONNECTING);

      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          console.log('🟢 Connected to multiplayer server');
          this.connectionStateSubject.next(ConnectionState.CONNECTED);
          this.reconnectAttempts = 0;

          // Check if we should attempt to rejoin a room
          if (this.isReconnecting) {
            const savedRoom = this.getSavedRoom();
            if (savedRoom) {
              console.log(`🔄 Attempting to rejoin room ${savedRoom.code}`);
              this.send({
                type: MessageType.RECONNECT,
                roomCode: savedRoom.code,
                playerId: savedRoom.playerId,
                timestamp: Date.now(),
              });
            }
            this.isReconnecting = false;
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: MultiplayerMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Error parsing server message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔴 Disconnected from multiplayer server');
          this.connectionStateSubject.next(ConnectionState.DISCONNECTED);
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        this.connectionStateSubject.next(ConnectionState.DISCONNECTED);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionStateSubject.next(ConnectionState.DISCONNECTED);
    this.roomInfoSubject.next(null);
    this.clearSavedRoom(); // Clear saved room when explicitly disconnecting
  }

  /**
   * Create a new room
   */
  createRoom(playerName: string, deckId: string): void {
    this.send({
      type: MessageType.CREATE_ROOM,
      playerName,
      deckId,
      timestamp: Date.now(),
    });
  }

  /**
   * Join an existing room
   */
  joinRoom(roomCode: string, playerName: string, deckId: string): void {
    this.send({
      type: MessageType.JOIN_ROOM,
      roomCode: roomCode.toUpperCase(),
      playerName,
      deckId,
      timestamp: Date.now(),
    });
  }

  /**
   * Find a random match
   */
  findMatch(playerName: string, deckId: string): void {
    this.send({
      type: MessageType.FIND_MATCH,
      playerName,
      deckId,
      timestamp: Date.now(),
    });
  }

  /**
   * Send a game action to the server
   */
  sendGameAction(action: GameAction): void {
    this.send({
      type: MessageType.GAME_ACTION,
      action,
      timestamp: Date.now(),
    });
  }

  /**
   * Send a chat message
   */
  sendChat(message: string): void {
    this.send({
      type: MessageType.CHAT,
      message,
      timestamp: Date.now(),
    });
  }

  /**
   * Send an emote
   */
  sendEmote(emoteId: string): void {
    this.send({
      type: MessageType.EMOTE,
      emoteId,
      timestamp: Date.now(),
    });
  }

  /**
   * Report game end to server for match history
   */
  sendGameEnd(winnerId: string | null, turnCount: number, gameStartTime: number): void {
    this.send({
      type: MessageType.GAME_END,
      winnerId,
      turnCount,
      gameStartTime,
      timestamp: Date.now(),
    });
  }

  /**
   * Leave current room
   */
  leaveRoom(): void {
    this.send({
      type: MessageType.LEAVE_ROOM,
      timestamp: Date.now(),
    });
    this.roomInfoSubject.next(null);
    this.connectionStateSubject.next(ConnectionState.CONNECTED);
    this.clearSavedRoom(); // Clear saved room when leaving
    this.opponentDisconnectedSubject.next({ disconnected: false }); // Clear disconnect state
  }

  // Private methods

  private handleMessage(message: MultiplayerMessage): void {
    console.log('📨 Received:', message.type);

    switch (message.type) {
      case MessageType.ROOM_CREATED:
        this.handleRoomCreated(message);
        break;
      case MessageType.PLAYER_JOINED:
        this.handlePlayerJoined(message);
        break;
      case MessageType.PLAYER_LEFT:
        this.handlePlayerLeft(message);
        break;
      case MessageType.PLAYER_DISCONNECTED:
        this.handlePlayerDisconnected(message);
        break;
      case MessageType.RECONNECTED:
        this.handleReconnected(message);
        break;
      case MessageType.GAME_START:
        this.handleGameStart(message);
        break;
      case MessageType.PONG:
        // Ping/pong for keep-alive
        break;
      default:
        // Forward all other messages to subscribers
        this.messagesSubject.next(message);
    }
  }

  private handleRoomCreated(message: any): void {
    const roomInfo: RoomInfo = {
      code: message.roomCode,
      playerId: message.playerId,
      isHost: true,
    };
    this.roomInfoSubject.next(roomInfo);
    this.connectionStateSubject.next(ConnectionState.IN_ROOM);
    this.saveRoom(roomInfo); // Save for reconnection
    this.messagesSubject.next(message);
  }

  private handlePlayerJoined(message: any): void {
    const currentRoom = this.roomInfoSubject.value;
    if (currentRoom && message.playerId !== currentRoom.playerId) {
      // Opponent joined
      currentRoom.opponentId = message.playerId;
      currentRoom.opponentName = message.playerName;
      this.roomInfoSubject.next({ ...currentRoom });
      this.saveRoom(currentRoom); // Update saved room info
    } else if (!currentRoom && message.playerId) {
      // We joined a room (response to JOIN_ROOM or FIND_MATCH)
      const roomInfo: RoomInfo = {
        code: message.roomCode || this.roomInfoSubject.value?.code || '',
        playerId: message.playerId,
        isHost: false,
      };
      this.roomInfoSubject.next(roomInfo);
      this.connectionStateSubject.next(ConnectionState.IN_ROOM);
      this.saveRoom(roomInfo);
    }
    this.messagesSubject.next(message);
  }

  private handlePlayerLeft(message: any): void {
    const currentRoom = this.roomInfoSubject.value;
    if (currentRoom && message.playerId === currentRoom.opponentId) {
      // Opponent left
      currentRoom.opponentId = undefined;
      currentRoom.opponentName = undefined;
      this.roomInfoSubject.next({ ...currentRoom });
    }
    this.messagesSubject.next(message);
  }

  private handleGameStart(message: any): void {
    this.connectionStateSubject.next(ConnectionState.IN_GAME);
    this.messagesSubject.next(message);
  }

  private handlePlayerDisconnected(message: any): void {
    console.log(
      '🔌 Opponent disconnected, can reconnect until:',
      new Date(message.reconnectDeadline),
    );
    this.opponentDisconnectedSubject.next({
      disconnected: true,
      deadline: message.reconnectDeadline,
    });
    this.messagesSubject.next(message);
  }

  private handleReconnected(message: any): void {
    console.log('✅ Successfully reconnected to room');
    this.isReconnecting = false;
    this.reconnectAttempts = 0;

    // Restore room state
    if (message.roomCode) {
      const savedRoom = this.getSavedRoom();
      if (savedRoom && savedRoom.code === message.roomCode) {
        this.roomInfoSubject.next(savedRoom);
        this.connectionStateSubject.next(ConnectionState.IN_GAME);
      }
    }

    // Clear opponent disconnected state
    this.opponentDisconnectedSubject.next({ disconnected: false });

    this.messagesSubject.next(message);
  }

  private send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ Cannot send message: not connected');
      return;
    }
    this.ws.send(JSON.stringify(message));
  }

  private attemptReconnect(): void {
    // Check if we have a saved room to reconnect to
    const savedRoom = this.getSavedRoom();
    if (!savedRoom) {
      console.log('ℹ️ No room to reconnect to');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      this.clearSavedRoom();
      return;
    }

    this.reconnectAttempts++;
    this.isReconnecting = true;
    console.log(
      `🔄 Reconnecting to room ${savedRoom.code}... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    // Clear existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Exponential backoff: 2s, 4s, 8s, 16s, 32s
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('❌ Reconnection failed:', error);
        // Will trigger onclose which will call attemptReconnect again
      });
    }, delay);
  }

  private saveRoom(roomInfo: RoomInfo): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY_ROOM, JSON.stringify(roomInfo));
    }
  }

  private getSavedRoom(): RoomInfo | null {
    if (typeof localStorage === 'undefined') return null;

    const saved = localStorage.getItem(this.STORAGE_KEY_ROOM);
    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  private clearSavedRoom(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY_ROOM);
    }
  }
}
