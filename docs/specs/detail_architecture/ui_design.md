# UI/UX Design Specification: Tactical Industrial

## 1. デザインコンセプト
「極限状態の爆発物処理端末」。
無機質なスチールグレーを基調に、ネオンカラーのアクセントと、アナログモニター特有のノイズ感を加える。

## 2. カラーパレット (Tailwind Config 候補)
| 役割 | 変数名 | カラーコード | 備考 |
| :--- | :--- | :--- | :--- |
| Background | `--color-bg` | `#0D1117` | 深い漆黒。宇宙や地下を彷彿させる。 |
| Surface | `--color-surface` | `#161B22` | パネルやカードの背景。 |
| Border | `--color-border` | `#30363D` | 鋼鉄の継ぎ目。 |
| Number 1 | `--color-num-1` | `#58A6FF` | 信頼感のあるブルー。 |
| Number 2 | `--color-num-2` | `#3FB950` | 安全を示すグリーン。 |
| Warning | `--color-warning` | `#F1C40F` | 警告・フラッグ。アンバー。 |
| Danger | `--color-danger` | `#E74C3C` | 爆弾・ライフ減少。ブラッドレッド。 |

## 3. コンポーネント定義

### 3.1 盤面セル (Grid Cell)
- **未開封**: `bg-surface` に `border-t-white/10` と `border-b-black/40` を加え、立体的なベゼルを表現。
- **開封済**: わずかに窪んだ（`inset shadow`）質感。
- **ホバー**: ターゲットレティクルのような細い枠線が表示される。

### 3.2 爆弾 & フラッグ (SVG)
- **Bomb**: 単なる円ではなく、中心が赤く拍動（Pulseアニメーション）するメカニカル・マイン。
- **Flag**: デジタルな三角形の警告灯。

### 3.3 タイマー (10s Commit Timer)
- **通常時**: 上部中央に配置されたセグメントディスプレイ風のフォント。
- **3秒以下**: 数字が赤く発光し、画面全体にわずかな `Chromatic Aberration`（色収差）の振動を加える。

## 4. 特殊エフェクト (CSS/SVG Filter)
- **Scanline**: 画面全体に `linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))` を適用し、ブラウン管感を出す。
- **CRT Glow**: テキストや数字に `drop-shadow(0 0 5px var(--color-glow))` を適用。

## 5. アセット管理方針
- **画像不要**: アイコンはすべて `lucide-react` のカスタマイズ、またはインラインSVGで実装。
- **フォント**:
  - UI文字: `'Inter', sans-serif`
  - 数字・タイマー: `'JetBrains Mono', monospace`
