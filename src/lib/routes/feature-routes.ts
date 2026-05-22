import type { SiteConfig, SiteRouteKey } from "../site/site-config";
import {
  routeOwnsPathname,
  routeRegistryEntries,
  type RouteRegistryEntry,
  type RouteRegistryFeatureKey,
} from "./route-registry";

/** Optional features that own a generated route surface. */
type OptionalRouteFeatureKey = RouteRegistryFeatureKey;

/** Generated-output kind for an optional feature route. */
type OptionalRouteOutputKind = "directory" | "file";

/** Normalized route metadata for an optional feature. */
export interface OptionalFeatureRouteEntry {
  readonly enabled: boolean;
  readonly feature: OptionalRouteFeatureKey;
  readonly outputKind: OptionalRouteOutputKind;
  readonly outputPath: string;
  readonly route: string;
  readonly routeKey: SiteRouteKey;
}

/**
 * Returns optional route entries controlled by site feature flags.
 *
 * @param config Validated site config.
 * @returns Optional feature routes with normalized generated-output paths.
 */
export function optionalFeatureRouteEntries(
  config: SiteConfig,
): OptionalFeatureRouteEntry[] {
  return routeRegistryEntries(config)
    .filter(optionalFeatureRouteEntry)
    .map(({ enabled, feature, outputKind, outputPath, route, routeKey }) => ({
      enabled,
      feature,
      outputKind,
      outputPath,
      route,
      routeKey,
    }));
}

/**
 * Checks whether a rendered pathname belongs to a configured optional route.
 *
 * @param pathname Rendered URL pathname.
 * @param route Configured route path.
 * @returns True when the route owns the pathname.
 */
export function optionalRouteOwnsPathname(
  pathname: string,
  route: string,
): boolean {
  return routeOwnsPathname(pathname, route);
}

function optionalFeatureRouteEntry(
  entry: RouteRegistryEntry,
): entry is RouteRegistryEntry & { readonly feature: OptionalRouteFeatureKey } {
  return entry.feature !== undefined;
}
