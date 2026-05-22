# Route View Models

This document defines the route view-model contract for Milestone 2. The goal
is to keep Astro route files thin while moving sorting, filtering, feature
policy, metadata inputs, empty states, and component prop shaping into typed
helpers.

## Goal

Routes should answer only document-level questions:

- Which static paths exist?
- Which source data does this route need?
- Which layout or block composes the page?
- Which metadata kind and canonical path does the document use?

Everything else should live in pure route view-model helpers or narrow loader
adapters. A route file should not reimplement list sorting, publishable
visibility, feature checks, breadcrumbs, JSON-LD item lists, or component prop
assembly.

## Current Route Inventory

| Route file                                 | Family              | Main source inputs                                                                   | Current responsibility to move                                                     |
| ------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `src/pages/index.astro`                    | home                | site config, page content, articles, announcements, collections, categories, authors | homepage block props, discovery links, curation fallback policy                    |
| `src/pages/articles/index.astro`           | article index       | categories, article archive items, site config                                       | category rail props, discovery links, latest items                                 |
| `src/pages/articles/all.astro`             | article archive     | article archive items, authors, categories                                           | chronological archive list props and metadata facts                                |
| `src/pages/articles/[...slug].astro`       | article detail      | article entry, compiler artifact, categories, authors, references, media             | mostly migrated to `articlePageViewModel`; keep as reference pattern               |
| `src/pages/announcements/index.astro`      | announcement index  | announcements                                                                        | chronological announcement list props and empty state                              |
| `src/pages/announcements/[...slug].astro`  | announcement detail | announcement entry, config                                                           | metadata, search flags, layout props, support/navigation props                     |
| `src/pages/categories/index.astro`         | taxonomy index      | category summaries                                                                   | section navigation props and metadata                                              |
| `src/pages/categories/[category].astro`    | taxonomy detail     | category summary, article archive items, authors                                     | article list props, breadcrumbs, JSON-LD items                                     |
| `src/pages/tags/index.astro`               | taxonomy index      | tag summaries                                                                        | tag navigation props and metadata                                                  |
| `src/pages/tags/[tag].astro`               | taxonomy detail     | tag summary, article archive items, authors                                          | article list props, breadcrumbs, JSON-LD items                                     |
| `src/pages/authors/index.astro`            | author index        | author profiles                                                                      | author card props and metadata                                                     |
| `src/pages/authors/[author].astro`         | author detail       | author profile, article archive items                                                | profile props, article list props, breadcrumbs, metadata                           |
| `src/pages/collections/index.astro`        | collection index    | editorial collections                                                                | collection card props, counts, metadata                                            |
| `src/pages/collections/[collection].astro` | collection detail   | collection entry, publishables, articles, announcements, authors                     | resolved collection items, breadcrumbs, JSON-LD items                              |
| `src/pages/bibliography.astro`             | bibliography        | article references, articles                                                         | bibliography groups, metadata, empty state                                         |
| `src/pages/about.astro`                    | Markdown page       | page entry                                                                           | page title/description/canonical layout props                                      |
| `src/pages/search.astro`                   | utility page        | site config                                                                          | search page metadata and mount props                                               |
| `src/pages/404.astro`                      | utility page        | site config                                                                          | not-found copy and navigation props                                                |
| `src/pages/feed.xml.ts`                    | generated endpoint  | articles, announcements, authors, config                                             | mostly migrated to feed helpers; keep endpoint thin                                |
| `src/pages/catalog/[...path].astro`        | private catalog     | catalog registry                                                                     | keep separate from public route model unless catalog routes need shared primitives |

## Contract Layers

Route view models should be layered so each layer has a clear owner.

### Loader Adapter

The loader adapter is the only impure layer. It may call content collection
loaders, read site config, call Astro image helpers, or receive `Astro.site`.

Naming pattern:

```text
load<RouteName>RouteInput()
```

Loader output should be small and typed. It should pass raw source entries to
the pure builder without doing display shaping.

### Pure Builder

The pure builder transforms typed source data into a route model.

Naming pattern:

```text
<routeName>RouteViewModel(input)
```

The builder owns:

- publishable filtering for the route surface;
- explicit sorting;
- empty-state decisions;
- feature-flag decisions;
- breadcrumbs;
- JSON-LD item-list inputs;
- page title, description, canonical path, and route kind;
- props for blocks/components.

The builder must not read the filesystem, import live content loaders, inspect
process state, or call browser APIs.

### Route File

The route file should:

- define `getStaticPaths()` when needed;
- await loader data when needed;
- call the route view-model builder;
- pass typed props into layouts/blocks;
- avoid inline shaping beyond trivial destructuring.

## Base Route Model

Most public routes should return a common document shell:

```ts
interface RouteDocumentViewModel {
  canonicalPath: string;
  description: string;
  jsonLd?: unknown[];
  kind: MetadataRouteKind;
  title: string;
}
```

Specific routes extend the document shell with route-owned block props:

```ts
interface CollectionDetailRouteViewModel extends RouteDocumentViewModel {
  breadcrumbs: BreadcrumbItem[];
  collection: CollectionHeaderViewModel;
  items: PublishableListItem[];
}
```

Route-specific models should reuse shared shapes from `publishable`, `routes`,
`metadata`, `navigation`, `support`, `bibliography`, and media helpers instead
of inventing parallel object shapes.

## Visibility And Feature Policy

Route builders must use shared surface vocabulary:

- directory routes use `directory`;
- collection routes use `collections`;
- homepage routes use `homepage`;
- related blocks use `related`;
- feeds use `feed`;
- search/Pagefind use `search`;
- sitemaps and public discovery use `sitemap`;
- PDF links use `pdf`;
- future export/API manifests use `external`.

Feature flags should be checked in the builder, not in component templates,
unless the component is specifically a reusable feature-aware primitive.

## Metadata Inputs

Every public route view model should explicitly provide:

- title;
- description;
- canonical path;
- metadata route kind;
- optional breadcrumbs;
- optional item-list data;
- optional route-specific robots/discovery policy.

The metadata engine remains the owner of head tags, JSON-LD serialization,
Open Graph, Twitter, Scholar, and robots policy. Route builders only supply
truthful source facts.

## Testing Strategy

Route view-model tests should prefer pure helper coverage over rendered HTML
assertions. Rendered route tests still matter, but they should verify that the
route consumes the model and mounts the expected components.

Focused tests should cover:

- sorting;
- publishable visibility;
- feature flags;
- empty states;
- breadcrumb data;
- metadata inputs;
- component props;
- static-path param coverage;
- hidden/draft leakage prevention.

Use small fixtures from `tests/helpers`. Do not add test-only exports from
production modules just to inspect internals.

## Migration Sequence

1. Add shared route-view-model types and simple fixture helpers.
2. Migrate index/listing routes: articles, archive, categories, tags, authors,
   announcements, and collections.
3. Migrate complex routes: article detail, announcement detail, bibliography,
   homepage, Markdown pages, search, and 404.
4. Add route-model snapshots or fixtures that lock public behavior without
   testing incidental markup.
5. Keep `src/pages/feed.xml.ts` endpoint-thin by continuing to use feed
   helpers.

The article detail route already has `articlePageViewModel`; it should guide
the rest of the migration, but it can still be tightened later as metadata,
media, and citation models mature.

## Completion Criteria

The route view-model migration is complete when:

- public route files are orchestration-only;
- route builders are pure except for deliberate loader adapters;
- list and taxonomy routes use publishable visibility helpers;
- metadata facts are explicit and route-owned;
- page tests and pure view-model tests cover route behavior;
- no page owns duplicated sorting/filtering/component shaping logic that
  belongs in `src/lib`.

## Implemented Helpers

Current route view-model helpers live in:

- `src/lib/content/listing-route-view-models.ts` for listing, taxonomy, author,
  announcement, collection, and search route families;
- `src/lib/content/content-route-view-models.ts` for Markdown-backed pages and
  the global bibliography route;
- `src/lib/content/article-page-view-model.ts` for article detail routes;
- `src/lib/content/home.ts` for homepage curation and homepage route
  composition.

Route model tests should cover public route facts and component props without
snapshotting incidental HTML. Rendered Astro route tests remain the consumer
proof that route files pass the model into the expected layouts and blocks.
