# Platformization Audit

This audit captures what must change to turn this repository from a single
The Philosopher's Meme site into a reusable Astro blog platform that can be
shared publicly while site-specific content, assets, and configuration live in a
private or separate site instance.

This audit is a planning baseline. The in-repo `site/` migration is complete:
publication content, assets, public files, and unused assets now live under
`site/`. Remaining platformization work should compare against the current
`site/` directory and the full external fixture build proof, not the older
pre-migration source-root coupling described in historical sections below.

## Recommendation

Use a **public blog platform repo** plus a **separate site instance repo** in a
single local workspace.

```text
tpm-workspace/
  blog-platform/       # public reusable Astro engine
  tpm-site/            # private or site-specific instance
```

The platform should consume the site instance through an explicit
`SITE_INSTANCE_ROOT` setting:

```sh
SITE_INSTANCE_ROOT=../tpm-site just build
```

This is cleaner than making the public platform repo contain a private submodule.
The public platform should not know about one private site. A private deployment
repo may later checkout or depend on the public platform and the private content
repo, but the engine itself should only know the abstract instance contract.

## Target Shape

The platform should own reusable engine code:

```text
blog-platform/
  astro.config.ts
  src/
    components/
    layouts/
    lib/
    pages/
    remark-plugins/
    rehype-plugins/
    scripts/
    styles/
  tests/
```

The site instance should own publication-specific data:

```text
tpm-site/
  site.config.jsonc
  theme.config.jsonc
  navigation.config.jsonc
  redirects.json
  content/
    articles/
    authors/
    categories/
    pages/
  assets/
    articles/
    shared/
    site/
  public/
    CNAME
    favicon.svg
    robots.txt
```

The exact file names can change, but the boundary should stay clear:

- engine code can import engine modules;
- engine code reads site data through a typed adapter;
- site instance files should be mostly JSON-serializable and editor-friendly;
- site instance content should not require modifying platform source files.

## Core Principle

Do not make everything configurable by passing random options into components.
Instead:

1. Define a small validated site-instance model.
2. Normalize that model in one adapter layer.
3. Let pages and components consume normalized data.
4. Keep components general by making them depend on explicit props, not global
   hard-coded site text.

This keeps a future UI/admin app feasible. A UI can edit JSON-like config and
content, run validation, and preview the generated site without understanding
Astro internals.

The active platform module map is now maintained in
`docs/platform/PLATFORM_MODULES.md`. That document is the source of truth for reusable
domain ownership, site-instance import boundaries, and the current
`platform-check` CI invariant.

The active configurability audit is maintained in
`docs/audits/PLATFORM_CONFIGURABILITY_AUDIT.md`. It classifies hard-coded values by
whether they should become site config, component props, platform defaults,
content/frontmatter, or deferred customization.

The active public-platform cleanup plan is maintained in
`docs/platform/PUBLIC_PLATFORM_CLEANUP.md`. It keeps platform-owned QA fixtures, catalog
assets, and example-site identity separate from the live TPM instance.

## Proposed Config Model

Start with TypeScript schemas in the platform and JSON-like config in the site
instance. Avoid arbitrary functions in site config because the future admin UI
will need to read and write the same data.

Recommended top-level config:

```ts
interface BlogSiteConfig {
  identity: SiteIdentity;
  routes: RouteConfig;
  features: FeatureConfig;
  navigation: NavigationConfig;
  support?: SupportConfig;
  search: SearchConfig;
  seo: SeoConfig;
}
```

Recommended supporting data:

```ts
interface SiteIdentity {
  title: string;
  shortTitle?: string;
  description: string;
  url: string;
  language: string;
  timezone?: string;
}

interface RouteConfig {
  home: string;
  articles: string;
  allArticles: string;
  authors: string;
  categories: string;
  tags: string;
  search: string;
  feed: string;
}

interface FeatureConfig {
  authors: boolean;
  bibliography: boolean;
  categories: boolean;
  rss: boolean;
  search: boolean;
  support: boolean;
  tags: boolean;
  themeToggle: boolean;
}

interface SupportConfig {
  href: string;
  label: string;
  compactLabel?: string;
  footerLabel?: string;
  homeLabel?: string;
}
```

Theme should be a separate config or CSS contract:

```ts
interface ThemeConfig {
  defaultMode: "light" | "dark" | "system";
  fonts: {
    sans: string;
    serif: string;
    mono: string;
  };
  radius: string;
  light: SemanticColorTokens;
  dark: SemanticColorTokens;
}
```

The platform can eventually generate CSS variables from `theme.config.jsonc`.
Until then, a site instance could provide a `theme.css` file that only defines
the semantic CSS variables the engine already uses.

## Current Coupling Audit

| Area                 | Current coupling                                                                                                                    | Platform change needed                                                                                                  | Risk   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| Site identity        | Identity values are config-backed, but some tests/docs still use TPM fixture copy.                                                  | Keep reusable engine tests fixture-driven and move TPM copy assertions toward instance tests over time.                 | Low    |
| Astro `site`         | `astro.config.ts` reads the configured site URL.                                                                                    | Keep Astro config input validated through the site adapter.                                                             | Low    |
| Content roots        | `src/content.config.ts` now reads resolver-backed site content roots.                                                               | Keep the external fixture build proof passing whenever routes, content schemas, or build tooling change.                | High   |
| Category derivation  | `categorySlug()` now derives from the configured article root and keeps legacy synthetic-path fallbacks for tests.                  | Remove legacy synthetic-path fallbacks after tests no longer need them.                                                 | Medium |
| Markdown images      | Articles use relative paths such as `../../../assets/articles/...`.                                                                 | Define an instance asset convention and prove Astro's Markdown image pipeline handles external instance assets.         | High   |
| MDX imports          | Site MDX files import site images through `@site/assets` and platform components through `@/components`.                            | Keep MDX as an advanced escape hatch and document production external-instance limits.                                  | High   |
| Site assets          | Home hero, announcement, default preview, favicon, CNAME, robots, and shared assets live under `site/assets` and `site/public`.     | Continue routing new site-owned assets through the site instance instead of platform modules.                           | High   |
| Theme                | `src/styles/global.css` defines the semantic token API and base fallbacks; each site instance provides concrete `theme.css` values. | Keep new visual identity changes in site-owned theme/assets/content rather than platform CSS.                           | Low    |
| Navigation           | Primary/footer links are config-backed, but optional feature visibility is still only partly encoded.                               | Add feature flags and use them in high-value UI seams before attempting route pruning.                                  | Medium |
| Support CTA          | Support copy and links are config-backed, but support is still assumed present in several UI seams.                                 | Add feature flags and make reusable support surfaces render gracefully when disabled.                                   | Medium |
| Content defaults     | Draft, visibility, and PDF defaults are currently schema/code defaults rather than webmaster-owned site defaults.                   | Add `contentDefaults` so authors only use frontmatter for exceptional entries.                                          | High   |
| Home page            | Homepage collection IDs, limits, and hero assets are config/content-backed.                                                         | Keep the homepage as a small typed recipe; do not introduce a page builder until the config/admin model is ready.       | Medium |
| Static pages         | `/about/` is assumed by nav, routes, tests, and content lookup.                                                                     | Treat pages as site instance content. Navigation should refer to page slugs from config.                                | Low    |
| Routes               | Helpers assume `/articles/`, `/authors/`, `/categories/`, `/tags/`, `/search/`, and `/feed.xml`.                                    | Keep defaults but centralize route config. Make pagefind, validation, and build verification read the same route model. | Medium |
| Legacy redirects     | TPM redirects are site-owned compatibility data.                                                                                    | Keep redirects in instance config, validate them, and pass them into Astro config.                                      | Low    |
| Search/Pagefind      | Rust build tasks derive Pagefind globs from current route config.                                                                   | Keep Pagefind globs generated from feature and route config.                                                            | Medium |
| Build verification   | `just verify` checks required output paths and core generated HTML invariants.                                                      | Deepen Rust verifier modules so they accept site instance paths and generated route expectations from config.           | Medium |
| Content verification | `just content-check` reads active site-instance content roots.                                                                      | Keep source checks behind the site instance adapter and feature requirements.                                           | Medium |
| Asset tooling        | Asset tasks now default to resolver-backed `site/assets`, `site/public`, and `site/unused-assets`.                                  | Keep asset tasks resolver-backed and avoid adding new hard-coded site roots.                                            | Medium |
| Command surface      | `just` owns commands; package scripts are retired.                                                                                  | Keep commands stable and move path knowledge into Rust tasks/config files.                                              | Medium |
| CI/deploy            | GitHub Actions checkout one repo and deploy `dist`.                                                                                 | Future private deployment workflow must checkout platform and instance repos, set `SITE_INSTANCE_ROOT`, then build.     | Medium |
| Tests                | Many tests assert TPM copy, URLs, category names, and exact nav labels.                                                             | Split engine tests from instance tests. Engine tests should use fixtures; TPM tests can live in the site instance.      | High   |
| Component catalog    | Catalog examples include TPM assets/copy and site-specific support links.                                                           | Use engine fixture data by default; allow site instance examples as optional catalog input.                             | Medium |
| Docs                 | Docs mix engine principles with TPM-specific design decisions.                                                                      | Split public platform docs from TPM instance docs. Keep agent instructions generic plus instance overlay.               | Medium |
| Authoring docs       | `AUTHOR_TUTORIAL.md` points authors at current `site/content` and `site/assets` folders.                                            | Eventually move author docs into the site instance or make them parameterized around configured paths.                  | Low    |

## Components That Need Generalization

These components are structurally reusable but still carry site-specific
defaults or assumptions:

- `BrandLink`: default label should come from site identity.
- `SupportLink`: should use support config and render nothing when disabled by
  feature config.
- `SiteHeader`: should consume configured navigation groups and feature flags.
- `SiteFooter`: should consume configured footer groups, publication description,
  support, RSS, tag/category/author links, and feature flags.
- `SiteShell`: should load navigation data through a site adapter rather than
  assuming categories are always present.
- `HomeHeroBlock`: should not hard-code TPM title or Patreon/Discord actions,
  and should degrade cleanly when support/social features are disabled.
- `HomeArchiveLinksBlock`: should not assume article/category/RSS link copy.
- `SupportBlock`: should be optional and fully config-backed.
- `SearchResultsBlock`: should use site identity in copy from config.
- `ArticleEndcap`: should use configurable support and related-content labels.
- `ArticleLayout`: should build page title suffixes from site identity.
- `SiteHead` and `ArticleJsonLd`: should use site identity, publisher metadata,
  language, and route config.

Low-level UI primitives are already largely platform-ready:

- `Button`
- `LinkButton`
- `TextLink`
- `Badge`
- `Container`
- `Section`
- `ArticleList`
- `TermOverviewBlock`
- anchored positioning/disclosure primitives

## Tooling That Needs Generalization

The tooling should move from hard-coded paths to a shared site-instance resolver.
That resolver should expose:

```ts
interface SiteInstancePaths {
  root: string;
  content: {
    articles: string;
    authors: string;
    categories: string;
    pages: string;
  };
  assets: {
    root: string;
    articles: string;
    shared: string;
    site: string;
  };
  public: string;
  redirects: string;
}
```

Commands that should consume this resolver:

- `just content-check`
- `just tags-check`
- `just tags-normalize`
- `just assets-locations`
- `just assets-shared`
- `just assets-unused`
- `just assets-duplicates`
- `just verify`
- `just payload-check`
- test accountability and coverage tasks if they need to distinguish engine
  files from instance files.

Package scripts should remain simple, but the scripts they call should own path
logic internally.

## Public/Private Split Strategy

Recommended split:

```text
tpm-workspace/
  blog-platform/      # public repository
  tpm-site/           # private repository or site-specific public repo
```

Development flow:

```sh
cd blog-platform
SITE_INSTANCE_ROOT=../tpm-site just dev
SITE_INSTANCE_ROOT=../tpm-site just release-check
```

Deployment flow:

1. Checkout the platform repo.
2. Checkout the site instance repo beside it.
3. Install platform dependencies.
4. Set `SITE_INSTANCE_ROOT`.
5. Run build, verification, browser tests, accessibility, and deploy `dist`.

This avoids submodule pointer churn and keeps both repos independently
manageable. If submodules are later required, prefer a private deployment repo
that points to public platform and private content submodules. Avoid making the
public platform repo point to a private content submodule.

## Admin UI Implications

The future admin UI should be able to edit the same inputs the platform already
validates. That means:

- site config should be JSON-like data, not arbitrary executable TypeScript;
- schemas should be exported as JSON Schema where practical;
- validation errors should be author-facing, precise, and path-aware;
- config should avoid boolean clusters where a discriminated shape is clearer;
- assets should follow predictable folders and manifest metadata;
- routes, enabled features, and navigation should be validated before build;
- content operations should support dry runs and explicit repair commands.

Useful future commands:

```sh
just site-doctor
just author-check
just author-fix
just dev
```

`just site-doctor` should explain what is wrong in non-technical language. The admin
UI can call the same validation layer.

## Migration Sequence

Do the migration in small passes. The first passes should change where values
come from, not where files live. Moving content and assets should happen only
after the config and path adapter are already tested.

### Phase 1: Config Boundary Without Moving Files

Create the site-instance adapter while the instance still lives in the current
repo.

- Add a validated `site.config` model with TPM values.
- Replace `SITE_TITLE`, `SITE_DESCRIPTION`, default support links, hard-coded
  publisher metadata, and page title suffixes with config-backed accessors.
- Move nav labels and footer structure into config.
- Add tests proving components work with a non-TPM fixture site.

This gives immediate configurability without touching content paths.

Acceptance gates:

- the current TPM site renders identically except for intentional test fixture
  updates;
- at least one non-TPM fixture config renders through `BaseLayout`,
  `SiteHeader`, `SiteFooter`, `SiteHead`, and major article/list components;
- no component imports hard-coded TPM identity or support defaults directly.

### Phase 2: Instance Path Resolver

Add `SITE_INSTANCE_ROOT` support but keep the default pointing at the current
repo layout.

- Add a central resolver for content, asset, public, and redirect paths.
- Make content verification, tag normalization, asset checks, build
  verification, Pagefind globs, and HTML validation consume the resolver.
- Add tests that run the resolver against a fixture site outside `src/`.

This is the proof step for the public/private split.

Acceptance gates:

- all content, build, asset, and route verification scripts can run against a
  fixture instance root outside `src/`;
- `just` command recipes remain stable;
- error messages report instance-relative paths that a non-technical editor can
  find.

### Phase 3: In-Repo Site Folder

Move site-specific files into an explicit in-repo instance folder:

```text
site/
  content/
  assets/
  public/
  redirects.json
  site.config.jsonc
  theme.config.jsonc
  navigation.config.jsonc
```

Use `git mv` for content and assets. Update Markdown image paths only through a
programmatic migration script with verification.

Acceptance gates:

- all Markdown and MDX image references continue to resolve;
- generated route URLs do not change;
- legacy redirects still work;
- article/category/tag/author counts match the pre-move build.

### Phase 4: External Site Instance Proof

Copy or move `site/` to a sibling repo and run:

```sh
SITE_INSTANCE_ROOT=../tpm-site just release-check
```

Blockers to resolve here:

- Astro content collection loaders must read the external content root.
- Markdown image handling must process external instance assets.
- MDX imports must have a documented alias or remain an explicit advanced path.
- Dev server file access must allow the sibling instance root.
- CI must checkout both repos.

Acceptance gates:

- a clean clone of the platform can build a sibling fixture instance;
- dev, build, check, release preview, Pagefind, and browser tests all use the
  same `SITE_INSTANCE_ROOT`;
- the platform repo contains no TPM content files after the split, except
  explicitly generic fixture data.

### Phase 5: Public Engine Cleanup

Remove TPM-specific assumptions from the public platform:

- replace engine tests with fixture-site tests;
- move TPM-specific docs to the site instance;
- keep generic platform docs in the engine repo;
- make catalog examples fixture-backed;
- keep site-specific Lighthouse URLs in the instance.

### Phase 6: Admin UI Preparation

Once the instance contract is stable:

- generate JSON Schema from config/content schemas;
- add `site-doctor` and repair commands;
- define asset upload/manifests;
- define safe editing operations for pages, articles, authors, categories,
  tags, redirects, theme, and navigation.

## Implementation Milestones

Recommended next milestones:

1. Design the `BlogSiteConfig`, `ThemeConfig`, `NavigationConfig`, and
   `SiteInstancePaths` schemas.
2. Implement a config adapter with current TPM defaults and fixture-site tests.
3. Replace hard-coded identity, support, navigation, and SEO values with config.
4. Implement the instance path resolver and convert scripts to use it.
5. Prove an external fixture site can build from outside the platform root.
6. Move current TPM content/assets into an in-repo `site/` folder.
7. Split engine tests from TPM instance tests.
8. Add multi-repo CI/deploy documentation and workflow support.

## Recommended Decisions

These were the main open questions during the audit. Treat these answers as the
recommended decisions unless later implementation work disproves them.

### Route Segment Configurability

Recommendation: keep route segment names fixed in the first migration.

The first platformization pass should keep `/articles/`, `/authors/`,
`/categories/`, `/tags/`, `/search/`, and `/feed.xml` as platform conventions.
Centralize them in config-like route helpers now, but do not make arbitrary
route renaming part of the first split. External content roots and asset
handling are already the high-risk work.

Reopen route renaming after the instance boundary is stable.

### Theme Delivery

Recommendation: support a site-provided semantic-token CSS file first, then add
JSON-generated theme tokens later.

The engine already uses semantic CSS variables. The smallest maintainable split
is:

```text
engine global.css   # Tailwind import, base styles, engine utility contracts
site theme.css      # --background, --foreground, --primary, fonts, radius, etc.
```

The future admin UI can generate `theme.css` from `theme.config.jsonc`. Do not
block platformization on a complete theme editor.

Implemented note: `src/layouts/BaseLayout.astro` imports platform base styles,
then `@site/theme.css`, then platform print styles. This ordering keeps normal
site branding instance-owned while letting PDF/print output enforce its
platform academic styling.

### Home Page Composition

Recommendation: avoid a page builder in the first migration.

The home page should become configurable through a small typed block recipe, not
arbitrary drag-and-drop composition. Start with known blocks:

- hero;
- announcement/content;
- latest article;
- featured articles;
- categories/tags overview;
- archive links;
- support CTA.

Each block should have a discriminated config shape. Unknown blocks should fail
validation rather than render vaguely.

### MDX

Recommendation: keep MDX supported as an advanced authoring escape hatch, not
the default future admin UI path.

Markdown plus normal images should be the non-technical author path. MDX can
remain available for exceptional articles, but site-instance docs should make it
clear that MDX may require developer review because imports couple content to
engine component and asset APIs.

### Runtime Shape

Recommendation: keep the platform repo as the runnable Astro project for the
first split.

The near-term command should stay:

```sh
cd blog-platform
SITE_INSTANCE_ROOT=../tpm-site just build
```

A later package-style architecture, where a thin site repo imports the platform
as a package, can be reconsidered after the instance boundary and admin tooling
exist. The runnable-platform model has fewer moving parts for the first public
private split.

## Non-Goals For The First Migration

- Do not build a CMS or admin UI yet.
- Do not make every page layout arbitrary.
- Do not support arbitrary route renaming until fixed-route extraction works.
- Do not move production content outside the repo before external fixture builds
  pass.
- Do not require authors to use MDX or code imports for ordinary articles.
- Do not make the public platform repo aware of TPM private content paths.

## Readiness Assessment

The current architecture is a good candidate for platformization because pages
are already thin, domain helpers live in `src/lib`, and components are mostly
declarative. The main work is not rewriting UI. The main work is extracting the
site-instance boundary and making tooling read from the same source of truth.

The riskiest work is externalizing content and assets because Astro content
collections, Markdown image handling, MDX imports, and Vite dev server file
access all touch filesystem boundaries. Treat that as a proof milestone before
moving production content.

The safest next step is Phase 1: introduce validated config while files stay in
place. That creates immediate flexibility and makes later repo splitting much
less invasive.

## Next Design Pass

`docs/platform/PLATFORM_SITE_BOUNDARY.md` is the implementation-ready follow-up for the
in-repo refactor. It updates this audit around the newer publishable-entry,
homepage, collection, PDF, social-preview, and share-menu systems, and defines
the first root-level `site/` config surface before content and asset roots move.
