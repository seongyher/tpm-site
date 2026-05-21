import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

import { routeClassPerformanceBudgets } from "../../src/lib/performance-budgets";

interface LighthouseConfig {
  ci: {
    collect: {
      url: string[];
    };
  };
}

function isLighthouseConfig(value: unknown): value is LighthouseConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "ci" in value &&
    typeof value.ci === "object" &&
    value.ci !== null &&
    "collect" in value.ci &&
    typeof value.ci.collect === "object" &&
    value.ci.collect !== null &&
    "url" in value.ci.collect &&
    Array.isArray(value.ci.collect.url) &&
    value.ci.collect.url.every((route) => typeof route === "string")
  );
}

async function readLighthouseConfig(): Promise<LighthouseConfig> {
  const parsed: unknown = JSON.parse(
    await readFile("lighthouserc.json", "utf8"),
  );

  if (!isLighthouseConfig(parsed)) {
    throw new TypeError("lighthouserc.json has an unexpected shape.");
  }

  return parsed;
}

describe("Lighthouse route-class coverage", () => {
  test("samples every route class that is meant to be measured in Lighthouse", async () => {
    const config = await readLighthouseConfig();
    const sampledRoutes = new Set(config.ci.collect.url);

    for (const budget of routeClassPerformanceBudgets) {
      if (!budget.lighthouseRepresentative) {
        continue;
      }

      expect(
        budget.routes.some((route) => sampledRoutes.has(route)),
        `${budget.label} should have at least one Lighthouse sample route.`,
      ).toBe(true);
    }
  });
});
