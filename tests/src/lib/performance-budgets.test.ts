import { describe, expect, test } from "bun:test";

import {
  evaluateByteBudget,
  immutableAstroAssetCachePolicy,
  pdfPayloadBudget,
  routeClassHtmlOutputPath,
  routeClassPerformanceBudgets,
} from "../../../src/lib/performance-budgets";

describe("performance budget policy", () => {
  test("keeps route-class identifiers and representative routes unique", () => {
    const ids = routeClassPerformanceBudgets.map((budget) => budget.id);
    const routes = routeClassPerformanceBudgets.flatMap((budget) =>
      Array.from(budget.routes),
    );

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes.every((route) => route.startsWith("/"))).toBe(true);
  });

  test("maps public routes to generated HTML output paths", () => {
    expect(routeClassHtmlOutputPath("/")).toBe("index.html");
    expect(routeClassHtmlOutputPath("/articles/")).toBe("articles/index.html");
    expect(routeClassHtmlOutputPath("/articles/what-is-a-meme/")).toBe(
      "articles/what-is-a-meme/index.html",
    );
    expect(routeClassHtmlOutputPath("/feed.xml")).toBe("feed.xml");
  });

  test("evaluates deterministic byte budget states", () => {
    const budget = { failureBytes: 20, warningBytes: 10 };

    expect(
      evaluateByteBudget("HTML Brotli bytes", undefined, budget),
    ).toMatchObject({ status: "missing" });
    expect(evaluateByteBudget("HTML Brotli bytes", 10, budget)).toMatchObject({
      status: "pass",
    });
    expect(evaluateByteBudget("HTML Brotli bytes", 11, budget)).toMatchObject({
      status: "warn",
    });
    expect(evaluateByteBudget("HTML Brotli bytes", 21, budget)).toMatchObject({
      status: "fail",
    });
  });

  test("documents generated artifact budgets needed by payload tooling", () => {
    expect(pdfPayloadBudget.targetBytes).toBeLessThan(
      pdfPayloadBudget.warningBytes,
    );
    expect(pdfPayloadBudget.warningBytes).toBeLessThan(
      pdfPayloadBudget.failureBytes,
    );
    expect(immutableAstroAssetCachePolicy).toEqual({
      expectedHeader: "Cache-Control: public, max-age=31556952, immutable",
      pathPattern: "/_astro/*",
    });
  });
});
