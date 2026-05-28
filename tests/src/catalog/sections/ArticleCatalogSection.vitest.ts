import { describe, expect, test } from "vitest";

import articleLandscapeImage from "../../../../src/catalog/assets/catalog-article-landscape.png";
import articleTallImage from "../../../../src/catalog/assets/catalog-article-tall.png";
import sampleImage from "../../../../src/catalog/assets/catalog-sample-light.svg";
import {
  catalogArticleItems,
  catalogRtlArticleItems,
  catalogTags,
} from "../../../../src/catalog/examples/hostile-fixtures";
import ArticleCatalogSection from "../../../../src/catalog/sections/ArticleCatalogSection.astro";
import { articleImagePresentation } from "../../../../src/lib/article-image-policy";
import type { ArticleReferenceData } from "../../../../src/lib/article-references/model";
import type { ArticleCitationMenuViewModel } from "../../../../src/lib/citations/article-citation";
import type { ArticleShareMenuViewModel } from "../../../../src/lib/share-targets";
import type { SupportBlockViewModel } from "../../../../src/lib/support";
import { createAstroTestContainer } from "../../../helpers/astro-container";

const articleTitle =
  "A Catalog Article With a Long But Plausible Editorial Title";
const articleUrl = "https://example.com/articles/catalog-boundary-example/";
const citation = {
  articleId: "catalog-boundary-example",
  canonicalUrl: articleUrl,
  formats: [
    {
      id: "bibtex",
      label: "BibTeX",
      text: `@online{catalog-boundary-example,
  title = {${articleTitle}},
  url = {${articleUrl}},
}`,
    },
    {
      id: "mla",
      label: "MLA",
      text: `"${articleTitle}." Catalog Review Site, ${articleUrl}.`,
    },
  ],
  title: articleTitle,
} as const satisfies ArticleCitationMenuViewModel;
const share = {
  actions: [
    {
      copyText: articleUrl,
      icon: "copy-link",
      id: "copy-link",
      kind: "copy",
      label: "Copy link",
    },
  ],
  articleUrl,
  copyText: articleUrl,
  title: articleTitle,
} as const satisfies ArticleShareMenuViewModel;
const references = {
  citations: [
    {
      bibtex: {
        entryType: "book",
        fields: {
          author: "Baudrillard, Jean",
          title: "Simulacra and Simulation",
          year: "1981",
        },
        key: "baudrillard-1981",
        normalizedKey: "baudrillard-1981",
        raw: "@book{baudrillard-1981}",
      },
      definition: {
        children: [
          {
            children: [{ kind: "text", text: "Baudrillard citation." }],
            kind: "paragraph",
            text: "Baudrillard citation.",
          },
        ],
      },
      displayLabel: "Baudrillard 1981",
      id: "cite-baudrillard-1981",
      kind: "citation",
      label: "cite-baudrillard-1981",
      order: 1,
      references: [
        {
          backlinkId: "cite-backref-baudrillard-1981",
          displayText: "1",
          entryId: "cite-baudrillard-1981",
          id: "cite-ref-baudrillard-1981",
          kind: "citation",
          label: "cite-baudrillard-1981",
          order: 1,
        },
      ],
    },
  ],
  notes: [
    {
      definition: {
        children: [
          {
            children: [{ kind: "text", text: "Catalog note." }],
            kind: "paragraph",
            text: "Catalog note.",
          },
        ],
      },
      id: "note-term-scope",
      kind: "note",
      label: "note-term-scope",
      order: 1,
      references: [
        {
          backlinkId: "note-backref-term-scope",
          displayText: "1",
          entryId: "note-term-scope",
          id: "note-ref-term-scope",
          kind: "note",
          label: "note-term-scope",
          order: 1,
        },
      ],
    },
  ],
} as const satisfies ArticleReferenceData;
const supportBlock = {
  discord: {
    ariaLabel: "Join Discord",
    href: "https://example.com/discord",
    label: "Join Discord",
  },
  enabled: true,
  patreon: {
    ariaLabel: "Support on Patreon",
    href: "https://example.com/support",
    label: "Support Us",
  },
  body: "Support independent publishing and maintenance.",
  title: "Support The Catalog",
} as const satisfies SupportBlockViewModel;

describe("ArticleCatalogSection", () => {
  test("renders article catalog examples from a domain section", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleCatalogSection, {
      props: {
        articleItemsWithMedia: catalogArticleItems,
        articleLandscapeImage,
        articleTallImage,
        authorName: "Catalog Fixture",
        citation,
        generatedImagePresentation: articleImagePresentation(),
        references,
        rtlArticleItems: catalogRtlArticleItems,
        sampleImage,
        share,
        supportBlock,
        tags: catalogTags,
        title: articleTitle,
      },
    });

    expect(view).toContain("Article Components");
    expect(view).toContain("src/components/articles/ArticleHeader.astro");
    expect(view).toContain("src/components/articles/ArticleImage.astro");
    expect(view).toContain("src/components/articles/ArticleReferences.astro");
    expect(view).toContain("src/components/articles/ArticleList.astro");
    expect(view).toContain("src/components/blocks/SupportBlock.astro");
    expect(view).toContain(articleTitle);
  });
});
