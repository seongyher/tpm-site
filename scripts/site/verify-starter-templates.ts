import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { parseSiteConfig, type SiteConfig } from "../../src/lib/site-config";
import {
  projectRelativePath,
  resolveSiteInstancePaths,
  type SiteInstancePaths,
} from "../../src/lib/site-instance";
import { starterTemplateMatrix } from "../../src/lib/starter-templates";
import { siteDoctorIssues } from "./site-doctor";

interface StarterTemplateVerificationIssue {
  message: string;
  path?: string | undefined;
  starterId: string;
}

/** Starter template verification report. */
interface StarterTemplateVerificationReport {
  issues: readonly StarterTemplateVerificationIssue[];
  starterCount: number;
}

/**
 * Verifies maintained starter templates are present, site-neutral, and
 * compatible with current site-instance contracts.
 *
 * @returns Starter verification report.
 */
export function verifyStarterTemplates(): StarterTemplateVerificationReport {
  const issues = starterTemplateMatrix().flatMap((template) => {
    const paths = resolveSiteInstancePaths({
      siteInstanceRoot: template.root,
    });
    const configIssues = starterConfig(paths, template.id);

    if (configIssues.kind === "invalid") {
      return configIssues.issues;
    }

    return [
      ...requiredStarterPathIssues(template.id, paths, configIssues.config),
      ...siteNeutralityIssues(template.id, paths.root),
      ...siteDoctorIssues({
        config: configIssues.config,
        paths,
      }).map((issue) => ({
        message: `Site doctor ${issue.severity}: ${issue.message}`,
        path: issue.path,
        starterId: template.id,
      })),
      ...declaredCheckIssues(template.id, template.root, [
        ...template.acceptanceChecks.build,
        ...template.acceptanceChecks.release,
        ...template.acceptanceChecks.source,
      ]),
    ];
  });

  return {
    issues,
    starterCount: starterTemplateMatrix().length,
  };
}

/**
 * Runs the starter-template verification CLI.
 *
 * @param args CLI arguments.
 * @returns Process exit code.
 */
export function runStarterTemplateVerificationCli(
  args = Bun.argv.slice(2),
): number {
  if (args.includes("--help")) {
    process.stdout.write(usage());

    return 0;
  }

  const quiet = args.includes("--quiet");
  const report = verifyStarterTemplates();

  if (report.issues.length === 0) {
    if (!quiet) {
      process.stdout.write(
        `Starter template check passed for ${report.starterCount} starters.\n`,
      );
    }

    return 0;
  }

  process.stderr.write(formatStarterTemplateIssues(report.issues));

  return 1;
}

/**
 * Formats starter-template issues for CLI output.
 *
 * @param issues Starter-template issues.
 * @returns Human-readable report.
 */
export function formatStarterTemplateIssues(
  issues: readonly StarterTemplateVerificationIssue[],
): string {
  return `${issues
    .map((issue) => {
      const location =
        issue.path === undefined
          ? ""
          : `\n   Path: ${projectRelativePath(issue.path)}`;

      return `Error: ${issue.starterId}: ${issue.message}${location}`;
    })
    .join("\n\n")}\n`;
}

function starterConfig(
  paths: SiteInstancePaths,
  starterId: string,
):
  | { config: SiteConfig; kind: "valid" }
  | { issues: StarterTemplateVerificationIssue[]; kind: "invalid" } {
  try {
    const raw = JSON.parse(readFileSync(paths.config.site, "utf8")) as unknown;

    return { config: parseSiteConfig(raw), kind: "valid" };
  } catch (error) {
    return {
      issues: [
        {
          message: `Could not parse starter config: ${
            error instanceof Error ? error.message : String(error)
          }`,
          path: paths.config.site,
          starterId,
        },
      ],
      kind: "invalid",
    };
  }
}

function requiredStarterPathIssues(
  starterId: string,
  paths: SiteInstancePaths,
  config: SiteConfig,
): StarterTemplateVerificationIssue[] {
  const requiredPaths = [
    paths.config.site,
    paths.config.redirects,
    paths.theme,
    path.join(paths.public, "favicon.svg"),
    path.join(paths.public, "robots.txt"),
    paths.content.articles,
    paths.content.authors,
    paths.content.categories,
    paths.content.collections,
    paths.content.pages,
    ...(config.features.announcements ? [paths.content.announcements] : []),
  ];

  return requiredPaths.flatMap((targetPath) =>
    existsSync(targetPath)
      ? []
      : [
          {
            message: "Missing required starter source path.",
            path: targetPath,
            starterId,
          },
        ],
  );
}

function siteNeutralityIssues(
  starterId: string,
  root: string,
): StarterTemplateVerificationIssue[] {
  return filesUnder(root).flatMap((file) => {
    const text = readFileSync(file, "utf8");
    const leak = siteSpecificPattern(file).find(({ pattern }) =>
      pattern.test(text),
    );

    return leak === undefined
      ? []
      : [
          {
            message: leak.message,
            path: file,
            starterId,
          },
        ];
  });
}

function declaredCheckIssues(
  starterId: string,
  root: string,
  checks: readonly string[],
): StarterTemplateVerificationIssue[] {
  if (checks.length === 0) {
    return [
      {
        message: "Starter does not declare any verification commands.",
        starterId,
      },
    ];
  }

  return checks.some(
    (check) => check.includes(root) || check.includes("starters:check"),
  )
    ? []
    : [
        {
          message:
            "Starter verification commands should reference its source root or the shared starter check.",
          starterId,
        },
      ];
}

function filesUnder(root: string): string[] {
  if (!existsSync(root)) {
    return [];
  }

  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      return filesUnder(entryPath);
    }

    return entry.isFile() ? [entryPath] : [];
  });
}

function siteSpecificPattern(file: string): ReadonlyArray<{
  message: string;
  pattern: RegExp;
}> {
  return file.endsWith("verify-starter-templates.ts")
    ? []
    : [
        {
          message: "Starter source should not mention The Philosopher's Meme.",
          pattern: /The Philosopher'?s Meme/iu,
        },
        {
          message: "Starter source should not contain TPM canonical URLs.",
          pattern: /thephilosophersmeme\.com/iu,
        },
        {
          message: "Starter source should not contain TPM social handles.",
          pattern: /philo_meme/iu,
        },
      ];
}

function usage(): string {
  return [
    "Usage: bun scripts/site/verify-starter-templates.ts [--quiet]",
    "",
    "Checks maintained starter site instances for required files, parseable",
    "site config, site-doctor compatibility, verification commands, and TPM",
    "branding leakage.",
    "",
  ].join("\n");
}

if (import.meta.main) {
  process.exitCode = runStarterTemplateVerificationCli();
}
