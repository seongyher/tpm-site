import { describe, expect, test } from "vitest";

import FlatArticleList from "../../../../../src/components/articles/lists/FlatArticleList.astro";
import {
  createAstroTestContainer,
  testSiteUrl,
} from "../../../../helpers/astro-container";

describe("FlatArticleList", () => {
  test("renders compact publishable links with metadata in caller order", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(FlatArticleList, {
      props: {
        items: [
          {
            author: "Author",
            category: { href: "/categories/culture/", title: "Culture" },
            date: "May 5, 2026",
            href: "/articles/first/",
            kind: "article",
            title: "First Article",
          },
          {
            href: "/announcements/second/",
            kind: "announcement",
            title: "Second Announcement",
          },
        ],
        title: "Start Here",
        titleHref: "/collections/start-here/",
      },
      request: new Request(`${testSiteUrl}/`),
    });

    expect(view).toContain("data-flat-article-list");
    expect(view).toContain('href="/collections/start-here/"');
    expect(view).toContain("First Article");
    expect(view).toContain("Culture");
    expect(view).toContain("May 5, 2026");
    expect(view).toContain("Author");
    expect(view.indexOf("First Article")).toBeLessThan(
      view.indexOf("Second Announcement"),
    );
  });

  test("renders a quiet empty state", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(FlatArticleList, {
      props: {
        emptyText: "No items yet.",
        items: [],
        title: "Announcements",
      },
      request: new Request(`${testSiteUrl}/`),
    });

    expect(view).toContain("No items yet.");
  });
});
