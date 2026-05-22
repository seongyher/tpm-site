import { describe, expect, test } from "bun:test";

import { defaultPublishableVisibility } from "../../src/lib/content/publishable";
import {
  articleBlogPostingJsonLd,
  safeJsonLd,
} from "../../src/lib/metadata/seo";
import type {
  ArticleEntry,
  CategorySummary,
} from "../../src/lib/routes/routes";

function article(): ArticleEntry {
  return {
    collection: "articles",
    data: {
      author: "Seong-Young Her",
      date: new Date("2022-04-06T10:58:10.000Z"),
      description: "A short article description.",
      draft: false,
      tags: ["philosophy", "quotes"],
      title: "Example Article",
      visibility: defaultPublishableVisibility,
    },
    id: "example-article",
  };
}

function category(): CategorySummary {
  return {
    articles: [],
    order: 1,
    slug: "history",
    title: "History",
  };
}

describe("SEO helpers", () => {
  test("builds BlogPosting JSON-LD from final article metadata", () => {
    const jsonLd = articleBlogPostingJsonLd(
      article(),
      category(),
      "https://example.com",
    );

    expect(jsonLd).toMatchObject({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      articleSection: "History",
      author: {
        "@type": "Person",
        name: "Seong-Young Her",
      },
      description: "A short article description.",
      inLanguage: "en",
      isPartOf: {
        "@id": "https://example.com/#website",
      },
      headline: "Example Article",
      keywords: ["philosophy", "quotes"],
      mainEntityOfPage: {
        "@id": "https://example.com/articles/example-article/#webpage",
      },
      publisher: {
        "@id": "https://example.com/#publisher",
      },
      url: "https://example.com/articles/example-article/",
    });
  });

  test("escapes JSON-LD script content", () => {
    expect(safeJsonLd({ value: "</script>" })).toContain("\\u003c/script>");
  });

  test("can emit structured author profile URLs", () => {
    expect(
      articleBlogPostingJsonLd(article(), category(), "https://example.com", [
        {
          displayName: "Seong-Young Her",
          href: "/authors/seong-young-her/",
          id: "seong-young-her",
          type: "person",
        },
      ]),
    ).toMatchObject({
      author: [
        {
          "@type": "Person",
          name: "Seong-Young Her",
          url: "https://example.com/authors/seong-young-her/",
        },
      ],
    });
  });

  test("uses explicit generated social preview image URLs", () => {
    expect(
      articleBlogPostingJsonLd(
        article(),
        category(),
        "https://example.com",
        [],
        { image: "/_astro/social-preview.hash.jpg" },
      ),
    ).toMatchObject({
      image: "https://example.com/_astro/social-preview.hash.jpg",
    });
  });
});
