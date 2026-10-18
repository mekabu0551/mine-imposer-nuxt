import { ref, onScopeDispose } from "vue";
import type { PublicGameState, ActionLogItem } from "../../shared/game";

export interface GamePlayerInfo {
  id: string;
  name: string;
}

export function useGameSocket(roomId: string, player: GamePlayerInfo) {
  const gameState = ref<PublicGameState | null>(null);
  const isConnected = ref(false);
  const error = ref<string | null>(null);
  let socket: WebSocket | null = null;

  const connect = (serverUrl?: string) => {
    try {
      let baseUrl = serverUrl;
      if (!baseUrl && typeof window !== "undefined") {
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
          baseUrl = `ws://${window.location.hostname}:8787`;
        } else {
          const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          baseUrl = `${protocol}//${window.location.host}`;
        }
      }

      if (!baseUrl) {
        baseUrl = "ws://localhost:8787";
      }

      const wsUrl = `${baseUrl}/api/room/${roomId}/ws`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        isConnected.value = true;
        error.value = null;
        socket?.send(
          JSON.stringify({
            type: "join",
            playerId: player.id,
            playerName: player.name,
          }),
        );
      };

      socket.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "state") {
            gameState.value = data.state;
          } else if (data.type === "error") {
            error.value = `${data.code}: ${data.message}`;
          }
        } catch (e) {
          console.error("Failed to parse websocket message:", e);
        }
      };

      socket.onclose = () => {
        isConnected.value = false;
      };

      socket.onerror = (err) => {
        error.value = "Connection error";
        console.error("WebSocket error:", err);
      };
    } catch (e: any) {
      error.value = e.message;
    }
  };

  const openCell = (row: number, col: number) => {
    if (socket && isConnected.value) {
      socket.send(
        JSON.stringify({
          type: "open",
          row,
          col,
        }),
      );
    }
  };

  const toggleFlag = (row: number, col: number) => {
    if (socket && isConnected.value) {
      socket.send(
        JSON.stringify({
          type: "flag",
          row,
          col,
        }),
      );
    }
  };

  const commit = (actions: ActionLogItem[]) => {
    if (socket && isConnected.value) {
      socket.send(
        JSON.stringify({
          type: "commit",
          actions,
        }),
      );
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.close();
      socket = null;
      isConnected.value = false;
    }
  };

  onScopeDispose(() => {
    disconnect();
  });

  return {
    gameState,
    isConnected,
    error,
    connect,
    openCell,
    toggleFlag,
    commit,
    disconnect,
  };
}
