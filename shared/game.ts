export interface Cell {
  row: number;
  col: number;
  isBomb: boolean;
  isOpen: boolean;
  neighborBombs: number;
}

export interface PublicCell {
  row: number;
  col: number;
  isOpen: boolean;
  isBomb?: boolean;
  neighborBombs?: number;
  isFlagged: boolean;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  lives: number;
}

export interface GameState {
  board: Cell[][];
  players: [Player, Player];
  currentTurnPlayerId: string;
  winnerId: string | null;
  status: "waiting" | "playing" | "finished";
  flags: { [playerId: string]: string[] };
}

export interface PublicGameState {
  board: PublicCell[][];
  players: [Player, Player];
  currentTurnPlayerId: string;
  winnerId: string | null;
  status: "waiting" | "playing" | "finished";
  yourPlayerId: string;
}

export interface ActionLogItem {
  type: "open" | "flag";
  row: number;
  col: number;
  timestamp: number;
}

export interface CommitPayload {
  playerId: string;
  actions: ActionLogItem[];
}

export interface CommitResult {
  success: boolean;
  hitBomb: boolean;
  error?: string;
}

export class Game {
  private board: Cell[][] = [];
  private players: [Player, Player];
  private currentTurnPlayerId: string;
  private winnerId: string | null = null;
  private status: "waiting" | "playing" | "finished" = "playing";
  private flags: { [playerId: string]: string[] } = {};

  constructor(
    p1Id: string,
    p1Name: string,
    p2Id: string,
    p2Name: string,
    private bombCount: number = 40,
  ) {
    this.players = [
      { id: p1Id, name: p1Name, score: 0, lives: 3 },
      { id: p2Id, name: p2Name, score: 0, lives: 3 },
    ];
    this.currentTurnPlayerId = p1Id;
    this.flags[p1Id] = [];
    this.flags[p2Id] = [];
    this.initializeBoard();
  }

  private initializeBoard() {
    // 1. 空の盤面作成
    this.board = Array.from({ length: 16 }, (_, r) =>
      Array.from({ length: 16 }, (_, c) => ({
        row: r,
        col: c,
        isBomb: false,
        isOpen: false,
        neighborBombs: 0,
      })),
    );

    // 2. 爆弾の配置
    let placed = 0;
    while (placed < this.bombCount) {
      const r = Math.floor(Math.random() * 16);
      const c = Math.floor(Math.random() * 16);
      if (!this.board[r][c].isBomb) {
        this.board[r][c].isBomb = true;
        placed++;
      }
    }

    // 3. 周辺爆弾数の計算
    this.recalculateNeighborBombs();
  }

  private recalculateNeighborBombs() {
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        if (this.board[r][c].isBomb) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < 16 && nc >= 0 && nc < 16) {
              if (this.board[nr][nc].isBomb) count++;
            }
          }
        }
        this.board[r][c].neighborBombs = count;
      }
    }
  }

  // テスト用のモック盤面設定
  public setMockBoard(board: Cell[][]) {
    this.board = board;
    this.recalculateNeighborBombs();
  }

  public getState(): GameState {
    return {
      board: this.board,
      players: this.players,
      currentTurnPlayerId: this.currentTurnPlayerId,
      winnerId: this.winnerId,
      status: this.status,
      flags: this.flags,
    };
  }

  public getPublicState(playerId: string): PublicGameState {
    const playerFlags = new Set(this.flags[playerId] || []);
    const publicBoard: PublicCell[][] = this.board.map((row) =>
      row.map((cell) => {
        if (cell.isOpen) {
          return {
            row: cell.row,
            col: cell.col,
            isOpen: true,
            isBomb: cell.isBomb,
            neighborBombs: cell.neighborBombs,
            isFlagged: false,
          };
        }
        return {
          row: cell.row,
          col: cell.col,
          isOpen: false,
          isFlagged: playerFlags.has(`${cell.row},${cell.col}`),
        };
      }),
    );

    return {
      board: publicBoard,
      players: this.players,
      currentTurnPlayerId: this.currentTurnPlayerId,
      winnerId: this.winnerId,
      status: this.status,
      yourPlayerId: playerId,
    };
  }

  public openCell(
    playerId: string,
    row: number,
    col: number,
  ): { success: boolean; hitBomb: boolean } {
    if (this.status !== "playing") return { success: false, hitBomb: false };
    if (playerId !== this.currentTurnPlayerId) return { success: false, hitBomb: false };
    if (row < 0 || row >= 16 || col < 0 || col >= 16) return { success: false, hitBomb: false };

    const cell = this.board[row][col];
    if (cell.isOpen) return { success: false, hitBomb: false };

    const activePlayer = this.players.find((p) => p.id === playerId)!;
    const opponentPlayer = this.players.find((p) => p.id !== playerId)!;

    if (cell.isBomb) {
      // 爆弾を踏んだ場合
      cell.isOpen = true;
      activePlayer.lives -= 1;

      if (activePlayer.lives <= 0) {
        this.status = "finished";
        this.winnerId = opponentPlayer.id;
      } else {
        this.switchTurn();
      }
      return { success: true, hitBomb: true };
    } else {
      // 安全なマスの開封
      let openedCount = 0;
      const queue: [number, number][] = [[row, col]];
      cell.isOpen = true;
      openedCount++;

      // Cascade open
      if (cell.neighborBombs === 0) {
        const visited = new Set<string>();
        visited.add(`${row},${col}`);

        while (queue.length > 0) {
          const [r, c] = queue.shift()!;
          if (this.board[r][c].neighborBombs > 0) continue;

          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < 16 && nc >= 0 && nc < 16) {
                const neighbor = this.board[nr][nc];
                const key = `${nr},${nc}`;
                if (!neighbor.isOpen && !neighbor.isBomb && !visited.has(key)) {
                  neighbor.isOpen = true;
                  openedCount++;
                  visited.add(key);
                  if (neighbor.neighborBombs === 0) {
                    queue.push([nr, nc]);
                  }
                }
              }
            }
          }
        }
      }

      // 直接クリックした安全なマスに対して+1点（オートオープン連鎖は0点）
      activePlayer.score += 1;

      // ゲーム終了判定（すべての安全なマスが開かれたか）
      if (this.checkAllSafeOpened()) {
        this.status = "finished";
        if (this.players[0].score > this.players[1].score) {
          this.winnerId = this.players[0].id;
        } else if (this.players[1].score > this.players[0].score) {
          this.winnerId = this.players[1].id;
        } else {
          this.winnerId = null; // 引き分け
        }
      } else {
        this.switchTurn();
      }

      return { success: true, hitBomb: false };
    }
  }

  public applyCommit(
    payload: CommitPayload,
    serverTurnStartTime: number,
    timeLimitMs: number = 10000,
    marginMs: number = 2000,
  ): CommitResult {
    if (this.status !== "playing") {
      return { success: false, hitBomb: false, error: "GAME_NOT_PLAYING" };
    }
    if (payload.playerId !== this.currentTurnPlayerId) {
      return { success: false, hitBomb: false, error: "INVALID_TURN_PLAYER" };
    }

    const maxAllowedTime = serverTurnStartTime + timeLimitMs + marginMs;

    // 遅延検証: アクションのタイムスタンプが制限時間を超過しているか事前にチェック
    for (const action of payload.actions) {
      if (action.timestamp > maxAllowedTime) {
        return { success: false, hitBomb: false, error: "TURN_TIMEOUT_EXCEEDED" };
      }
    }

    // 順次アクションを適用
    for (const action of payload.actions) {
      if (action.type === "flag") {
        this.toggleFlag(payload.playerId, action.row, action.col);
      } else if (action.type === "open") {
        const result = this.openCell(payload.playerId, action.row, action.col);
        if (!result.success) {
          continue;
        }
        if (result.hitBomb) {
          // 爆弾を踏んだ場合は即時中断
          return { success: true, hitBomb: true };
        }
      }
    }

    return { success: true, hitBomb: false };
  }

  public toggleFlag(playerId: string, row: number, col: number) {
    if (this.status !== "playing") return;
    if (row < 0 || row >= 16 || col < 0 || col >= 16) return;

    const cell = this.board[row][col];
    if (cell.isOpen) return;

    const key = `${row},${col}`;
    const pFlags = this.flags[playerId] || [];
    const index = pFlags.indexOf(key);

    if (index >= 0) {
      pFlags.splice(index, 1);
    } else {
      pFlags.push(key);
    }
    this.flags[playerId] = pFlags;
  }

  private switchTurn() {
    this.currentTurnPlayerId =
      this.currentTurnPlayerId === this.players[0].id ? this.players[1].id : this.players[0].id;
  }

  private checkAllSafeOpened(): boolean {
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const cell = this.board[r][c];
        if (!cell.isBomb && !cell.isOpen) {
          return false;
        }
      }
    }
    return true;
  }
}
