# Component Architecture Plan

This document defines the target component architecture for The Philosopher's
Meme. The current UI is a useful prototype for tone, content, and palette, but
it is not the final architecture. Prefer this plan when decomposing the site,
rewriting navigation, moving page content into Markdown, or building new blocks.

The site anatomy contract lives in `docs/SITE_ANATOMY.md`. When there is a
question about whether a page should use a reading body, browsing body, margin
rail, navigation discovery surface, or article-end surface, prefer that anatomy
contract and update both documents if the decision changes.

The goal is a conventional, static-first Astro site built from responsive
Tailwind components. Authors should add Markdown or MDX content. Developers and
agents should compose pages from well-scoped blocks and primitives.

## Product North Star

The site should feel like a serious editorial publication with a deep archive,
not a documentation site, generic blog, or marketing landing page. Static output
is an advantage: the reading experience should feel fast, durable, respectful,
and easy to share.

The product goals are:

- Help readers discover excellent work.
- Keep readers reading without trapping or annoying them.
- Make support visible and natural because support keeps the publication alive.
- Preserve a dignified editorial experience. Avoid popups, sticky nags,
  interruptive banners, guilt copy, and manipulative UI.
- Make every public page useful for readers, search engines, and social sharing.
- Make the authoring workflow boring: content authors should not touch routing,
  navigation, search, RSS, sitemap, or app code.

Design implication: the header/sidebar must not carry the whole publication.
Use multiple discovery surfaces: section navigation, category pages, homepage
editorial blocks, latest/featured lists, search, related articles, article-end
next steps, and a useful footer.

## Design Goals

- Keep routes thin: load data, validate params, choose layout, compose blocks.
- Keep prose content in content collections where possible.
- Keep article and page body wording untouched unless explicitly asked.
- Keep global CSS small: Tailwind import, tokens, base document styles, prose
  defaults, and rare cross-cutting browser behavior.
- Move repeated UI markup from global selectors into Astro components.
- Make every component responsible for its own responsive behavior.
- Use Tailwind utilities and semantic tokens at component boundaries.
- Use React, Radix, and shadcn-style components only for interaction complexity.
- Preserve static output and low client JavaScript.
- Design navigation and sidebars deliberately instead of patching collisions.
- Treat support CTAs as part of the editorial system, not as intrusive
  conversion hacks.
- Treat SEO, RSS, sitemap, JSON-LD, and Open Graph as first-class publication
  surfaces.

## Current Prototype Problems

These are not failures; they are normal prototype pressure points that should
guide the redesign.

- `BaseLayout.astro` currently owns document structure, header, mobile menu,
  sidebar, footer, category data shaping, theme script, and route body slot.
- `src/pages/index.astro` contains homepage section markup that should mostly
  become reusable blocks and content-driven Markdown.
- The header and sidebar are coupled to global class selectors and fixed
  structure, making responsive changes risky.
- Navigation behavior is scattered across markup, global CSS, and inline
  scripts instead of living behind small components.
- Global CSS still contains component selectors such as `.button`, `.sidebar`,
  `.site-header`, `.archive-list`, and `.category-card`.
- Archive/category/search pages repeat similar list/card/meta patterns.
- The homepage, About page, and article pages are all long-form content
  surfaces but do not yet share a clean page/prose vocabulary.
- The homepage underuses the archive. It should answer "what should I read?"
  more directly.
- The header has been treated as a precision layout puzzle. It should become a
  simple publication utility surface plus section navigation.
- RSS and other low-frequency utility links currently compete with higher-value
  discovery and support actions.

## Target Mental Model

```text
Routes
  load content and data
  compose Layouts

Layouts
  provide document/page shells
  compose Shell, Navigation, and Slots

Blocks
  represent page sections and domain-level content patterns
  compose Components

Components
  implement reusable UI and domain objects
  compose UI Primitives

UI Primitives
  expose small stable APIs
  render semantic HTML
  use Tailwind utilities and tokens directly
```

Routes should read like a table of contents. If a route file contains a full UI
section, a repeated card, or navigation markup, that is a candidate component.

## Target Directory Shape

```text
src/components/
  ui/
    Button.astro
    LinkButton.astro
    IconButton.astro
    TextLink.astro
    Input.astro
    Badge.astro
    Separator.astro
    Container.astro
    Section.astro
    Card.astro

  media/
    EmbedFrame.astro
    ResponsiveIframe.astro

  layout/
    BaseLayout.astro
    SiteShell.astro
    MainFrame.astro
    SiteHeader.astro
    SiteFooter.astro
    PageFrame.astro
    ReadingBody.astro
    BrowsingBody.astro
    SectionStack.astro
    ContentRail.astro
    EndcapStack.astro
    MarginSidebarLayout.astro

  navigation/
    BrandLink.astro
    PrimaryNav.astro
    SectionNav.astro
    SectionNavItem.astro
    SearchForm.astro
    SupportLink.astro
    ThemeToggle.astro
    MobileMenu.astro
    DiscoveryMenu.astro
    CategoryTree.astro
    CategoryGroup.astro
    CategoryDropdown.astro
    CategoryPreviewList.astro
    Breadcrumbs.astro

  articles/
    ArticleLayout.astro
    ArticleHeader.astro
    ArticleCitationMenu.astro
    ArticleShareMenu.astro
    ArticleMeta.astro
    ArticleProse.astro
    ArticleCard.astro
    ArticleList.astro
    ArticleImage.astro
    ArticleTags.astro
    ArticleReferences.astro
    ArticleFootnotes.astro
    ArticleBibliography.astro
    ArticleReferenceBacklinks.astro
    MoreInCategoryBlock.astro
    RelatedArticlesBlock.astro
    ArticleEndcap.astro
    LatestArticleBlock.astro

  pages/
    MarkdownPage.astro
    PageHeader.astro
    PageProse.astro

  bibliography/
    BibliographyPage.astro
    BibliographyList.astro
    BibliographyEntry.astro
    BibliographySourceArticles.astro
    BibliographyFilters.astro
    BibliographyEmptyState.astro

  authors/
    AuthorLink.astro
    AuthorByline.astro
    AuthorBioBlock.astro
    AuthorProfileHeader.astro
    AuthorArticleList.astro
    AuthorSocialLinks.astro
    AuthorPage.astro
    AuthorsIndexPage.astro

  blocks/
    HomeHeroBlock.astro
    HomeAnnouncementBlock.astro
    HomeLatestArticleBlock.astro
    HomeFeaturedArticlesBlock.astro
    HomeCategoryOverviewBlock.astro
    HomeArchiveLinksBlock.astro
    SupportBlock.astro
    CategoryOverviewBlock.astro
    CategoryRailBlock.astro
    SearchResultsBlock.astro

  islands/
    SearchEnhancer.ts
    ThemeController.ts

src/catalog/
  catalog.config.ts
  ComponentCatalog.astro
  CatalogSection.astro
  CatalogExample.astro
  examples/
    ui.examples.ts
    navigation.examples.ts
    articles.examples.ts
    blocks.examples.ts
```

The exact filenames can change during implementation, but the ownership
boundaries should remain stable.

## Component Tree

### Whole Site

```text
BaseLayout
  SiteHead
  ThemeInitScript
  SiteShell
    SkipLink
    SiteHeader
      BrandLink
      HeaderUtilityNav
        PrimaryNav
        SearchTrigger or SearchForm
        ThemeToggle
        SupportLink
      SectionNav
        SectionNavItem
        optional CategoryDropdown
      MobileMenu
        SearchForm
        PrimaryNav
        SectionNav or CategoryTree
        ThemeToggle
        SupportLink
    MainFrame
      main slot
    SiteFooter
      FooterNav
      FooterCategoryLinks
      FooterSupport
```

`BaseLayout` should eventually return to document-level responsibility:
`html`, `head`, global CSS import, SEO slot, body shell, and scripts required
for the entire document. It should not contain header markup, sidebar markup, or
category tree rendering directly.

`SiteShell` should own the persistent page chrome. It receives already-normalized
navigation data and slots the page body into `MainFrame`.

`MainFrame` should own the responsive relationship between sidebar and content:
single column by default, side rail only when there is enough space and the page
type benefits from it.

The header should have two conceptual rows on sufficiently wide screens:

```text
brand / utility actions / support
section navigation: Culture, Metamemetics, Aesthetics, Irony, ...
```

On narrow screens, this should collapse into a small brand plus a complete menu.
Do not force the full brand, search field, support button, and every section
link into one fragile row.

### Article Page

```text
src/pages/articles/[...slug].astro
  load article
  render(article)
  read articleReferences from remarkPluginFrontmatter
  ArticleLayout
    ArticleJsonLd
    ArticleHeader
      CategoryEyebrow
      PageTitle
      ArticleMeta
      ArticleDescription
      optional ArticleHero
    ArticleProse
      Content
    ArticleEndcap
      SupportBlock
      MoreInCategoryBlock
      RelatedArticlesBlock
    ArticleReferences
      ArticleFootnotes
        ArticleReferenceBacklinks
      ArticleBibliography
        ArticleReferenceBacklinks
    ArticleTags
```

`ArticleLayout` should not manually assemble every header detail forever. It
should orchestrate the article shell and defer display details to
`ArticleHeader`, `ArticleMeta`, and `ArticleProse`.

`ArticleProse` is the only place where Tailwind Typography defaults for article
body HTML should live.

Article-local notes and bibliography are produced by the article references
remark plugin as serializable data on `render(article).remarkPluginFrontmatter`.
The route passes that data through; it must not parse Markdown or inspect
article source. `ArticleLayout` owns the placement of `ArticleReferences` after
support/discovery and before final tags.

`ArticleImage` should become the default component for future MDX/article image
blocks that need captions, `Image`/`Picture`, or strict image behavior. Plain
Markdown images remain valid and are styled through `ArticleProse`.

`ArticleEndcap` is important for the publication goal. Article pages should
offer a natural next step after the article: more in the same category, related
or featured work, and a dignified support invitation. This should feel like
editorial continuation, not an ad unit.

### Markdown Page

```text
src/pages/about.astro
  load pages/about
  render(page)
  PageLayout
    PageHeader
    PageProse
      Content
```

Non-article Markdown pages should not use article metadata components. They
need a generic page shell with optional title, description, and body prose.

### Home Page

Preferred target:

```text
site/content/pages/index.md
  frontmatter:
    title
    description

site/content/announcements/*.md
  article-like announcement content

site/content/collections/*.md
  ordered editor-owned lists of publishable article/announcement slugs

src/pages/index.astro
  load pages/index
  load articles, announcements, categories, authors, and collections
  normalize through the homepage view model
  HomePage
    HomeLeadGrid
      HomeLeadHeroCell
        HomeHeroBlock
      HomeLeadFeaturedCell
        HomeFeaturedCarousel
          HomeFeaturedSlide
      HomeLeadStartCell
        FlatArticleList title="Start Here"
      HomeLeadAnnouncementsCell
        FlatArticleList title="Announcements"
    HomeCategoryOverviewBlock
    HomeDiscoveryLinksBlock
    ArticleList title="Recent"
```

The home page is a special page, not an article. It should stay route-controlled
through `src/pages/index.astro` because it needs dynamic latest-article data and
component-controlled images. The prose and editorial copy should move into the
pages content collection.

This gives authors Markdown-backed page copy and collection configuration
without forcing the homepage to be pure Markdown. The route remains the composer
for dynamic and visual blocks.

The homepage should become an editorial front page. It should answer "what
should I read?" with multiple entry points:

- latest articles;
- featured or start-here articles;
- categories as publication sections;
- most recent or featured article per category;
- announcements;
- search/archive entry points;
- support/community callouts.

The current homepage redesign uses a desktop editorial front page with a
two-column lead grid: a wide primary column for identity and Featured, and a
thin secondary column for Start Here and Announcements. Mobile preserves source
order as Hero, Featured, Start Here, Announcements. Categories return to the
shared single-column browsing measure as a one-row horizontal rail with real
scroll controls, followed by a thin secondary discovery strip and the Recent
article feed. Tags are discoverable through article metadata and `/tags/`, but
they are not enumerated on the homepage.

Homepage curation uses the publishable-entry and collection model documented in
`docs/HOMEPAGE_CONTENT_MODEL.md`. Articles and announcements share one
author-facing publishable schema; folder location derives internal kind.
Collections own ordered curation such as `featured` and `start-here`.

### Archive, Category, And Search Pages

```text
ArchivePage
  PageHeader
  ArticleList
    ArticleCard
      ArticleMeta
      ArticleExcerpt

CategoryPage
  PageHeader
  CategoryFeaturedBlock
  CategoryLatestBlock
  ArticleList
    ArticleCard

SearchPage
  PageHeader
  SearchForm
  SearchResultsBlock
    SearchResultCard
```

Archive and category pages should share list components. Search results can
share the same card language with search-specific highlighting or metadata.

Category pages should feel curated, not like mechanical file listings. Each
category page can show a short description, latest article, optional featured
articles, and the full archive for that category.

## Component Responsibilities

### UI Primitives

UI primitives are small and boring. They should not know about articles,
categories, routing policy, or content collections.

- `Button`: action button styles for real `<button>` elements.
- `LinkButton`: link styled as a button for navigation/CTA.
- `IconButton`: icon-only action with required accessible label.
- `TextLink`: consistent inline/navigation link treatment.
- `Input`: native input styling, labels live with form components.
- `Badge`: compact metadata label, category label, tag label.
- `Separator`: semantic or visual divider.
- `Container`: max width and horizontal gutters.
- `Section`: vertical rhythm, optional tone/background band.
- `Card`: repeated item shell only, not a page section wrapper.

Primitives should support `class` pass-through, but parents should not need to
know internal selectors. Use typed props for variants and sizes.

### Media Components

Media components own stable sizing, loading policy, fallback behavior, and
accessibility requirements for non-text media.

- `EmbedFrame`: wrapper for external embeds with title, fallback link/content,
  loading policy, and stable frame.
- `ResponsiveIframe`: low-level iframe component with required `title`, stable
  aspect ratio, loading defaults, and safe attributes.

Raw `iframe` and embed markup should not spread through article, page, or block
components. Put media behavior behind these components so layout stability,
accessibility, and Lighthouse requirements stay consistent.

Do not create a generic media wrapper unless repeated implementation pressure
proves it is needed. Images and embeds have different responsibilities: images
should use Astro `Image`/`Picture` through image-specific components, while
iframes and external embeds should use media-specific components.

### Layout Components

Layout components own shells and regions, not domain display.

- `BaseLayout`: document, SEO, global imports, page title/description props.
- `SiteShell`: persistent header/main/footer composition.
- `MainFrame`: page grid, sidebar/content relationship, skip target.
- `PageFrame`: generic page width and rhythm.
- `SiteHeader`: header layout only, composed from navigation components.
- `SiteFooter`: footer links and copyright.

Layout components should rely on slots and normalized props. They should not
fetch content directly except at a clearly documented boundary.

### Navigation Components

Navigation should be redesigned as a real system rather than one header patch.

- `BrandLink`: site title/logo link.
- `PrimaryNav`: top-level links.
- `SectionNav`: category row modeled like publication sections.
- `SectionNavItem`: one category link, later able to host a dropdown.
- `SearchForm`: reusable search form for header, mobile menu, and search page.
- `SupportLink`: Patreon CTA as a link/button primitive.
- `ThemeToggle`: smallest interactive boundary for theme toggling.
- `MobileMenu`: all-items fallback for constrained layouts.
- `DiscoveryMenu`: complete topic/article discovery surface for constrained
  viewports or nav-triggered browsing.
- `CategoryTree`: reusable nested category/article tree.
- `CategoryGroup`: one disclosure group for a category.
- `CategoryDropdown`: future desktop category preview menu.
- `CategoryPreviewList`: short recent/featured article list for a category.

The category tree should accept data. It should not call `getCategories()` by
itself unless there is a deliberate wrapper component such as
`SiteCategoryNavData.astro`.

Start with section nav links before adding dropdowns. Build the components so a
section item can later render a preview dropdown, but do not make the first
implementation depend on complex menu behavior.

### Article Components

Article components own article display and metadata presentation.

- `ArticleLayout`: page shell for an article entry.
- `ArticleHeader`: title, category, description, meta composition, and quiet
  article utilities such as `Cite`, `Share`, and `PDF`.
- `ArticleShareMenu`: article-header share utility built from the centralized
  `src/lib/share-targets.ts` endpoint model; it must not hard-code platform
  URLs or load third-party share SDKs.
- `ArticleMeta`: author/date/category/tag metadata row.
- `ArticleProse`: Tailwind Typography wrapper for rendered Markdown/MDX.
- `ArticleCard`: flat editorial article row for archive/search/latest-post
  surfaces, with condensed mobile rows and bounded thumbnails when images
  exist. Long list titles use stable density variants before falling back to a
  two-line ellipsis clamp.
- `ArticleList`: list semantics, separator rhythm, and spacing for repeated
  article rows.
- `ArticleImage`: future MDX figure/image abstraction.
- `ArticleTags`: optional tag display once tags become public UI.
- `ArticleReferences`: article-local owner for notes and bibliography sections.
- `ArticleFootnotes`: explanatory note section rendered from normalized
  `note-*` reference data.
- `ArticleBibliography`: article-local source citation section rendered from
  normalized `cite-*` reference data.
- `ArticleReferenceBacklinks`: shared return-link UI for notes and citations.
- `MoreInCategoryBlock`: natural continuation from the current article.
- `RelatedArticlesBlock`: curated or metadata-driven related reading.
- `ArticleEndcap`: after-article reading/support region.
- `LatestArticleBlock`: homepage or sidebar latest article block.

Article components should receive `ArticleEntry` only where that is simpler and
clear. Lower components can receive normalized display props if that prevents
route/content logic from leaking downward. Reference components must receive
normalized note/citation data; they should not parse Markdown source, inspect
article body text, or infer citations from ordinary prose links.

### Page And Block Components

Page components are generic content surfaces. Blocks are reusable page sections.

- `MarkdownPage`: generic page content renderer.
- `PageHeader`: title/description for non-article pages.
- `PageProse`: prose wrapper for non-article Markdown.
- `FlatArticleList`: flat compact publishable-entry rail for homepage/sidebar
  surfaces.
- `FlatArticleTeaser`: one compact publishable-entry teaser.
- `HomeHeroBlock`: homepage identity and primary actions.
- `HomeFeaturedCarousel`: static-first featured carousel.
- `HomeFeaturedSlide`: one normalized featured publishable entry.
- `HomeDiscoveryLinksBlock`: thin Read / Articles / Archive / Authors /
  Collections / Tags strip.
- `HomeAnnouncementBlock`: announcement image and copy.
- `HomeLatestArticleBlock`: latest article teaser.
- `HomeFeaturedArticlesBlock`: editorial start-here or featured reading.
- `HomeCategoryOverviewBlock`: homepage adapter for the shared category rail.
- `HomeArchiveLinksBlock`: entry points into archive/categories.
- `SupportBlock`: reusable support CTA.
- `CategoryOverviewBlock`: category grid or index.
- `CategoryRailBlock`: one-row category rail with scroll controls.
- `SearchResultsBlock`: search page result region.

Blocks should be content-out: they expose slots and small props, not giant
configuration objects.

## Homepage Content Model

The home page should become content-driven without losing dynamic composition.

Recommended file:

```text
site/content/pages/index.md
```

Recommended frontmatter shape:

```yaml
title: The Philosopher's Meme
description: The philosophy of memes, cyberculture, and the Internet.
heroLightImage: ../../assets/shared/tpm_home_hero_light.png
heroDarkImage: ../../assets/site/tpm_home_hero_dark.png
heroAlt: The Philosopher's Meme
announcementImage: ../../assets/site/r2021-03-22.png
announcementAlt: Announcement artwork for The Philosopher's Meme
actions:
  - label: Support Us
    href: https://patreon.com/thephilosophersmeme
    variant: primary
  - label: Join TPM Discord
    href: https://discord.gg/8MVFRMa
    variant: secondary
```

Open design question: should homepage blocks be driven by frontmatter arrays or
explicit Astro composition?

Option A, recommended for now: frontmatter for stable page data, Astro route for
block composition. This keeps authoring simple and component logic clear.

Option B: full block array in frontmatter. This gives CMS-like flexibility but
adds schema and rendering complexity.

Option C: pure Markdown page route. This is simplest but loses clean dynamic
latest-article composition and image/component control.

## Navigation Redesign Principles

The current header/sidebar should be treated as a prototype. A production-ready
navigation system should follow these rules:

- Desktop navigation should feel like an editorial publication: a compact
  utility row plus category/section navigation.
- Mobile navigation should expose all major destinations and category browsing.
- Search should have a clear home on desktop and mobile. It can be a full input
  where space allows and an icon/trigger where space is constrained.
- The support CTA should stay available without crowding primary navigation.
- RSS should usually live in the footer, not prime header space.
- Category links should be first-class because categories are publication
  sections.
- Category/article navigation should be progressive disclosure, not a giant
  always-open list on every viewport.
- The sidebar should appear only when it improves browsing, but category
  discovery must always exist somewhere on the page.
- Mobile category navigation should share the same `CategoryTree` as desktop.
- Header layout should not depend on fragile collision breakpoints.
- Preserve the full brand name on supported phone widths. Compact surrounding
  controls before abbreviating the publication title, and only add a brand
  abbreviation after an explicit product decision.

Preferred responsive model:

```text
narrow:
  BrandLink
  MobileMenu

medium:
  BrandLink
  PrimaryNav
  MobileMenu for search/categories/support if needed

wide:
  BrandLink
  PrimaryNav
  SearchForm or SearchTrigger
  ThemeToggle
  SupportLink
  SectionNav
  category dropdown discovery
```

Avoid trying to preserve every desktop header item at every width. Instead,
decide which tasks matter at each size and provide the mobile menu as a complete
fallback.

Target desktop publication nav:

```text
The Philosopher's Meme          Search  About  Support
Culture  Metamemetics  Aesthetics  Irony  Game Studies  History  Philosophy  Politics
```

Future dropdown direction:

```text
Metamemetics
  latest or featured article
  3-5 recent/featured articles
  View all Metamemetics
```

Do not put every article in a header dropdown. The header should invite
discovery, not become the full archive.

Open design question: should the category sidebar be global or archive/article
only?

Option A, recommended: show category sidebar on article/archive/category pages
and use homepage/category blocks for discovery on the homepage. This keeps
reading pages navigable without forcing every page into a documentation-site
layout.

Option B: global sidebar everywhere. This preserves the old Just the Docs
feeling but can make the site feel cramped and old-fashioned.

Option C: no persistent sidebar, only category landing pages and mobile menu.
This is cleanest visually but weakens browsing across the archive.

Key constraint: if a page does not render the sidebar, it must provide another
strong discovery surface. The homepage in particular should not hide the archive
behind only the header.

## Support UX

Support matters because it keeps the publication alive. It should be visible,
consistent, and respectful.

Use support surfaces:

- header support link on desktop when space allows;
- mobile menu support link;
- homepage support/community block;
- article-end support block;
- footer support link;
- occasional contextual support text on About or community pages.

Avoid:

- popups;
- sticky nags;
- interstitials;
- guilt copy;
- support blocks that interrupt article reading;
- visually dominating CTAs that make the site feel like a funnel.

Preferred support tone: show excellent work first, then invite readers to help
keep the archive and publication alive.

## Discovery And Retention

The site should keep readers moving through the archive without feeling
manipulative.

Required discovery surfaces:

- section/category nav;
- homepage latest and featured articles;
- homepage category overview;
- article-end "more in this category";
- category landing pages;
- search page;
- useful footer links.

Optional later surfaces:

- category dropdown previews;
- curated reading paths;
- "start here" collections;
- related articles by tags or manual curation;
- previous/next within a category.

Avoid making any single surface load-bearing. If the sidebar disappears on a
page or viewport, section nav, mobile menu, page blocks, and footer links should
still keep discovery strong.

## SEO And Sharing

Component architecture should support machine-readable publication quality, not
only visual rendering.

Every page shell should make it easy to provide:

- unique title;
- description;
- canonical URL;
- Open Graph metadata;
- Twitter/social card metadata;
- RSS/sitemap inclusion where appropriate;
- JSON-LD for article pages;
- semantic headings and landmarks.

Article and category components should preserve enough metadata to support rich
snippets and social sharing. SEO should not require page-specific copy/paste.

Social preview images are generated metadata assets, not raw article source
assets. Article and announcement pages should route preview images through the
social preview image pipeline documented in `docs/SOCIAL_PREVIEW_IMAGES.md` so
`og:image`, `twitter:image`, and article JSON-LD stay small, crawler-compatible,
and consistent without asking authors to manage separate preview files.

## Lighthouse And Page Quality Contracts

Lighthouse quality should be designed into components instead of patched after
audits fail. Component APIs should make performance, accessibility, best
practices, and SEO the default path.

Performance and layout stability:

- Media components must reserve space with width/height, `aspect-ratio`, or a
  stable frame. This applies to article images, hero images, card images,
  embeds, iframes, and future media blocks.
- Likely LCP images must not be lazy-loaded. Hero and primary images should use
  Astro `Image`/`Picture`, right-sized sources, and `fetchpriority="high"` only
  when they are truly likely to be the LCP element.
- Below-the-fold images and embeds should lazy-load by default.
- Components must not inject content above the reader after load unless the
  space was already reserved.
- Avoid large DOM discovery surfaces. Header dropdowns should preview a few
  recent/featured articles, not render the full archive.
- Third-party scripts are disallowed by default. Support, Discord, social, and
  donation destinations should be plain links unless there is an explicit
  product and performance decision.

Accessibility and interaction:

- Accessibility is part of component API design. For example, `IconButton`
  should require a label, and current navigation links should expose
  `aria-current` where appropriate.
- Interactive components must define keyboard behavior, focus behavior,
  pointer/touch behavior, and no-hover access before shipping.
- Popover, dialog, menu, and disclosure components must pass keyboard and axe
  checks before merge.
- Links remain links when they navigate. Buttons are for actions.
- Motion must be optional and respect `prefers-reduced-motion`.

SEO and best practices:

- Page metadata should flow through `SiteHead`/SEO helpers, not per-route
  copy/paste.
- Article dates should render with machine-readable `<time datetime>`.
- Captioned images should use `figure`/`figcaption` through article/media
  components.
- Embeds should use a dedicated component that requires title, stable sizing,
  loading policy, and fallback content.
- Font choices should stay boring: minimal families, weights, and styles; good
  fallbacks; no layout-shifting font behavior.

## Styling Strategy

Long-term styling should move away from global component selectors.

Keep in global CSS:

- Tailwind imports.
- Tailwind plugins and variants.
- `@theme` tokens.
- light/dark CSS variables.
- `html`, `body`, focus, skip link if not componentized.
- rare media defaults such as responsive iframe behavior.

Move out of global CSS over time:

- `.button` -> `Button` and `LinkButton`.
- `.site-header` and header children -> `SiteHeader` components.
- `.sidebar` and `.category-*` -> navigation components.
- `.archive-*` -> article list/card components.
- `.category-card` -> card/list components.
- page section spacing -> `Section` and page/block components.

Tailwind utility lists belong in components. If a class list repeats, extract a
component. Do not create global CSS classes as the first response to repetition.

## Theme And Design Tokens

Maintainable visual configurability is part of the component architecture. The
site should be easy to retheme without rewriting every component, but components
should not become open-ended style configuration objects.

Theme ownership:

- `src/styles/global.css` owns Tailwind imports, theme variables, semantic color
  tokens, radius tokens, shadow tokens, font tokens, dark-mode variables, and
  document-level base behavior.
- UI primitives own reusable visual variants such as button tone, size, density,
  and emphasis.
- Domain components own layout and content presentation, but should consume
  primitives and semantic tokens instead of hard-coded palette values.
- Page blocks compose existing primitives and components. They should not
  introduce one-off theme systems.

Default theming rules:

- Prefer semantic utilities such as `bg-background`, `text-foreground`,
  `border-border`, `text-muted-foreground`, `bg-card`, and `text-primary`.
- Prefer changing tokens when the site-wide look changes.
- Prefer component variants when one component needs a finite set of visual
  modes.
- Avoid exposing raw class strings as the primary customization API unless the
  component is a low-level primitive.
- Avoid large appearance prop clusters. Use named variants such as `tone`,
  `size`, `density`, `layout`, or `emphasis` when the choices are real design
  states.
- Avoid hard-coded palette classes in first-party UI unless a one-off editorial
  treatment is intentional and documented by the component.
- Keep light and dark mode behavior token-driven whenever possible. Use explicit
  `dark:` utilities only when the relationship changes, not merely because the
  color value changes.

The desired outcome is controlled flexibility: changing the publication's
palette, radius, typography, or emphasis should be mostly token work; changing a
component's allowed visual forms should be a small variant update; changing page
composition should not require editing global CSS.

## Data Boundaries

Use `src/lib` for content normalization and route helpers. UI components should
not parse IDs, dates, categories, or image paths themselves.

Recommended data flow:

```text
content collection entry
  src/lib/content.ts filters/sorts
  src/lib/routes.ts normalizes display values and URLs
  route loads data
  route passes normalized props or entries to layout/block
  component renders semantic HTML
```

Where components accept entries, they should do so deliberately. For example,
`ArticleHeader` can accept an `ArticleEntry` because article metadata is its
domain. `Button` should never receive article entries.

Navigation should have a normalized data boundary. The same category/link data
should feed `SectionNav`, `MobileMenu`, `DiscoveryMenu`, homepage category
blocks, category pages, and footer category links. Avoid each component
independently shaping content collection entries.

Recommended navigation data:

```ts
interface SectionNavItem {
  articles: ArticleSummary[];
  description?: string;
  href: string;
  slug: string;
  title: string;
}

interface ArticleSummary {
  date?: Date;
  description?: string;
  href: string;
  title: string;
}
```

The exact type can change, but the principle should not: components receive
display-ready data and render it.

## Hydration And Interaction

Default to static Astro components. Use browser JavaScript only where the user
experience requires state after page load.

Expected interactive boundaries:

- Theme persistence.
- Mobile menu disclosure if native `details` is not enough.
- Search enhancement through Pagefind on `/search/`.
- Hover image links in MDX articles.
- Future article-specific MDX widgets.

Do not hydrate:

- page shells;
- article prose;
- article cards;
- archive lists;
- static navigation links;
- static home blocks.

If a Radix/shadcn component is needed, isolate it in a small React island and
keep the rest of the page static.

Static interaction preference:

- Use ordinary links for navigation.
- Use native `details`/`summary` for simple disclosure.
- Consider HTML `popover` for nav-triggered discovery panels or search panels
  if browser support and accessibility are acceptable for the target audience.
- Avoid checkbox hacks unless there is a specific accessibility-reviewed reason.
- Use Radix/shadcn only when native HTML cannot provide the required behavior
  cleanly.

Native HTML and CSS notes worth remembering:

- Use `details name="..."` when a JS-free accordion group is enough.
- Use `<search>` around site-search UI instead of adding `role="search"` to a
  generic wrapper.
- Use `color-scheme` with the theme system so browser UI such as form controls
  and scrollbars matches light/dark mode.
- Use `text-wrap: balance` selectively for short editorial headings, titles,
  and CTA text. Do not apply expensive text wrapping broadly to long prose.
- Treat HTML `popover` and CSS anchor positioning as candidates for future
  dropdown/search/hover positioning, but verify accessibility and browser
  behavior before relying on them.

## Responsive Contracts

Each component should document or encode:

- smallest useful layout;
- wide layout enhancement;
- wrapping strategy;
- long text behavior;
- missing/empty content behavior;
- focus and keyboard behavior if interactive;
- dark mode behavior;
- media aspect ratio and object-fit behavior.

Examples:

- `ArticleCard`: title density variants and excerpt clamps preserve
  scannability, metadata stays subordinate inside the text column, optional
  preview images stay bounded, and no-image rows expand instead of leaving
  blank media space.
- `PrimaryNav`: links wrap or collapse according to parent composition; it does
  not own the mobile menu decision.
- `CategoryTree`: long article titles wrap inside the available width; details
  state is accessible; active/current item is visually clear.
- `SectionNav`: categories fit as a section row on wide screens; at narrower
  widths it can scroll, wrap, or move into `MobileMenu`, but it must not collide
  with search/support/header actions.
- `SearchForm`: input has `min-w-0`, label is accessible, button is optional or
  visually hidden depending on context.
- `HomeHeroBlock`: image fills its container, actions wrap, text remains readable
  without viewport-scaled font sizes.
- `ThemedImage`: uses equivalent light/dark artwork through Astro's image
  pipeline and lets the parent own measure, caption, and semantic placement.
- `SupportBlock`: visible without dominating the reading flow; clear CTA;
  secondary copy stays short and does not push article continuation below
  unrelated promotional content.

## Accessibility Contracts

Components should produce good HTML by default.

- Links navigate; buttons act.
- Icon-only buttons require an accessible label.
- Navigation regions have useful `aria-label` values.
- Disclosure components use native `details`/`summary` or correct ARIA.
- There is one `h1` per page.
- Heading levels follow document structure.
- Prose images have useful alt text or explicit decorative alt.
- Focus states are visible in light and dark mode.
- Hover-only interactions also work with focus/click/touch.
- Dropdown or popover discovery menus are keyboard reachable, dismissible, and
  not required to access category pages.

## Engineering Excellence Bar

The component system should make good implementation easy and poor states hard
to represent.

- Prefer small components with explicit ownership over broad "smart" components.
- Prefer typed props and discriminated variants over boolean clusters.
- Prefer slots for content and props for stable variants.
- Keep visual components free of parsing and data cleanup.
- Normalize content and route data before it enters UI components.
- Keep class strings statically visible to Tailwind.
- Use semantic tokens instead of hard-coded palette values.
- Use container queries for portable components and viewport breakpoints for
  page-level layout shifts.
- Design empty, missing, long, and disabled states before calling components
  complete.
- Do not add a dependency to avoid understanding a simple UI problem.
- Do not hide layout problems with overflow clipping, absolute positioning, or
  arbitrary breakpoints.
- Keep generated HTML meaningful without client JavaScript.
- Keep component APIs boring enough that future redesigns are mostly
  recomposition, not rewrites.

## Development Readiness

This plan is ready to implement when work proceeds in small slices that keep
reader value, publication quality, and static output visible at every step.

New public component work starts with a one-pager under `docs/components/`.
That tree mirrors `src/components/`, and each one-pager documents the
component's purpose, public contract, parent/sibling relationships, layout and
responsive behavior, layering, states, accessibility semantics, theme behavior,
edge cases, and testable invariants.

The expected sequence is:

1. Add or update the one-pager.
2. Add or update the component catalog example.
3. Implement the component.
4. Add render, invariant, accessibility, and interaction tests that prove the
   documented behavior.

If implementation review finds a brittle or questionable decision, record it in
the relevant one-pager or in this architecture document. Do not silently make
accidental prototype behavior the design contract.

Every new public component must ship with:

- a one-pager that names layout, responsive, state, layering, theme, and
  accessibility invariants;
- a component catalog example using realistic and hostile fixture data;
- an isolated render test for structure, semantics, variants, and empty states;
- Playwright invariant tests when layout, scrolling, layering, focus, theme, or
  interaction behavior is part of the contract;
- keyboard and axe/a11y coverage when interactive.

Each implementation slice should satisfy these conditions:

- The route stays thin: load data, render content, compose layouts/blocks.
- The new component has a narrow responsibility and typed props.
- The component owns its responsive behavior instead of relying on page-level
  patches.
- The component renders meaningful static HTML before any JavaScript runs.
- Tailwind classes are statically visible and use semantic tokens where
  possible.
- Empty, missing, long-title, narrow-width, wide-width, light-mode, and
  dark-mode states have been considered.
- Discovery and support behavior is intentional: the component either helps
  readers find more work, read comfortably, support the publication, or stay out
  of the way.
- Any new interaction has a keyboard and touch story before it ships.
- Any new dependency has a clear job that native Astro, HTML, CSS, or Tailwind
  cannot do as well.

Avoid building these until the component foundation is stable:

- full CMS-style homepage block arrays;
- personalized recommendations;
- sticky support prompts;
- popups or interstitial support asks;
- header dropdowns that contain the full archive;
- client-side routing;
- framework islands for static navigation or prose;
- broad global selectors for component styling.

The first production pass should optimize for durable structure, not final
visual polish. Once primitives, navigation data, layout shells, article cards,
article endcaps, and homepage blocks are separated cleanly, visual iteration
should become much safer.

## Reliability Gates

Reliability checks should protect product intentions, not incidental markup.
Prefer explicit contracts over broad screenshots when the relationship can be
asserted directly.

Current gates should cover:

- route helpers for every internal URL shape;
- content schema validity and the single published-content filter;
- generated route smoke checks through the sitemap and critical endpoints;
- semantic landmarks: one main, skip link target, one h1, named navigation
  landmarks, footer landmark, and accessible link/button names;
- layout invariants for page measures, sidebar/header layering, homepage
  section alignment, article-end ordering, and no horizontal overflow;
- page-framing reuse for archive, category index, category detail, search, and
  homepage discovery surfaces, so comfortable measures come from shared
  components rather than route-specific width decisions;
- catalog examples in light and dark mode with long text, dense lists, empty
  states, missing content, short viewports, and narrow containers;
- build-output guards for accidental catalog output, dated page leaks, broken
  internal links, source maps, unexpected hydration boundaries, draft leaks,
  missing JSON-LD, and unintended client scripts on static reading pages;
- asset integrity for project-owned images under `site/assets/`, approved
  `site/public/` files only, and alt text or documented alt exceptions.

State modeling audit: current public components should avoid boolean clusters
for mutually exclusive states. If a component can be `empty`, `ready`, `error`,
`loading`, `expanded`, `collapsed`, `selected`, or `current`, model that as a
single typed state or as narrow semantic props whose combinations are valid.
When that is not possible, document the reason in the component one-pager.

Exception policy: any intentionally untested, untestable, or deliberately
rule-breaking case must be documented near the code or in the relevant
exception ledger, then called out during handoff. Do not lower a gate or add an
ignore entry silently.

Regression policy: every layout, accessibility, routing, content, performance,
or interaction bug fix should add a focused invariant or contract test for the
underlying intention.

Performance review remains review-only unless explicitly promoted to release
blocking. Use the existing Lighthouse/performance checks to watch page weight,
client JavaScript, image sizing, LCP candidates, and CLS-sensitive layout
changes. Do not mutate production output in post-build performance scripts.

## Component Catalog

The project should maintain a component catalog. The first implementation
should be dev-only: a manual review surface, a design-system reference, and a
test harness for canonical component states.

Longer term, the catalog could become a public editorial/design feature: a
shadcn-style component gallery that explains the site's blocks, shows live
examples, and lets readers/developers inspect or copy useful patterns. Treat
that as deferred product work. The private QA catalog should come first so the
component system becomes stable before the public version makes any promises.

The catalog should show:

- UI primitives;
- layout shells and containers;
- navigation components;
- article components;
- homepage/content blocks;
- prose styles;
- theme tokens;
- light and dark mode examples;
- narrow, medium, and wide containers;
- long text and long-title states;
- empty and missing-content states;
- focus states and keyboard-reachable states;
- image/media frame variants;
- support CTA variants.

Catalog examples should be curated and explicit. Do not auto-render every
component with fake empty props. Good examples explain the intended component
contract by showing realistic data, edge cases, and supported variants.

Recommended structure:

```text
src/catalog/
  catalog.config.ts
  examples/
  ComponentCatalog.astro
  CatalogSection.astro
  CatalogExample.astro

src/pages/catalog/[...path].astro
  enabled only for catalog builds
```

Catalog build rules:

- Normal production builds must not include the catalog.
- A dedicated environment variable such as `PLATFORM_COMPONENT_CATALOG=true` should
  enable catalog routes.
- Use a tracked `.env.catalog` file for catalog builds with
  `PLATFORM_COMPONENT_CATALOG=true` and `ASTRO_TELEMETRY_DISABLED=1`.
- Catalog scripts should load `.env.catalog` with Bun's `--env-file` flag so
  they remain cross-platform.
- Add a release verification guard that fails if `dist/catalog` appears in a
  normal production build.
- Add `catalog-dev`, `catalog-build`, `catalog-preview`,
  `catalog-preview-fresh`, and `catalog-check` scripts when the catalog is
  implemented.
- `catalog-preview-fresh` should build with the catalog enabled, then preview
  the built output for production-like manual review.
- If the catalog later becomes public, replace the private build gate with an
  intentional public route, editorial copy, copyable examples, and the same QA
  coverage expectations. Do not accidentally expose the internal QA catalog as
  the public version.

Catalog coverage:

- Use `just catalog-check`.
- Scan `src/components/**/*.{astro,tsx}` for public components.
- Compare discovered components with explicit catalog entries.
- Allow an ignore list for internal wrappers, generated components, or
  components that are intentionally not user-facing.
- Require ignore-list entries to include a short reason.
- Keep this as developer/design-system QA. Do not make catalog completeness part
  of non-technical article-author submission flow.

## Component Testing Strategy

Full-site e2e tests are necessary but too coarse to protect component
architecture. Component quality should be guarded at three levels.

### Pure Logic Tests

Use `bun test` for ordinary TypeScript:

- content normalization;
- route helpers;
- navigation data shaping;
- category sorting;
- SEO metadata;
- script validators;
- QA/check runners.

Keep these fast and deterministic.

### Astro Render Tests

Use Vitest with Astro's `getViteConfig()` and the Astro Container API for
isolated `.astro` component render tests.

Use render tests for:

- UI primitives;
- semantic HTML structure;
- required labels and ARIA attributes;
- slot rendering;
- supported variants;
- empty and missing-content states;
- stable class/attribute contracts where useful.

Do not use render tests for real layout confidence. They do not prove wrapping,
viewport behavior, focus behavior, or actual browser rendering.

### Browser Harness Tests

Use Playwright against production-built output for browser behavior. In addition
to normal route-level e2e tests, point Playwright at catalog examples and
focused harness states when component behavior matters.

Use Playwright for:

- responsive layout;
- no horizontal overflow;
- disclosure/menu behavior;
- keyboard and focus behavior;
- theme switching;
- Pagefind/search behavior;
- axe accessibility checks;
- future screenshot/visual regression checks once design stabilizes.

Do not add Cypress or Nightwatch unless the project has a new requirement that
Playwright does not satisfy. Cypress is strongest when a team wants its
interactive app workflow or framework component testing. Nightwatch is strongest
when WebDriver/Selenium-grid, cloud browser infrastructure, real SafariDriver,
or native/mobile testing becomes central. Those are not current requirements
for this static Astro publication.

## Migration Sequence

This sequence minimizes risk and keeps visual changes reviewable.

1. Create primitives: `Button`, `LinkButton`, `IconButton`, `TextLink`,
   `Container`, `Section`, `Card`, `Input`.
2. Add the component catalog foundation and catalog coverage script before the
   primitive set grows large.
3. Add Vitest/Astro Container API render-test setup for isolated component
   tests.
4. Extract navigation data shape in `src/lib/navigation.ts` or extend
   `src/lib/content.ts` with a normalized nav helper.
5. Extract `SectionNav`, `CategoryTree`, and shared category link data.
6. Use `CategoryTree` in both sidebar and mobile/discovery menu.
7. Extract `SiteHeader`, `SiteFooter`, `MainFrame`, and `SiteShell` from
   `BaseLayout`.
8. Reduce `BaseLayout` to document/head/body orchestration.
9. Extract `ArticleHeader`, `ArticleMeta`, `ArticleCard`, and `ArticleList`.
10. Replace archive/category repeated markup with article list/card components.
11. Add `ArticleEndcap`, `MoreInCategoryBlock`, and reusable `SupportBlock`.
12. Add article-local reference components after the references technical
    design is approved: `ArticleReferences`, `ArticleFootnotes`,
    `ArticleBibliography`, and `ArticleReferenceBacklinks`.
13. Wire article-local references from `render(article).remarkPluginFrontmatter`
    into `ArticleLayout` without route-level Markdown parsing.
14. Add `PageLayout`, `PageHeader`, and `PageProse` for non-article Markdown
    pages.
15. Move homepage prose/data into `site/content/pages/index.md`.
16. Replace homepage section markup with home blocks: hero, announcements,
    latest, featured/start-here, category overview, support.
17. Move remaining component-specific global CSS into Tailwind component
    classes.
18. Revisit sidebar/header visual design once ownership boundaries are clean.
19. Add category dropdown previews only after section nav and discovery blocks
    are stable.

Each step should be independently buildable and testable. Avoid combining a
large visual redesign with a large component extraction unless there is no
reasonable way to separate them.

## QA Expectations

Every component extraction should keep these checks green:

- `just typecheck`
- `just lint`
- `just format-code`
- relevant pure logic tests;
- relevant Astro component render tests once that harness exists;
- `catalog-check` once the catalog exists;
- `just build`

Before merging a navigation/sidebar redesign, also run browser checks and
manually inspect:

- narrow mobile;
- tablet-ish widths;
- wide desktop;
- short viewport height;
- light and dark mode;
- long article titles in nav/sidebar;
- category disclosure behavior;
- section nav wrapping/collapse behavior;
- support CTA visibility without domination;
- article-end next-step behavior;
- no horizontal overflow.

When catalog examples exist for changed components, inspect the catalog in a
fresh production preview. Prefer a command like:

```shell
just catalog-preview-fresh
```

## Open Questions

### Sidebar Scope

Recommendation: keep sidebar/category-tree discovery as a core component, but
do not require the same sidebar placement on every page. Show it on
article/archive/category pages where it improves reading and browsing. On the
homepage, use stronger in-page discovery blocks and section navigation unless a
wide-layout sidebar clearly improves the editorial front page.

Reasoning: the category tree is valuable, but a global docs-like sidebar can
make the site feel less like an editorial publication. Discovery must remain
strong even when the sidebar is absent.

### Homepage Content Model

Recommendation: keep `src/pages/index.astro` as composer and move prose/data to
`site/content/pages/index.md`.

Reasoning: this keeps author-facing content editable in Markdown while allowing
dynamic latest-article data and Astro image components.

### Navigation Interaction

Recommendation: start with semantic static navigation, section/category links,
and native `details`/`summary` for category disclosure where needed. Consider
HTML `popover` for nav-triggered search/discovery panels after testing browser
support and accessibility. Upgrade to a small island or Radix only if native
behavior is insufficient.

Reasoning: native disclosure is static-friendly and accessible enough for a
first production pass when styled carefully.

### Category Dropdowns

Recommendation: design `SectionNavItem` so dropdowns can be added later, but
ship simple category links first.

Reasoning: dropdowns are promising for discovery, but they should preview a few
recent/featured articles, not become the full archive. Building the basic
section nav first gives us a stable surface to enhance.

### Global CSS End State

Recommendation: keep global CSS for tokens and base behavior only. Move all
component-specific selectors into components over time.

Reasoning: Tailwind component boundaries make future redesigns easier and avoid
selector coupling.

### Visual Redesign Timing

Recommendation: decompose first, then redesign header/sidebar.

Reasoning: ownership boundaries will make visual iteration faster and safer.
The current header/sidebar are hard to reason about because structure, styles,
and data are coupled.

### Footer Role

Recommendation: make the footer a useful publication footer with Articles,
categories, About, RSS, Discord/community, and Support.

Reasoning: moving low-frequency utility links such as RSS out of the header is
only safe if the footer is genuinely useful and easy to find.
