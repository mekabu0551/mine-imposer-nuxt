-- Users テーブル (ユーザーの資産: レート、戦績)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  auth_provider TEXT,
  auth_id TEXT UNIQUE,
  rating INTEGER NOT NULL DEFAULT 1500,
  highest_rating INTEGER NOT NULL DEFAULT 1500,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Matches テーブル (完了した試合ログ)
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  winner_id TEXT,
  is_ranked INTEGER NOT NULL DEFAULT 1,
  end_reason TEXT NOT NULL, -- 'score', 'death', 'timeout', 'surrender'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (winner_id) REFERENCES users(id)
);

-- Match_Participants テーブル (試合参加者・スコア・レート増減の中間テーブル)
CREATE TABLE IF NOT EXISTS match_participants (
  match_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  initial_rating INTEGER NOT NULL,
  final_score INTEGER NOT NULL,
  rating_diff INTEGER NOT NULL,
  PRIMARY KEY (match_id, user_id),
  FOREIGN KEY (match_id) REFERENCES matches(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_participants_user_id ON match_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);
