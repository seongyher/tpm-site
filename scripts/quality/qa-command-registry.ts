export const qaCommandClasses = [
  "fast-local",
  "focused",
  "release",
  "ci",
  "mutation",
  "investigation",
] as const;

/** Supported command classes for repository QA scripts. */
export type QaCommandClass = (typeof qaCommandClasses)[number];

/** How a package script participates in CI. */
export type QaCiUsage = "blocking" | "deploy" | "mixed" | "none" | "review";

/** Side effect category for a package script. */
export type QaMutation =
  | "coverage-output"
  | "external"
  | "generated-output"
  | "local-server"
  | "none"
  | "source"
  | "temp-output";

/** Whether a CI job has exact local parity. */
export type QaParity = "approximate" | "ci-only" | "exact";

/** Expected runtime band for local planning. */
export type QaRuntime = "external" | "fast" | "medium" | "slow";

/** Package-script metadata used by the QA registry. */
export interface QaCommandEntry {
  ciUsage: QaCiUsage;
  class: QaCommandClass;
  domain: string;
  mutation: QaMutation;
  runtime: QaRuntime;
  scope: string;
}

/** Shared metadata for a group of scripts with the same QA purpose. */
export interface QaCommandGroup extends QaCommandEntry {
  scripts: readonly string[];
}

/** CI job metadata used to map workflows back to local commands. */
export interface QaCiJobEntry {
  blocking: boolean;
  ciCommandSnippets: readonly string[];
  ciOnlyReason?: string;
  job: string;
  localScripts: readonly string[];
  notes: string;
  parity: QaParity;
  workflow: string;
}

export const qaCommandGroups = [
  {
    ciUsage: "review",
    class: "investigation",
    domain: "assets",
    mutation: "none",
    runtime: "fast",
    scope: "Image duplicate and unused-asset review signals.",
    scripts: ["assets:duplicates", "assets:unused", "review:assets"],
  },
  {
    ciUsage: "blocking",
    class: "focused",
    domain: "assets",
    mutation: "none",
    runtime: "fast",
    scope: "Image location and shared-asset organization invariants.",
    scripts: ["assets:locations", "assets:shared"],
  },
  {
    ciUsage: "none",
    class: "focused",
    domain: "authoring",
    mutation: "none",
    runtime: "fast",
    scope: "Author-facing content and site checks.",
    scripts: ["author:check"],
  },
  {
    ciUsage: "none",
    class: "mutation",
    domain: "authoring",
    mutation: "source",
    runtime: "fast",
    scope: "Safe author-facing source repairs.",
    scripts: ["author:fix", "tags:normalize"],
  },
  {
    ciUsage: "blocking",
    class: "release",
    domain: "build",
    mutation: "generated-output",
    runtime: "slow",
    scope:
      "Production static build, PDF generation, optimization, and deploy metadata.",
    scripts: [
      "build",
      "build:cloudflare",
      "build:optimize",
      "build:pdf",
      "build:raw",
      "build:release",
    ],
  },
  {
    ciUsage: "blocking",
    class: "focused",
    domain: "catalog",
    mutation: "generated-output",
    runtime: "medium",
    scope: "Component catalog and fixture site catalog builds.",
    scripts: [
      "catalog:build",
      "catalog:preview:fresh",
      "test:catalog",
      "test:catalog:site-instance",
    ],
  },
  {
    ciUsage: "blocking",
    class: "focused",
    domain: "catalog",
    mutation: "none",
    runtime: "fast",
    scope: "Component catalog accountability without building catalog output.",
    scripts: ["catalog:check"],
  },
  {
    ciUsage: "none",
    class: "investigation",
    domain: "catalog",
    mutation: "local-server",
    runtime: "external",
    scope: "Local catalog development and preview servers.",
    scripts: ["catalog:dev", "catalog:preview"],
  },
  {
    ciUsage: "blocking",
    class: "fast-local",
    domain: "orchestration",
    mutation: "none",
    runtime: "fast",
    scope: "Cheap high-signal gate for frequent local use.",
    scripts: ["check:fast"],
  },
  {
    ciUsage: "blocking",
    class: "release",
    domain: "orchestration",
    mutation: "none",
    runtime: "slow",
    scope: "Normal and release quality gate orchestration.",
    scripts: ["check", "check:release", "quality", "quality:release"],
  },
  {
    ciUsage: "review",
    class: "investigation",
    domain: "coverage",
    mutation: "coverage-output",
    runtime: "medium",
    scope: "LCOV generation and broad coverage accountability review.",
    scripts: ["coverage", "coverage:check", "coverage:unit", "coverage:verify"],
  },
  {
    ciUsage: "blocking",
    class: "focused",
    domain: "dead-code",
    mutation: "none",
    runtime: "medium",
    scope: "Unused file, export, dependency, binary, and script detection.",
    scripts: ["deadcode"],
  },
  {
    ciUsage: "none",
    class: "investigation",
    domain: "diagnostics",
    mutation: "none",
    runtime: "fast",
    scope:
      "Structured diagnostic snapshot comparison for risky QA scope changes.",
    scripts: ["diagnostics:diff"],
  },
  {
    ciUsage: "deploy",
    class: "release",
    domain: "deploy",
    mutation: "external",
    runtime: "external",
    scope: "Cloudflare Workers Static Assets deployment.",
    scripts: ["deploy:cloudflare"],
  },
  {
    ciUsage: "none",
    class: "investigation",
    domain: "development-server",
    mutation: "local-server",
    runtime: "external",
    scope: "Local development and preview servers.",
    scripts: [
      "dev",
      "preview",
      "preview:cloudflare",
      "preview:cloudflare:fresh",
      "preview:fresh",
      "preview:release:fresh",
    ],
  },
  {
    ciUsage: "none",
    class: "focused",
    domain: "docs-site",
    mutation: "generated-output",
    runtime: "slow",
    scope: "Example documentation site validation, build, and preview.",
    scripts: [
      "docs-site:build",
      "docs-site:dev",
      "docs-site:preview",
      "docs-site:preview:fresh",
      "test:docs-site",
    ],
  },
  {
    ciUsage: "none",
    class: "mutation",
    domain: "formatting",
    mutation: "source",
    runtime: "medium",
    scope: "Safe code/config or Markdown formatting writes.",
    scripts: [
      "fix",
      "fix:markdown",
      "format:code:write",
      "format:markdown:write",
      "format:write",
      "lint:fix",
    ],
  },
  {
    ciUsage: "blocking",
    class: "fast-local",
    domain: "formatting",
    mutation: "none",
    runtime: "medium",
    scope: "Blocking code/config formatting checks.",
    scripts: ["format", "format:code"],
  },
  {
    ciUsage: "review",
    class: "investigation",
    domain: "formatting",
    mutation: "none",
    runtime: "medium",
    scope: "Markdown and MDX formatting review.",
    scripts: ["format:markdown", "review:markdown"],
  },
  {
    ciUsage: "blocking",
    class: "fast-local",
    domain: "lint",
    mutation: "none",
    runtime: "medium",
    scope: "Strict ESLint and package ordering checks.",
    scripts: ["lint", "lint:packages"],
  },
  {
    ciUsage: "review",
    class: "focused",
    domain: "lint",
    mutation: "none",
    runtime: "medium",
    scope: "Markdown style and MDX parser/code review.",
    scripts: ["lint:markdown", "lint:mdx"],
  },
  {
    ciUsage: "none",
    class: "investigation",
    domain: "payload",
    mutation: "temp-output",
    runtime: "slow",
    scope: "Payload measurement and optimization experiments.",
    scripts: [
      "payload:critical-css:experiment",
      "payload:minify-html:experiment",
      "payload:minify-html:experiments",
      "payload:postbuild:experiments",
      "payload:report",
      "payload:vite:experiments",
    ],
  },
  {
    ciUsage: "blocking",
    class: "focused",
    domain: "platform",
    mutation: "none",
    runtime: "fast",
    scope: "Platform/site boundary contract checks.",
    scripts: ["platform:check"],
  },
  {
    ciUsage: "none",
    class: "investigation",
    domain: "references",
    mutation: "temp-output",
    runtime: "medium",
    scope: "Citation and reference audits or generated migration catalogs.",
    scripts: [
      "references:audit",
      "references:bibtex:audit",
      "references:catalog",
    ],
  },
  {
    ciUsage: "none",
    class: "mutation",
    domain: "references",
    mutation: "source",
    runtime: "medium",
    scope: "Mechanical article-reference migration.",
    scripts: ["references:migrate:mechanical"],
  },
  {
    ciUsage: "blocking",
    class: "release",
    domain: "security",
    mutation: "none",
    runtime: "medium",
    scope: "High-severity dependency audit and local secrets scan.",
    scripts: ["audit", "secrets"],
  },
  {
    ciUsage: "review",
    class: "investigation",
    domain: "security",
    mutation: "none",
    runtime: "medium",
    scope: "All-severity dependency audit review.",
    scripts: ["audit:all"],
  },
  {
    ciUsage: "blocking",
    class: "focused",
    domain: "site-config",
    mutation: "none",
    runtime: "fast",
    scope: "Site config relationship validation and stale schema detection.",
    scripts: ["site:doctor", "site:schema:check"],
  },
  {
    ciUsage: "none",
    class: "mutation",
    domain: "site-config",
    mutation: "source",
    runtime: "fast",
    scope: "Site config JSON Schema generation.",
    scripts: ["site:schema"],
  },
  {
    ciUsage: "blocking",
    class: "focused",
    domain: "content",
    mutation: "none",
    runtime: "fast",
    scope: "Content and tag source invariants.",
    scripts: ["tags:check", "verify:content"],
  },
  {
    ciUsage: "blocking",
    class: "fast-local",
    domain: "tests",
    mutation: "none",
    runtime: "medium",
    scope: "Unit, Astro container, config, and accountability tests.",
    scripts: [
      "test",
      "test:accountability",
      "test:accountability:release",
      "test:astro",
      "test:config",
      "test:unit",
    ],
  },
  {
    ciUsage: "blocking",
    class: "release",
    domain: "tests",
    mutation: "generated-output",
    runtime: "slow",
    scope:
      "Build-backed browser, accessibility, Lighthouse, and site-instance tests.",
    scripts: ["test:a11y", "test:e2e", "test:perf", "test:site-instance"],
  },
  {
    ciUsage: "mixed",
    class: "focused",
    domain: "tests",
    mutation: "none",
    runtime: "medium",
    scope: "Built-output browser, accessibility, and Lighthouse tests.",
    scripts: ["test:a11y:built", "test:e2e:built", "test:perf:built"],
  },
  {
    ciUsage: "none",
    class: "investigation",
    domain: "tests",
    mutation: "none",
    runtime: "slow",
    scope: "Randomized flake detection.",
    scripts: ["test:flake"],
  },
  {
    ciUsage: "blocking",
    class: "fast-local",
    domain: "typecheck",
    mutation: "none",
    runtime: "medium",
    scope: "Astro and tooling TypeScript checks.",
    scripts: ["typecheck", "typecheck:astro", "typecheck:tools"],
  },
  {
    ciUsage: "blocking",
    class: "release",
    domain: "generated-output",
    mutation: "none",
    runtime: "medium",
    scope: "Built output link, metadata, script, PDF, and HTML validation.",
    scripts: ["validate:html", "verify"],
  },
] as const satisfies readonly QaCommandGroup[];

export const qaCommandRegistry: Record<string, QaCommandEntry> =
  Object.fromEntries(
    qaCommandGroups.flatMap(({ scripts, ...entry }) =>
      scripts.map((script) => [script, entry]),
    ),
  );

export const qaCiJobRegistry = [
  {
    blocking: true,
    ciCommandSnippets: ["bun run check"],
    job: "quality",
    localScripts: ["check"],
    notes: "Main pull request quality gate.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: false,
    ciCommandSnippets: ["bun run review:markdown"],
    job: "markdown-review",
    localScripts: ["review:markdown"],
    notes: "Review-only Markdown and MDX style signal.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: false,
    ciCommandSnippets: ["bun run review:assets"],
    job: "asset-review",
    localScripts: ["review:assets"],
    notes: "Review-only duplicate and unused image signal.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: [
      "bun run build",
      "bun run build:cloudflare",
      "bun run verify",
      "bun run validate:html",
    ],
    job: "build",
    localScripts: ["build", "build:cloudflare", "verify", "validate:html"],
    notes: "Creates and verifies the artifact used by downstream jobs.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: ["bun run test:e2e:built"],
    job: "browser",
    localScripts: ["test:e2e:built"],
    notes: "Runs against downloaded verified build output.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: [
      "bun run test:catalog",
      "bun run test:catalog:site-instance",
    ],
    job: "catalog",
    localScripts: ["test:catalog", "test:catalog:site-instance"],
    notes: "Validates the component catalog and fixture site catalog.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: false,
    ciCommandSnippets: ["bun run test:a11y:built"],
    job: "accessibility",
    localScripts: ["test:a11y:built"],
    notes: "Review-only axe scan against downloaded verified build output.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: false,
    ciCommandSnippets: ["bun run test:perf:built"],
    job: "lighthouse",
    localScripts: ["test:perf:built"],
    notes:
      "Review-only Lighthouse CI scan against downloaded verified build output.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: ["bun run audit"],
    job: "audit",
    localScripts: ["audit"],
    notes: "High-severity dependency audit.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: false,
    ciCommandSnippets: ["bun run audit:all"],
    job: "audit-review",
    localScripts: ["audit:all"],
    notes: "All-severity dependency audit review.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: false,
    ciCommandSnippets: ["bun run coverage"],
    job: "coverage-review",
    localScripts: ["coverage"],
    notes: "Review-only LCOV and coverage inventory.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: ["cloudflare/wrangler-action@v3", "command: deploy"],
    job: "deploy-cloudflare",
    localScripts: ["deploy:cloudflare"],
    notes: "CI deploys the verified artifact through the Cloudflare action.",
    parity: "approximate",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: ["actions/dependency-review-action@v4"],
    ciOnlyReason:
      "GitHub Dependency Review depends on pull request dependency metadata.",
    job: "dependency-review",
    localScripts: [],
    notes: "PR-only supply-chain review.",
    parity: "ci-only",
    workflow: ".github/workflows/security.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: ["gitleaks/gitleaks-action@v2"],
    job: "secrets",
    localScripts: ["secrets"],
    notes:
      "CI action owns GitHub security-event integration; local script scans git history.",
    parity: "approximate",
    workflow: ".github/workflows/security.yml",
  },
] as const satisfies readonly QaCiJobEntry[];
