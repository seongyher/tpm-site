import { describe, expect, test } from "bun:test";

import config from "../../playwright.config";
import studioConfig from "../../playwright.studio.config";

describe("Playwright config", () => {
  test("uses a built static preview server for browser tests", () => {
    expect(config.forbidOnly).toBe(true);
    expect(config.fullyParallel).toBe(true);
    expect(config.testMatch).toBe("**/*.pw.ts");
    expect(config.webServer).toMatchObject({
      command: "just preview --host 127.0.0.1 --port 4322",
      url: "http://127.0.0.1:4322",
    });
    expect(config.use?.baseURL).toBe("http://127.0.0.1:4322");
  });

  test("uses a dedicated built Studio preview server for Studio browser tests", () => {
    expect(studioConfig.forbidOnly).toBe(true);
    expect(studioConfig.fullyParallel).toBe(true);
    expect(studioConfig.testMatch).toBe("**/*.studio-pw.ts");
    expect(config.testMatch).toBe("**/*.pw.ts");
    expect(studioConfig.webServer).toMatchObject({
      command: "just studio-preview-fresh --host 127.0.0.1 --port 4338",
      url: "http://127.0.0.1:4338",
    });
    expect(studioConfig.use?.baseURL).toBe("http://127.0.0.1:4338");
  });
});
