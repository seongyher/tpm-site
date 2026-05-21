import { existsSync } from "node:fs";
import path from "node:path";

import {
  type AuthorDiagnostic,
  type AuthorDiagnosticCategory,
  type AuthorDiagnosticCode,
  type AuthorDiagnosticRepairOwner,
  createAuthorDiagnostic,
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
  return siteDoctorIssues(options).map(siteDoctorIssueToAuthorDiagnostic);
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

  const quiet = args.includes("--quiet");
  const issues = siteDoctorIssues();
  const errorCount = issues.filter(
    (issue) => issue.severity === "error",
  ).length;

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

  if (message.includes("homepage")) {
    return {
      category: "config",
      code: "config.homepage-collection-missing",
      relatedDocs: ["docs/HOMEPAGE_CONTENT_MODEL.md"],
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
    "Usage: bun scripts/site/site-doctor.ts [--quiet]",
    "",
    "Checks site-instance config relationships that schema parsing cannot validate alone.",
    "",
  ].join("\n");
}

if (import.meta.main) {
  process.exitCode = runSiteDoctorCli();
}
