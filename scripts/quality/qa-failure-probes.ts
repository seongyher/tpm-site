/** How a failure probe keeps bad data isolated from production content. */
export type QaFailureFixtureStrategy =
  | "generated-output"
  | "static-fixture"
  | "temporary-fixture";

/** Metadata for one representative QA failure probe. */
export interface QaFailureProbe {
  bugClass: string;
  expectedSignal: string;
  fixturePaths: readonly string[];
  fixtureStrategy: QaFailureFixtureStrategy;
  id: string;
  intendedScripts: readonly string[];
  leakPrevention: string;
  testPaths: readonly string[];
}

export const qaFailureProbes = [
  {
    bugClass: "content",
    expectedSignal:
      "unsafe category names, duplicate slugs, unknown authors, or noncanonical tags",
    fixturePaths: [],
    fixtureStrategy: "temporary-fixture",
    id: "invalid-content-source",
    intendedScripts: ["verify:content", "tags:check"],
    leakPrevention: "temporary source trees under the OS temp directory",
    testPaths: [
      "tests/scripts/content/verify-content.test.ts",
      "tests/scripts/content/normalize-tags.test.ts",
    ],
  },
  {
    bugClass: "article-images",
    expectedSignal:
      "rendered remote article images are reported before publication",
    fixturePaths: [],
    fixtureStrategy: "temporary-fixture",
    id: "remote-rendered-article-image",
    intendedScripts: ["verify:content"],
    leakPrevention: "temporary source tree, no live article content",
    testPaths: ["tests/scripts/content/verify-content.test.ts"],
  },
  {
    bugClass: "assets",
    expectedSignal:
      "project-owned image outside approved asset roots is rejected",
    fixturePaths: [],
    fixtureStrategy: "temporary-fixture",
    id: "misplaced-image-asset",
    intendedScripts: ["assets:locations"],
    leakPrevention: "temporary repository root with disposable image bytes",
    testPaths: [
      "tests/scripts/assets/verify-image-asset-locations.test.ts",
      "tests/scripts/script-validators.test.ts",
    ],
  },
  {
    bugClass: "assets",
    expectedSignal:
      "asset referenced from multiple source files must move to shared assets",
    fixturePaths: [],
    fixtureStrategy: "temporary-fixture",
    id: "shared-asset-violation",
    intendedScripts: ["assets:shared"],
    leakPrevention:
      "temporary repository root with disposable source and image files",
    testPaths: ["tests/scripts/assets/find-shared-assets.test.ts"],
  },
  {
    bugClass: "redirects",
    expectedSignal:
      "malformed legacy redirects are reported before deploy metadata ships",
    fixturePaths: [],
    fixtureStrategy: "temporary-fixture",
    id: "malformed-legacy-redirect",
    intendedScripts: ["build:cloudflare", "verify"],
    leakPrevention: "temporary content and output directories",
    testPaths: [
      "tests/scripts/build/generate-cloudflare-redirects.test.ts",
      "tests/scripts/build/build-verifier.test.ts",
    ],
  },
  {
    bugClass: "generated-output",
    expectedSignal:
      "broken local links and missing required pages fail build verification",
    fixturePaths: [],
    fixtureStrategy: "generated-output",
    id: "broken-generated-output-link",
    intendedScripts: ["verify"],
    leakPrevention: "temporary dist shell, not the real production output",
    testPaths: [
      "tests/scripts/build/build-verifier.test.ts",
      "tests/scripts/build/verify-build.test.ts",
    ],
  },
  {
    bugClass: "metadata",
    expectedSignal:
      "missing or malformed JSON-LD/social metadata fails verification",
    fixturePaths: [],
    fixtureStrategy: "generated-output",
    id: "invalid-generated-metadata",
    intendedScripts: ["verify"],
    leakPrevention: "temporary dist shell, not the real production output",
    testPaths: ["tests/scripts/build/build-verifier.test.ts"],
  },
  {
    bugClass: "html",
    expectedSignal: "invalid representative HTML fails validation",
    fixturePaths: [],
    fixtureStrategy: "generated-output",
    id: "invalid-html-output",
    intendedScripts: ["validate:html"],
    leakPrevention: "temporary dist shell and explicit validator options",
    testPaths: ["tests/scripts/build/validate-html.test.ts"],
  },
  {
    bugClass: "performance",
    expectedSignal:
      "deterministic route-class payload, PDF, or cache-header budget failures block release",
    fixturePaths: [],
    fixtureStrategy: "generated-output",
    id: "payload-budget-regression",
    intendedScripts: ["payload:check"],
    leakPrevention: "temporary dist shell, not the real production output",
    testPaths: ["tests/scripts/payload/report-payload.test.ts"],
  },
  {
    bugClass: "citations",
    expectedSignal:
      "malformed or repeated article-reference labels fail before publication",
    fixturePaths: [
      "tests/fixtures/article-references-invalid/repeated-note.md",
    ],
    fixtureStrategy: "static-fixture",
    id: "malformed-article-reference",
    intendedScripts: ["test:unit", "test:astro"],
    leakPrevention: "static fixture collection outside site content roots",
    testPaths: [
      "tests/src/remark-plugins/articleReferences.test.ts",
      "tests/src/remark-plugins/articleReferencesProof.vitest.ts",
    ],
  },
  {
    bugClass: "site-config",
    expectedSignal:
      "invalid site configuration is rejected by schema and relationship checks",
    fixturePaths: [],
    fixtureStrategy: "temporary-fixture",
    id: "invalid-site-config",
    intendedScripts: ["site:doctor", "site:schema:check", "test:unit"],
    leakPrevention: "inline config objects or temporary site roots",
    testPaths: [
      "tests/src/lib/site/site-config.test.ts",
      "tests/scripts/site/site-doctor.test.ts",
    ],
  },
  {
    bugClass: "layout",
    expectedSignal:
      "hostile long-content fixtures remain contained in reusable components",
    fixturePaths: ["src/catalog/examples/hostile-fixtures.ts"],
    fixtureStrategy: "static-fixture",
    id: "hostile-responsive-layout",
    intendedScripts: ["test:catalog", "test:e2e:built"],
    leakPrevention: "private component catalog fixture, not production content",
    testPaths: [
      "tests/src/catalog/examples/hostile-fixtures.test.ts",
      "tests/e2e/catalog-invariants.pw.ts",
    ],
  },
] as const satisfies readonly QaFailureProbe[];
