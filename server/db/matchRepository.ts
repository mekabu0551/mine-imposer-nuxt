import { calculateElo } from "./elo";

export interface D1PreparedStatementLike {
  bind(...params: any[]): D1PreparedStatementLike;
  first<T = any>(colName?: string): Promise<T | null>;
  all<T = any>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch(statements: D1PreparedStatementLike[]): Promise<any[]>;
}

export interface UserRecord {
  id: string;
  username: string;
  auth_provider?: string | null;
  auth_id?: string | null;
  rating: number;
  highest_rating: number;
  wins: number;
  losses: number;
  created_at?: string;
}

export interface MatchPlayerParam {
  id: string;
  name: string;
  score: number;
}

export interface SaveMatchParams {
  matchId: string;
  winnerId: string | null;
  endReason: "score" | "death" | "timeout" | "surrender";
  isRanked: boolean;
  players: [MatchPlayerParam, MatchPlayerParam];
}

export interface SavedParticipantResult {
  userId: string;
  username: string;
  initialRating: number;
  finalScore: number;
  ratingDiff: number;
  newRating: number;
}

export interface SavedMatchResult {
  matchId: string;
  winnerId: string | null;
  endReason: string;
  isRanked: boolean;
  participants: [SavedParticipantResult, SavedParticipantResult];
}

/**
 * Retrieves a user record by user ID from D1.
 */
export async function getUserStats(db: D1DatabaseLike, userId: string): Promise<UserRecord | null> {
  const stmt = db.prepare(
    "SELECT id, username, auth_provider, auth_id, rating, highest_rating, wins, losses, created_at FROM users WHERE id = ?",
  );
  return stmt.bind(userId).first<UserRecord>();
}

/**
 * Persists match results and updates participant statistics in D1 within a single batch transaction.
 */
export async function saveMatchResult(
  db: D1DatabaseLike,
  params: SaveMatchParams,
): Promise<SavedMatchResult> {
  const [p1, p2] = params.players;

  // 1. 各プレイヤーの現行戦績・レートを取得（未登録の場合は初期値 1500）
  const [p1User, p2User] = await Promise.all([getUserStats(db, p1.id), getUserStats(db, p2.id)]);

  const p1InitialRating = p1User?.rating ?? 1500;
  const p2InitialRating = p2User?.rating ?? 1500;

  let p1Diff = 0;
  let p2Diff = 0;
  let p1NewRating = p1InitialRating;
  let p2NewRating = p2InitialRating;
  let p1Wins = 0;
  let p1Losses = 0;
  let p2Wins = 0;
  let p2Losses = 0;

  if (params.isRanked) {
    const winnerType = params.winnerId === p1.id ? "p1" : params.winnerId === p2.id ? "p2" : "draw";

    const elo = calculateElo({
      p1Rating: p1InitialRating,
      p2Rating: p2InitialRating,
      winner: winnerType,
    });

    p1Diff = elo.p1Diff;
    p2Diff = elo.p2Diff;
    p1NewRating = elo.p1NewRating;
    p2NewRating = elo.p2NewRating;

    if (winnerType === "p1") {
      p1Wins = 1;
      p2Losses = 1;
    } else if (winnerType === "p2") {
      p2Wins = 1;
      p1Losses = 1;
    }
  }

  // 2. 単一トランザクション (batch) のステートメントを構築
  const upsertUserSql = `
    INSERT INTO users (id, username, rating, highest_rating, wins, losses)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      username = excluded.username,
      rating = excluded.rating,
      highest_rating = max(users.highest_rating, excluded.rating),
      wins = users.wins + excluded.wins,
      losses = users.losses + excluded.losses
  `;

  const insertMatchSql = `
    INSERT INTO matches (id, winner_id, is_ranked, end_reason)
    VALUES (?, ?, ?, ?)
  `;

  const insertParticipantSql = `
    INSERT INTO match_participants (match_id, user_id, initial_rating, final_score, rating_diff)
    VALUES (?, ?, ?, ?, ?)
  `;

  const p1HighestRating = Math.max(p1User?.highest_rating ?? 1500, p1NewRating);
  const p2HighestRating = Math.max(p2User?.highest_rating ?? 1500, p2NewRating);

  const statements = [
    // ユーザー1のupsert
    db.prepare(upsertUserSql).bind(p1.id, p1.name, p1NewRating, p1HighestRating, p1Wins, p1Losses),
    // ユーザー2のupsert
    db.prepare(upsertUserSql).bind(p2.id, p2.name, p2NewRating, p2HighestRating, p2Wins, p2Losses),
    // 試合レコードのinsert
    db
      .prepare(insertMatchSql)
      .bind(params.matchId, params.winnerId, params.isRanked ? 1 : 0, params.endReason),
    // 参加者1のレコードinsert
    db.prepare(insertParticipantSql).bind(params.matchId, p1.id, p1InitialRating, p1.score, p1Diff),
    // 参加者2のレコードinsert
    db.prepare(insertParticipantSql).bind(params.matchId, p2.id, p2InitialRating, p2.score, p2Diff),
  ];

  await db.batch(statements);

  return {
    matchId: params.matchId,
    winnerId: params.winnerId,
    endReason: params.endReason,
    isRanked: params.isRanked,
    participants: [
      {
        userId: p1.id,
        username: p1.name,
        initialRating: p1InitialRating,
        finalScore: p1.score,
        ratingDiff: p1Diff,
        newRating: p1NewRating,
      },
      {
        userId: p2.id,
        username: p2.name,
        initialRating: p2InitialRating,
        finalScore: p2.score,
        ratingDiff: p2Diff,
        newRating: p2NewRating,
      },
    ],
  };
}
