# 技術要件定義：インフラ・プラットフォーム層 (Infrastructure & Platform)

## 1. クラウドプラットフォーム (Cloudflare)
本プロジェクトは、低レイテンシな対戦体験を実現するため、Cloudflareのエッジコンピューティング環境を全面的に採用する。

### 構成要素
* **Hosting**: Cloudflare Pages (Nuxt.js / Nitro)
* **Compute (Edge)**: Cloudflare Workers
* **Stateful Compute**: Cloudflare Durable Objects
    * 対戦中の「共有盤面」「スコア」「10秒タイマー」の整合性を保つためのステートフルな実行環境。
* **Database (RDBMS)**: Cloudflare D1 (SQLiteベース)
    * ユーザープロフィール、レート、対戦履歴の永続化。
* **Real-time Comm**: WebSockets (via Durable Objects)
* **Infrastructure as Code**: Terraform

---

## 2. Terraform 管理計画
インフラの全リソースをコードで管理し、環境の再現性と変更履歴を担保する。

### 管理リソース (Resource Map)
* `cloudflare_pages_project`: Nuxt.jsのビルド・デプロイ設定。
* `cloudflare_worker_script`: マッチングロジックおよびDurable Objectsの定義。
* `cloudflare_d1_database`: D1インスタンスの作成。
* `cloudflare_worker_secret`: APIキー、DB接続文字列、環境変数の安全な注入。

### State管理 (Remote State)
* **Backend**: Terraform Cloud または Cloudflare R2 を検討（無料枠とチーム開発の利便性で選択）。

---

## 3. アプリケーション層との境界 (The Edge Interface)
アプリケーション層（Nuxt.js）がインフラ層を利用する際のプロトコルを定義する。

| コンポーネント | アクセス方法 | 用途 |
| :--- | :--- | :--- |
| **D1 Database** | `env.DB` (Workers Binding) | ユーザー認証、戦績参照 |
| **Durable Objects** | `env.GAME_SERVER` (Stub) | 試合中の全アクション、コミット処理 |
| **WebSocket** | `ws://` / `wss://` | リアルタイムな操作ログの送信、気配同期 |

---

## 4. 実行計画：インフラ構築フェーズ
TDDを開始するための最低限の土台を以下の順序で構築する。

1.  **Terraform Initial**: Cloudflare Providerのセットアップ。
2.  **D1 Provisioning**: データベースの作成と、ローカル開発環境（Wrangler）からの接続確認。
3.  **Durable Object Setup**: ゲームサーバーのひな形をデプロイし、クライアントからの接続を疎通させる。
4.  **CI/CD Pipeline**: GitHub Actionsにて、`main`ブランチへのマージ時に自動で `terraform apply` および Pages へのデプロイが走る状態にする。

---

## 5. 非機能要件 (Security & Performance)
* **Cold Start対策**: Durable Objectsを使用することで、試合中のWorkerのコールドスタートを回避し、低遅延を維持。
* **地理的冗長性**: Cloudflareのエッジネットワークを利用し、プレイヤーに最も近いデータセンターでマッチング・計算を行う（※DOの配置制限に依存）。
* **レート制限**: 短時間での大量クリックや認証試行を制限する WAF ルールの適用（Terraformで管理）。
