import {
  routeRegistryEntries,
  type RouteRegistryEntry,
} from "./route-registry";
import { type SiteConfig, siteConfig } from "./site-config";
import { siteInstance, type SiteInstancePaths } from "./site-instance";
import {
  type SourceArtifactManifest,
  sourceArtifactManifest,
} from "./source-artifacts";

/** Platform-wide context for one active site instance. */
export interface PlatformContext {
  readonly config: SiteConfig;
  readonly paths: SiteInstancePaths;
  readonly routeRegistry: readonly RouteRegistryEntry[];
  readonly sourceArtifacts: SourceArtifactManifest;
}

/** Narrow context for modules that only need source/artifact ownership. */
export interface PlatformArtifactContext {
  readonly paths: SiteInstancePaths;
  readonly sourceArtifacts: SourceArtifactManifest;
}

/** Narrow context for modules that only need route registry facts. */
export interface PlatformRouteContext {
  readonly config: SiteConfig;
  readonly disabledRoutes: readonly RouteRegistryEntry[];
  readonly enabledRoutes: readonly RouteRegistryEntry[];
  readonly routeRegistry: readonly RouteRegistryEntry[];
}

/** Narrow context for article compiler consumers. */
export interface PlatformArticleCompilerContext {
  readonly config: Pick<SiteConfig, "contentDefaults" | "features" | "routes">;
}

/** Inputs for composing an explicit platform context. */
export interface PlatformContextOptions {
  readonly config?: SiteConfig | undefined;
  readonly cwd?: string | undefined;
  readonly paths?: SiteInstancePaths | undefined;
}

/** Default platform context for the active site instance. */
export const platformContext = createPlatformContext({
  config: siteConfig,
  paths: siteInstance,
});

/**
 * Creates a platform context from explicit dependencies.
 *
 * @param options Optional config, paths, and cwd overrides.
 * @returns Context object consumed by platform helpers and tooling.
 */
export function createPlatformContext(
  options: PlatformContextOptions = {},
): PlatformContext {
  const paths = options.paths ?? siteInstance;
  const config = options.config ?? siteConfig;
  const routeRegistry = routeRegistryEntries(config);

  return {
    config,
    paths,
    routeRegistry,
    sourceArtifacts: sourceArtifactManifest(paths, {
      config,
      cwd: options.cwd,
    }),
  };
}

/**
 * Narrows a platform context to source/artifact ownership facts.
 *
 * @param context Full platform context.
 * @returns Source/artifact-only context slice.
 */
export function platformArtifactContext(
  context: PlatformContext = platformContext,
): PlatformArtifactContext {
  return {
    paths: context.paths,
    sourceArtifacts: context.sourceArtifacts,
  };
}

/**
 * Narrows a platform context to route registry facts.
 *
 * @param context Full platform context.
 * @returns Route-registry context slice.
 */
export function platformRouteContext(
  context: PlatformContext = platformContext,
): PlatformRouteContext {
  return {
    config: context.config,
    disabledRoutes: context.routeRegistry.filter((entry) => !entry.enabled),
    enabledRoutes: context.routeRegistry.filter((entry) => entry.enabled),
    routeRegistry: context.routeRegistry,
  };
}

/**
 * Narrows a platform context to article compiler policy.
 *
 * @param context Full platform context.
 * @returns Article-compiler context slice.
 */
export function platformArticleCompilerContext(
  context: PlatformContext = platformContext,
): PlatformArticleCompilerContext {
  return {
    config: context.config,
  };
}
