# Site Anatomy Technical Design

## Purpose

This document defines the structural anatomy of The Philosopher's Meme. It is
the source of truth for how pages should be assembled before developers add new
page-specific layout.

The concrete navigation and route-consolidation contract lives in
`docs/navigation/header-and-articles-hub.md`. When this document and that
document overlap, use the navigation document for header, category dropdown,
search reveal, `/articles/`, `/articles/all/`, and `/categories/` decisions.

The site has two primary reader tasks:

- browsing: find something worth reading;
- reading: stay oriented inside one article and find a natural next thing to
  read.

Every page should serve one of those tasks. Pages may contain editorial flavor,
but their structure should stay consistent unless the task genuinely differs.

## Design Position

The site should feel like an editorial publication with an archive, not a
documentation site or a generic blog. The current prototype is useful for tone,
palette, and content inventory, but it is not an architectural contract.

Core decisions:

- Use two page-body families: `ReadingBody` and `BrowsingBody`.
- Put reusable page constraints in layout primitives, not one-off route markup.
- Move category discovery into site navigation, mobile navigation, category
  pages, homepage discovery, and the footer.
- Reuse the left margin/rail pattern for article-local table of contents, not
  for global category navigation.
- Keep support CTAs visible, dignified, and predictable.
- Keep route files thin: load data, choose an anatomy, compose blocks.

## Current Route Inventory

Every file route should map to a page family or endpoint:

| Route file                              | Current role                 | Target anatomy                                               |
| --------------------------------------- | ---------------------------- | ------------------------------------------------------------ |
| `src/pages/index.astro`                 | homepage and archive gateway | `BrowsingBody` with home blocks                              |
| `src/pages/articles/index.astro`        | articles hub                 | `BrowsingBody` with category discovery and archive gateway   |
| `src/pages/articles/all.astro`          | flat article archive         | `BrowsingBody` with archive blocks                           |
| `src/pages/articles/[...slug].astro`    | article detail               | `ReadingBody`                                                |
| `src/pages/categories/index.astro`      | compatibility category index | redirect to `/articles/` or non-primary `BrowsingBody` page  |
| `src/pages/categories/[category].astro` | category detail              | `BrowsingBody` with archive/list blocks                      |
| `src/pages/search.astro`                | Pagefind search page         | `BrowsingBody` with search blocks                            |
| `src/pages/about.astro`                 | generic Markdown page        | `ReadingBody` if essay-like; otherwise narrow `BrowsingBody` |
| `src/pages/404.astro`                   | error/discovery page         | `BrowsingBody` with recovery links                           |
| `src/pages/catalog/[...path].astro`     | internal component catalog   | catalog-only anatomy; excluded from production               |
| `src/pages/feed.xml.ts`                 | RSS endpoint                 | endpoint, no visual anatomy                                  |

Route files should not own page width, gutters, sidebars, card/list styling, or
support/discovery ordering. Their job is data loading and composition.

## Current Component Inventory

Current public components classify into these anatomy roles:

| Role          | Components                                                                                                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| layout shell  | `SiteShell`, `SiteHeader`, `SiteFooter`, `MainFrame`, `PageFrame`                                                                                                                                                             |
| navigation    | `BrandLink`, `PrimaryNav`, `SectionNav`, `SectionNavItem`, `SearchForm`, `SupportLink`, `ThemeToggle`, `MobileMenu`, `DiscoveryMenu`, `CategoryDropdown`, `CategoryPreviewList`, `CategoryTree`, `CategoryGroup`              |
| article parts | `ArticleHeader`, `ArticleMeta`, `ArticleProse`, `ArticleImage`, `ArticleCard`, `ArticleList`, `ArticleTags`, `ArticleEndcap`, `MoreInCategoryBlock`, `RelatedArticlesBlock`, `ArticleTableOfContents`, hover image components |
| page parts    | `MarkdownPage`, `PageHeader`, `PageProse`                                                                                                                                                                                     |
| blocks        | homepage blocks, archive/category/search blocks, `SupportBlock`                                                                                                                                                               |
| media         | `ResponsiveIframe`, `EmbedFrame`                                                                                                                                                                                              |
| SEO           | `SiteHead`, `ArticleJsonLd`                                                                                                                                                                                                   |
| UI primitives | `Button`, `LinkButton`, `IconButton`, `TextLink`, `Input`, `Badge`, `Separator`, `Container`, `Section`, `Card`, anchored positioning primitives                                                                              |

Missing target anatomy components:

- `ReadingBody`
- `BrowsingBody`
- `SectionStack`
- `ContentRail`
- `EndcapStack`
- `MarginSidebarLayout`
- `DiscoveryMenu`
- `CategoryDropdown`
- `CategoryPreviewList`
- `ArticleTableOfContents`
- `TableOfContentsItem`
- `TableOfContentsToggle`
- bibliography and author page components named later in this document.

## Current Page Trees

Current trees are approximate because the prototype has already been partially
extracted.

Homepage:

```text
index route
  BaseLayout/SiteShell
  MainFrame
    home blocks
    category overview
    support block
```

Article detail:

```text
article route
  render(article)
  ArticleLayout
    ArticleJsonLd
    ArticleHeader
    ArticleProse
    ArticleEndcap
    ArticleTags
```

Archive, category, and search pages:

```text
route
  BaseLayout/SiteShell
  PageFrame or route-level layout
  PageHeader
  archive/category/search block
```

About/generic Markdown:

```text
about route
  render(page)
  MarkdownPage
    PageHeader
    PageProse
```

404:

```text
404 route
  BaseLayout/SiteShell
  recovery content and links
```

Catalog:

```text
catalog route
  gated internal catalog shell
  catalog sections and examples
```

## Current Reimplementation Problems

The anatomy refactor should remove these repeated decisions:

- page-specific max-width and gutter choices on homepage, archive, category,
  search, and support sections;
- sidebar/category layout encoded as page structure rather than a reusable rail;
- repeated list/card spacing across archive, category, search, and homepage
  blocks;
- article-end ordering split across article components instead of one anatomy
  contract;
- support blocks placed by local page markup instead of named endcap or browsing
  surfaces;
- header/menu/category discovery behavior split between layout and navigation
  components;
- `/articles/` and `/categories/` competing as separate top-level category
  indexes;
- homepage category and support blocks escaping the shared browsing measure;
- global CSS or page-level patches deciding component geometry.

## Page Families

### Reading Pages

Reading pages are for one primary long-form text.

Current and planned examples:

- article detail pages;
- long Markdown pages if they behave like essays;
- future author essays or special editorial pages.

Reading pages optimize for:

- readable measure;
- stable heading hierarchy;
- article-local orientation;
- minimal fatigue;
- article-end continuation.

Target anatomy:

```text
SiteShell
  SiteHeader
  MainFrame
    ReadingBody
      MarginSidebarLayout
        left rail: ArticleTableOfContents when useful and width allows
        content: ArticleLayout
          ArticleHeader
          ArticleProse
          ArticleEndcap
            SupportBlock
            MoreInCategoryBlock
            RelatedArticlesBlock
          ArticleReferences
            ArticleFootnotes
            ArticleBibliography
          ArticleTags
        right rail: reserved for future article-local tools only
  SiteFooter
```

The reading column must remain centered relative to the page body even when a
left rail appears. A rail should occupy margin space; it must not squeeze the
article into an uncomfortable measure.

### Browsing Pages

Browsing pages help readers choose what to read next.

Current and planned examples:

- homepage;
- article archive;
- category index;
- category detail;
- search;
- authors index;
- author detail pages;
- global bibliography.

Browsing pages optimize for:

- scannable lists and grids;
- consistent widths;
- fast comparison;
- clear filters and categories;
- natural support and footer handoff.

Target anatomy:

```text
SiteShell
  SiteHeader
  MainFrame
    BrowsingBody
      PageHeader
      optional PageProse or intro block
      SectionStack
        browsing blocks:
          archive list
          category overview
          search results
          author article list
          bibliography list
        optional SupportBlock
        optional discovery block
  SiteFooter
```

Browsing pages should not each invent their own max width. Archive, category,
search, author, and bibliography pages should share the same comfortable
listing measure unless a design document explicitly chooses otherwise.

## Site Shell Anatomy

```text
BaseLayout
  document head
  theme boot script
  skip link
  SiteShell
    SiteHeader
    MainFrame
      page body slot
    SiteFooter
```

Responsibilities:

- `BaseLayout`: document structure, global CSS import, metadata, theme boot
  script, skip link, and body slot.
- `SiteShell`: persistent page chrome and document-level region order.
- `SiteHeader`: brand, primary actions, search access, support, section
  navigation, and mobile navigation entry.
- `MainFrame`: owns the high-level page body slot and page/sidebar
  relationship; it does not know article/category semantics.
- `SiteFooter`: useful publication links, categories, RSS, support, and
  secondary discovery.

The shell must preserve exactly one main landmark and one contentinfo landmark.
The skip link must always target the main content.

## Navigation Anatomy

Navigation should be deliberate information architecture, not a collision-prone
single row.

Target model:

- The desktop header has one row with a left cluster and a right utility
  cluster.
- The left cluster owns `BrandLink`, category dropdown links, `Articles`, and
  `About`.
- The right cluster owns search reveal, theme toggle, and support.
- A complete mobile menu owns all high-value destinations when space is
  constrained.
- Category dropdowns visually read as dropdowns, open on hover/focus where
  appropriate, and keep category text as a normal navigation link.
- RSS is a secondary/footer destination, not primary header chrome.
- Footer, homepage, and `/articles/` category sections provide stable
  no-JavaScript fallbacks.

Category discovery should be available through:

- desktop category dropdowns;
- mobile menu;
- `/articles/` and category detail pages;
- homepage category overview;
- footer category links.

The desktop article margin rail should not duplicate global category discovery.
It becomes article-local table of contents when headings make that useful and
the reading grid has enough width. If the rail is hidden or collapsed, the
article content column remains centered.

## Article Anatomy

Article pages should give the reader one clear reading path.

Target order:

1. `ArticleHeader`: category, title, description, author/date metadata, optional
   hero/media.
2. `ArticleProse`: the rendered article body.
3. `ArticleEndcap`: support and reading continuation.
4. `ArticleReferences`: article-local notes and bibliography.
5. `ArticleTags`: final secondary metadata surface.

Article body content is author-owned. Component work must not rewrite article
wording. Reference syntax normalization is separate article-content work and
requires manual verification.

Hero/media behavior:

- If an article has a hero image, it belongs to `ArticleHeader`.
- If no hero exists, the layout must not reserve awkward blank space.
- Inline article media belongs to article prose or explicit MDX media
  components.

End surfaces:

- `ArticleEndcap` owns support and continuation.
- `ArticleReferences` owns notes and bibliography.
- `ArticleTags` stays last.

## Browsing Anatomy

Browsing pages should be built from the same small set of blocks.

Core blocks:

- `PageHeader`: title, description, and optional secondary action.
- `PageProse`: short editorial intro when a browsing page needs one.
- `ArticleList` and `ArticleCard`: repeated article summaries.
- `CategoryOverviewBlock`: category discovery.
- `SearchResultsBlock`: query/results states.
- `SupportBlock`: dignified support prompt.
- Future `AuthorArticleList` and `BibliographyList`.

Browsing blocks should share:

- the same listing measure;
- the same vertical rhythm;
- the same card/list density;
- the same empty and long-content behavior;
- the same support placement rules.

Route-specific contracts:

- The homepage is a browsing page and should use the same centered browsing
  measure as archive, category, and search pages.
- `/articles/` is the primary articles hub: page header, category overview,
  useful article discovery, and a clear `View all articles` link.
- `/articles/all/` is the flat chronological archive.
- `/categories/<category>/` remains the category detail route.
- `/categories/` should not be a primary navigation destination; redirect it to
  `/articles/` or keep it only as an explicitly tested compatibility page.

## Layout Primitive Set

Milestone 17 should define component one-pagers for these primitives:

- `SiteShell`
- `MainFrame`
- `PageFrame`
- `ReadingBody`
- `BrowsingBody`
- `SectionStack`
- `ContentRail`
- `EndcapStack`
- `MarginSidebarLayout`

Existing `SiteHeader`, `SiteFooter`, `MainFrame`, and `PageFrame` one-pagers
should be updated to match this anatomy.

## New Or Changed Component Designs

Required one-pagers before implementation:

- layout: `ReadingBody`, `BrowsingBody`, `SectionStack`, `ContentRail`,
  `EndcapStack`, `MarginSidebarLayout`;
- navigation: `DiscoveryMenu`, `CategoryDropdown`, `CategoryPreviewList`, plus
  updates to `SiteHeader`, `PrimaryNav`, `MobileMenu`, `SectionNav`,
  `CategoryTree`, `CategoryGroup`, `SearchForm`, `SupportLink`,
  `ThemeToggle`, and `SiteFooter`;
- article TOC: `ArticleTableOfContents`, `TableOfContentsItem`,
  `TableOfContentsToggle`;
- bibliography page: `BibliographyPage`, `BibliographyList`,
  `BibliographyEntry`, `BibliographySourceArticles`, `BibliographyFilters`,
  `BibliographyEmptyState`;
- authors: `AuthorLink`, `AuthorByline`, `AuthorBioBlock`,
  `AuthorProfileHeader`, `AuthorArticleList`, `AuthorSocialLinks`,
  `AuthorPage`, `AuthorsIndexPage`.

## Responsiveness Contract

All anatomy primitives are mobile-first.

Rules:

- The smallest viewport gets one coherent column.
- Wider viewports add density and rails only when they help the reader.
- Reading measure is protected before rail density.
- Browsing pages use shared listing width.
- Rails disappear or move below content rather than overlapping content.
- Sticky elements must never cover content while scrolling.
- No page body should create horizontal overflow.

Use viewport breakpoints for page anatomy and container queries for reusable
cards/blocks whose available width depends on their parent.

## Accessibility Contract

Required invariants:

- one main landmark;
- one site footer/contentinfo landmark;
- no duplicate primary navigation landmarks without labels;
- skip link reaches main content;
- focus states are visible in light and dark mode;
- no hover-only discovery;
- disclosure controls are keyboard reachable;
- current page/category state uses `aria-current` only on links;
- reduced-motion preferences are respected for any animated disclosure.

## Testing Strategy

Every anatomy primitive should have:

- render tests for semantic structure, landmarks, required slots, empty states,
  and heading behavior;
- catalog examples for normal, dense, long-content, empty, mobile, desktop,
  wide, and dark/light states;
- Playwright layout invariants for horizontal overflow, sticky/header overlap,
  rail/content relationships, centered reading measure, and browsing width
  consistency;
- axe checks for critical and serious accessibility issues.

Useful browser invariants:

- Reading column keeps a readable measure on article pages.
- Left rail never covers article prose.
- Sticky header never hides the top of a rail or heading target.
- Browsing pages share the same content width.
- Support blocks align with their surrounding page-body measure.
- Mobile menu and desktop navigation are not simultaneously exposed as
  competing controls.
- Category dropdown text click navigates while hover/focus exposes the preview.
- Search reveal opens without pushing header links into overlap.
- `/articles/` and `/articles/all/` render distinct, unambiguous page purposes.
- Homepage category, archive, and support sections align to the same browsing
  measure.

## Prototype Decisions To Remove

These prototype behaviors should not be preserved unless a later design
explicitly re-approves them:

- using the left desktop sidebar for global category navigation on article
  pages;
- page-specific width patches for archive, category, search, or homepage
  sections;
- header behavior that depends on fragile single-row collision thresholds;
- a permanent desktop search input that competes with brand, categories, and
  support for horizontal space;
- keeping `/articles/` and `/categories/` as competing primary category indexes;
- reserving hero-image space when no hero exists;
- support blocks that escape the page body's content measure;
- tags appearing before article-end continuation or references;
- global CSS component selectors for page anatomy.

## Handoff Criteria

The anatomy design is ready for implementation when:

- every new component named here has a component one-pager;
- route files can be mapped to either `ReadingBody` or `BrowsingBody`;
- all page-body widths and rail relationships have named owners;
- tests can assert intended relationships rather than screenshot guesses;
- article content changes remain isolated from component refactors.
