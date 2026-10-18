import { describe, it, expect, beforeEach } from "vitest";
import { MineImposerGame } from "./gameServer";
import type { PublicGameState } from "../shared/game";

// テスト用 WebSocket モック
class MockWebSocket {
  public readyState: number = 1; // OPEN
  public sentMessages: string[] = [];
  public listeners: { [event: string]: Function[] } = {};
  public peer?: MockWebSocket;

  addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  send(data: string) {
    this.sentMessages.push(data);
    if (this.peer) {
      const listeners = this.peer.listeners["message"] || [];
      listeners.forEach((cb) => cb({ data }));
    }
  }

  accept() {
    this.readyState = 1;
  }

  close() {
    this.readyState = 3;
    const listeners = this.listeners["close"] || [];
    listeners.forEach((cb) => cb());
  }

  getLastMessage(): any {
    if (this.sentMessages.length === 0) return null;
    return JSON.parse(this.sentMessages[this.sentMessages.length - 1]);
  }
}

function createMockWebSocketPair(): [MockWebSocket, MockWebSocket] {
  const client = new MockWebSocket();
  const server = new MockWebSocket();
  client.peer = server;
  server.peer = client;
  return [client, server];
}

describe("MineImposerGame Durable Object", () => {
  let gameServer: MineImposerGame;
  let mockState: any;
  let mockEnv: any;

  beforeEach(() => {
    mockState = {
      storage: {
        get: async () => null,
        put: async () => {},
      },
    };
    mockEnv = {};
    gameServer = new MineImposerGame(mockState, mockEnv);
  });

  it("should accept WebSocket connection and handle player join", async () => {
    const [clientWs, serverWs] = createMockWebSocketPair();

    // DO に WebSocket を登録
    gameServer.handleSession(serverWs as any);

    // プレイヤー1が参加
    clientWs.send(
      JSON.stringify({
        type: "join",
        playerId: "p1",
        playerName: "Alice",
      }),
    );

    // プレイヤー1参加時点のメッセージ確認 (waiting)
    const p1Msg = serverWs.getLastMessage();
    expect(p1Msg).toBeDefined();
    expect(p1Msg.type).toBe("state");
    expect(p1Msg.state.status).toBe("waiting");
    expect(p1Msg.state.players[0].name).toBe("Alice");

    // プレイヤー2が参加
    const [clientWs2, serverWs2] = createMockWebSocketPair();
    gameServer.handleSession(serverWs2 as any);

    clientWs2.send(
      JSON.stringify({
        type: "join",
        playerId: "p2",
        playerName: "Bob",
      }),
    );

    // 2人揃ったのでゲームが playing になること
    const p2Msg = serverWs2.getLastMessage();
    expect(p2Msg.type).toBe("state");
    expect(p2Msg.state.status).toBe("playing");
    expect(p2Msg.state.players[1].name).toBe("Bob");

    // p1 にも playing の最新 state がブロードキャストされていること
    const p1UpdatedMsg = serverWs.getLastMessage();
    expect(p1UpdatedMsg.state.status).toBe("playing");
    expect(p1UpdatedMsg.state.yourPlayerId).toBe("p1");
    expect(p2Msg.state.yourPlayerId).toBe("p2");
  });

  it("should handle open cell action and broadcast updated state", async () => {
    const [clientWs1, serverWs1] = createMockWebSocketPair();
    const [clientWs2, serverWs2] = createMockWebSocketPair();

    gameServer.handleSession(serverWs1 as any);
    gameServer.handleSession(serverWs2 as any);

    clientWs1.send(JSON.stringify({ type: "join", playerId: "p1", playerName: "Alice" }));
    clientWs2.send(JSON.stringify({ type: "join", playerId: "p2", playerName: "Bob" }));

    // p1 のターンなので p1 がセル (0,0) を開ける
    clientWs1.send(JSON.stringify({ type: "open", row: 0, col: 0 }));

    const p1StateMsg = serverWs1.getLastMessage();
    expect(p1StateMsg.type).toBe("state");
    const cell = p1StateMsg.state.board[0][0];
    expect(cell.isOpen).toBe(true);

    // p2 にも同じく (0,0) が開いた state が届いていること
    const p2StateMsg = serverWs2.getLastMessage();
    expect(p2StateMsg.state.board[0][0].isOpen).toBe(true);
  });

  it("should handle flag toggle action and keep flags private to player", async () => {
    const [clientWs1, serverWs1] = createMockWebSocketPair();
    const [clientWs2, serverWs2] = createMockWebSocketPair();

    gameServer.handleSession(serverWs1 as any);
    gameServer.handleSession(serverWs2 as any);

    clientWs1.send(JSON.stringify({ type: "join", playerId: "p1", playerName: "Alice" }));
    clientWs2.send(JSON.stringify({ type: "join", playerId: "p2", playerName: "Bob" }));

    // p1 が (2,3) にフラグを立てる
    clientWs1.send(JSON.stringify({ type: "flag", row: 2, col: 3 }));

    const p1Msg = serverWs1.getLastMessage();
    expect(p1Msg.state.board[2][3].isFlagged).toBe(true);

    // p2 には p1 のフラグは見えないこと (isFlagged: false)
    const p2Msg = serverWs2.getLastMessage();
    expect(p2Msg.state.board[2][3].isFlagged).toBe(false);
  });

  it("should handle commit message and broadcast updated state", async () => {
    const [clientWs1, serverWs1] = createMockWebSocketPair();
    const [clientWs2, serverWs2] = createMockWebSocketPair();

    gameServer.handleSession(serverWs1 as any);
    gameServer.handleSession(serverWs2 as any);

    clientWs1.send(JSON.stringify({ type: "join", playerId: "p1", playerName: "Alice" }));
    clientWs2.send(JSON.stringify({ type: "join", playerId: "p2", playerName: "Bob" }));

    // テスト用に決定論的なモック盤面を設定
    const mockBoard = Array.from({ length: 16 }, (_, r) =>
      Array.from({ length: 16 }, (_, c) => ({
        row: r,
        col: c,
        isBomb: false,
        isOpen: false,
        neighborBombs: 0,
      })),
    );
    mockBoard[0][1].isBomb = true; // (0,1) が爆弾なので (0,0) は 1 となり連鎖しない
    mockBoard[15][15].isBomb = true;
    gameServer.getGame()!.setMockBoard(mockBoard);

    // p1 が commit を送信
    clientWs1.send(
      JSON.stringify({
        type: "commit",
        actions: [
          { type: "flag", row: 1, col: 1, timestamp: Date.now() },
          { type: "open", row: 0, col: 0, timestamp: Date.now() },
        ],
      }),
    );

    const p1Msg = serverWs1.getLastMessage();
    expect(p1Msg.type).toBe("state");
    expect(p1Msg.state.board[1][1].isFlagged).toBe(true);
    expect(p1Msg.state.board[0][0].isOpen).toBe(true);
    // スコアは直接クリックの1点加算
    expect(p1Msg.state.players[0].score).toBe(1);

    // p2 にも最新ステートが届くが、フラグは見えない
    const p2Msg = serverWs2.getLastMessage();
    expect(p2Msg.type).toBe("state");
    expect(p2Msg.state.board[1][1].isFlagged).toBe(false);
    expect(p2Msg.state.board[0][0].isOpen).toBe(true);
  });

  it("should reject delayed commit and notify sender with error", async () => {
    const [clientWs1, serverWs1] = createMockWebSocketPair();
    const [clientWs2, serverWs2] = createMockWebSocketPair();

    gameServer.handleSession(serverWs1 as any);
    gameServer.handleSession(serverWs2 as any);

    clientWs1.send(JSON.stringify({ type: "join", playerId: "p1", playerName: "Alice" }));
    clientWs2.send(JSON.stringify({ type: "join", playerId: "p2", playerName: "Bob" }));

    // 遅延したタイムスタンプ (+20000ms)
    clientWs1.send(
      JSON.stringify({
        type: "commit",
        actions: [{ type: "open", row: 0, col: 0, timestamp: Date.now() + 20000 }],
      }),
    );

    const errorMsg = serverWs1.getLastMessage();
    expect(errorMsg.type).toBe("error");
    expect(errorMsg.code).toBe("TURN_TIMEOUT_EXCEEDED");
  });
});
