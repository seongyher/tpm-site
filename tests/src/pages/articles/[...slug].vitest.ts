import { getCollection } from "astro:content";
import { describe, expect, test } from "vitest";

import { getArticles } from "../../../../src/lib/content";
import { articleSlug } from "../../../../src/lib/routes";
import ArticlePage from "../../../../src/pages/articles/[...slug].astro";
import {
  createAstroTestContainer,
  testSiteUrl,
} from "../../../helpers/astro-container";

describe("article page", () => {
  test("renders article content through the article layout", async () => {
    const [article] = await getArticles();

    if (article === undefined) {
      throw new Error("Expected at least one article fixture from content.");
    }

    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticlePage, {
      props: { article },
      request: new Request(`${testSiteUrl}/articles/${article.id}/`),
    });

    expect(view).toContain(article.data.title);
    expect(view).toContain("Article tags");
    expect(view).toContain("Support The Philosopher&#39;s Meme");
    expect(view).toContain("Save PDF");
    expect(view).toContain('name="citation_pdf_url"');
    expect(view).toContain(
      `href="/articles/${articleSlug(article)}/${articleSlug(article)}.pdf"`,
    );
  });

  test("uses Astro rendered headings for the article table of contents", async () => {
    const article = (await getArticles()).find(
      (entry) => entry.id === "facebook-groups",
    );

    if (article === undefined) {
      throw new Error("Expected the facebook-groups article fixture.");
    }

    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticlePage, {
      props: { article },
      request: new Request(`${testSiteUrl}/articles/${article.id}/`),
    });

    expect(view).toContain("data-article-toc");
    expect(view).toContain('href="#facebook-as-a-platform"');
    expect(view).toContain("Facebook as a platform");
  });

  test("wires Markdown and MDX article reference metadata into the article route", async () => {
    const fixtures = await getCollection("articleReferenceArticleFixtures");

    expect(fixtures.map((fixture) => fixture.id).sort()).toEqual([
      "reference-md",
      "reference-mdx",
    ]);

    const container = await createAstroTestContainer();

    for (const article of fixtures) {
      const view = await container.renderToString(ArticlePage, {
        props: { article },
        request: new Request(`${testSiteUrl}/articles/${article.id}/`),
      });

      expect(view).toContain(article.data.title);
      expect(view).toContain("data-article-reference-marker");
      expect(view).toContain("data-article-references");
      expect(view).toContain("data-article-toc");
      expect(view).toContain('href="#article-references-notes-heading"');
      expect(view).toContain('href="#article-references-bibliography-heading"');
      expect(view).toMatch(/>\s*Notes\s*</);
      expect(view).toMatch(/>\s*Bibliography\s*</);
      expect(view).not.toContain('data-footnotes="true"');
      expect(view).not.toContain("[@");
    }
  });

  test("preserves explicit semantic table headers in article content", async () => {
    const article = (await getArticles()).find(
      (entry) =>
        entry.id ===
        "wittgensteins-most-beloved-quote-was-real-but-its-fake-now",
    );

    if (article === undefined) {
      throw new Error("Expected the Wittgenstein article fixture.");
    }

    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticlePage, {
      props: { article },
      request: new Request(`${testSiteUrl}/articles/${articleSlug(article)}/`),
    });

    expect(view).toContain('<th scope="col">Phrasing</th>');
    expect(view).toContain(
      '<th scope="row">Dribble-Wittgenstein Phrasing</th>',
    );
  });
});
