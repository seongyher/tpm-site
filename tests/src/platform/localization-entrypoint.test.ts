import { describe, expect, test } from "bun:test";

import { parseSiteConfig } from "../../../src/lib/site-config";
import {
  createLocalizationFixtureReport,
  inclusiveDefaultIssues,
  type LocalizationFixture,
} from "../../../src/platform/localization";

describe("platform localization entrypoint", () => {
  test("exposes localization fixture reports through the platform seam", () => {
    const fixture = {
      id: "entrypoint",
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
      routeMode: "single",
      routes: [
        {
          id: "article",
          localeId: "en",
          path: "/articles/example/",
          title: "Example",
        },
      ],
    } satisfies LocalizationFixture;

    expect(
      createLocalizationFixtureReport([fixture]).snapshots.some(
        (snapshot) =>
          snapshot.htmlLang === "en-US" &&
          snapshot.route === "/articles/example/",
      ),
    ).toBe(true);
  });

  test("exposes inclusive default diagnostics through the platform seam", () => {
    const config = parseSiteConfig({
      identity: {
        description: "Publication française.",
        language: "fr",
        locale: "fr_FR",
        title: "Revue",
        url: "https://example.com",
      },
      navigation: {
        footer: [],
        primary: [],
      },
      routes: {
        allArticles: "/articles/all/",
        announcements: "/announcements/",
        articles: "/articles/",
        authors: "/authors/",
        bibliography: "/bibliography/",
        categories: "/categories/",
        collections: "/collections/",
        feed: "/feed.xml",
        home: "/",
        search: "/search/",
        tags: "/tags/",
      },
      support: {
        block: {
          body: "Soutenez la publication.",
          title: "Soutenir la revue",
        },
        discord: {
          href: "https://discord.gg/example",
          label: "Discord",
        },
        patreon: {
          href: "https://patreon.com/example",
          label: "Patreon",
        },
      },
    });

    expect(
      inclusiveDefaultIssues(config).some(
        (issue) => issue.code === "config.localized-label-defaulted",
      ),
    ).toBe(true);
  });
});
