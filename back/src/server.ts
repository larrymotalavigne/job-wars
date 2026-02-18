import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as dotenv from 'dotenv';
import {
  MessageType,
  Room,
  Player,
  CreateRoomMessage,
  JoinRoomMessage,
  FindMatchMessage,
  GameActionMessage,
  ReconnectMessage,
  ReconnectedMessage,
  PlayerDisconnectedMessage,
  TurnStartMessage,
  ChatMessage,
  EmoteMessage,
  ClientMessage,
  ServerMessage,
} from './types';
import { GameValidator } from './game-validator';
import { GameDatabase } from './database';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const PING_INTERVAL = 30000; // 30 seconds
const ROOM_EXPIRY = 3600000; // 1 hour
const RECONNECT_TIMEOUT = 120000; // 2 minutes
const TURN_DURATION = 90000; // 90 seconds per turn

class GameServer {
  private wss: WebSocketServer;
  private rooms: Map<string, Room> = new Map();
  private matchmakingQueue: Player[] = [];
  private pingInterval!: NodeJS.Timeout;
  private database: GameDatabase;

  constructor(port: number) {
    // Initialize database
    this.database = new GameDatabase();

    // Create HTTP server for health checks and stats API
    const server = http.createServer((req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          rooms: this.rooms.size,
          queueLength: this.matchmakingQueue.length,
          uptime: process.uptime(),
        }));
      } else if (req.url === '/api/stats') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.database.getTotalStats()));
      } else if (req.url === '/api/leaderboard') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.database.getLeaderboard(10)));
      } else if (req.url === '/api/matches/recent') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.database.getRecentMatches(20)));
      } else if (req.url?.startsWith('/api/player/')) {
        const playerId = req.url.split('/')[3];
        if (playerId) {
          const stats = this.database.getPlayerStats(playerId);
          if (stats) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(stats));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Player not found' }));
          }
        } else {
          res.writeHead(400);
          res.end('Bad Request');
        }
      } else if (req.url === '/api/rooms') {
        // List all waiting rooms for lobby browser
        const waitingRooms = this.getWaitingRooms();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(waitingRooms));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();
    this.startPingInterval();
    this.startCleanupInterval();

    server.listen(port, () => {
      console.log(`🎮 Job Wars Multiplayer Server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
    });
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('👤 New connection');

      ws.on('message', (data: Buffer) => {
        try {
          const message: ClientMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('❌ Error parsing message:', error);
          this.sendError(ws, 'PARSE_ERROR', 'Invalid message format');
        }
      });

      ws.on('close', () => {
        console.log('👋 Connection closed');
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: ClientMessage) {
    console.log('📨 Received:', message.type);

    switch (message.type) {
      case MessageType.CREATE_ROOM:
        this.handleCreateRoom(ws, message as CreateRoomMessage);
        break;
      case MessageType.JOIN_ROOM:
        this.handleJoinRoom(ws, message as JoinRoomMessage);
        break;
      case MessageType.FIND_MATCH:
        this.handleFindMatch(ws, message as FindMatchMessage);
        break;
      case MessageType.RECONNECT:
        this.handleReconnect(ws, message as any);
        break;
      case MessageType.GAME_ACTION:
        this.handleGameAction(ws, message as GameActionMessage);
        break;
      case MessageType.CHAT:
        this.handleChat(ws, message as ChatMessage);
        break;
      case MessageType.EMOTE:
        this.handleEmote(ws, message as EmoteMessage);
        break;
      case MessageType.GAME_END:
        this.handleGameEnd(ws, message as any);
        break;
      case MessageType.PING:
        this.send(ws, { type: MessageType.PONG, timestamp: Date.now() });
        break;
      default:
        console.warn('⚠️  Unknown message type:', message.type);
    }
  }

  private handleCreateRoom(ws: WebSocket, message: CreateRoomMessage) {
    const roomCode = this.generateRoomCode();
    const player: Player = {
      id: crypto.randomUUID(),
      name: message.playerName,
      deckId: message.deckId,
      ws,
      isReady: true,
      lastPing: Date.now(),
    };

    const room: Room = {
      code: roomCode,
      players: [player],
      gameState: null,
      createdAt: Date.now(),
      status: 'waiting',
    };

    this.rooms.set(roomCode, room);
    (ws as any).playerId = player.id;
    (ws as any).roomCode = roomCode;

    console.log(`🎲 Room created: ${roomCode}`);

    this.send(ws, {
      type: MessageType.ROOM_CREATED,
      roomCode,
      playerId: player.id,
      timestamp: Date.now(),
    });
  }

  private handleJoinRoom(ws: WebSocket, message: JoinRoomMessage) {
    const room = this.rooms.get(message.roomCode);

    if (!room) {
      this.sendError(ws, 'ROOM_NOT_FOUND', 'Room not found');
      return;
    }

    if (room.players.length >= 2) {
      this.sendError(ws, 'ROOM_FULL', 'Room is full');
      return;
    }

    if (room.status !== 'waiting') {
      this.sendError(ws, 'GAME_IN_PROGRESS', 'Game already in progress');
      return;
    }

    const player: Player = {
      id: crypto.randomUUID(),
      name: message.playerName,
      deckId: message.deckId,
      ws,
      isReady: true,
      lastPing: Date.now(),
    };

    room.players.push(player);
    (ws as any).playerId = player.id;
    (ws as any).roomCode = room.code;

    console.log(`👥 Player joined room ${room.code}: ${player.name}`);

    // Notify both players
    room.players.forEach(p => {
      this.send(p.ws, {
        type: MessageType.PLAYER_JOINED,
        playerId: player.id,
        playerName: player.name,
        isReady: player.isReady,
        timestamp: Date.now(),
      });
    });

    // Start game if 2 players
    if (room.players.length === 2) {
      this.startGame(room);
    }
  }

  private handleFindMatch(ws: WebSocket, message: FindMatchMessage) {
    const player: Player = {
      id: crypto.randomUUID(),
      name: message.playerName,
      deckId: message.deckId,
      ws,
      isReady: true,
      lastPing: Date.now(),
    };

    (ws as any).playerId = player.id;

    // Check if someone is already in queue
    const opponent = this.matchmakingQueue.shift();

    if (opponent) {
      // Create room with both players
      const roomCode = this.generateRoomCode();
      const room: Room = {
        code: roomCode,
        players: [opponent, player],
        gameState: null,
        createdAt: Date.now(),
        status: 'waiting',
      };

      this.rooms.set(roomCode, room);
      (opponent.ws as any).roomCode = roomCode;
      (ws as any).roomCode = roomCode;

      console.log(`🎮 Matchmaking: ${opponent.name} vs ${player.name}`);

      // Notify both players
      room.players.forEach(p => {
        this.send(p.ws, {
          type: MessageType.ROOM_CREATED,
          roomCode,
          playerId: p.id,
          timestamp: Date.now(),
        });
      });

      // Start game
      this.startGame(room);
    } else {
      // Add to queue
      this.matchmakingQueue.push(player);
      console.log(`⏳ Player added to queue: ${player.name}`);
    }
  }

  private startGame(room: Room) {
    room.status = 'playing';
    console.log(`🎮 Starting game in room ${room.code}`);

    // Send game start to both players with their roles
    const [player1, player2] = room.players;

    this.send(player1.ws, {
      type: MessageType.GAME_START,
      gameState: {
        roomCode: room.code,
        yourPlayerId: player1.id,
        opponentId: player2.id,
        player1: {
          id: player1.id,
          name: player1.name,
          deckId: player1.deckId,
        },
        player2: {
          id: player2.id,
          name: player2.name,
          deckId: player2.deckId,
        },
      },
      timestamp: Date.now(),
    });

    this.send(player2.ws, {
      type: MessageType.GAME_START,
      gameState: {
        roomCode: room.code,
        yourPlayerId: player2.id,
        opponentId: player1.id,
        player1: {
          id: player1.id,
          name: player1.name,
          deckId: player1.deckId,
        },
        player2: {
          id: player2.id,
          name: player2.name,
          deckId: player2.deckId,
        },
      },
      timestamp: Date.now(),
    });

    // Start turn timer for player 1 (goes first)
    // Note: Timer starts after mulligan, so we'll start it when we receive the first keep_hand action
  }

  private handleGameAction(ws: WebSocket, message: GameActionMessage) {
    const roomCode = (ws as any).roomCode;
    const room = this.rooms.get(roomCode);

    if (!room) {
      this.sendError(ws, 'ROOM_NOT_FOUND', 'Room not found');
      return;
    }

    const playerId = (ws as any).playerId;

    // Initialize action history if needed
    if (!room.actionHistory) {
      room.actionHistory = [];
    }

    // Rate limiting: Check recent actions (max 10 per second)
    const now = Date.now();
    const recentActions = room.actionHistory.filter(a =>
      a.playerId === playerId && now - a.timestamp < 1000
    );

    if (recentActions.length >= 10) {
      console.warn(`⚠️  Rate limit exceeded for player ${playerId} in room ${roomCode}`);
      this.sendError(ws, 'RATE_LIMIT', 'Too many actions. Slow down!');

      // Track suspicious activity
      room.suspiciousActivity = (room.suspiciousActivity || 0) + 1;

      // Kick player if too many violations
      if (room.suspiciousActivity > 5) {
        console.error(`🚫 Kicking player ${playerId} for excessive violations`);
        this.sendError(ws, 'KICKED', 'Kicked for suspicious activity');
        ws.close();
      }
      return;
    }

    // Basic turn validation for non-mulligan actions
    if (message.action.type !== 'mulligan' && message.action.type !== 'keep_hand') {
      if (room.currentTurnPlayerId && room.currentTurnPlayerId !== playerId) {
        console.warn(`⚠️  Player ${playerId} tried to act on opponent's turn`);
        this.sendError(ws, 'NOT_YOUR_TURN', 'Not your turn');
        return;
      }
    }

    // Log action
    room.actionHistory.push({
      playerId,
      action: message.action.type,
      timestamp: now,
    });

    // Clean old history (keep last 100 actions)
    if (room.actionHistory.length > 100) {
      room.actionHistory = room.actionHistory.slice(-100);
    }

    // Broadcast action to opponent
    const opponent = room.players.find(p => p.id !== playerId);

    if (opponent && opponent.ws.readyState === WebSocket.OPEN) {
      this.send(opponent.ws, {
        type: MessageType.GAME_ACTION,
        action: message.action,
        timestamp: Date.now(),
      } as GameActionMessage);
    }

    // Handle turn timer
    if (message.action.type === 'end_turn') {
      // Start timer for opponent's turn
      if (opponent) {
        this.startTurnTimer(room, opponent.id);
      }
    } else if (message.action.type === 'keep_hand' && !room.currentTurnTimer) {
      // Start first turn timer when player keeps hand (after mulligan)
      // Track game start time
      if (!room.gameStartTime) {
        room.gameStartTime = Date.now();
      }

      // Player 1 goes first
      const player1 = room.players[0];
      if (player1) {
        this.startTurnTimer(room, player1.id);
      }
    }
  }

  private handleChat(ws: WebSocket, message: ChatMessage) {
    const roomCode = (ws as any).roomCode;
    const room = this.rooms.get(roomCode);

    if (!room) {
      this.sendError(ws, 'ROOM_NOT_FOUND', 'Room not found');
      return;
    }

    // Broadcast chat to all players in room
    const playerId = (ws as any).playerId;
    const sender = room.players.find(p => p.id === playerId);

    if (!sender) return;

    room.players.forEach(player => {
      if (player.ws.readyState === WebSocket.OPEN) {
        this.send(player.ws, {
          type: MessageType.CHAT,
          playerId: sender.id,
          playerName: sender.name,
          message: message.message,
          timestamp: Date.now(),
        } as ChatMessage);
      }
    });
  }

  private handleEmote(ws: WebSocket, message: EmoteMessage) {
    const roomCode = (ws as any).roomCode;
    const room = this.rooms.get(roomCode);

    if (!room) {
      this.sendError(ws, 'ROOM_NOT_FOUND', 'Room not found');
      return;
    }

    // Broadcast emote to all players in room
    const playerId = (ws as any).playerId;
    const sender = room.players.find(p => p.id === playerId);

    if (!sender) return;

    room.players.forEach(player => {
      if (player.ws.readyState === WebSocket.OPEN) {
        this.send(player.ws, {
          type: MessageType.EMOTE,
          playerId: sender.id,
          playerName: sender.name,
          emoteId: message.emoteId,
          timestamp: Date.now(),
        } as EmoteMessage);
      }
    });
  }

  private handleGameEnd(ws: WebSocket, message: any) {
    const roomCode = (ws as any).roomCode;
    const room = this.rooms.get(roomCode);

    if (!room) return;

    const [player1, player2] = room.players;
    if (!player1 || !player2) return;

    // Record match in database
    const gameStartTime = room.gameStartTime || room.createdAt;
    const matchId = this.database.recordMatch({
      player1_id: player1.id,
      player1_name: player1.name,
      player2_id: player2.id,
      player2_name: player2.name,
      winner_id: message.winnerId || null,
      start_time: gameStartTime,
      end_time: Date.now(),
      turn_count: message.turnCount || 0,
      deck1_id: player1.deckId,
      deck2_id: player2.deckId,
    });

    console.log(`📊 Match #${matchId} recorded: ${player1.name} vs ${player2.name}`);

    // Mark room as finished
    room.status = 'finished';

    // Clean up turn timer
    if (room.currentTurnTimer) {
      clearTimeout(room.currentTurnTimer);
    }
  }

  private handleDisconnect(ws: WebSocket) {
    const roomCode = (ws as any).roomCode;
    const playerId = (ws as any).playerId;

    // Remove from matchmaking queue
    this.matchmakingQueue = this.matchmakingQueue.filter(p => p.ws !== ws);

    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    // If game hasn't started yet, remove player immediately
    if (room.status === 'waiting') {
      room.players = room.players.filter(p => p.id !== playerId);

      // Notify other players
      room.players.forEach(p => {
        if (p.ws.readyState === WebSocket.OPEN) {
          this.send(p.ws, {
            type: MessageType.PLAYER_LEFT,
            playerId: playerId,
            timestamp: Date.now(),
          });
        }
      });

      // Delete room if empty
      if (room.players.length === 0) {
        this.rooms.delete(roomCode);
        console.log(`🗑️  Room deleted: ${roomCode}`);
      }
      return;
    }

    // Game in progress - allow reconnection
    console.log(`🔌 Player ${player.name} disconnected from room ${roomCode}`);

    player.disconnectedAt = Date.now();
    const reconnectDeadline = player.disconnectedAt + RECONNECT_TIMEOUT;
    room.disconnectDeadline = reconnectDeadline;

    // Clear existing timer if any
    if (player.reconnectTimer) {
      clearTimeout(player.reconnectTimer);
    }

    // Set timer to close room after timeout
    player.reconnectTimer = setTimeout(() => {
      console.log(`⏰ Reconnect timeout for ${player.name} in room ${roomCode}`);

      // Remove player and notify opponent
      room.players = room.players.filter(p => p.id !== playerId);
      room.players.forEach(p => {
        if (p.ws.readyState === WebSocket.OPEN) {
          this.send(p.ws, {
            type: MessageType.PLAYER_LEFT,
            playerId: playerId,
            timestamp: Date.now(),
          });
        }
      });

      // Delete room if empty
      if (room.players.length === 0) {
        this.rooms.delete(roomCode);
        console.log(`🗑️  Room deleted after disconnect timeout: ${roomCode}`);
      }
    }, RECONNECT_TIMEOUT);

    // Notify opponent about disconnection
    const opponent = room.players.find(p => p.id !== playerId);
    if (opponent && opponent.ws.readyState === WebSocket.OPEN) {
      this.send(opponent.ws, {
        type: MessageType.PLAYER_DISCONNECTED,
        playerId: playerId,
        playerName: player.name,
        reconnectDeadline: reconnectDeadline,
        timestamp: Date.now(),
      } as PlayerDisconnectedMessage);
    }
  }

  private handleReconnect(ws: WebSocket, message: ReconnectMessage) {
    const { roomCode, playerId } = message;

    console.log(`🔄 Reconnect attempt: player ${playerId} to room ${roomCode}`);

    const room = this.rooms.get(roomCode);
    if (!room) {
      this.sendError(ws, 'ROOM_NOT_FOUND', 'Room not found or has been closed');
      return;
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      this.sendError(ws, 'PLAYER_NOT_FOUND', 'You are not in this room');
      return;
    }

    if (!player.disconnectedAt) {
      this.sendError(ws, 'NOT_DISCONNECTED', 'Player was not disconnected');
      return;
    }

    // Cancel reconnection timeout
    if (player.reconnectTimer) {
      clearTimeout(player.reconnectTimer);
      player.reconnectTimer = undefined;
    }

    // Restore connection
    player.ws = ws;
    player.disconnectedAt = undefined;
    player.lastPing = Date.now();

    // Store room and player info on WebSocket
    (ws as any).roomCode = roomCode;
    (ws as any).playerId = playerId;

    // Clear disconnect deadline
    room.disconnectDeadline = undefined;

    console.log(`✅ Player ${player.name} reconnected to room ${roomCode}`);

    // Send game state to reconnected player
    this.send(ws, {
      type: MessageType.RECONNECTED,
      gameState: room.gameState,
      roomCode: roomCode,
      timestamp: Date.now(),
    } as ReconnectedMessage);

    // Notify opponent
    const opponent = room.players.find(p => p.id !== playerId);
    if (opponent && opponent.ws.readyState === WebSocket.OPEN) {
      this.send(opponent.ws, {
        type: MessageType.PLAYER_JOINED,
        playerId: playerId,
        playerName: player.name,
        isReady: true,
        timestamp: Date.now(),
      });
    }
  }

  private startTurnTimer(room: Room, playerId: string): void {
    // Clear existing timer
    if (room.currentTurnTimer) {
      clearTimeout(room.currentTurnTimer);
    }

    room.currentTurnPlayerId = playerId;
    room.currentTurnStart = Date.now();

    // Broadcast turn start to all players
    room.players.forEach(player => {
      if (player.ws.readyState === WebSocket.OPEN) {
        this.send(player.ws, {
          type: MessageType.TURN_START,
          playerId,
          turnDuration: TURN_DURATION,
          timestamp: Date.now(),
        } as TurnStartMessage);
      }
    });

    // Set timer to auto-end turn
    room.currentTurnTimer = setTimeout(() => {
      console.log(`⏰ Turn timer expired for player ${playerId} in room ${room.code}`);

      // Send end_turn action on behalf of the player
      const player = room.players.find(p => p.id === playerId);
      if (player && player.ws.readyState === WebSocket.OPEN) {
        // Broadcast the auto-end turn action
        room.players.forEach(p => {
          if (p.ws.readyState === WebSocket.OPEN) {
            this.send(p.ws, {
              type: MessageType.GAME_ACTION,
              action: {
                type: 'end_turn',
                playerId,
                data: { auto: true }, // Mark as auto-ended
              },
              timestamp: Date.now(),
            } as GameActionMessage);
          }
        });
      }
    }, TURN_DURATION);
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private getWaitingRooms() {
    const waitingRooms: any[] = [];

    this.rooms.forEach((room, code) => {
      // Only include rooms that are waiting for a second player
      if (room.status === 'waiting' && room.players.length === 1) {
        const host = room.players[0];
        waitingRooms.push({
          code: room.code,
          hostName: host.name,
          hostDeckId: host.deckId,
          createdAt: room.createdAt,
          playersCount: room.players.length,
        });
      }
    });

    // Sort by creation time (newest first)
    waitingRooms.sort((a, b) => b.createdAt - a.createdAt);

    return waitingRooms;
  }

  private send(ws: WebSocket, message: ServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, code: string, message: string) {
    this.send(ws, {
      type: MessageType.ERROR,
      code,
      message,
      timestamp: Date.now(),
    });
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          this.send(ws as WebSocket, {
            type: MessageType.PING,
            timestamp: Date.now(),
          });
        }
      });
    }, PING_INTERVAL);
  }

  private startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [code, room] of this.rooms.entries()) {
        if (now - room.createdAt > ROOM_EXPIRY && room.status !== 'playing') {
          this.rooms.delete(code);
          console.log(`🗑️  Expired room deleted: ${code}`);
        }
      }
    }, 300000); // Every 5 minutes
  }
}

// Start server
new GameServer(PORT);
