import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ResultScreen from "./ResultScreen.vue";
import type { PublicGameState } from "../../shared/game";

describe("ResultScreen component", () => {
  const baseGameState: PublicGameState = {
    board: [],
    players: [
      { id: "p1", name: "Alpha", score: 14, lives: 3 },
      { id: "p2", name: "Bravo", score: 8, lives: 0 },
    ],
    currentTurnPlayerId: "p1",
    winnerId: "p1",
    status: "finished",
    yourPlayerId: "p1",
    turnStartedAt: 0,
    turnDurationMs: 10000,
    endReason: "death",
    matchResult: {
      matchId: "m_1",
      winnerId: "p1",
      endReason: "death",
      isRanked: true,
      participants: [
        {
          userId: "p1",
          username: "Alpha",
          initialRating: 1500,
          finalScore: 14,
          ratingDiff: 16,
          newRating: 1516,
        },
        {
          userId: "p2",
          username: "Bravo",
          initialRating: 1500,
          finalScore: 8,
          ratingDiff: -16,
          newRating: 1484,
        },
      ],
    },
  };

  it("should display VICTORY banner and rating gain when you win", () => {
    const wrapper = mount(ResultScreen, {
      props: {
        gameState: baseGameState,
      },
    });

    expect(wrapper.text()).toContain("VICTORY");
    expect(wrapper.find("[data-testid='result-banner']").classes()).toContain("text-[#3FB950]");
    expect(wrapper.text()).toContain("+16");
    expect(wrapper.text()).toContain("1516");
    expect(wrapper.text()).toContain("14"); // Player score
    expect(wrapper.text()).toContain("8"); // Opponent score
  });

  it("should display DEFEAT banner and rating drop when you lose", () => {
    const defeatGameState: PublicGameState = {
      ...baseGameState,
      yourPlayerId: "p2",
    };

    const wrapper = mount(ResultScreen, {
      props: {
        gameState: defeatGameState,
      },
    });

    expect(wrapper.text()).toContain("DEFEAT");
    expect(wrapper.find("[data-testid='result-banner']").classes()).toContain("text-[#E74C3C]");
    expect(wrapper.text()).toContain("-16");
    expect(wrapper.text()).toContain("1484");
  });

  it("should display DRAW banner when match ends in a tie", () => {
    const drawGameState: PublicGameState = {
      ...baseGameState,
      winnerId: null,
      endReason: "score",
      matchResult: {
        ...baseGameState.matchResult,
        winnerId: null,
        endReason: "score",
        participants: [
          {
            userId: "p1",
            username: "Alpha",
            initialRating: 1500,
            finalScore: 10,
            ratingDiff: 0,
            newRating: 1500,
          },
          {
            userId: "p2",
            username: "Bravo",
            initialRating: 1500,
            finalScore: 10,
            ratingDiff: 0,
            newRating: 1500,
          },
        ],
      },
    };

    const wrapper = mount(ResultScreen, {
      props: {
        gameState: drawGameState,
      },
    });

    expect(wrapper.text()).toContain("DRAW");
    expect(wrapper.find("[data-testid='result-banner']").classes()).toContain("text-[#F1C40F]");
    expect(wrapper.text()).toContain("±0");
  });

  it("should emit rematch event when rematch button is clicked", async () => {
    const wrapper = mount(ResultScreen, {
      props: {
        gameState: baseGameState,
      },
    });

    await wrapper.find("[data-testid='rematch-btn']").trigger("click");
    expect(wrapper.emitted("rematch")).toBeTruthy();
  });

  it("should emit home event when return home button is clicked", async () => {
    const wrapper = mount(ResultScreen, {
      props: {
        gameState: baseGameState,
      },
    });

    await wrapper.find("[data-testid='result-home-btn']").trigger("click");
    expect(wrapper.emitted("home")).toBeTruthy();
  });
});
