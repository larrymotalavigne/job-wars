"""Stats and leaderboard business logic."""
import time
from typing import Optional

import state
from database.database import (
    query_leaderboard,
    query_player,
    query_recent_matches,
    query_stats,
)


def get_server_health() -> dict:
    return {
        "status": "ok",
        "rooms": len(state.rooms),
        "queueLength": len(state.matchmaking_queue),
        "uptime": time.time() - state.start_time_epoch,
    }


def get_waiting_rooms() -> list[dict]:
    waiting = [
        {
            "code": r.code,
            "hostName": r.players[0].name if r.players else "Unknown",
            "hostDeckId": r.players[0].deck_id if r.players else "",
            "createdAt": int(r.created_at * 1000),
            "playersCount": len(r.players),
        }
        for r in state.rooms.values()
        if r.status == "waiting" and len(r.players) == 1
    ]
    waiting.sort(key=lambda x: x["createdAt"], reverse=True)
    return waiting


def get_stats() -> dict:
    return query_stats()


def get_leaderboard() -> list[dict]:
    return query_leaderboard()


def get_recent_matches() -> list[dict]:
    return query_recent_matches()


def get_player_stats(player_id: str) -> Optional[dict]:
    return query_player(player_id)
