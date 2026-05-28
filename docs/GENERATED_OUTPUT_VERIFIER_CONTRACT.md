# Generated Output Verifier Contract

This document defines the first contract for IRK-65: a shared diagnostic model
and verifier-module API for generated static output.

The current verifier is intentionally kept working while the platform moves
toward modular output engines. This contract gives later verifier modules a
stable language without forcing the route registry, article compiler artifact,
or publishable-entry contracts to land first.

## Current Inventory

`just verify` is the active generated-output verification command. It calls the
internal Rust task adapter in `crates/tpm-xtask/src/tasks.rs` through the
private `just _xtask verify` plumbing. The older TypeScript verifier modules
were removed during the Rust/`just` migration; future verifier work should
deepen the Rust module set instead of reintroducing repository-owned
TypeScript automation. This maintenance adapter is intentionally separate from
the user-facing `tpm` product CLI.

The current generated-output gate verifies:

- required output paths;
- generated `_redirects`, RSS feed, and sitemap index files;
- generated HTML doctype presence;
- insecure same-site HTTP URL leakage in rendered HTML.

Additional output intelligence is available through adjacent Rust or ecosystem
commands:

- `just validate-html` calls `html-validate` through a Rust task adapter over
  representative generated HTML targets;
- `just output-verify` runs the Rust operation report bridge for future
  machine-readable output diagnostics;
- `just build-cloudflare` writes Cloudflare redirect artifacts from Rust;
- `just build-optimize` removes unreferenced hashed Astro raster assets from
  generated `_astro/` output.

The broader `search` and `security` categories are part of the verifier
vocabulary, but they should gain dedicated modules only when the release gate
has concrete generated-output contracts for them. Today, search coverage is
represented by draft-leak checks against Pagefind output, and cache coverage is
limited to the `_headers` policy for immutable hashed Astro assets.

The generated-output verifier needs a richer machine-readable shape because it
must describe source files, generated artifacts, public URLs, future route
registry entries, and release-report identities.

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

The current Rust implementation is intentionally small. As verifier families
are deepened, keep them as pure modules that return structured diagnostics and
let the CLI, release gate, GUI, and MCP surfaces adapt those diagnostics for
their consumers.

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
