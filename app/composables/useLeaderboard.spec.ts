import { beforeEach, describe, expect, it } from "vitest";
import { useLeaderboard } from "./useLeaderboard";

describe("useLeaderboard composable", () => {
  const { leaderboard, loading, error, fetchLeaderboard, resetLeaderboard } = useLeaderboard();

  beforeEach(() => {
    resetLeaderboard();
  });

  it("should initialize with empty leaderboard and not loading", () => {
    expect(leaderboard.value).toEqual([]);
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("should successfully fetch leaderboard data from API", async () => {
    const mockLeaderboardData = [
      {
        rank: 1,
        id: "p-1",
        username: "ApexChampion",
        rating: 1980,
        highestRating: 2020,
        wins: 50,
        losses: 5,
        winRate: 91,
      },
      {
        rank: 2,
        id: "p-2",
        username: "ShadowOperative",
        rating: 1820,
        highestRating: 1850,
        wins: 30,
        losses: 12,
        winRate: 71,
      },
    ];

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ success: true, leaderboard: mockLeaderboardData }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    try {
      await fetchLeaderboard("http://localhost:8787", 20);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(leaderboard.value).toHaveLength(2);
      expect(leaderboard.value[0].username).toBe("ApexChampion");
      expect(leaderboard.value[0].rank).toBe(1);
      expect(leaderboard.value[1].username).toBe("ShadowOperative");
      expect(leaderboard.value[1].rank).toBe(2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should handle error when fetch fails", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("Network connection lost");
    };

    try {
      await fetchLeaderboard("http://localhost:8787");
      expect(loading.value).toBe(false);
      expect(error.value).toBe("Network connection lost");
      expect(leaderboard.value).toEqual([]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
