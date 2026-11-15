import { describe, it, expect, beforeEach } from "vitest";
import { useUser } from "./useUser";

describe("useUser composable", () => {
  const { user, updateUsername, recordMatchResult, resetUser } = useUser();

  beforeEach(() => {
    resetUser();
  });

  it("should initialize user state with default values", () => {
    const { user } = useUser();
    expect(user.value).toBeDefined();
    expect(user.value.id).toMatch(/^user_/);
    expect(user.value.username).toMatch(/^Guest_\d+/);
    expect(user.value.rating).toBe(1500);
    expect(user.value.wins).toBe(0);
    expect(user.value.losses).toBe(0);
  });

  it("should update username correctly", () => {
    const { user, updateUsername } = useUser();
    updateUsername("TestPlayer");
    expect(user.value.username).toBe("TestPlayer");
  });

  it("should update stats correctly on win", () => {
    const { user, recordMatchResult } = useUser();
    const initialRating = user.value.rating;
    recordMatchResult(true, 16); // win, rating diff +16
    expect(user.value.wins).toBe(1);
    expect(user.value.losses).toBe(0);
    expect(user.value.rating).toBe(initialRating + 16);
  });

  it("should update stats correctly on loss", () => {
    const { user, recordMatchResult } = useUser();
    const initialRating = user.value.rating;
    recordMatchResult(false, -12); // loss, rating diff -12
    expect(user.value.wins).toBe(0);
    expect(user.value.losses).toBe(1);
    expect(user.value.rating).toBe(initialRating - 12);
  });

  it("should fetch user statistics and match history from API", async () => {
    const { user, fetchStats } = useUser();

    // Mock global fetch
    const mockResponse = {
      success: true,
      user: {
        id: user.value.id,
        username: "AcePilot",
        rating: 1620,
        highest_rating: 1680,
        wins: 14,
        losses: 6,
        winRate: 70,
      },
      recentMatches: [
        {
          matchId: "m_100",
          winnerId: user.value.id,
          isRanked: true,
          endReason: "score",
          createdAt: "2026-11-08 14:00:00",
          userScore: 20,
          opponentId: "opp_1",
          opponentName: "Rival",
          opponentScore: 15,
          ratingDiff: 18,
          result: "win",
        },
      ],
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    try {
      await fetchStats("http://localhost:8787");
      expect(user.value.username).toBe("AcePilot");
      expect(user.value.rating).toBe(1620);
      expect(user.value.highest_rating).toBe(1680);
      expect(user.value.wins).toBe(14);
      expect(user.value.losses).toBe(6);
      expect(user.value.winRate).toBe(70);
      expect(user.value.recentMatches).toHaveLength(1);
      expect(user.value.recentMatches![0].result).toBe("win");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
