/** Progressive interaction surfaces with browser scripts. */
type InteractionSurfaceId =
  | "anchored-disclosure"
  | "anchored-positioning-engine"
  | "anchored-positioning-loader"
  | "article-citation"
  | "article-image-inspector"
  | "article-reference-preview"
  | "article-share"
  | "article-table-of-contents"
  | "home-featured-carousel"
  | "horizontal-scroll-rail"
  | "search-page"
  | "site-header-offset"
  | "theme";

/** When an interaction script should be allowed to load. */
type InteractionLoadPolicy =
  | "content-gated"
  | "idle-warmup-or-intent"
  | "immediate-document-state"
  | "page-only";

/** Keyboard/touch/fallback accessibility contract for a script surface. */
interface InteractionAccessibilityPolicy {
  readonly keyboard: boolean;
  readonly noJsFallback: string;
  readonly reducedMotion: boolean;
  readonly touch: boolean;
}

/** Registry entry for one progressive interaction script. */
export interface InteractionSurfacePolicy {
  readonly accessibility: InteractionAccessibilityPolicy;
  readonly id: InteractionSurfaceId;
  readonly loadPolicy: InteractionLoadPolicy;
  readonly scriptPath: `src/scripts/${string}.ts`;
}

export const interactionSurfacePolicies = [
  {
    accessibility: {
      keyboard: true,
      noJsFallback: "Links remain navigable; hover is only enhancement.",
      reducedMotion: true,
      touch: true,
    },
    id: "anchored-disclosure",
    loadPolicy: "content-gated",
    scriptPath: "src/scripts/anchored-disclosure.ts",
  },
  {
    accessibility: {
      keyboard: true,
      noJsFallback: "Anchored panels remain in the document or use links.",
      reducedMotion: true,
      touch: true,
    },
    id: "anchored-positioning-loader",
    loadPolicy: "idle-warmup-or-intent",
    scriptPath: "src/scripts/anchored-positioning-loader.ts",
  },
  {
    accessibility: {
      keyboard: true,
      noJsFallback: "Anchored panels remain reachable in document order.",
      reducedMotion: true,
      touch: true,
    },
    id: "anchored-positioning-engine",
    loadPolicy: "idle-warmup-or-intent",
    scriptPath: "src/scripts/anchored-positioning.ts",
  },
  {
    accessibility: {
      keyboard: true,
      noJsFallback: "Citation text remains visible and selectable.",
      reducedMotion: true,
      touch: true,
    },
    id: "article-citation",
    loadPolicy: "content-gated",
    scriptPath: "src/scripts/article-citation-copy.ts",
  },
  {
    accessibility: {
      keyboard: true,
      noJsFallback: "Article images remain visible links or static figures.",
      reducedMotion: true,
      touch: true,
    },
    id: "article-image-inspector",
    loadPolicy: "content-gated",
    scriptPath: "src/scripts/article-image-inspector.ts",
  },
  {
    accessibility: {
      keyboard: true,
      noJsFallback: "Citation and footnote links still navigate.",
      reducedMotion: true,
      touch: true,
    },
    id: "article-reference-preview",
    loadPolicy: "content-gated",
    scriptPath: "src/scripts/article-reference-previews.ts",
  },
  {
    accessibility: {
      keyboard: true,
      noJsFallback: "Share links and article URL remain accessible.",
      reducedMotion: true,
      touch: true,
    },
    id: "article-share",
    loadPolicy: "content-gated",
    scriptPath: "src/scripts/article-share.ts",
  },
  {
    accessibility: {
      keyboard: true,
      noJsFallback: "Contents links remain visible in article markup.",
      reducedMotion: true,
      touch: true,
    },
    id: "article-table-of-contents",
    loadPolicy: "content-gated",
    scriptPath: "src/scripts/article-table-of-contents.ts",
  },
  {
    accessibility: {
      keyboard: true,
      noJsFallback: "All featured slides are static article links.",
      reducedMotion: true,
      touch: true,
    },
    id: "home-featured-carousel",
    loadPolicy: "content-gated",
    scriptPath: "src/scripts/home-featured-carousel.ts",
  },
  {
    accessibility: {
      keyboard: true,
      noJsFallback: "The rail remains horizontally scrollable.",
      reducedMotion: true,
      touch: true,
    },
    id: "horizontal-scroll-rail",
    loadPolicy: "content-gated",
    scriptPath: "src/scripts/horizontal-scroll-rail.ts",
  },
  {
    accessibility: {
      keyboard: true,
      noJsFallback: "The search page still exposes its search form.",
      reducedMotion: true,
      touch: true,
    },
    id: "search-page",
    loadPolicy: "page-only",
    scriptPath: "src/scripts/search-page.ts",
  },
  {
    accessibility: {
      keyboard: false,
      noJsFallback: "Sticky header layout keeps its CSS fallback offset.",
      reducedMotion: true,
      touch: false,
    },
    id: "site-header-offset",
    loadPolicy: "immediate-document-state",
    scriptPath: "src/scripts/site-header-offset.ts",
  },
  {
    accessibility: {
      keyboard: true,
      noJsFallback: "The page renders in the default light theme.",
      reducedMotion: true,
      touch: true,
    },
    id: "theme",
    loadPolicy: "immediate-document-state",
    scriptPath: "src/scripts/theme.ts",
  },
] as const satisfies readonly InteractionSurfacePolicy[];

/**
 * Returns the script paths that must have interaction-policy coverage.
 *
 * @returns Sorted script paths.
 */
export function interactionPolicyScriptPaths(): string[] {
  return interactionSurfacePolicies
    .map((policy) => policy.scriptPath)
    .sort((left, right) => left.localeCompare(right));
}
