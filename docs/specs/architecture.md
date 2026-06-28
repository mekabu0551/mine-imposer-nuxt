# アプリケーションアーキテクチャ定義書

## 1. システム構成図 (System Component Diagram)

### コンポーネント間の通信フロー
1. **User ↔ Nuxt.js (Pages)**: HTTPSによるUIのロード。
2. **Nuxt.js ↔ Durable Objects**: WebSocket (WSS) による双方向・低遅延なゲームステート同期。
3. **Durable Objects ↔ D1 Database**: 試合終了時、Durable ObjectsからSQL (D1) へのトランザクション書き込み。
4. **Nuxt.js ↔ D1 Database**: 認証・戦績確認のためのREST APIアクセス。

## 2. レイヤー構造と責務

### 2.1 プレゼンテーション層 (Frontend / Cloudflare Pages)
* **技術**: Nuxt 3 (Nitro), Tailwind CSS, Lucide Vue
* **責務**:
    * ゲーム盤面の描画（Canvas/Grid）
    * ローカル状態（フラッグ、マウスオーバー）の管理
    * WebSocketクライアント（サーバー状態の受信とアクション送信）
    * 楽観的UI更新（クリック時の即時フィードバック）

### 2.2 リアルタイム・ロジック層 (Edge Compute / Durable Objects)
* **技術**: Cloudflare Workers + Durable Objects
* **責務**:
    * **「共有の真実」の保持**: 盤面、爆弾、スコア、ライフの管理
    * **コミットバリデーション**: クライアントからの操作ログを検証・実行
    * **サーバーサイドタイマー**: 10秒計測およびタイムアウト処理
    * **ブロードキャスト**: 状態変化を両プレイヤーへ即時配信

### 2.3 データアクセス・永続化層 (Database / Cloudflare D1)
* **技術**: Cloudflare D1 (SQLite) + Drizzle ORM
* **責務**:
    * ユーザー認証およびプロフィール管理
    * 戦績・レート（ELO）の永続化
    * 試合終了時の結果書き込み（トランザクション処理）

---

## 3. データフロー設計 (Data Flow)

### 3.1 ゲームプレイ中のループ
1.  **Action**: プレイヤーがマスをクリック。
2.  **Queue**: クライアント側で `ActionLog` に追加。
3.  **Submit**: 爆弾を踏むか、10秒経過、またはプレイヤーが意図的にターンを終了した際に `commit` イベントをDOへ送信。
4.  **Process**: DOが `applyCommit` ロジックを実行し、内部状態を更新。
5.  **Sync**: 更新された `GameState` を WebSocket で全プレイヤーに送信。

---

## 4. テスト境界 (Testing Boundaries)

* **Logic Unit Tests (Vitest)**: `applyCommit` などの純粋関数。サーバー/クライアント共通で使用。
* **Worker Tests (Miniflare/Vitest)**: Durable Objects の状態遷移と WebSocket 通信。
* **E2E Tests (Playwright)**: 2つのブラウザコンテキストを用いた対戦フロー。

---

## 5. 依存関係の注入 (Binding)

Cloudflare環境における各コンポーネントの接続定義。

```hcl
# wrangler.toml / terraform
[[d1_databases]]
binding = "DB"
database_name = "mine-imposer-db"

[[durable_objects.bindings]]
name = "GAME_SERVER"
class_name = "MineImposerGame"

[[migrations]]
tag = "v1"
new_classes = ["MineImposerGame"]
```
---

## 6. セキュリティ設計
 - **隠蔽**: masterGrid（爆弾配置）は DO 内にのみ存在し、API レスポンスからは除外される。

 - **検証**: 受信した ActionLog のタイムスタンプと、サーバー側ターンの開始時刻を照合し、不正な遅延送信を拒否する。