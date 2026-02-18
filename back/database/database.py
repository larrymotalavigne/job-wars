"""SQLite database layer — initialisation, writes and queries."""
import logging
import os
import sqlite3
from typing import Optional

from config import get_settings

log = logging.getLogger("jobwars.database")

_conn: Optional[sqlite3.Connection] = None


def get_db() -> sqlite3.Connection:
    if _conn is None:
        raise RuntimeError("Database not initialised. Call init_db() first.")
    return _conn


def init_db() -> None:
    global _conn
    settings = get_settings()
    db_path = settings.DB_PATH
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player1_id TEXT NOT NULL,
            player1_name TEXT NOT NULL,
            player2_id TEXT NOT NULL,
            player2_name TEXT NOT NULL,
            winner_id TEXT,
            start_time INTEGER NOT NULL,
            end_time INTEGER NOT NULL,
            turn_count INTEGER NOT NULL,
            deck1_id TEXT NOT NULL,
            deck2_id TEXT NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s','now'))
        );
        CREATE TABLE IF NOT EXISTS players (
            player_id TEXT PRIMARY KEY,
            player_name TEXT NOT NULL,
            total_games INTEGER DEFAULT 0,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            draws INTEGER DEFAULT 0,
            total_turns INTEGER DEFAULT 0,
            last_seen INTEGER DEFAULT (strftime('%s','now'))
        );
        CREATE INDEX IF NOT EXISTS idx_matches_player1 ON matches(player1_id);
        CREATE INDEX IF NOT EXISTS idx_matches_player2 ON matches(player2_id);
        CREATE INDEX IF NOT EXISTS idx_matches_winner  ON matches(winner_id);
        CREATE INDEX IF NOT EXISTS idx_matches_time    ON matches(end_time);
    """)
    conn.commit()
    _conn = conn
    log.info(f"💾 Database initialised at {db_path}")


def close_db() -> None:
    global _conn
    if _conn:
        _conn.close()
        _conn = None


def record_match(
    p1_id: str, p1_name: str, deck1_id: str,
    p2_id: str, p2_name: str, deck2_id: str,
    winner_id: Optional[str],
    start: float, end: float, turn_count: int,
) -> int:
    db = get_db()
    cur = db.execute(
        """INSERT INTO matches
           (player1_id, player1_name, player2_id, player2_name, winner_id,
            start_time, end_time, turn_count, deck1_id, deck2_id)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (p1_id, p1_name, p2_id, p2_name, winner_id,
         int(start * 1000), int(end * 1000), turn_count, deck1_id, deck2_id),
    )
    match_id = cur.lastrowid
    for player_id, player_name, won in [
        (p1_id, p1_name, winner_id == p1_id),
        (p2_id, p2_name, winner_id == p2_id),
    ]:
        w, l, d = (1, 0, 0) if won else ((0, 1, 0) if winner_id else (0, 0, 1))
        db.execute(
            """INSERT INTO players
                   (player_id, player_name, total_games, wins, losses, draws, total_turns)
               VALUES (?,?,1,?,?,?,?)
               ON CONFLICT(player_id) DO UPDATE SET
                   player_name   = excluded.player_name,
                   total_games   = total_games + 1,
                   wins          = wins + ?,
                   losses        = losses + ?,
                   draws         = draws + ?,
                   total_turns   = total_turns + ?,
                   last_seen     = strftime('%s','now')""",
            (player_id, player_name, w, l, d, turn_count, w, l, d, turn_count),
        )
    db.commit()
    return match_id


def query_stats() -> dict:
    db = get_db()
    row = db.execute("""
        SELECT COUNT(*),
               COUNT(DISTINCT player1_id) + COUNT(DISTINCT player2_id),
               AVG(end_time - start_time)
        FROM matches
    """).fetchone()
    return {
        "totalMatches": row[0] or 0,
        "totalPlayers": row[1] or 0,
        "avgMatchDuration": row[2] or 0,
    }


def query_leaderboard() -> list[dict]:
    db = get_db()
    rows = db.execute("""
        SELECT player_id, player_name, total_games, wins, losses, draws,
               ROUND(CAST(wins AS REAL) / NULLIF(total_games, 0) * 100, 1) AS win_rate
        FROM players
        WHERE total_games >= 3
        ORDER BY wins DESC, win_rate DESC
        LIMIT 10
    """).fetchall()
    keys = ["player_id", "player_name", "total_games", "wins", "losses", "draws", "win_rate"]
    return [dict(zip(keys, row)) for row in rows]


def query_recent_matches() -> list[dict]:
    db = get_db()
    rows = db.execute(
        "SELECT id, player1_id, player1_name, player2_id, player2_name, winner_id,"
        "       start_time, end_time, turn_count, deck1_id, deck2_id"
        " FROM matches ORDER BY end_time DESC LIMIT 20"
    ).fetchall()
    keys = ["id", "player1_id", "player1_name", "player2_id", "player2_name", "winner_id",
            "start_time", "end_time", "turn_count", "deck1_id", "deck2_id"]
    return [dict(zip(keys, row)) for row in rows]


def query_player(player_id: str) -> Optional[dict]:
    db = get_db()
    row = db.execute(
        "SELECT player_id, player_name, total_games, wins, losses, draws"
        " FROM players WHERE player_id = ?",
        (player_id,),
    ).fetchone()
    if not row:
        return None
    return {
        "player_id": row[0], "player_name": row[1], "total_games": row[2],
        "wins": row[3], "losses": row[4], "draws": row[5],
        "win_rate": round(row[3] / max(row[2], 1) * 100, 1),
    }
