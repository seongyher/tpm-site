# Homepage Content Model

## Purpose

The homepage should be easy for writers to manage and easy for developers to
extend. The visual layout is already close to the desired front page: Hero,
Featured, Start Here, Announcements, Categories, Read, and Recent. The weak
point is the content model. It still spreads homepage curation across page
frontmatter, homepage-specific feature files, and announcement-specific list
helpers.

This design replaces that with a small content model:

```text
Articles and announcements are publishable entries.
Collections are ordered editorial lists of publishable entries.
The homepage consumes resolved publishable entries and collections.
Categories and tags remain taxonomy, not collections.
```

The goal is author simplicity, not abstraction for its own sake.

## Requirements

- Writers should not add a `kind` field to articles or announcements.
- Articles and announcements should share the same author-facing frontmatter
  wherever possible.
- The folder/collection location determines runtime kind:
  `articles` becomes `article`; `announcements` becomes `announcement`.
- Collections should be easy to edit by hand and should own manual order.
- Collection items should be bare publishable slugs by default, with an
  optional note when editorial context is useful.
- Collections should also be public browsing surfaces: `/collections/` lists
  available collections and `/collections/[collection]/` renders one ordered
  collection.
- Visibility follows site-owned content-type defaults; writers only set
  visibility fields when an entry is exceptional.
- Homepage lists should render any normalized publishable entries without
  knowing whether they came from latest announcements, a collection, a category,
  a tag, an author page, or a future related-content helper.
- Build-time failures should catch missing collection slugs, duplicate
  collection entries, and duplicate global publishable slugs.
- The homepage visual design should remain flat, concise, static-first, and
  responsive.

## Non-Goals

- Do not turn categories into collections.
- Do not add a full CMS-style homepage block array.
- Do not create a universal taxonomy/collection abstraction that hides the
  difference between automatic taxonomy and explicit curation.
- Do not require authors to understand URL slug collisions beyond clear
  build-time errors.
- Do not add React, hydrated islands, or runtime fetching for homepage content.

## Publishable Entries

Articles and announcements use one shared base schema:

```yaml
title: What Is A Meme?
description: A concise article summary.
author: Claudia Vulliamy
date: 2021-11-30
image: ../../assets/shared/example.png
imageAlt: Optional useful image alt text.
tags:
  - metamemetics
draft: false
visibility:
  homepage: true
  directory: true
  feed: true
  search: true
```

The `draft` and `visibility` fields are optional. Missing values inherit
`site/config/site.json` `contentDefaults` for the entry's collection. The
current TPM defaults preserve the original behavior: articles and announcements
are visible on every public surface unless frontmatter opts out.

The internal normalized model derives kind from the content collection:

```ts
type PublishableKind = "article" | "announcement";

interface PublishableEntry {
  kind: PublishableKind;
  slug: string;
  href: string;
  title: string;
  description: string;
  author: string;
  date: string;
  visibility: PublishableVisibility;
  category?: CategorySummary;
  image?: PublishableImage;
  source: ArticleEntry | AnnouncementEntry;
}
```

Runtime code may branch on `kind` for URLs, category metadata, and future
announcement-specific behavior. Writers do not repeat that state in
frontmatter.

## Visibility Semantics

Visibility defaults are intentionally permissive:

```ts
{
  homepage: true,
  directory: true,
  feed: true,
  search: true,
}
```

Surface meaning:

- `homepage`: automatic homepage surfaces and homepage collections.
- `directory`: automatic browsing directories such as article archive,
  categories, tags, authors, announcement index, and collection detail lists.
- `feed`: RSS/feed output.
- `search`: Pagefind/search indexing.

Drafts still override all visibility. A draft is unpublished and should not
appear in public static paths or public lists.

Visibility does not automatically remove a publishable detail route. A published
announcement or article may still have a direct URL while opting out of every
automatic surface. This supports off-site sharing and historical records without
forcing entries into homepage slots, directories, feeds, or search.

The first implementation must enforce homepage visibility for homepage
collections and automatic homepage announcements. It must also enforce
directory visibility on announcement indexes and collection detail lists because
those surfaces consume the shared publishable model. Feed/search/directory
visibility should continue to be applied wherever a surface already consumes
publishable helpers. If a later surface still uses legacy article helpers, that
is a documented migration target rather than a new frontmatter contract.

## Collections

Collections live in:

```text
site/content/collections/*.md
```

They are editor-owned curation files, not publishable entries. A collection can
have a Markdown body for future collection pages, but homepage curation only
needs frontmatter.

Recommended authoring:

```yaml
title: Start Here
description: A concise introduction to TPM.
items:
  - what-is-a-meme
  - memes-are-not-jokes-they-are-diagram-games
  - slug: homesteading-the-memeosphere
    note: Start here for questions about who owns memes.
```

Rules:

- `items` preserves manual order.
- An item may be a string slug or an object with `slug` and optional `note`.
- Slugs resolve against one global publishable index containing articles and
  announcements.
- Duplicate slugs inside one collection fail the build.
- Missing slugs fail the build with the collection ID and missing slug.
- Duplicate publishable slugs across articles and announcements fail before any
  collection is resolved.
- A collection item whose publishable entry has `visibility.homepage: false`
  fails when used on the homepage.
- A collection detail page omits collection items whose publishable entry has
  `visibility.directory: false`.

This keeps collection authoring small while allowing a featured item to carry
one sentence of extra editorial context when needed.

### Collection Pages

Collections are not publishable entries themselves. They are editorial
directories. The public route contract is:

```text
/collections/
/collections/[collection]/
```

The index lists active, non-draft collections using the same compact term
overview language as category and tag indexes. The count label should describe
collection entries rather than always saying "articles" because collections may
include announcements.

The detail page resolves the collection against the global publishable index,
preserves manual order, filters out `directory: false` items, and renders the
remaining entries with the shared archive/list treatment. If a collection
references an unknown slug or repeats a slug, the build fails. A hidden item is
not an error on collection detail pages; it is simply not listed there. Homepage
resolution remains stricter because a hidden homepage item in `featured` or
`start-here` is likely a configuration mistake.

## Homepage Data Flow

`src/pages/index.astro` should become a composer:

```text
load content collections
build homePageViewModel()
render blocks
```

The view model owns:

- global publishable index construction;
- collection resolution for `featured` and `start-here`;
- announcement selection from newest visible announcements;
- Recent selection from newest visible normal articles;
- category, author, and discovery-link normalization;
- stale/missing configuration failures.

The page owns:

- imports for visual blocks;
- rendering the already-normalized model;
- no collection sorting or slug validation logic.

## Component Boundaries

Compact homepage lists should depend on a source-agnostic item shape:

```ts
interface PublishableListItem {
  title: string;
  href: string;
  date?: string;
  author?: string;
  authors?: readonly AuthorSummary[];
  category?: { href: string; title: string };
  description?: string;
  image?: PublishableImage;
  kind?: PublishableKind;
}
```

The component owns presentation:

- compact row rhythm;
- title wrapping/truncation;
- metadata separators;
- empty state;
- light/dark contrast;
- focus and link behavior;
- responsive containment.

The component does not own data source rules. The same component should be able
to render newest announcements, Start Here, future collection pages, related
content, or author/tag/category teasers.

Existing `FlatArticleList` and `FlatArticleTeaser` can remain as compatibility
names during migration, but their docs and types should make clear that they
render publishable entries, not only articles. A future rename can happen as a
separate cleanup if it reduces confusion.

## Featured Behavior

Featured is the `featured` collection. It can include articles or
announcements. The carousel receives resolved publishable entries plus optional
collection notes.

The slide should render:

- category/date metadata when available;
- publishable title;
- publishable description;
- optional collection item note;
- publishable image when available;
- a generic framed fallback label when no image exists.

The fallback should not import a TPM-named asset from platform code. It should
preserve the carousel frame with a readable site label, so a valid publishable
entry without an image remains usable in any site instance.

## Critical Review

This design intentionally keeps categories and tags outside collections because
their membership is automatic and taxonomy-owned. Collections are explicit
editorial curation. Sharing list components and term overview components is
good; sharing the ownership model would make authoring harder and build errors
less clear.

The biggest implementation risk is partial migration: leaving homepage data
split across `pages/index.md`, `home-featured`, and `collections` would be worse
than the current state. The migration should remove homepage-specific feature
content once `featured` and `start-here` collections exist.

The second risk is adding unused visibility fields. Homepage, directory, feed,
and search visibility should be wired through shared helpers as surfaces adopt
them, with site defaults and frontmatter overrides using the same normalization
path.

The third risk is over-renaming components. The component contract matters more
than filenames during this milestone. Keeping compatibility names is acceptable
if docs, types, and homepage code use the source-agnostic model.

## Test Plan

Unit tests:

- shared publishable schema accepts article and announcement frontmatter;
- visibility inherits site-owned defaults;
- visibility overrides preserve unspecified defaults;
- publishable kind derives from collection source;
- global publishable index rejects duplicate article/announcement slugs;
- collection schema accepts string items and object items with notes;
- collection resolver preserves manual order;
- collection resolver rejects duplicate and missing slugs;
- homepage collection resolution rejects `homepage: false` items;
- collection detail pages omit `directory: false` items;
- publishable list item mapping works for articles and announcements.

Component tests:

- compact list renders article and announcement items in caller order;
- compact list renders metadata only when present;
- Featured slide renders publishable description and collection note;
- Featured slide uses fallback image when no publishable image exists;
- empty states remain quiet and accessible.

Page/browser tests:

- homepage renders Featured from the `featured` collection;
- homepage renders Start Here from the `start-here` collection;
- announcements remain newest-first and do not appear in Recent;
- `/collections/` lists active collections;
- `/collections/start-here/` renders the Start Here collection in manual order;
- `/collections/featured/` renders the Featured Articles collection in manual
  order;
- source order and desktop row alignment from the existing homepage design
  remain intact;
- no horizontal overflow at mobile, tablet, desktop, and wide desktop widths.

Release checks:

- content sync/type generation succeeds with the new collection;
- build verifier does not expect stale `home-featured` output;
- HTML validation passes;
- typecheck/lint/format pass.
