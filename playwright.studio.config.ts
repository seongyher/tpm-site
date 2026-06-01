import { defineConfig, devices } from "@playwright/test";

const port = 4338;

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
  testMatch: "**/*.studio-pw.ts",
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `just studio-preview-fresh --host 127.0.0.1 --port ${port}`,
    reuseExistingServer: process.env["CI"] !== "true",
    timeout: 20_000,
    url: `http://127.0.0.1:${port}`,
  },
});
