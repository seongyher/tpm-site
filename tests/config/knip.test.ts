import { describe, expect, test } from "bun:test";

import config from "../../knip";

describe("Knip config", () => {
  test("tracks app, tooling, scripts, and tests as project entrypoints", () => {
    expect(config.entry).toContain("astro.config.ts");
    expect(config.entry).toContain("apps/studio/astro.config.mjs");
    expect(config.entry).toContain("apps/studio/src/**/*.{astro,ts}");
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
    expect(config.ignoreBinaries).toContain("just");
    expect(config.ignoreDependencies).toContain("@astrojs/check");
    expect(config.ignoreDependencies).toContain("@tauri-apps/cli");
    expect(config.ignoreDependencies).toContain("@lhci/cli");
    expect(config.ignoreDependencies).toContain("html-validate");
    expect(config.ignoreDependencies).toContain("pagefind");
    expect(config.ignoreDependencies).toContain("wrangler");
  });
});
