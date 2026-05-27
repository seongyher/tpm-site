# Engineering Philosophy

This document defines the long-term engineering philosophy for this repository.
It is meant to guide refactor planning, code review, architecture decisions,
testing strategy, and future platform productionization.

The short version:

> Keep messy edges thin, make the core pure and typed, make components
> declarative and boring, and make authoring easy without sacrificing
> correctness.

The goal is not abstraction for its own sake. The goal is a stable,
configurable, static-first publishing platform where TPM is one site instance,
not the architecture itself.

## How To Use This Document

This document is a decision aid, not a ceremony checklist. Use it to turn broad
engineering values into concrete design choices, acceptance criteria, tests,
and documentation updates.

Use the full document when:

- designing a new platform capability;
- planning a substantial refactor;
- touching public generated output;
- changing author-facing content models or site config;
- fixing a bug that suggests a weak abstraction or missing invariant.

For small changes, use it as a quick sanity check. Do not turn every small edit
into an architecture project.

When a principle suggests a new abstraction, require a concrete reason:

- a repeated domain concept;
- a known bug class;
- a messy authoring or configuration path;
- duplicated policy;
- a recurring layout or accessibility invariant;
- a testability problem caused by tangled concerns.

Good philosophy should make judgment sharper. It should not replace judgment.

## When Principles Conflict

The principles in this document are meant to work together, but real changes
often involve tradeoffs. Resolve conflicts in this order.

Non-negotiable guardrails:

- preserve article content, author intent, and historically important
  metadata;
- preserve public URL stability through routes, redirects, and canonical links;
- preserve accessibility, semantic HTML, and truthful metadata;
- keep generated output deterministic and verifiable;
- avoid performance work that breaks content, semantics, or authoring.

Default priorities:

1. Fix user-facing correctness and accessibility issues first.
2. Prefer author simplicity and reader experience over implementation
   cleverness.
3. Prefer the smallest local fix when there is no evidence of a recurring
   domain problem.
4. Prefer a stronger seam, schema, type, primitive, or test when a bug reveals
   a class of possible failures.
5. Prefer measurable performance improvements over speculative optimization.
6. Prefer extractable boundaries over actual package extraction until another
   repo or repeated internal use proves the need.

Backward compatibility and cleanup must be balanced deliberately. Remove stale
code when it is clearly obsolete, but keep or replace compatibility behavior
when public links, migrated content, author workflows, or external consumers
still depend on it.

## North Star

The repository should become a durable editorial/blogging platform with a clean
TPM site instance layered on top.

That means:

- authors should write content without touching application code;
- site owners should configure identity, routes, labels, theme, social links,
  feeds, metadata, and homepage surfaces without code changes where practical;
- developers should work inside clear, typed seams;
- refactors should reduce the chance of future breakage;
- machine-readable output should be first-class;
- performance, accessibility, SEO, and responsive design should be protected by
  tests and verification.

Strong code in this repo makes good behavior easy and bad behavior hard.

## Intent Before Mechanics

Good platform APIs expose domain intent before implementation mechanics. Users
and developers should be able to say what outcome they need, while provider,
storage, workflow, rendering, and deployment details stay behind narrow typed
adapters.

This is a general repo-health rule, not only a studio rule:

- route callers should ask for canonical route intent, not concatenate paths;
- metadata callers should ask for a semantic profile, not hand-author tag soup;
- media callers should ask for a media role, not depend on a storage path;
- workflow callers should request a state transition, not assume one provider's
  review mechanics;
- deploy callers should publish a verified artifact, not encode one host's CLI
  steps into core logic.

When a concrete implementation starts leaking upward, move the leak behind a
typed capability, policy helper, view model, adapter, or diagnostic. The core
domain model should remain stable enough that providers and interfaces can
change without changing the meaning of the product or platform operation.

## Fearless Velocity

The repo should let developers move at the natural speed of their ideas while
the platform absorbs the risk.

The doctrine:

> Optimize for fearless velocity: make intentional changes fast, obvious, and
> local; make accidental breakage difficult, noisy, and caught early.

This requires both speed and strictness. Fast tools without strong contracts
create brittle velocity. Strict contracts without fast tools create slow,
fearful development. The goal is the combination:

- fast focused feedback while editing;
- obvious change paths for common work;
- local changes with global confidence;
- types and schemas that guide developers toward valid states;
- reusable primitives that hide messy implementation details;
- generated-output checks that catch public regressions;
- release gates that protect the whole platform.

The fastest path to a feature should be the valid path. If developers must
bypass platform abstractions to move quickly, the abstractions need work.

## Domain-Expressive Architecture

The platform should feel like a typed domain language for static editorial
publishing. Developers should express publication intent through well-designed
abstractions, and the platform should safely compile that intent into routes,
HTML, metadata, assets, feeds, PDFs, search data, and deployable output.

The goal:

> Valid outcomes should be easy to express. Invalid outcomes should be
> impossible, rejected early, or forced through explicit escape hatches.

This is not a literal new syntax. The "language" is the repo's types, schemas,
registries, view models, components, scripts, docs, and tests.

### Domain Concepts Before Helpers

Before adding a generic helper, ask whether the repo is missing a domain
concept.

Weak:

```ts
filterItems();
getItems();
makeUrl();
```

Stronger:

```ts
buildCollectionEntries();
createCanonicalArticleRoute();
resolvePublishableVisibility();
```

The platform vocabulary should grow toward the publication domain, not toward a
bag of miscellaneous utilities.

### Intent-Oriented APIs

APIs should ask callers for intent, not implementation details.

Weak:

```ts
renderList({ compact: true, dividers: true, showDates: true });
```

Stronger:

```ts
createCompactEntryListViewModel({
  entries,
  surface: "homepage-start-here",
});
```

The caller should say what product surface or domain behavior is intended. The
platform should choose the mechanics.

### One Concept, One Canonical Model

Recurring domain concepts should have one canonical normalized model. Surfaces
may derive view models from that model, but they should not each invent their
own source representation.

Good candidates:

- article;
- announcement;
- publishable entry;
- collection;
- category/tag/term;
- visibility policy;
- route reference;
- citation source;
- article image;
- social preview image;
- support action;
- metadata profile.

If archive pages, search, RSS, homepage, and metadata all need the same fact,
derive it once and share the normalized result.

### Subdomains Need Mini-Languages

Each major platform area should have a small expressive vocabulary of its own.

Examples:

- routing: route maps, canonical URLs, legacy redirects;
- visibility: feed/search/homepage/sitemap/PDF inclusion;
- metadata: Open Graph, Schema.org, Scholar, social previews;
- citations: sources, notes, locators, backlinks, bibliography entries;
- images: article image policy, social images, inspection, PDF image policy;
- homepage: recipe, slots, collections, announcements, CTAs;
- components: primitives, blocks, variants, layout contracts;
- generated output: artifacts, owners, verification checks.

These mini-languages should be typed, composable, documented, and tested.

### Domains Form A Hierarchy

The project domain is made of smaller domains all the way down to primitive
expressions in code.

Think in layers:

```text
editorial publishing platform
  -> site owner / author experience
    -> article writing
    -> frontmatter and site configuration
    -> asset management
    -> preview and validation workflow
  -> deployed reader experience
    -> article pages
    -> navigation and discovery
    -> sharing, citation, PDF, search, and support CTAs
    -> accessibility, performance, SEO, and machine readability
  -> platform generator
    -> content collections
    -> routing and redirects
    -> metadata
    -> feeds and sitemap
    -> image policy
    -> citation and bibliography system
    -> PDF generation
    -> component and layout primitives
    -> build verification
```

Each subdomain can be decomposed further:

```text
metadata
  -> Open Graph
  -> Twitter cards
  -> Schema.org
  -> Google Scholar
  -> canonical URLs
  -> social image generation
  -> validation

citations
  -> inline notes
  -> BibTeX parsing
  -> normalization
  -> bibliography aggregation
  -> hover previews
  -> backlinks
  -> canonical source verification
```

When a subdomain grows, ask:

- What is the vocabulary of this domain?
- What are its valid states?
- What invariants define correctness?
- What inputs does it accept?
- What outputs does it guarantee?
- What failures need diagnostics?
- Which parts are TPM-specific?
- Which parts are reusable platform behavior?
- Could another repo use this?
- Could this become an Astro library, Astro integration, or CLI package?

This does not mean extracting packages early. It means designing boundaries
that make extraction possible when the domain proves mature.

### Compiler-Like Pipeline

The platform should behave like a compiler pipeline:

```text
author/site input
  -> parse
  -> validate
  -> normalize
  -> typed domain models
  -> view models
  -> render/generate
  -> verify generated artifacts
```

Developers and authors express what they mean. The platform handles the boring
and dangerous parts.

### Escape Hatches Return To The Language

Escape hatches are sometimes necessary: custom MDX components, trusted HTML,
manual redirects, raw embeds, custom metadata, and legacy migration adapters.
They should be rare, explicit, and auditable.

If the same escape hatch is used repeatedly, treat that as evidence that the
domain language needs a new official construct.

### Design For Extractability, Extract Only When Proven

Some subdomains may eventually be valuable beyond this repo: metadata,
citations, social previews, PDF generation, article image policy, publishable
routing, build verification, and editorial layout primitives are plausible
examples.

Build mature subdomains as if they may someday become packages:

- pure core logic;
- explicit inputs and outputs;
- no accidental TPM naming;
- no hidden `siteConfig` singleton;
- no hidden `process.cwd()` assumptions;
- no Astro dependency in framework-independent core logic;
- Astro adapters around pure modules when Astro integration is useful;
- structured diagnostics;
- stable fixtures;
- focused tests;
- docs that describe the domain contract.

Use a packaging ladder:

1. local domain module inside this repo;
2. private/internal workspace package if another repo needs it;
3. Astro library for importable functions/components;
4. Astro integration when build/config/content hooks are needed;
5. CLI package for audits, migration, validation, or generated-output tooling.

Reusable does not mean vague or generic. It means the subdomain is solved
cleanly enough that another project in the same niche can use it without
inheriting TPM-specific assumptions.

## Product Audiences

The platform has three primary audiences. Engineering decisions should serve
all three.

### Site Owners And Authors

Site owners and authors want to publish, configure, organize, promote, and
maintain a publication without thinking like framework developers.

The platform should:

- make the common path obvious;
- keep ordinary authoring close to Markdown, MDX, assets, and frontmatter;
- provide editorially good defaults;
- hide routing, RSS, metadata, search, social preview, PDF, image optimization,
  and redirect implementation details;
- validate mistakes early with clear human-oriented messages;
- separate simple defaults from power-user escape hatches;
- make future GUI/admin tooling natural through typed config and predictable
  content models.

Author confusion is a product bug. If a normal article, announcement,
collection, support link, social link, or homepage change requires source-code
knowledge, the platform is missing a better interface.

### Readers And Site Visitors

Visitors want a fast, accessible, beautiful, useful publication that helps them
find and read good work.

The deployed site should:

- respect author and editorial intent;
- load with imperceptible delay whenever practical;
- avoid layout shifts and accidental waiting;
- make discovery natural through homepage blocks, categories, tags,
  collections, search, feeds, article-end next steps, and footer links;
- make CTAs visible but dignified;
- avoid dark patterns, clutter, interruption, and manipulative conversion UI;
- support sharing, citation, PDFs, social previews, and machine indexing;
- remain accessible, semantic, and durable.

Reader trust is more important than short-term conversion tricks.

### Developers And Maintainers

Developers want to add features, make changes, and fix bugs quickly without
accidentally damaging authoring, reading, metadata, performance, or generated
output.

The codebase should:

- make common change paths obvious;
- keep blast radius small;
- provide fast focused feedback during development;
- reserve expensive release checks for the right stage;
- make important invariants measurable and testable;
- expose clean extension points for unanticipated future features.

Developer velocity is a product feature because it directly affects site
quality and platform stability.

## Operating Principles

### 1. Content Fidelity First

Article text, historical metadata, citations, redirects, and author intent are
high-value data. Treat content changes differently from implementation changes.

Do:

- preserve article body wording unless the task explicitly asks for content
  edits;
- keep legacy metadata when it explains historical routing or migration state;
- add migration notes when changing source shape.

Do not:

- rewrite article prose while doing UI work;
- delete historical metadata because it is not currently rendered;
- let routing cleanup silently break old citation links.

### 2. Static-First By Default

The site should ship static HTML with the smallest useful JavaScript surface.
Astro content collections, build-time view models, static endpoints, and
processed component scripts are the default tools.

Do:

- render documents at build time;
- hydrate only the smallest necessary interaction boundary;
- use static endpoints for RSS, sitemap, redirects, search indexes, PDFs, and
  generated metadata where practical.

Do not:

- introduce SSR, middleware, server islands, request-time routes, or broad
  client-side routing without an explicit product decision;
- ship React for static prose or static layout.

### 3. Platform Code And Site Code Stay Separate

`src/` should hold reusable platform code. `site/` should hold TPM-specific
content, assets, redirects, theme overrides, and publication config.

Ask this when placing code:

- Would another publication reasonably replace this value, label, link, theme,
  route, or block choice?
- Is this a reusable blogging/platform behavior?
- Is this TPM content or TPM branding?

Do:

- put publication-specific text, URLs, social handles, theme values, and
  feature toggles in `site/` or typed site config;
- keep reusable content rendering, route generation, validation, metadata,
  feed, and UI primitives in `src/`.

Do not:

- bake TPM copy into reusable components;
- let platform helpers import publication content directly unless they are
  explicit site-instance adapters.

## Separation Of Concerns

The repo should be built from deliberate seams. Each seam should have a clear
owner, a minimal interface, and tests around its invariants.

### Dependency Direction

Dependencies should point inward toward smaller, more stable concepts. Lower
layers should not import higher layers.

Preferred dependency direction:

```text
pages/routes
  -> layouts/blocks/components
  -> UI primitives

pages/routes
  -> view-model builders
  -> domain/policy helpers
  -> schemas/types

impure adapters
  -> pure core
```

Do:

- let routes import view-model builders;
- let components import UI primitives;
- let impure loaders/adapters call pure normalization helpers.

Do not:

- let UI primitives import site config, content collections, route files, or
  domain policy;
- let pure domain helpers import Astro components;
- let platform modules depend on TPM-specific content or branding.

If a lower layer needs a higher-layer value, pass that value through a narrow
typed interface instead of importing upward.

### Platform Versus Site Instance

Platform code answers:

- how articles become routes;
- how publishable entries are filtered and sorted;
- how metadata is generated;
- how images, references, PDFs, feeds, and search indexes work;
- how reusable UI primitives behave.

Site instance code answers:

- what the publication is called;
- what content exists;
- which social/support links are official;
- what the theme looks like;
- which labels and feature toggles are active;
- which manual redirects are required.

### IO Versus Pure Logic

Impure code belongs at the edges. Pure logic belongs in the core.

Impure edges include:

- filesystem reads and writes;
- Astro `getCollection()` and `render()`;
- environment variables;
- DOM APIs;
- browser storage;
- network calls;
- generated build output;
- CLI process behavior.

Pure core logic includes:

- config parsing after raw input is available;
- route construction;
- visibility policy;
- content normalization;
- metadata and JSON-LD construction;
- search/feed/PDF view-model construction;
- sorting and grouping;
- state transitions for interactions.

Do:

```ts
const model = createArticlePageViewModel({
  article,
  authors,
  category,
  config,
  relatedArticles,
});
```

Do not:

```ts
// Hidden IO and hidden global config make this hard to test.
const model = await createArticlePageViewModel(article);
```

unless that function is explicitly named and documented as an IO adapter.

### Policy Versus Presentation

Policy decides what should happen. Presentation renders it.

Policy examples:

- whether a draft enters RSS;
- which entries are homepage-visible;
- which image is used for social metadata;
- how old URLs redirect;
- whether a PDF is generated;
- how citations are normalized;
- how empty states are selected.

Presentation examples:

- article cards;
- compact entry rows;
- section headers;
- action menus;
- support blocks;
- image frames.

Do:

- compute policy in `src/lib` or route view models;
- pass already-normalized props to visual components.

Do not:

- let a component import `siteConfig` to decide if something belongs in RSS;
- put feed, search, route, or citation policy into an Astro template.

### Data Model Versus View Model

Raw content entries are not UI props. A content entry should move through clear
stages:

```text
Raw content entry
  -> validated collection data
  -> normalized domain model
  -> surface-specific view model
  -> component props
```

An article preview card, RSS item, search result, PDF page, citation entry, and
JSON-LD node may all start from the same content but are not the same model.

Do:

- create view models for complex page surfaces;
- keep list/card components independent of raw Astro collection entries.

Do not:

- pass raw entries through several components and let each component rediscover
  title, route, author, image, and visibility rules.

### Normalize Once, Then Use Strict Internal Types

Boundary data may be permissive because authors, config files, migrated
content, and external tools are messy. Internal platform data should be strict.

Do:

```ts
type RawArticleFrontmatter = {
  image?: unknown;
  title?: string;
};

type ArticleModel = {
  image: ArticleImageState;
  title: string;
};
```

Do not let raw optional authoring shapes leak across the app:

```ts
// Every caller now has to rediscover validation and fallback policy.
function renderArticleTitle(article: RawArticleFrontmatter) {
  return article.title ?? "Untitled";
}
```

Normalize at the boundary, then let internal code rely on complete,
well-typed models.

### Capability-Specific Contexts

Passing the entire site config into every helper hides dependencies and makes
APIs harder to test. Prefer small context objects for the capability being
computed.

Do:

```ts
createFeedItems(entries, feedPolicy);
createSupportActions(supportConfig);
createRouteMap(routeConfig);
```

Do not:

```ts
createFeedItems(entries, siteConfig);
```

unless the function is explicitly a high-level site adapter.

## Type-Driven Design

Types should encode real domain guarantees. Good types reduce defensive clutter
because invalid combinations cannot be expressed.

### Make Invalid State Unrepresentable

Prefer discriminated unions when states are mutually exclusive.

Do:

```ts
type PdfState =
  | { kind: "available"; href: string; label: string }
  | { kind: "disabled"; reason: "frontmatter" | "unsupported-content" }
  | { kind: "unavailable"; reason: "not-generated" };
```

Do not:

```ts
interface PdfState {
  disabled?: boolean;
  href?: string;
  reason?: string;
}
```

The second shape allows impossible combinations such as
`{ disabled: true, href: "/article.pdf" }`.

### Prefer Named States Over Boolean Clusters

Booleans are fine for native or ARIA-like states such as `disabled`, `pressed`,
or `invalid`. They become dangerous when they encode layout modes, feature
policy, or mutually exclusive UI states.

Do:

```ts
type ListDensity = "compact" | "comfortable";
type ListChrome = "plain" | "divided" | "panel";
```

Do not:

```ts
showDividers?: boolean;
compact?: boolean;
panel?: boolean;
hideDescription?: boolean;
```

unless the combinations are genuinely independent and tested.

### Prefer Literal Unions And Registries For Closed Sets

For repo-internal states, route kinds, metadata kinds, publishable entry kinds,
feature surfaces, UI variants, and author/config literals, prefer string
literal unions derived from typed registries over TypeScript runtime enums.

Do:

```ts
export const publishableKinds = ["article", "announcement"] as const;

export type PublishableKind = (typeof publishableKinds)[number];
```

This gives the platform:

- a runtime list for validation, options, and tests;
- a TypeScript union for exhaustive checks;
- no enum runtime object;
- direct compatibility with JSON, frontmatter, and Zod schemas.

Do not create separate string lists, schema literals, labels, and types for the
same closed set. One typed registry should be the source of truth whenever
practical.

Good registry candidates include:

- publishable entry kinds;
- visibility surfaces;
- feature flags;
- route kinds;
- share targets;
- semantic metadata kinds;
- supported schema.org extension kinds;
- PDF states;
- generated-output surfaces.

### Exhaustiveness Is Policy

When a union represents a closed domain, handling should be exhaustive. Adding a
new state should make TypeScript point to every place that needs a decision.

Do:

```ts
function assertNever(value: never): never {
  throw new Error(`Unhandled state: ${String(value)}`);
}

function routeForKind(kind: PublishableKind): string {
  switch (kind) {
    case "announcement": {
      return "/announcements/";
    }
    case "article": {
      return "/articles/";
    }
    default: {
      return assertNever(kind);
    }
  }
}
```

Do not rely on a catch-all default for closed domain states when each state
requires a real product decision.

### Validate At Boundaries

Schemas should reject bad author or site-owner input early. Runtime code should
consume parsed and normalized data, not unknown shapes.

Boundary validation belongs around:

- site config;
- content frontmatter;
- redirects;
- citation syntax;
- tags;
- semantic metadata;
- feature flags;
- generated route conflicts.

### Use Result Types For Recoverable Failure

When failure is expected and recoverable, return a typed result. Do not use
`null` or thrown strings for domain diagnostics.

Do:

```ts
type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; diagnostics: Diagnostic[] };
```

Do not:

```ts
const value = parseThing(input); // returns null and logs somewhere
```

## Defensive Coding

Defensive coding here means designing systems that are difficult to misuse. It
does not mean scattering incidental guards everywhere.

### Fail Early, Clearly, And Deterministically

Bad content/config should fail during checks or build, not after deployment.

Do:

- detect duplicate routes;
- detect invalid tags;
- reject malformed config;
- verify generated redirects;
- validate RSS/sitemap/HTML output;
- fail if required metadata cannot be normalized.

Do not:

- silently drop invalid entries without diagnostics;
- rely on browser behavior to hide malformed output;
- let generated files contain duplicate or conflicting routes.

### Avoid Ambient Magic

Hidden behavior makes fast changes risky. Avoid module import side effects,
implicit global singletons, environment-dependent defaults, and pure-sounding
functions that secretly perform IO.

Do:

- make active site root, config, route policy, and build mode explicit at the
  edge;
- name impure adapters honestly with words like `load`, `read`, `write`,
  `generate`, or `sync`;
- keep singleton compatibility layers thin and obvious.

Do not:

- hide filesystem reads behind a helper named `getConfig`;
- derive behavior from `process.cwd()` deep inside domain policy;
- make importing a module mutate generated files or global state.

### Centralize Risky Policy

There should be one authoritative policy module for each risky behavior.

Good policy seams:

- publishable visibility;
- route construction;
- social image selection;
- article image handling;
- citation normalization;
- PDF eligibility;
- feed inclusion;
- search inclusion;
- generated metadata;
- redirect generation.

Do not reimplement those rules inside pages, components, and scripts.

### Keep Interfaces Minimal

A good abstraction hides implementation details without hiding important domain
choices.

Do:

- expose the few props or parameters callers actually need;
- name variants by intent;
- keep feature-specific helpers narrow.

Do not:

- pass an entire raw config object to a component that needs one label;
- create mega-components that accept dozens of optional props;
- combine unrelated domains because they share a word such as "image" or
  "link".

### Make Fallbacks Explicit

Fallbacks are product decisions. They should be named, tested, and documented
when they affect public output.

Examples:

- missing article image -> configured fallback image;
- missing image alt -> title-based article thumbnail alt fallback;
- empty collection -> explicit empty state;
- missing citation source -> visible uncertainty note or diagnostic;
- disabled PDF -> no PDF action rendered;
- newest article -> previous article continuity fallback.

### Use Structured Diagnostics

Validation and build tooling should produce structured diagnostics when
possible. Strings are fine for final display, but structured diagnostics are
easier to test, aggregate, filter, and eventually show in an admin UI.

Do:

```ts
type Diagnostic = {
  code: "duplicate-route" | "missing-image-alt" | "invalid-tag";
  location?: SourceLocation;
  message: string;
  severity: "error" | "warning";
};
```

Do not:

```ts
errors.push(`Bad thing in ${path}`);
```

as the only representation of a recoverable validation issue.

### Make Unsafe Boundaries Visible

Some behavior must handle trusted HTML, generated JSON-LD, legacy Markdown,
raw iframes, or browser APIs. These are valid needs, but the dangerous edge
should be named and auditable.

Do:

```ts
createTrustedJsonLdScript(jsonLd);
renderTrustedGeneratedHtml(html);
```

Do not spread `set:html`, raw HTML parsing, or unsanitized DOM writes across
unrelated components and scripts.

### Bugs Are Design Feedback

A bug is not only a defect to patch. It is evidence that the system allowed an
invalid state, unclear contract, missing invariant, weak test, or leaky
abstraction.

The bug workflow should be:

1. fix the immediate user impact;
2. ask why the bug was possible;
3. harden the narrowest layer that prevents the bug class from recurring;
4. add focused regression coverage;
5. record larger follow-up work if the full hardening is too large for the
   current patch.

Questions to ask after a bug:

- Was an invalid state representable?
- Was data normalized too late or in several places?
- Was policy duplicated?
- Was a component accepting impossible prop combinations?
- Was there no schema validation?
- Was fallback behavior implicit?
- Was generated output unverified?
- Was a test missing at the right layer?
- Did hidden global state or IO make behavior surprising?
- Did the domain language lack a concept that would have made the correct
  expression obvious?

Prefer eliminating bug classes over scattering defensive patches. A regression
test catches one case; a stricter type, schema, registry, policy helper, or
layout primitive can make the whole class harder to express.

Do not overreact to every typo or one-off migration artifact. The principle is
not that every bug deserves a framework. The principle is that every bug
deserves the question.

## Component Philosophy

Components should be small, stateless where possible, declarative, semantic,
and boring.

### Pages Compose

Route files should load data, validate params, build view models, and compose
layouts/blocks.

Do:

```astro
<BaseLayout metadata={metadata}>
  <ArticleLayout viewModel={articlePage} />
</BaseLayout>
```

Do not:

```astro
---
// Long route file that fetches, filters, sorts, builds metadata, and renders
// repeated UI markup inline.
---
```

### Components Render

Visual components should not perform repository IO, content collection calls,
filesystem reads, environment reads, or broad config lookups.

Do:

- pass explicit props;
- render semantic HTML;
- own responsive behavior;
- expose narrow variants;
- use slots for composition.

Do not:

- import `siteConfig` from every reusable component;
- make a component responsible for feed/search/PDF visibility;
- let a component know where content lives on disk.

### Blocks Own Page Sections

Blocks are domain-level page sections such as hero, recent list, support block,
category rail, search results, article endcap, or bibliography section.

Blocks may compose several components, but they should still receive normalized
data. They should not become route files in disguise.

### UI Primitives Own Low-Level Invariants

Primitives should make common UI behavior safe and repeatable:

- button/link variants;
- section headers;
- scroll rails;
- action menus;
- containers;
- entry metadata lines;
- brand CTA frames;
- image/media frames.

Good primitives are small. They do not know TPM business rules.

### Make Error-Prone Layout Patterns Repeatable

Responsive layout is one of the repo's most error-prone domains. Repeated
layout bugs should be treated as missing contracts, missing primitives, or
under-specified component APIs.

Reusable components should own their layout invariants:

- no horizontal overflow;
- no text overlap;
- stable dimensions for fixed-format regions;
- intentional wrapping or truncation;
- explicit media aspect/fit policy;
- reachable controls at mobile and desktop sizes;
- predictable open/hidden spacing;
- stable carousel and rotating-content height;
- keyboard and touch affordances that remain in bounds.

Use primitives to solve repeated layout problems once:

- section/action alignment;
- horizontal scroll rails;
- metadata separator lines;
- compact entry rows;
- image/media frames;
- action rows;
- popover panels;
- two-column responsive sections;
- disclosure sections;
- prose breakout media.

Playwright should verify layout contracts, not serve as the first line of
defense for patterns already understood. If the same class of layout bug keeps
appearing in browser tests, move the constraint into a primitive, view model,
or component contract.

### Make Future Components Easy To Build Correctly

The component system should reduce the amount of responsive-design reasoning
required for every new feature. Developers should be able to compose proven
layout primitives instead of re-solving containment, wrapping, action alignment,
media sizing, and empty states from scratch.

When building or refactoring a component, ask:

- Which responsive pattern is this component using?
- Does a primitive already own that pattern?
- If not, is this pattern likely to recur?
- What invariant should the primitive make automatic?
- What test or catalog example will teach the next developer how to use it?

Prefer adding a small reusable pattern before the third copy appears when the
domain is already known to be messy. This is not premature abstraction when the
abstraction captures a real invariant, such as "media frames never overflow" or
"split headers keep actions reachable."

### Prefer Composition Over Configuration Objects

Large configuration objects often hide invalid combinations. Prefer component
composition, slots, and named variants.

Do:

```astro
<SectionHeader title="Recent" actionHref="/archive/" actionLabel="View more" />
```

Do not:

```astro
<UniversalSection
  sectionConfig={{
    mode: "article",
    showRail: false,
    card: true,
    support: false,
    bibliography: false,
  }}
/>
```

unless the domain truly has a stable schema and the component is explicitly a
renderer for that schema.

## State And Interaction

Runtime interaction should be explicit, small, and progressively enhanced.

### Static First, Islands When Needed

Use static HTML whenever possible. Use processed scripts, custom elements, or
hydrated islands only when interaction requires runtime state.

Do:

- keep share/cite/image inspector scripts scoped to those controls;
- lazy-load optional interaction when practical;
- leave normal anchor navigation working without JavaScript.

Do not:

- hydrate whole layouts because one button is interactive;
- use hover-only behavior without keyboard and touch alternatives.

### Model Nontrivial State Explicitly

For client scripts, prefer finite state models over scattered mutable flags.

Do:

```ts
type PreviewState =
  | { kind: "closed" }
  | { kind: "opening"; triggerId: string }
  | { kind: "open"; triggerId: string; panelId: string };
```

Do not:

```ts
let activeTrigger: HTMLElement | null = null;
let isOpen = false;
let isClosing = false;
let closeTimer: number | undefined;
```

unless the behavior is trivial and locally contained.

### Keep DOM Adapters Thin

Browser scripts should have two layers when they become complex:

1. pure behavior/state helpers;
2. DOM adapter that wires events, attributes, focus, and layout.

This keeps interaction behavior testable without a full browser.

## Testing Philosophy

Tests are one of the reasons to create clean seams. Good seams make correctness
cheap to verify.

### Test Invariants

Prefer tests that lock down durable guarantees:

- hidden entries do not leak into RSS, search, sitemap, or archive pages;
- canonical routes and redirects are stable;
- article images stay contained;
- metadata is valid and truthful;
- generated references have stable anchors;
- homepage carousel does not shift layout;
- actions remain keyboard accessible;
- long labels do not overflow;
- empty states are deliberate.

Avoid tests that only duplicate implementation details.

### Use The Smallest Useful Test Layer

Default order:

1. pure unit tests for policy and transformation logic;
2. Astro component tests for rendered structure and semantics;
3. catalog tests for component examples and fixtures;
4. Playwright tests for browser behavior and responsive invariants;
5. release checks for generated-output integration.

Do not use e2e tests for logic that can be tested as a pure function.

### Characterize Before Risky Refactors

Before refactoring high-risk systems, write tests that describe intended
current behavior.

High-risk systems include:

- Markdown and MDX transforms;
- article images;
- article references and bibliography;
- table of contents;
- site header and mobile menu;
- homepage carousel;
- metadata and JSON-LD;
- feed/sitemap/search/PDF output;
- route and redirect generation.

### Maximize Meaningful Coverage

Coverage is useful when it represents real confidence. Do not add brittle tests
just to raise a number.

Do:

- extract pure logic when coverage is hard because concerns are tangled;
- test both success and failure states;
- test author-facing validation errors;
- test generated output consumed by machines.

Do not:

- add test-only exports;
- snapshot large markup trees when semantic assertions are clearer;
- depend on network access in normal tests.

### Proactively Test Known Messy Domains

Some domains are predictably error-prone. Design tests and helpers for them
before they repeatedly fail in release checks.

Known messy domains include:

- responsive layout and containment;
- long text and truncation;
- image aspect ratios and fallback media;
- popover/menu positioning;
- generated metadata;
- redirects and canonical routes;
- visibility across RSS/search/homepage/sitemap;
- citation and bibliography normalization;
- MDX/Markdown transform behavior;
- generated PDFs and social preview images.

Prefer reusable assertion helpers for repeated browser/layout checks:

- element stays horizontally contained;
- viewport has no horizontal overflow;
- bounding box stays stable after state changes;
- action row remains visible and reachable;
- media frame respects aspect/fit policy;
- scroll rail endpoints remain readable.

The more error-prone a domain is, the more the repo should provide reusable
fixtures, builders, assertions, and examples so developers do not need to solve
the same testing problem from scratch.

## Refactor Philosophy

Refactors should make the next change easier, safer, or more obvious. A
refactor that only moves code around is not enough.

### Good Refactor Candidates

Refactor when:

- the same policy is implemented in multiple places;
- a component does IO or config lookup that belongs at an edge;
- a route file contains repeated UI sections;
- a helper has unclear inputs or hidden globals;
- tests require awkward setup because concerns are tangled;
- a boolean cluster allows invalid combinations;
- responsive behavior is patched from outside the component;
- a bug reveals that a whole class of invalid states can be expressed;
- an escape hatch is used repeatedly for the same domain need;
- a normal feature requires boilerplate across many files;
- a future site owner would need to edit source code for normal configuration.

### Poor Refactor Candidates

Do not refactor just because:

- a file is long but internally coherent;
- class lists look long in a component used once;
- two components look similar but have different domain rules;
- a generic abstraction would require vague prop names;
- the change would reduce line count but hide important policy.

### Refactor In Layers

Prefer this order:

1. add characterization tests;
2. extract pure logic;
3. define types and states;
4. introduce a narrow primitive or helper;
5. migrate one or two representative call sites;
6. verify behavior;
7. broaden migration only after the seam proves useful.

Do not jump straight from a complex component to a universal abstraction.

### Optimize For Locality Of Change

Common product changes should touch a small, obvious set of files.

Good change paths:

- adding a share target updates one registry, one test fixture, and maybe docs;
- adding a site config field updates the schema/defaults, docs, and focused
  tests;
- adding a browse surface reuses existing term/list/header primitives;
- adding a metadata kind extends a registry and exhaustive renderer.

If a routine change requires hunting through routes, components, scripts,
schemas, and generated-output helpers, the repo is missing a seam.

### Keep Compatibility Layers Temporary

Migration adapters and compatibility aliases are sometimes useful. They should
be clearly named, documented, and removed or reclassified when their purpose is
done.

Do:

- mark compatibility helpers as adapters;
- document what replaces them;
- add a checklist or deferred item when removal needs a later pass.

Do not let temporary migration glue become invisible platform architecture.

### Reviewability Is A Feature

The best architecture makes PRs easier to review. Small pure modules, narrow
diffs, explicit tests, deterministic output, and clear docs all improve
developer velocity.

A refactor that makes future diffs smaller and safer is valuable even when it
does not change current user-visible behavior.

### Proactive Complexity Radar

Do not wait for every pattern to become painful before designing a seam. When a
domain is predictably complex, invest early in a small contract, fixture,
primitive, or policy helper.

Signals that a proactive abstraction may be worthwhile:

- developers need to remember the same gotcha in several places;
- adding a feature requires copying a layout recipe;
- the same Playwright assertion is needed across unrelated pages;
- the same config fallback appears in several components;
- a value is derived independently for RSS, metadata, search, and UI;
- a feature needs both author-facing config and generated-output behavior;
- review comments repeatedly catch the same kind of mistake.

Be sensible. Do not build abstractions for imaginary products. But when the
repo has enough evidence that a domain is messy, solve the domain once at the
right layer.

## Generated Output And Tooling Philosophy

Generated output is a public API. URLs, redirects, RSS, sitemap, PDFs, JSON-LD,
social tags, search indexes, and rendered HTML semantics are externally
consumed contracts.

Do:

- treat generated-output changes as API changes;
- verify generated files with focused scripts;
- keep generated output deterministic;
- sort public lists explicitly with tie-breakers;
- make scripts idempotent and safe to rerun;
- give scripts stable exit codes and actionable diagnostics.

Do not:

- let multiple scripts independently mutate the same generated file without a
  clear pipeline;
- depend on incidental object iteration order for public output;
- allow fix scripts to produce noisy churn;
- ignore generated-output diffs because source code looks unchanged.

### Single Writer Principle

Each generated artifact should have one owning script or one explicit pipeline.
This keeps build behavior understandable and prevents order-dependent bugs.

Examples:

- one owner for Cloudflare redirects;
- one owner for PDFs;
- one owner for social preview images;
- one owner for search index generation;
- one owner for site config schema output.

### Error Message Quality

Errors should tell the user what failed, where, why, and how to fix it. This is
especially important for author-facing and site-owner-facing tooling.

Good diagnostics include:

- the file path or route;
- the invalid field or generated artifact;
- the rule that failed;
- the next action to fix it.

## Efficiency Philosophy

Efficiency is a product goal, developer-experience goal, and platform
architecture goal.

The platform should spend complexity once so authors, developers, and readers
do not pay for it repeatedly.

### Developer Efficiency

Developers should get fast feedback at the right depth.

Do:

- keep focused unit/component/script tests fast;
- provide narrow commands for content, config, catalog, asset, metadata, and
  generated-output checks;
- run rigorous release checks at release time instead of slowing every edit;
- use pure seams so logic can be tested without full builds or browsers;
- keep diagnostics actionable so failures are quick to fix.

Do not:

- use slow e2e tests for logic that a pure unit test can cover;
- make every small edit require a full production build;
- let validation scripts do unnecessary work for content-only changes.

### Author Iteration Efficiency

Authors and site owners should be able to preview and validate ordinary content
changes quickly. This matters now for Markdown authoring and later for GUI site
editing.

Do:

- keep author-facing checks narrower than full developer checks;
- make content and config validation quick and clear;
- avoid unnecessary regeneration when only authoring inputs change;
- provide sensible defaults so authors can publish without learning every
  platform feature.

Do not:

- make simple article edits depend on expensive unrelated checks;
- make advanced metadata or power-user features mandatory for common content.

### Visitor Runtime Efficiency

Readers should experience the site as basically instant.

Do:

- ship static HTML first;
- keep JavaScript small and scoped;
- optimize images through Astro or deliberate post-build tooling;
- cache hashed assets aggressively;
- minimize CSS and payload bloat;
- lazy-load optional heavy behavior;
- load critical content before noncritical interaction;
- use stable dimensions to avoid layout shifts;
- measure Core Web Vitals and payload size.

Do not:

- ship unneeded bytes because they are convenient for developers;
- eager-load full-size assets before user intent;
- let carousels, embeds, images, or popovers shift layout;
- optimize byte count by breaking semantics, accessibility, metadata, or
  author intent.

### Optimization Safety

Performance work should be evidence-based and reversible.

Good optimizations:

- safe HTML/CSS/JS minification with validation;
- image optimization and format conversion with visual checks;
- critical-path loading improvements with before/after measurements;
- deferred interaction scripts that preserve responsiveness;
- post-build optimizations that are semantic-aware and covered by output
  verification.

Bad optimizations:

- fragile string rewrites without semantic understanding;
- removing metadata or accessibility affordances for byte savings;
- adding complex build steps without measurable improvement;
- making source code obscure for marginal payload wins.

## Measurement Philosophy

Every important platform goal should have an observable signal. Every
optimization should have a before/after measurement when practical.

### Define Success Before Optimizing

Before optimization work begins, name the target and guardrails.

Examples:

- target: reduce initial JavaScript bytes;
- guardrail: article share/cite menus still open within the expected latency;
- target: improve LCP;
- guardrail: no image quality or layout regressions;
- target: reduce release-check time;
- guardrail: no loss of coverage for generated output.

Metrics should guide decisions, not replace judgment. A higher Lighthouse score
is not worth broken semantics. A faster build is not worth weak validation.

### Measure The Whole Platform

Useful metrics include:

- `just check` runtime;
- `just release-check` runtime;
- build time by stage;
- content-only author check runtime;
- generated HTML size;
- total JS, CSS, image, search-index, and PDF payload size;
- largest files in `dist/`;
- non-optimized asset counts;
- route count and redirect count;
- duplicate redirect diagnostics;
- Lighthouse/Core Web Vitals;
- accessibility violations;
- structured metadata validity;
- RSS/sitemap/HTML validity;
- test coverage and test runtime.

Not every metric needs to block release. Some are review signals. Important
regression-prone metrics should become budgets or release gates once the target
is stable.

### Experiment Workflow

Use this loop for performance, tooling, and platform experiments:

1. state the hypothesis;
2. capture the baseline;
3. implement the smallest reversible experiment;
4. measure before and after;
5. verify correctness and guardrails;
6. keep, revert, or defer with evidence.

Record useful failed experiments. Evidence prevents the same question from
being relitigated without new information.

## Documentation Philosophy

Docs are part of the platform. They should help future agents, developers, and
site owners make correct changes without rediscovering policy.

Documentation has three jobs:

1. preserve intent;
2. describe contracts;
3. explain how to verify behavior.

Code should still be clear without comments. If documentation is compensating
for tangled code, prefer creating a cleaner seam.

Do:

- update design docs before substantial implementation;
- document author-facing features in simple language;
- document generated-output contracts;
- document deferred work with a resume trigger;
- keep `CHECKLIST.md` focused on active milestones;
- move postponed work to `DEFERRED.md`.

Do not:

- leave stale milestones as pseudo-documentation;
- hide platform policy only in tests;
- make non-technical authors read implementation docs to publish content.

### Code Comments

Use code comments sparingly. Good comments explain why a non-obvious decision
exists, not what the next line of code does.

Good comment subjects:

- important invariants;
- browser or platform quirks;
- performance constraints;
- security or trust boundaries;
- intentional fallbacks;
- legacy migration compromises;
- coverage notes for hard-to-test edges.

Do:

```ts
// Slashes are rejected in tags so encoded tag URLs cannot behave like path
// segments.
```

Do not:

```ts
// Get the article title.
const title = article.data.title;
```

If a comment needs to explain a long sequence of local steps, consider
extracting a named helper instead.

### Public API JSDoc

Exported functions, exported types, and public module APIs are contracts. They
should have structured JSDoc when the type signature alone does not communicate
intent, ownership, invariants, failure behavior, purity, or expected inputs.

This is not only a preference: ESLint enforces JSDoc for public functions and
types. The enforcement should remain aligned with this philosophy.

Useful JSDoc should explain:

- what the API is for;
- whether it is pure or performs IO;
- what inputs must already be normalized;
- what invariants callers must preserve;
- what the function guarantees;
- what failures mean;
- whether output is deterministic;
- whether the API is a site-instance adapter or reusable platform logic.

Do:

```ts
/**
 * Builds the article-page view model from already-loaded content.
 *
 * This function is pure. Callers must provide all related entries, authors,
 * support actions, and site config. It does not read content collections or
 * import the active site instance.
 *
 * @param input Normalized article-page inputs loaded by the route adapter.
 * @returns A complete view model safe to pass to `ArticleLayout`.
 */
export function createArticlePageViewModel(
  input: ArticlePageViewModelInput,
): ArticlePageViewModel {
  // ...
}
```

Do not:

```ts
/**
 * Gets things.
 */
export function getThings(input: unknown) {
  // ...
}
```

If JSDoc needs to warn about several invalid prop or option combinations, the
API likely needs a stricter type or a smaller public surface.

### Public Functions And Exports

Export less by default. An export should represent a stable concept or a real
production seam, not an incidental helper.

Every exported function or type should be able to answer:

- Who is allowed to call this?
- Is it pure or impure?
- What invariants does it expect?
- What invariants does it guarantee?
- What happens on invalid input?
- Is this interface stable enough to keep?

Do:

- keep private helpers private;
- export narrow, named platform concepts;
- use structured input/output types;
- return result unions for recoverable failures;
- document non-obvious contracts with JSDoc.

Do not:

- export helpers only to test them;
- expose vague `any`/`unknown` object APIs when a typed contract is possible;
- hide filesystem, DOM, environment, or network access behind pure-sounding
  names.

### Audience-Specific Docs

Different docs serve different readers.

- `README.md`: developer onboarding and common commands.
- `site/README.md`, `AUTHOR_TUTORIAL.md`, and authoring docs: non-technical
  author workflow.
- `AGENTS.md`: operational rules for agents.
- `agent-docs/`: engineering, design, framework, and refactor philosophy.
- `docs/`: feature contracts, implementation plans, audits, generated-output
  behavior, and author/platform references.
- `CHECKLIST.md`: active milestone tracking.
- `DEFERRED.md`: postponed work with reasons and resume triggers.

Do not make non-technical authors read implementation audits to publish an
article. Do not make developers reverse-engineer platform contracts from
author tutorials.

### Docs And Tests Reinforce Each Other

Docs explain intent and contracts. Tests enforce critical invariants. Release
checks prove integrated output still satisfies the contract.

For complex systems, documentation should name or imply the verification path:

- unit tests for pure policy;
- Astro component tests for rendered semantics;
- Playwright tests for browser behavior;
- generated-output checks for RSS, redirects, metadata, PDFs, and HTML;
- release checks for cross-system safety.

When behavior changes, update docs in the same milestone. A change is not done
if the repo still teaches the old behavior.

## Accessibility, Semantics, And Machine Readability

The site is read by humans, assistive technology, search engines, social
crawlers, scholarly tools, feeds, browser readers, and future AI agents. Public
output should be accessible and machine-readable by design.

Do:

- use semantic HTML first;
- keep landmarks, headings, lists, links, dates, authors, and article metadata
  meaningful;
- generate truthful Open Graph, Twitter, Schema.org, RSS, sitemap, and
  scholarly metadata;
- provide alt text or deliberate decorative image treatment;
- validate output and scan for accessibility regressions.

Do not:

- replace semantic structure with generic `div` trees;
- add ARIA when native HTML already expresses the meaning;
- generate metadata that overstates what the page contains;
- hide machine-readable behavior inside visual components.

## Performance Philosophy

Performance is an architectural property, not only a post-build optimization.

Do:

- keep static output and low JavaScript as defaults;
- use Astro image optimization whenever practical;
- cache hashed assets aggressively;
- lazy-load noncritical interaction;
- avoid layout shifts with stable dimensions;
- test Lighthouse and responsive behavior.

Do not:

- add client JavaScript for static display;
- load large assets by accident;
- let carousels, popovers, images, or embeds shift layout;
- optimize by making code harder to reason about unless the measurement
  justifies it.

## Authoring Philosophy

The platform should make good authoring easy.

Authors should usually only need to know:

- where to add Markdown or MDX;
- what frontmatter fields are available;
- where images go;
- how tags, collections, announcements, and metadata are expressed;
- how to submit a PR.

Authors should not need to know:

- Astro route internals;
- RSS enclosure details;
- JSON-LD syntax;
- social image generation internals;
- PDF rendering mechanics;
- redirect generation logic;
- search indexing implementation.

If authors repeatedly need to understand implementation details, that is a
platform design problem.

## Future Platform Direction

The long-term platform should support:

- multiple site instances;
- fixture site instances for minimal, kitchen-sink, feature-disabled, and
  unusual-route configurations;
- typed site config suitable for a future admin UI;
- configurable routes, labels, identity, social links, support links, theme,
  metadata, homepage blocks, and feature flags;
- content collections for articles, announcements, authors, categories,
  collections, pages, and future publication concepts;
- strict generated-output validation;
- reusable blocks and primitives that can survive configuration changes.

The platform should not become a vague site builder. It should remain a strong
editorial publishing system with clear defaults and carefully chosen extension
points.

### Config Evolution Policy

Site config should evolve like a public API.

Do:

- name fields for site owners, not implementation internals;
- provide defaults for optional fields;
- validate with clear diagnostics;
- document migrations when shape changes;
- deprecate before removing uncertain fields.

Do not:

- make normal site-owner changes require editing source code;
- expose config combinations that the platform cannot render safely.

## Review Checklist For Future Changes

Before a substantial change, ask:

- Which audience is the primary beneficiary?
- Which guardrails must not regress?
- What layer owns this behavior?
- Is this platform behavior or TPM site behavior?
- Is the core logic pure and testable?
- Are invalid states impossible or at least validated early?
- Is fallback behavior explicit?
- Are components declarative and stateless where practical?
- Does the component own its responsive behavior?
- Does this preserve semantic HTML and accessibility?
- Does this affect machine-readable output?
- Are tests written at the smallest useful layer?
- Are high-risk systems protected by characterization tests?
- Does this make future configuration easier or harder?
- Does the abstraction expose the minimum useful interface?
- Is any hidden global dependency avoidable?
- Does dependency direction stay clean?
- Is this closed set represented by one registry/schema/type source of truth?
- Does this change keep generated output deterministic?
- Is this change easy to review and local to the right layer?
- If this fixes a bug, why was that bug possible?
- If this adds an abstraction, what concrete invariant or repeated domain
  concept justifies it?
- If this affects performance, what measurement will show success?
- If this subdomain may become reusable, is the boundary extractable without
  prematurely packaging it?

If the answer is unclear, write the design down before editing code.
