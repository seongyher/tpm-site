# Agent Instructions

This file is the operating manual for agents working in this repository.

## Operating Priorities

The Philosopher's Meme is a Bun-managed, `just`-driven Astro static site with
an additive Rust operation/tooling workspace.

Primary goals:

- Preserve article content and historically important metadata.
- Rebuild the site as modern responsive Astro/Tailwind components.
- Keep authoring simple: adding Markdown or MDX articles should not require
  touching application code.
- Prefer professional Astro, Tailwind, accessibility, and performance standards
  over preserving early prototype implementation details.

The current Astro UI can guide tone, palette, and content structure, but it is
not an architectural contract.

Default priorities:

1. Content fidelity.
2. Static-first Astro output.
3. Responsive component architecture.
4. Tailwind-first styling.
5. Small explicit hydration boundaries.
6. Strict tooling and clear checks.
7. Simple maintainable code.

## Bun Usage

Bun remains the JavaScript package manager, lockfile owner, JS test runner, and
adapter for TypeScript/Astro ecosystem tooling. It is no longer the repository
command surface.

- Use `bun install` for dependency installation, normally through
  `just setup`.
- Use `just <recipe>` for repository workflows instead of `bun run <script>`.
- Use `bun test` where the `just` recipe intentionally runs JS/TS tests.
- Use `bun scripts/build/generate-article-pdfs.ts` only through
  `just build-pdf`; it is the retained legacy PDF-generation exception.
- Use `bunx <package> <command>` instead of `npx <package> <command>` when a
  package runner is needed.
- Do not reintroduce package scripts unless the task explicitly requires a
  temporary compatibility shim with documented ownership and an expiry trigger.
- Do not introduce unrelated build toolchains into the Astro build path.

Do not add new repository-owned TypeScript automation scripts. Deterministic
repository tooling belongs in internal Rust task adapters or Rust operations
behind `just`; TypeScript should stay focused on Astro/frontend/product code.

## Rust And Just Usage

The Rust workspace is additive infrastructure for the future platform core,
CLI, MCP, and Tauri studio backend. Rust owns promoted deterministic operation
contracts, while Astro/Bun ecosystem tools remain adapters where they are still
the correct boundary.

- Use `cargo` for direct Rust formatting, checks, lints, and tests.
- Use `just --list` to discover repository command-router recipes.
- Keep `justfile` recipes as orchestration only; do not put domain logic there.
- Prefer promoting deterministic repository-owned tooling to Rust operations
  with parity evidence or documented accepted differences.
- Keep Rust crates dependency-light and strict. Unsafe Rust is forbidden by
  default.
- Do not weaken existing Bun, Astro, TypeScript, browser, accessibility,
  performance, or release gates when adding Rust gates.

## Project Map

- `Cargo.toml`: additive Rust workspace root, shared metadata, dependencies,
  and lint policy.
- `Cargo.lock`: committed Rust dependency lockfile for deterministic tool and
  binary builds.
- `rust-toolchain.toml`: pinned Rust toolchain and required components.
- `rustfmt.toml`: explicit stable Rust formatting policy.
- `deny.toml`: Rust supply-chain policy for blocking `cargo-deny` checks.
- `justfile`: canonical repository command router over Rust operations and
  JS/Astro ecosystem adapters; keep it orchestration-only.
- `crates/`: additive Rust platform crates. Rust code owns promoted operation
  and tooling behavior where documented; otherwise it remains additive until
  parity promotion.
- `crates/tpm-cli/`: user-facing product CLI shell and first command grammar
  over operation contracts. Do not place repository maintenance tasks here.
- `crates/tpm-xtask/`: internal Rust repository automation invoked by focused
  `just` recipes. This is not a product CLI surface.
- `crates/tpm-operations/`: shared operation request/result envelopes for
  future CLI, GUI, MCP, CI, and generated-output consumers.
- `apps/studio/`: static Astro frontend shell and minimal Tauri desktop shell
  for the future studio. Keep it read-only until operation-backed Tauri
  bindings, plan/apply safety, and provider capabilities are implemented.
- `crates/tpm-mcp/`: transport-agnostic MCP resource, tool, plan, apply-gate,
  and safety contracts over shared operation results. Do not add source writes
  or provider mutations here before plan/apply, permission, audit, and
  capability gates exist.
- `site/`: default TPM site instance. Publication-specific content, assets,
  public files, theme overrides, redirects, and site config belong here.
- `site/config/site.json`: publication configuration. Keep TPM-specific text,
  URLs, social links, and toggles here when practical.
- `site/theme.css`: publication theme overrides layered onto platform styles.
- `site/content/articles/`: current source-of-truth article content.
- `site/content/announcements/`: announcement entries that are article-like but
  separate from the normal article directory.
- `site/content/authors/`: author profiles and aliases.
- `site/content/categories/`: optional category display metadata.
- `site/content/collections/`: curated article/announcement collections.
- `site/content/pages/`: source-of-truth Markdown pages such as `/about/`.
- `site/assets/`: source assets that should go through Astro's asset pipeline.
- `site/public/`: static files copied directly to build output.
- `site/unused-assets/`: intentionally parked source assets.
- `examples/`: site-neutral example instances and platform consumer examples
  that exercise the platform without TPM-specific content.
- `examples/starters/`: maintained starter site instances. Keep these
  generic, author-friendly, and validated by the starter-template registry.
- `examples/docs-site/`: documentation-site example instance.
- `examples/platform-entrypoint-consumer/`: minimal consumer that verifies the
  stable internal platform entrypoints can be imported without incidental app
  coupling.
- `src/pages/`: Astro file routes and endpoints.
- `src/layouts/`: shared document, page, and article layouts.
- `src/components/`: reusable Astro UI, layout, navigation, article, block, and
  island components.
- `src/components/ui/`: shadcn/Radix-style primitives when useful.
- `src/lib/`: content, route, metadata, validation, and domain helpers.
- `src/platform/`: stable internal platform entrypoints for future studio,
  CLI, MCP, examples, and package-boundary consumers.
- `src/styles/`: global Tailwind entry, tokens, base styles, and prose styles.
  Keep this small.
- `src/content.config.ts`: Astro content collection config that resolves the
  active site instance.
- `scripts/`: retained PDF generator, script-adjacent authoring design notes,
  and JSON ignore/configuration files consumed by Rust task adapters. Do not
  add new TypeScript automation here.
- `tests/`: unit, e2e, accessibility, and performance tests.
- `tests/fixtures/rust-workspace/`: small neutral site-like fixture for Rust
  workspace and future operation tests.
- `tests/fixtures/rust-operations/`: stable JSON fixtures for
  machine-readable Rust operation contracts.
- `dist/`: generated build output. Do not edit by hand.
- `dist-catalog/`: generated private component catalog output. Do not edit by
  hand.
- `CHECKLIST.md`: implementation milestone tracker.
- `DEFERRED.md`: postponed work with reasons and resume triggers.
- `COMMANDS.md`: brief reference for repository `just` recipes and the
  retained TypeScript PDF-generation exception.
- `agent-docs/README.md`: agent documentation map, placement rules, and
  planning/research directory ownership.
- `agent-docs/core/ENGINEERING_PHILOSOPHY.md`: repo-wide code-health,
  strictness, modularity, type-driven design, and testing philosophy.
- `agent-docs/roadmap/PLATFORM_ROADMAP.md`: long-term platform, CMS, CLI, MCP,
  tooling, and productization roadmap.
- `agent-docs/cli/TPM_CLI_PRODUCT_STRATEGY.md`: product strategy, command
  language, user journeys, and implementation direction for the future CLI.
- `agent-docs/rust/RUST_MIGRATION_AND_CLI_PLAN.md`: Rust-first migration plan,
  crate boundaries, CLI/Tauri/MCP reuse model, `just` orchestration, and Rust
  QA strategy.
- `agent-docs/rust/RUST_ENGINEERING_GUIDE.md`: project-specific idiomatic Rust
  guide for domain modeling, pure/impure seams, diagnostics, tests, docs,
  dependency policy, and strict tooling.
- `agent-docs/rust/XTASK_ARCHITECTURE_REDESIGN.md`: internal Rust xtask
  architecture redesign for moving repository automation toward domain modules,
  parse-first options, pure planning seams, and auditable coverage exceptions.
- `agent-docs/roadmap/CLI_RUST_GUI_INTEGRATION_PLAN.md`: coordinated high-level plan
  for the Rust operation core, CLI, MCP, and Tauri/Astro studio GUI.
- `agent-docs/migrations/MILESTONE_9_DUAL_RUN_MIGRATION_REPORT.md`: current
  parity-protected Rust/`just` migration classifications, promoted/internal
  command surfaces, accepted differences, and verification expectations.
- `agent-docs/migrations/MILESTONE_9_COMMAND_SURFACE_MIGRATION.md`: current milestone 9
  command-surface inventory, package-script retirement policy, allowed Bun
  adapter rules, and remaining migration fallback plan.
- `agent-docs/rust-migration-research/RUST_QA_TOOLING_EVALUATION.md`:
  source-checked Rust QA/static-analysis tooling evaluation, adoption timing,
  and blocking versus review-only gate guidance.
- `agent-docs/studio/STUDIO_PRODUCT_VISION.md`: end-product studio/CMS vision,
  product modes, default author UX, and non-goals.
- `agent-docs/studio/STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md`: studio product
  architecture decision, publication workspace model, product surface
  traceability, and first product-slice boundaries.
- `agent-docs/studio/STUDIO_ADAPTER_MODEL.md`: source, media, history, workflow,
  build, deploy, identity, and diagnostics adapter boundaries.
- `agent-docs/studio/STUDIO_EXTENSION_MODEL.md`: core, bundled, optional, site, and
  third-party extension boundaries for the future studio.
- `agent-docs/qa/QA_PREFLIGHT.md`: QA command inventory, CI parity model,
  failure-probe plan, diagnostic-diff design, and scope-cleanup notes.
- `agent-docs/core/DESIGN_PHILOSOPHY.md`: expanded design philosophy notes.
- `agent-docs/core/COMPONENT_ARCHITECTURE.md`: target component hierarchy,
  component responsibilities, navigation redesign direction, and migration
  sequence.
- `agent-docs/core/ASTRO_GUIDANCE.md`: expanded Astro notes.
- `agent-docs/core/TAILWIND_GUIDANCE.md`: expanded Tailwind notes.
- `docs/README.md`: documentation map, placement rules, and directory
  ownership.
- `docs/authoring/`: author and site-owner workflows, diagnostics, site
  anatomy, article features, authors, tags, bibliography, and PDFs.
- `docs/citations/`: citation, BibTeX, article-reference, corpus-audit, and
  canonical-verification work.
- `docs/platform/`: platform module contracts, source contracts, routing,
  starter templates, package boundaries, homepage model, and generated-output
  contracts.
- `docs/metadata/`: metadata, semantic graph, social preview, webmaster, and
  machine-readability contracts.
- `docs/studio/`: Studio/CMS contracts shared by GUI, CLI, MCP, Tauri,
  publishing, provider capabilities, credentials, parity, and test plans.
- `docs/studio/gui-mvp/`: first shippable Studio GUI MVP product, visual,
  fixture, component, dependency, and Figma handoff specs.
- `docs/cli/`: product-facing CLI contracts and command-language designs.
- `docs/rust/`: Rust workspace, operation, adapter runtime, and TypeScript
  automation migration docs.
- `docs/operations/`: deployment, Cloudflare, extension, and media/provider
  adapter contracts.
- `docs/governance/`: release, security, localization, import/export,
  documentation lifecycle, generated-output security, and supply-chain
  policies.
- `docs/qa/`: QA pipeline, site doctor, fixture matrix, and test strategy
  docs.
- `docs/performance/`: Lighthouse, build, payload, minification, and
  performance optimization research and plans.
- `docs/components/`, `docs/layouts/`, `docs/navigation/`,
  `docs/rehype-plugins/`, and `docs/remark-plugins/`: component, layout,
  navigation, and Markdown pipeline contracts.
- `docs/assets/`: shared documentation media.
- `docs/generated/`: generated documentation artifacts, including platform and
  `tpm` CLI references. Do not edit generated files by hand.
- `docs/deferred/`: postponed notes.

## Project-Local Skills

Repo-local skills live in `.agents/skills/<skill-name>/SKILL.md`.

- `shadcn`: use when working with shadcn/ui, component registries, presets,
  Radix/shadcn components, or shadcn CLI workflows. Load
  `.agents/skills/shadcn/SKILL.md` before making shadcn-related changes.

When a project-local skill matches the task, read its `SKILL.md` and follow its
workflow before making changes.

## Checklist And Deferred Work

Move postponed work to `DEFERRED.md` with a concise reason and a concrete
resume trigger. When deferred work becomes active, move it back into
`CHECKLIST.md` before implementation begins. Do not mark deferred work complete
in `DEFERRED.md`; completion belongs in the active checklist after verification.

## Engineering Philosophy In Practice

The repo should behave like a typed static publishing compiler: authors and
site owners express publication intent through content, assets, redirects,
theme, and typed config; platform code validates and normalizes that intent,
then emits static routes, HTML, metadata, feeds, search data, PDFs, assets, and
diagnostics.

Use `agent-docs/core/ENGINEERING_PHILOSOPHY.md` as the decision aid for substantial
platform work. Use `agent-docs/roadmap/PLATFORM_ROADMAP.md` when work touches roadmap
domains, future CMS/studio readiness, CLI/MCP behavior, public generated
output, or platform productization.

Apply these rules when designing or changing code:

- Treat author confusion as a product bug. Normal article, announcement,
  collection, support link, social link, and homepage changes should move
  toward content/config edits rather than app-code edits.
- Design features so correct changes are easy, obvious, and local while
  incorrect changes are hard to express, rejected early, or forced through
  explicit escape hatches. Anticipate likely future mistakes and encode
  prevention in schemas, types, registries, policies, primitives, diagnostics,
  and tests.
- Treat recurring bugs as abstraction feedback. When fixing one, ask whether a
  schema, type, policy helper, layout recipe, component primitive, or verifier
  can make that bug class impossible or noisy.
- Use small, useful seams that separate real concerns: pure from impure,
  platform from site instance, policy from presentation, data model from view
  model, and source input from generated artifact.
- Prefer domain-expressive APIs over generic helpers. Use project concepts such
  as publishable entries, visibility surfaces, route references, metadata
  profiles, media policies, citations, artifacts, diagnostics, and view models.
- Keep one canonical normalized model for each recurring domain concept.
  Derive surface-specific view models from that model instead of duplicating
  string literals, schema fragments, route rules, labels, or visibility logic.
- Keep messy edges thin. Filesystem, Astro collection, DOM, browser storage,
  network, process/env, and deployment code should be adapters around pure,
  typed domain logic.
- Keep future studio, CLI, MCP, CI, and GUI workflows on the same contracts.
  Do not create a parallel CMS/source model; expose the same schemas,
  compiler artifacts, route registry, diagnostics, media policies, metadata
  profiles, and generated-output contracts through different interfaces.
- Design for extractability before extraction. Identify whether code is
  site-specific, platform-specific, Astro-adapter code, framework-agnostic
  core, environment-agnostic core, or a future product-agnostic library. Do not
  publish packages prematurely, but avoid TPM, Astro, cwd, and singleton
  assumptions in code that should become portable.
- Make diagnostics actionable. Author/site-owner diagnostics should identify
  the file, route or artifact, severity, stable code when practical, cause, and
  concrete remediation in author language.
- Optimize for fearless velocity: the fastest path should be the valid path.
  Good abstractions should reduce what developers must remember, make
  intentional changes local and testable, and make subtle bugs difficult to
  introduce.

## Platform Entrypoints And Starters

Treat `src/platform/*` as the internal public seam for future studio, CLI, MCP,
example consumers, and package-boundary work. These modules should expose
domain-shaped contracts by re-exporting or composing stable `src/lib` modules;
they should not import Astro pages, layouts, visual components, TPM site
content, tests, scripts, or provider-specific deployment tooling.

Keep platform seams site-neutral. TPM-specific wording, URLs, support links,
social handles, theme choices, and content belong in `site/` or typed site
configuration, not in platform entrypoints or starter examples.

Starters are maintained distribution assets, not throwaway fixtures. When
adding or changing starters:

- update `src/lib/starter-templates.ts`, `docs/platform/STARTER_TEMPLATES.md`, and any
  affected examples together;
- keep default copy generic, inclusive, and suitable for a new publication;
- verify every starter uses only supported source contracts and no accidental
  TPM-only assumptions;
- run `just starters-check` or a broader check that includes it.

When adding a new platform-facing domain, update `docs/platform/PLATFORM_MODULES.md` and
the relevant contract document before relying on the seam from examples,
future studio code, CLI/MCP plans, or tests.

## Architecture Standard

Build the site from responsive design blocks and responsive components.

Default stack:

- Astro components for site UI.
- Tailwind CSS for component styling.
- Tailwind Typography for Markdown-rendered article prose.
- Markdown for normal articles.
- MDX for articles that need custom components.
- Build-time Astro content collections for article data.
- Static HTML output by default.
- Hydrated islands only when interaction requires them.

The component model is:

```text
Pages
  compose responsive Blocks

Blocks
  compose responsive Components

Components
  compose responsive UI primitives
```

Pages should orchestrate, not implement. Route files load data, choose params,
normalize props, and compose layouts/blocks. Normalize content data in `src/lib`
or loaders, not in visual components.

Every component owns its responsive behavior, spacing, wrapping, focus states,
dark mode behavior, and accessibility semantics. Do not fix component layout
failures with page-level CSS patches.

Component files should stay view-focused and mostly declarative:

- Use `const` derivations, props, slots, and typed helper calls instead of
  mutable local state.
- Do not put IO, filesystem access, network access, process/env reads, or
  repository automation inside component files.
- Avoid loops and in-place mutation in components; use `map`, `filter`,
  `flatMap`, `reduce`, object/array spreads, or move the logic into a typed
  helper.
- Keep Astro components static by default. If runtime interaction is required,
  isolate it in the smallest script, custom element, React island, or external
  controller that satisfies the requirement.
- Keep React component files as views over explicit props and narrowly scoped
  interaction state. Move non-view logic into typed helpers or custom hooks.

Strong UI work in this project should make good composition easy and invalid
states hard to express:

- Use type-driven design. Model data and UI state so invalid states are
  unrepresentable wherever practical.
- Keep pages thin and compose them from blocks, components, and primitives.
- Give components explicit typed props, clear slots, stable variants, and
  narrow responsibilities.
- Prefer composition over large configuration objects or boolean prop clusters.
- Model mutually exclusive UI states as discriminated states, not scattered
  booleans.
- Keep build/content data, URL state, form draft state, and local interaction
  state separate unless combining them is deliberate.
- Use semantic HTML first, then ARIA only when native semantics are not enough.
- Design loading, empty, error, disabled, selected, expanded, and long-content
  states before calling a component complete.
- Prefer one primary reusable component per file.
- Use PascalCase filenames/references for reusable components.
- Use semantic props such as `variant`, `size`, `tone`, `pressed`, and `href`.
- Do not repurpose native prop names like `class`, `style`, `href`, or
  `disabled` for non-native meaning.
- Default optional props during destructuring or normalization.
- Prefer named variants over clusters of booleans.
- Spread rest attributes sparingly and only after filtering.
- Use stable keys for repeated React items; avoid indexes when order can change.

Suggested component responsibilities:

- `BaseLayout`: `<html>`, `<head>`, global CSS, skip link, body shell, slots.
- `SEO`/`Head`: title, description, canonical, OG/Twitter, RSS, JSON-LD.
- `ArticleLayout`: title, description, dates, author, tags, hero, prose slot.
- `ArticleProse`: Tailwind Typography, measure, headings, links, code, images.
- `ArticleImage`: `Image`/`Picture` defaults, required alt, caption slot.
- `Container`/`Section`: max width, gutters, rhythm, full-width bands.
- `SiteHeader`/`SiteNav`: static header and links.
- `MobileNav`, `ThemeToggle`, `SearchBox`: smallest interactive boundaries.

Use React, shadcn, and Radix only when interaction complexity justifies them.
Static primitives and layout blocks should usually be Astro components.

Target component organization:

- `src/components/ui/`: buttons, links, inputs, badges, separators, icon
  buttons, containers, and low-level primitives.
- `src/components/layout/`: base layout, site shell, page frame, header,
  footer.
- `src/components/navigation/`: primary nav, mobile nav, category navigation,
  breadcrumbs.
- `src/components/articles/`: article header, metadata, article lists, cards,
  prose wrapper.
- `src/components/blocks/`: homepage sections, support blocks, category
  sections, about sections.

## Responsive Design Standard

Responsive design is content-out and component-first. Mobile-first means the
unprefixed base is the smallest useful version, then larger breakpoints enhance
the layout.

Every reusable component should answer:

- What is the smallest useful version?
- What happens when it gets much wider than expected?
- Does it depend on viewport width or container width?
- Does hierarchy change when columns collapse?
- Does interaction change with space or input method?
- Is extra density only an enhancement?
- Can text wrap without overlap or horizontal overflow?
- Does media preserve meaning at each size?

Prefer normal flow, flex, grid, intrinsic sizing, `minmax()`, `auto-fit`,
`aspect-ratio`, `object-fit`, container queries, and Tailwind tokens before
custom CSS. Avoid raw pixels and magic numbers. Tailwind already abstracts most
spacing, sizing, typography, radius, shadow, color, breakpoint, and container
values into a shared scale.

Arbitrary values are acceptable only for specific design or technical reasons.
Repeated arbitrary values should become a token, component prop, or named
utility.

Do not add one-off breakpoint patches after visual trial and error. If a
component breaks at a width, redesign the component's constraints and wrapping
strategy.

Navigation deserves special care. Hiding navigation behind a menu can be right,
but it should be a deliberate prioritization decision, not a way to avoid
simplifying the information architecture. Prefer focused navigation,
progressive disclosure, and a reliable all-items fallback over crowded rows
that collide.

Design system rules:

- Cards are for repeated items, modals, and genuinely framed tools.
- Do not put UI cards inside other cards.
- Do not style page sections as floating cards.
- Page sections should be full-width bands or unframed layouts with constrained
  inner content.
- Avoid gradient/orb/bokeh decoration. Gradients are not part of the current
  visual direction unless explicitly re-approved.
- Text must fit its parent at mobile and desktop sizes.
- Use stable dimensions for fixed-format UI elements such as boards, grids,
  toolbars, icon buttons, counters, and tiles.
- Do not scale font size with viewport width.
- Letter spacing should usually be `tracking-normal`.

## Astro Operating Model

Astro is content-first and static-first. Default to build-time HTML and zero
client JavaScript. Choose the least dynamic primitive:

1. Static `.astro` component.
2. Build-time content collection.
3. Small processed `<script>` or custom element.
4. Hydrated framework island.

This project is a static site deployed to Cloudflare Workers Static Assets. Do
not add SSR adapters, request-time routes, middleware, server islands, or Astro
Actions unless the project explicitly stops being static.

Astro frontmatter runs at build/render time. Template expressions are not
reactive after HTML is sent. `window`, `document`, and `localStorage` belong in
browser scripts or hydrated islands.

Do not treat Astro like React, Next, or a Vite SPA. Pages are documents,
components are templates, and hydration is opt-in.

Use the repo Bun scripts in the Quality Gate section for normal development and
verification. Do not initialize a new Astro project or add Astro integrations
unless the task explicitly requires it. Astro requires Node.js `22.12.0` or
newer.

Conventional structure:

```text
site/content/          active site-instance content collections
site/assets/           active site-instance processed source assets
site/public/           active site-instance files copied as-is to site root
site/config/           active site-instance configuration
src/pages/              file routes and endpoints
src/components/         UI, blocks, primitives, islands
src/layouts/            document and content shells
src/styles/             global CSS entry and tokens
src/env.d.ts            global app types
src/content.config.ts   site-instance-backed content collection config
astro.config.ts         framework config
dist/                   generated output
```

Only `src/pages/` is required and reserved by Astro. Use `site/assets/` for
project-owned assets that should be optimized, fingerprinted, or type checked.
Use `site/public/` only for files that must be copied untouched, such as
`favicon.svg`, `robots.txt`, `CNAME`, verification files, and downloads.

## Astro Components

An `.astro` file has optional frontmatter and a template:

```astro
---
import Child from "./Child.astro";

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<section>
  <h2>{title}</h2>
  <Child />
</section>
```

Frontmatter can import modules, use TypeScript, use top-level `await`, fetch
private data, and read `Astro.props`, `Astro.params`, `Astro.url`, etc. It
cannot hold browser state or attach event handlers to HTML.

Template rules:

- Use HTML attributes: `class`, `for`, `tabindex`, `data-value`.
- Do not use React attributes like `className`.
- Use `{value}` for expressions.
- Multiple root elements are allowed.
- HTML comments render; JS comments do not.
- Dynamic tag variables must be capitalized.
- Hydration directives do not work on dynamic tags.
- Directives must be compiler-visible; they cannot be hidden in spread objects.
- Use `class:list` for class composition.
- Use `set:html` only for trusted or sanitized HTML; prefer normal expressions
  or `set:text` for text.
- Use `Fragment` when a directive needs no wrapper.

Astro does not auto-forward attributes. For wrapper components, type native
attributes, remove implementation props, and spread only onto the intended
element:

```astro
---
import type { HTMLAttributes } from "astro/types";

interface Props extends HTMLAttributes<"a"> {
  variant?: "plain" | "button";
}

const { variant = "plain", class: className, ...attrs } = Astro.props;
---

<a
  {...attrs}
  class:list={[
    "inline-flex items-center",
    variant === "button" && "rounded-md px-3 py-2",
    className,
  ]}
>
  <slot />
</a>
```

Slots: use `<slot />`, named slots for layout regions, and
`Astro.slots.has("name")` when wrapper markup should render only if content
exists. Use `Astro.slots.render()` rarely; it returns HTML strings and often
leads to unnecessary `set:html`.

## Astro Routing And Data

Routes are file-based under `src/pages/`. Static routes map directly from files.
Dynamic routes use `[slug].astro`, `[...path].astro`, etc. Static output for
dynamic routes requires `getStaticPaths()`.

Routing rules:

- Keep URL construction centralized in route helpers.
- Use trailing slashes consistently with `astro.config.ts`.
- Set and preserve `site` in `astro.config.ts` for canonical URLs, sitemap,
  RSS, and `Astro.site`.
- Know route config options before changing output behavior: `prerender`,
  `partial`, `trailingSlash`, and `build.format`.
- Do not let historical permalink metadata drive core routing.
- Avoid client-side routing unless there is a strong product reason.
- Endpoint routes should return `Response` objects.
- Use `[...id].astro` when content IDs can contain `/`.
- Prefix route files or directories with `_` to exclude them from routing.
- Use `paginate()` in `getStaticPaths()` for paginated archives.

`Astro` context is available during rendering and includes `Astro.props`,
`Astro.params`, `Astro.url`, `Astro.site`, `Astro.generator`,
`Astro.request`, `Astro.response`, and helpers such as `Astro.redirect()` and
`Astro.rewrite()`.

Content collections are the default source for articles and pages. Use schemas
to validate frontmatter and make invalid content fail early. Use
`getCollection()`/`getEntry()` for data and `render(entry)` from
`astro:content` for Markdown/MDX bodies. Do not rely on Markdown `layout`
frontmatter for collection entries.

For article routing, use stable slugs based on the content entry ID. Detect
duplicate slugs deterministically at build time.

Content collection rules:

- Use `glob()` for local files and `file()` for JSON/YAML/CSV data.
- Use Zod schemas for frontmatter.
- Use `image()` for local image metadata when validating image fields.
- Use `reference()` for validated collection references.
- Always sort collections explicitly before rendering lists.
- Keep author-facing frontmatter small and meaningful.
- Treat frontmatter as data, not executable logic.
- Validate dates, images, tags, authors, and historical metadata at the
  collection boundary.
- Use a single published-content helper/filter for pages, RSS, sitemap, search,
  related posts, and archives.
- Avoid frontmatter `slug` unless intentionally customizing generated entry IDs.
- Prefer filename/file path slugs unless deliberately changing URL policy.
- Use draft filtering so unpublished content never leaks.

Markdown and MDX rules:

- Authors use Markdown for normal articles and MDX when an article needs
  imported components.
- Keep article body rewrites out of incidental UI work.
- Use Tailwind Typography for generated prose.
- Do not ship React for static Markdown prose.
- Do not change Markdown/MDX plugins, MDX component mapping, or full-content RSS
  rendering unless explicitly asked.

Static data rules:

- Use static prerendering and build-time content collections.
- Use static endpoints for generated files such as RSS or feeds.
- Keep client state out of static content rendering paths.

Environment:

- Avoid adding environment-variable requirements to the static site.
- Track only non-secret env defaults that are part of the repo contract.
  Local overrides and secrets belong in ignored `.env.local` or
  `.env.*.local` files.
- Do not read secrets in client-side code.
- Never put secrets in `PUBLIC_*`.
- `.env` is not automatically loaded in `astro.config.ts`; use `process.env`
  or Vite `loadEnv()` when config-time env access is genuinely needed.
- Validate required variables during build/check.

High-impact Astro config options include `site`, `base`, `trailingSlash`,
`integrations`, `compressHTML`, `prerenderConflictBehavior`, `vite`, `build.*`,
`image.*`, and Markdown plugins. Know what an option does before changing it;
prefer `prerenderConflictBehavior: "error"` when route conflicts should fail
loudly. Do not add `output: "server"` or an SSR adapter unless explicitly
asked.

If an Astro API detail is uncertain, verify it against the current Astro docs
before changing code. This project has an Astro Docs MCP server available in
Codex sessions. Do not guess framework behavior when a checkable API is
involved.

## Islands And Hydration

Hydration is an exception.

Allowed client behavior should be small and explicit:

- mobile navigation;
- theme toggle persistence;
- search enhancement;
- article-specific MDX interactions.

Do not hydrate large layout regions. Do not ship React for static content. If
React or shadcn/Radix components are added, prerender static components and
hydrate only the smallest interactive boundary.

Use client directives deliberately:

- `client:load` only for immediately needed above-the-fold interaction.
- `client:idle` for lower-priority interaction.
- `client:visible` for below-the-fold or heavy interaction.
- `client:media` for viewport-specific interaction.
- Avoid `client:only` unless explicitly needed; it skips static prerendering for
  that component.

Processed component scripts are `<script>` tags with no attributes except an
optional `src`; Astro bundles, deduplicates, and optimizes them. Extra
attributes or `is:inline` make a script unprocessed. Use `is:inline` sparingly,
mainly for tiny boot scripts such as initial theme setup.

Astro HTML does not support React-style `onClick={handler}` event props. For
small interactions, use processed scripts, custom elements, or the smallest
hydrated island. Pass build-time values to scripts with `data-*` attributes or
JSON script data. Avoid `define:vars` on scripts unless inline duplication is
intentional.

Astro components cannot be hydrated. Framework component files cannot import
`.astro` components. Hydrated props must be serializable; functions cannot cross
from Astro build-time code to client framework props.

React island rules: prefer function components, explicit TypeScript props,
local/minimal state, composition/hooks over HOCs, stable keys, valid ARIA,
semantic HTML, no `accessKey`, useful alt text, and filtered prop spreading.

Useful Astro built-ins and directives:

- `Image`, `Picture`, and `Font` from `astro:assets`.
- `Fragment` in Astro templates.
- Directives include `class:list`, `set:html`, `set:text`, `client:*`,
  `is:global`, `is:inline`, `define:vars`, and `is:raw`.

Default Astro navigation is multi-page document navigation. Do not add
client-side routing or page-transition machinery without an explicit product
decision.

## Tailwind Operating Model

This project already uses Tailwind CSS 4, Tailwind Typography,
`prettier-plugin-tailwindcss`, `clsx`, and `tailwind-merge`. Treat that setup as
settled unless the task explicitly changes the styling toolchain.

Prefer Tailwind v4 CSS-first APIs when styling-system changes are required:
`@theme`, `@source`, `@utility`, `@variant`, `@custom-variant`, and `@plugin`.
Do not add `tailwind.config.js` unless a tool specifically requires it.

Tailwind is a utility-first design-system API. Utilities are small,
single-purpose classes selected from a constrained scale. They use shared
tokens, support variants, and are statically detected and compiled into only the
CSS the project uses.

Default to Tailwind utilities in Astro, React, MDX components, and reusable UI
blocks. Reach for custom CSS only when utilities, variants, tokens, and normal
component composition are not enough.

Use utilities directly while designing. Extract only after duplication proves a
pattern exists:

1. Start with semantic HTML and direct utilities.
2. Extract repeated markup into an Astro component.
3. Add typed props for stable variants such as `tone`, `size`, and `layout`.
4. Compose classes with `class:list` in Astro or `cn()` in React.
5. Add `@utility` or `@layer components` only when a true CSS abstraction is
   better than a component.

Do not prematurely create `.card`, `.button`, or `.sidebar` CSS classes because
the class list looks long. Long utility lists are acceptable when they describe
a real component once. Repeated utility lists should become reusable components,
not global CSS.

Use `src/lib/utils.ts` `cn()` for React class composition. It combines `clsx`
with `tailwind-merge`, so conditional classes are readable and conflicts are
resolved intentionally.

## Tailwind Responsive And Tokens

Tailwind breakpoints are mobile-first min-width variants. Unprefixed utilities
apply to every viewport. `sm:`, `md:`, `lg:`, `xl:`, and `2xl:` apply from that
breakpoint upward. Do not think of `sm:` as "mobile"; mobile is the unprefixed
base.

Use `max-*` variants when a behavior should stop at a breakpoint, and stack
range variants when a behavior belongs only to one band:

```html
<div class="flex-col md:max-xl:flex-row xl:grid xl:grid-cols-3">...</div>
```

Use container queries for portable components that should respond to the space
their parent gives them instead of the whole viewport:

```html
<article class="@container">
  <div class="grid gap-4 @md:grid-cols-[12rem_minmax(0,1fr)]">...</div>
</article>
```

Reach for viewport breakpoints for page-level layout changes. Reach for
container queries for reusable cards, media blocks, sidebars, and embedded
components.

Think in constraints and relationships, not fixed pixels:

- `w-full max-w-prose` means fill available space up to a readable measure.
- `min-w-0 flex-1` means take remaining flex space and allow text truncation or
  wrapping inside the box.
- `grid-cols-[minmax(0,1fr)_auto]` means content gets flexible space and
  actions keep intrinsic width.
- `aspect-video object-cover` means media has a stable frame and may crop.
- `max-h-* overflow-y-auto` means a region may scroll after a limit.

Tailwind v4 theme variables create utilities. `@theme` is for design tokens
that should become utility classes. Plain `:root` variables are for runtime
values or aliases that do not need generated utilities.

Common token namespaces:

- `--color-*` -> `bg-*`, `text-*`, `border-*`, `fill-*`, `stroke-*`
- `--font-*` -> `font-*`
- `--text-*` -> `text-*`
- `--font-weight-*` -> `font-*`
- `--tracking-*` -> `tracking-*`
- `--leading-*` -> `leading-*`
- `--breakpoint-*` -> responsive variants
- `--container-*` -> container query variants and container size utilities
- `--spacing-*` -> spacing and many sizing utilities
- `--radius-*` -> `rounded-*`
- `--shadow-*` -> `shadow-*`
- `--ease-*` -> `ease-*`
- `--animate-*` -> `animate-*`

This repo uses semantic color tokens such as `background`, `foreground`,
`card`, `muted`, `border`, `input`, `ring`, and `primary`. Prefer semantic
utilities like `bg-background`, `text-foreground`, and `border-border` over
hard-coded palette classes in project UI.

The project uses a data-attribute dark variant:

```css
@custom-variant dark (&:is([data-theme="dark"] *));
```

Use semantic tokens first. A component that uses `bg-background`,
`text-foreground`, `border-border`, and `text-muted-foreground` often needs no
explicit `dark:` classes because the tokens change with the theme. Use `dark:`
when the relationship itself changes, not merely because a color changes.
Always check light and dark modes, including hover, focus, disabled, border,
ring, prose, and overlay states.

## Tailwind Variants And Directives

Common variants:

- Responsive viewport: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`, `max-*`,
  `min-[...]`, `max-[...]`, range stacks like `md:max-xl:`.
- Responsive container: `@container`, `@sm:`, `@md:`, `@max-*`, `@min-[...]`,
  named containers like `@container/card` and `@md/card:*`.
- Theme: `dark:*`.
- Interaction: `hover:`, `focus:`, `focus-visible:`, `focus-within:`,
  `active:`, `visited:`, `disabled:`, `enabled:`.
- Structure: `first:`, `last:`, `only:`, `odd:`, `even:`, `empty:`.
- Parent/sibling: `group-*`, named groups like `group/nav`, `peer-*`, named
  peers like `peer/search`.
- Attribute/state: `aria-*`, `data-*`, `open:`, `popover-open:`, `inert:`,
  `target:`.
- Selector logic: `has-*`, `group-has-*`, `peer-has-*`, `not-*`, `in-*`,
  arbitrary variants like `[&>p]:mt-4`.
- Media environment: `motion-safe:`, `motion-reduce:`, `contrast-more:`,
  `contrast-less:`, `forced-colors:`, `pointer-*`, `any-pointer-*`,
  `portrait:`, `landscape:`, `print:`, `supports-[...]`.
- Direction: `ltr:`, `rtl:`.
- Generated content and child styling: `before:`, `after:`, `placeholder:`,
  `selection:`, `marker:`, `file:`, `backdrop:`, `*`, `**`.

Use state variants to make component state visible and accessible. Prefer ARIA
and data variants over custom state classes. Hover-only UI is incomplete:
anything revealed on hover must also work for keyboard and touch.

Use `has-*`, `group-has-*`, and `peer-has-*` to reflect descendant or sibling
state without extra JavaScript. Use `not-*` to avoid awkward conditional
template logic. Use `in-*` only when styling based on any ancestor is genuinely
clearer than adding a named `group`.

The `*` and `**` child selector variants are useful for generated content you do
not control, but avoid them in first-party components. They create broad rules
that children cannot easily override because of generated order and specificity.

Tailwind scans source files as plain text. It does not understand string
interpolation. Dynamic class construction will fail:

```tsx
// Wrong: Tailwind cannot see bg-${color}-600.
`bg-${color}-600`;
```

Map variants to complete class strings:

```tsx
const toneClasses = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  quiet: "bg-transparent text-foreground hover:bg-muted",
} as const;
```

Tailwind v4 automatically scans source files and ignores files in `.gitignore`,
`node_modules`, binary files, CSS files, and common lock files. Use `@source`
only when classes live somewhere automatic detection does not scan. Use
`@source not` only for noisy paths Tailwind would otherwise scan. Use
`@source inline()` only to safelist classes that cannot appear literally in
source.

Important directives:

- `@theme`: define design tokens that generate utilities or variants.
- `@source`: explicitly include or exclude files from class detection.
- `@utility`: define custom utilities that work with variants.
- `@variant`: apply a Tailwind variant inside custom CSS.
- `@custom-variant`: define project variants such as data-attribute dark mode.
- `@apply`: inline utilities into custom CSS.
- `@reference`: make theme variables, utilities, and variants available inside
  scoped CSS modules or framework style blocks without duplicating CSS.
- `@plugin`: load a JavaScript-based Tailwind plugin such as Typography.

Tailwind also exposes build-time CSS functions:

- `--alpha(color / opacity)` for token-based opacity mixing.
- `--spacing(n)` for spacing-scale math inside custom CSS or arbitrary values.

Use `@apply` sparingly. It is best for third-party CSS integration or rare base
styles that must reuse tokens. It is usually worse than an Astro component or a
typed React component for first-party UI.

Use `@layer base` only for document-level defaults and Markdown/prose
customization. Use `@layer components` rarely for third-party components or
classes that must be overridden by utilities. Use `@utility` for a real missing
utility, not for project-specific component styling.

Tailwind's Preflight base layer is included by `@import "tailwindcss"`. It
removes default margins, resets borders, unstyles headings/lists, makes
replaced elements predictable, constrains images/videos to parent width, and
keeps the `hidden` attribute hidden. UI components must consciously style
headings, lists, images, and content rhythm. Use Tailwind Typography for
Markdown prose rather than restoring browser defaults globally.
If an unstyled list is still semantically a list, keep list semantics; use
`role="list"` only where a browser/screen reader combination needs it.

## Tailwind Utility Catalog

This is a working map of the current Tailwind utility surface. `*` means the
utility accepts theme tokens, fractions, CSS variables, arbitrary values, or
generated variants where Tailwind supports them. Use this catalog to choose the
right family quickly. Verify exact syntax only for unusual edge cases.

### Layout Utilities

- Aspect ratio: `aspect-auto`, `aspect-square`, `aspect-video`,
  `aspect-<ratio>`, `aspect-[...]`.
- Columns: `columns-*` for true multi-column content.
- Fragment breaks: `break-before-*`, `break-after-*`, `break-inside-*` for
  columns, pages, and print-like flows.
- Decoration fragments: `box-decoration-slice`, `box-decoration-clone`.
- Box sizing: `box-border`, `box-content`.
- Display: `block`, `inline-block`, `inline`, `flex`, `inline-flex`, `grid`,
  `inline-grid`, `flow-root`, `contents`, `list-item`, `hidden`, table display
  utilities like `table`, `table-row`, `table-cell`, `table-caption`.
- Float/clear: `float-start`, `float-end`, `float-left`, `float-right`,
  `float-none`, `clear-start`, `clear-end`, `clear-left`, `clear-right`,
  `clear-both`, `clear-none`.
- Isolation: `isolate`, `isolation-auto`.
- Object media: `object-contain`, `object-cover`, `object-fill`,
  `object-none`, `object-scale-down`, `object-*` positions.
- Overflow: `overflow-auto`, `overflow-hidden`, `overflow-clip`,
  `overflow-visible`, `overflow-scroll`, plus `overflow-x-*`, `overflow-y-*`.
- Overscroll: `overscroll-auto`, `overscroll-contain`, `overscroll-none`, plus
  axis variants.
- Position: `static`, `relative`, `absolute`, `fixed`, `sticky`.
- Insets: `inset-*`, `inset-x-*`, `inset-y-*`, `start-*`, `end-*`, `top-*`,
  `right-*`, `bottom-*`, `left-*`.
- Visibility: `visible`, `invisible`, `collapse`.
- Stack order: `z-*`, `z-auto`.

### Flexbox And Grid Utilities

- Flex direction: `flex-row`, `flex-row-reverse`, `flex-col`,
  `flex-col-reverse`.
- Flex wrapping: `flex-wrap`, `flex-nowrap`, `flex-wrap-reverse`.
- Flex shorthand: `flex-1`, `flex-auto`, `flex-initial`, `flex-none`,
  `flex-*`.
- Flex basis/grow/shrink: `basis-*`, `grow`, `grow-0`, `grow-*`, `shrink`,
  `shrink-0`, `shrink-*`.
- Order: `order-first`, `order-last`, `order-none`, `order-*`.
- Grid templates: `grid-cols-*`, `grid-cols-none`, `grid-cols-subgrid`,
  `grid-rows-*`, `grid-rows-none`, `grid-rows-subgrid`.
- Grid placement: `col-auto`, `col-span-*`, `col-start-*`, `col-end-*`,
  `row-auto`, `row-span-*`, `row-start-*`, `row-end-*`.
- Grid auto placement: `grid-flow-row`, `grid-flow-col`, `grid-flow-dense`,
  `grid-flow-row-dense`, `grid-flow-col-dense`.
- Implicit tracks: `auto-cols-auto`, `auto-cols-min`, `auto-cols-max`,
  `auto-cols-fr`, `auto-cols-*`, `auto-rows-auto`, `auto-rows-min`,
  `auto-rows-max`, `auto-rows-fr`, `auto-rows-*`.
- Gaps: `gap-*`, `gap-x-*`, `gap-y-*`.
- Main-axis packing: `justify-normal`, `justify-start`, `justify-end`,
  `justify-center`, `justify-between`, `justify-around`, `justify-evenly`,
  `justify-stretch`, `justify-baseline`.
- Grid inline-axis items: `justify-items-normal`, `justify-items-start`,
  `justify-items-end`, `justify-items-center`, `justify-items-stretch`.
- Grid self inline-axis: `justify-self-auto`, `justify-self-start`,
  `justify-self-end`, `justify-self-center`, `justify-self-stretch`.
- Cross-axis/multi-line packing: `content-normal`, `content-center`,
  `content-start`, `content-end`, `content-between`, `content-around`,
  `content-evenly`, `content-baseline`, `content-stretch`.
- Cross-axis items: `items-start`, `items-end`, `items-center`,
  `items-baseline`, `items-stretch`.
- Cross-axis self: `self-auto`, `self-start`, `self-end`, `self-center`,
  `self-stretch`, `self-baseline`.
- Combined alignment: `place-content-*`, `place-items-*`, `place-self-*`.

### Spacing And Sizing Utilities

- Padding: `p-*`, `px-*`, `py-*`, `ps-*`, `pe-*`, `pt-*`, `pr-*`, `pb-*`,
  `pl-*`.
- Margin: `m-*`, `mx-*`, `my-*`, `ms-*`, `me-*`, `mt-*`, `mr-*`, `mb-*`,
  `ml-*`, with `auto` where supported.
- Sibling spacing: `space-x-*`, `space-y-*`, reverse helpers. Prefer `gap-*`
  when children can wrap, reorder, or be conditionally omitted.
- Negative spacing: negative margin and translate utilities are available when
  deliberate overlap is the actual design.
- Physical width: `w-*`, `min-w-*`, `max-w-*`.
- Physical height: `h-*`, `min-h-*`, `max-h-*`.
- Both axes: `size-*`.
- Logical inline size: `inline-*`, `min-inline-*`, `max-inline-*`.
- Logical block size: `block-*`, `min-block-*`, `max-block-*`.
- Common values: spacing tokens, fractions, `auto`, `px`, `full`, `screen`,
  viewport units like `dvw`/`svw`/`lvw` and `dvh`/`svh`/`lvh`, `min`, `max`,
  `fit`, container sizes such as `prose`, `screen-*`, and arbitrary values.

### Typography Utilities

- Families: `font-sans`, `font-serif`, `font-mono`, custom `font-*`.
- Size/line-height: `text-*`, slash line-height like `text-sm/6`, arbitrary
  values.
- Smoothing: `antialiased`, `subpixel-antialiased`.
- Style/weight/stretch: `italic`, `not-italic`, `font-thin`,
  `font-extralight`, `font-light`, `font-normal`, `font-medium`,
  `font-semibold`, `font-bold`, `font-extrabold`, `font-black`,
  `font-stretch-*`.
- Numeric and font features: `ordinal`, `slashed-zero`, `lining-nums`,
  `oldstyle-nums`, `proportional-nums`, `tabular-nums`,
  `diagonal-fractions`, `stacked-fractions`, arbitrary font-feature utilities.
- Tracking/leading: `tracking-*`, `leading-*`.
- Lists: `list-none`, `list-disc`, `list-decimal`, `list-inside`,
  `list-outside`, `list-image-*`.
- Alignment: `text-left`, `text-center`, `text-right`, `text-justify`,
  `text-start`, `text-end`.
- Text color: `text-*`, semantic colors, opacity modifiers.
- Decoration: `underline`, `overline`, `line-through`, `no-underline`,
  `decoration-*`, `decoration-solid`, `decoration-double`,
  `decoration-dotted`, `decoration-dashed`, `decoration-wavy`,
  `decoration-from-font`, `decoration-auto`, `decoration-<number>`,
  `underline-offset-*`.
- Case: `uppercase`, `lowercase`, `capitalize`, `normal-case`.
- Overflow: `truncate`, `text-ellipsis`, `text-clip`, `line-clamp-*`.
- Wrapping: `text-wrap`, `text-nowrap`, `text-balance`, `text-pretty`,
  `whitespace-*`, `break-normal`, `break-all`, `break-keep`, `break-words`,
  `wrap-anywhere`, `hyphens-none`, `hyphens-manual`, `hyphens-auto`.
- Other text flow: `indent-*`, `align-baseline`, `align-top`,
  `align-middle`, `align-bottom`, `align-text-top`, `align-text-bottom`,
  `content-*` for pseudo-elements.

Use truncation deliberately:

- `truncate` for one-line labels where full text is available elsewhere.
- `line-clamp-*` for summaries where loss is acceptable.
- `whitespace-nowrap` only when the container has a plan for overflow.
- `break-words`, `wrap-anywhere`, and `hyphens-auto` when prose or URLs can
  otherwise overflow.

### Background, Border, Effect, And Motion Utilities

- Background attachment: `bg-fixed`, `bg-local`, `bg-scroll`.
- Background clip: `bg-clip-border`, `bg-clip-padding`, `bg-clip-content`,
  `bg-clip-text`.
- Background color/image: `bg-*`, `bg-none`,
  `bg-[image:var(--hero-image)]`, gradient utilities. Gradients are not part of
  this site's current visual direction unless re-approved.
- Background origin/position/repeat/size: `bg-origin-*`, `bg-center`,
  `bg-top`, `bg-right`, `bg-bottom`, `bg-left`, `bg-repeat`,
  `bg-no-repeat`, `bg-cover`, `bg-contain`, arbitrary values.
- Radius: `rounded-*`, `rounded-none`, `rounded-full`, side/corner/logical
  variants.
- Border: `border`, `border-*`, `border-x-*`, `border-y-*`, logical and side
  variants, `border-solid`, `border-dashed`, `border-dotted`,
  `border-double`, `border-hidden`, `border-none`.
- Divide lines: `divide-x-*`, `divide-y-*`, `divide-*`, `divide-solid`,
  `divide-dashed`, `divide-dotted`, `divide-double`, `divide-none`.
- Outline: `outline`, `outline-*`, `outline-hidden`, `outline-none`,
  `outline-offset-*`, outline colors and styles.
- Rings/shadows: `shadow-*`, `inset-shadow-*`, `ring`, `ring-*`,
  `ring-inset`, `inset-ring`, `inset-ring-*`, shadow/ring color utilities.
- Text shadow: `text-shadow-*`.
- Opacity/blend: `opacity-*`, `mix-blend-*`, `bg-blend-*`.
- Filters: `filter`, `filter-none`, `blur-*`, `brightness-*`, `contrast-*`,
  `drop-shadow-*`, `grayscale`, `grayscale-*`, `hue-rotate-*`, `invert`,
  `invert-*`, `saturate-*`, `sepia`, `sepia-*`.
- Backdrop filters: `backdrop-filter`, `backdrop-filter-none`,
  `backdrop-blur-*`, `backdrop-brightness-*`, `backdrop-contrast-*`,
  `backdrop-grayscale`, `backdrop-hue-rotate-*`, `backdrop-invert`,
  `backdrop-opacity-*`, `backdrop-saturate-*`, `backdrop-sepia`.
- Masks: `mask-*`, `mask-clip-*`, `mask-composite-*`, mask image utilities,
  `mask-mode-*`, `mask-origin-*`, `mask-position-*`, `mask-repeat-*`,
  `mask-size-*`, `mask-type-*`.
- Transitions: `transition`, `transition-all`, `transition-colors`,
  `transition-opacity`, `transition-shadow`, `transition-transform`,
  `transition-none`, `transition-discrete`, `transition-normal`,
  `duration-*`, `ease-*`, `delay-*`.
- Animation: `animate-spin`, `animate-ping`, `animate-pulse`,
  `animate-bounce`, `animate-none`, custom `animate-*`.
- 3D/transform: `backface-visible`, `backface-hidden`, `perspective-*`,
  `perspective-origin-*`, `transform`, `transform-gpu`, `transform-cpu`,
  `transform-none`, `transform-3d`, `transform-flat`, `origin-*`,
  `rotate-*`, `scale-*`, `scale-x-*`, `scale-y-*`, `skew-*`, `translate-*`.

Treat masks, blend modes, filters, backdrop filters, text shadows, and
decorative animation as exceptional visual effects, not defaults.

### Tables, Interaction, SVG, And Accessibility Utilities

- Tables: `border-collapse`, `border-separate`, `border-spacing-*`,
  `border-spacing-x-*`, `border-spacing-y-*`, `table-auto`, `table-fixed`,
  `caption-top`, `caption-bottom`.
- Native control color: `accent-*`, `caret-*`, `scheme-*`.
- Native appearance: `appearance-none`, `appearance-auto`.
- Cursor: `cursor-*`.
- Field sizing: `field-sizing-fixed`, `field-sizing-content`.
- Pointer events: `pointer-events-none`, `pointer-events-auto`.
- Resize: `resize`, `resize-none`, `resize-x`, `resize-y`.
- Scroll behavior: `scroll-auto`, `scroll-smooth`.
- Scroll offsets: `scroll-m-*`, `scroll-mx-*`, `scroll-my-*`,
  `scroll-ms-*`, `scroll-me-*`, `scroll-mt-*`, `scroll-mr-*`,
  `scroll-mb-*`, `scroll-ml-*`; matching `scroll-p*` utilities.
- Scroll snapping: `snap-none`, `snap-x`, `snap-y`, `snap-both`,
  `snap-mandatory`, `snap-proximity`, `snap-start`, `snap-end`,
  `snap-center`, `snap-align-none`, `snap-normal`, `snap-always`.
- Touch: `touch-auto`, `touch-none`, `touch-pan-x`, `touch-pan-y`,
  `touch-pinch-zoom`, directional pan utilities, manipulation utilities.
- Selection: `select-none`, `select-text`, `select-all`, `select-auto`.
- Performance hint: `will-change-auto`, `will-change-scroll`,
  `will-change-contents`, `will-change-transform`, arbitrary `will-change-*`.
- SVG fill/stroke: `fill-*`, `stroke-*`, `stroke-<number>`, arbitrary stroke
  widths. Prefer `currentColor`-driven icons unless separate color is needed.
- Screen-reader utilities: `sr-only`, `not-sr-only`.
- Forced colors: `forced-color-adjust-auto`, `forced-color-adjust-none`.

Plugins:

- Typography plugin: `prose`, size modifiers like `prose-lg`, color modifiers,
  element modifiers like `prose-a:*`, `dark:prose-invert`, and `not-prose`.
- Aspect ratio and line clamp are core utility families in current Tailwind; do
  not add old plugins for them.
- Forms are usually best handled with native controls plus project components.
  Add `@tailwindcss/forms` only if the project deliberately chooses that
  baseline.
- Custom plugins are a last resort for reusable utility families that cannot be
  expressed cleanly with `@theme`, `@utility`, components, or local variants.

## Tailwind Pitfalls

Avoid these:

- Building class names dynamically with interpolation.
- Adding page-level CSS to patch a broken component.
- Treating breakpoints as device names.
- Using `sm:` for mobile styles.
- Adding one-off pixel breakpoints after visual trial and error.
- Hiding overflow to conceal layout bugs.
- Forgetting `min-w-0` in flex/grid children with long text.
- Using `space-*` where wrapping children need `gap`.
- Using `order-*` to change layout in a way that breaks reading or tab order.
- Using `pointer-events-none` on elements that still need interaction or focus.
- Removing focus outlines.
- Styling hover but not focus/touch.
- Using global CSS for first-party components.
- Overusing `@apply`.
- Overusing child selector variants instead of styling component children.
- Creating component classes before a reusable component exists.
- Using arbitrary values repeatedly instead of tokens.
- Putting meaningful images in CSS backgrounds.
- Overusing `z-*` instead of fixing stacking context or DOM order.
- Leaving `will-change-*` on ordinary elements.
- Adding filters/backdrop blur/animation as decoration without checking
  performance, readability, and reduced-motion behavior.
- Assuming older Tailwind docs describe this project's v4 configuration model.

## Content Policy

Article content fidelity is strict.

- Do not edit files in `site/content/articles/` unless explicitly instructed.
- Do not rewrite article bodies unless the user explicitly asks.
- When article edits are requested, preserve the author's wording and make only
  the precise requested change. Do not restyle prose, improve phrasing, adjust
  tone, or otherwise change authorial language unless explicitly instructed.
- Preserve existing meaningful metadata.
- Keep historical permalink data as inert metadata; do not let it drive routing,
  article detection, or category grouping.
- Ensure drafts and unpublished content remain unpublished.
- Article authors should not need to edit routes, navigation, RSS, sitemap,
  search indexing, or build scripts to publish a normal article.

Article authors should add `.md` or `.mdx` entries under
`site/content/articles/<category>/`, provide valid frontmatter, keep drafts
unpublished, and let routes, indexes, RSS, sitemap, search, and metadata derive
from the collection.

## Assets, Images, And Fonts

Images need explicit care. New project-owned images should default to
`site/assets/` so Astro can process them. Article-owned images should usually be
organized under `site/assets/articles/<article-slug>/`, shared article images
under `site/assets/shared/`, and site UI images under `site/assets/site/`. Use
relative paths for Markdown, MDX, frontmatter, and component source asset
references.

Use Astro `Image`/`Picture` for component-controlled images when possible. Use
stable dimensions or aspect ratios, responsive sizes, useful alt text, and
deliberate loading priority. Prefer `layout="full-width"` or Astro image layout
options over hand-writing unnecessary `widths`/`sizes` unless there is a
measured reason.

Astro image rules:

- Use `Image` for optimized single-source images.
- Use `Picture` for modern formats or art direction.
- Local images infer dimensions; remote images usually need explicit dimensions
  and configured `image.domains` or `image.remotePatterns`.
- Use `priority` only on the likely LCP image. It sets eager loading,
  synchronous decoding, and high fetch priority.
- Do not lazy-load the likely LCP image or main text block.
- Use `getImage()` in Astro/frontmatter code when a generated image URL is
  needed.
- Prefer modern formats such as AVIF or WebP where Astro can generate them.
- Avoid serving a full-resolution upload when the rendered slot is much smaller.
- Astro responsive image styles can outrank Tailwind utilities. Either use
  Astro layout/responsive styles intentionally, or leave them disabled and make
  sizing explicit with Tailwind such as `w-full h-auto max-w-full`.
- Local SVGs can be imported as Astro components in `.astro` files. Framework
  components cannot import `.astro` components; pass SVG/Astro output as
  children from an Astro parent when needed.

Use Tailwind for image frames:

- `w-full`
- `h-auto`
- `aspect-*`
- `object-cover` or `object-contain`
- `rounded-*`
- `overflow-hidden`

Do not put article/UI images, app CSS, or app JS in `site/public/` unless a
stable unprocessed URL is required. Do not add oversized uploads or meaningful
background images when a real image element would be more performant and
accessible.

Font rules:

- Prefer Astro Fonts or local/build-managed font loading.
- Avoid layout shift from late font swaps.
- Keep body text readable before custom fonts load.
- Do not add external font services without explicit approval.
- Preload fonts sparingly and only when needed above the fold.

## Performance, Accessibility, And SEO

Treat production output as the performance source of truth.

- `just build` produces the deployable `dist/` directory.
- Astro/Vite own project CSS and processed client JavaScript.
- Built project assets should appear under hashed `_astro/` filenames when they
  are emitted as files.
- Pagefind owns generated search assets under `dist/pagefind/`.
- Files in `site/public/` are copied as-is and should already be
  production-ready.

Keep reading pages static by default. Avoid adding client JavaScript to article,
category archive, RSS, sitemap, and ordinary content pages unless the
feature requires it. Route-local interaction is preferred: search code should
stay on search pages, and MDX interaction should stay on articles that use it.

Performance rules:

- Keep class names statically visible.
- Keep generated HTML compact and static.
- Keep global CSS small.
- Avoid shipping client JavaScript for static styling.
- Avoid importing large libraries into client-side code unless they are
  necessary.
- Avoid duplicate client bundles caused by repeated framework islands.
- Avoid hiding the LCP element behind client-side rendering.
- Avoid layout shifts above the fold.
- Keep above-the-fold fonts and CSS minimal.
- Preload only resources that are truly critical for initial rendering.
- Do not preload resources that are not needed immediately.
- Use `fetchpriority="high"` only for a proven critical image.
- Use `preconnect` only for unavoidable external origins.
- Avoid decorative filters, backdrop blur, shadows, and animations unless they
  improve the interface.
- Use `motion-safe:` and `motion-reduce:`.
- Use responsive image constraints so media does not cause layout shift or
  overflow.
- Use `will-change-*` only immediately around known animation-heavy elements.
- Let Prettier with `prettier-plugin-tailwindcss` sort classes.
- Do not add post-build CSS mutation.

Accessibility rules:

- Use semantic elements first.
- Keep visible focus states with `focus-visible:*`.
- Do not remove outlines without replacing them.
- Use `sr-only` for text labels on icon-only controls.
- Use `not-sr-only` when hidden labels should reappear at wider sizes.
- Style `disabled`, `aria-*`, `data-*`, and `open` states explicitly.
- Preserve contrast in light and dark modes.
- Do not rely on color alone for state.
- Do not rely on hover alone for information or interaction.
- Respect reduced motion.
- Ensure horizontal overflow is deliberate and contained.

SEO and metadata:

- Use page-specific title and description.
- Use canonical URLs.
- Emit Open Graph/Twitter metadata for article pages.
- Use `BlogPosting` JSON-LD for articles.
- Keep RSS and sitemap generation aligned with published content only.
- Do not accidentally expose drafts or unpublished content through article
  pages, indexes, RSS, sitemap, search, or JSON-LD.

Lighthouse strategy:

- Aim for 100 across performance, accessibility, best practices, and SEO.
- Treat Lighthouse as a release feedback tool, not a replacement for code
  review or browser testing.
- Fix structural issues at the component/source level, not through output
  mutation.

## Quality Gate

When making code changes, run the relevant repository QA tooling before handoff
and fix issues it reports. Use repository scripts, not ad hoc command chains.
Keep QA commands simple and transparent. Do not add clever wrapper scripts,
suppressed output, or copied flags unless their behavior is understood and the
reason is documented.

`just` is the canonical human command router for repository workflows, Rust
operations, internal Rust task adapters, and cross-tool QA orchestration.
`package.json` is dependency metadata, not the executable command surface. The
human-readable command map is `COMMANDS.md`. Internal Rust task adapters in
`crates/tpm-xtask/src/tasks.rs` own repository automation that should not be
part of the user-facing `tpm` product CLI. Rust operations in
`crates/tpm-operations/` own product-facing operation contracts. Update the
command docs, Rust tests, and config tests together when adding, removing, or
changing `just` recipes, command owners, or CI jobs.

Use `just diagnostics-diff` when replacing or narrowing a risky QA command.
Compare diagnostic codes, files, severities, messages, and counts rather than
trusting exit-code parity alone.

Before PR handoff, run the strongest relevant local gate and fix all automated
failures. For normal code/config changes, run `just fix` when safe, then
`just release-check`. For TypeScript, Astro, or Rust behavior changes, also
follow the Coverage Policy before handoff. If a gate cannot run locally, retry
with the appropriate permission when practical, then report the command,
failure reason, and any narrower substitute checks in the final handoff.

Current baseline commands:

- `just dev`: start Astro dev server.
- `just check-fast`: run cheap high-signal invariants for early feedback,
  including starter-template, generated-reference, platform-boundary, and
  command/config contract tests.
- `just check`: run content validation, Astro and tooling typechecking, ESLint,
  asset validation, package ordering, code/config Prettier check, Knip,
  test-accountability verification, Bun unit tests, Astro component tests, and
  fast Rust type checks.
- `just test`: run test-accountability verification, Bun unit tests, and Astro
  component tests.
- `just test-unit`: run Bun unit/script/component/page tests.
- `just test-astro`: run Astro component and page tests through Vitest and the
  Astro container API.
- `just test-config`: run repository config and QA registry contract tests that
  catch command, workflow, and tooling drift before heavier checks.
- `just test-accountability`: verify every repository file is covered by a
  mirrored test or documented accountability rule.
- `just test-accountability-release`: run the same accountability check and
  fail on requested-permission exceptions.
- `just coverage`: run all coverage review signals.
- `just coverage-ts`: run TypeScript/Astro unit coverage with LCOV, then
  report code-like files that are not represented by LCOV coverage, a mirrored
  accountability test, or an approved exception.
- `just coverage-rust`: run Rust coverage with missing-line output when
  `cargo-llvm-cov` is installed.
- `just typecheck`: run site and Studio Astro checks while failing on warnings,
  then run TypeScript tool checks.
- `just quality`: run the local quality path plus review-only signals.
- `just build`: build Astro, generate Pagefind index, generate PDFs, and
  optimize output.
- `just preview`: preview built output locally after `just build`.
- `just preview-fresh`: build and then preview built output locally.
- `just verify`: verify built output.
- `just validate-html`: validate built HTML output.
- `just test-e2e`: run Playwright smoke/responsive/search tests.
- `just test-a11y`: run axe accessibility review tests.
- `just test-perf`: run Lighthouse CI review.
- `just starters-check`: verify starter templates and example site instances
  stay aligned with the starter registry and supported source contracts.
- `just release-check`: run the blocking pre-release validation gate,
  including Markdown/MDX style review.
- `just quality-release`: run the heavy pre-release gate plus review-only
  signals.
- `just fix`: run safe automatic fixes for code, config, Markdown, package
  ordering, and Rust.
- `just review-markdown`: run focused Markdown/MDX style feedback.
- `just review-assets`: run non-blocking duplicate/unused image review
  feedback.
- `just audit-all`: run dependency audit review across all severities.
- `just markdown-fix`: run mechanical Markdown/MDX formatting.

For code and config changes, prefer running the safe automatic fixer before the
normal check when safe for the task:

```sh
just fix
just check
```

This keeps mechanical formatting, import ordering, and safe lint autofixes out
of the reasoning path. Markdown/MDX style is part of the release handoff gate;
use `just markdown-fix` for mechanical repairs before rerunning the check.

If a check cannot be run, say so in the final handoff with the reason. Also
report any coverage ignore annotations, coverage tool excludes, or `Coverage
note:` comments added or relied on during the change.

## Coverage Policy

Coverage is a pre-handoff requirement for Rust, TypeScript, and Astro behavior
changes.

- Run `just coverage-rust` for Rust changes.
- Run `just coverage-ts` for TypeScript or Astro behavior changes.
- Run `just coverage` for mixed Rust and TypeScript/Astro changes.
- Inspect the missing-line output before handoff.
- Add meaningful tests for uncovered behavior, edge cases, and failure modes.
- If uncovered code is hard to test, first consider whether the design should
  be refactored into smaller pure seams instead of accepting the gap.
- Do not add brittle tests, test-only exports, weakened runtime code, or broad
  ignores to satisfy coverage.
- Coverage exceptions must be narrow, explicitly justified near the code or in
  the coverage config, and reported in the final handoff.
- Do not mark work done or ready for review while meaningful testable coverage
  gaps remain.

Final handoffs for code changes must state which coverage command ran, the
important remaining gaps or exceptions, and why any remaining uncovered code is
acceptable.

## Coding Policy

The intended code policy is strict TypeScript with tooling as the source of
truth.

Core principles:

- Use type-driven design by default. Make invalid states unrepresentable
  wherever practical.
- Normalize inputs once into strict internal models before passing data to UI,
  metadata, feed, search, PDF, route, or generated-output code.
- Model platform concepts with named domain types, literal registries,
  discriminated unions, and narrow view models rather than loose objects,
  duplicated strings, or scattered boolean flags.
- Write defensively by making future misuse difficult: validate boundaries,
  model finite states explicitly, isolate side effects, and prefer clear APIs
  that prevent whole classes of bugs without speculative abstractions.
- When a bug is fixed, consider whether the bug was possible because of a weak
  abstraction, missing invariant, duplicated policy, or under-specified
  component contract. Strengthen the seam when that prevents recurrence.
- Prefer simple, explicit, maintainable code over clever abstractions.
- Keep changes narrowly scoped.
- Preserve module boundaries unless there is a clear reason to improve them.
- Use `const` by default and `let` only for reassignment.
- Avoid `any`; parse `unknown` at boundaries.
- Avoid non-null assertions.
- Prefer exhaustive handling for finite states and discriminated unions.
- Keep side effects behind narrow boundaries.
- Keep pure logic easy to test.
- Prefer typed domain objects over passing raw content entries deep into UI.
- If a helper becomes generally useful, give it a domain name, a small
  interface, useful JSDoc, and tests around its contract.
- Throw `Error` instances, not strings or arbitrary values.
- Do not leave silent `catch` blocks.
- Keep exports intentional and minimal.
- Remove dead code rather than preserving it for possible future use.
- Use useful comments for invariants and non-obvious tradeoffs, not narration.

Default exports are acceptable where Astro or tool config conventions expect
them. Prefer named exports for reusable TypeScript modules.

## Documentation Policy

Write useful documentation that explains purpose, correct use, constraints,
failure modes, and non-obvious tradeoffs. Good docs should prevent misuse
without restating obvious code.

- Document every exported function, type, interface, enum, class, and public
  component prop contract with useful JSDoc, except generated shadcn/ui
  component files.
- Use implementation comments only to explain intent, invariants, constraints,
  or non-obvious tradeoffs.
- Do not use unsafe assertions unless a documented invariant justifies them.
- Do not leave empty or silent `catch` blocks without an explanatory comment.
- Document dependency, security, and coverage exceptions explicitly and report
  them during handoff.
- Update relevant user-facing or developer-facing docs when workflows,
  commands, public APIs, content conventions, or architecture change.
- Update platform contract docs when changing platform entrypoints, starter
  templates, generated-output invariants, extension/deployment seams,
  localization/import-export/release policies, or security/supply-chain
  expectations.
- Use consistent project vocabulary such as article, page, category, asset,
  public file, component, block, and island.

## Dependency And Security Policy

Do not add dependencies casually.

Runtime dependencies need clear justification because they affect performance,
security, install weight, and long-term maintenance.

Prefer:

- Astro built-ins.
- Web platform APIs.
- Existing project helpers.
- Small focused libraries with clear value.
- shadcn/Radix patterns only when they improve accessibility or interaction
  quality enough to justify the cost.

Avoid:

- analytics or tracking scripts without explicit approval;
- remote-code loading;
- large client libraries for small interactions;
- dependencies that duplicate existing project utilities;
- packages that undermine static-first output.

Security tooling targets include gitleaks, dependency audit, Dependency Review,
and CodeQL. Do not bypass security tooling to get a release check green.

## Testing Policy

Test behavior through intended public APIs. Do not export implementation details
only to make tests easier. Test-only exports require explicit user permission.
If a test appears to need a private helper, first reconsider the module
boundary and separate stable pure logic from side-effect-heavy edge code.

Tests should protect platform invariants, not incidental implementation
details. Prefer tests around schemas, normalizers, registries, route builders,
metadata builders, visibility policy, media policy, diagnostics, generated
artifacts, and component contracts because those seams make product behavior
safe to change.

For refactors and bug-prone domains, add characterization tests before moving
code. For bug fixes, add regression coverage for the immediate failure and,
where practical, the broader invariant that should have made the failure
impossible or noisy.

Aim for 100% useful coverage of testable behavior. Coverage must come from
meaningful behavior tests, not weakened runtime code, brittle assertions, or
leaky public interfaces. A coverage exception must be explicitly justified in a
nearby code comment, reported during handoff, and accepted by the user after
handoff. Do not silently leave testable code uncovered.

Coverage ignores are exceptional design decisions, not cleanup tools. Prefer a
test or a cleaner seam first. When ignoring coverage is genuinely necessary,
use the narrowest supported mechanism and pair it with a nearby explanation of
why the path is untestable or misleading to count. JavaScript/TypeScript
ignore comments must include a reason. Rust's function/module
`#[coverage(off)]` support is currently unstable, so stable-toolchain Rust code
should rely on tests, refactors, and documented `Coverage note:` comments
before using file-pattern excludes. Any file-pattern exclude must target only
generated code, test harnesses, process entrypoints, or similarly untestable
boundaries, and the rationale must be documented in the recipe or nearby code.

Developer checks are practical iteration gates, not permission to leave
coverage weak. Passing `just check` does not prove coverage is sufficient;
developers must still add meaningful tests for every sensible behavior path
they touch and push coverage upward wherever practical. `just coverage-ts` and
`just coverage-rust` are focused review inventories; `just coverage` runs both.
Coverage is not a substitute for asking whether an uncovered branch points to a
poor abstraction, dead code, duplicated policy, or an avoidable side effect.

When a remaining uncovered path is genuinely a process boundary,
generated-output boundary, browser auto-init guard, or similarly brittle
integration edge, add a nearby `Coverage note:` comment explaining the reason.
Prefer tests over notes whenever behavior can be tested cleanly.

Every repository file must have explicit test accountability. Prefer mirrored
tests for executable code, config, scripts, components, pages, schemas, and
helpers. Files that cannot sensibly have mirrored tests must be listed in
`.test-accountability-ignore` with a meaningful gitignore-style comment. Use
`Requested permission:` for new or unresolved exceptions, report them during
handoff, and remove that prefix only after the user accepts the exception.
Release accountability must fail while requested-permission exceptions remain.

Do not game coverage. Do not add import-only tests, branch-execution tests
without meaningful assertions, broad ignores, test-only exports, weakened
runtime code, or tests that assert mocks or implementation details instead of
observable behavior.

The broad coverage inventory should start from every code-like source file and
only narrow through explicit approved exceptions. When adding a new executable
source module, add focused tests or update the explicit exception with
rationale. Astro templates should have Vitest/Astro container tests when their
rendered output, props, slots, static paths, or integration behavior matters.

Use unit tests for deterministic logic and script behavior, including slug
generation, category derivation, draft filtering, metadata normalization, route
helpers, duplicate slug detection, image path validation, RSS/feed output,
content helpers, quality/verification scripts, and custom content transforms.

Generated output is a platform contract. When changing public output, add or
update tests for the relevant HTML semantics, metadata, redirects, RSS, sitemap,
search data, PDF eligibility/output, citation output, bibliography output,
asset policy, cache headers, diagnostics, or verifier behavior.

For UI work, prefer tests that assert user-visible behavior. Use happy-dom for
fast unit tests of DOM script behavior, such as event wiring, query parsing, and
small browser-entry helpers. Use Vitest with Astro's container API for granular
Astro component, layout, and page rendering tests. Use Playwright for real
browser behavior: homepage, article pages, article archive, category pages,
mobile navigation, theme toggle, search, no horizontal overflow, and
representative responsive viewports. Use Playwright for full authoring flows
once a local server and editor workflow exist.

Use axe accessibility checks for representative pages. Use Lighthouse CI for
performance, accessibility, best practices, and SEO review checks.

## Planning Workflow

Use a focused project document only when work is large enough to need explicit
coordination or reviewable sequencing.

For substantial roadmap or platform work, prepare a design packet before code
changes. Keep it as short as the work allows, but make it concrete enough that
another engineer can implement the first patch without rediscovering the
domain.

A design packet should name:

- the roadmap milestone, platform domain, and smaller subdomain;
- user impact for authors, site owners, readers, developers, and future
  tooling such as the studio, CLI, MCP, or CI;
- affected source files, generated artifacts, public routes, and output
  contracts;
- typed interfaces, schemas, registries, policies, diagnostics, or view models
  being added or changed;
- invalid states the change should prevent;
- visible UX changes, if any;
- performance, accessibility, SEO, machine-readability, payload, and
  compatibility risks;
- pre-change tests or fixtures, implementation sequence, focused verification,
  release-level verification, and docs that must change.

Before starting a non-trivial implementation phase, update the relevant
design/tooling/project document when the intended work should be reviewable
before code changes.

Do not create planning docs for routine QA commands. Routine tooling
expectations belong in this file, `COMMANDS.md`, and the QA command
registry. Use `agent-docs/qa/QA_PREFLIGHT.md` only when changing the QA foundation
or resuming scoped QA-tooling work from the roadmap.

## Generated Files And Historical Assets

Do not edit generated files by hand.

Generated or disposable paths include:

- `dist/`
- `dist-catalog/`
- `.astro/`
- `.wrangler/`
- `.lighthouseci/`
- `.unlighthouse/`
- `coverage/`
- `playwright-report/`
- `test-results/`
- `tmp/`
- Pagefind output under built `dist/`

These paths should stay ignored by Git and by broad formatter, linter,
dead-code, Markdown, accountability, and coverage scans unless a task
explicitly changes the QA scope and verifies the diagnostic impact.

`site/unused-assets/` is an intentionally tracked archive of unreferenced
media. Do not delete, rename, or repurpose those files unless the active task
explicitly includes that cleanup.

## Handoff Policy

Final handoffs should include:

- what changed;
- which checks were run;
- which coverage command ran for Rust, TypeScript, or Astro behavior changes;
- any remaining coverage gaps, ignores, excludes, or `Coverage note:`
  comments;
- which checks were not run and why;
- any remaining risks or follow-up work.

Keep handoffs concise. Do not describe unrelated worktree changes unless they
affect the task.
