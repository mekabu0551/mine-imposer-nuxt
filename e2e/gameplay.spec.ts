import { test, expect } from "@playwright/test";
import type { PublicGameState, PublicCell } from "../shared/game";

function createMockBoard(): PublicCell[][] {
  return Array.from({ length: 16 }, (_, r) =>
    Array.from({ length: 16 }, (_, c) => ({
      row: r,
      col: c,
      isOpen: false,
      isFlagged: false,
      isBomb: false,
      neighborBombs: 0,
    })),
  );
}

test.describe("Tactical Gameplay & Board Interaction", () => {
  test("should render game board, HUD and allow cell open and flag interactions", async ({
    page,
  }) => {
    let mockBoard = createMockBoard();
    const sentMessages: any[] = [];

    // WebSocket 接続をインターセプト
    await page.routeWebSocket(/.*\/api\/room\/.*\/ws.*/, (ws) => {
      ws.onMessage((message) => {
        const data = JSON.parse(message as string);
        sentMessages.push(data);

        if (data.type === "join") {
          // 参加メッセージを受け取ったら対戦中(playing)のステートを返却
          const playingState: PublicGameState = {
            board: mockBoard,
            players: [
              { id: data.playerId, name: data.playerName, score: 0, lives: 3 },
              { id: "rival-agent-id", name: "RivalAgent", score: 0, lives: 3 },
            ],
            currentTurnPlayerId: data.playerId,
            winnerId: null,
            status: "playing",
            yourPlayerId: data.playerId,
            turnStartedAt: Date.now(),
            turnDurationMs: 10000,
          };
          ws.send(JSON.stringify({ type: "state", state: playingState }));
        } else if (data.type === "open") {
          // セルオープンアクション: (row, col) を開封して数字1を設定
          const { row, col } = data;
          mockBoard = mockBoard.map((r) =>
            r.map((cell) => {
              if (cell.row === row && cell.col === col) {
                return { ...cell, isOpen: true, neighborBombs: 1 };
              }
              return cell;
            }),
          );
          const updatedState: PublicGameState = {
            board: mockBoard,
            players: [
              {
                id: sentMessages[0].playerId,
                name: sentMessages[0].playerName,
                score: 1,
                lives: 3,
              },
              { id: "rival-agent-id", name: "RivalAgent", score: 0, lives: 3 },
            ],
            currentTurnPlayerId: "rival-agent-id",
            winnerId: null,
            status: "playing",
            yourPlayerId: sentMessages[0].playerId,
            turnStartedAt: Date.now(),
            turnDurationMs: 10000,
          };
          ws.send(JSON.stringify({ type: "state", state: updatedState }));
        } else if (data.type === "flag") {
          // フラッグアクション: (row, col) のフラグをトグル
          const { row, col } = data;
          mockBoard = mockBoard.map((r) =>
            r.map((cell) => {
              if (cell.row === row && cell.col === col) {
                return { ...cell, isFlagged: !cell.isFlagged };
              }
              return cell;
            }),
          );
          const updatedState: PublicGameState = {
            board: mockBoard,
            players: [
              {
                id: sentMessages[0].playerId,
                name: sentMessages[0].playerName,
                score: 0,
                lives: 3,
              },
              { id: "rival-agent-id", name: "RivalAgent", score: 0, lives: 3 },
            ],
            currentTurnPlayerId: sentMessages[0].playerId,
            winnerId: null,
            status: "playing",
            yourPlayerId: sentMessages[0].playerId,
            turnStartedAt: Date.now(),
            turnDurationMs: 10000,
          };
          ws.send(JSON.stringify({ type: "state", state: updatedState }));
        }
      });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // ランダムマッチをクリックして対戦開始
    await page.getByTestId("random-match-btn").click();

    // 1. HUD とプレイヤー情報の表示確認
    await expect(page.getByText("YOU:")).toBeVisible();
    await expect(page.getByText("RivalAgent")).toBeVisible();
    await expect(page.getByText(":RIVAL")).toBeVisible();
    await expect(page.getByTestId("turn-timer")).toBeVisible();

    // 2. 16x16 盤面のセルが存在することを確認
    const cell00 = page.getByTestId("cell-0-0");
    const cell1515 = page.getByTestId("cell-15-15");
    await expect(cell00).toBeVisible();
    await expect(cell1515).toBeVisible();

    // 3. フラッグ操作 (右クリック) の確認
    await cell00.click({ button: "right" });
    // フラグアイコン 🚩 の表示
    await expect(cell00).toContainText("🚩");
    expect(sentMessages.some((msg) => msg.type === "flag" && msg.row === 0 && msg.col === 0)).toBe(
      true,
    );

    // フラッグ解除 (もう一度右クリック)
    await cell00.click({ button: "right" });
    await expect(cell00).not.toContainText("🚩");

    // 4. セルオープン操作 (左クリック) の確認
    const cell01 = page.getByTestId("cell-0-1");
    await cell01.click();
    // 開封されて neighborBombs: 1 が表示されること
    await expect(cell01).toContainText("1");
    // スコアが 1 PTS に加算されていること
    await expect(page.getByText("1 PTS")).toBeVisible();
    expect(sentMessages.some((msg) => msg.type === "open" && msg.row === 0 && msg.col === 1)).toBe(
      true,
    );

    // 5. TERMINATE & RETURN ボタンで試合終了・離脱
    const terminateBtn = page.getByTestId("return-home-btn");
    await expect(terminateBtn).toBeVisible();
    await terminateBtn.click();

    // ホーム画面に戻ることを確認
    await expect(page.locator("h1")).toHaveText("Mine Imposer");
    await expect(page.getByTestId("random-match-btn")).toBeVisible();
  });
});
