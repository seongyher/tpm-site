import { describe, expect, test } from "bun:test";

import {
  createOutputDiagnostic,
  outputDiagnosticIdentity,
} from "../../../src/platform/diagnostics";
import {
  anchoredPresetConfig,
  computeAnchoredPosition,
  emptyAnchorRect,
  interactionPolicyScriptPaths,
} from "../../../src/platform/interactions";
import {
  classifyEmbedMediaSource,
  mediaAccessibilityPolicy,
} from "../../../src/platform/media";
import {
  normalizedCitationSource,
  parseBibtexEntries,
} from "../../../src/platform/references";
import { routeOutputPath } from "../../../src/platform/routes";

describe("internal platform entrypoints", () => {
  test("expose diagnostics through the platform seam", () => {
    const diagnostic = createOutputDiagnostic({
      category: "route",
      code: "route.required-output-missing",
      location: { outputPath: "articles/example/index.html" },
      message: "Missing article output.",
      moduleId: "routes",
      severity: "error",
    });

    expect(outputDiagnosticIdentity(diagnostic)).toBe(
      "error|route.required-output-missing|articles/example/index.html",
    );
  });

  test("expose route helpers without requiring route-file imports", () => {
    expect(routeOutputPath("/articles/example/")).toBe("articles/example");
  });

  test("expose media policy helpers as site-neutral domain functions", () => {
    expect(
      mediaAccessibilityPolicy({
        alt: "  A diagram of a meme taxonomy.  ",
        role: "article-image",
        surface: "article-html",
      }),
    ).toEqual({
      diagnostics: [],
      policy: {
        alt: "A diagram of a meme taxonomy.",
        kind: "descriptive",
      },
    });
    expect(
      classifyEmbedMediaSource("https://www.youtube.com/embed/example"),
    ).toEqual({
      layout: "video",
      provider: "youtube",
    });
  });

  test("expose citation parsing and source normalization", () => {
    const result = parseBibtexEntries(`
      @article{hull-1978,
        title = {A Matter of Individuality},
        author = {Hull, David L.},
        journal = {Philosophy of Science},
        year = {1978},
        doi = {10.1086/288811}
      }
    `);

    expect(result.ok).toBe(true);

    if (result.ok) {
      const [entry] = result.entries;

      expect(entry).toBeDefined();
      if (entry === undefined) {
        return;
      }

      expect(normalizedCitationSource(entry).identity).toEqual({
        confidence: "exact",
        key: "doi:10.1086/288811",
      });
    }
  });

  test("expose interaction primitives without browser runtime setup", () => {
    const preset = anchoredPresetConfig("article-action-menu");
    const result = computeAnchoredPosition({
      blockAnchorRect: { height: 32, width: 80, x: 500, y: 100 },
      boundaryRect: { height: 600, width: 800, x: 0, y: 0 },
      fallback: preset.fallback,
      floatingSize: { height: 160, width: 240 },
      inlineAnchorRect: { height: 32, width: 80, x: 500, y: 100 },
      offset: preset.offset,
      placement: preset.placement,
      safeGutter: preset.safeGutter,
    });

    expect(result.placement).toBe("bottom-end");
    expect(result.detached).toBe(false);
    expect(emptyAnchorRect()).toEqual({ height: 0, width: 0, x: 0, y: 0 });
    expect(interactionPolicyScriptPaths()).toContain(
      "src/scripts/anchored-positioning.ts",
    );
  });
});
