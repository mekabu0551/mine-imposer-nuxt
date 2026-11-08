import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ProfileModal from "./ProfileModal.vue";
import type { UserState } from "../composables/useUser";

describe("ProfileModal component", () => {
  const mockUser: UserState = {
    id: "user_alpha_7",
    username: "CommanderViper",
    rating: 1650,
    highest_rating: 1720,
    wins: 18,
    losses: 7,
    winRate: 72,
    recentMatches: [
      {
        matchId: "m_1",
        winnerId: "user_alpha_7",
        isRanked: true,
        endReason: "death",
        createdAt: "2026-11-08 14:00:00",
        userScore: 22,
        opponentId: "user_beta_9",
        opponentName: "ShadowWolf",
        opponentScore: 11,
        ratingDiff: 16,
        result: "win",
      },
      {
        matchId: "m_2",
        winnerId: "user_gamma_3",
        isRanked: true,
        endReason: "timeout",
        createdAt: "2026-11-07 19:20:00",
        userScore: 5,
        opponentId: "user_gamma_3",
        opponentName: "Ghost",
        opponentScore: 14,
        ratingDiff: -15,
        result: "lose",
      },
    ],
  };

  it("should display user profile summary including rating, peak rating, and win rate", () => {
    const wrapper = mount(ProfileModal, {
      props: {
        user: mockUser,
      },
    });

    expect(wrapper.text()).toContain("CommanderViper");
    expect(wrapper.text()).toContain("1650");
    expect(wrapper.text()).toContain("1720");
    expect(wrapper.text()).toContain("18"); // Wins
    expect(wrapper.text()).toContain("7"); // Losses
    expect(wrapper.text()).toContain("72%"); // Win rate
  });

  it("should display recent matches list with opponent, score, and rating diff", () => {
    const wrapper = mount(ProfileModal, {
      props: {
        user: mockUser,
      },
    });

    const matchItems = wrapper.findAll("[data-testid='match-history-item']");
    expect(matchItems).toHaveLength(2);

    expect(matchItems[0].text()).toContain("ShadowWolf");
    expect(matchItems[0].text()).toContain("WIN");
    expect(matchItems[0].text()).toContain("+16");

    expect(matchItems[1].text()).toContain("Ghost");
    expect(matchItems[1].text()).toContain("LOSE");
    expect(matchItems[1].text()).toContain("-15");
  });

  it("should emit close event when close button is clicked", async () => {
    const wrapper = mount(ProfileModal, {
      props: {
        user: mockUser,
      },
    });

    await wrapper.find("[data-testid='close-profile-btn']").trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();
  });
});
