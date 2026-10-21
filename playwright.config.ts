import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const systemChrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export default defineConfig({
  testDir: "test/browser",
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4175",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions:
          existsSync(systemChrome) && !process.env.CI
            ? { executablePath: systemChrome }
            : {},
      },
    },
  ],
  webServer: {
    command: "pnpm exec vite --config vite.browser.config.ts",
    url: "http://127.0.0.1:4175",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
