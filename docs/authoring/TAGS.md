# Tags

## Purpose

Tags are lightweight cross-category article groupings. They help readers move
from one article to related topics without turning every topic into a primary
site section. Categories remain the curated publication sections; tags are
many-to-many discovery metadata.

## Requirements

- Authors write normal tag labels in article frontmatter.
- The canonical tag label is also the display label.
- Tags are normalized to lowercase, trimmed text with internal whitespace
  collapsed to one space.
- Duplicate tags are removed after normalization.
- Slash-containing tags are invalid. Do not encode `/` into tag URLs.
- Tag URLs are built from `encodeURIComponent(canonicalTag)`.
- `/tags/` lists every canonical tag with an article count.
- `/tags/[tag]/` lists every published article with that canonical tag.
- Tags rendered at the end of articles link to the corresponding tag page.
- Category and tag overview pages should share a reusable term-listing block
  rather than reimplementing the same layout.

## Data Model

The canonical tag model is intentionally small:

```ts
interface TagSummary {
  articles: ArticleEntry[];
  href: string;
  label: string;
  pathSegment: string;
}
```

`label` is the normalized display label. `pathSegment` is the encoded label used
for public URLs and build-output verification. `href` is the canonical site URL.

Tag normalization and validation must live in one helper module so content
schemas, cleanup tooling, route generation, and UI links cannot drift apart.

## Normalization And Enforcement

Normalization:

1. Trim leading and trailing whitespace.
2. Collapse all internal whitespace to one regular space.
3. Convert to lowercase.
4. Remove duplicates after normalization while preserving first occurrence.

Validation:

- Reject empty strings.
- Reject any tag containing `/`.
- Reject tags that are not already canonical after normalization.
- Reject duplicate canonical labels in one article.

The cleanup tool may rewrite safe normalization changes, such as case,
whitespace, and duplicate removal. It should fail clearly on slash-containing
tags so those require an intentional content edit.

## Routes

`/tags/` is a browsing page. It uses the same browsing anatomy as category and
archive pages.

`/tags/[tag]/` is a static route generated from canonical tag summaries. Public
links encode the canonical label, such as:

```text
/tags/meme%20history/
```

Astro `getStaticPaths()` params use the raw canonical label (`meme history`);
Astro handles URL encoding when generating static paths.

The tag detail page should look and behave like a category detail page: eyebrow,
title, description, and the shared article-list component.

Unknown tag paths should not be generated. Normal static-site behavior is
sufficient for invalid paths.

## Component Structure

Use a shared term overview block for category and tag index surfaces:

```text
CategoryOverviewBlock
  maps category navigation items
  -> TermOverviewBlock

TagsIndexPage
  maps tag summaries
  -> TermOverviewBlock
```

`TermOverviewBlock` owns the reusable visual pattern: heading, description,
grid/list of term links, optional item description, and article count. It does
not fetch content and does not know whether an item is a category or tag.

`CategoryOverviewBlock` remains as the category-specific adapter because callers
already pass `SectionNavItem[]`.

`ArticleTags` owns article-end tag link rendering. It receives already
canonical tags and renders linked badges as the final article surface.

## Responsive Behavior

Tag pages follow the browsing page measure. The term overview grid starts as one
column, expands to two columns at small widths, and may use four columns on wide
screens when the parent chooses the default density.

Long tag labels must wrap or truncate within their grid cell without horizontal
overflow. Dense tag indexes should remain scannable and should not introduce
card-in-card layouts.

Article-end tag links wrap inside the reading column and remain visually
secondary to the article body and endcap.

## Accessibility

- The tag index has one `h1`.
- Tag detail pages have one `h1`.
- Term overview lists use semantic lists.
- Article tags use a semantic list with the accessible name "Article tags".
- Linked tags have visible focus rings and a useful accessible name from their
  visible label.
- No JavaScript is required for tag browsing.

## Tests

Unit tests:

- tag normalization;
- duplicate removal after normalization;
- slash rejection;
- encoded route generation;
- tag grouping and deterministic sorting;
- static path generation.

Schema/verifier tests:

- canonical tags pass;
- uppercase or padded tags fail schema validation;
- duplicate tags after normalization fail;
- slash tags fail;
- cleanup tooling rewrites safe changes and reports invalid slash tags.

Component/render tests:

- `TermOverviewBlock` renders item links, counts, empty state, and long labels.
- `CategoryOverviewBlock` still renders category overviews through the shared
  term block.
- `ArticleTags` renders links to tag pages.

Route/browser tests:

- `/tags/` lists tags and counts.
- `/tags/[tag]/` lists the matching articles.
- Article-end tag links navigate to tag pages.
- Footer exposes the tag index without crowding primary navigation.
- Tag pages have no horizontal overflow across mobile, tablet, desktop, and
  wide desktop widths.

## Blockers

No implementation blocker is known. Existing article frontmatter contains
legacy noncanonical tags, including uppercase labels and slash-wrapped tags, so
the cleanup/enforcement milestone must run before strict validation can pass.
