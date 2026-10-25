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
});
