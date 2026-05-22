import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import {
  type AuthorDiagnostic,
  type AuthorDiagnosticCategory,
  type AuthorDiagnosticCode,
  type AuthorDiagnosticRepairOwner,
  createAuthorDiagnostic,
  createAuthorDiagnosticReport,
} from "../../src/lib/author-diagnostics";
import {
  createPlatformContext,
  type PlatformContext,
} from "../../src/lib/platform-context";
import { routeRegistryEntries } from "../../src/lib/route-registry";
import { type SiteConfig, siteConfig } from "../../src/lib/site-config";
import {
  projectRelativePath,
  siteInstance,
  type SiteInstancePaths,
} from "../../src/lib/site-instance";
import { parseSiteRedirects } from "../../src/lib/site-redirects";

type RouteKey = keyof SiteConfig["routes"];

type Severity = "error" | "warning";

interface SiteDoctorCliIo {
  stderr: Pick<typeof process.stderr, "write">;
  stdout: Pick<typeof process.stdout, "write">;
}

interface SiteDoctorOptions {
  config?: SiteConfig | undefined;
  context?: PlatformContext | undefined;
  exists?: ((targetPath: string) => boolean) | undefined;
  paths?: SiteInstancePaths | undefined;
}

interface PublishableSourceFact {
  author?: string | undefined;
  category?: string | undefined;
  draft: boolean;
  file: string;
  id: string;
  legacyPermalink?: string | undefined;
  route: string;
}

interface CollectionSourceFact {
  draft: boolean;
  file: string;
  id: string;
  items: readonly string[];
}

interface SiteDoctorSourceFacts {
  announcements: readonly PublishableSourceFact[];
  articles: readonly PublishableSourceFact[];
  authorAliases: ReadonlySet<string>;
  categoryIds: ReadonlySet<string>;
  collections: readonly CollectionSourceFact[];
  publishableIds: ReadonlySet<string>;
}

/** Webmaster-facing diagnostic emitted by `site:doctor`. */
export interface SiteDoctorIssue {
  message: string;
  path?: string | undefined;
  repair: string;
  severity: Severity;
}

/**
 * Checks site-instance configuration relationships that basic schema parsing
 * cannot know about.
 *
 * @param options Site doctor dependencies.
 * @param options.config Parsed site config.
 * @param options.exists Filesystem existence hook.
 * @param options.paths Site-instance filesystem paths.
 * @returns Webmaster-facing site diagnostics.
 */
export function siteDoctorIssues(
  options: SiteDoctorOptions = {},
): SiteDoctorIssue[] {
  const context =
    options.context ??
    createPlatformContext({
      config: options.config ?? siteConfig,
      paths: options.paths ?? siteInstance,
    });
  const config = context.config;
  const exists = options.exists ?? existsSync;

  return [
    ...siteInstancePathIssues(context, exists),
    ...routeShapeIssues(config),
    ...homepageCollectionIssues(context.paths, config, exists),
    ...disabledFeatureNavigationIssues(config),
    ...sourceRelationshipIssues(context, exists),
  ];
}

/**
 * Converts current site-doctor issues into the shared author-diagnostic
 * taxonomy without changing the existing CLI output contract.
 *
 * @param options Site doctor dependencies.
 * @returns JSON-ready author-facing diagnostics.
 */
export function siteDoctorAuthorDiagnostics(
  options: SiteDoctorOptions = {},
): AuthorDiagnostic[] {
  return siteDoctorIssuesToAuthorDiagnostics(siteDoctorIssues(options));
}

/**
 * Runs the site doctor CLI.
 *
 * @param args CLI arguments.
 * @param io Output writers.
 * @returns Process exit code.
 */
export function runSiteDoctorCli(
  args = Bun.argv.slice(2),
  io: SiteDoctorCliIo = {
    stderr: process.stderr,
    stdout: process.stdout,
  },
): number {
  if (args.includes("--help")) {
    io.stdout.write(usage());

    return 0;
  }

  const json = args.includes("--json");
  const quiet = args.includes("--quiet");
  const issues = siteDoctorIssues();
  const errorCount = issues.filter(
    (issue) => issue.severity === "error",
  ).length;

  if (json) {
    io.stdout.write(
      `${JSON.stringify(
        createAuthorDiagnosticReport(
          siteDoctorIssuesToAuthorDiagnostics(issues),
        ),
        null,
        2,
      )}\n`,
    );

    return errorCount > 0 ? 1 : 0;
  }

  if (issues.length === 0) {
    if (!quiet) {
      io.stdout.write("Site doctor passed.\n");
    }

    return 0;
  }

  const report = formatSiteDoctorIssues(issues);

  if (!quiet || errorCount > 0) {
    const writer = errorCount > 0 ? io.stderr : io.stdout;
    writer.write(report);
  }

  return errorCount > 0 ? 1 : 0;
}

/**
 * Formats site doctor diagnostics for CLI output.
 *
 * @param issues Diagnostics to format.
 * @returns Human-readable report.
 */
export function formatSiteDoctorIssues(
  issues: readonly SiteDoctorIssue[],
): string {
  const lines = issues.map((issue) => {
    const label = issue.severity === "error" ? "Error" : "Warning";
    const pathLabel =
      issue.path === undefined
        ? ""
        : `\n   Path: ${projectRelativePath(issue.path)}`;

    return `${label}: ${issue.message}${pathLabel}\n   Fix: ${issue.repair}`;
  });

  return `${lines.join("\n\n")}\n`;
}

function siteInstancePathIssues(
  context: PlatformContext,
  exists: (targetPath: string) => boolean,
): SiteDoctorIssue[] {
  const requiredSources = context.sourceArtifacts.siteEditableSources.filter(
    (entry) => entry.required,
  );

  return requiredSources.flatMap((entry) =>
    exists(entry.absolutePath)
      ? []
      : [
          {
            message: `Missing ${entry.description}.`,
            path: entry.absolutePath,
            repair:
              "Create this file or directory in the active site instance, or update SITE_INSTANCE_ROOT to point at the intended site.",
            severity: "error" as const,
          },
        ],
  );
}

function siteDoctorIssueToAuthorDiagnostic(
  issue: SiteDoctorIssue,
): AuthorDiagnostic {
  const classification = classifySiteDoctorIssue(issue);

  return createAuthorDiagnostic({
    category: classification.category,
    code: classification.code,
    fixability: "source-edit",
    location: issue.path === undefined ? undefined : { sourcePath: issue.path },
    relatedDocs: classification.relatedDocs,
    remediation: issue.repair,
    repairOwner: classification.repairOwner,
    severity: issue.severity,
    source: "site-doctor",
    summary: issue.message,
  });
}

function siteDoctorIssuesToAuthorDiagnostics(
  issues: readonly SiteDoctorIssue[],
): AuthorDiagnostic[] {
  return issues.map(siteDoctorIssueToAuthorDiagnostic);
}

function classifySiteDoctorIssue(issue: SiteDoctorIssue): {
  category: AuthorDiagnosticCategory;
  code: AuthorDiagnosticCode;
  relatedDocs: readonly string[];
  repairOwner: AuthorDiagnosticRepairOwner;
} {
  const message = issue.message.toLowerCase();

  if (issue.message.startsWith("Missing ")) {
    return {
      category: "config",
      code: "config.site-source-missing",
      relatedDocs: ["docs/SITE_ANATOMY.md"],
      repairOwner: "site-owner",
    };
  }

  if (message.includes("author ")) {
    return {
      category: "content",
      code: "content.unknown-author-reference",
      relatedDocs: ["docs/AUTHORING_WORKFLOW.md", "docs/AUTHORS.md"],
      repairOwner: "author",
    };
  }

  if (message.includes("category ")) {
    return {
      category: "content",
      code: "content.unknown-category-reference",
      relatedDocs: ["docs/AUTHORING_WORKFLOW.md", "docs/TAGS.md"],
      repairOwner: "author",
    };
  }

  if (message.includes("collection item")) {
    return {
      category: "content",
      code: "content.unknown-collection-item",
      relatedDocs: ["docs/HOMEPAGE_CONTENT_MODEL.md"],
      repairOwner: "author",
    };
  }

  if (message.includes("draft collection")) {
    return {
      category: "config",
      code: "config.homepage-collection-draft",
      relatedDocs: ["docs/HOMEPAGE_CONTENT_MODEL.md"],
      repairOwner: "site-owner",
    };
  }

  if (message.includes("homepage")) {
    return {
      category: "config",
      code: "config.homepage-collection-missing",
      relatedDocs: ["docs/HOMEPAGE_CONTENT_MODEL.md"],
      repairOwner: "site-owner",
    };
  }

  if (message.includes("redirect")) {
    return {
      category: "redirects",
      code: "redirects.source-map-invalid",
      relatedDocs: ["docs/SOURCE_CONTRACTS.md"],
      repairOwner: "site-owner",
    };
  }

  if (message.includes("logo")) {
    return {
      category: "assets",
      code: "assets.configured-logo-missing",
      relatedDocs: ["docs/SITE_ANATOMY.md"],
      repairOwner: "site-owner",
    };
  }

  if (message.includes("disabled feature")) {
    return {
      category: "config",
      code: "config.disabled-feature-linked",
      relatedDocs: ["docs/SITE_ANATOMY.md"],
      repairOwner: "site-owner",
    };
  }

  if (message.includes("routes ")) {
    return {
      category: "routes",
      code: "routes.duplicate-configured-path",
      relatedDocs: ["docs/SOURCE_CONTRACTS.md"],
      repairOwner: "site-owner",
    };
  }

  if (message.includes("route")) {
    return {
      category: "routes",
      code: "routes.configured-shape-invalid",
      relatedDocs: ["docs/SOURCE_CONTRACTS.md"],
      repairOwner: "site-owner",
    };
  }

  return {
    category: "config",
    code: "config.site-doctor-issue",
    relatedDocs: ["docs/SITE_ANATOMY.md"],
    repairOwner: "site-owner",
  };
}

function routeShapeIssues(config: SiteConfig): SiteDoctorIssue[] {
  const routeEntries = routeEntriesForConfig(config);
  const duplicateIssues = duplicateRouteIssues(routeEntries);
  const shapeIssues = routeEntries.flatMap(([key, value]) => {
    if (key === "home") {
      return value === "/"
        ? []
        : [
            {
              message: "The home route must be `/`.",
              repair: "Set routes.home to `/`.",
              severity: "error" as const,
            },
          ];
    }

    if (key === "feed") {
      return value.endsWith(".xml")
        ? []
        : [
            {
              message: "The feed route should point at an XML file.",
              repair: "Set routes.feed to a path like `/feed.xml`.",
              severity: "error" as const,
            },
          ];
    }

    return value.endsWith("/")
      ? []
      : [
          {
            message: `Route ${key} should be trailing-slashed.`,
            repair: `Set routes.${key} to a path ending in /.`,
            severity: "error" as const,
          },
        ];
  });

  return [...duplicateIssues, ...shapeIssues];
}

function duplicateRouteIssues(
  routeEntries: ReadonlyArray<[RouteKey, string]>,
): SiteDoctorIssue[] {
  const routesByValue = new Map<string, RouteKey[]>();

  for (const [key, value] of routeEntries) {
    routesByValue.set(value, [...(routesByValue.get(value) ?? []), key]);
  }

  return Array.from(routesByValue.entries()).flatMap(([value, keys]) =>
    keys.length > 1
      ? [
          {
            message: `Routes ${keys.join(", ")} all point to ${value}.`,
            repair:
              "Give each configured route a distinct path so generated pages and navigation cannot collide.",
            severity: "error" as const,
          },
        ]
      : [],
  );
}

function homepageCollectionIssues(
  paths: SiteInstancePaths,
  config: SiteConfig,
  exists: (targetPath: string) => boolean,
): SiteDoctorIssue[] {
  const collectionIds = [
    {
      label: "featured collection",
      value: config.homepage.featuredCollection,
    },
    {
      label: "start-here collection",
      value: config.homepage.startHereCollection,
    },
  ];

  return collectionIds.flatMap(({ label, value }) => {
    const collectionPath = collectionSourcePath(
      paths.content.collections,
      value,
      exists,
    );

    return exists(collectionPath)
      ? []
      : [
          {
            message: `Homepage ${label} \`${value}\` does not exist.`,
            path: collectionPath,
            repair:
              "Create the configured collection file or update the homepage collection ID in site/config/site.json.",
            severity: "error" as const,
          },
        ];
  });
}

function disabledFeatureNavigationIssues(
  config: SiteConfig,
): SiteDoctorIssue[] {
  const links = [
    ...config.navigation.primary.map((link) => ({
      location: "primary navigation",
      ...link,
    })),
    ...config.navigation.footer.map((link) => ({
      location: "footer navigation",
      ...link,
    })),
    ...config.homepage.discoveryLinks.map((link) => ({
      href:
        link.href ??
        (link.route === undefined ? "" : config.routes[link.route]),
      label: link.label,
      location: "homepage discovery",
    })),
  ];
  const disabledFeatureRoutes = routeRegistryEntries(config).filter(
    (entry) =>
      entry.feature !== undefined &&
      !entry.enabled &&
      entry.surfaces.includes("disabled-feature-diagnostic"),
  );

  return links.flatMap((link) => {
    const disabledTarget = disabledFeatureRoutes.find(({ route }) =>
      linkTargetsRoute(link.href, route),
    );

    return disabledTarget === undefined
      ? []
      : [
          {
            message: `${link.location} link "${link.label}" points to disabled feature "${
              disabledTarget.feature ?? disabledTarget.routeKey
            }".`,
            repair:
              "Either enable the feature or remove this link from site/config/site.json.",
            severity: "error" as const,
          },
        ];
  });
}

function sourceRelationshipIssues(
  context: PlatformContext,
  exists: (targetPath: string) => boolean,
): SiteDoctorIssue[] {
  const facts = loadSiteDoctorSourceFacts(
    context.paths,
    context.config,
    exists,
  );

  return [
    ...configuredAssetReferenceIssues(context.paths, context.config, exists),
    ...publishableAuthorIssues(context.paths, facts),
    ...articleCategoryIssues(context.paths, facts, context.config),
    ...collectionItemIssues(facts),
    ...homepageCollectionDraftIssues(context.config, facts),
    ...redirectIntentIssues(context.paths, facts, exists),
  ];
}

function configuredAssetReferenceIssues(
  paths: SiteInstancePaths,
  config: SiteConfig,
  exists: (targetPath: string) => boolean,
): SiteDoctorIssue[] {
  const logo = config.identity.logo;

  if (logo?.startsWith("/") !== true) {
    return [];
  }

  const publicPath = sitePublicPath(paths, logo);

  return exists(publicPath)
    ? []
    : [
        {
          message: `Configured site logo ${logo} does not exist in site/public.`,
          path: publicPath,
          repair:
            "Add the logo file under site/public or update identity.logo in site/config/site.json.",
          severity: "error" as const,
        },
      ];
}

function publishableAuthorIssues(
  paths: SiteInstancePaths,
  facts: SiteDoctorSourceFacts,
): SiteDoctorIssue[] {
  return [...facts.articles, ...facts.announcements].flatMap((entry) => {
    if (entry.author === undefined || entry.author.trim() === "") {
      return [
        {
          message: `${sourceKindLabel(paths, entry.file)} ${entry.id} is missing an author.`,
          path: entry.file,
          repair:
            "Add an author in frontmatter that matches an author profile displayName or alias.",
          severity: "error" as const,
        },
      ];
    }

    return authorParts(entry.author).flatMap((author) =>
      facts.authorAliases.has(normalizeAuthorAlias(author))
        ? []
        : [
            {
              message: `${sourceKindLabel(paths, entry.file)} ${entry.id} references unknown author "${author}".`,
              path: entry.file,
              repair:
                "Add an author profile or alias under site/content/authors, or update the entry author frontmatter.",
              severity: "error" as const,
            },
          ],
    );
  });
}

function articleCategoryIssues(
  paths: SiteInstancePaths,
  facts: SiteDoctorSourceFacts,
  config: SiteConfig,
): SiteDoctorIssue[] {
  if (!config.features.categories) {
    return [];
  }

  return facts.articles.flatMap((entry) => {
    const category = entry.category;

    if (category === undefined || facts.categoryIds.has(category)) {
      return [];
    }

    return [
      {
        message: `Article ${entry.id} uses category "${category}" without category metadata.`,
        path: entry.file,
        repair: `Create ${path.join(
          paths.content.categories,
          `${category}.json`,
        )} or move the article into a category with metadata.`,
        severity: "error" as const,
      },
    ];
  });
}

function collectionItemIssues(facts: SiteDoctorSourceFacts): SiteDoctorIssue[] {
  return facts.collections.flatMap((collection) =>
    collection.items.flatMap((slug) =>
      facts.publishableIds.has(slug)
        ? []
        : [
            {
              message: `Collection item "${slug}" in ${collection.id} does not match an article or announcement.`,
              path: collection.file,
              repair:
                "Update the collection item slug, or add the missing article or announcement.",
              severity: "error" as const,
            },
          ],
    ),
  );
}

function homepageCollectionDraftIssues(
  config: SiteConfig,
  facts: SiteDoctorSourceFacts,
): SiteDoctorIssue[] {
  const homepageCollectionIds = new Set([
    config.homepage.featuredCollection,
    config.homepage.startHereCollection,
  ]);

  return facts.collections.flatMap((collection) =>
    collection.draft && homepageCollectionIds.has(collection.id)
      ? [
          {
            message: `Homepage draft collection "${collection.id}" is selected for the homepage.`,
            path: collection.file,
            repair:
              "Set draft: false on the collection or update the homepage collection ID in site/config/site.json.",
            severity: "error" as const,
          },
        ]
      : [],
  );
}

function redirectIntentIssues(
  paths: SiteInstancePaths,
  facts: SiteDoctorSourceFacts,
  exists: (targetPath: string) => boolean,
): SiteDoctorIssue[] {
  const redirectFile = paths.config.redirects;

  if (!exists(redirectFile)) {
    return [];
  }

  const parsed = readSiteRedirects(redirectFile);

  if (parsed.kind === "invalid") {
    return [
      {
        message: `Site redirects could not be parsed: ${parsed.message}`,
        path: redirectFile,
        repair:
          "Fix site/config/redirects.json so it is valid JSON with site-path sources and site-path or absolute-URL destinations.",
        severity: "error" as const,
      },
    ];
  }

  const configuredRules = Object.entries(parsed.redirects).map(
    ([source, destination]) => ({
      destination: destination.trim(),
      file: redirectFile,
      source: normalizeRedirectSource(source),
    }),
  );
  const legacyRules = legacyRedirectRules(facts);
  const allRules = [...configuredRules, ...legacyRules];

  return [
    ...redirectSelfReferenceIssues(allRules),
    ...redirectChainIssues(allRules),
    ...redirectConflictIssues(allRules),
    ...redirectLimitIssues(allRules, redirectFile),
  ];
}

function loadSiteDoctorSourceFacts(
  paths: SiteInstancePaths,
  config: SiteConfig,
  exists: (targetPath: string) => boolean,
): SiteDoctorSourceFacts {
  const articles = publishableFactsFromDir({
    dir: paths.content.articles,
    exists,
    routePrefix: config.routes.articles,
    withCategory: true,
  });
  const announcements = config.features.announcements
    ? publishableFactsFromDir({
        dir: paths.content.announcements,
        exists,
        routePrefix: config.routes.announcements,
        withCategory: false,
      })
    : [];
  const categoryIds = idsFromFiles(
    paths.content.categories,
    exists,
    /\.json$/iu,
  );
  const authorAliases = authorAliasesFromDir(paths.content.authors, exists);
  const collections = collectionFactsFromDir(paths.content.collections, exists);
  const publishableIds = new Set(
    [...articles, ...announcements].map((entry) => entry.id),
  );
  return {
    announcements,
    articles,
    authorAliases,
    categoryIds,
    collections,
    publishableIds,
  };
}

function publishableFactsFromDir({
  dir,
  exists,
  routePrefix,
  withCategory,
}: {
  dir: string;
  exists: (targetPath: string) => boolean;
  routePrefix: string;
  withCategory: boolean;
}): PublishableSourceFact[] {
  return listFilesSync(dir, exists, /\.mdx?$/iu).map((file) => {
    const data = frontmatterData(file);
    const id = filenameStem(file);

    return {
      author: stringValue(data["author"]),
      category: withCategory
        ? firstPathSegment(path.relative(dir, file))
        : undefined,
      draft: data["draft"] === true,
      file,
      id,
      legacyPermalink: stringValue(data["legacyPermalink"]),
      route: withTrailingSlash(path.posix.join(routePrefix, id)),
    };
  });
}

function collectionFactsFromDir(
  dir: string,
  exists: (targetPath: string) => boolean,
): CollectionSourceFact[] {
  return listFilesSync(dir, exists, /\.mdx?$/iu).map((file) => {
    const data = frontmatterData(file);

    return {
      draft: data["draft"] === true,
      file,
      id: filenameStem(file),
      items: collectionItemSlugs(data["items"]),
    };
  });
}

function authorAliasesFromDir(
  dir: string,
  exists: (targetPath: string) => boolean,
): Set<string> {
  const aliases = new Set<string>();

  listFilesSync(dir, exists, /\.md$/iu).forEach((file) => {
    const data = frontmatterData(file);
    const displayName = stringValue(data["displayName"]);

    if (displayName !== undefined) {
      aliases.add(normalizeAuthorAlias(displayName));
    }

    aliases.add(normalizeAuthorAlias(filenameStem(file)));

    const frontmatterAliases = data["aliases"];

    if (Array.isArray(frontmatterAliases)) {
      frontmatterAliases
        .filter((alias): alias is string => typeof alias === "string")
        .forEach((alias) => aliases.add(normalizeAuthorAlias(alias)));
    }
  });

  return aliases;
}

function idsFromFiles(
  dir: string,
  exists: (targetPath: string) => boolean,
  pattern: RegExp,
): Set<string> {
  return new Set(listFilesSync(dir, exists, pattern).map(filenameStem));
}

function legacyRedirectRules(
  facts: SiteDoctorSourceFacts,
): Array<{ destination: string; file: string; source: string }> {
  return [...facts.articles, ...facts.announcements].flatMap((entry) => {
    const legacyPermalink = entry.legacyPermalink;

    if (legacyPermalink === undefined) {
      return [];
    }

    return [
      {
        destination: entry.route,
        file: entry.file,
        source: normalizeRedirectSource(legacyPermalink),
      },
    ];
  });
}

function redirectSelfReferenceIssues(
  rules: ReadonlyArray<{ destination: string; file: string; source: string }>,
): SiteDoctorIssue[] {
  return rules.flatMap((rule) =>
    normalizeRedirectSource(rule.destination) === rule.source
      ? [
          {
            message: `Redirect ${rule.source} points to itself.`,
            path: rule.file,
            repair:
              "Update the redirect destination so it points at the current canonical URL.",
            severity: "error" as const,
          },
        ]
      : [],
  );
}

function redirectChainIssues(
  rules: ReadonlyArray<{ destination: string; file: string; source: string }>,
): SiteDoctorIssue[] {
  const sources = new Set(rules.map((rule) => rule.source));

  return rules.flatMap((rule) =>
    isSitePath(rule.destination) &&
    sources.has(normalizeRedirectSource(rule.destination))
      ? [
          {
            message: `Redirect ${rule.source} points at another redirect ${normalizeRedirectSource(
              rule.destination,
            )}.`,
            path: rule.file,
            repair:
              "Point the redirect directly at its final canonical destination.",
            severity: "error" as const,
          },
        ]
      : [],
  );
}

function redirectConflictIssues(
  rules: ReadonlyArray<{ destination: string; file: string; source: string }>,
): SiteDoctorIssue[] {
  const bySource = new Map<
    string,
    Array<{ destination: string; file: string }>
  >();

  rules.forEach((rule) => {
    bySource.set(rule.source, [
      ...(bySource.get(rule.source) ?? []),
      { destination: rule.destination, file: rule.file },
    ]);
  });

  return Array.from(bySource.entries()).flatMap(([source, entries]) => {
    const destinations = new Set(entries.map((entry) => entry.destination));

    return destinations.size > 1
      ? [
          {
            message: `Redirect ${source} has conflicting destinations: ${Array.from(
              destinations,
            ).join(", ")}.`,
            path: entries[0]?.file,
            repair:
              "Keep one canonical destination for each redirect source across site/config/redirects.json and legacyPermalink frontmatter.",
            severity: "error" as const,
          },
        ]
      : [];
  });
}

function redirectLimitIssues(
  rules: ReadonlyArray<{ destination: string; source: string }>,
  redirectFile: string,
): SiteDoctorIssue[] {
  const maxStaticRedirects = 2_000;
  const maxLineLength = 1_000;
  const countIssues =
    rules.length > maxStaticRedirects
      ? [
          {
            message: `Configured redirects exceed Cloudflare's ${maxStaticRedirects} static redirect limit.`,
            path: redirectFile,
            repair:
              "Reduce static redirects or move advanced redirect behavior into a deploy-provider adapter.",
            severity: "error" as const,
          },
        ]
      : [];
  const oversized = rules.find(
    (rule) => `${rule.source} ${rule.destination} 301`.length > maxLineLength,
  );
  const lineIssues =
    oversized === undefined
      ? []
      : [
          {
            message: `Redirect ${oversized.source} exceeds Cloudflare's ${maxLineLength}-character static redirect line limit.`,
            path: redirectFile,
            repair:
              "Shorten the redirect source or destination, or move advanced redirect behavior into a deploy-provider adapter.",
            severity: "error" as const,
          },
        ];

  return [...countIssues, ...lineIssues];
}

function readSiteRedirects(
  file: string,
):
  | { kind: "invalid"; message: string }
  | { kind: "valid"; redirects: Readonly<Record<string, string>> } {
  try {
    const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;

    return { kind: "valid", redirects: parseSiteRedirects(raw) };
  } catch (error) {
    return {
      kind: "invalid",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function listFilesSync(
  dir: string,
  exists: (targetPath: string) => boolean,
  pattern: RegExp,
): string[] {
  if (!exists(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return listFilesSync(fullPath, exists, pattern);
      }

      return pattern.test(entry.name) ? [fullPath] : [];
    })
    .sort((left, right) => left.localeCompare(right));
}

function frontmatterData(file: string): Record<string, unknown> {
  const rawData: unknown = matter(readFileSync(file, "utf8")).data;

  return isRecord(rawData) ? rawData : {};
}

function collectionItemSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item === "string") {
      return [item];
    }

    if (isRecord(item) && typeof item["slug"] === "string") {
      return [item["slug"]];
    }

    return [];
  });
}

function authorParts(value: string): string[] {
  return value
    .split(/\s*&\s*/u)
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

function firstPathSegment(relativePath: string): string | undefined {
  const normalized = relativePath.split(path.sep).join("/");
  const segments = normalized.split("/");

  return segments.length > 1 ? segments[0] : undefined;
}

function filenameStem(file: string): string {
  return path.basename(file).replace(/\.(?:json|md|mdx)$/iu, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSitePath(value: string): boolean {
  return value.startsWith("/");
}

function normalizeAuthorAlias(value: string): string {
  return value.trim().replace(/\s+/gu, " ").toLowerCase();
}

function normalizeRedirectSource(value: string): string {
  const withoutQuery = value.split("#")[0]?.split("?")[0] ?? value;
  const pathname = withoutQuery.startsWith("/")
    ? withoutQuery
    : `/${withoutQuery}`;

  return withTrailingSlash(pathname.replace(/\/{2,}/gu, "/"));
}

function sitePublicPath(paths: SiteInstancePaths, sitePath: string): string {
  const cleaned = sitePath.split("#")[0]?.split("?")[0]?.replace(/^\/+/u, "");

  return path.join(paths.public, cleaned ?? "");
}

function sourceKindLabel(paths: SiteInstancePaths, file: string): string {
  return file.startsWith(paths.content.announcements)
    ? "Announcement"
    : "Article";
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function withTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function routeEntriesForConfig(config: SiteConfig): Array<[RouteKey, string]> {
  return routeRegistryEntries(config).map((entry) => [
    entry.routeKey,
    entry.route,
  ]);
}

function collectionSourcePath(
  collectionRoot: string,
  collectionId: string,
  exists: (targetPath: string) => boolean,
) {
  const stemPath = path.join(collectionRoot, collectionId);
  const mdPath = `${stemPath}.md`;
  const mdxPath = `${stemPath}.mdx`;

  if (exists(mdPath)) {
    return mdPath;
  }

  return mdxPath;
}

function linkTargetsRoute(href: string, route: string): boolean {
  if (!href.startsWith("/")) {
    return false;
  }

  if (route.endsWith(".xml")) {
    return href === route;
  }

  return href === route || href.startsWith(route);
}

function usage(): string {
  return [
    "Usage: bun scripts/site/site-doctor.ts [--quiet] [--json]",
    "",
    "Checks site-instance config relationships that schema parsing cannot validate alone.",
    "",
    "Options:",
    "  --quiet  Suppress passing human output.",
    "  --json   Print a machine-readable author diagnostic report to stdout.",
    "",
  ].join("\n");
}

if (import.meta.main) {
  process.exitCode = runSiteDoctorCli();
}
