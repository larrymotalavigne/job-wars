/**
 * Shared types between client and server
 */

// Message types
export enum MessageType {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',
  RECONNECTED = 'reconnected',
  PLAYER_DISCONNECTED = 'player_disconnected',

  // Room management
  CREATE_ROOM = 'create_room',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  FIND_MATCH = 'find_match',

  // Game setup
  ROOM_CREATED = 'room_created',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  GAME_START = 'game_start',

  // Game actions
  GAME_ACTION = 'game_action',
  GAME_STATE = 'game_state',
  TURN_START = 'turn_start',
  GAME_END = 'game_end',

  // Social
  CHAT = 'chat',
  EMOTE = 'emote',

  // Errors
  ERROR = 'error',

  // Ping/Pong
  PING = 'ping',
  PONG = 'pong',
}

// Base message
export interface BaseMessage {
  type: MessageType;
  timestamp: number;
}

// Connection messages
export interface ConnectMessage extends BaseMessage {
  type: MessageType.CONNECT;
  playerName: string;
  playerId?: string;
}

export interface ReconnectMessage extends BaseMessage {
  type: MessageType.RECONNECT;
  roomCode: string;
  playerId: string;
}

export interface ReconnectedMessage extends BaseMessage {
  type: MessageType.RECONNECTED;
  gameState: any;
  roomCode: string;
}

export interface PlayerDisconnectedMessage extends BaseMessage {
  type: MessageType.PLAYER_DISCONNECTED;
  playerId: string;
  playerName: string;
  reconnectDeadline: number; // Timestamp when the room will be closed
}

// Room messages
export interface CreateRoomMessage extends BaseMessage {
  type: MessageType.CREATE_ROOM;
  playerName: string;
  deckId: string;
}

export interface JoinRoomMessage extends BaseMessage {
  type: MessageType.JOIN_ROOM;
  roomCode: string;
  playerName: string;
  deckId: string;
}

export interface FindMatchMessage extends BaseMessage {
  type: MessageType.FIND_MATCH;
  playerName: string;
  deckId: string;
}

export interface RoomCreatedMessage extends BaseMessage {
  type: MessageType.ROOM_CREATED;
  roomCode: string;
  playerId: string;
}

export interface PlayerJoinedMessage extends BaseMessage {
  type: MessageType.PLAYER_JOINED;
  playerId: string;
  playerName: string;
  isReady: boolean;
}

export interface PlayerLeftMessage extends BaseMessage {
  type: MessageType.PLAYER_LEFT;
  playerId: string;
}

export interface GameStartMessage extends BaseMessage {
  type: MessageType.GAME_START;
  gameState: any; // Full game state from server
}

// Game action messages
export interface GameActionMessage extends BaseMessage {
  type: MessageType.GAME_ACTION;
  action: GameAction;
}

export interface GameStateMessage extends BaseMessage {
  type: MessageType.GAME_STATE;
  gameState: any; // Partial or full game state update
}

export interface TurnStartMessage extends BaseMessage {
  type: MessageType.TURN_START;
  playerId: string;
  turnDuration: number; // Duration in milliseconds
}

export interface GameEndMessage extends BaseMessage {
  type: MessageType.GAME_END;
  winnerId: string | null; // null for draw
  turnCount: number;
  gameStartTime: number;
}

// Social messages
export interface ChatMessage extends BaseMessage {
  type: MessageType.CHAT;
  playerId: string;
  playerName: string;
  message: string;
}

export interface EmoteMessage extends BaseMessage {
  type: MessageType.EMOTE;
  playerId: string;
  playerName: string;
  emoteId: string;
}

// Error message
export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  code: string;
  message: string;
}

// Game actions
export interface GameAction {
  type: 'play_card' | 'attack' | 'declare_blocker' | 'end_turn' | 'mulligan' | 'keep_hand';
  playerId: string;
  data?: any;
}

// Server-side types
export interface Player {
  id: string;
  name: string;
  deckId: string;
  ws: any; // WebSocket instance
  isReady: boolean;
  lastPing: number;
  disconnectedAt?: number; // Timestamp of disconnection
  reconnectTimer?: NodeJS.Timeout; // Timer for cleanup
}

export interface Room {
  code: string;
  players: Player[];
  gameState: any | null;
  createdAt: number;
  status: 'waiting' | 'playing' | 'finished';
  disconnectDeadline?: number; // When to close room due to disconnect
  currentTurnTimer?: NodeJS.Timeout; // Timer for current turn
  currentTurnStart?: number; // Timestamp when current turn started
  currentTurnPlayerId?: string; // Player ID whose turn it is
  actionHistory?: Array<{ playerId: string; action: string; timestamp: number }>; // For rate limiting
  suspiciousActivity?: number; // Counter for suspicious actions
  gameStartTime?: number; // When the game actually started (after mulligan)
}

// Union type for all messages
export type ServerMessage =
  | RoomCreatedMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerDisconnectedMessage
  | ReconnectedMessage
  | GameStartMessage
  | GameStateMessage
  | TurnStartMessage
  | ChatMessage
  | EmoteMessage
  | ErrorMessage
  | BaseMessage;

export type ClientMessage =
  | ConnectMessage
  | ReconnectMessage
  | CreateRoomMessage
  | JoinRoomMessage
  | FindMatchMessage
  | GameActionMessage
  | GameEndMessage
  | ChatMessage
  | EmoteMessage
  | BaseMessage;
