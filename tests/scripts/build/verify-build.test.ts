import { describe, expect, test } from "bun:test";

import {
  formatBuildVerificationReport,
  isExternal,
  linkTargets,
  requiredPathsForSource,
} from "../../../scripts/build/verify-build";

describe("build verifier", () => {
  test("derives required built paths from source publication state", () => {
    expect(
      requiredPathsForSource(
        {
          draftSlugs: [],
          publishedArticles: [
            {
              authors: [],
              isMdx: false,
              pdfEnabled: true,
              slug: "post",
              title: "Post",
            },
          ],
          publishedCategorySlugs: new Set(["history"]),
          publishedTagSegments: new Set(["meme history"]),
        },
        ["history"],
        ["site-news"],
      ),
    ).toContain("announcements/site-news/index.html");
    expect(
      requiredPathsForSource(
        {
          draftSlugs: [],
          publishedArticles: [
            {
              authors: [],
              isMdx: false,
              pdfEnabled: true,
              slug: "post",
              title: "Post",
            },
          ],
          publishedCategorySlugs: new Set(["history"]),
          publishedTagSegments: new Set(["meme history"]),
        },
        ["history"],
        [],
        ["featured"],
      ),
    ).toContain("collections/featured/index.html");
    expect(
      requiredPathsForSource(
        {
          draftSlugs: [],
          publishedArticles: [
            {
              authors: [],
              isMdx: false,
              pdfEnabled: true,
              slug: "post",
              title: "Post",
            },
          ],
          publishedCategorySlugs: new Set(["history"]),
          publishedTagSegments: new Set(["meme history"]),
        },
        ["history"],
      ),
    ).toContain("articles/post/index.html");
    expect(
      requiredPathsForSource(
        {
          draftSlugs: [],
          publishedArticles: [
            {
              authors: [],
              isMdx: false,
              pdfEnabled: true,
              slug: "post",
              title: "Post",
            },
          ],
          publishedCategorySlugs: new Set(["history"]),
          publishedTagSegments: new Set(["meme history"]),
        },
        ["history"],
      ),
    ).toContain("articles/post/post.pdf");
    expect(
      requiredPathsForSource(
        {
          draftSlugs: [],
          publishedArticles: [
            {
              authors: [],
              isMdx: false,
              pdfEnabled: false,
              slug: "web-only",
              title: "Web Only",
            },
          ],
          publishedCategorySlugs: new Set(["history"]),
          publishedTagSegments: new Set([]),
        },
        ["history"],
      ),
    ).not.toContain("articles/web-only/web-only.pdf");
  });

  test("extracts local link targets and ignores external URLs", () => {
    expect(linkTargets('<a href="/articles/post/">Post</a>')).toEqual([
      "/articles/post/",
    ]);
    expect(isExternal("https://example.com")).toBe(true);
    expect(isExternal("/articles/post/")).toBe(false);
    expect(
      formatBuildVerificationReport({
        articlePageCount: 1,
        astroClientScriptCount: 0,
        issues: {
          articlePdfIssues: [],
          articleCountIssues: [],
          brokenLinks: [],
          catalogLeaks: [],
          draftLeaks: [],
          invalidLegacyRedirects: [],
          imageAltIssues: [],
          metadataIssues: [],
          missingArticleJsonLd: [],
          missingLegacyRedirects: [],
          missingRequired: [],
          sourceMaps: [],
          socialImageIssues: [],
          unexpectedHydrationBoundaries: [],
          unexpectedClientScripts: [],
          unexpectedDatedPages: [],
        },
      }),
    ).toContain("Build verification passed");
  });
});
