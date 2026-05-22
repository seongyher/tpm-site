import { describe, expect, test } from "bun:test";

import {
  type ArticleSummary,
  primaryNavigationItems,
  sectionNavigationItems,
  type SectionNavItem,
} from "../../../../src/lib/site/navigation";
import { articleEntry, categorySummary } from "../../../helpers/content";

describe("primaryNavigationItems", () => {
  test("builds durable non-category navigation links", () => {
    expect(primaryNavigationItems()).toEqual([
      { href: "/articles/", label: "Articles" },
      { href: "/about/", label: "About" },
    ]);
  });
});

describe("sectionNavigationItems", () => {
  test("preserves category ordering and maps display-ready section links", () => {
    const historyArticle = articleEntry({
      data: { description: "History article description" },
      id: "history-post",
    });
    const philosophyArticle = articleEntry({
      data: {
        description: "Philosophy article description",
        title: "Philosophy Article",
      },
      id: "philosophy-post",
    });
    const navigation = sectionNavigationItems(
      [
        categorySummary({
          articles: [historyArticle],
          description: "History category description",
          slug: "history",
        }),
        categorySummary({
          articles: [philosophyArticle],
          description: "Philosophy category description",
          slug: "philosophy",
          title: "Philosophy",
        }),
      ],
      "/categories/history/",
    );
    const firstSection: SectionNavItem | undefined = navigation[0];
    const firstArticle: ArticleSummary | undefined = firstSection?.articles[0];

    expect(navigation).toEqual([
      {
        articles: [
          {
            description: "History article description",
            href: "/articles/history-post/",
            isCurrent: false,
            slug: "history-post",
            title: "Sample Article",
          },
        ],
        description: "History category description",
        href: "/categories/history/",
        isCurrent: true,
        isOpen: true,
        slug: "history",
        title: "History",
      },
      {
        articles: [
          {
            description: "Philosophy article description",
            href: "/articles/philosophy-post/",
            isCurrent: false,
            slug: "philosophy-post",
            title: "Philosophy Article",
          },
        ],
        description: "Philosophy category description",
        href: "/categories/philosophy/",
        isCurrent: false,
        isOpen: false,
        slug: "philosophy",
        title: "Philosophy",
      },
    ]);
    expect(firstArticle?.href).toBe("/articles/history-post/");
  });

  test("opens a category and marks an article current when the current article belongs to it", () => {
    const article = articleEntry({
      data: { title: "Article Title" },
      id: "article-title",
    });
    const [navigation] = sectionNavigationItems(
      [categorySummary({ articles: [article], slug: "history" })],
      "/articles/article-title/",
    );

    expect(navigation?.isOpen).toBe(true);
    expect(navigation?.isCurrent).toBe(false);
    expect(navigation?.articles[0]?.isCurrent).toBe(true);
  });
});
