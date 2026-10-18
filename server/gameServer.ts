import { Game, type PublicGameState } from "../shared/game";

interface SessionMeta {
  playerId?: string;
  playerName?: string;
}

export class MineImposerGame {
  private sessions: Map<WebSocket, SessionMeta> = new Map();
  private joinedPlayers: { id: string; name: string }[] = [];
  private game: Game | null = null;
  private turnStartTime: number = Date.now();

  constructor(
    private state?: any,
    private env?: any,
  ) {}

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    // @ts-ignore Cloudflare Workers runtime provides WebSocketPair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair) as [WebSocket, WebSocket];

    // @ts-ignore
    server.accept();
    this.handleSession(server);

    return new Response(null, {
      status: 101,
      // @ts-ignore
      webSocket: client,
    });
  }

  handleSession(ws: WebSocket) {
    const meta: SessionMeta = {};
    this.sessions.set(ws, meta);

    ws.addEventListener("message", (event: any) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : null;
        if (!data) return;

        switch (data.type) {
          case "join":
            this.handleJoin(ws, meta, data.playerId, data.playerName);
            break;
          case "open":
            this.handleOpen(meta, data.row, data.col);
            break;
          case "flag":
            this.handleFlag(meta, data.row, data.col);
            break;
          case "commit":
            this.handleCommit(ws, meta, data.actions);
            break;
        }
      } catch (err) {
        console.error("Error handling message:", err);
      }
    });

    ws.addEventListener("close", () => {
      this.sessions.delete(ws);
    });
  }

  private handleJoin(ws: WebSocket, meta: SessionMeta, playerId: string, playerName: string) {
    meta.playerId = playerId;
    meta.playerName = playerName;

    const existingIndex = this.joinedPlayers.findIndex((p) => p.id === playerId);
    if (existingIndex >= 0) {
      this.joinedPlayers[existingIndex] = { id: playerId, name: playerName };
    } else if (this.joinedPlayers.length < 2) {
      this.joinedPlayers.push({ id: playerId, name: playerName });
    }

    if (this.joinedPlayers.length === 2 && !this.game) {
      const [p1, p2] = this.joinedPlayers;
      this.game = new Game(p1.id, p1.name, p2.id, p2.name, 40);
      this.turnStartTime = Date.now();
      this.broadcastState();
    } else if (this.game) {
      // 既にゲーム開始済み
      this.sendStateToSession(ws, meta);
    } else {
      // 1人目: 待機状態
      const waitingState: PublicGameState = {
        board: Array.from({ length: 16 }, (_, r) =>
          Array.from({ length: 16 }, (_, c) => ({
            row: r,
            col: c,
            isOpen: false,
            isFlagged: false,
          })),
        ),
        players: [
          { id: playerId, name: playerName, score: 0, lives: 3 },
          { id: "pending", name: "Waiting...", score: 0, lives: 3 },
        ],
        currentTurnPlayerId: playerId,
        winnerId: null,
        status: "waiting",
        yourPlayerId: playerId,
      };

      ws.send(JSON.stringify({ type: "state", state: waitingState }));
    }
  }

  private handleOpen(meta: SessionMeta, row: number, col: number) {
    if (!this.game || !meta.playerId) return;
    this.game.openCell(meta.playerId, row, col);
    this.turnStartTime = Date.now();
    this.broadcastState();
  }

  private handleFlag(meta: SessionMeta, row: number, col: number) {
    if (!this.game || !meta.playerId) return;
    this.game.toggleFlag(meta.playerId, row, col);
    this.broadcastState();
  }

  private handleCommit(ws: WebSocket, meta: SessionMeta, actions: any[]) {
    if (!this.game || !meta.playerId) return;

    const result = this.game.applyCommit(
      {
        playerId: meta.playerId,
        actions: actions || [],
      },
      this.turnStartTime,
    );

    if (!result.success) {
      ws.send(
        JSON.stringify({
          type: "error",
          code: result.error,
          message: "Commit validation failed: " + result.error,
        }),
      );
      return;
    }

    this.turnStartTime = Date.now();
    this.broadcastState();
  }

  private broadcastState() {
    for (const [ws, meta] of this.sessions.entries()) {
      this.sendStateToSession(ws, meta);
    }
  }

  private sendStateToSession(ws: WebSocket, meta: SessionMeta) {
    if (!this.game || !meta.playerId) return;
    const publicState = this.game.getPublicState(meta.playerId);
    ws.send(JSON.stringify({ type: "state", state: publicState }));
  }

  // テスト用
  public getGame(): Game | null {
    return this.game;
  }
}
