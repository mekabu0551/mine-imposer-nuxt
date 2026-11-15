import { describe, it, expect, vi } from "vitest";
import worker from "./index";

describe("Worker entry point", () => {
  it("should respond with ok for /health", async () => {
    const request = new Request("http://localhost/health");
    const response = await worker.fetch(request, {} as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });

  it("should route /api/room/:roomId/ws to Durable Object", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("DO response", { status: 200 }));
    const getMock = vi.fn().mockReturnValue({ fetch: fetchMock });
    const idFromNameMock = vi.fn().mockReturnValue("mock-id");

    const mockEnv = {
      GAME_SERVER: {
        idFromName: idFromNameMock,
        get: getMock,
      },
    };

    const request = new Request("http://localhost/api/room/test-room-123/ws", {
      headers: { Upgrade: "websocket" },
    });

    const response = await worker.fetch(request, mockEnv as any);
    expect(idFromNameMock).toHaveBeenCalledWith("test-room-123");
    expect(getMock).toHaveBeenCalledWith("mock-id");
    expect(fetchMock).toHaveBeenCalledWith(request);
    expect(response.status).toBe(200);
  });

  it("should return user stats and match history for GET /api/users/:userId/stats", async () => {
    const mockDb = {
      prepare: vi.fn((sql: string) => {
        let boundParams: any[] = [];
        const stmt = {
          bind: vi.fn((...params: any[]) => {
            boundParams = params;
            return stmt;
          }),
          first: vi.fn(async () => {
            if (sql.includes("FROM users WHERE id = ?")) {
              return {
                id: "user_test_1",
                username: "Commander",
                rating: 1650,
                highest_rating: 1700,
                wins: 10,
                losses: 5,
              };
            }
            return null;
          }),
          all: vi.fn(async () => {
            if (sql.includes("FROM match_participants")) {
              return {
                results: [
                  {
                    match_id: "m_1",
                    winner_id: "user_test_1",
                    is_ranked: 1,
                    end_reason: "death",
                    created_at: "2026-11-08 12:00:00",
                    user_score: 10,
                    user_rating_diff: 15,
                    opponent_id: "user_test_2",
                    opponent_name: "Enemy",
                    opponent_score: 5,
                  },
                ],
              };
            }
            return { results: [] };
          }),
          run: vi.fn(async () => ({ success: true })),
        };
        return stmt;
      }),
      batch: vi.fn(async () => []),
    };

    const mockEnv = {
      GAME_SERVER: {} as any,
      DB: mockDb,
    };

    const request = new Request("http://localhost/api/users/user_test_1/stats");
    const response = await worker.fetch(request, mockEnv as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user.id).toBe("user_test_1");
    expect(body.user.username).toBe("Commander");
    expect(body.user.rating).toBe(1650);
    expect(body.user.highest_rating).toBe(1700);
    expect(body.user.wins).toBe(10);
    expect(body.user.losses).toBe(5);
    expect(body.user.winRate).toBe(67); // 10 / 15 * 100 = 66.66% -> 67%
    expect(body.recentMatches).toHaveLength(1);
    expect(body.recentMatches[0].result).toBe("win");
    expect(body.recentMatches[0].opponentName).toBe("Enemy");
  });

  it("should return default stats when user is not found in D1 for GET /api/users/:userId/stats", async () => {
    const mockDb = {
      prepare: vi.fn(() => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => null),
        all: vi.fn(async () => ({ results: [] })),
        run: vi.fn(async () => ({ success: true })),
      })),
      batch: vi.fn(async () => []),
    };

    const mockEnv = {
      GAME_SERVER: {} as any,
      DB: mockDb,
    };

    const request = new Request("http://localhost/api/users/unknown_user/stats");
    const response = await worker.fetch(request, mockEnv as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user.id).toBe("unknown_user");
    expect(body.user.rating).toBe(1500);
    expect(body.user.wins).toBe(0);
    expect(body.user.losses).toBe(0);
    expect(body.user.winRate).toBe(0);
    expect(body.recentMatches).toHaveLength(0);
  });
});
