# Article Layout

Source: `src/layouts/ArticleLayout.astro`

## Purpose

`ArticleLayout` orchestrates one article page. It composes article header,
prose, endcap, references, tags, and article-local navigation data without
owning low-level layout geometry.

It must preserve article body wording and must not parse article Markdown
source directly. It also owns article-level machine-readable metadata that
requires page context, including Google Scholar/Highwire PDF tags and generated
social preview image metadata. The same canonical URL and social preview data
also drive the article share menu.

## Public Contract

- `article: ArticleEntry`
- `content: rendered article content`
- normalized related/more-in-category data
- optional normalized article headings
- optional normalized article reference data
- derived Scholar metadata and optional article PDF metadata for the `PDF`
  action
- generated social preview image metadata for Open Graph, Twitter, and JSON-LD
- normalized article share menu data for copy, email, and public social share
  targets

Exact prop names may change during implementation, but the layout should
receive normalized view-model data rather than creating it inside visual
components.

## Composition Relationships

```text
ReadingBody
  MarginSidebarLayout
    left: ArticleTableOfContents
    content:
      ArticleHeader
      ArticleTableOfContents placement="inline"
      ArticleProse
      EndcapStack
        ArticleEndcap
        ArticleReferences
        ArticleTags
```

`ArticleLayout` owns article surface ordering. `ReadingBody` owns page-body
measure. `MarginSidebarLayout` owns TOC rail geometry. When the rail is hidden
by responsive constraints, the inline TOC placement appears near the top of the
article body so heading navigation is still available without changing the
reading column geometry.

`ArticleLayout` derives Scholar metadata once for `ArticleScholarMeta`, which
emits title, author, date, language, abstract, keyword, and reference tags. It
also supplies separate citation and sharing view models to `ArticleHeader`.
There is no generated PDF download or `citation_pdf_url` metadata.

It also derives the article social preview image once through the shared social
preview image pipeline and passes that generated asset to `BaseLayout`,
`ArticleJsonLd`, and the share target helper. It must not pass raw
`ImageMetadata.src` into crawler-facing metadata or Pinterest share media.

## Layout And Responsiveness

Article content uses the reading body measure. `ArticleLayout` should not set
bespoke page widths. If no hero exists, no blank hero space should be reserved.

## Layering And Scrolling

`ArticleLayout` should not create sticky or overlay behavior. Article-local
TOC sticky behavior is delegated to `ContentRail`.

## Interaction States

No direct interaction. Descendant components own TOC disclosure, reference
links, support links, and hover image behavior.

## Accessibility Semantics

Keep one article title as the page H1. Article prose headings should start below
that level. Article end surfaces should use sections/asides with sensible
headings and should not create extra contentinfo landmarks.

## Content Edge Cases

Handle:

- no article headings;
- no hero image;
- no description;
- no tags;
- no references;
- long titles;
- many references;
- long inline media.

## Theme Behavior

Use semantic tokens and let child components own their surfaces. Article layout
should not impose decorative frames.

## Testable Invariants

- Article body renders unchanged from content.
- Article heading/H1 order is valid.
- End order is prose, support/discovery, references, tags.
- TOC receives normalized headings, not raw Markdown; generated Notes and
  Bibliography headings are included when their article reference sections
  render.
- TOC has a rail placement on desktop and an inline fallback when the rail is
  hidden.
- Every article page emits base Scholar metadata. PDF-eligible articles also
  emit a same-directory PDF URL and visible article-header PDF link; PDF-disabled
  articles omit both without losing title, author, or publication-date metadata.
- Every article page emits generated JPG social preview metadata with matching
  Open Graph, Twitter, and JSON-LD image URLs.
- No blank hero gap appears when no hero exists.
- No horizontal overflow at supported viewport sizes.

## Follow-Up Notes

- If the final implementation keeps `ArticleLayout` in `src/layouts/`, this
  one-pager still applies because it is a route-facing component contract.
