"""HTTP REST endpoints — health, lobby browser and player stats."""
from fastapi import APIRouter, HTTPException

from controllers.stats_controller import (
    get_leaderboard,
    get_player_stats,
    get_recent_matches,
    get_server_health,
    get_stats,
    get_waiting_rooms,
)

router = APIRouter()


@router.get("/health")
async def health():
    return get_server_health()


@router.get("/api/rooms")
async def rooms():
    return get_waiting_rooms()


@router.get("/api/stats")
async def stats():
    return get_stats()


@router.get("/api/leaderboard")
async def leaderboard():
    return get_leaderboard()


@router.get("/api/matches/recent")
async def recent_matches():
    return get_recent_matches()


@router.get("/api/player/{player_id}")
async def player(player_id: str):
    result = get_player_stats(player_id)
    if not result:
        raise HTTPException(status_code=404, detail="Player not found")
    return result
