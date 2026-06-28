# 実行計画書：マインインポーザー (Mine Imposer)

## 0. 基本方針
* **TDD優先**: すべてのビジネスロジックは Vitest でテストを先行させる。
* **Infrastructure as Code (IaC)**: Cloudflareリソースはすべて Terraform で管理する。
* **コミット遵守**: 各ステップ完了ごとに、指定されたメッセージでコミットする。

---

## Phase 1: インフラ基盤とCI/CDの構築 [DONE]
**目的**: 開発環境を整え、デプロイ自動化のパスを通す。

1.  **Terraform初期化**
    * 内容: Cloudflare D1, Pages, Workers(Durable Objects用)のリソース定義。
    * コミット: `feat(infra): initial terraform setup for d1, pages, and workers`
    * 成果物: main.tf, D1, Pages Project, DO Namespacs`
2.  **CI/CDパイプライン構築**
    * 内容: GitHub Actionsによる `terraform plan/apply` および `vitest` の自動実行設定。
    * コミット: `ci: setup github actions for test and deployment`
    * 成果物: .github/workflows/deploy.yml, Secret管理
3.  **Nuxt.js プロジェクト初期化**
    * 内容: Nuxt 3, TypeScript, Vitest, Tailwind CSS の導入。
    * コミット: `chore: init nuxt.js project with vitest and tailwind`
    * 成果物: pages/, components/, vitest.config.ts, tailwind.config.ts

---

## Phase 2: コア・プレイループの垂直開発
**目的**: 盤面操作からターン遷移までの一連のプレイ体験を、フロント・バック両面で完成させる。

1.  **盤面表示と基本操作の準備 (ステップ別実装)**
    * **Step 0: ホーム画面UIの実装**
        * 内容: プレイスタイル選択ボタン、ユーザー情報表示。
        * コミット: `feat(ui): implement home screen UI`
    * **Step 1: Logic + DOの実装（バックエンド基盤）**
        * 内容: 盤面生成ロジック(Logic)、DOによる初期化とWebSocketハンドリング。
        * 検証: VitestによるロジックテストおよびMiniflare上でのDO動作確認。
        * コミット: `feat(server): logic and durable object setup for board initialization`
    * **Step 2: FEの実装とWebSocket接続（フロントエンド結合）**
        * 内容: 16x16グリッド表示、クリック操作の送信、サーバー状態の反映。
        * 検証: ブラウザ上での実機通信確認。
        * コミット: `feat(ui): interactive board with websocket synchronization`

2.  **判定ロジックと連鎖開封**
    * 内容: 0マス連鎖・スコア・ライフ計算(Logic)、ActionLogの検証(DO)、サーバー状態との同期(FE)。
    * コミット: `feat(logic): game logic integration and state sync`

3.  **ターン管理と権威タイマー**
    * 内容: ターン遷移(Logic)、サーバー側10秒タイマー(DO)、カウントダウン表示と強制転換(FE)。
    * コミット: `feat(game): turn management and authority timer`

---

## Phase 3: 永続化とユーザー統計
**目的**: 試合結果を保存し、ユーザーが自分の成長を確認できるようにする。

1.  **D1へのハイスコア・試合ログ保存**
    * 内容: D1スキーマ定義(IaC)、決着時のリザルト保存ロジック(DO -> D1)。
    * コミット: `feat: vertical slice - match result persistence to D1`

2.  **リザルト画面とプロフィール表示**
    * 内容: 試合終了後の遷移(FE)、D1からの戦績・レート取得API(Worker)、統計グラフ表示(FE)。
    * コミット: `feat: vertical slice - result screen and user statistics`

3.  **リーダーボード機能**
    * 内容: 全ユーザーのレート集計(Worker/D1)、ランキング画面(FE)。
    * コミット: `feat: vertical slice - global leaderboard implementation`

---

## Phase 4: マッチングとUXの完成
**目的**: 対人対戦を成立させ、ゲームとしての完成度（演出・堅牢性）を高める。

1.  **マッチングシステム (ランダム/合言葉)**
    * 内容: 待機列管理(Workers)、マッチング待機画面とルームへの自動遷移(FE)。
    * コミット: `feat: vertical slice - match-making and room allocation`

2.  **演出・フィードバックの磨き込み**
    * 内容: 残り3秒の赤点滅、爆発エフェクト、サウンド(FE)。
    * コミット: `feat: polish - animations, sounds, and visual feedback`

3.  **再接続・セキュリティ・堅牢化**
    * 内容: 切断時の再接続(DO/FE)、盤面情報の隠蔽(Anti-cheat)、最終的な例外処理。
    * コミット: `feat: robust reconnection and security hardening`

---

## Phase 5: 例外系・チート対策・最終調整
**目的**: 実運用に耐えうる堅牢性と公平性を担保する。

1.  **再接続・復帰ロジック**
    * 内容: 通信切断時の自動再接続と、Durable Objects からの最新状態の再取得。
    * コミット: `feat(ui): handle websocket reconnection and state recovery`
2.  **データ隠蔽 (Anti-Cheat)**
    * 内容: サーバーからクライアントへ送るデータから、未開封マスの `isBomb` 情報を削除。
    * コミット: `security: prevent client-side data mining of bomb positions`
3.  **統合テスト (E2E)**
    * 内容: Playwright による、マッチングから決着までのフルシナリオテスト。
    * コミット: `test(e2e): full match flow validation using playwright`
