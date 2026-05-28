import { routeIndexOutputPath, routeOutputPath } from "./route-registry";

/** Byte-budget status emitted by deterministic performance workbench checks. */
type PayloadBudgetStatus = "fail" | "missing" | "pass" | "warn";

/** Route classes used by the performance workbench. */
type RoutePerformanceClassId =
  | "articles-hub"
  | "generated-feeds-and-metadata"
  | "generated-pdfs"
  | "home"
  | "media-heavy-article"
  | "scholarly-article"
  | "search-and-bibliography"
  | "standard-article"
  | "static-page"
  | "taxonomy-listing";

/** One deterministic byte budget with warning and failure thresholds. */
export interface ByteBudget {
  readonly failureBytes: number;
  readonly warningBytes: number;
}

/** Result for one byte-budget measurement. */
export interface ByteBudgetResult extends ByteBudget {
  readonly measuredBytes: number | undefined;
  readonly metric: string;
  readonly status: PayloadBudgetStatus;
}

/** Route-class budget policy used by payload and Lighthouse tooling. */
export interface RouteClassPerformanceBudget {
  readonly description: string;
  readonly htmlBrotliBudget?: ByteBudget | undefined;
  readonly id: RoutePerformanceClassId;
  readonly label: string;
  readonly lighthouseRepresentative: boolean;
  readonly routes: readonly string[];
}

/** Generated PDF payload policy. */
export interface PdfPayloadBudget extends ByteBudget {
  readonly targetBytes: number;
}

/** Expected immutable cache policy for fingerprinted Astro assets. */
export interface ImmutableAssetCachePolicy {
  readonly expectedHeader: string;
  readonly pathPattern: string;
}

const bytesPerKibibyte = 1024;
const bytesPerMebibyte = 1024 * bytesPerKibibyte;

export const pdfPayloadBudget = {
  failureBytes: 5 * bytesPerMebibyte,
  targetBytes: 2 * bytesPerMebibyte,
  warningBytes: 3 * bytesPerMebibyte,
} as const satisfies PdfPayloadBudget;

export const immutableAstroAssetCachePolicy = {
  expectedHeader: "Cache-Control: public, max-age=31556952, immutable",
  pathPattern: "/_astro/*",
} as const satisfies ImmutableAssetCachePolicy;

export const routeClassPerformanceBudgets = [
  {
    description:
      "First impression, hero image, featured carousel, discovery surfaces, and primary CTAs.",
    htmlBrotliBudget: kibBudget(20, 25),
    id: "home",
    label: "Home",
    lighthouseRepresentative: true,
    routes: ["/"],
  },
  {
    description:
      "List-heavy reading entry points with many article previews and archive navigation.",
    htmlBrotliBudget: kibBudget(28, 36),
    id: "articles-hub",
    label: "Articles hub",
    lighthouseRepresentative: true,
    routes: ["/articles/", "/articles/all/"],
  },
  {
    description:
      "Typical article page with prose, metadata, actions, table of contents, support, and related blocks.",
    htmlBrotliBudget: kibBudget(28, 36),
    id: "standard-article",
    label: "Standard article",
    lighthouseRepresentative: true,
    routes: [
      "/articles/gamergate-as-metagaming/",
      "/articles/misattributed-plato-quote-is-real-now/",
    ],
  },
  {
    description:
      "Dense citation and bibliography pages with large generated reference sections.",
    htmlBrotliBudget: kibBudget(50, 65),
    id: "scholarly-article",
    label: "Scholarly/citation-heavy article",
    lighthouseRepresentative: true,
    routes: [
      "/articles/what-is-a-meme/",
      "/articles/internetmemetics/",
      "/articles/the-memeticists-challenge-remains-open/",
    ],
  },
  {
    description:
      "Image-heavy prose pages with figure layout, LCP, CLS, and PDF-size risk.",
    htmlBrotliBudget: kibBudget(28, 36),
    id: "media-heavy-article",
    label: "Media-heavy article",
    lighthouseRepresentative: true,
    routes: [
      "/articles/kandinsky-and-loss/",
      "/articles/memes-jokes-and-visual-puns/",
      "/articles/what-we-talk-about-harambe/",
    ],
  },
  {
    description:
      "Repeated teaser/card surfaces for categories, tags, authors, and collections.",
    htmlBrotliBudget: kibBudget(24, 32),
    id: "taxonomy-listing",
    label: "Taxonomy and author listing",
    lighthouseRepresentative: true,
    routes: [
      "/categories/history/",
      "/tags/meta-irony/",
      "/authors/seong-young-her/",
      "/collections/featured/",
    ],
  },
  {
    description:
      "Mostly static pages with low JavaScript and image expectations.",
    htmlBrotliBudget: kibBudget(18, 24),
    id: "static-page",
    label: "Static page",
    lighthouseRepresentative: true,
    routes: ["/about/", "/announcements/", "/collections/"],
  },
  {
    description:
      "Special generated discovery pages with search and bibliography payload risk.",
    htmlBrotliBudget: kibBudget(45, 60),
    id: "search-and-bibliography",
    label: "Search and bibliography",
    lighthouseRepresentative: true,
    routes: ["/search/", "/bibliography/"],
  },
  {
    description:
      "Machine-readable generated output such as feeds, sitemaps, redirects, and social images.",
    id: "generated-feeds-and-metadata",
    label: "Generated feeds and metadata",
    lighthouseRepresentative: false,
    routes: ["/feed.xml"],
  },
  {
    description:
      "Article PDF artifacts for Scholar compatibility, downloads, and print-like reading.",
    id: "generated-pdfs",
    label: "Generated PDFs",
    lighthouseRepresentative: false,
    routes: [],
  },
] as const satisfies readonly RouteClassPerformanceBudget[];

/**
 * Evaluates a byte measurement against warning and failure thresholds.
 *
 * @param metric Human-readable metric name.
 * @param measuredBytes Measured byte size, or undefined when missing.
 * @param budget Warning and failure thresholds.
 * @returns Deterministic budget result.
 */
export function evaluateByteBudget(
  metric: string,
  measuredBytes: number | undefined,
  budget: ByteBudget,
): ByteBudgetResult {
  if (measuredBytes === undefined) {
    return { ...budget, measuredBytes, metric, status: "missing" };
  }

  if (measuredBytes > budget.failureBytes) {
    return { ...budget, measuredBytes, metric, status: "fail" };
  }

  if (measuredBytes > budget.warningBytes) {
    return { ...budget, measuredBytes, metric, status: "warn" };
  }

  return { ...budget, measuredBytes, metric, status: "pass" };
}

/**
 * Returns the generated HTML output path for a route-class route.
 *
 * @param route Public route path.
 * @returns Build-output-relative HTML path.
 */
export function routeClassHtmlOutputPath(route: string): string {
  return route.endsWith(".xml")
    ? routeOutputPath(route)
    : routeIndexOutputPath(route);
}

function kibBudget(warningKib: number, failureKib: number): ByteBudget {
  return {
    failureBytes: failureKib * bytesPerKibibyte,
    warningBytes: warningKib * bytesPerKibibyte,
  };
}
