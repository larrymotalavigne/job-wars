"""Shared in-memory server state.

This module holds all mutable runtime state that must be accessible
across the views and controllers layers.
"""
import time

from fastapi import WebSocket

from schemas.messages import Player, Room

# Active game rooms
rooms: dict[str, Room] = {}

# Players waiting to be matched
matchmaking_queue: list[Player] = []

# All live WebSockets (for periodic pings)
all_websockets: set[WebSocket] = set()

# WebSocket id(ws) → (player_id, room_code) for O(1) lookup
ws_registry: dict[int, tuple[str, str]] = {}

# Server start time for uptime reporting
start_time_epoch: float = time.time()
