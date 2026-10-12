import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useGameSocket } from "./useGameSocket";

class MockWebSocketClient {
  static instances: MockWebSocketClient[] = [];
  public url: string;
  public readyState: number = 1;
  public sent: string[] = [];
  public onopen: (() => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onclose: (() => void) | null = null;
  public onerror: ((error: any) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocketClient.instances.push(this);
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }

  // テスト用ヘルパー
  receiveMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
}

describe("useGameSocket Composable", () => {
  beforeEach(() => {
    MockWebSocketClient.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocketClient);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should connect and send join message on mount", async () => {
    const { isConnected, gameState, connect } = useGameSocket("room-123", {
      id: "p1",
      name: "Player 1",
    });

    connect("ws://localhost:8787");

    const ws = MockWebSocketClient.instances[0];
    expect(ws).toBeDefined();
    expect(ws.url).toBe("ws://localhost:8787/api/room/room-123/ws");

    // WebSocket open が発火するのを待つ
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(isConnected.value).toBe(true);

    // join メッセージが送信されていること
    const joinMsg = JSON.parse(ws.sent[0]);
    expect(joinMsg).toEqual({
      type: "join",
      playerId: "p1",
      playerName: "Player 1",
    });

    // サーバーからの state メッセージ受信
    const mockState = {
      board: [],
      players: [
        { id: "p1", name: "Player 1", score: 0, lives: 3 },
        { id: "p2", name: "Player 2", score: 0, lives: 3 },
      ],
      currentTurnPlayerId: "p1",
      winnerId: null,
      status: "playing" as const,
      yourPlayerId: "p1",
    };

    ws.receiveMessage({ type: "state", state: mockState });
    expect(gameState.value).toEqual(mockState);
  });

  it("should send open action when openCell is called", async () => {
    const { connect, openCell } = useGameSocket("room-123", {
      id: "p1",
      name: "Player 1",
    });

    connect("ws://localhost:8787");
    await new Promise((resolve) => setTimeout(resolve, 10));

    openCell(3, 4);
    const ws = MockWebSocketClient.instances[0];
    const openMsg = JSON.parse(ws.sent[ws.sent.length - 1]);
    expect(openMsg).toEqual({
      type: "open",
      row: 3,
      col: 4,
    });
  });

  it("should send flag action when toggleFlag is called", async () => {
    const { connect, toggleFlag } = useGameSocket("room-123", {
      id: "p1",
      name: "Player 1",
    });

    connect("ws://localhost:8787");
    await new Promise((resolve) => setTimeout(resolve, 10));

    toggleFlag(5, 6);
    const ws = MockWebSocketClient.instances[0];
    const flagMsg = JSON.parse(ws.sent[ws.sent.length - 1]);
    expect(flagMsg).toEqual({
      type: "flag",
      row: 5,
      col: 6,
    });
  });
});
