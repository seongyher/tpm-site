import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

interface PlatformBoundaryFile {
  path: string;
  text: string;
}

/** Inputs for platform boundary verification. */
export interface PlatformBoundaryVerificationOptions {
  files?: readonly PlatformBoundaryFile[];
  rootDir: string;
}

/** One platform boundary violation. */
export interface PlatformBoundaryViolation {
  file: string;
  message: string;
}

/** Result of platform boundary verification. */
export interface PlatformBoundaryVerificationResult {
  forbiddenImports: PlatformBoundaryViolation[];
  forbiddenLiterals: PlatformBoundaryViolation[];
  unownedLibFiles: string[];
}

const platformSourcePattern =
  /^src\/(?!(?:generated|components\/ui\/assets)\/).*\.(?:astro|ts|tsx)$/u;
const libFilePattern = /^src\/lib\/.*\.ts$/u;
const bareImportSpecifierPattern = /^\s*import\s*["']([^"']+)["']/gmu;
const dynamicImportSpecifierPattern = /\bimport\(\s*["']([^"']+)["']\s*\)/gu;
const fromImportSpecifierPattern = /\bfrom\s*["']([^"']+)["']/gu;

const allowedSiteImports = new Map([
  ["src/layouts/BaseLayout.astro", new Set(["@site/theme.css"])],
]);

const forbiddenSiteLiteralPatterns = [
  {
    message: "Move The Philosopher's Meme display copy into the site instance.",
    pattern: /The Philosopher'?s Meme/iu,
  },
  {
    message: "Move TPM canonical URLs into site config or site content.",
    pattern: /thephilosophersmeme\.com/iu,
  },
  {
    message: "Move TPM social handles into site config.",
    pattern: /philo_meme/iu,
  },
  {
    message: "Move TPM support links into site config.",
    pattern: /patreon\.com\/thephilosophersmeme/iu,
  },
  {
    message: "Move TPM-specific reader copy into site content or config.",
    pattern:
      /\b(?:New to TPM|Curated TPM|TPM articles|TPM entries|TPM_COMPONENT_CATALOG)\b/iu,
  },
] as const;

const libDomainFiles = {
  "article-rendering": [
    "article-image-policy.ts",
    "article-list-title-fit.ts",
    "article-toc.ts",
    "embed-media.ts",
  ],
  "content-model": [
    "announcements.ts",
    "archive.ts",
    "article-compiler.ts",
    "article-continuity.ts",
    "article-list.ts",
    "article-page-view-model.ts",
    "article-view.ts",
    "authors.ts",
    "collections.ts",
    "content-route-view-models.ts",
    "content-schemas.ts",
    "content.ts",
    "feed.ts",
    "home.ts",
    "listing-route-view-models.ts",
    "publishable.ts",
    "tags.ts",
  ],
  "interaction-primitives": [
    "anchored-disclosure.ts",
    "anchored-positioning.ts",
    "browser-clipboard.ts",
    "interaction-primitives.ts",
  ],
  "media-policy": ["media-policy.ts", "social-images.ts"],
  "pdf-and-scholarly-output": [
    "article-pdf-compatibility.ts",
    "article-pdf.ts",
  ],
  "output-verification": [
    "author-diagnostics.ts",
    "output-verification.ts",
    "performance-budgets.ts",
    "performance-workbench.ts",
  ],
  observability: [
    "observability-diagnostics.ts",
    "observability-reports.ts",
    "observability.ts",
  ],
  "studio-readiness": [
    "studio-forms.ts",
    "studio-models.ts",
    "studio-workflows.ts",
  ],
  "references-and-bibliography": [
    "article-references/bibtex.ts",
    "article-references/display-label.ts",
    "article-references/ids.ts",
    "article-references/model.ts",
    "article-references/normalize.ts",
    "article-references/source.ts",
    "article-references/validate.ts",
    "bibliography.ts",
    "citations/article-citation.ts",
  ],
  "routes-and-features": [
    "feature-routes.ts",
    "metadata-graph.ts",
    "metadata.ts",
    "navigation.ts",
    "platform-context.ts",
    "route-registry.ts",
    "routes.ts",
    "semantic-profile-kinds.ts",
    "semantic-metadata.ts",
    "seo.ts",
    "share-targets.ts",
    "site-config-defaults.ts",
    "site-config.ts",
    "site-instance.ts",
    "site-redirects.ts",
    "source-artifacts.ts",
    "static-paths.ts",
    "support.ts",
  ],
  utilities: ["html.ts", "utils.ts"],
} as const;

const ownedLibFiles: ReadonlySet<string> = new Set(
  Object.values(libDomainFiles).flat(),
);

/**
 * Verifies platform/module boundaries that should remain true for every site
 * instance.
 *
 * @param options Verification inputs.
 * @param options.files Optional repository files for tests.
 * @param options.rootDir Repository root.
 * @returns Boundary verification result.
 */
export function verifyPlatformBoundaries({
  rootDir,
  files,
}: PlatformBoundaryVerificationOptions): PlatformBoundaryVerificationResult {
  const boundaryFiles = files ?? readRepositoryFiles(rootDir);
  const sourceFiles = boundaryFiles
    .map((file) => ({ ...file, path: toPosix(file.path) }))
    .filter((file) => platformSourcePattern.test(file.path));
  const libFiles = boundaryFiles
    .map((file) => toPosix(file.path))
    .filter((file) => libFilePattern.test(file))
    .map((file) => file.replace(/^src\/lib\//u, ""));

  return {
    forbiddenImports: sourceFiles.flatMap(unsupportedSiteImports),
    forbiddenLiterals: sourceFiles.flatMap(siteSpecificLiterals),
    unownedLibFiles: libFiles
      .filter((file) => !ownedLibFiles.has(file))
      .sort((left, right) => left.localeCompare(right)),
  };
}

/**
 * Formats platform boundary failures for humans.
 *
 * @param result Boundary verification result.
 * @returns Human-readable report.
 */
export function formatPlatformBoundaryReport(
  result: PlatformBoundaryVerificationResult,
): string {
  if (!hasPlatformBoundaryViolations(result)) {
    return "Platform boundary check passed.";
  }

  const lines = ["Platform boundary check failed."];

  if (result.unownedLibFiles.length > 0) {
    lines.push(
      "Unowned src/lib modules:",
      ...result.unownedLibFiles.map(
        (file) =>
          `- src/lib/${file} (assign this module in docs/PLATFORM_MODULES.md and scripts/quality/verify-platform-boundaries.ts)`,
      ),
    );
  }

  if (result.forbiddenImports.length > 0) {
    lines.push(
      "Unsupported site-instance imports:",
      ...result.forbiddenImports.map(formatViolation),
    );
  }

  if (result.forbiddenLiterals.length > 0) {
    lines.push(
      "Site-specific literals in reusable platform code:",
      ...result.forbiddenLiterals.map(formatViolation),
    );
  }

  return lines.join("\n");
}

/**
 * Runs the platform boundary verifier command-line workflow.
 *
 * @param args CLI arguments.
 * @param rootDir Repository root.
 * @returns Process exit code.
 */
export function runPlatformBoundaryCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): number {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage: bun run platform:check [--quiet]

Verify reusable platform modules do not regain site-specific coupling.`);
    return 0;
  }

  const quiet = args.includes("--quiet");
  const result = verifyPlatformBoundaries({ rootDir });
  const report = formatPlatformBoundaryReport(result);

  if (hasPlatformBoundaryViolations(result)) {
    console.error(report);
    return 1;
  }

  if (!quiet) {
    console.log(report);
  }

  return 0;
}

function unsupportedSiteImports(
  file: PlatformBoundaryFile,
): PlatformBoundaryViolation[] {
  return importSpecifiers(file.text)
    .filter((specifier) => isSiteInstanceImport(specifier))
    .filter((specifier) => !allowedSiteImport(file.path, specifier))
    .map((specifier) => ({
      file: file.path,
      message: `Unsupported site-instance import "${specifier}". Read site data through config/content adapters or explicit props.`,
    }));
}

function siteSpecificLiterals(
  file: PlatformBoundaryFile,
): PlatformBoundaryViolation[] {
  return forbiddenSiteLiteralPatterns
    .filter(({ pattern }) => pattern.test(file.text))
    .map(({ message }) => ({ file: file.path, message }));
}

function allowedSiteImport(file: string, specifier: string): boolean {
  return allowedSiteImports.get(file)?.has(specifier) ?? false;
}

function isSiteInstanceImport(specifier: string): boolean {
  return (
    specifier.startsWith("@site/") ||
    specifier === "site" ||
    specifier.startsWith("site/") ||
    specifier.includes("/site/")
  );
}

function importSpecifiers(text: string): string[] {
  return [
    ...Array.from(
      text.matchAll(fromImportSpecifierPattern),
      ([, specifier]) => specifier,
    ),
    ...Array.from(
      text.matchAll(bareImportSpecifierPattern),
      ([, specifier]) => specifier,
    ),
    ...Array.from(
      text.matchAll(dynamicImportSpecifierPattern),
      ([, specifier]) => specifier,
    ),
  ].flatMap((specifier) => (specifier === undefined ? [] : [specifier]));
}

function hasPlatformBoundaryViolations(
  result: PlatformBoundaryVerificationResult,
): boolean {
  return (
    result.unownedLibFiles.length > 0 ||
    result.forbiddenImports.length > 0 ||
    result.forbiddenLiterals.length > 0
  );
}

function formatViolation(violation: PlatformBoundaryViolation): string {
  return `- ${violation.file}: ${violation.message}`;
}

function readRepositoryFiles(rootDir: string): PlatformBoundaryFile[] {
  return listRepositoryFiles(rootDir)
    .filter((file) => existsSync(path.join(rootDir, file)))
    .map((file) => ({
      path: file,
      text: readFileSync(path.join(rootDir, file), "utf8"),
    }));
}

function listRepositoryFiles(rootDir: string): string[] {
  const result = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    {
      cwd: rootDir,
      encoding: "utf8",
    },
  );

  if (result.status !== 0) {
    throw new Error(
      result.stderr.length > 0
        ? result.stderr
        : "Failed to list repository files.",
    );
  }

  return result.stdout
    .split("\n")
    .filter((file) => file.length > 0)
    .sort((left, right) => left.localeCompare(right));
}

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}

if (import.meta.main) {
  process.exitCode = runPlatformBoundaryCli();
}
