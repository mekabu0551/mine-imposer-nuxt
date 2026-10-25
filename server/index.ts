import type { DurableObjectNamespace } from "@cloudflare/workers-types";
import { MineImposerGame } from "./gameServer";

export { MineImposerGame };

export interface Env {
  GAME_SERVER: DurableObjectNamespace;
}

export async function fetchHandler(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // ルームIDに基づいた Durable Object への WebSocket プロキシ
  // パス例: /api/room/:roomId/ws または /ws?roomId=...
  const roomIdMatch = url.pathname.match(/\/api\/room\/([^/]+)\/ws/);
  const roomId = roomIdMatch ? roomIdMatch[1] : url.searchParams.get("roomId");

  if (roomId) {
    const id = env.GAME_SERVER.idFromName(roomId);
    const stub = env.GAME_SERVER.get(id);
    return stub.fetch(request as any) as any;
  }

  if (url.pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Not Found", { status: 404 });
}

class GameWorker {
  fetch(request: Request, env: Env): Promise<Response> {
    return fetchHandler(request, env);
  }
}

export default new GameWorker();
