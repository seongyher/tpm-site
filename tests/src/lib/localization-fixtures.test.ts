import { describe, expect, test } from "bun:test";

import { createLocalizationFixtureReport } from "../../../src/lib/localization-fixtures";
import { representativeLocalizationFixtures } from "../../fixtures/localization-fixtures";

describe("localization fixtures", () => {
  test("cover English, non-English, multilingual, RTL, and long-string states", () => {
    expect(
      representativeLocalizationFixtures.map((fixture) => fixture.id),
    ).toEqual([
      "single-english",
      "single-french",
      "multilingual-unprefixed-default",
      "rtl-arabic",
      "long-string-and-missing",
    ]);
  });

  test("creates metadata, feed, search, and PDF language snapshots", () => {
    const report = createLocalizationFixtureReport(
      representativeLocalizationFixtures,
    );

    expect(report.snapshots).toContainEqual({
      alternateLinks: ["/articles/entry/"],
      direction: "ltr",
      feedLanguage: "es-ES",
      htmlLang: "es-ES",
      jsonLdInLanguage: "es-ES",
      ogLocale: "es_ES",
      pdfLanguage: "es-ES",
      route: "/es/articulos/entrada/",
      searchLanguage: "es-ES",
    });
    expect(
      report.snapshots.some(
        (snapshot) =>
          snapshot.direction === "rtl" &&
          snapshot.htmlLang === "ar" &&
          snapshot.route === "/articles/arabic/",
      ),
    ).toBe(true);
  });

  test("diagnoses missing labels, missing translations, long strings, and RTL gaps", () => {
    const report = createLocalizationFixtureReport(
      representativeLocalizationFixtures,
    );

    expect(report.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "html.locale-rtl-unsupported-surface",
      "content.locale-missing-label",
      "content.locale-long-unbroken-string",
      "content.locale-missing-translation",
    ]);
    expect(
      report.diagnostics.some(
        (diagnostic) =>
          diagnostic.message ===
            "long-string-and-missing label article.action.cite is a long unbroken string." &&
          diagnostic.remediation ===
            "Verify components can wrap or truncate this label without overflow.",
      ),
    ).toBe(true);
    expect(
      report.diagnostics.some(
        (diagnostic) =>
          diagnostic.location?.route === "/articles/long-label/" &&
          diagnostic.message === "article-long is missing a de translation.",
      ),
    ).toBe(true);
  });

  test("warns when prefixed route modes lack required prefixes", () => {
    const report = createLocalizationFixtureReport([
      {
        id: "bad-prefix",
        labels: {
          labels: { "nav.articles": "Articles" },
          requiredLabelIds: ["nav.articles"],
        },
        locales: [
          {
            direction: "ltr",
            id: "en",
            isDefault: true,
            label: "English",
            languageTag: "en-US",
            localeCode: "en_US",
          },
        ],
        routeMode: "prefixed-default",
        routes: [
          {
            id: "article",
            localeId: "en",
            path: "/articles/example/",
            title: "Article",
          },
        ],
      },
    ]);

    expect(
      report.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "route.locale-prefix-missing" &&
          diagnostic.message ===
            "bad-prefix locale en needs a route prefix for prefixed-default mode.",
      ),
    ).toBe(true);
  });
});
