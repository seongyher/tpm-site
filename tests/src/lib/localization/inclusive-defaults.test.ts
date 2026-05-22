import { describe, expect, test } from "bun:test";

import { inclusiveDefaultIssues } from "../../../../src/lib/localization/inclusive-defaults";
import { parseSiteConfig } from "../../../../src/lib/site/site-config";

const baseConfig = {
  identity: {
    description: "A configurable publication.",
    language: "en",
    title: "Example Blog",
    url: "https://example.com",
  },
  navigation: {
    footer: [{ href: "/feed.xml", label: "RSS" }],
    primary: [{ href: "/articles/", label: "Articles" }],
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
      body: "Keep publishing going.",
      title: "Support Example Blog",
    },
    discord: {
      href: "https://discord.gg/example",
      label: "Join Discord",
    },
    patreon: {
      href: "https://patreon.com/example",
      label: "Support Us",
    },
  },
} as const;

describe("inclusiveDefaultIssues", () => {
  test("keeps single-locale English defaults quiet", () => {
    expect(inclusiveDefaultIssues(parseSiteConfig(baseConfig))).toEqual([]);
  });

  test("warns when a non-English site keeps English platform labels", () => {
    const issues = inclusiveDefaultIssues(
      parseSiteConfig({
        ...baseConfig,
        identity: {
          ...baseConfig.identity,
          language: "fr",
          locale: "fr_FR",
        },
      }),
    );

    const localizedLabelMessages = issues
      .filter((issue) => issue.code === "config.localized-label-defaulted")
      .map((issue) => issue.message);

    expect(
      localizedLabelMessages.some((message) =>
        message.includes("homepage.labels.read"),
      ),
    ).toBe(true);
    expect(
      localizedLabelMessages.some((message) =>
        message.includes("homepage.discoveryLinks[0].label"),
      ),
    ).toBe(true);
  });

  test("warns when non-English language still uses the default English Open Graph locale", () => {
    const issues = inclusiveDefaultIssues(
      parseSiteConfig({
        ...baseConfig,
        identity: {
          ...baseConfig.identity,
          language: "fr",
        },
      }),
    );

    expect(issues).toContainEqual({
      code: "config.identity-locale-mismatch",
      message:
        'Site language "fr" is non-English but identity.locale is still "en_US".',
      repair:
        "Set identity.locale in site/config/site.json to the matching Open Graph locale for the publication language.",
      severity: "warning",
    });
  });

  test("warns for swapped language and locale separators", () => {
    const issues = inclusiveDefaultIssues(
      parseSiteConfig({
        ...baseConfig,
        identity: {
          ...baseConfig.identity,
          language: "en_US",
          locale: "en-US",
        },
      }),
    );

    expect(
      issues.some((issue) => issue.code === "config.identity-language-invalid"),
    ).toBe(true);
    expect(
      issues.some((issue) => issue.code === "config.identity-locale-invalid"),
    ).toBe(true);
  });
});
