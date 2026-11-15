import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type D1DatabaseLike,
  type SaveMatchParams,
  getUserMatchHistory,
  getUserStats,
  saveMatchResult,
} from "./matchRepository";

class MockD1Database implements D1DatabaseLike {
  public executedQueries: { sql: string; params: any[] }[] = [];
  public batches: { sql: string; params: any[] }[][] = [];
  public usersTable: Map<string, any> = new Map();
  public matchesTable: Map<string, any> = new Map();
  public participantsTable: any[] = [];
  public mockMatchHistoryResults: any[] = [];

  prepare(sql: string) {
    let boundParams: any[] = [];
    const self = this;

    const stmt = {
      bind(...params: any[]) {
        boundParams = params;
        return stmt;
      },
      async first<T = any>(colName?: string): Promise<T | null> {
        self.executedQueries.push({ sql, params: boundParams });
        if (sql.includes("FROM users WHERE id = ?")) {
          const user = self.usersTable.get(boundParams[0]);
          if (!user) return null;
          return (colName ? user[colName] : user) as T;
        }
        return null;
      },
      async all<T = any>(): Promise<{ results: T[] }> {
        self.executedQueries.push({ sql, params: boundParams });
        if (sql.includes("FROM match_participants")) {
          return { results: self.mockMatchHistoryResults as any };
        }
        return { results: [] };
      },
      async run(): Promise<{ success: boolean }> {
        self.executedQueries.push({ sql, params: boundParams });
        return { success: true };
      },
      _sql: sql,
      _params: () => boundParams,
    };
    return stmt as any;
  }

  async batch(statements: any[]): Promise<any[]> {
    const currentBatch = statements.map((s) => ({
      sql: s._sql,
      params: s._params(),
    }));
    this.batches.push(currentBatch);

    // バッチ内のクエリをシミュレート
    for (const s of currentBatch) {
      if (s.sql.includes("INSERT INTO users") || s.sql.includes("ON CONFLICT(id)")) {
        const [id, username, rating, highestRating, wins, losses] = s.params;
        const existing = this.usersTable.get(id);
        if (existing) {
          existing.username = username;
          existing.rating = rating;
          existing.highest_rating = Math.max(existing.highest_rating, rating);
          existing.wins += wins;
          existing.losses += losses;
        } else {
          this.usersTable.set(id, {
            id,
            username,
            rating,
            highest_rating: highestRating,
            wins,
            losses,
          });
        }
      } else if (s.sql.includes("INSERT INTO matches")) {
        const [id, winnerId, isRanked, endReason] = s.params;
        this.matchesTable.set(id, {
          id,
          winner_id: winnerId,
          is_ranked: isRanked,
          end_reason: endReason,
        });
      } else if (s.sql.includes("INSERT INTO match_participants")) {
        const [matchId, userId, initialRating, finalScore, ratingDiff] = s.params;
        this.participantsTable.push({
          match_id: matchId,
          user_id: userId,
          initial_rating: initialRating,
          final_score: finalScore,
          rating_diff: ratingDiff,
        });
      }
    }

    return statements.map(() => ({ success: true }));
  }
}

describe("Match Repository & Result Persistence to D1", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  it("should persist a ranked match result with ELO rating updates in a single batch transaction", async () => {
    // 既存ユーザーデータ
    db.usersTable.set("player_1", {
      id: "player_1",
      username: "Alice",
      rating: 1500,
      highest_rating: 1500,
      wins: 5,
      losses: 2,
    });
    db.usersTable.set("player_2", {
      id: "player_2",
      username: "Bob",
      rating: 1500,
      highest_rating: 1520,
      wins: 3,
      losses: 4,
    });

    const matchParams: SaveMatchParams = {
      matchId: "match-uuid-1",
      winnerId: "player_1",
      endReason: "death",
      isRanked: true,
      players: [
        { id: "player_1", name: "Alice", score: 12 },
        { id: "player_2", name: "Bob", score: 8 },
      ],
    };

    const result = await saveMatchResult(db, matchParams);

    expect(result.matchId).toBe("match-uuid-1");
    expect(result.winnerId).toBe("player_1");
    expect(result.endReason).toBe("death");
    expect(result.participants).toHaveLength(2);

    const p1Result = result.participants.find((p) => p.userId === "player_1")!;
    const p2Result = result.participants.find((p) => p.userId === "player_2")!;

    expect(p1Result.initialRating).toBe(1500);
    expect(p1Result.ratingDiff).toBe(16);
    expect(p1Result.newRating).toBe(1516);
    expect(p1Result.finalScore).toBe(12);

    expect(p2Result.initialRating).toBe(1500);
    expect(p2Result.ratingDiff).toBe(-16);
    expect(p2Result.newRating).toBe(1484);
    expect(p2Result.finalScore).toBe(8);

    // バッチ（単一トランザクション）が1回実行されたことを検証
    expect(db.batches).toHaveLength(1);

    // DBの状態更新を検証
    const updatedP1 = db.usersTable.get("player_1");
    expect(updatedP1.rating).toBe(1516);
    expect(updatedP1.highest_rating).toBe(1516);
    expect(updatedP1.wins).toBe(6);
    expect(updatedP1.losses).toBe(2);

    const updatedP2 = db.usersTable.get("player_2");
    expect(updatedP2.rating).toBe(1484);
    expect(updatedP2.highest_rating).toBe(1520);
    expect(updatedP2.wins).toBe(3);
    expect(updatedP2.losses).toBe(5);

    // matches テーブル
    const savedMatch = db.matchesTable.get("match-uuid-1");
    expect(savedMatch).toBeDefined();
    expect(savedMatch.winner_id).toBe("player_1");
    expect(savedMatch.end_reason).toBe("death");
    expect(savedMatch.is_ranked).toBe(1);

    // match_participants テーブル
    expect(db.participantsTable).toHaveLength(2);
  });

  it("should handle new/guest users with default rating 1500 when saving match", async () => {
    const matchParams: SaveMatchParams = {
      matchId: "match-uuid-new",
      winnerId: "new_player_1",
      endReason: "score",
      isRanked: true,
      players: [
        { id: "new_player_1", name: "Guest_1111", score: 25 },
        { id: "new_player_2", name: "Guest_2222", score: 18 },
      ],
    };

    const result = await saveMatchResult(db, matchParams);

    expect(result.participants[0].initialRating).toBe(1500);
    expect(result.participants[1].initialRating).toBe(1500);

    const p1 = db.usersTable.get("new_player_1");
    expect(p1).toBeDefined();
    expect(p1.username).toBe("Guest_1111");
    expect(p1.wins).toBe(1);
    expect(p1.losses).toBe(0);
  });

  it("should handle a draw match correctly without changing win/loss counts and 0 rating diff", async () => {
    db.usersTable.set("p1", {
      id: "p1",
      username: "P1",
      rating: 1500,
      highest_rating: 1500,
      wins: 1,
      losses: 1,
    });
    db.usersTable.set("p2", {
      id: "p2",
      username: "P2",
      rating: 1500,
      highest_rating: 1500,
      wins: 2,
      losses: 2,
    });

    const matchParams: SaveMatchParams = {
      matchId: "match-draw",
      winnerId: null,
      endReason: "score",
      isRanked: true,
      players: [
        { id: "p1", name: "P1", score: 20 },
        { id: "p2", name: "P2", score: 20 },
      ],
    };

    const result = await saveMatchResult(db, matchParams);

    expect(result.winnerId).toBeNull();
    const p1Result = result.participants.find((p) => p.userId === "p1")!;
    const p2Result = result.participants.find((p) => p.userId === "p2")!;
    expect(p1Result.ratingDiff).toBe(0);
    expect(p2Result.ratingDiff).toBe(0);

    const p1 = db.usersTable.get("p1");
    expect(p1.wins).toBe(1);
    expect(p1.losses).toBe(1);
  });

  it("should not change ratings if isRanked is false (casual match)", async () => {
    db.usersTable.set("p1", {
      id: "p1",
      username: "P1",
      rating: 1600,
      highest_rating: 1600,
      wins: 5,
      losses: 0,
    });
    db.usersTable.set("p2", {
      id: "p2",
      username: "P2",
      rating: 1400,
      highest_rating: 1400,
      wins: 1,
      losses: 4,
    });

    const matchParams: SaveMatchParams = {
      matchId: "match-casual",
      winnerId: "p1",
      endReason: "timeout",
      isRanked: false,
      players: [
        { id: "p1", name: "P1", score: 5 },
        { id: "p2", name: "P2", score: 2 },
      ],
    };

    const result = await saveMatchResult(db, matchParams);

    expect(result.participants[0].ratingDiff).toBe(0);
    expect(result.participants[1].ratingDiff).toBe(0);
    expect(result.participants[0].newRating).toBe(1600);
    expect(result.participants[1].newRating).toBe(1400);

    const savedMatch = db.matchesTable.get("match-casual");
    expect(savedMatch.is_ranked).toBe(0);
    expect(savedMatch.end_reason).toBe("timeout");
  });

  it("should retrieve user statistics by user id", async () => {
    db.usersTable.set("target_user", {
      id: "target_user",
      username: "TopPlayer",
      rating: 1750,
      highest_rating: 1800,
      wins: 20,
      losses: 5,
    });

    const user = await getUserStats(db, "target_user");
    expect(user).toBeDefined();
    expect(user?.username).toBe("TopPlayer");
    expect(user?.rating).toBe(1750);
  });

  it("should retrieve recent match history for a user with opponent details", async () => {
    db.mockMatchHistoryResults = [
      {
        match_id: "m-1",
        winner_id: "user_a",
        is_ranked: 1,
        end_reason: "death",
        created_at: "2026-11-08 10:00:00",
        user_score: 15,
        user_rating_diff: 16,
        user_initial_rating: 1500,
        opponent_id: "user_b",
        opponent_name: "RivalBob",
        opponent_score: 8,
        opponent_rating: 1520,
      },
      {
        match_id: "m-2",
        winner_id: "user_c",
        is_ranked: 1,
        end_reason: "timeout",
        created_at: "2026-11-07 15:30:00",
        user_score: 3,
        user_rating_diff: -14,
        user_initial_rating: 1516,
        opponent_id: "user_c",
        opponent_name: "MasterCarl",
        opponent_score: 12,
        opponent_rating: 1600,
      },
    ];

    const history = await getUserMatchHistory(db, "user_a", 10);
    expect(history).toHaveLength(2);

    expect(history[0].matchId).toBe("m-1");
    expect(history[0].result).toBe("win");
    expect(history[0].opponentName).toBe("RivalBob");
    expect(history[0].userScore).toBe(15);
    expect(history[0].opponentScore).toBe(8);
    expect(history[0].ratingDiff).toBe(16);
    expect(history[0].endReason).toBe("death");

    expect(history[1].matchId).toBe("m-2");
    expect(history[1].result).toBe("lose");
    expect(history[1].opponentName).toBe("MasterCarl");
    expect(history[1].ratingDiff).toBe(-14);
  });
});
