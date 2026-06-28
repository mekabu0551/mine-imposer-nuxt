# Coding Agent Instructions: Project Mine Imposer

あなたは熟練のフルスタックエンジニアとして、本プロジェクトの実装を担当します。
実装にあたっては、以下の設計ドキュメントをすべて読み込み、その方針を厳守してください。
なお、対話は日本語で行ってください。

# プロジェクト管理・指示書ディレクトリ構造

本プロジェクトでは、すべての設計・ルール・計画を `.gemini/` ディレクトリに集約し、エージェントの行動指針とします。

.gemini/
├── instructions.md         # [全体的ルール] エージェントの振る舞い・禁止事項・TDD厳守の指示
├── specs/ 
│   ├── detail_architecture/  # ディレクトリ配下に詳細設計を追記
│   │   ├── feature_list.md
│   │   └── screen_specifications.md
│   ├── system_spec.md      # システム仕様（マインインポーザーの基本ルール、勝利条件）
│   ├── infrastructure.md   # インフラ構成（Cloudflareリソース、Terraform管理定義）
│   ├── architecture.md     # アプリケーション構成（Nuxt.js, Durable Objects, 通信プロトコル）
│   └── database.md         # DB構成（D1スキーマ、DOステート管理、マイグレーション方針）
└── plan/
    └── roadmap.md          # [実装計画] フェーズ分け、コミット単位、現在の進捗状況

## 1. 参照ドキュメント (Source of Truth)
実装前に必ず以下の設計を確認すること：
- `docs/specs/system_spec.md`: ゲーム仕様、勝利条件、10秒ルールの定義
- `docs/specs/architecture.md`: Cloudflare Pages, Workers, DO, D1 の接続構成
- `docs/specs/database.md`: D1テーブル定義およびDurable Objectsのステート構造
- `docs/plan/roadmap.md`: フェーズごとの実装順序とコミットメッセージ

## 2. 開発の絶対原則 (Guiding Principles)
1. **Vertical Slice Development**:
   - Phase 2以降の開発は、バックエンド（Logic/DO）からフロントエンド（UI）までを1機能ごとに垂直に完成させること。
   - 機能が未完成のまま次の機能のバックエンド実装に手を出さないこと。
2. **TDD (Test Driven Development)**:
   - ロジック（特に `applyCommit`）を変更・追加する際は、必ず先に `vitest` のテストコードを書くこと。
   - テストが Red であることを確認してから実装に入り、Green にすること。
3. **Side-Effect Separation**:
   - ゲームロジック（純粋関数）と通信・I/O（WebSocket, D1）を明確に分離すること。
   - `src/lib/` には純粋なロジックのみを配置し、環境依存コードを混ぜないこと。
3. **IaC (Infrastructure as Code)**:
   - インフラ変更は `terraform/` 内の `.tf` ファイルを編集すること。WranglerのGUIや手動設定は禁止。
4. **コミット方針**: `roadmap.md` に記載されたコミット単位を守ること。

## 3. 禁則事項 (Strict Restrictions)
- **情報の隠蔽**: サーバーからクライアントへ送る `GameState` に、未開封マスの `isBomb` 情報を含めてはならない。
- **直接DB操作**: ゲームプレイ中の1クリックごとに D1 へ書き込んではならない。必ず Durable Objects で集計し、試合終了時に一度だけコミットすること。
- **Nuxt.js Server Routesの制限**: ゲームのリアルタイム通信に Server Routes (Nitro) を使用せず、Durable Objects を使用すること。

## 4. コーディングスタイル
- **Language**: TypeScript (Strict Mode)
- **Architecture**: Nuxt 3 (Vue 3, Composition API)
- **Style**: Tailwind CSS
- **Test**: Vitest (Unit), Playwright (E2E)

## 5. 開発環境・ツールスタック
1. **Runtime**: Node.js (LTS) & pnpm を基本とする。
2. **Local Emulation**: Dockerによるフルエミュレーションは避け、`wrangler dev` (Miniflare) を活用してエッジ環境を正確に再現すること。
3. **D1 Local**: DB操作は `wrangler d1` コマンドを通し、ローカルの SQLite ファイルで試作・検証すること。
4. **Terraform**: バージョン固定のため、必要に応じて Terraform 実行環境のみ Docker を使用することを許容する。

## 6. 実装ワークフロー
各タスクは以下のサイクルで回すこと：
1. `docs/plan/roadmap.md` から現在のフェーズを確認。
2. 関連する設計ドキュメントを再読。
3. テスト作成 (Red) → 実装 (Green) → リファクタリング。
4. 指定されたコミットメッセージで Git Commit。

## 7. コミュニケーション方針
- 曖昧な指示を受けた場合、自分の推測で実装を進めないこと。
- 不明点や、複数の実装パターンの選択肢がある場合は、作業前に必ずユーザーに質問し、合意を得ること。
- 「おそらくこうだろう」という仮定で動くのではなく、「確認させてください」という態度を徹底すること。


---