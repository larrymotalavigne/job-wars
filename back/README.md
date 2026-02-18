# Job Wars Multiplayer Server

Simple WebSocket server for Job Wars online multiplayer.

## Features

- ✅ Room creation with 6-digit codes
- ✅ Join room by code
- ✅ Random matchmaking
- ✅ Real-time game action synchronization
- ✅ Auto-cleanup of expired rooms
- ✅ Health check endpoint

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run in development mode (auto-reload)
npm run dev

# Server runs on http://localhost:3001
```

### Production Build

```bash
# Build TypeScript
npm run build

# Start server
npm start
```

## Environment Variables

```env
PORT=3001                 # Server port
NODE_ENV=development      # development | production
```

## Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "rooms": 2,
  "queueLength": 0,
  "uptime": 123.45
}
```

## WebSocket Messages

### Client → Server

**Create Room:**
```json
{
  "type": "create_room",
  "playerName": "Alice",
  "deckId": "deck-123",
  "timestamp": 1234567890
}
```

**Join Room:**
```json
{
  "type": "join_room",
  "roomCode": "ABC123",
  "playerName": "Bob",
  "deckId": "deck-456",
  "timestamp": 1234567890
}
```

**Find Match (Random):**
```json
{
  "type": "find_match",
  "playerName": "Charlie",
  "deckId": "deck-789",
  "timestamp": 1234567890
}
```

**Game Action:**
```json
{
  "type": "game_action",
  "action": {
    "type": "play_card",
    "playerId": "player-1",
    "data": { "cardId": "card-123" }
  },
  "timestamp": 1234567890
}
```

### Server → Client

**Room Created:**
```json
{
  "type": "room_created",
  "roomCode": "ABC123",
  "playerId": "player-1",
  "timestamp": 1234567890
}
```

**Player Joined:**
```json
{
  "type": "player_joined",
  "playerId": "player-2",
  "playerName": "Bob",
  "isReady": true,
  "timestamp": 1234567890
}
```

**Game Start:**
```json
{
  "type": "game_start",
  "gameState": {
    "roomCode": "ABC123",
    "yourPlayerId": "player-1",
    "opponentId": "player-2",
    "player1": { "id": "player-1", "name": "Alice", "deckId": "deck-123" },
    "player2": { "id": "player-2", "name": "Bob", "deckId": "deck-456" }
  },
  "timestamp": 1234567890
}
```

**Game Action (relayed from opponent):**
```json
{
  "type": "game_action",
  "action": {
    "type": "play_card",
    "playerId": "player-2",
    "data": { "cardId": "card-456" }
  },
  "timestamp": 1234567890
}
```

**Error:**
```json
{
  "type": "error",
  "code": "ROOM_FULL",
  "message": "Room is full",
  "timestamp": 1234567890
}
```

## Deployment

### Railway.app (Free Tier)

1. Create account at [railway.app](https://railway.app)
2. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```
3. Login and deploy:
   ```bash
   railway login
   railway init
   railway up
   ```
4. Set environment variables in Railway dashboard
5. Get your public URL

### Render.com (Free Tier)

1. Create account at [render.com](https://render.com)
2. Connect GitHub repo
3. Create new Web Service
4. Build command: `cd server && npm install && npm run build`
5. Start command: `cd server && npm start`
6. Add environment variables
7. Deploy!

## Architecture

```
┌─────────────┐         WebSocket         ┌─────────────┐
│   Client 1  │ ────────────────────────> │   Server    │
│   (Alice)   │ <──────────────────────── │             │
└─────────────┘                            │   Rooms     │
                                           │   Queue     │
┌─────────────┐         WebSocket         │   State     │
│   Client 2  │ ────────────────────────> │             │
│    (Bob)    │ <──────────────────────── │             │
└─────────────┘                            └─────────────┘
```

## License

MIT
