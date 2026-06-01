import { describe, expect, test } from "bun:test";

import studioConfig from "../playwright.studio.config";

describe("Studio Playwright root config", () => {
  test("uses the dedicated fixture-backed Studio preview target", () => {
    expect(studioConfig.forbidOnly).toBe(true);
    expect(studioConfig.fullyParallel).toBe(true);
    expect(studioConfig.testDir).toBe("./tests");
    expect(studioConfig.testMatch).toBe("**/*.studio-pw.ts");
    expect(studioConfig.timeout).toBe(30_000);
    expect(studioConfig.webServer).toMatchObject({
      command: "just studio-preview-fresh --host 127.0.0.1 --port 4338",
      url: "http://127.0.0.1:4338",
    });
    expect(studioConfig.use?.baseURL).toBe("http://127.0.0.1:4338");
  });
});
