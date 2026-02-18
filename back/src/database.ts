import Database from 'better-sqlite3';
import * as path from 'path';

export interface MatchRecord {
  id: number;
  player1_id: string;
  player1_name: string;
  player2_id: string;
  player2_name: string;
  winner_id: string | null;
  start_time: number;
  end_time: number;
  turn_count: number;
  deck1_id: string;
  deck2_id: string;
}

export interface PlayerStats {
  player_id: string;
  player_name: string;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  avg_game_duration: number;
  favorite_deck: string | null;
}

export class GameDatabase {
  private db: Database.Database;

  constructor(dbPath: string = './gamehistory.db') {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeSchema();
  }

  private initializeSchema(): void {
    // Matches table
    this.db.exec(`
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
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Players table (aggregated stats)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        player_id TEXT PRIMARY KEY,
        player_name TEXT NOT NULL,
        total_games INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        total_turns INTEGER DEFAULT 0,
        last_seen INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_matches_player1 ON matches(player1_id);
      CREATE INDEX IF NOT EXISTS idx_matches_player2 ON matches(player2_id);
      CREATE INDEX IF NOT EXISTS idx_matches_winner ON matches(winner_id);
      CREATE INDEX IF NOT EXISTS idx_matches_time ON matches(end_time);
    `);
  }

  /**
   * Record a completed match
   */
  recordMatch(match: Omit<MatchRecord, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO matches (
        player1_id, player1_name, player2_id, player2_name,
        winner_id, start_time, end_time, turn_count,
        deck1_id, deck2_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      match.player1_id,
      match.player1_name,
      match.player2_id,
      match.player2_name,
      match.winner_id,
      match.start_time,
      match.end_time,
      match.turn_count,
      match.deck1_id,
      match.deck2_id
    );

    const matchId = result.lastInsertRowid as number;

    // Update player stats
    this.updatePlayerStats(match.player1_id, match.player1_name, match.winner_id, match.turn_count);
    this.updatePlayerStats(match.player2_id, match.player2_name, match.winner_id, match.turn_count);

    return matchId;
  }

  private updatePlayerStats(
    playerId: string,
    playerName: string,
    winnerId: string | null,
    turnCount: number
  ): void {
    // Upsert player
    this.db.prepare(`
      INSERT INTO players (player_id, player_name, last_seen)
      VALUES (?, ?, ?)
      ON CONFLICT(player_id) DO UPDATE SET
        player_name = excluded.player_name,
        last_seen = excluded.last_seen
    `).run(playerId, playerName, Date.now());

    // Update stats
    const isWin = winnerId === playerId ? 1 : 0;
    const isLoss = winnerId && winnerId !== playerId ? 1 : 0;
    const isDraw = !winnerId ? 1 : 0;

    this.db.prepare(`
      UPDATE players
      SET
        total_games = total_games + 1,
        wins = wins + ?,
        losses = losses + ?,
        draws = draws + ?,
        total_turns = total_turns + ?
      WHERE player_id = ?
    `).run(isWin, isLoss, isDraw, turnCount, playerId);
  }

  /**
   * Get recent matches
   */
  getRecentMatches(limit: number = 20): MatchRecord[] {
    return this.db.prepare(`
      SELECT * FROM matches
      ORDER BY end_time DESC
      LIMIT ?
    `).all(limit) as MatchRecord[];
  }

  /**
   * Get matches for a specific player
   */
  getPlayerMatches(playerId: string, limit: number = 10): MatchRecord[] {
    return this.db.prepare(`
      SELECT * FROM matches
      WHERE player1_id = ? OR player2_id = ?
      ORDER BY end_time DESC
      LIMIT ?
    `).all(playerId, playerId, limit) as MatchRecord[];
  }

  /**
   * Get player statistics
   */
  getPlayerStats(playerId: string): PlayerStats | null {
    const player = this.db.prepare(`
      SELECT * FROM players WHERE player_id = ?
    `).get(playerId) as any;

    if (!player) return null;

    const avgGameDuration = this.db.prepare(`
      SELECT AVG(end_time - start_time) as avg_duration
      FROM matches
      WHERE player1_id = ? OR player2_id = ?
    `).get(playerId, playerId) as { avg_duration: number };

    const favoriteDeck = this.db.prepare(`
      SELECT deck1_id as deck, COUNT(*) as count
      FROM matches
      WHERE player1_id = ?
      GROUP BY deck1_id
      UNION ALL
      SELECT deck2_id as deck, COUNT(*) as count
      FROM matches
      WHERE player2_id = ?
      GROUP BY deck2_id
      ORDER BY count DESC
      LIMIT 1
    `).get(playerId, playerId) as { deck: string; count: number } | undefined;

    return {
      player_id: player.player_id,
      player_name: player.player_name,
      total_games: player.total_games,
      wins: player.wins,
      losses: player.losses,
      draws: player.draws,
      win_rate: player.total_games > 0 ? (player.wins / player.total_games) * 100 : 0,
      avg_game_duration: avgGameDuration.avg_duration || 0,
      favorite_deck: favoriteDeck?.deck || null,
    };
  }

  /**
   * Get leaderboard (top players by wins)
   */
  getLeaderboard(limit: number = 10): PlayerStats[] {
    const players = this.db.prepare(`
      SELECT * FROM players
      WHERE total_games >= 3
      ORDER BY wins DESC, (CAST(wins AS REAL) / total_games) DESC
      LIMIT ?
    `).all(limit) as any[];

    return players.map(p => ({
      player_id: p.player_id,
      player_name: p.player_name,
      total_games: p.total_games,
      wins: p.wins,
      losses: p.losses,
      draws: p.draws,
      win_rate: p.total_games > 0 ? (p.wins / p.total_games) * 100 : 0,
      avg_game_duration: 0,
      favorite_deck: null,
    }));
  }

  /**
   * Get total stats
   */
  getTotalStats() {
    const totalMatches = this.db.prepare(`
      SELECT COUNT(*) as count FROM matches
    `).get() as { count: number };

    const totalPlayers = this.db.prepare(`
      SELECT COUNT(*) as count FROM players
    `).get() as { count: number };

    const avgMatchDuration = this.db.prepare(`
      SELECT AVG(end_time - start_time) as avg_duration FROM matches
    `).get() as { avg_duration: number };

    return {
      totalMatches: totalMatches.count,
      totalPlayers: totalPlayers.count,
      avgMatchDuration: avgMatchDuration.avg_duration || 0,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
