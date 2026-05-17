import { archiveCatalogExamples } from "./examples/archive.examples";
import { articleCatalogExamples } from "./examples/article.examples";
import { authorCatalogExamples } from "./examples/author.examples";
import { bibliographyCatalogExamples } from "./examples/bibliography.examples";
import { homeCatalogExamples } from "./examples/home.examples";
import { layoutCatalogExamples } from "./examples/layout.examples";
import { navigationCatalogExamples } from "./examples/navigation.examples";
import { pageCatalogExamples } from "./examples/page.examples";
import { uiCatalogExamples } from "./examples/ui.examples";

/** Metadata displayed on the private component catalog page. */
interface CatalogMetadata {
  description: string;
  title: string;
}

/** Public component intentionally excluded from catalog completeness checks. */
export interface ComponentCatalogIgnore {
  lifecycle: ComponentCatalogLifecycleStatus;
  path: string;
  reason: string;
}

export const componentCatalogLifecycleStatuses = [
  "current",
  "platform-candidate",
  "deprecated-fixture",
  "route-only",
] as const;

/** Lifecycle classifications used to prevent accidental catalog deletions. */
export type ComponentCatalogLifecycleStatus =
  (typeof componentCatalogLifecycleStatuses)[number];

/** Human-readable lifecycle labels shown inside the component catalog. */
export const componentCatalogLifecycleLabels = {
  current: "Current",
  "deprecated-fixture": "Deprecated fixture",
  "platform-candidate": "Platform candidate",
  "route-only": "Route only",
} as const satisfies Record<ComponentCatalogLifecycleStatus, string>;

/** Static path shape for the private component catalog route. */
interface ComponentCatalogStaticPath {
  params: {
    path: string | undefined;
  };
}

export const catalogMetadata = {
  description:
    "Private design-system review surface for platform Astro and Tailwind components.",
  title: "Platform Component Catalog",
} as const satisfies CatalogMetadata;

export const catalogExampleComponentPaths = [
  ...archiveCatalogExamples,
  ...authorCatalogExamples,
  ...articleCatalogExamples,
  ...bibliographyCatalogExamples,
  ...homeCatalogExamples,
  ...uiCatalogExamples,
  ...navigationCatalogExamples,
  ...layoutCatalogExamples,
  ...pageCatalogExamples,
].map((example) => example.componentPath);

export const componentCatalogIgnoreList = [
  {
    lifecycle: "route-only",
    path: "src/components/articles/ArticleCardBody.astro",
    reason:
      "Internal article-card child covered by ArticleCard and article-list component tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/articles/PublishableMediaFrame.astro",
    reason:
      "Internal linked-media primitive covered by ArticleCard, HomeFeaturedSlide, and focused media-frame tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/articles/ArticleHeaderActionLink.astro",
    reason:
      "Internal article-header action primitive covered by ArticleHeader component tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/articles/ArticleHeaderActionRow.astro",
    reason:
      "Internal article-header action primitive covered by ArticleHeader component tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/articles/ArticleHeaderActionTrigger.astro",
    reason:
      "Internal article-header anchored trigger covered by citation and share menu tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/articles/ArticleShareActionRow.astro",
    reason:
      "Internal article-share row renderer covered by ArticleShareMenu examples and component tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/articles/ArticleImageFrame.astro",
    reason:
      "Internal article-image frame covered by ArticleImage, focused frame, and article-image e2e tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/articles/ArticleImageInspectorScript.astro",
    reason:
      "Non-visual script boundary covered by ArticleImage, ArticleProse, browser-script, and e2e tests.",
  },
  {
    lifecycle: "platform-candidate",
    path: "src/components/articles/HoverImageLink.astro",
    reason: "Article-specific MDX wrapper pending article catalog examples.",
  },
  {
    lifecycle: "platform-candidate",
    path: "src/components/articles/HoverImageParagraph.astro",
    reason: "Article-specific MDX wrapper pending article catalog examples.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/articles/ArticleReferenceDefinitionContent.astro",
    reason:
      "Internal article-reference renderer covered by parent reference component examples and tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/articles/ArticleReferenceInlineContent.astro",
    reason:
      "Internal article-reference inline renderer covered by parent reference component examples and tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/blocks/HomeFeaturedCarouselControls.astro",
    reason:
      "Internal carousel control row covered by HomeFeaturedCarousel and focused control tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/blocks/TermCard.astro",
    reason:
      "Internal term-surface child covered by TermOverviewBlock and TermRailBlock tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/blocks/TermRailBlock.astro",
    reason:
      "Generic term rail adapter covered by CategoryRailBlock and focused TermRailBlock tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/seo/ArticleJsonLd.astro",
    reason: "Non-visual SEO component covered by SEO and page render tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/seo/ArticleScholarMeta.astro",
    reason:
      "Non-visual Scholar metadata component covered by PDF SEO and article render tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/seo/AnnouncementJsonLd.astro",
    reason:
      "Non-visual announcement metadata component covered by SEO component and page render tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/seo/PublishableOpenGraphMeta.astro",
    reason:
      "Non-visual Open Graph metadata component covered by SEO component and article render tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/seo/SiteHead.astro",
    reason: "Non-visual SEO component covered by SEO and page render tests.",
  },
  {
    lifecycle: "route-only",
    path: "src/components/layout/SiteShell.astro",
    reason:
      "Full-page composition shell is covered by layout/page tests and would nest the catalog page.",
  },
] as const satisfies ComponentCatalogIgnore[];

/**
 * Checks whether the private component catalog route should be generated.
 *
 * @param value Environment value to evaluate.
 * @returns True only for the explicit string `true`.
 */
export function isComponentCatalogEnabled(
  value = process.env["PLATFORM_COMPONENT_CATALOG"],
): boolean {
  return value === "true";
}

/**
 * Returns static paths for the private component catalog route.
 *
 * @param enabled Whether the catalog should be generated.
 * @returns Empty paths for normal builds, or the `/catalog/` path when enabled.
 */
export function componentCatalogStaticPaths(
  enabled = isComponentCatalogEnabled(),
): ComponentCatalogStaticPath[] {
  return enabled ? [{ params: { path: undefined } }] : [];
}
