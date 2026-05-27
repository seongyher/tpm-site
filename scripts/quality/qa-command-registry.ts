export const qaCommandClasses = [
  "fast-local",
  "focused",
  "release",
  "ci",
  "mutation",
  "investigation",
] as const;

/** Supported command classes for repository QA commands. */
export type QaCommandClass = (typeof qaCommandClasses)[number];

/** How a command participates in CI. */
export type QaCiUsage = "blocking" | "deploy" | "mixed" | "none" | "review";

/** Side effect category for a command. */
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

/** Repository command metadata used by the QA registry. */
export interface QaCommandEntry {
  ciUsage: QaCiUsage;
  class: QaCommandClass;
  domain: string;
  mutation: QaMutation;
  runtime: QaRuntime;
  scope: string;
}

/** Shared metadata for a group of `just` recipes with the same QA purpose. */
export interface QaCommandGroup extends QaCommandEntry {
  commands: readonly string[];
}

/** CI job metadata used to map workflows back to local commands. */
export interface QaCiJobEntry {
  blocking: boolean;
  ciCommandSnippets: readonly string[];
  ciOnlyReason?: string;
  job: string;
  localCommands: readonly string[];
  notes: string;
  parity: QaParity;
  workflow: string;
}

/** Domain-level QA ownership for choosing focused and release checks. */
export interface QaDomainCoverageEntry {
  ciJobs: readonly string[];
  domain: string;
  exception?: string;
  focusedCommands: readonly string[];
  purpose: string;
  releaseCommands: readonly string[];
}

export const qaCommandGroups = [
  {
    ciUsage: "none",
    class: "focused",
    commands: ["default", "list", "package-check"],
    domain: "command-surface",
    mutation: "none",
    runtime: "fast",
    scope:
      "`just` discovery and command-surface/package ordering accountability.",
  },
  {
    ciUsage: "none",
    class: "focused",
    commands: ["setup", "setup-js", "setup-rust", "setup-browser"],
    domain: "setup",
    mutation: "external",
    runtime: "external",
    scope: "Repository bootstrap and optional browser/Rust tool setup.",
  },
  {
    ciUsage: "review",
    class: "investigation",
    commands: ["assets-duplicates", "assets-unused", "review-assets"],
    domain: "assets",
    mutation: "none",
    runtime: "fast",
    scope: "Image duplicate and unused-asset review signals.",
  },
  {
    ciUsage: "blocking",
    class: "focused",
    commands: ["assets-locations", "assets-shared", "media-images"],
    domain: "assets",
    mutation: "none",
    runtime: "fast",
    scope: "Image location, shared-asset, and Rust media report checks.",
  },
  {
    ciUsage: "none",
    class: "focused",
    commands: ["author-check"],
    domain: "authoring",
    mutation: "none",
    runtime: "fast",
    scope: "Author-facing content, tag, asset, site, and schema checks.",
  },
  {
    ciUsage: "none",
    class: "mutation",
    commands: ["author-fix", "tags-normalize"],
    domain: "authoring",
    mutation: "source",
    runtime: "fast",
    scope: "Safe author-facing source repairs.",
  },
  {
    ciUsage: "blocking",
    class: "release",
    commands: [
      "build",
      "build-cloudflare",
      "build-optimize",
      "build-pdf",
      "build-raw",
      "build-release",
    ],
    domain: "build",
    mutation: "generated-output",
    runtime: "slow",
    scope:
      "Production static build, PDF generation, optimization, and deploy metadata.",
  },
  {
    ciUsage: "blocking",
    class: "focused",
    commands: [
      "catalog-build",
      "catalog-check",
      "catalog-preview-fresh",
      "test-catalog",
      "test-catalog-site-instance",
    ],
    domain: "catalog",
    mutation: "generated-output",
    runtime: "medium",
    scope: "Component catalog accountability, builds, and fixture coverage.",
  },
  {
    ciUsage: "none",
    class: "investigation",
    commands: ["catalog-dev", "catalog-preview"],
    domain: "catalog",
    mutation: "local-server",
    runtime: "external",
    scope: "Local catalog development and preview servers.",
  },
  {
    ciUsage: "blocking",
    class: "focused",
    commands: [
      "check-fast",
      "check",
      "release-check",
      "quality",
      "quality-release",
    ],
    domain: "orchestration",
    mutation: "none",
    runtime: "slow",
    scope: "Local, normal, quiet, and release quality gate orchestration.",
  },
  {
    ciUsage: "review",
    class: "investigation",
    commands: [
      "coverage",
      "coverage-check",
      "coverage-unit",
      "coverage-verify",
    ],
    domain: "coverage",
    mutation: "coverage-output",
    runtime: "medium",
    scope: "LCOV generation and broad coverage accountability review.",
  },
  {
    ciUsage: "blocking",
    class: "focused",
    commands: ["deadcode"],
    domain: "dead-code",
    mutation: "none",
    runtime: "medium",
    scope:
      "Unused file, export, dependency, binary, and stale command detection.",
  },
  {
    ciUsage: "none",
    class: "investigation",
    commands: ["diagnostics-diff", "qa-registry"],
    domain: "diagnostics",
    mutation: "none",
    runtime: "fast",
    scope: "Structured diagnostic snapshot and QA command ownership reports.",
  },
  {
    ciUsage: "blocking",
    class: "focused",
    commands: [
      "docs-check",
      "docs-references",
      "docs-references-check",
      "test-docs-site",
    ],
    domain: "docs",
    mutation: "source",
    runtime: "medium",
    scope: "Generated platform reference drift and documentation-site checks.",
  },
  {
    ciUsage: "deploy",
    class: "release",
    commands: [
      "deploy-cloudflare",
      "preview-cloudflare",
      "preview-cloudflare-fresh",
    ],
    domain: "deploy",
    mutation: "external",
    runtime: "external",
    scope: "Cloudflare Workers Static Assets preview and deployment.",
  },
  {
    ciUsage: "none",
    class: "investigation",
    commands: ["dev", "preview", "preview-fresh", "preview-release-fresh"],
    domain: "development-server",
    mutation: "local-server",
    runtime: "external",
    scope: "Local development and preview servers.",
  },
  {
    ciUsage: "blocking",
    class: "focused",
    commands: [
      "docs-site-build",
      "docs-site-dev",
      "docs-site-preview",
      "docs-site-preview-fresh",
    ],
    domain: "docs-site",
    mutation: "generated-output",
    runtime: "slow",
    scope: "Example documentation-site validation, development, and preview.",
  },
  {
    ciUsage: "none",
    class: "mutation",
    commands: [
      "fix",
      "format-code-write",
      "format-markdown-write",
      "format-write",
      "js-fix",
      "lint-fix",
      "markdown-fix",
      "rust-fix",
      "rust-fmt-write",
    ],
    domain: "formatting",
    mutation: "source",
    runtime: "medium",
    scope:
      "Safe code/config, Markdown/MDX, package, and Rust formatting writes.",
  },
  {
    ciUsage: "blocking",
    class: "fast-local",
    commands: ["format", "format-code"],
    domain: "formatting",
    mutation: "none",
    runtime: "medium",
    scope: "Blocking code/config formatting checks.",
  },
  {
    ciUsage: "review",
    class: "investigation",
    commands: ["format-markdown", "review-markdown"],
    domain: "formatting",
    mutation: "none",
    runtime: "medium",
    scope: "Markdown and MDX formatting review.",
  },
  {
    ciUsage: "blocking",
    class: "fast-local",
    commands: ["lint"],
    domain: "lint",
    mutation: "none",
    runtime: "medium",
    scope: "Strict ESLint checks.",
  },
  {
    ciUsage: "review",
    class: "focused",
    commands: ["lint-markdown", "lint-mdx"],
    domain: "lint",
    mutation: "none",
    runtime: "medium",
    scope: "Markdown style and MDX parser/code review.",
  },
  {
    ciUsage: "none",
    class: "investigation",
    commands: [
      "payload-critical-css-experiment",
      "payload-minify-html-experiment",
      "payload-minify-html-experiments",
      "payload-postbuild-experiments",
      "payload-report",
      "payload-vite-experiments",
    ],
    domain: "payload",
    mutation: "temp-output",
    runtime: "slow",
    scope: "Payload measurement and optimization experiments.",
  },
  {
    ciUsage: "blocking",
    class: "release",
    commands: ["payload-check"],
    domain: "payload",
    mutation: "none",
    runtime: "medium",
    scope:
      "Deterministic route-class payload, PDF, and cache-header budget gate.",
  },
  {
    ciUsage: "blocking",
    class: "focused",
    commands: ["platform-check"],
    domain: "platform",
    mutation: "none",
    runtime: "fast",
    scope: "Platform/site boundary contract checks.",
  },
  {
    ciUsage: "none",
    class: "investigation",
    commands: [
      "references-audit",
      "references-bibtex-audit",
      "references-catalog",
    ],
    domain: "references",
    mutation: "temp-output",
    runtime: "medium",
    scope: "Citation and reference audits or generated migration catalogs.",
  },
  {
    ciUsage: "none",
    class: "mutation",
    commands: ["references-migrate-mechanical"],
    domain: "references",
    mutation: "source",
    runtime: "medium",
    scope: "Mechanical article-reference migration.",
  },
  {
    ciUsage: "blocking",
    class: "focused",
    commands: ["routes-redirects"],
    domain: "routes",
    mutation: "none",
    runtime: "fast",
    scope: "Rust route and redirect policy report.",
  },
  {
    ciUsage: "blocking",
    class: "focused",
    commands: [
      "cli",
      "migration-baseline",
      "rust-cargo-check",
      "rust-check",
      "rust-check-fast",
      "rust-clippy",
      "rust-deny",
      "rust-doc",
      "rust-doc-test",
      "rust-fmt",
      "rust-test",
    ],
    domain: "rust",
    mutation: "none",
    runtime: "medium",
    scope:
      "Rust workspace checks, operation-core tests, supply-chain policy, and CLI shell.",
  },
  {
    ciUsage: "review",
    class: "investigation",
    commands: ["rust-coverage", "rust-nextest"],
    domain: "rust",
    mutation: "coverage-output",
    runtime: "medium",
    scope: "Review-only Rust coverage and nextest signals.",
  },
  {
    ciUsage: "blocking",
    class: "release",
    commands: ["audit", "secrets"],
    domain: "security",
    mutation: "none",
    runtime: "medium",
    scope: "High-severity dependency audit and local secrets scan.",
  },
  {
    ciUsage: "review",
    class: "investigation",
    commands: ["audit-all"],
    domain: "security",
    mutation: "none",
    runtime: "medium",
    scope: "All-severity dependency audit review.",
  },
  {
    ciUsage: "blocking",
    class: "focused",
    commands: ["site-doctor", "site-schema-check"],
    domain: "site-config",
    mutation: "none",
    runtime: "fast",
    scope: "Site config relationship validation and stale schema detection.",
  },
  {
    ciUsage: "none",
    class: "mutation",
    commands: ["site-schema"],
    domain: "site-config",
    mutation: "source",
    runtime: "fast",
    scope: "Site config JSON Schema generation.",
  },
  {
    ciUsage: "blocking",
    class: "focused",
    commands: ["starters-check"],
    domain: "starters",
    mutation: "none",
    runtime: "fast",
    scope: "Maintained starter template source and distribution contracts.",
  },
  {
    ciUsage: "blocking",
    class: "focused",
    commands: ["content-check", "tags-check"],
    domain: "content",
    mutation: "none",
    runtime: "fast",
    scope: "Content and tag source invariants.",
  },
  {
    ciUsage: "blocking",
    class: "fast-local",
    commands: [
      "test",
      "test-accountability",
      "test-accountability-release",
      "test-astro",
      "test-config",
      "test-unit",
    ],
    domain: "tests",
    mutation: "none",
    runtime: "medium",
    scope: "Unit, Astro container, config, and accountability tests.",
  },
  {
    ciUsage: "blocking",
    class: "release",
    commands: ["test-a11y", "test-e2e", "test-perf", "test-site-instance"],
    domain: "tests",
    mutation: "generated-output",
    runtime: "slow",
    scope:
      "Build-backed browser, accessibility, Lighthouse, and site-instance tests.",
  },
  {
    ciUsage: "mixed",
    class: "focused",
    commands: ["test-a11y-built", "test-e2e-built", "test-perf-built"],
    domain: "tests",
    mutation: "none",
    runtime: "medium",
    scope: "Built-output browser, accessibility, and Lighthouse tests.",
  },
  {
    ciUsage: "none",
    class: "investigation",
    commands: ["test-flake"],
    domain: "tests",
    mutation: "none",
    runtime: "slow",
    scope: "Randomized flake detection.",
  },
  {
    ciUsage: "blocking",
    class: "fast-local",
    commands: ["typecheck", "typecheck-astro", "typecheck-tools"],
    domain: "typecheck",
    mutation: "none",
    runtime: "medium",
    scope: "Astro and tooling TypeScript checks.",
  },
  {
    ciUsage: "blocking",
    class: "release",
    commands: ["output-verify", "validate-html", "verify"],
    domain: "generated-output",
    mutation: "none",
    runtime: "medium",
    scope:
      "Built output link, metadata, script, PDF, HTML, and Rust report checks.",
  },
] as const satisfies readonly QaCommandGroup[];

export const qaCommandRegistry: Record<string, QaCommandEntry> =
  Object.fromEntries(
    qaCommandGroups.flatMap(({ commands, ...entry }) =>
      commands.map((command) => [command, entry]),
    ),
  );

export const qaCiJobRegistry: readonly QaCiJobEntry[] = [
  {
    blocking: true,
    ciCommandSnippets: ["just check"],
    job: "quality",
    localCommands: ["just check"],
    notes: "Main pull request quality gate.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: ["taiki-e/install-action@cargo-deny", "just rust-check"],
    job: "rust",
    localCommands: ["just rust-check"],
    notes:
      "Rust workspace and supply-chain gate for operation-core and CLI foundations.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: false,
    ciCommandSnippets: [
      "taiki-e/install-action@cargo-llvm-cov",
      "just rust-coverage",
    ],
    job: "rust-coverage-review",
    localCommands: ["just rust-coverage"],
    notes:
      "Review-only Rust coverage signal for operation-core and future CLI foundations.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: false,
    ciCommandSnippets: ["just review-markdown"],
    job: "markdown-review",
    localCommands: ["just review-markdown"],
    notes: "Review-only Markdown and MDX style signal.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: false,
    ciCommandSnippets: ["just review-assets"],
    job: "asset-review",
    localCommands: ["just review-assets"],
    notes: "Review-only duplicate and unused image signal.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: [
      "just build",
      "just build-cloudflare",
      "just verify",
      "just validate-html",
    ],
    job: "build",
    localCommands: [
      "just build",
      "just build-cloudflare",
      "just verify",
      "just validate-html",
    ],
    notes: "Creates and verifies the artifact used by downstream jobs.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: ["just test-e2e-built"],
    job: "browser",
    localCommands: ["just test-e2e-built"],
    notes: "Runs against downloaded verified build output.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: ["just test-catalog", "just test-catalog-site-instance"],
    job: "catalog",
    localCommands: ["just test-catalog", "just test-catalog-site-instance"],
    notes: "Validates the component catalog and fixture site catalog.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: false,
    ciCommandSnippets: ["just test-a11y-built"],
    job: "accessibility",
    localCommands: ["just test-a11y-built"],
    notes: "Review-only axe scan against downloaded verified build output.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: false,
    ciCommandSnippets: ["just test-perf-built"],
    job: "lighthouse",
    localCommands: ["just test-perf-built"],
    notes:
      "Review-only Lighthouse CI scan against downloaded verified build output.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: ["just docs-check"],
    job: "docs-site",
    localCommands: ["just docs-check"],
    notes: "Builds and verifies the public documentation site instance.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: ["just audit"],
    job: "audit",
    localCommands: ["just audit"],
    notes: "High-severity dependency audit.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: false,
    ciCommandSnippets: ["just audit-all"],
    job: "audit-review",
    localCommands: ["just audit-all"],
    notes: "All-severity dependency audit review.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: false,
    ciCommandSnippets: ["just coverage"],
    job: "coverage-review",
    localCommands: ["just coverage"],
    notes: "Review-only LCOV and coverage inventory.",
    parity: "exact",
    workflow: ".github/workflows/ci.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: ["cloudflare/wrangler-action@v3", "command: deploy"],
    job: "deploy-cloudflare",
    localCommands: ["just deploy-cloudflare"],
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
    localCommands: [],
    notes: "PR-only supply-chain review.",
    parity: "ci-only",
    workflow: ".github/workflows/security.yml",
  },
  {
    blocking: true,
    ciCommandSnippets: ["gitleaks/gitleaks-action@v2"],
    job: "secrets",
    localCommands: ["just secrets"],
    notes:
      "CI action owns GitHub security-event integration; local recipe scans git history.",
    parity: "approximate",
    workflow: ".github/workflows/security.yml",
  },
] as const;

export const qaDomainCoverageRegistry: readonly QaDomainCoverageEntry[] = [
  {
    ciJobs: ["quality"],
    domain: "command-surface",
    focusedCommands: ["just package-check", "just test-config"],
    purpose: "`just` command-surface drift and package-script guard.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: [],
    domain: "setup",
    exception:
      "Setup commands mutate local tool state and are verified by docs plus direct use.",
    focusedCommands: ["just setup", "just setup-browser", "just setup-rust"],
    purpose: "Repository bootstrap commands.",
    releaseCommands: [],
  },
  {
    ciJobs: ["quality", "asset-review"],
    domain: "assets",
    focusedCommands: [
      "just assets-locations",
      "just assets-shared",
      "just review-assets",
    ],
    purpose: "Source asset placement, shared asset policy, and asset review.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: ["quality"],
    domain: "authoring",
    focusedCommands: ["just author-check"],
    purpose: "Author-facing source validation convenience wrapper.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: ["build"],
    domain: "build",
    focusedCommands: ["just build", "just build-release"],
    purpose: "Production build, optimization, PDF, and deploy artifact output.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: ["catalog"],
    domain: "catalog",
    focusedCommands: ["just catalog-check", "just test-catalog"],
    purpose: "Component catalog accountability, builds, and fixture coverage.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: ["quality"],
    domain: "orchestration",
    focusedCommands: ["just check-fast", "just check", "just quality"],
    purpose: "Local and release QA command orchestration.",
    releaseCommands: ["just release-check", "just quality-release"],
  },
  {
    ciJobs: ["coverage-review"],
    domain: "coverage",
    focusedCommands: ["just coverage-check", "just coverage-verify"],
    purpose: "LCOV and broad source coverage accountability.",
    releaseCommands: ["just quality-release"],
  },
  {
    ciJobs: ["quality"],
    domain: "dead-code",
    focusedCommands: ["just deadcode"],
    purpose: "Unused file, export, dependency, binary, and command detection.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: [],
    domain: "diagnostics",
    exception:
      "Investigation-only diagnostic snapshots are run when QA scope changes.",
    focusedCommands: ["just diagnostics-diff", "just qa-registry"],
    purpose:
      "Structured diagnostic snapshot comparison and QA command reports.",
    releaseCommands: [],
  },
  {
    ciJobs: ["quality", "docs-site"],
    domain: "docs",
    focusedCommands: ["just docs-check", "just docs-references-check"],
    purpose: "Generated platform reference drift and docs-site verification.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: ["deploy-cloudflare"],
    domain: "deploy",
    focusedCommands: ["just deploy-cloudflare"],
    purpose: "Cloudflare Workers Static Assets deployment.",
    releaseCommands: ["just build-release"],
  },
  {
    ciJobs: [],
    domain: "development-server",
    exception:
      "Local server commands are manual inspection tools, not QA gates.",
    focusedCommands: ["just dev", "just preview", "just preview-release-fresh"],
    purpose: "Local development and preview servers.",
    releaseCommands: [],
  },
  {
    ciJobs: ["docs-site"],
    domain: "docs-site",
    focusedCommands: ["just docs-site-build", "just test-docs-site"],
    purpose: "Public documentation/example site validation.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: ["quality", "markdown-review"],
    domain: "formatting",
    focusedCommands: [
      "just format",
      "just format-code",
      "just format-markdown",
    ],
    purpose: "Code/config formatting and Markdown review.",
    releaseCommands: ["just release-check", "just quality-release"],
  },
  {
    ciJobs: ["quality", "markdown-review"],
    domain: "lint",
    focusedCommands: ["just lint", "just lint-markdown", "just lint-mdx"],
    purpose: "ESLint, Markdown, and MDX review.",
    releaseCommands: ["just release-check", "just quality-release"],
  },
  {
    ciJobs: ["lighthouse"],
    domain: "payload",
    focusedCommands: ["just payload-report"],
    purpose:
      "Payload measurement, deterministic route-class budgets, and optimization experiments.",
    releaseCommands: ["just payload-check", "just release-check"],
  },
  {
    ciJobs: ["quality"],
    domain: "platform",
    focusedCommands: ["just platform-check"],
    purpose: "Platform/site boundary contract checks.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: [],
    domain: "references",
    exception:
      "Citation audits are manual review tools run during reference work.",
    focusedCommands: ["just references-audit", "just references-bibtex-audit"],
    purpose: "Citation, reference, and bibliography maintenance.",
    releaseCommands: [],
  },
  {
    ciJobs: ["quality"],
    domain: "routes",
    focusedCommands: ["just routes-redirects"],
    purpose: "Route and redirect policy reporting.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: ["rust", "rust-coverage-review"],
    domain: "rust",
    focusedCommands: [
      "just rust-check",
      "just rust-coverage",
      "just rust-nextest",
    ],
    purpose:
      "Rust workspace checks, operation-core tests, blocking supply-chain policy, and review-only Rust coverage/nextest signals.",
    releaseCommands: ["just rust-check"],
  },
  {
    ciJobs: ["audit", "audit-review", "dependency-review", "secrets"],
    domain: "security",
    focusedCommands: ["just audit", "just secrets"],
    purpose: "Dependency audit, dependency review, and secrets scanning.",
    releaseCommands: ["just release-check", "just quality-release"],
  },
  {
    ciJobs: ["quality"],
    domain: "site-config",
    focusedCommands: ["just site-doctor", "just site-schema-check"],
    purpose: "Site configuration validation and schema drift checks.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: ["quality"],
    domain: "starters",
    focusedCommands: ["just starters-check"],
    purpose: "Maintained starter template source and distribution contracts.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: ["quality"],
    domain: "content",
    focusedCommands: ["just content-check", "just tags-check"],
    purpose: "Content source, tag, and author-facing data invariants.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: ["accessibility", "browser", "catalog", "lighthouse", "quality"],
    domain: "tests",
    focusedCommands: [
      "just test",
      "just test-unit",
      "just test-astro",
      "just test-config",
    ],
    purpose: "Unit, component, config, browser, accessibility, and perf tests.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: ["quality"],
    domain: "typecheck",
    focusedCommands: [
      "just typecheck",
      "just typecheck-astro",
      "just typecheck-tools",
    ],
    purpose: "Astro and tooling TypeScript checks.",
    releaseCommands: ["just release-check"],
  },
  {
    ciJobs: ["build", "browser"],
    domain: "generated-output",
    focusedCommands: [
      "just build",
      "just verify",
      "just validate-html",
      "just test-e2e-built",
    ],
    purpose: "Generated routes, links, metadata, HTML, and browser output.",
    releaseCommands: ["just release-check"],
  },
] as const;
