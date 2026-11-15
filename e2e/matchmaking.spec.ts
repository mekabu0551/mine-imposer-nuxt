import { test, expect } from "@playwright/test";

test.describe("Matchmaking Protocol Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should navigate to random match waiting protocol and return", async ({ page }) => {
    // ランダムマッチを選択
    await page.getByTestId("random-match-btn").click();

    // 待機画面のプロトコルヘッダーとルームIDを確認
    await expect(page.getByText("[ MATCH PROTOCOL: RANDOM ]")).toBeVisible();
    await expect(page.getByText("ROOM: room-casual-1")).toBeVisible();

    // ターミナルへ戻るボタンをクリック
    const returnBtn = page.getByTestId("return-home-btn");
    await expect(returnBtn).toBeVisible();
    await returnBtn.click();

    // ホーム画面に戻ることを確認
    await expect(page.locator("h1")).toHaveText("Mine Imposer");
    await expect(page.getByTestId("random-match-btn")).toBeVisible();
  });

  test("should navigate to private match waiting protocol and return", async ({ page }) => {
    // プライベートマッチを選択
    await page.getByTestId("private-match-btn").click();

    // 待機画面のプロトコルヘッダーとルームIDを確認
    await expect(page.getByText("[ MATCH PROTOCOL: PRIVATE ]")).toBeVisible();
    await expect(page.getByText("ROOM: room-private-alpha")).toBeVisible();

    // ターミナルへ戻るボタンをクリック
    const returnBtn = page.getByTestId("return-home-btn");
    await expect(returnBtn).toBeVisible();
    await returnBtn.click();

    // ホーム画面に戻ることを確認
    await expect(page.locator("h1")).toHaveText("Mine Imposer");
    await expect(page.getByTestId("private-match-btn")).toBeVisible();
  });
});
