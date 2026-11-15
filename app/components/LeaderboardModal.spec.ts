import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import LeaderboardModal from "./LeaderboardModal.vue";
import type { LeaderboardEntry } from "../composables/useLeaderboard";

describe("LeaderboardModal component", () => {
  const mockEntries: LeaderboardEntry[] = [
    {
      rank: 1,
      id: "user-alpha",
      username: "AlphaCommander",
      rating: 1950,
      highestRating: 2000,
      wins: 40,
      losses: 5,
      winRate: 89,
    },
    {
      rank: 2,
      id: "user-beta",
      username: "TacticalVanguard",
      rating: 1800,
      highestRating: 1820,
      wins: 25,
      losses: 10,
      winRate: 71,
    },
    {
      rank: 3,
      id: "user-me",
      username: "CurrentUser",
      rating: 1650,
      highestRating: 1700,
      wins: 15,
      losses: 10,
      winRate: 60,
    },
  ];

  it("should display ranking entries with rank, username, rating, and win rate", () => {
    const wrapper = mount(LeaderboardModal, {
      props: {
        leaderboard: mockEntries,
        loading: false,
        error: null,
        currentUserId: "user-me",
      },
    });

    expect(wrapper.text()).toContain("AlphaCommander");
    expect(wrapper.text()).toContain("1950");
    expect(wrapper.text()).toContain("89%");

    expect(wrapper.text()).toContain("TacticalVanguard");
    expect(wrapper.text()).toContain("1800");

    expect(wrapper.text()).toContain("CurrentUser");
    expect(wrapper.text()).toContain("1650");

    const rows = wrapper.findAll(".leaderboard-row");
    expect(rows).toHaveLength(3);
  });

  it("should highlight the row corresponding to currentUserId", () => {
    const wrapper = mount(LeaderboardModal, {
      props: {
        leaderboard: mockEntries,
        loading: false,
        error: null,
        currentUserId: "user-me",
      },
    });

    const myRow = wrapper.find("[data-testid='leaderboard-row-user-me']");
    expect(myRow.exists()).toBe(true);
    // 自身の行にはハイライト用クラスまたはマークが存在する
    expect(myRow.classes()).toContain("highlight-current-user");
  });

  it("should display loading indicator when loading is true", () => {
    const wrapper = mount(LeaderboardModal, {
      props: {
        leaderboard: [],
        loading: true,
        error: null,
      },
    });

    expect(wrapper.find("[data-testid='leaderboard-loading']").exists()).toBe(true);
  });

  it("should display error message when error is provided", () => {
    const wrapper = mount(LeaderboardModal, {
      props: {
        leaderboard: [],
        loading: false,
        error: "Failed to connect to satellite network",
      },
    });

    expect(wrapper.find("[data-testid='leaderboard-error']").exists()).toBe(true);
    expect(wrapper.text()).toContain("Failed to connect to satellite network");
  });

  it("should emit close when close button is clicked", async () => {
    const wrapper = mount(LeaderboardModal, {
      props: {
        leaderboard: mockEntries,
        loading: false,
        error: null,
      },
    });

    await wrapper.find("[data-testid='close-leaderboard-btn']").trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("should emit refresh when refresh button is clicked", async () => {
    const wrapper = mount(LeaderboardModal, {
      props: {
        leaderboard: mockEntries,
        loading: false,
        error: null,
      },
    });

    await wrapper.find("[data-testid='refresh-leaderboard-btn']").trigger("click");
    expect(wrapper.emitted("refresh")).toBeTruthy();
  });
});
