import { spawnSync } from "node:child_process";

import { describe, expect, test } from "bun:test";

function loadConfig(port?: string, ci = "false") {
  return spawnSync(
    process.execPath,
    [
      "--eval",
      'import config from "./playwright.config.ts"; console.log(JSON.stringify(config));',
    ],
    {
      encoding: "utf8",
      env: { ...process.env, CI: ci, PLAYWRIGHT_TEST_PORT: port },
    },
  );
}

describe("Playwright config", () => {
  test("uses a built static preview server for browser tests", () => {
    const result = loadConfig();
    expect(result.status).toBe(0);
    const config: unknown = JSON.parse(result.stdout);

    expect(config).toMatchObject({
      forbidOnly: true,
      fullyParallel: true,
      testMatch: "**/*.pw.ts",
      use: { baseURL: "http://127.0.0.1:4322" },
      webServer: {
        command: "bun run preview --ignore-lock --host 127.0.0.1 --port 4322",
        env: { ASTRO_PREVIEW_BACKGROUND: "0" },
        reuseExistingServer: false,
        url: "http://127.0.0.1:4322",
      },
    });
  });

  test.each(["1", "4397", "65535"])(
    "uses configured port %s for the browser and its preview server",
    (port) => {
      const result = loadConfig(port);
      expect(result.status).toBe(0);
      const config: unknown = JSON.parse(result.stdout);

      expect(config).toMatchObject({
        use: { baseURL: `http://127.0.0.1:${port}` },
        webServer: {
          command: `bun run preview --ignore-lock --host 127.0.0.1 --port ${port}`,
          url: `http://127.0.0.1:${port}`,
        },
      });
    },
  );

  test.each(["", "0", "65536", "4322.5", "invalid", "4e3"])(
    "rejects invalid configured port %j",
    (port) => {
      const result = loadConfig(port);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        "PLAYWRIGHT_TEST_PORT must be an integer from 1 to 65535.",
      );
    },
  );

  test.each(["false", "true"])(
    "requires its own preview server with CI=%s",
    (ci) => {
      const result = loadConfig(undefined, ci);
      expect(result.status).toBe(0);
      const config: unknown = JSON.parse(result.stdout);

      expect(config).toMatchObject({
        webServer: {
          env: { ASTRO_PREVIEW_BACKGROUND: "0" },
          reuseExistingServer: false,
        },
      });
    },
  );
});
