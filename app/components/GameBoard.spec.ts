import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import GameBoard from "./GameBoard.vue";
import type { PublicGameState } from "../../shared/game";

describe("GameBoard Component", () => {
  const createMockGameState = (): PublicGameState => ({
    board: Array.from({ length: 16 }, (_, r) =>
      Array.from({ length: 16 }, (_, c) => ({
        row: r,
        col: c,
        isOpen: false,
        isFlagged: false,
      })),
    ),
    players: [
      { id: "p1", name: "Player 1", score: 5, lives: 3 },
      { id: "p2", name: "Player 2", score: 2, lives: 2 },
    ],
    currentTurnPlayerId: "p1",
    winnerId: null,
    status: "playing",
    yourPlayerId: "p1",
  });

  it("should render 16x16 (256) cells", () => {
    const gameState = createMockGameState();
    const wrapper = mount(GameBoard, {
      props: { gameState },
    });

    const cells = wrapper.findAll('[data-testid^="cell-"]');
    expect(cells.length).toBe(256);
  });

  it("should emit open event on cell left-click", async () => {
    const gameState = createMockGameState();
    const wrapper = mount(GameBoard, {
      props: { gameState },
    });

    const targetCell = wrapper.find('[data-testid="cell-2-3"]');
    await targetCell.trigger("click");

    expect(wrapper.emitted("open")).toBeTruthy();
    expect(wrapper.emitted("open")![0]).toEqual([{ row: 2, col: 3 }]);
  });

  it("should emit flag event on cell right-click (contextmenu)", async () => {
    const gameState = createMockGameState();
    const wrapper = mount(GameBoard, {
      props: { gameState },
    });

    const targetCell = wrapper.find('[data-testid="cell-4-5"]');
    await targetCell.trigger("contextmenu");

    expect(wrapper.emitted("flag")).toBeTruthy();
    expect(wrapper.emitted("flag")![0]).toEqual([{ row: 4, col: 5 }]);
  });

  it("should display player scores, lives, and turn indicator", () => {
    const gameState = createMockGameState();
    const wrapper = mount(GameBoard, {
      props: { gameState },
    });

    // プレイヤー1と2の情報が表示されているか
    expect(wrapper.text()).toContain("Player 1");
    expect(wrapper.text()).toContain("Player 2");
    // スコア表示
    expect(wrapper.text()).toContain("5");
    expect(wrapper.text()).toContain("2");
    // ターン表示
    expect(wrapper.text()).toContain("YOUR TURN");
  });

  it("should render open cell with neighbor bomb count", () => {
    const gameState = createMockGameState();
    // (1,1) を開封状態、隣接数 2 にする
    gameState.board[1][1].isOpen = true;
    gameState.board[1][1].neighborBombs = 2;

    const wrapper = mount(GameBoard, {
      props: { gameState },
    });

    const cell = wrapper.find('[data-testid="cell-1-1"]');
    expect(cell.text()).toContain("2");
  });

  it("should render flagged cell", () => {
    const gameState = createMockGameState();
    gameState.board[3][3].isFlagged = true;

    const wrapper = mount(GameBoard, {
      props: { gameState },
    });

    const cell = wrapper.find('[data-testid="cell-3-3"]');
    expect(cell.classes()).toContain("is-flagged");
  });

  it("should render multiple opened cells from cascade open", () => {
    const gameState = createMockGameState();
    gameState.board[0][0].isOpen = true;
    gameState.board[0][0].neighborBombs = 0;
    gameState.board[0][1].isOpen = true;
    gameState.board[0][1].neighborBombs = 1;
    gameState.board[1][0].isOpen = true;
    gameState.board[1][0].neighborBombs = 1;

    const wrapper = mount(GameBoard, {
      props: { gameState },
    });

    expect(wrapper.find('[data-testid="cell-0-0"]').attributes("disabled")).toBeDefined();
    expect(wrapper.find('[data-testid="cell-0-1"]').text()).toContain("1");
    expect(wrapper.find('[data-testid="cell-1-0"]').text()).toContain("1");
  });

  it("should show victory status when game is finished", () => {
    const gameState = createMockGameState();
    gameState.status = "finished";
    gameState.winnerId = "p1";

    const wrapper = mount(GameBoard, {
      props: { gameState },
    });

    expect(wrapper.text()).toContain("VICTORY");
  });
});
