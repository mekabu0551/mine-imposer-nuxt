# Logic Specification: Board Generation & Rules

本ドキュメントは、マインスイーパーのコアロジック、特に「情報の非対称性」と「対戦の公平性」を担保するための実装詳細を規定する。

## 1. Constants & Configurations

- **Board Size**: 16 x 16 (Total 256 cells)
- **Bomb Count**: 40 (Density: ~15.6%)
- **Safe Zone**: Initial Click ± 1 cell (3x3 area)
- **Time Limit**: 10 seconds / turn

## 2. Data Structures

### 2.1. Internal Server State (Master Data)
Durable Object内で保持される「真実」の状態。

```typescript
type CellIndex = number; // 0 to 255 (y * width + x)

interface MasterCell {
  isBomb: boolean;
  adjacentCount: number; // 0-8
}

interface GameState {
  grid: MasterCell[];    // index access
  opened: Set<CellIndex>;
  flagged: Map<CellIndex, PlayerId>; // 誰がフラグを立てたか
  playerLife: Record<PlayerId, number>;
  score: Record<PlayerId, number>;
  turnStartTime: number;
}