# Publishable Entry Model

This document defines the target publishable-entry contract for Milestone 2.
It turns article-like content into a stable platform model for route view
models, lists, feeds, search, collections, related content, metadata, media,
PDFs, and generated-output verifiers.

## Goal

The platform should have one canonical way to say:

- this source can be published;
- this is its canonical route;
- this is how it appears in dense or rich lists;
- this is where it is allowed to appear;
- this is the media that represents it;
- this is the taxonomy, author, date, and ordering data consumers may use.

Routes and components should not re-derive those facts from raw content
entries. They should consume normalized publishable entries or narrower view
models derived from them.

## Current Sources

The first implementation must support:

- articles from `site/content/articles/`;
- announcements from `site/content/announcements/`.

The model must also leave explicit extension points for future source kinds:

- standalone pages;
- reviews;
- events;
- books;
- media posts;
- podcast or video entries;
- datasets;
- software/project notes;
- future extension-owned publishable kinds.

Folder location still derives the current internal kind for articles and
announcements. Authors should not need to set `kind` in frontmatter for those
sources.

## Layered Contract

A publishable entry is layered so each consumer can take the smallest useful
slice instead of depending on a large raw object.

### Source Facts

Source facts identify the original content item.

- `kind`: internal content kind, such as `article` or `announcement`.
- `slug`: stable public slug used for lookup and collection references.
- `sourceId`: content collection entry ID.
- `sourceCollection`: collection name or future extension source.
- `draft`: whether the source is unpublished.

Source facts are owned by content loading and schemas.

### Route Facts

Route facts identify public URLs and generated outputs.

- `href`: canonical public path.
- `canonicalPath`: canonical path used for absolute URLs.
- `outputPath`: expected HTML output path when useful to verifiers.
- `legacyPaths`: optional historical paths that redirect here.

Route facts are owned by route helpers and the route registry. Publishable code
may carry these facts, but it should not invent route policy.

### Display Facts

Display facts are safe to hand to list, card, feed, and route view-model
consumers.

- `title`;
- `description`;
- `date`;
- `updated`;
- `author`;
- `authors`;
- `category`;
- `tags`;
- `image`.

Display facts are normalized for UI and generated-output use. Raw frontmatter
should not leak into blocks.

### Visibility Facts

Visibility facts decide where a published entry can appear.

Default visibility is permissive. Authors and site config can opt out of
surfaces.

The target public surfaces are:

- `directory`: article/announcement directories and taxonomy pages;
- `homepage`: homepage panels and homepage curation;
- `collections`: curated collection pages;
- `feed`: RSS and future syndication feeds;
- `search`: generated search data and search results;
- `sitemap`: sitemap discovery;
- `related`: next/more/related-content blocks;
- `pdf`: generated PDF links and PDF-related discovery;
- `external`: future API, MCP, studio, or export manifests.

Not every source kind needs to participate in every surface, but every surface
decision should use this shared vocabulary.

### Taxonomy And Ordering Facts

Taxonomy facts let route view models group and sort consistently.

- `category`;
- `tags`;
- `collections`;
- `publishedAt`;
- `updatedAt`;
- optional collection-specific order/note from collection membership.

Collection-specific order does not belong on the source entry itself. It belongs
to the resolved collection item that pairs a publishable entry with collection
metadata.

### Media Facts

Media facts describe the representative media for the entry.

- source image, when present;
- alt text;
- caption or credit, when available;
- fallback eligibility;
- role hints for list thumbnails, social images, search, feeds, and PDFs.

The publishable model carries media facts. The media policy engine decides
formats, optimization, dimensions, fallbacks, and output budgets.

### Metadata Facts

Metadata facts give the metadata graph enough entry-level information without
turning publishable entries into the metadata engine.

- canonical route;
- title;
- description;
- publish/update dates;
- authors;
- image facts;
- visibility/discovery policy;
- semantic profile reference, when present.

The metadata engine owns JSON-LD, Open Graph, Twitter, Scholar, robots, and
future machine-readable output.

## Ownership Boundaries

Publishable entries own normalization of article-like source data into
cross-surface facts.

Publishable entries do not own:

- route pattern policy;
- generated output file naming;
- HTML metadata rendering;
- media optimization policy;
- citation parsing or bibliography identity;
- component layout;
- verifier formatting.

Those domains may consume publishable entries, but they remain separate engines.

## Consumer Shapes

The full entry should be rare at UI boundaries. Prefer narrower derived shapes:

- compact list item;
- rich card item;
- feed item;
- search record input;
- metadata entry input;
- related-entry item;
- collection item;
- verifier target.

Each derived shape should be produced by a typed helper so components remain
view-focused.

## Diagnostics

Publishable diagnostics should use the shared output/content diagnostic
vocabulary where possible.

Useful diagnostic cases include:

- duplicate publishable slugs;
- unknown collection references;
- invalid visibility surface;
- hidden entry referenced by a surface that requires visibility;
- missing required display text;
- missing or empty image alt text when an image is present;
- source kind unsupported by a consumer;
- draft entry leaking into generated output.

Diagnostics should include the source path or collection reference when
available.

## Test Invariants

Focused tests should prove:

- omitted visibility defaults to enabled surfaces;
- site defaults are respected;
- explicit frontmatter overrides win over defaults;
- duplicate slugs fail deterministically;
- articles and announcements normalize to the same publishable shape;
- list, feed, collection, and search helpers consume the shared model;
- hidden entries do not leak to disallowed surfaces;
- future unknown kinds are rejected or handled through explicit extension
  seams;
- route, metadata, media, and verifier code do not duplicate visibility logic.

## Fixture Expectations

Tests should prefer shared publishable fixtures over hand-shaped route objects
when a test is about article-like publication behavior. Representative fixtures
should cover:

- normal article entries;
- normal announcement entries;
- fully hidden entries;
- collection-only entries;
- image-bearing entries with non-empty alt text;
- entries without images, so fallback policy is explicit in the consumer;
- unsupported future-kind expectations, which must stay explicit until a source
  kind is intentionally added.

Fixtures live in test helpers and should build through the same publishable
conversion helpers as production code. They should not duplicate publishable
normalization in test-only objects unless the test is specifically exercising a
malformed boundary.

## Author Interface

Authors should usually need no visibility settings. A missing `visibility`
field means the entry participates in the default surfaces for its source kind.
When an author needs an exception, they can set only the surface booleans they
want to override:

```yaml
visibility:
  homepage: false
  directory: false
  search: false
```

The complete surface vocabulary is:

- `directory`;
- `homepage`;
- `collections`;
- `feed`;
- `search`;
- `sitemap`;
- `related`;
- `pdf`;
- `external`.

The platform may ignore a surface for a source kind that cannot participate in
that output. For example, announcement sources do not currently generate PDFs,
but the shared vocabulary still keeps defaults and diagnostics consistent.

## Implementation Sequence

1. Expand the type contract in `src/lib/content/publishable.ts`.
2. Expand the content/schema visibility vocabulary.
3. Update article and announcement conversion helpers.
4. Migrate consumers to derived publishable shapes.
5. Add fixtures and docs that explain author-facing visibility behavior.
6. Run focused tests before broader route, metadata, media, and verifier work.
