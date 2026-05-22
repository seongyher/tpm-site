/** Lifecycle state for one performance workbench track. */
type PerformanceWorkbenchState =
  | "experiment-only"
  | "production-adopted"
  | "release-gated";

/** Stable identifiers for performance workbench tracks. */
type PerformanceWorkbenchTrackId =
  | "cache-policy"
  | "critical-css"
  | "html-minification"
  | "post-build-optimization"
  | "resource-priority"
  | "route-class-payload"
  | "vite-build-options";

/** One reproducible performance experiment or promoted budget track. */
export interface PerformanceWorkbenchTrack {
  readonly decisionRule: string;
  readonly docs: readonly string[];
  readonly id: PerformanceWorkbenchTrackId;
  readonly label: string;
  readonly promotionGate: string;
  readonly rollbackRule: string;
  readonly scripts: readonly string[];
  readonly state: PerformanceWorkbenchState;
}

export const performanceWorkbenchTracks = [
  {
    decisionRule:
      "Adopt only if a copied-output experiment shows route-class wins that outweigh lost shared CSS cacheability.",
    docs: [
      "docs/performance/performance-workbench.md",
      "docs/performance/unlighthouse-audit-2026-05-17.md",
    ],
    id: "critical-css",
    label: "Critical CSS extraction",
    promotionGate:
      "HTML validation, build verification, browser tests, accessibility tests, payload report, and release checks.",
    rollbackRule:
      "Remove the critical-CSS post-process and return to shared hashed CSS when route payload or validation regresses.",
    scripts: ["payload:critical-css:experiment"],
    state: "experiment-only",
  },
  {
    decisionRule:
      "Adopt only after route-specific LCP evidence proves the hinted resource is stable and first-viewport critical.",
    docs: [
      "docs/performance/performance-workbench.md",
      "docs/performance/route-class-performance-budgets.md",
    ],
    id: "resource-priority",
    label: "Preload and fetch priority",
    promotionGate:
      "Route-class Lighthouse evidence, generated HTML review, browser tests, and payload report.",
    rollbackRule:
      "Remove the hint when the LCP element changes, a route class stops using it, or it competes with more critical resources.",
    scripts: [],
    state: "experiment-only",
  },
  {
    decisionRule:
      "Keep hashed Astro assets immutable and only broaden cache policy when generated-output checks prove the files are fingerprinted or intentionally stable.",
    docs: [
      "docs/performance/performance-workbench.md",
      "docs/performance/route-class-performance-budgets.md",
    ],
    id: "cache-policy",
    label: "Cache policy",
    promotionGate:
      "Payload report cache-header evidence, build verification, and release checks.",
    rollbackRule:
      "Remove or narrow headers when a path pattern includes mutable, author-managed, or unfingerprinted output.",
    scripts: ["payload:check", "payload:report"],
    state: "release-gated",
  },
  {
    decisionRule:
      "Treat route-class HTML, PDF, and cache budgets as deterministic release evidence; keep noisy browser timings warning-only until stable.",
    docs: [
      "docs/performance/performance-workbench.md",
      "docs/performance/route-class-performance-budgets.md",
    ],
    id: "route-class-payload",
    label: "Route-class payload budgets",
    promotionGate:
      "Payload report must run on optimized release output and fail only on deterministic budget failures.",
    rollbackRule:
      "Loosen or demote a budget only after documenting why the route class changed and adding a more precise future metric if needed.",
    scripts: ["payload:check", "payload:report"],
    state: "release-gated",
  },
  {
    decisionRule:
      "Adopt only when every scenario gate passes and compressed output wins are meaningful on optimized build output.",
    docs: [
      "docs/performance/performance-workbench.md",
      "docs/performance/post-build-optimization-plan.md",
      "docs/performance/post-build-optimization-experiments.md",
    ],
    id: "post-build-optimization",
    label: "Post-build optimization stack",
    promotionGate:
      "Strict HTML validation, build verification, browser tests, accessibility tests, and release checks.",
    rollbackRule:
      "Disable the specific optimizer scenario that causes validation, behavior, or payload regression.",
    scripts: ["payload:postbuild:experiments"],
    state: "production-adopted",
  },
  {
    decisionRule:
      "Adopt only after temporary Astro/Vite config scenarios pass all gates and reduce compressed output without route or search regressions.",
    docs: [
      "docs/performance/performance-workbench.md",
      "docs/performance/vite-build-optimization-plan.md",
      "docs/performance/vite-build-experiments.md",
    ],
    id: "vite-build-options",
    label: "Vite build options",
    promotionGate:
      "Pagefind, strict HTML validation, build verification, payload report, and release checks.",
    rollbackRule:
      "Revert the Astro/Vite config fragment and rerun the route-class payload report.",
    scripts: ["payload:vite:experiments"],
    state: "experiment-only",
  },
  {
    decisionRule:
      "Keep HTML minification off production until a named scenario validates cleanly and preserves semantic generated output.",
    docs: [
      "docs/performance/performance-workbench.md",
      "docs/performance/minify-html-adoption-plan.md",
      "docs/performance/minify-html-experiments.md",
    ],
    id: "html-minification",
    label: "HTML minification",
    promotionGate:
      "Strict HTML validation, build verification, representative browser tests, payload report, and release checks.",
    rollbackRule:
      "Remove the minify-html scenario and keep raw Astro HTML when validation or machine-readable output regresses.",
    scripts: [
      "payload:minify-html:experiment",
      "payload:minify-html:experiments",
    ],
    state: "experiment-only",
  },
] as const satisfies readonly PerformanceWorkbenchTrack[];

/**
 * Returns every package script owned by the performance workbench.
 *
 * @returns Sorted unique package script names.
 */
export function performanceWorkbenchScriptNames(): string[] {
  return Array.from(
    new Set(
      performanceWorkbenchTracks.flatMap((track) => Array.from(track.scripts)),
    ),
  ).sort((left, right) => left.localeCompare(right));
}
