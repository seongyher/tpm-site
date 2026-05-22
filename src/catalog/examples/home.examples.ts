/** Component example metadata for homepage block components. */
interface HomeCatalogExample {
  componentPath: string;
  description: string;
  title: string;
}

export const homeCatalogExamples = [
  {
    componentPath: "src/components/articles/lists/FlatArticleList.astro",
    description: "Flat compact publishable-entry list for homepage rails.",
    title: "FlatArticleList",
  },
  {
    componentPath: "src/components/articles/lists/FlatArticleTeaser.astro",
    description: "One flat compact publishable-entry teaser.",
    title: "FlatArticleTeaser",
  },
  {
    componentPath: "src/components/blocks/home/HomeAnnouncementBlock.astro",
    description: "Homepage announcement image and editable Markdown prose.",
    title: "HomeAnnouncementBlock",
  },
  {
    componentPath: "src/components/blocks/home/HomeArchiveLinksBlock.astro",
    description: "Archive, category, and RSS discovery links.",
    title: "HomeArchiveLinksBlock",
  },
  {
    componentPath: "src/components/blocks/shared/CompactEntryPanel.astro",
    description:
      "Reusable homepage panel for compact publishable-entry link lists.",
    title: "CompactEntryPanel",
  },
  {
    componentPath: "src/components/blocks/home/HomeCategoryOverviewBlock.astro",
    description: "Homepage adapter for the shared category discovery rail.",
    title: "HomeCategoryOverviewBlock",
  },
  {
    componentPath: "src/components/blocks/home/HomeCurrentPanel.astro",
    description: "Compact current project, community, and support links.",
    title: "HomeCurrentPanel",
  },
  {
    componentPath: "src/components/blocks/home/HomeDiscoveryLinksBlock.astro",
    description: "Thin homepage strip for secondary discovery links.",
    title: "HomeDiscoveryLinksBlock",
  },
  {
    componentPath: "src/components/blocks/home/HomeFeaturedArticlesBlock.astro",
    description: "Start-here or featured article list.",
    title: "HomeFeaturedArticlesBlock",
  },
  {
    componentPath: "src/components/blocks/home/HomeFeaturedCarousel.astro",
    description: "Static-first featured item carousel.",
    title: "HomeFeaturedCarousel",
  },
  {
    componentPath: "src/components/blocks/home/HomeFeaturedSlide.astro",
    description: "One normalized featured publishable-entry carousel item.",
    title: "HomeFeaturedSlide",
  },
  {
    componentPath: "src/components/blocks/home/HomeHeroBlock.astro",
    description: "Homepage brand image, tagline, and primary calls to action.",
    title: "HomeHeroBlock",
  },
  {
    componentPath: "src/components/blocks/home/HomeLatestArticleBlock.astro",
    description: "Most recent article teaser with image.",
    title: "HomeLatestArticleBlock",
  },
  {
    componentPath: "src/components/blocks/home/HomeMastheadBlock.astro",
    description:
      "Homepage first-impression grid with reading and current links.",
    title: "HomeMastheadBlock",
  },
  {
    componentPath: "src/components/blocks/home/HomeRecentPostsBlock.astro",
    description: "Compact latest-post list for the homepage promo row.",
    title: "HomeRecentPostsBlock",
  },
  {
    componentPath: "src/components/blocks/home/HomeStartHerePanel.astro",
    description: "Curated new-reader article links for the homepage masthead.",
    title: "HomeStartHerePanel",
  },
  {
    componentPath: "src/components/blocks/terms/TermRailCard.astro",
    description: "One reusable term card inside horizontal discovery rails.",
    title: "TermRailCard",
  },
] as const satisfies HomeCatalogExample[];
