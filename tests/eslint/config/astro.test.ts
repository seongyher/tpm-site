import { describe, expect, test } from "bun:test";

import { createAstroConfigs } from "../../../eslint/config/astro";

describe("Astro ESLint config", () => {
  test("scopes static-view safety rules to Astro components", () => {
    const [config] = createAstroConfigs();

    expect(config?.files).toEqual([
      "apps/studio/src/**/*.astro",
      "src/**/*.astro",
    ]);
    expect(config?.rules?.["astro/no-set-html-directive"]).toBe("error");
    expect(config?.rules?.["no-console"]).toBe("error");
  });
});
