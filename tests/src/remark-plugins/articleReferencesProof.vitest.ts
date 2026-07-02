import { getCollection, render } from "astro:content";
import { describe, expect, test } from "vitest";

import ArticleLayout from "../../../src/layouts/ArticleLayout.astro";
import type { ArticleReferenceData } from "../../../src/lib/article-references/model";
import { getArticles } from "../../../src/lib/content";
import { articleReferencesFromFrontmatter } from "../../../src/remark-plugins/articleReferences";
import {
  createAstroTestContainer,
  testSiteUrl,
} from "../../helpers/astro-container";

describe("article reference proof fixtures", () => {
  test("transport rich reference data through render(entry).remarkPluginFrontmatter", async () => {
    const fixtures = await getCollection("articleReferenceProofFixtures");

    expect(fixtures.map((fixture) => fixture.id).sort()).toEqual([
      "proof-md",
      "proof-mdx",
    ]);

    for (const fixture of fixtures) {
      const rendered = await render(fixture);

      expect(rendered.remarkPluginFrontmatter).toHaveProperty(
        "articleReferences",
      );

      const references = requiredReferences(rendered.remarkPluginFrontmatter);

      expect(references.citations).toHaveLength(1);
      expect(references.notes).toHaveLength(1);
      const entries = [...references.citations, ...references.notes];

      expect(
        entries.some((entry) =>
          entry.definition.children.some(
            (block) =>
              "children" in block &&
              block.children.some((child) => child.kind === "link"),
          ),
        ),
      ).toBe(true);
      expect(
        entries.some((entry) =>
          entry.definition.children.some(
            (block) =>
              "children" in block &&
              block.children.some((child) => child.kind === "inlineCode"),
          ),
        ),
      ).toBe(true);
    }
  });

  test("suppresses Astro GFM default footnotes for canonical proof references", async () => {
    const fixtures = await getCollection("articleReferenceProofFixtures");
    const container = await createAstroTestContainer();

    for (const fixture of fixtures) {
      const { Content } = await render(fixture);
      const view = await container.renderToString(Content);

      expect(view).toContain("data-article-reference-marker");
      expect(view).not.toContain('data-footnotes="true"');
      expect(view).not.toContain("footnotes");
      expect(view).not.toContain("[@");
    }
  });

  test("renders Markdown and MDX proof fixtures through the article layout", async () => {
    const [article] = await getArticles();

    if (article === undefined) {
      throw new Error("Expected at least one article for layout chrome.");
    }

    const fixtures = await getCollection("articleReferenceProofFixtures");
    const container = await createAstroTestContainer();

    for (const fixture of fixtures) {
      const { Content, remarkPluginFrontmatter } = await render(fixture);
      const contentHtml = await container.renderToString(Content);
      const references = requiredReferences(remarkPluginFrontmatter);
      const view = await container.renderToString(ArticleLayout, {
        props: { article, articleReferences: references },
        request: new Request(`${testSiteUrl}/articles/${article.id}/`),
        slots: {
          default: contentHtml,
        },
      });

      expect(view).toContain("data-article-reference-marker");
      expect(view).toContain("data-article-references");
      expect(view).toMatch(/>\s*Notes\s*</);
      expect(view).toMatch(/>\s*Bibliography\s*</);
      expect(view).not.toContain('data-footnotes="true"');
      expect(view).not.toContain("[@");
    }
  });
});

function requiredReferences(frontmatter: unknown): ArticleReferenceData {
  const references = articleReferencesFromFrontmatter(frontmatter);

  if (references === undefined) {
    throw new Error("Expected article reference payload.");
  }

  return references;
}
