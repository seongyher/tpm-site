import { describe, expect, test } from "bun:test";

import { defaultPublishableVisibility } from "../../../../src/lib/content/publishable";
import {
  absoluteUrl,
  articleBlogPostingJsonLd,
} from "../../../../src/lib/metadata/seo";
import type { ArticleEntry } from "../../../../src/lib/routes/routes";

function article(data: Partial<ArticleEntry["data"]> = {}): ArticleEntry {
  return {
    collection: "articles",
    data: {
      author: "Author",
      date: new Date("2022-01-01T00:00:00Z"),
      description: "Description",
      draft: false,
      tags: [],
      title: "Title",
      visibility: defaultPublishableVisibility,
      ...data,
    },
    id: "title",
  };
}

describe("SEO helpers", () => {
  test("normalizes relative, protocol-relative, and scheme URLs", () => {
    expect(absoluteUrl("articles/post/", "https://example.com/")).toBe(
      "https://example.com/articles/post/",
    );
    expect(absoluteUrl("//cdn.example.com/a.png", "https://example.com")).toBe(
      "//cdn.example.com/a.png",
    );
    expect(absoluteUrl("mailto:test@example.com", "https://example.com")).toBe(
      "mailto:test@example.com",
    );
  });

  test("omits image and category metadata when unavailable", () => {
    const jsonLd = articleBlogPostingJsonLd(article(), undefined, undefined);

    expect(jsonLd).toMatchObject({
      "@id": "https://thephilosophersmeme.com/articles/title/#article",
      inLanguage: "en",
      isPartOf: { "@id": "https://thephilosophersmeme.com/#website" },
      mainEntityOfPage: {
        "@id": "https://thephilosophersmeme.com/articles/title/#webpage",
      },
      publisher: { "@id": "https://thephilosophersmeme.com/#publisher" },
      url: "https://thephilosophersmeme.com/articles/title/",
    });
    expect("articleSection" in jsonLd).toBe(false);
    expect("dateModified" in jsonLd).toBe(false);
    expect("image" in jsonLd).toBe(false);
  });

  test("emits modified dates only when article frontmatter provides them", () => {
    expect(
      articleBlogPostingJsonLd(
        article({ updated: new Date("2022-02-01T00:00:00Z") }),
        undefined,
        "https://example.com",
      ),
    ).toMatchObject({
      dateModified: "2022-02-01T00:00:00.000Z",
    });
  });

  test("uses structured author metadata when available", () => {
    expect(
      articleBlogPostingJsonLd(article(), undefined, "https://example.com", [
        {
          displayName: "The Philosopher's Meme",
          href: "/authors/the-philosophers-meme/",
          id: "the-philosophers-meme",
          type: "organization",
        },
      ]),
    ).toMatchObject({
      author: [
        {
          "@type": "Organization",
          name: "The Philosopher's Meme",
          url: "https://example.com/authors/the-philosophers-meme/",
        },
      ],
    });
  });

  test("uses normalized social preview images instead of deriving raw article images", () => {
    expect(
      articleBlogPostingJsonLd(
        article(),
        undefined,
        "https://example.com",
        [],
        { image: "/_astro/social-preview.hash.jpg" },
      ),
    ).toMatchObject({
      image: "https://example.com/_astro/social-preview.hash.jpg",
    });
  });
});
