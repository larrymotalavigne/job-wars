"""WebSocket endpoint — connection lifecycle and message dispatch."""
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

import state
from controllers.room_controller import (
    get_player_room,
    handle_chat,
    handle_create_room,
    handle_disconnect,
    handle_emote,
    handle_find_match,
    handle_game_action,
    handle_game_end,
    handle_join_room,
    handle_reconnect,
    send_error,
)
from schemas.messages import MT

log = logging.getLogger("jobwars.ws")

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    state.all_websockets.add(ws)
    log.info("👤 New WebSocket connection")
    try:
        while True:
            data = await ws.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                await send_error(ws, "PARSE_ERROR", "Invalid message format")
                continue

            msg_type = msg.get("type")
            player, room = get_player_room(ws)

            if msg_type == MT.CREATE_ROOM:
                await handle_create_room(ws, msg)
            elif msg_type == MT.JOIN_ROOM:
                await handle_join_room(ws, msg)
            elif msg_type == MT.FIND_MATCH:
                await handle_find_match(ws, msg)
            elif msg_type == MT.RECONNECT:
                await handle_reconnect(ws, msg)
            elif msg_type == MT.GAME_ACTION:
                if player and room:
                    await handle_game_action(ws, msg, player, room)
                else:
                    await send_error(ws, "NOT_IN_ROOM", "Not in a room")
            elif msg_type == MT.CHAT:
                if player and room:
                    await handle_chat(ws, msg, player, room)
            elif msg_type == MT.EMOTE:
                if player and room:
                    await handle_emote(ws, msg, player, room)
            elif msg_type == MT.GAME_END:
                if player and room:
                    await handle_game_end(ws, msg, player, room)
            elif msg_type == MT.LEAVE_ROOM:
                await handle_disconnect(ws)
                break
            elif msg_type == MT.PONG:
                pass  # Keepalive acknowledged
            else:
                log.warning(f"Unknown message type: {msg_type}")

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        log.error(f"WebSocket error: {exc}")
    finally:
        await handle_disconnect(ws)
