import { describe, expect, test } from "vitest";

import FlatArticleTeaser from "../../../../../src/components/articles/lists/FlatArticleTeaser.astro";
import {
  createAstroTestContainer,
  testSiteUrl,
} from "../../../../helpers/astro-container";

describe("FlatArticleTeaser", () => {
  test("renders a compact publishable link with category, date, and author metadata", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(FlatArticleTeaser, {
      props: {
        item: {
          author: "Author",
          category: { href: "/categories/culture/", title: "Culture" },
          date: "May 5, 2026",
          href: "/articles/first/",
          kind: "article",
          title: "First Article",
        },
      },
      request: new Request(`${testSiteUrl}/`),
    });

    expect(view).toContain("data-flat-article-teaser");
    expect(view).toContain("First Article");
    expect(view).toContain("/articles/first/");
    expect(view).toContain("Culture");
    expect(view).toContain("May 5, 2026");
    expect(view).toContain("Author");
  });

  test("renders announcement links without category metadata", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(FlatArticleTeaser, {
      props: {
        item: {
          author: "The Philosopher's Meme",
          date: "May 5, 2026",
          href: "/announcements/join-discord/",
          kind: "announcement",
          title: "Join Discord",
        },
      },
      request: new Request(`${testSiteUrl}/`),
    });

    expect(view).toContain("Join Discord");
    expect(view).toContain("/announcements/join-discord/");
    expect(view).toContain("The Philosopher&#39;s Meme");
    expect(view).not.toContain("Culture");
  });

  test("omits the metadata row when no metadata is available", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(FlatArticleTeaser, {
      props: {
        item: {
          href: "/articles/plain/",
          title: "Plain Article",
        },
      },
      request: new Request(`${testSiteUrl}/`),
    });

    expect(view).toContain("Plain Article");
    expect(view).not.toContain("data-flat-article-teaser-meta");
  });
});
