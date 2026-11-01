import { test, expect } from "@playwright/test";

test.describe("Home Screen (Operator Profile & Mode Selection)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should display terminal header and branding", async ({ page }) => {
    // タイトルとサブタイトルの表示確認
    await expect(page.locator("h1")).toHaveText("Mine Imposer");
    await expect(page.getByText("[ SYSTEM OPERATIONAL - BOMB DISPOSAL TERMINAL ]")).toBeVisible();
  });

  test("should display initial user profile and stats", async ({ page }) => {
    // Operator Profile セクションの確認
    await expect(page.getByRole("heading", { name: "Operator Profile" })).toBeVisible();

    // デフォルトの Identifier (Guest_XXXX) が表示されること
    const identifier = page
      .locator("section:has-text('Operator Profile')")
      .locator("span.text-2xl")
      .first();
    await expect(identifier).toBeVisible();
    await expect(identifier).toHaveText(/^Guest_\d+$/);

    // ELO Rating (初期値 1500) と Record (0W / 0L) の表示確認
    await expect(page.getByText("ELO Rating")).toBeVisible();
    await expect(page.getByText("1500")).toBeVisible();
    await expect(page.getByText("Record")).toBeVisible();
    await expect(page.getByText("0W")).toBeVisible();
    await expect(page.getByText("0L")).toBeVisible();
  });

  test("should allow editing and saving operator identifier", async ({ page }) => {
    // 編集ボタンをクリック
    const editBtn = page.getByTestId("edit-username-btn");
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // 入力欄が表示される
    const input = page.locator("section:has-text('Operator Profile') input");
    await expect(input).toBeVisible();

    // 新しいユーザー名を入力して保存
    await input.fill("CyberAgent99");
    const saveBtn = page.getByTestId("save-username-btn");
    await saveBtn.click();

    // 更新されたユーザー名が表示されること
    const updatedIdentifier = page
      .locator("section:has-text('Operator Profile')")
      .locator("span.text-2xl")
      .first();
    await expect(updatedIdentifier).toHaveText("CyberAgent99");
    await expect(editBtn).toBeVisible();
  });

  test("should display match protocol engagement options", async ({ page }) => {
    // Engagement Protocol セクションの確認
    await expect(page.getByRole("heading", { name: "Engagement Protocol" })).toBeVisible();

    // ランダムマッチとプライベートマッチのボタンが存在すること
    const randomMatchBtn = page.getByTestId("random-match-btn");
    const privateMatchBtn = page.getByTestId("private-match-btn");

    await expect(randomMatchBtn).toBeVisible();
    await expect(randomMatchBtn).toContainText("Random Match");

    await expect(privateMatchBtn).toBeVisible();
    await expect(privateMatchBtn).toContainText("Private Match");
  });
});
