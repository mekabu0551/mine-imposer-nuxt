import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import HomeScreen from "./HomeScreen.vue";
import { useUser } from "../composables/useUser";

describe("HomeScreen.vue", () => {
  const { user, resetUser, updateUsername } = useUser();

  beforeEach(() => {
    resetUser();
  });
  it("renders user information correctly", () => {
    const wrapper = mount(HomeScreen);
    expect(wrapper.text()).toMatch(/Guest_\d+/);
    expect(wrapper.text()).toContain("1500");
  });

  it("allows username editing", async () => {
    const wrapper = mount(HomeScreen);

    // 最初は編集モードではない
    expect(wrapper.find("input").exists()).toBe(false);

    // 編集ボタンをクリック
    const editBtn = wrapper.find('[data-testid="edit-username-btn"]');
    await editBtn.trigger("click");

    // 入力欄が表示される
    const input = wrapper.find("input");
    expect(input.exists()).toBe(true);

    // 新しいユーザー名を入力して保存
    await input.setValue("NewPlayer");
    const saveBtn = wrapper.find('[data-testid="save-username-btn"]');
    await saveBtn.trigger("click");

    // user の値が更新されたことを検証
    expect(user.value.username).toBe("NewPlayer");
  });

  it("emits match selection events", async () => {
    const wrapper = mount(HomeScreen);

    const randomMatchBtn = wrapper.find('[data-testid="random-match-btn"]');
    await randomMatchBtn.trigger("click");
    expect(wrapper.emitted("select-mode")).toBeTruthy();
    expect(wrapper.emitted("select-mode")?.[0]).toEqual(["random"]);

    const privateMatchBtn = wrapper.find('[data-testid="private-match-btn"]');
    await privateMatchBtn.trigger("click");
    expect(wrapper.emitted("select-mode")?.[1]).toEqual(["private"]);
  });
});
