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
  readonly sourceArtifacts: SourceArtifactManifest;
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

  return {
    config,
    paths,
    sourceArtifacts: sourceArtifactManifest(paths, { cwd: options.cwd }),
  };
}
