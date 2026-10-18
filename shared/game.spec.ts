import { describe, it, expect, beforeEach } from "vitest";
import { Game } from "./game";

describe("Game core logic", () => {
  let game: Game;
  const p1Id = "player1";
  const p2Id = "player2";

  beforeEach(() => {
    // 16x16, 40本の爆弾でゲームを初期化
    game = new Game(p1Id, "Alice", p2Id, "Bob", 40);
  });

  it("should initialize game state correctly", () => {
    const state = game.getState();
    expect(state.status).toBe("playing");
    expect(state.board.length).toBe(16);
    expect(state.board[0].length).toBe(16);

    // 爆弾の総数が40個であることを確認
    let bombCount = 0;
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        if (state.board[r][c].isBomb) bombCount++;
      }
    }
    expect(bombCount).toBe(40);

    // プレイヤーの初期化確認
    expect(state.players[0].id).toBe(p1Id);
    expect(state.players[0].lives).toBe(3);
    expect(state.players[0].score).toBe(0);
    expect(state.players[1].id).toBe(p2Id);
    expect(state.players[1].lives).toBe(3);
    expect(state.players[1].score).toBe(0);

    // ターン確認
    expect(state.currentTurnPlayerId).toBe(p1Id);
  });

  it("should calculate neighbor bombs correctly", () => {
    // 固定の盤面を作ってテストするために、モックの盤面を設定できるメソッドを用意する
    const mockBoard = Array.from({ length: 16 }, (_, r) =>
      Array.from({ length: 16 }, (_, c) => ({
        row: r,
        col: c,
        isBomb: false,
        isOpen: false,
        neighborBombs: 0,
      })),
    );
    // 爆弾を (0,1) と (1,0) に配置
    mockBoard[0][1].isBomb = true;
    mockBoard[1][0].isBomb = true;

    game.setMockBoard(mockBoard);

    const state = game.getState();
    // (0,0) の周囲の爆弾数は 2
    expect(state.board[0][0].neighborBombs).toBe(2);
    // (0,2) の周囲の爆弾数は 1
    expect(state.board[0][2].neighborBombs).toBe(1);
    // (2,2) の周囲の爆弾数は 0
    expect(state.board[2][2].neighborBombs).toBe(0);
  });

  it("should handle opening a safe cell and alternating turn", () => {
    const mockBoard = Array.from({ length: 16 }, (_, r) =>
      Array.from({ length: 16 }, (_, c) => ({
        row: r,
        col: c,
        isBomb: false,
        isOpen: false,
        neighborBombs: 0,
      })),
    );
    mockBoard[0][1].isBomb = true; // (0,1) が爆弾
    game.setMockBoard(mockBoard);

    // ターン1: p1 が (0,0) を開ける
    const result = game.openCell(p1Id, 0, 0);
    expect(result.success).toBe(true);

    const state = game.getState();
    expect(state.board[0][0].isOpen).toBe(true);
    expect(state.players[0].score).toBe(1); // スコア +1
    expect(state.players[0].lives).toBe(3); // ライフ減らない
    expect(state.currentTurnPlayerId).toBe(p2Id); // ターン交代
  });

  it("should handle opening a bomb cell, losing life, and alternating turn", () => {
    const mockBoard = Array.from({ length: 16 }, (_, r) =>
      Array.from({ length: 16 }, (_, c) => ({
        row: r,
        col: c,
        isBomb: false,
        isOpen: false,
        neighborBombs: 0,
      })),
    );
    mockBoard[0][0].isBomb = true; // (0,0) が爆弾
    game.setMockBoard(mockBoard);

    // ターン1: p1 が (0,0) を開ける
    const result = game.openCell(p1Id, 0, 0);
    expect(result.success).toBe(true);
    expect(result.hitBomb).toBe(true);

    const state = game.getState();
    expect(state.board[0][0].isOpen).toBe(true);
    expect(state.players[0].score).toBe(0); // スコア増えない
    expect(state.players[0].lives).toBe(2); // ライフ -1
    expect(state.currentTurnPlayerId).toBe(p2Id); // ターン交代
  });

  it("should trigger cascade open for neighbor-0 cells", () => {
    const mockBoard = Array.from({ length: 16 }, (_, r) =>
      Array.from({ length: 16 }, (_, c) => ({
        row: r,
        col: c,
        isBomb: false,
        isOpen: false,
        neighborBombs: 0,
      })),
    );
    // (0,3) に爆弾を置く。これにより (0,0), (0,1) 周辺は neighborBombs = 0 となる
    mockBoard[0][3].isBomb = true;
    game.setMockBoard(mockBoard);

    // p1 が (0,0) を開ける。周囲の爆弾数は 0
    game.openCell(p1Id, 0, 0);

    const state = game.getState();
    // 0マスの連鎖により、(0,0), (0,1), (1,0), (1,1) などが開いていることを期待する
    expect(state.board[0][0].isOpen).toBe(true);
    expect(state.board[0][1].isOpen).toBe(true);
    expect(state.board[1][0].isOpen).toBe(true);
    expect(state.board[1][1].isOpen).toBe(true);

    // 爆弾のある (0,3) は開いていないこと
    expect(state.board[0][3].isOpen).toBe(false);

    // 仕様書: 直接クリック+1点、オートオープン(連鎖)0点
    expect(state.players[0].score).toBe(1);
    // ただし盤面は複数マス開いていること
    let openCount = 0;
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        if (state.board[r][c].isOpen) openCount++;
      }
    }
    expect(openCount).toBeGreaterThan(1);
  });

  it("should toggle flag for a player", () => {
    game.toggleFlag(p1Id, 0, 0);
    let state = game.getState();
    expect(state.flags[p1Id]).toContain("0,0");

    // もう一度呼ぶとフラッグ解除
    game.toggleFlag(p1Id, 0, 0);
    state = game.getState();
    expect(state.flags[p1Id]).not.toContain("0,0");
  });

  it("should win by knockout when opponent lives reach 0", () => {
    const mockBoard = Array.from({ length: 16 }, (_, r) =>
      Array.from({ length: 16 }, (_, c) => ({
        row: r,
        col: c,
        isBomb: false,
        isOpen: false,
        neighborBombs: 0,
      })),
    );
    mockBoard[0][0].isBomb = true;
    mockBoard[0][1].isBomb = true;
    mockBoard[0][2].isBomb = true;
    game.setMockBoard(mockBoard);

    // p1 が爆弾を開け続ける（テスト用にターン強制変更やライフ直接操作も可能だが、普通にプレイする）
    // p1ターン: (0,0) -> ライフ2、ターンp2へ
    game.openCell(p1Id, 0, 0);
    // p2ターン: (0,5) 安全なマスを開ける -> ターンp1へ
    game.openCell(p2Id, 0, 5);

    // p1ターン: (0,1) -> ライフ1、ターンp2へ
    game.openCell(p1Id, 0, 1);
    // p2ターン: (0,6) 安全 -> ターンp1へ
    game.openCell(p2Id, 0, 6);

    // p1ターン: (0,2) -> ライフ0、ゲーム終了、勝者p2
    game.openCell(p1Id, 0, 2);

    const state = game.getState();
    expect(state.status).toBe("finished");
    expect(state.winnerId).toBe(p2Id);
  });

  it("should win by score when all safe cells are opened", () => {
    const mockBoard = Array.from({ length: 16 }, (_, r) =>
      Array.from({ length: 16 }, (_, c) => ({
        row: r,
        col: c,
        isBomb: false,
        isOpen: false,
        neighborBombs: 0,
      })),
    );
    // すべて安全で、1箇所だけ爆弾にする
    mockBoard[0][0].isBomb = true;
    game.setMockBoard(mockBoard);

    // すべての安全なマスを開ける (255個)
    // p1 と p2 で交互に開けていく
    let turnPlayer = p1Id;
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        if (r === 0 && c === 0) continue; // 爆弾は避ける
        game.openCell(turnPlayer, r, c);
        turnPlayer = turnPlayer === p1Id ? p2Id : p1Id;
      }
    }

    const state = game.getState();
    expect(state.status).toBe("finished");
  });

  it("should conceal bomb positions and opponent flags in getPublicState (Anti-Cheat)", () => {
    const mockBoard = Array.from({ length: 16 }, (_, r) =>
      Array.from({ length: 16 }, (_, c) => ({
        row: r,
        col: c,
        isBomb: false,
        isOpen: false,
        neighborBombs: 0,
      })),
    );
    mockBoard[0][0].isBomb = true;
    mockBoard[0][1].isBomb = true;
    game.setMockBoard(mockBoard);

    // p1 がフラグを (0,0) に立てる
    game.toggleFlag(p1Id, 0, 0);
    // p2 がフラグを (0,1) に立てる
    game.toggleFlag(p2Id, 0, 1);

    // p1 視点のステートを取得
    const p1State = game.getPublicState(p1Id);
    expect(p1State.yourPlayerId).toBe(p1Id);

    // 未開封マス (0,0) の isBomb と neighborBombs は undefined であること
    const cell00ForP1 = p1State.board[0][0];
    expect(cell00ForP1.isOpen).toBe(false);
    expect(cell00ForP1.isBomb).toBeUndefined();
    expect(cell00ForP1.neighborBombs).toBeUndefined();
    // p1が立てたフラグは見えていること
    expect(cell00ForP1.isFlagged).toBe(true);

    // 未開封マス (0,1) は p2 が立てたフラグなので、p1 には見えないこと
    const cell01ForP1 = p1State.board[0][1];
    expect(cell01ForP1.isOpen).toBe(false);
    expect(cell01ForP1.isFlagged).toBe(false);
    expect(cell01ForP1.isBomb).toBeUndefined();

    // p1 が安全なマス (1,1) を開ける
    game.openCell(p1Id, 1, 1);
    const p1StateAfterOpen = game.getPublicState(p1Id);
    const cell11 = p1StateAfterOpen.board[1][1];
    expect(cell11.isOpen).toBe(true);
    // 開封済みマスは neighborBombs が取得できること
    expect(cell11.neighborBombs).toBeDefined();
    expect(cell11.isBomb).toBe(false);
  });

  describe("applyCommit logic", () => {
    it("should sequentially apply valid actions in a commit", () => {
      const now = Date.now();
      const mockBoard = Array.from({ length: 16 }, (_, r) =>
        Array.from({ length: 16 }, (_, c) => ({
          row: r,
          col: c,
          isBomb: false,
          isOpen: false,
          neighborBombs: 0,
        })),
      );
      mockBoard[0][1].isBomb = true;
      game.setMockBoard(mockBoard);

      const commitResult = game.applyCommit(
        {
          playerId: p1Id,
          actions: [
            { type: "flag", row: 0, col: 1, timestamp: now + 100 },
            { type: "open", row: 0, col: 0, timestamp: now + 500 },
          ],
        },
        now, // serverTurnStartTime
      );

      expect(commitResult.success).toBe(true);
      expect(commitResult.hitBomb).toBe(false);

      const state = game.getState();
      expect(state.flags[p1Id]).toContain("0,1");
      expect(state.board[0][0].isOpen).toBe(true);
      expect(state.players[0].score).toBe(1);
      expect(state.currentTurnPlayerId).toBe(p2Id); // ターン交代
    });

    it("should reject commit with actions exceeding time limit (anti-cheat)", () => {
      const serverTurnStartTime = 1000;
      // 10秒制限 + 2秒マージン = 12000ms を超えるタイムスタンプ (1000 + 13000 = 14000)
      const commitResult = game.applyCommit(
        {
          playerId: p1Id,
          actions: [{ type: "open", row: 0, col: 0, timestamp: 14000 }],
        },
        serverTurnStartTime,
      );

      expect(commitResult.success).toBe(false);
      expect(commitResult.error).toBe("TURN_TIMEOUT_EXCEEDED");

      // 盤面は変更されていないこと
      const state = game.getState();
      expect(state.board[0][0].isOpen).toBe(false);
    });

    it("should halt actions immediately upon hitting a bomb in commit", () => {
      const now = Date.now();
      const mockBoard = Array.from({ length: 16 }, (_, r) =>
        Array.from({ length: 16 }, (_, c) => ({
          row: r,
          col: c,
          isBomb: false,
          isOpen: false,
          neighborBombs: 0,
        })),
      );
      mockBoard[0][0].isBomb = true;
      game.setMockBoard(mockBoard);

      const commitResult = game.applyCommit(
        {
          playerId: p1Id,
          actions: [
            { type: "open", row: 0, col: 0, timestamp: now + 100 }, // 爆弾
            { type: "open", row: 1, col: 1, timestamp: now + 200 }, // 次のマス
          ],
        },
        now,
      );

      expect(commitResult.success).toBe(true);
      expect(commitResult.hitBomb).toBe(true);

      const state = game.getState();
      expect(state.board[0][0].isOpen).toBe(true);
      expect(state.board[1][1].isOpen).toBe(false); // 爆弾でターン中断のため開いていない
      expect(state.players[0].lives).toBe(2);
      expect(state.currentTurnPlayerId).toBe(p2Id);
    });
  });
});
