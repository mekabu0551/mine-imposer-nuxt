import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import os from "node:os";

const extraLibPath = path.join(os.homedir(), ".local/lib");
const ldLibraryPath = process.env.LD_LIBRARY_PATH
  ? `${extraLibPath}:${process.env.LD_LIBRARY_PATH}`
  : extraLibPath;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    launchOptions: {
      env: {
        ...process.env,
        LD_LIBRARY_PATH: ldLibraryPath,
      },
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
});
