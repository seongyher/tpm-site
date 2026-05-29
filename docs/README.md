# Documentation Map

This directory contains product, platform, authoring, and implementation
contracts. Keep the root of `docs/` thin: add new documents to the most
specific domain directory below, and add a new directory only when an existing
one would blur ownership.

Use `agent-docs/` for internal engineering philosophy, roadmap planning,
research notes, and agent-facing audits. Use `docs/` for durable contracts,
user-facing or platform-facing reference material, and implementation designs
that should survive beyond a single planning pass.

## Directories

- `assets/`: shared documentation images and screenshots.
- `audits/`: durable audit reports that remain useful as historical context.
- `authoring/`: author and site-owner workflows, diagnostics, article features,
  site anatomy, theme contracts, authors, tags, bibliography, and PDFs.
- `citations/`: citation, BibTeX, article-reference, corpus-audit, and
  canonical-verification work.
- `cli/`: product-facing CLI contracts and command-language designs.
- `components/`: component catalog contracts, primitives, and templates.
- `deferred/`: postponed component or feature notes that are not active plans.
- `generated/`: generated documentation artifacts. Do not edit by hand.
- `governance/`: release, security, localization, import/export, documentation
  lifecycle, and supply-chain policies.
- `layouts/`: layout-specific component documentation.
- `metadata/`: metadata, semantic graph, social preview, webmaster, and
  machine-readability contracts.
- `navigation/`: navigation architecture and interaction primitive designs.
- `operations/`: deployment, Cloudflare, extension, and media/provider adapter
  contracts.
- `performance/`: Lighthouse, build, payload, minification, and performance
  optimization research and plans.
- `platform/`: platform module contracts, source contracts, routing, starter
  templates, package boundaries, homepage model, and generated-output
  contracts.
- `qa/`: QA pipeline, site doctor, fixture matrix, and test strategy docs.
- `rehype-plugins/`: rehype plugin implementation contracts.
- `remark-plugins/`: remark plugin implementation contracts.
- `rust/`: Rust workspace, operation, adapter runtime, and TypeScript
  automation migration docs.
- `studio/`: Studio/CMS contracts shared by GUI, CLI, MCP, Tauri, publishing,
  provider capabilities, credentials, parity, and test plans.
- `studio/gui-mvp/`: first shippable Studio GUI MVP product, visual, fixture,
  component, dependency, and Figma handoff specs.

## Placement Rules

- Put source-of-truth contracts beside their domain, not in the root.
- Prefer one durable contract per document. Split scratch notes into
  `agent-docs/` until they become stable enough for `docs/`.
- Keep generated files under `docs/generated/`.
- Keep GUI reference images near the GUI docs that consume them.
- Update `AGENTS.md` when adding a new long-lived docs directory or changing
  a directory's ownership.
