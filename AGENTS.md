# プロジェクト概要: マインインポーザー (Mine Imposer)
「論理」×「速度」×「心理戦」の対戦型マインスイーパー。

## 開発の原則
- **厳密なTDD (Test-Driven Development)**: すべてのビジネスロジックにおいて、必ずテスト（Vitest）を先行して実装し、テストをパスさせる形で実装を行うこと。
- **IaC管理**: Cloudflare等のインフラ設定はすべてTerraformで定義・構築すること。

## 1. 基本ルール & システム
- **盤面**: 16×16の共有盤面。2プレイヤーで交互にターンを進行。
- **制限時間**: 1ターン10秒（超過はダメージ＋ターン強制終了）。
- **操作**:
  - オープン: マスを開ける。安全なら+1点。爆弾ならライフ-1＆ターン終了。
  - フラッグ: 爆弾の目印を設置。自分のみに見え、相手には非表示。
- **ライフ**: 初期ライフ各❤️3。0になるとノックアウト敗北。
- **勝利条件**: 相手ライフ0（ノックアウト）または全安全マス開封時の高スコア。
- **対戦モード**: ランダムマッチ、合言葉マッチ、レートマッチ（将来）。

## 2. システムアーキテクチャ
- **Frontend (Cloudflare Pages)**: Nuxt 3, Tailwind CSS, Lucide Vue
- **Realtime Logic (Durable Objects)**: 盤面・タイマー状態の保持、WebSocket通信、判定。
- **Database (Cloudflare D1)**: SQLite + Drizzle ORM。戦績・レートの永続化。
- **セキュリティ**: 爆弾位置(`masterGrid`)はDO内のみ保持。ActionLogの遅延送信検証。

## 3. データベース設計 (D1)
- **Users**: id(UUID), username, auth_provider, auth_id, rating(ELO), highest_rating, wins, losses
- **Matches**: id(UUID), winner_id, is_ranked, end_reason(score/death/timeout/surrender)
- **Match_Participants**: match_id, user_id, initial_rating, final_score, rating_diff
- **対戦中データ**: DOメモリ上で一時管理し、試合終了時にD1へ単一トランザクションで書き込み。

## 4. UI/UXデザイン (Tactical Industrial)
- **コンセプト**: 「極限状態の爆発物処理端末」 (ブラウン管風Scanline、ネオンGlow演出)
- **カラーパレット**:
  - 背景/サーフェス: `#0D1117` / `#161B22`
  - 数字/警告/危険: `#58A6FF` (1) / `#3FB950` (2) / `#F1C40F` (Warning) / `#E74C3C` (Danger)
- **フォント**: UIは `Inter`、数字・タイマーは `JetBrains Mono`
- **演出**: 残り3秒で赤点滅・カウント音・色収差、被弾時に画面シェイク。

## 5. 画面一覧 & 遷移
- **画面**: Home → Matching (または Private Entry → Matching) → Game → Result (→ Home/Matching)
- **戦績**: Profile (勝率、レート推移グラフ、直近10戦履歴)
- **例外**: 切断時は「再接続中...」、相手退出時は再戦無効化。

## 6. 出力
- 日本語で出力する
