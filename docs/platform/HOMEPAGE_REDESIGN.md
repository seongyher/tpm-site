# Homepage Redesign

## Purpose

The homepage is TPM's editorial front page. It should quickly give readers a
reason to keep reading, show what is current, and make support/community paths
visible without feeling like a marketing landing page.

The design priority is a flat, quiet, easily scannable page. Use short section
labels, real article links, stable spacing, and minimal explanatory copy. The
homepage should feel dense enough to be useful on the first screen, but calm
enough that it does not compete with the reading experience.

## Current Problems

- The first redesign is too cluttered: too many framed boxes, too much
  explanatory copy, and a three-column masthead that gives equal weight to
  secondary material.
- The page uses "essays" in places where the site language is "articles".
- GitHub is not first-impression homepage material and should stay in footer or
  platform-facing docs.
- Homepage promotions are too generic. Featured articles should inherit article
  metadata, while non-article features need one simple link interface.
- Announcements should behave like article-like content, but they should not
  intermingle with the normal article library, categories, related articles, or
  Recent feed.
- The category block is too spacious for homepage use; it should be concise,
  single-row, and horizontally scrollable with real controls.

## Target Anatomy

Desktop homepage:

```text
Lead grid
  Row 0
    Read / Articles Archive Authors Collections Tags

  Row 1
    Wide cell: Hero / Support / Discord
    Thin cell: Start Here

  Row 2
    Wide cell: Featured carousel
    Thin cell: Announcements

Categories, one-row horizontal rail

Recent, chronological normal articles
```

Mobile homepage:

```text
Read / Articles Archive Authors Collections Tags
Hero / Support / Discord
Featured
Start Here
Announcements
Categories
Recent
```

Tablet may use two-column groupings where space allows, but it must preserve
the same priority order and avoid horizontal overflow.

## Editorial Rules

- Use "articles", never "essays".
- Prefer concise headings:
  - `Announcements`
  - `Start Here`
  - `Read`
- The homepage should not render visible headings for Featured, Categories, or
  Recent when the surrounding structure already makes the surface clear. Keep
  accessible labels for screen readers and tests.
- Do not enumerate tags on the homepage.
- Do not include GitHub on the homepage.
- Keep obvious explanations out of visible copy.
- Prefer flat lists with separators over cards, panels, and nested boxes.
- Feature one item at a time; do not render a row of competing promo cards.
- Keep homepage categories to one concise row with working scroll buttons
  rather than a tall grid.

## Content Model

The homepage is assembled from the publishable-entry and collection model
defined in [Homepage Content Model](./HOMEPAGE_CONTENT_MODEL.md). Articles and
announcements are publishable entries with the same author-facing schema.
Collections are editor-owned ordered lists of publishable entries.

### Homepage Page Frontmatter

`site/content/pages/index.md` owns stable page metadata only:

```yaml
title: The Philosopher's Meme
description: The philosophy of memes, cyberculture, and the Internet.
```

Curated homepage lists live in `site/content/collections/` so writers manage all
ordered lists through one interface.

### Announcements

Announcements are article-like content in a separate collection:

```text
site/content/announcements/*.md
```

They use the same author-facing frontmatter shape as normal articles:

```yaml
title: Join the TPM Discord
description: Talk with readers about memes, media, and Internet culture.
author: The Philosopher's Meme
date: 2026-05-05
tags: []
draft: false
```

Announcements have their own routes:

```text
/announcements/
/announcements/[slug]/
```

The homepage `Announcements` heading links to `/announcements/`. Announcement
entries whose `visibility.directory` is `false` keep direct routes but do not
appear in the announcement index or collection detail lists.

Announcements are separate from the normal article library:

- not in `/articles/`;
- not in normal Categories;
- not in normal Recent;
- not in related articles;
- not in the top category navigation;
- only in the homepage Announcements slot, announcement routes, and explicit
  collections that name them.

This separation is intentional. It makes accidental intermingling difficult and
keeps announcements available as full reading pages when needed.

### Featured Items

Featured items are the `featured` collection:

```text
site/content/collections/featured.md
```

The collection references publishable slugs in manual order. Items may include
an optional `note` for feature-specific editorial context. The page inherits
title, description, href, author, date, category, kind, and image from the
referenced article or announcement.

Featured also has a public directory route at `/collections/featured/`. The
footer labels that link as `Featured Articles` because that is clearer to
readers than the internal collection ID. The homepage carousel itself has an
accessible label but no visible `Featured` heading; previous/next controls live
in the same bottom control row as the position dots.

### Start Here

Start Here is the `start-here` collection and has a public directory route at
`/collections/start-here/`. The homepage `Start Here` heading links to that
route.

### Collections

Collections have their own browsing routes:

```text
/collections/
/collections/[collection]/
```

The collection index belongs in footer navigation and the homepage Read strip.
Collection detail pages use the shared publishable-entry list model and preserve
manual collection order.

## Component Hierarchy

```text
src/pages/index.astro
  loads home page, articles, announcements, categories, authors, and collections
  calls homePageViewModel()
  composes:
    HomeLeadGrid
      HomeLeadHeroCell
      HomeHeroBlock
    HomeLeadFeaturedCell
      HomeFeaturedCarousel
        HomeFeaturedSlide
    HomeLeadStartCell
      FlatArticleList title="Start Here" titleHref="/collections/start-here/" (publishable entries)
    HomeLeadAnnouncementsCell
      FlatArticleList title="Announcements" titleHref="/announcements/" (publishable entries)
    HomeCategoryOverviewBlock
    HomeDiscoveryLinksBlock
    ArticleList inside aria-label="Recent"
```

Reusable primitives:

```text
FlatArticleTeaser
  one compact publishable entry link with optional meta

FlatArticleList
  section heading plus FlatArticleTeaser items

HomeFeaturedCarousel
  one visible featured item at a time, static first item without JS

HomeCategoryOverviewBlock
  one-row category rail with native horizontal scrolling and progressive
  previous/next icon buttons
```

The existing full `ArticleList` remains appropriate for large chronological
feeds. The new flat list primitive is for thin homepage rails and compact
sidebars.

## Carousel Behavior

The Featured carousel is progressive enhancement.

No JavaScript state:

- render the first active featured item as ordinary static HTML;
- include all item data in static markup where possible;
- if only one item exists, render no controls and no carousel script.

JavaScript enhancement for multiple items:

- show one item at a time;
- provide previous, next, and position controls as real buttons;
- place previous, next, and position controls in one bottom row so the carousel
  does not need a visible heading/action row;
- auto-rotate on a calm interval only when motion is allowed;
- pause on hover, focus, touch/pointer interaction, and manual control use;
- respect `prefers-reduced-motion` by disabling auto-rotation;
- avoid layout shift by keeping a stable content region;
- do not require React or shadcn.

The carousel should feel like an editorial feature slot, not an advertising
widget.

## Layout Requirements

- The lead grid uses a 2:1 desktop split.
- The wide desktop track owns the primary path: Hero in row 1 and Featured in
  row 2.
- The thin desktop track owns orientation and current-status material: Start
  Here in row 1 and Announcements in row 2.
- Source order matches mobile visual order: Hero, Featured, Start Here,
  Announcements. Desktop placement may move Start Here beside Hero and
  Announcements beside Featured, but it must not require DOM-order hacks.
- The hero is wide, centered, and visually calm. It contains logo art plus
  Patreon- and Discord-branded logo CTAs; the CTAs should not reduce the
  artwork's horizontal measure.
- The hero artwork should use most of the wide desktop track before hitting its
  maximum width.
- The older requirement that Announcements and Featured headings align is
  replaced by a simpler invariant: the Announcements cell and the Featured
  carousel begin on the same row, and the carousel has no visible heading row.
  Do not use margin offsets, fixed heights on Start Here, or JavaScript
  measurement to force alignment.
- The Featured carousel should keep a stable viewport height so slide changes
  do not resize the lead grid, and featured metadata/title/media anchors should
  remain top-aligned across slides with different amounts of copy.
- Announcement, Featured, Start Here, and Recent surfaces use flat article
  treatments with separators rather than cards.
- Categories render as one horizontal rail, never wrap into a second row,
  center category names inside each item, and expose working previous/next icon
  buttons when the list overflows.
- Read is a compact, left-aligned, intrinsic-width first-row quick navigation
  bar containing Articles, Archive, Authors, Collections, and Tags. It has no
  horizontal border bars, almost no vertical padding, sits directly under the
  site header, and nearly touches the lead row below it.
- Recent is chronological newest-first normal articles only.
- The homepage must not duplicate announcement entries inside Recent.
- The homepage must not have horizontal overflow at mobile, tablet, desktop, or
  wide desktop widths.

## Accessibility Requirements

- The page has one `h1`.
- Each major row has a concise visible heading or an accessible section label.
- Announcement and Start Here headings are visible links to their directory
  pages.
- Featured, Categories, and Recent use accessible section labels even when they
  do not render visible headings.
- Announcement, Start Here, Featured, Categories, Read, and Recent landmarks are
  reachable in logical DOM order.
- Carousel controls are keyboard reachable and named.
- Inactive carousel items are not keyboard reachable and are hidden from screen
  readers.
- Auto-rotation pauses for focus, hover, touch/pointer interaction, and manual
  control use.
- Reduced-motion users do not get auto-rotation.
- Focus states use existing semantic tokens and remain visible in light and
  dark mode.
- External links have clear labels.

## Performance Requirements

- The hero image stays optimized through Astro images with stable dimensions.
- Announcement and Start Here rails are static HTML.
- Carousel JavaScript is small, page-local, and only needed when multiple
  featured items are active.
- Category rail JavaScript is small, page-local, and only enhances native
  horizontal scrolling with button controls.
- The first featured item renders before JavaScript so the page remains useful
  if scripts fail.
- Carousel rotation must not cause layout shift.
- No new framework island is required.
- Homepage changes should not regress Lighthouse through new LCP, CLS, or
  unnecessary JavaScript.

## Testable Invariants

- Desktop lead grid lays out a wide primary track to the left of a thin
  secondary track.
- Hero and Start Here share the first desktop row; Featured and Announcements
  share the second desktop row.
- The Featured carousel and Announcements list begin in the same desktop row
  without a visible Featured heading.
- The primary lead track takes roughly two thirds of the lead grid, and the hero
  artwork fills most of that track before reaching its maximum width.
- Mobile order is Read, Hero, Featured, Start Here, Announcements, Categories,
  Recent without responsive order hacks.
- The Featured carousel height does not change when the active feature changes.
- The Featured carousel metadata, title, and media y positions do not change
  when the active feature changes.
- The Featured carousel previous/next buttons share the bottom control row with
  item dots.
- The first viewport contains at least one announcement link when announcements
  exist, one support link, one Discord link, one featured link, and one Start
  Here link.
- Featured item references fail clearly when an article slug is stale.
- A single featured item renders statically without carousel controls.
- Multiple featured items render controls, rotate when motion is allowed, and
  pause on interaction.
- Reduced-motion disables auto-rotation.
- Categories render one horizontal row with working scroll controls when the
  rail overflows.
- Category names are centered.
- Read contains Articles, Archive, Authors, Collections, and Tags; it stays one
  line by shrinking/truncating before wrapping, remains left-aligned rather than
  spreading across the page, and excludes GitHub and RSS.
- Recent is newest-first normal articles only and excludes announcements.
- `/announcements/` lists announcements newest-first.
- `/collections/` lists active collections.
- `/collections/start-here/` and `/collections/featured/` render ordered
  collection directories.
- Announcement detail pages use article-like semantics without appearing in
  normal article routes.
- The homepage uses "articles" language and does not include "essays".
- There is no horizontal overflow across key viewport widths.

## Critical Review

The redesigned model intentionally replaces both `homePromos` and
`home-featured`. Featured should be a normal collection of publishable entries
instead of a second homepage-only content type.

Announcements are separate from articles even though they share article-like
frontmatter. A hidden category would be easier initially, but it would make
leakage into article browsing too easy. A separate collection and route family
make the desired separation explicit and testable.

The carousel is the only new interactive behavior. It is justified because the
feature slot should show one editorial feature at a time without making the
homepage noisy. The implementation must stay static-first and accessible; if
that cannot be satisfied, the fallback is a single static featured item.
