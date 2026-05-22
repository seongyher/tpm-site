/** Component example metadata for archive, category, and search blocks. */
interface ArchiveCatalogExample {
  componentPath: string;
  description: string;
  title: string;
}

export const archiveCatalogExamples = [
  {
    componentPath: "src/components/blocks/listing/ArchiveListBlock.astro",
    description: "Reusable article archive and category article-list block.",
    title: "ArchiveListBlock",
  },
  {
    componentPath: "src/components/blocks/terms/CategoryRailBlock.astro",
    description: "Reusable one-row category rail backed by navigation data.",
    title: "CategoryRailBlock",
  },
  {
    componentPath: "src/components/blocks/terms/CategoryOverviewBlock.astro",
    description: "Reusable category overview grid backed by navigation data.",
    title: "CategoryOverviewBlock",
  },
  {
    componentPath: "src/components/blocks/terms/TermOverviewBlock.astro",
    description:
      "Reusable overview grid for categories, tags, and other article terms.",
    title: "TermOverviewBlock",
  },
  {
    componentPath: "src/components/blocks/listing/SearchResultsBlock.astro",
    description: "Static search form and Pagefind result enhancement region.",
    title: "SearchResultsBlock",
  },
] as const satisfies ArchiveCatalogExample[];
