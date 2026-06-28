# データベース設計書 (Database Schema Design) - 最終版

## 1. 設計方針
* **永続層 (Persistence)**: Cloudflare D1を使用。ユーザーの資産（レート・戦績）と、完了した試合の結果のみを保存。
* **一時層 (Ephemeral)**: Cloudflare Durable Objectsを使用。対戦中の盤面、爆弾位置、各プレイヤーの現在のライフ等はメモリ上で管理し、DBには保存しない。
* **整合性**: 試合終了時、Durable ObjectsからD1へ最終結果を1回だけ「コミット」する。

---

## 2. データベース定義 (Cloudflare D1)

### 2.1 Users テーブル
| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | ユーザー識別子 |
| `username` | TEXT | Not Null, Unique | 表示名 |
| `auth_provider` | TEXT |  | NULL, google, email 等（ゲスト判別用） |
| `auth_id` | TEXT | Unique | プロバイダー側の固有ID（Googleのsubなど） |
| `rating` | INTEGER | Default 1500 | ELOレート |
| `highest_rating` | INTEGER | Default 1500 | 過去最高レート |
| `wins` | INTEGER | Default 0 | 勝利数 |
| `losses` | INTEGER | Default 0 | 敗北数 |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 登録日 |

### 2.2 Matches テーブル
| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | 試合一意識別子 |
| `winner_id` | UUID | FK (Users.id) | 勝者のID（引分時NULL） |
| `is_ranked` | BOOLEAN | NOT NULL | ランクマッチか否か |
| `end_reason` | TEXT | Not Null | `score`, `death`, `timeout`, `surrender` |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 実行日時 |

### 2.3 Match_Participants テーブル (中間テーブル)
| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `match_id` | UUID | FK, PK | Matches.id への参照 |
| `user_id` | UUID | FK, PK | Users.id への参照 |
| `initial_rating` | INTEGER | FK, PK | 対戦前のレート |
| `final_score` | INTEGER | Not Null | 最終スコア |
| `rating_diff` | INTEGER | Not Null | レートの増減値 |

---

## 3. 対戦中のデータ管理 (Durable Objects / In-Memory)

対戦中の詳細な状態は、パフォーマンスとセキュリティの観点から**DB（D1）には保存せず、Durable Objects(DO)のインスタンスメモリ上で管理**する。

### 3.1 管理データ項目
DO内のクラス変数として保持し、WebSocketを通じて同期する。
* **Master Board**: 全マスの正解（爆弾か否か、周囲の数）の配列。
* **Public State**: 開封されたマスの位置と、誰が開けたかの記録。
* **Player Stats**: 現在のライフ残量、スコア、ターン権。
* **Timer State**: ターンの残り時間（サーバーサイド管理）。

### 3.2 管理フロー
1. **生成**: マッチング成立時、DOインスタンス内で盤面をランダム生成。
2. **更新**: プレイヤーのアクション（コミット）を受け取り、DO内のメモリを更新。
3. **永続化**: 勝利条件を満たした瞬間に、上記「2. テーブル定義」に基づいてD1へ結果を書き込み、DOインスタンスを破棄（または休止）させる。

---

## 4. アプリケーション層での型定義 (TypeScript)

```typescript
// D1保存用 (永続)
export interface UserRecord {
  id: string;
  username: string;
  rating: number;
}

// Durable Objects管理用 (一時)
export interface LiveGameState {
  masterGrid: { isBomb: boolean; count: number }[]; // 非公開
  publicGrid: { isOpened: boolean; openerId: string | null }[]; // 公開
  players: Record<string, { lives: number; score: number }>;
  activeTurnPlayerId: string;
}
```
## 5. インフラ層の制約
 - **トランザクション**: 試合終了時のD1への書き込み（Match追加、Usersのレート更新）は、データ整合性を保つため単一のトランザクションとして実行する。

 - **データクリーンアップ**: 異常終了した試合（両者切断など）は、DOのアラーム機能（Alarm API）を使用して一定時間後に自動破棄・敗戦処理を行う。