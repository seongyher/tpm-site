import { describe, expect, test } from "bun:test";

import config from "../../knip";

describe("Knip config", () => {
  test("tracks app, tooling, scripts, and tests as project entrypoints", () => {
    expect(config.entry).toContain("astro.config.ts");
    expect(config.entry).toContain("eslint/**/*.ts");
    expect(config.entry).toContain("scripts/**/*.ts");
    expect(config.entry).toContain("tests/**/*.ts");
  });

  test("ignores generated output and known external binaries", () => {
    expect(config.ignore).toContain("dist/**");
    expect(config.ignore).toContain("dist-catalog/**");
    expect(config.ignore).toContain(".unlighthouse/**");
    expect(config.ignore).toContain(".wrangler/**");
    expect(config.ignore).toContain("coverage/**");
    expect(config.ignoreBinaries).toContain("gitleaks");
    expect(config.ignoreDependencies).toContain("html-validate");
    expect(config.ignoreDependencies).toContain("pagefind");
  });
});
