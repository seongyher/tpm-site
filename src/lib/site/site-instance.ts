import path from "node:path";

const DEFAULT_SITE_INSTANCE_ROOT = "site";
const DEFAULT_SITE_OUTPUT_DIR = "dist";

/** Site-instance filesystem paths normalized for platform and tooling code. */
export interface SiteInstancePaths {
  readonly assets: {
    readonly articles: string;
    readonly root: string;
    readonly shared: string;
    readonly site: string;
  };
  readonly config: {
    readonly redirects: string;
    readonly site: string;
  };
  readonly content: {
    readonly announcements: string;
    readonly articles: string;
    readonly authors: string;
    readonly categories: string;
    readonly collections: string;
    readonly pages: string;
  };
  readonly output: {
    readonly dist: string;
  };
  readonly public: string;
  readonly root: string;
  readonly theme: string;
  readonly unusedAssets: string;
}

/** Inputs for resolving a site-instance path model. */
interface SiteInstancePathOptions {
  readonly cwd?: string | undefined;
  readonly outputDir?: string | undefined;
  readonly siteInstanceRoot?: string | undefined;
}

/** Current site-instance paths for build-time platform code. */
export const siteInstance = resolveSiteInstancePaths({
  outputDir: process.env["SITE_OUTPUT_DIR"],
  siteInstanceRoot: process.env["SITE_INSTANCE_ROOT"],
});

/**
 * Resolves all known site-instance roots from a project cwd and optional
 * `SITE_INSTANCE_ROOT` override.
 *
 * @param options Optional cwd and instance-root override.
 * @returns Absolute site-instance paths.
 */
export function resolveSiteInstancePaths(
  options: SiteInstancePathOptions = {},
): SiteInstancePaths {
  const cwd = options.cwd ?? process.cwd();
  const root = path.resolve(
    cwd,
    normalizedSiteRoot(
      options.siteInstanceRoot ?? process.env["SITE_INSTANCE_ROOT"],
    ),
  );
  const contentRoot = path.join(root, "content");
  const assetsRoot = path.join(root, "assets");

  return {
    assets: {
      articles: path.join(assetsRoot, "articles"),
      root: assetsRoot,
      shared: path.join(assetsRoot, "shared"),
      site: path.join(assetsRoot, "site"),
    },
    config: {
      redirects: path.join(root, "config", "redirects.json"),
      site: path.join(root, "config", "site.json"),
    },
    content: {
      announcements: path.join(contentRoot, "announcements"),
      articles: path.join(contentRoot, "articles"),
      authors: path.join(contentRoot, "authors"),
      categories: path.join(contentRoot, "categories"),
      collections: path.join(contentRoot, "collections"),
      pages: path.join(contentRoot, "pages"),
    },
    output: {
      dist: path.resolve(
        cwd,
        normalizedOutputDir(
          options.outputDir ?? process.env["SITE_OUTPUT_DIR"],
        ),
      ),
    },
    public: path.join(root, "public"),
    root,
    theme: path.join(root, "theme.css"),
    unusedAssets: path.join(root, "unused-assets"),
  };
}

/**
 * Formats a path relative to the current project for author-facing messages.
 *
 * @param absolutePath Absolute filesystem path.
 * @param cwd Current project directory.
 * @returns Relative path when possible.
 */
export function projectRelativePath(
  absolutePath: string,
  cwd = process.cwd(),
): string {
  const relativePath = path.relative(cwd, absolutePath);

  return relativePath.length === 0 ? "." : relativePath;
}

function normalizedOutputDir(value: string | undefined): string {
  const trimmed = value?.trim();

  return trimmed === undefined || trimmed.length === 0
    ? DEFAULT_SITE_OUTPUT_DIR
    : trimmed;
}

function normalizedSiteRoot(value: string | undefined): string {
  const trimmed = value?.trim();

  return trimmed === undefined || trimmed.length === 0
    ? DEFAULT_SITE_INSTANCE_ROOT
    : trimmed;
}
