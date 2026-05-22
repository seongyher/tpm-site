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
  forbiddenEntrypointImports: PlatformBoundaryViolation[];
  forbiddenExtensionImports: PlatformBoundaryViolation[];
  forbiddenImports: PlatformBoundaryViolation[];
  forbiddenLiterals: PlatformBoundaryViolation[];
  unownedLibFiles: string[];
  unownedPlatformEntrypoints: string[];
}

const platformSourcePattern =
  /^src\/(?!(?:generated|components\/ui\/assets)\/).*\.(?:astro|ts|tsx)$/u;
const extensionSourcePattern =
  /^(?:extensions|site\/extensions)\/.*\.(?:astro|ts|tsx)$/u;
const libFilePattern = /^src\/lib\/.*\.ts$/u;
const platformEntrypointPattern = /^src\/platform\/.*\.ts$/u;
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
    "articles/article-image-policy.ts",
    "articles/article-list-title-fit.ts",
    "articles/article-toc.ts",
    "articles/embed-media.ts",
  ],
  "content-model": [
    "content/announcements.ts",
    "content/archive.ts",
    "content/article-compiler.ts",
    "content/article-continuity.ts",
    "content/article-list.ts",
    "content/article-page-view-model.ts",
    "content/article-view.ts",
    "content/authors.ts",
    "content/collections.ts",
    "content/content-route-view-models.ts",
    "content/content-schemas.ts",
    "content/content.ts",
    "content/feed.ts",
    "content/home.ts",
    "content/listing-route-view-models.ts",
    "content/publishable.ts",
    "content/tags.ts",
  ],
  deployment: ["deployment/deployment-adapters.ts"],
  "extension-architecture": ["extensions/extensions.ts"],
  "interaction-primitives": [
    "interactions/anchored-disclosure.ts",
    "interactions/anchored-positioning.ts",
    "interactions/browser-clipboard.ts",
    "interactions/interaction-primitives.ts",
  ],
  "import-export": ["import-export/migration-fixtures.ts"],
  localization: [
    "localization/inclusive-defaults.ts",
    "localization/localization-fixtures.ts",
  ],
  "media-policy": ["media/media-policy.ts", "media/social-images.ts"],
  "pdf-and-scholarly-output": [
    "articles/article-pdf-compatibility.ts",
    "articles/article-pdf.ts",
  ],
  "output-verification": [
    "diagnostics/author-diagnostics.ts",
    "diagnostics/output-verification.ts",
    "release/performance-budgets.ts",
    "release/performance-workbench.ts",
    "release/release-governance.ts",
    "release/static-output-security.ts",
    "release/supply-chain-policy.ts",
    "release/third-party-origins.ts",
  ],
  observability: [
    "observability/observability-diagnostics.ts",
    "observability/observability-reports.ts",
    "observability/observability.ts",
  ],
  "studio-readiness": [
    "studio/studio-forms.ts",
    "studio/studio-models.ts",
    "studio/studio-workflows.ts",
  ],
  "starter-templates": ["starters/starter-templates.ts"],
  "references-and-bibliography": [
    "references/article-references/bibtex.ts",
    "references/article-references/display-label.ts",
    "references/article-references/ids.ts",
    "references/article-references/model.ts",
    "references/article-references/normalize.ts",
    "references/article-references/source.ts",
    "references/article-references/validate.ts",
    "references/bibliography.ts",
    "references/citations/article-citation.ts",
  ],
  "routes-and-features": [
    "metadata/metadata-graph.ts",
    "metadata/metadata.ts",
    "metadata/semantic-metadata.ts",
    "metadata/semantic-profile-kinds.ts",
    "metadata/seo.ts",
    "routes/feature-routes.ts",
    "routes/route-registry.ts",
    "routes/routes.ts",
    "routes/site-redirects.ts",
    "routes/static-paths.ts",
    "site/navigation.ts",
    "site/platform-context.ts",
    "site/share-targets.ts",
    "site/site-config-defaults.ts",
    "site/site-config.ts",
    "site/site-instance.ts",
    "site/source-artifacts.ts",
    "site/support.ts",
  ],
  utilities: ["shared/html.ts", "shared/utils.ts"],
} as const;

const ownedLibFiles: ReadonlySet<string> = new Set(
  Object.values(libDomainFiles).flat(),
);

const platformEntrypointDomainFiles = {
  deployment: ["deployment.ts"],
  diagnostics: ["diagnostics.ts"],
  extensions: ["extensions.ts"],
  "import-export": ["import-export.ts"],
  interactions: ["interactions.ts"],
  localization: ["localization.ts"],
  media: ["media.ts"],
  references: ["references.ts"],
  release: ["release.ts"],
  routes: ["routes.ts"],
  security: ["security.ts"],
  starters: ["starters.ts"],
} as const;

const ownedPlatformEntrypoints: ReadonlySet<string> = new Set(
  Object.values(platformEntrypointDomainFiles).flat(),
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
  const platformEntrypointFiles = boundaryFiles
    .map((file) => toPosix(file.path))
    .filter((file) => platformEntrypointPattern.test(file))
    .map((file) => file.replace(/^src\/platform\//u, ""));
  const platformEntrypoints = sourceFiles.filter((file) =>
    platformEntrypointPattern.test(file.path),
  );
  const extensionFiles = boundaryFiles
    .map((file) => ({ ...file, path: toPosix(file.path) }))
    .filter((file) => extensionSourcePattern.test(file.path));

  return {
    forbiddenExtensionImports: extensionFiles.flatMap(
      unsupportedExtensionImports,
    ),
    forbiddenEntrypointImports: platformEntrypoints.flatMap(
      unsupportedPlatformEntrypointImports,
    ),
    forbiddenImports: sourceFiles.flatMap(unsupportedSiteImports),
    forbiddenLiterals: sourceFiles.flatMap(siteSpecificLiterals),
    unownedPlatformEntrypoints: platformEntrypointFiles
      .filter((file) => !ownedPlatformEntrypoints.has(file))
      .sort((left, right) => left.localeCompare(right)),
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

  if (result.unownedPlatformEntrypoints.length > 0) {
    lines.push(
      "Unowned src/platform entrypoints:",
      ...result.unownedPlatformEntrypoints.map(
        (file) =>
          `- src/platform/${file} (assign this entrypoint in docs/PLATFORM_MODULES.md and scripts/quality/verify-platform-boundaries.ts)`,
      ),
    );
  }

  if (result.forbiddenExtensionImports.length > 0) {
    lines.push(
      "Unsupported extension imports:",
      ...result.forbiddenExtensionImports.map(formatViolation),
    );
  }

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

  if (result.forbiddenEntrypointImports.length > 0) {
    lines.push(
      "Unsupported platform-entrypoint imports:",
      ...result.forbiddenEntrypointImports.map(formatViolation),
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

function unsupportedExtensionImports(
  file: PlatformBoundaryFile,
): PlatformBoundaryViolation[] {
  return importSpecifiers(file.text)
    .filter((specifier) => !isExtensionImport(specifier))
    .map((specifier) => ({
      file: file.path,
      message: `Unsupported extension import "${specifier}". Extensions must use platform entrypoints instead of reaching into site, src/lib, components, pages, scripts, or tests directly.`,
    }));
}

function unsupportedPlatformEntrypointImports(
  file: PlatformBoundaryFile,
): PlatformBoundaryViolation[] {
  return importSpecifiers(file.text)
    .filter((specifier) => !isPlatformEntrypointImport(specifier))
    .map((specifier) => ({
      file: file.path,
      message: `Unsupported platform-entrypoint import "${specifier}". Entrypoints may only re-export local entrypoints or src/lib domain modules.`,
    }));
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
  return (
    (allowedSiteImports.get(file)?.has(specifier) ?? false) ||
    (file.startsWith("src/lib/") && specifier.startsWith("../site/"))
  );
}

function isSiteInstanceImport(specifier: string): boolean {
  return (
    specifier.startsWith("@site/") ||
    specifier === "site" ||
    specifier.startsWith("site/") ||
    (specifier.includes("/site/") && !specifier.includes("/lib/site/"))
  );
}

function isPlatformEntrypointImport(specifier: string): boolean {
  return specifier.startsWith("./") || specifier.startsWith("../lib/");
}

function isExtensionImport(specifier: string): boolean {
  if (
    specifier.startsWith("@/platform/") ||
    specifier.includes("/src/platform/")
  ) {
    return true;
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return !/(?:^|\/)(?:site|scripts|tests|src\/(?:components|layouts|lib|pages|scripts))(?:\/|$)/u.test(
      specifier,
    );
  }

  return false;
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
    result.forbiddenExtensionImports.length > 0 ||
    result.forbiddenEntrypointImports.length > 0 ||
    result.unownedLibFiles.length > 0 ||
    result.unownedPlatformEntrypoints.length > 0 ||
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
