import type { D1Database, DurableObjectNamespace } from "@cloudflare/workers-types";
import { getLeaderboard, getUserMatchHistory, getUserStats } from "./db/matchRepository";
import { MineImposerGame } from "./gameServer";

export { MineImposerGame };

export interface Env {
  GAME_SERVER: DurableObjectNamespace;
  DB?: D1Database;
}

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function fetchHandler(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

  // ユーザー戦績・レート・対戦履歴取得 API
  // パス例: /api/users/:userId/stats
  const userStatsMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/stats$/);
  if (userStatsMatch) {
    const userId = userStatsMatch[1];
    let userRecord = null;
    let recentMatches: any[] = [];

    if (env.DB) {
      userRecord = await getUserStats(env.DB as any, userId);
      recentMatches = await getUserMatchHistory(env.DB as any, userId, 10);
    }

    const wins = userRecord?.wins ?? 0;
    const losses = userRecord?.losses ?? 0;
    const totalMatches = wins + losses;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          username: userRecord?.username ?? `Guest_${userId.substring(0, 4)}`,
          rating: userRecord?.rating ?? 1500,
          highest_rating: userRecord?.highest_rating ?? 1500,
          wins,
          losses,
          winRate,
        },
        recentMatches,
      }),
      { headers: corsHeaders },
    );
  }

  // グローバルリーダーボード取得 API
  // パス例: /api/leaderboard?limit=50
  if (url.pathname === "/api/leaderboard") {
    let leaderboard: any[] = [];
    if (env.DB) {
      const limitParam = parseInt(url.searchParams.get("limit") || "50", 10);
      const limit = isNaN(limitParam) ? 50 : Math.min(Math.max(limitParam, 1), 100);
      leaderboard = await getLeaderboard(env.DB as any, limit);
    }

    return new Response(
      JSON.stringify({
        success: true,
        leaderboard,
      }),
      { headers: corsHeaders },
    );
  }

  if (url.pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: corsHeaders,
    });
  }

  return new Response("Not Found", { status: 404, headers: corsHeaders });
}

class GameWorker {
  fetch(request: Request, env: Env): Promise<Response> {
    return fetchHandler(request, env);
  }
}

export default new GameWorker();
