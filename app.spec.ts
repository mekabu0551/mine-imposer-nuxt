import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import App from "./app/app.vue";

// WebSocket モック
vi.stubGlobal(
  "WebSocket",
  class {
    url: string;
    onopen: any = null;
    send = vi.fn();
    close = vi.fn();
    constructor(url: string) {
      this.url = url;
    }
  },
);

describe("App Root Component", () => {
  it("should show HomeScreen by default", () => {
    const wrapper = mount(App);
    expect(wrapper.find('[data-testid="random-match-btn"]').exists()).toBe(true);
  });

  it("should navigate to game view when random match is clicked", async () => {
    const wrapper = mount(App);
    const randomBtn = wrapper.find('[data-testid="random-match-btn"]');
    await randomBtn.trigger("click");

    expect(wrapper.text()).toContain("MATCH PROTOCOL");
    expect(wrapper.find('[data-testid="return-home-btn"]').exists()).toBe(true);
  });
});
