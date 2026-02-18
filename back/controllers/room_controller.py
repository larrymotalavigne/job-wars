"""Room and game session business logic."""
import asyncio
import json
import logging
import random
import time
import uuid
from typing import Optional

from fastapi import WebSocket

import state
from config import get_settings
from database.database import record_match
from schemas.messages import MT, Player, Room

log = logging.getLogger("jobwars.room")
settings = get_settings()

_CODE_CHARS = "ABCDEFGHJKLMNPQRTUVWXYZ23456789"  # No I, O, S, 0, 1


# ── Helpers ────────────────────────────────────────────────────────────────────

def generate_room_code() -> str:
    while True:
        code = "".join(random.choices(_CODE_CHARS, k=6))
        if code not in state.rooms:
            return code


async def send_msg(ws: WebSocket, msg: dict) -> None:
    try:
        await ws.send_text(json.dumps(msg))
    except Exception:
        pass


async def send_error(ws: WebSocket, code: str, message: str) -> None:
    await send_msg(ws, {"type": MT.ERROR, "code": code, "message": message})


async def broadcast(room: Room, msg: dict) -> None:
    for p in room.players:
        if p.disconnected_at is None:
            await send_msg(p.ws, msg)


async def broadcast_others(room: Room, exclude_id: str, msg: dict) -> None:
    for p in room.players:
        if p.id != exclude_id and p.disconnected_at is None:
            await send_msg(p.ws, msg)


def get_player_room(ws: WebSocket) -> tuple[Optional[Player], Optional[Room]]:
    entry = state.ws_registry.get(id(ws))
    if not entry:
        return None, None
    player_id, room_code = entry
    room = state.rooms.get(room_code)
    if not room:
        return None, None
    player = next((p for p in room.players if p.id == player_id), None)
    return player, room


def register_ws(ws: WebSocket, player_id: str, room_code: str) -> None:
    state.ws_registry[id(ws)] = (player_id, room_code)


def unregister_ws(ws: WebSocket) -> None:
    state.ws_registry.pop(id(ws), None)


# ── Turn Timer ─────────────────────────────────────────────────────────────────

async def _turn_timer_task(room: Room, player_id: str) -> None:
    await asyncio.sleep(settings.TURN_DURATION)
    if room.current_turn_player_id != player_id:
        return
    log.info(f"⏰ Auto-ending turn for {player_id} in room {room.code}")
    await broadcast(room, {
        "type": MT.GAME_ACTION,
        "playerId": player_id,
        "action": {"type": "end_turn", "auto": True},
        "timestamp": int(time.time() * 1000),
    })
    other = next((p for p in room.players if p.id != player_id), None)
    if other:
        await _start_turn(room, other.id)


async def _start_turn(room: Room, player_id: str) -> None:
    if room.current_turn_task and not room.current_turn_task.done():
        room.current_turn_task.cancel()
    room.current_turn_player_id = player_id
    room.current_turn_start = time.time()
    await broadcast(room, {
        "type": MT.TURN_START,
        "playerId": player_id,
        "turnDuration": settings.TURN_DURATION * 1000,
    })
    room.current_turn_task = asyncio.create_task(_turn_timer_task(room, player_id))


# ── Message Handlers ───────────────────────────────────────────────────────────

async def handle_create_room(ws: WebSocket, msg: dict) -> None:
    player = Player(
        id=str(uuid.uuid4()),
        name=msg.get("playerName", "Player"),
        deck_id=msg.get("deckId", ""),
        ws=ws,
    )
    code = generate_room_code()
    state.rooms[code] = Room(code=code, players=[player])
    register_ws(ws, player.id, code)
    log.info(f"🎲 Room {code} created by {player.name}")
    await send_msg(ws, {"type": MT.ROOM_CREATED, "roomCode": code, "playerId": player.id})


async def handle_join_room(ws: WebSocket, msg: dict) -> None:
    code = msg.get("roomCode", "").upper()
    room = state.rooms.get(code)
    if not room:
        return await send_error(ws, "ROOM_NOT_FOUND", "Room not found")
    if room.status != "waiting":
        return await send_error(ws, "GAME_IN_PROGRESS", "Game already in progress")
    if len(room.players) >= 2:
        return await send_error(ws, "ROOM_FULL", "Room is full")

    player = Player(
        id=str(uuid.uuid4()),
        name=msg.get("playerName", "Player"),
        deck_id=msg.get("deckId", ""),
        ws=ws,
    )
    room.players.append(player)
    register_ws(ws, player.id, code)
    log.info(f"👥 {player.name} joined room {code}")
    await broadcast(room, {
        "type": MT.PLAYER_JOINED,
        "playerId": player.id,
        "playerName": player.name,
    })
    if len(room.players) == 2:
        await _start_game(room)


async def handle_find_match(ws: WebSocket, msg: dict) -> None:
    player = Player(
        id=str(uuid.uuid4()),
        name=msg.get("playerName", "Player"),
        deck_id=msg.get("deckId", ""),
        ws=ws,
    )
    if state.matchmaking_queue:
        opponent = state.matchmaking_queue.pop(0)
        code = generate_room_code()
        room = Room(code=code, players=[opponent, player])
        state.rooms[code] = room
        register_ws(opponent.ws, opponent.id, code)
        register_ws(ws, player.id, code)
        log.info(f"🎮 Matched {opponent.name} vs {player.name} in room {code}")
        for p in room.players:
            await send_msg(p.ws, {"type": MT.ROOM_CREATED, "roomCode": code, "playerId": p.id})
        await _start_game(room)
    else:
        state.matchmaking_queue.append(player)
        register_ws(ws, player.id, "__queue__")
        log.info(f"🔍 {player.name} waiting for match…")


async def _start_game(room: Room) -> None:
    room.status = "playing"
    p1, p2 = room.players[0], room.players[1]
    log.info(f"🎮 Game starting in room {room.code}: {p1.name} vs {p2.name}")
    for player, opponent in [(p1, p2), (p2, p1)]:
        await send_msg(player.ws, {
            "type": MT.GAME_START,
            "roomCode": room.code,
            "yourPlayerId": player.id,
            "opponentId": opponent.id,
            "player1": p1.to_dict(),
            "player2": p2.to_dict(),
        })


async def handle_game_action(ws: WebSocket, msg: dict, player: Player, room: Room) -> None:
    now = time.time()
    # Rate limiting
    room.action_history = [a for a in room.action_history if now - a["ts"] < 1.0]
    if sum(1 for a in room.action_history if a["pid"] == player.id) >= settings.MAX_ACTIONS_PER_SECOND:
        room.suspicious_activity += 1
        if room.suspicious_activity > 5:
            log.warning(f"⚠️  Kicking {player.name} for repeated rate-limit violations")
            await send_error(ws, "KICKED", "Too many violations")
            await ws.close()
            return
        return await send_error(ws, "RATE_LIMIT", "Too many actions")

    action = msg.get("action", {})
    action_type = action.get("type") if isinstance(action, dict) else action
    room.action_history.append({"pid": player.id, "action": action_type, "ts": now})
    if len(room.action_history) > 100:
        room.action_history = room.action_history[-100:]

    # Turn validation (mulligan actions are exempt)
    is_mulligan = action_type in ("mulligan", "keep_hand")
    if not is_mulligan and room.current_turn_player_id and room.current_turn_player_id != player.id:
        return await send_error(ws, "NOT_YOUR_TURN", "It is not your turn")

    await broadcast_others(room, player.id, {
        "type": MT.GAME_ACTION,
        "playerId": player.id,
        "action": action,
        "timestamp": int(now * 1000),
    })

    if action_type == "end_turn":
        other = next((p for p in room.players if p.id != player.id), None)
        if other:
            await _start_turn(room, other.id)
    elif action_type == "keep_hand" and room.current_turn_task is None:
        room.game_start_time = time.time()
        await _start_turn(room, room.players[0].id)

    if "gameState" in msg:
        room.game_state = msg["gameState"]


async def handle_chat(ws: WebSocket, msg: dict, player: Player, room: Room) -> None:
    await broadcast(room, {
        "type": MT.CHAT,
        "playerId": player.id,
        "playerName": player.name,
        "message": msg.get("message", ""),
    })


async def handle_emote(ws: WebSocket, msg: dict, player: Player, room: Room) -> None:
    await broadcast(room, {
        "type": MT.EMOTE,
        "playerId": player.id,
        "playerName": player.name,
        "emoteId": msg.get("emoteId", ""),
    })


async def handle_game_end(ws: WebSocket, msg: dict, player: Player, room: Room) -> None:
    room.status = "finished"
    if room.current_turn_task and not room.current_turn_task.done():
        room.current_turn_task.cancel()
    winner_id = msg.get("winnerId")
    turn_count = int(msg.get("turnCount", 0))
    if len(room.players) == 2:
        p1, p2 = room.players[0], room.players[1]
        start = room.game_start_time or room.created_at
        try:
            record_match(
                p1.id, p1.name, p1.deck_id,
                p2.id, p2.name, p2.deck_id,
                winner_id, start, time.time(), turn_count,
            )
            log.info(f"📊 Match recorded for room {room.code}")
        except Exception as exc:
            log.error(f"Failed to record match: {exc}")


async def handle_reconnect(ws: WebSocket, msg: dict) -> None:
    code = msg.get("roomCode", "")
    player_id = msg.get("playerId", "")
    room = state.rooms.get(code)
    if not room:
        return await send_error(ws, "ROOM_NOT_FOUND", "Room not found")
    player = next((p for p in room.players if p.id == player_id), None)
    if not player:
        return await send_error(ws, "PLAYER_NOT_FOUND", "Player not found")
    if player.disconnected_at is None:
        return await send_error(ws, "NOT_DISCONNECTED", "Player is not disconnected")

    if player.reconnect_task and not player.reconnect_task.done():
        player.reconnect_task.cancel()

    player.ws = ws
    player.disconnected_at = None
    room.disconnect_deadline = None
    register_ws(ws, player.id, code)
    log.info(f"🔄 {player.name} reconnected to room {code}")

    await send_msg(ws, {"type": MT.RECONNECTED, "gameState": room.game_state})
    await broadcast_others(room, player.id, {
        "type": MT.PLAYER_JOINED,
        "playerId": player.id,
        "playerName": player.name,
    })


async def handle_disconnect(ws: WebSocket) -> None:
    state.all_websockets.discard(ws)
    player, room = get_player_room(ws)
    unregister_ws(ws)

    if not player:
        for p in list(state.matchmaking_queue):
            if p.ws is ws:
                state.matchmaking_queue.remove(p)
        return

    log.info(f"🔌 {player.name} disconnected from room {room.code} (status: {room.status})")

    if room.status == "waiting":
        room.players = [p for p in room.players if p.id != player.id]
        await broadcast(room, {
            "type": MT.PLAYER_LEFT,
            "playerId": player.id,
            "playerName": player.name,
        })
        if not room.players and room.code in state.rooms:
            del state.rooms[room.code]
        state.matchmaking_queue[:] = [p for p in state.matchmaking_queue if p.id != player.id]

    elif room.status == "playing":
        player.disconnected_at = time.time()
        deadline = player.disconnected_at + settings.RECONNECT_TIMEOUT
        room.disconnect_deadline = deadline
        await broadcast_others(room, player.id, {
            "type": MT.PLAYER_DISCONNECTED,
            "playerId": player.id,
            "reconnectDeadline": int(deadline * 1000),
        })

        async def _reconnect_timeout() -> None:
            await asyncio.sleep(settings.RECONNECT_TIMEOUT)
            if player.disconnected_at is not None:
                log.info(f"⏰ Reconnect timeout for {player.name} in room {room.code}")
                room.players = [p for p in room.players if p.id != player.id]
                await broadcast(room, {
                    "type": MT.PLAYER_LEFT,
                    "playerId": player.id,
                    "playerName": player.name,
                })
                if not room.players and room.code in state.rooms:
                    del state.rooms[room.code]

        player.reconnect_task = asyncio.create_task(_reconnect_timeout())
