# Generated Output Verifier Contract

This document defines the first contract for IRK-65: a shared diagnostic model
and verifier-module API for generated static output.

The current verifier is intentionally kept working while the platform moves
toward modular output engines. This contract gives later verifier modules a
stable language without forcing the route registry, article compiler artifact,
or publishable-entry contracts to land first.

## Current Inventory

`scripts/build/verify-build.ts` still exposes the release-check CLI and legacy
bucketed string arrays so existing CI output stays stable. The checks now run
through focused verifier modules under `scripts/build/verify-build/`:

- `route-verifier.ts` owns required route output and unexpected dated pages;
- `link-verifier.ts` owns rendered local `href`/`src` targets;
- `redirect-verifier.ts` owns legacy redirect fallback output;
- `feed-verifier.ts` owns generated RSS feed policy;
- `sitemap-verifier.ts` owns sitemap policy;
- `html-inspection.ts` provides shared generated-HTML parsing helpers;
- `html-verifier.ts` owns image alt semantics, scoped media output, embed
  fallback output, and hydration boundaries;
- `metadata-verifier.ts` owns document metadata, JSON-LD, and social previews;
- `pdf-verifier.ts` owns article PDF links, Scholar metadata, generated PDF
  files, PDF document metadata, and media-policy PDF diagnostics;
- `asset-verifier.ts` owns source maps, immutable generated-asset cache policy,
  and unexpected client scripts;
- `content-output-verifier.ts` owns draft leaks, article page counts, and
  private catalog output.

The current release gate verifies:

- required output paths;
- legacy redirect fallbacks;
- invalid redirect pages;
- metadata and JSON-LD;
- image alt attributes;
- scoped article, hover, thumbnail, and embed media output;
- broken links;
- component catalog leakage;
- article page counts;
- draft leakage into feeds, sitemaps, and search output;
- missing article JSON-LD;
- source maps;
- immutable cache headers for hashed generated Astro assets;
- social preview images;
- unexpected static client scripts;
- unexpected generated dated pages;
- unexpected hydration boundaries;
- PDF links, PDF files, Scholar metadata, PDF document metadata, and
  media-policy PDF diagnostics.

The broader `search` and `security` categories are part of the verifier
vocabulary, but they should gain dedicated modules only when the release gate
has concrete generated-output contracts for them. Today, search coverage is
represented by draft-leak checks against Pagefind output, and cache coverage is
limited to the `_headers` policy for immutable hashed Astro assets.

`scripts/site/site-doctor.ts` already has a smaller author-facing diagnostic
shape with `severity`, `message`, `path`, and `repair`. The generated-output
verifier needs a richer machine-readable shape because it must describe source
files, generated artifacts, public URLs, future route registry entries, and
release-report identities.

## Diagnostic Model

A generated-output diagnostic should include:

- a stable namespaced `code`;
- a `severity` of `error`, `warning`, or `info`;
- a `category` that identifies the verifier family;
- a human-readable `message`;
- an optional `location` with source path, output path, route, URL, line, and
  column when known;
- optional `owner` describing whether the issue probably belongs to source
  content, site configuration, platform code, generated output, or an external
  service;
- optional `remediation` text;
- optional `evidence` strings for concrete examples;
- the emitting verifier `moduleId`.

Diagnostic codes must be stable enough for release diffs and future GUI/site
doctor surfaces. A code should be specific enough to identify a class of bug,
but not so specific that every route or file gets its own code.

## Verifier Module API

A verifier module should be a pure contract around one concern:

1. receive an output-verification context;
2. inspect its target concern;
3. return diagnostics;
4. avoid printing directly;
5. avoid process exits;
6. keep IO in the runner or in intentionally injected helpers.

Planned module categories are:

- `route`;
- `link`;
- `redirect`;
- `feed`;
- `sitemap`;
- `html`;
- `metadata`;
- `pdf`;
- `asset`;
- `cache`;
- `search`;
- `security`;
- `build`;
- `content`.

The current implementation adapts module diagnostics back into the legacy
bucketed report shape. This keeps human CLI output and existing JSON report
codes stable while allowing each verifier family to be tested directly.

## Output Expectations

Human CLI output remains the default so local release failures stay readable.
Machine-readable JSON output should be available for future site doctor, GUI,
CLI, MCP, release-report, and observability consumers.

Diagnostic identity for diffs is based on:

- code;
- severity;
- location output path, source path, route, or URL when present;
- message when no location is present.

This identity is intentionally stable enough for before/after diagnostic diffs
without pretending every verifier has perfect source maps yet.

## Verification Requirements

IRK-65 is complete when:

- the current build-verifier issue buckets can map to structured diagnostics;
- human CLI output is preserved;
- JSON output is available;
- diagnostic creation, aggregation, identities, and blocking severity handling
  have focused unit coverage;
- reusable platform modules remain free of TPM-specific coupling.

Later milestones can replace the compatibility bridge with a native diagnostic
runner once downstream release reports and GUI/CLI/MCP consumers are ready to
consume module diagnostics directly.
