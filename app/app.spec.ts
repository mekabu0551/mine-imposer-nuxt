import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import App from "./app.vue";

describe("App.vue integration", () => {
  it("renders HomeScreen by default", () => {
    const wrapper = mount(App);
    expect(wrapper.findComponent({ name: "HomeScreen" }).exists()).toBe(true);
  });

  it("opens LeaderboardModal when open-leaderboard event is emitted from HomeScreen", async () => {
    const wrapper = mount(App);
    expect(wrapper.findComponent({ name: "LeaderboardModal" }).exists()).toBe(false);

    const homeScreen = wrapper.findComponent({ name: "HomeScreen" });
    await homeScreen.vm.$emit("open-leaderboard");

    expect(wrapper.findComponent({ name: "LeaderboardModal" }).exists()).toBe(true);

    // Close button
    const leaderboardModal = wrapper.findComponent({ name: "LeaderboardModal" });
    await leaderboardModal.vm.$emit("close");

    expect(wrapper.findComponent({ name: "LeaderboardModal" }).exists()).toBe(false);
  });

  it("opens ProfileModal when open-profile event is emitted from HomeScreen", async () => {
    const wrapper = mount(App);
    expect(wrapper.findComponent({ name: "ProfileModal" }).exists()).toBe(false);

    const homeScreen = wrapper.findComponent({ name: "HomeScreen" });
    await homeScreen.vm.$emit("open-profile");

    expect(wrapper.findComponent({ name: "ProfileModal" }).exists()).toBe(true);

    const profileModal = wrapper.findComponent({ name: "ProfileModal" });
    await profileModal.vm.$emit("close");

    expect(wrapper.findComponent({ name: "ProfileModal" }).exists()).toBe(false);
  });
});
