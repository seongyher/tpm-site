/** Component example metadata for article and article-discovery components. */
interface ArticleCatalogExample {
  componentPath: string;
  description: string;
  title: string;
}

export const articleCatalogExamples = [
  {
    componentPath:
      "src/components/articles/references/ArticleBibliography.astro",
    description:
      "Article-local bibliography section for parsed citation entries.",
    title: "ArticleBibliography",
  },
  {
    componentPath: "src/components/articles/lists/ArticleCard.astro",
    description:
      "Flat editorial article row used in archive and discovery lists.",
    title: "ArticleCard",
  },
  {
    componentPath: "src/components/articles/actions/ArticleCitationMenu.astro",
    description:
      "Article-header utility for copying generated reader citations.",
    title: "ArticleCitationMenu",
  },
  {
    componentPath: "src/components/articles/actions/ArticleShareMenu.astro",
    description: "Article-header utility for copy and social share targets.",
    title: "ArticleShareMenu",
  },
  {
    componentPath: "src/components/articles/endcap/ArticleEndcap.astro",
    description: "Article footer discovery and support composition.",
    title: "ArticleEndcap",
  },
  {
    componentPath: "src/components/articles/references/ArticleFootnotes.astro",
    description: "Article-local explanatory notes section.",
    title: "ArticleFootnotes",
  },
  {
    componentPath: "src/components/articles/header/ArticleHeader.astro",
    description:
      "Article title, category, metadata, citation utility, and description.",
    title: "ArticleHeader",
  },
  {
    componentPath: "src/components/articles/media/HoverImageCard.astro",
    description:
      "Native anchored inline image-only preview for MDX article prose.",
    title: "HoverImageCard",
  },
  {
    componentPath: "src/components/articles/media/ArticleImage.astro",
    description: "Optimized article image with required alt text and caption.",
    title: "ArticleImage",
  },
  {
    componentPath: "src/components/articles/lists/ArticleList.astro",
    description: "Responsive flat editorial list of article rows.",
    title: "ArticleList",
  },
  {
    componentPath: "src/components/articles/lists/CompactEntryList.astro",
    description:
      "Dense publishable-entry list for curated homepage and sidebar links.",
    title: "CompactEntryList",
  },
  {
    componentPath: "src/components/articles/lists/CompactEntryRow.astro",
    description:
      "One compact publishable-entry row with title, metadata, and optional description.",
    title: "CompactEntryRow",
  },
  {
    componentPath: "src/components/articles/header/ArticleMeta.astro",
    description: "Author and machine-readable publication date metadata.",
    title: "ArticleMeta",
  },
  {
    componentPath: "src/components/articles/lists/EntryMetaLine.astro",
    description:
      "Compact metadata row with separator handling and optional linked items.",
    title: "EntryMetaLine",
  },
  {
    componentPath: "src/components/articles/prose/ArticleProse.astro",
    description: "Tailwind Typography wrapper for rendered Markdown prose.",
    title: "ArticleProse",
  },
  {
    componentPath:
      "src/components/articles/references/ArticleReferenceBacklinks.astro",
    description: "Accessible return links from references to inline markers.",
    title: "ArticleReferenceBacklinks",
  },
  {
    componentPath: "src/components/articles/references/ArticleReferences.astro",
    description: "Composed article notes and bibliography apparatus.",
    title: "ArticleReferences",
  },
  {
    componentPath: "src/components/articles/toc/ArticleTableOfContents.astro",
    description:
      "Article-local heading navigation for the reading margin rail.",
    title: "ArticleTableOfContents",
  },
  {
    componentPath: "src/components/articles/toc/TableOfContentsItem.astro",
    description: "One article heading link inside the table of contents.",
    title: "TableOfContentsItem",
  },
  {
    componentPath: "src/components/articles/toc/TableOfContentsToggle.astro",
    description: "Native summary control for hiding article contents.",
    title: "TableOfContentsToggle",
  },
  {
    componentPath: "src/components/articles/header/ArticleTags.astro",
    description: "Article tag badges.",
    title: "ArticleTags",
  },
  {
    componentPath: "src/components/articles/endcap/MoreInCategoryBlock.astro",
    description: "Article-end list of additional posts in the same category.",
    title: "MoreInCategoryBlock",
  },
  {
    componentPath: "src/components/articles/endcap/NextArticleBlock.astro",
    description: "Chronological article continuation shown before support.",
    title: "NextArticleBlock",
  },
  {
    componentPath: "src/components/articles/endcap/RelatedArticlesBlock.astro",
    description: "Stable placeholder for future related-article discovery.",
    title: "RelatedArticlesBlock",
  },
  {
    componentPath: "src/components/blocks/shared/SupportBlock.astro",
    description: "Reusable reader-support call to action.",
    title: "SupportBlock",
  },
] as const satisfies ArticleCatalogExample[];
