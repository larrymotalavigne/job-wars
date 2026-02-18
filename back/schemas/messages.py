"""Message type constants and runtime data models."""
import asyncio
import time
from dataclasses import dataclass, field
from typing import Optional

from fastapi import WebSocket


class MT:
    """WebSocket message type constants."""

    CONNECT = "connect"
    DISCONNECT = "disconnect"
    RECONNECT = "reconnect"
    RECONNECTED = "reconnected"
    PLAYER_DISCONNECTED = "player_disconnected"
    CREATE_ROOM = "create_room"
    JOIN_ROOM = "join_room"
    LEAVE_ROOM = "leave_room"
    FIND_MATCH = "find_match"
    ROOM_CREATED = "room_created"
    PLAYER_JOINED = "player_joined"
    PLAYER_LEFT = "player_left"
    GAME_START = "game_start"
    GAME_ACTION = "game_action"
    GAME_STATE = "game_state"
    TURN_START = "turn_start"
    GAME_END = "game_end"
    CHAT = "chat"
    EMOTE = "emote"
    PING = "ping"
    PONG = "pong"
    ERROR = "error"


@dataclass
class Player:
    id: str
    name: str
    deck_id: str
    ws: WebSocket
    is_ready: bool = False
    last_ping: float = field(default_factory=time.time)
    disconnected_at: Optional[float] = None
    reconnect_task: Optional[asyncio.Task] = None

    def to_dict(self) -> dict:
        return {"id": self.id, "name": self.name, "deckId": self.deck_id}


@dataclass
class Room:
    code: str
    players: list  # list[Player]
    game_state: Optional[dict] = None
    created_at: float = field(default_factory=time.time)
    status: str = "waiting"  # waiting | playing | finished
    disconnect_deadline: Optional[float] = None
    current_turn_task: Optional[asyncio.Task] = None
    current_turn_start: Optional[float] = None
    current_turn_player_id: Optional[str] = None
    action_history: list = field(default_factory=list)
    suspicious_activity: int = 0
    game_start_time: Optional[float] = None
