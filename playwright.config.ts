import { defineConfig, devices } from "@playwright/test";

const configuredPort = process.env["PLAYWRIGHT_TEST_PORT"];
const port = configuredPort === undefined ? 4322 : Number(configuredPort);

if (
  (configuredPort !== undefined && !/^\d+$/u.test(configuredPort)) ||
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65_535
) {
  throw new Error("PLAYWRIGHT_TEST_PORT must be an integer from 1 to 65535.");
}

const baseURL = `http://127.0.0.1:${port}`;

if (process.env["NO_COLOR"] !== undefined) {
  delete process.env["NO_COLOR"];
}

export default defineConfig({
  expect: {
    timeout: 5_000,
  },
  forbidOnly: true,
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  reporter: process.env["CI"] === "true" ? "github" : "line",
  testDir: "./tests",
  testMatch: "**/*.pw.ts",
  timeout: 30_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `bun run preview --ignore-lock --host 127.0.0.1 --port ${port}`,
    // Playwright must own the process even when Astro detects an AI agent.
    env: { ASTRO_PREVIEW_BACKGROUND: "0" },
    reuseExistingServer: false,
    timeout: 15_000,
    url: baseURL,
  },
});
