# Component Refactor And Consistency Audit

## Purpose

This audit identifies component refactor opportunities that improve visual
consistency, maintainability, configurability, and future platform reuse without
starting implementation. The site is stable enough that refactors should now be
chosen by architecture value, not by whichever component was edited most
recently.

The target is a general-purpose static editorial/blogging platform with a TPM
configuration layered on top. That means components should make common
publication patterns easy to assemble, while route files and site-specific
config choose content, labels, routes, and feature flags.

## Audit Method

Evidence came from:

- Inventorying `src/components`, `src/layouts`, `src/pages`, `src/lib`, and
  relevant docs.
- Inspecting repeated Tailwind class clusters and component patterns.
- Reviewing large and high-risk components such as `ArticleLayout`,
  `ArticleCard`, `ArticleHeader`, `HomeFeaturedCarousel`, `CategoryRailBlock`,
  `ArticleCitationMenu`, and `ArticleShareMenu`.
- Checking for catalog-only or legacy components that are no longer used by
  public routes.
- Comparing current implementation against the target architecture in
  `agent-docs/COMPONENT_ARCHITECTURE.md`.
- Re-checking the codebase after Milestones A-F landed, especially the new
  section/action primitives, compact lists, rails, action popovers, support
  view model, and article page view model.

The repeated-class scan is only a signal, not a refactor prescription. Exact
class duplication often indicates a missing primitive, but some duplication is
healthier than forcing unrelated UI into one abstraction.

## Executive Summary

The current component foundation is much better than the early prototype. The
site already has useful primitives for buttons, links, layout bodies, section
stacks, anchored popovers, article lists, publication metadata, horizontal
rails, and support CTAs. The next improvements should be consolidation work,
not a rewrite.

The highest-value silent refactors are:

1. Add a shared section heading/section-action primitive.
2. Consolidate compact publishable-entry lists used by homepage panels,
   announcements, start-here lists, and recent lists.
3. Extract generic horizontal rail behavior from category-specific rail cards.
4. Add a higher-level action popover/menu primitive over the existing anchored
   primitives.
5. Consolidate button/link variant class maps.
6. Consolidate metadata/kicker rendering across article cards, flat lists,
   featured slides, bibliography source rows, and home panels.
7. Split article header actions into a small action-row/trigger layer without
   merging cite, share, and PDF domain behavior.

Status after the first refactor tranche: items 1-5 and 7 are implemented.
Item 6 is partially implemented through `EntryMetaLine`, but rich article rows,
featured slides, and bibliography/source rows still have enough metadata and
media policy differences to justify a second pass rather than a rushed
unification.

The highest-value non-silent or design-sensitive work is:

1. Standardize section header rhythm across article endcaps, archive pages,
   homepage panels, bibliography, and browse pages.
2. Decide the canonical compact list style for publishable entries and use it
   across announcements, collections, article index side panels, and future
   platform blocks.
3. Create a platform-facing homepage recipe so TPM can configure content
   without baking labels, support/social choices, or block ordering into
   components.
4. Decide whether unused/catalog-only prototype blocks should be retired,
   replaced by current components, or kept as intentional catalog fixtures.

Status after Milestones A-F: the component foundation is now strong enough for
a second-pass platformization audit. The next work should focus less on
individual Tailwind clusters and more on page recipes, route-level view models,
config schema boundaries, catalog lifecycle, and rich publishable-entry media
contracts.

The highest-risk areas should not be refactored broadly yet:

- `ArticleImage` and PDF/image-inspector behavior.
- `ArticleTableOfContents` and generated references/bibliography behavior.
- `SiteHeader` mobile/desktop priority layout.
- `HomeFeaturedCarousel` internals beyond small control/list primitives.
- `ArticleLayout` orchestration until smaller primitives exist.

This does not mean those areas are frozen. It means the parent system should
not be reorganized until smaller child boundaries are obvious and tested.
Behavior-preserving sub-component extraction is still encouraged when it
removes duplicated implementation detail or isolates a clear invariant.

## Ideal Direction

The component system should move toward this shape:

```text
Routes
  load content, config, and view models
  compose page layouts and blocks

Layouts
  define page shells and reading/browsing constraints

Blocks
  define publication sections such as hero, archive list, support, rails

Domain Components
  render entries, metadata, actions, references, menus, and media

UI Primitives
  render buttons, links, popovers, rails, section headers, panels, and surfaces
```

The main goal is not fewer files. The goal is fewer places where a developer has
to remember the same responsive, accessible, or configurable behavior by hand.

## Abstraction And Subcomponent Policy

Use two complementary refactor moves:

1. Generalize repeated components into a shared primitive when several
   components independently implement the same design contract.
2. Split a complex component into sub-components when a child concern has a
   clear name, stable inputs, independent states, and useful tests or catalog
   examples.

Both moves are valid. The project should avoid two opposite failure modes:

- leaving every behavior embedded in page-sized components, which makes
  regressions likely and future platform configuration expensive;
- extracting vague mega-components that hide domain rules behind boolean props
  and make the UI harder to reason about.

Good abstraction candidates usually satisfy most of these conditions:

- The extracted piece has a product/design name, such as section header,
  compact entry row, metadata line, scroll rail, action menu item, brand CTA,
  panel surface, or table-of-contents link.
- The component owns a real invariant: containment, wrapping, focus ring,
  disabled state, empty state, long-label handling, image aspect ratio, panel
  placement, or responsive collapse.
- The API can be typed with a small prop surface and optional slots, not a
  cluster of unrelated booleans.
- The component can be tested in the catalog or with focused unit/e2e tests.
- The extraction preserves semantic HTML and accessibility behavior.
- The component can accept site-specific labels, routes, assets, or feature
  flags from a route/view-model boundary instead of importing TPM config
  directly.

Poor abstraction candidates usually have one or more of these traits:

- The only reason to extract is line count.
- The new component would be named after styling rather than intent, such as
  "box", "wrapper", or "thing".
- It would require callers to understand the parent component's internal
  layout algorithm.
- It would combine unrelated domains, such as article PDF image selection and
  browser image inspection, just because both involve images.
- It would make one current use case cleaner while making likely future
  platform configuration harder.

Prefer layered extraction:

```text
Stable UI primitive
  -> Domain component
  -> Block
  -> Layout/Page composition
```

Do not jump from a large component straight to a fully generic platform API.
Extract the stable child pieces first, then revisit the parent once the smaller
contracts are proven.

## Developer Handoff: First Implementation Pass

The first implementation pass should be a behavior-preserving foundation
refactor. It should not change visual design, page information architecture,
content rules, routing, or feature policy.

Recommended branch scope:

1. `SectionHeader`
2. Button/link variant maps
3. `BrandButton`
4. Article action row/trigger extraction
5. Metadata-line extraction only if it remains small and behavior-preserving

Do not include compact lists, rails, article images, TOC, homepage recipe work,
or `ArticleLayout` view-model extraction in the first pass. Those are follow-up
milestones.

### A1: Add `SectionHeader`

Create:

- `src/components/ui/SectionHeader.astro`

Suggested public API:

```ts
interface Props {
  actionAriaLabel?: string | undefined;
  actionHref?: string | undefined;
  actionLabel?: string | undefined;
  class?: string | undefined;
  description?: string | undefined;
  eyebrow?: string | undefined;
  headingId: string;
  headingLevel?: 1 | 2 | 3 | 4;
  layout?: "stacked" | "split";
  prefetch?: "hover" | "load" | "tap" | "viewport" | boolean;
  size?: "page" | "section" | "compact";
  title: string;
}
```

Slots:

- default slot is not needed for the first pass.
- named `action` slot is acceptable if the link props are too limiting.

First migration targets:

- `src/components/articles/endcap/NextArticleBlock.astro`
- `src/components/articles/endcap/MoreInCategoryBlock.astro`
- `src/components/articles/endcap/RelatedArticlesBlock.astro`
- `src/components/articles/references/ArticleBibliography.astro`

Leave these for a later migration:

- `src/components/blocks/listing/ArchiveListBlock.astro`
- `src/components/blocks/terms/TermOverviewBlock.astro`
- `src/components/articles/lists/FlatArticleList.astro`
- `src/components/pages/PageHeader.astro`

Acceptance criteria:

- Existing heading ids are preserved.
- Existing action labels and URLs are preserved.
- The article endcap still renders the same block order.
- The bibliography heading still renders "View Site Bibliography" only when
  bibliography is enabled.
- Mobile wrapping remains readable and does not introduce horizontal overflow.
- The component does not import `siteConfig`.

Stop conditions:

- If a migrated component needs a bespoke layout exception, do not expand
  `SectionHeader` with a one-off prop. Stop and either narrow the migration or
  leave that component unchanged.

### A2: Extract Button And Link Variant Maps

Create one helper, preferably:

- `src/components/ui/button-variants.ts`

Migrate first:

- `src/components/ui/Button.astro`
- `src/components/ui/LinkButton.astro`

Do not migrate on the first pass unless it is obviously clean:

- `src/components/ui/IconButton.astro`
- `src/components/ui/TextLink.astro`

Keep separate Astro wrappers for semantic elements. Do not replace `Button` and
`LinkButton` with a polymorphic component.

Acceptance criteria:

- `button` remains a native `button`.
- `LinkButton` remains a native `a`.
- Disabled and `aria-disabled` behavior remain distinct.
- `_blank` safety behavior remains in `LinkButton`.
- Class output is intentionally equivalent, except for harmless ordering
  changes from class composition.

Stop conditions:

- If supporting `IconButton` or `TextLink` makes the helper abstract over
  unrelated concepts, keep the helper limited to button-like controls.

### A3: Add `BrandButton`

Create:

- `src/components/ui/BrandButton.astro`

Migrate wrappers:

- `src/components/ui/PatreonButton.astro`
- `src/components/ui/DiscordButton.astro`

Suggested public API:

```ts
interface Props extends HTMLAttributes<"a"> {
  asset: ImageMetadata | string;
  backgroundClass?: string | undefined;
  href: string;
  hoverBackgroundClass?: string | undefined;
  label: string;
  logoClass?: string | undefined;
}
```

The exact prop names can change, but the wrapper components should remain thin
and brand-specific. The low-level primitive should know how to render a branded
link frame; it should not know TPM's Patreon or Discord URLs.

Acceptance criteria:

- Patreon and Discord buttons keep the same dimensions, radius, focus behavior,
  and decorative image alt behavior.
- Brand wrappers remain the public imports used by support/home blocks.
- External link safety behavior is preserved.

Stop conditions:

- If the primitive needs brand-specific conditionals, keep the duplication
  until a cleaner API is obvious.

### A4: Extract Article Action Row/Trigger

Create one or both:

- `src/components/articles/actions/ArticleHeaderActionRow.astro`
- `src/components/articles/actions/ArticleHeaderActionTrigger.astro`

First migration targets:

- the cite trigger in `src/components/articles/actions/ArticleCitationMenu.astro`;
- the share trigger in `src/components/articles/actions/ArticleShareMenu.astro`;
- the PDF link in `src/components/articles/header/ArticleHeader.astro`, only if the
  same trigger primitive can support link semantics cleanly.

Acceptance criteria:

- Cite/share popover target attributes and data hooks are preserved.
- PDF remains a normal link with the same accessibility label and download
  behavior.
- The article action row still wraps safely on small screens.
- No action component imports citation/share view-model code.

Stop conditions:

- If one primitive cannot support both button triggers and link actions without
  muddying semantics, split into `ArticleActionButton` and `ArticleActionLink`
  or keep PDF unchanged.

### A5: Metadata-Line Extraction

This is optional in the first pass. Start only if A1-A4 are clean.

Create:

- `src/components/ui/MetadataLine.astro` or
  `src/components/articles/lists/EntryMetaLine.astro`

First migration targets:

- `src/components/articles/lists/FlatArticleTeaser.astro`
- `src/components/blocks/home/HomeFeaturedSlide.astro`

Do not migrate first:

- `src/components/articles/lists/ArticleCard.astro`
- `src/components/articles/header/ArticleMeta.astro`

Acceptance criteria:

- Separator style is explicit.
- Missing metadata items do not leave dangling separators.
- Linked and unlinked items are both supported.
- Wrapping remains readable at narrow widths.

Stop conditions:

- If the primitive needs to understand article authors, categories, dates,
  bibliography sources, and counts all at once, it is too broad. Narrow the
  first pass to one metadata family.

### First-Pass Verification

Minimum checks:

- `bun --silent run format`
- `bun --silent run lint`
- `bun --silent run typecheck`
- `bun --silent run check`

Add targeted tests when behavior is touched:

- article header/action e2e checks if cite/share/PDF markup changes;
- component catalog examples for new primitives;
- a11y checks if focus, popover triggers, or link/button semantics change.

Manual review targets:

- one article with cite/share/PDF actions;
- one article with bibliography;
- homepage support CTA row;
- article endcap support/next/more-in-category blocks;
- mobile width around 320px and tablet width around 768px.

Do not declare the first pass complete if a visual difference is found but not
documented as intentional.

## Ranked Refactor Candidates

### 1. Section Header And Section Action Primitive

Status: silent refactor candidate.

Value: very high.

Risk: low.

Evidence:

- `src/components/articles/endcap/NextArticleBlock.astro`
- `src/components/articles/endcap/MoreInCategoryBlock.astro`
- `src/components/articles/endcap/RelatedArticlesBlock.astro`
- `src/components/articles/references/ArticleBibliography.astro`
- `src/components/articles/lists/FlatArticleList.astro`
- `src/components/blocks/listing/ArchiveListBlock.astro`
- `src/components/blocks/terms/TermOverviewBlock.astro`
- `src/components/pages/PageHeader.astro`

These components repeatedly solve the same job: render a title, optional
description/eyebrow, optional right-side link, stable heading id, and responsive
spacing. The repeated fragment `flex min-w-0 flex-wrap items-end
justify-between gap-3` appears enough to justify a primitive.

Recommended shape:

- `src/components/ui/SectionHeader.astro`
- Props: `title`, `headingLevel`, `headingId`, `eyebrow`, `description`,
  `actionHref`, `actionLabel`, `actionAriaLabel`, `size`, `layout`.
- Slots: optional `action` slot for non-link actions.
- It should own heading typography, link alignment, wrapping, and ids.

Benefits:

- Keeps "View more", "View category", and "View Site Bibliography" visually
  consistent.
- Reduces heading drift across archive, homepage, article endcap, and
  bibliography surfaces.
- Makes future blocks easier for platform users and agents to assemble.

Verification:

- Unit/catalog examples for heading-only, heading plus action, heading plus
  description, long heading, and mobile wrap.
- Existing e2e/layout checks around article endcap and homepage should remain
  unchanged.

### 2. Compact Publishable Entry List Family

Status: silent refactor candidate with later visible consistency potential.

Value: very high.

Risk: medium.

Evidence:

- `src/components/articles/lists/FlatArticleList.astro`
- `src/components/articles/lists/FlatArticleTeaser.astro`
- `src/components/blocks/home/HomeRecentPostsBlock.astro`
- `src/components/blocks/home/HomeStartHerePanel.astro`
- `src/components/blocks/home/HomeCurrentPanel.astro`
- `src/pages/index.astro`

The site has several compact list variants for the same conceptual entity:
publishable entries. Announcements, start-here items, current links, featured
links, and recent article rows each render title, href, category/date/author
metadata, empty state, and optional panel description.

Recommended shape:

- `src/components/articles/lists/CompactEntryList.astro`
- `src/components/articles/lists/CompactEntryRow.astro`
- `src/components/articles/lists/EntryMetaLine.astro`
- Optional wrapper block: `src/components/blocks/shared/CompactEntryPanel.astro`

This should not become a giant article card. Keep the existing full-width
`ArticleList` and `ArticleCard` for rich article rows. The compact family should
own dense lists where thumbnails are absent and the reader is choosing from a
small curated set.

Benefits:

- Announcements and start-here collections can use the same list renderer.
- Future collections, side panels, author pages, and platform homepage blocks
  can reuse a known entry list.
- Empty-state wording, metadata separators, and link prefetch behavior become
  consistent.

Verification:

- Component catalog examples for articles, announcements, external/current
  links, empty states, long titles, missing metadata, and hidden categories.
- Existing homepage e2e checks should assert no wrap/overflow in the compact
  homepage column.

### 3. Horizontal Rail Primitive

Status: silent refactor candidate.

Value: high.

Risk: medium.

Evidence:

- `src/components/blocks/terms/CategoryRailBlock.astro`
- `src/components/blocks/home/HomeCategoryOverviewBlock.astro`
- `src/pages/articles/index.astro`
- `src/scripts/horizontal-scroll.ts`

`CategoryRailBlock` contains both generic horizontal scrolling behavior and
category-specific card rendering. The fade behavior, scroll buttons, sizing,
overflow containment, and accessibility controls are reusable. The category
card itself is only one possible rail item.

Recommended shape:

- `src/components/ui/ScrollRail.astro`
- `src/components/ui/ScrollRailControls.astro` if needed.
- `src/components/blocks/terms/TermRailBlock.astro` or `CategoryRailBlock` composed
  from `ScrollRail`.

The rail primitive should own:

- left/right controls;
- edge fade behavior;
- scroll-region accessibility;
- button disabled states;
- data hooks used by `horizontal-scroll.ts`;
- minimum item sizing contracts.

The term/category card should own:

- title;
- count;
- href;
- centered or left-aligned card content;
- pluralization.

Benefits:

- The article page and homepage can share the same rail behavior.
- Future author, collection, tag, or "featured topics" rails can avoid
  re-solving the same edge fading and scroll controls.
- Reduces future horizontal overflow regressions.

Verification:

- E2e coverage for keyboard/click controls, left/right end-state fades, touch
  scroll, and item visibility at rail boundaries.
- Component catalog examples for few items, many items, long labels, and empty
  state.

### 4. Action Popover And Menu Primitive

Status: silent refactor candidate.

Value: high.

Risk: medium.

Evidence:

- `src/components/articles/actions/ArticleCitationMenu.astro`
- `src/components/articles/actions/ArticleShareMenu.astro`
- `src/components/articles/actions/ArticleShareActionRow.astro`
- `src/components/navigation/CategoryDropdown.astro`
- `src/components/navigation/SearchReveal.astro`
- `src/components/ui/AnchoredRoot.astro`
- `src/components/ui/AnchoredTrigger.astro`
- `src/components/ui/AnchoredPanel.astro`

The anchored primitives are a good foundation. The missing layer is a
publication action-menu primitive that captures the trigger style, panel
surface, action row sizing, copy status, and icon/label alignment.

Recommended shape:

- Keep `AnchoredRoot`, `AnchoredTrigger`, and `AnchoredPanel` low-level.
- Add `ActionPopover.astro`, `ActionMenu.astro`, or `PopoverActionList.astro`
  for article header actions.
- Add `ActionMenuItem.astro` for icon plus label rows.

Benefits:

- Citation, share, and future actions such as "copy DOI", "download
  citation", "print", or "report issue" can share interaction styling.
- Makes panel placement and overflow fixes harder to accidentally diverge.
- Keeps the low-level anchored system reusable for category dropdowns and
  search while avoiding copy-pasted article action classes.

Verification:

- E2e checks for citation and share panel positioning, keyboard focus,
  popover close behavior, and mobile width.
- Unit tests for share target view models should remain independent from UI.

### 5. Button, LinkButton, IconButton Variant Consolidation

Status: silent refactor candidate.

Value: high.

Risk: low to medium.

Evidence:

- `src/components/ui/Button.astro`
- `src/components/ui/LinkButton.astro`
- `src/components/ui/IconButton.astro`
- `src/components/ui/TextLink.astro`

`Button` and `LinkButton` intentionally mirror each other, but they currently
duplicate size/tone/variant maps. Duplication is manageable now, but it becomes
platform risk as new variants and branded CTAs are added.

Recommended shape:

- Extract shared class maps into a TypeScript helper such as
  `src/lib/ui-variants.ts` or `src/components/ui/button-variants.ts`.
- Keep Astro wrappers separate for semantic elements.
- Avoid a polymorphic mega-component that obscures native `a` and `button`
  semantics.

Benefits:

- One source for tone, size, radius, focus, and disabled styling.
- Easier to add future platform themes without auditing every button wrapper.
- Keeps code readable while preserving semantic HTML.

Verification:

- Component tests/catalog snapshots for all tone/variant/size combinations.
- Existing a11y checks should confirm links remain links and buttons remain
  buttons.

### 6. Metadata And Kicker Primitive

Status: silent refactor candidate.

Value: high.

Risk: medium.

Evidence:

- `src/components/articles/header/ArticleMeta.astro`
- `src/components/articles/lists/ArticleCard.astro`
- `src/components/articles/lists/FlatArticleTeaser.astro`
- `src/components/blocks/home/HomeFeaturedSlide.astro`
- `src/components/blocks/home/HomeRecentPostsBlock.astro`
- `src/components/bibliography/BibliographySourceArticles.astro`

The site repeatedly renders small metadata lines with category, date, author,
source, count, and separators. The style differs by context, but the underlying
problem is the same.

Recommended shape:

- `src/components/articles/lists/EntryMetaLine.astro` or
  `src/components/ui/MetadataLine.astro`
- Props for items, separator style, uppercase, muted/primary tone, wrapping,
  and optional link prefetch.
- Keep article author rendering in `ArticleMeta` if author-specific behavior is
  richer than generic metadata.

Benefits:

- Prevents separator drift (`/`, border bar, gap-only, commas).
- Makes category/date/author metadata responsive and accessible by default.
- Helps future publishable types share a display vocabulary.

Verification:

- Component examples for missing category, missing date, multiple authors,
  linked and unlinked items, long metadata labels, and mobile wrapping.

### 7. Article Action Row And Action Trigger Primitive

Status: silent refactor candidate.

Value: medium-high.

Risk: low to medium.

Evidence:

- `src/components/articles/header/ArticleHeader.astro`
- `src/components/articles/actions/ArticleCitationMenu.astro`
- `src/components/articles/actions/ArticleShareMenu.astro`
- PDF action link in the article header.

The article header has several action affordances that should remain visually
aligned: cite, share, PDF, and likely future actions such as copy canonical URL,
print, issue report, or citation export. Some of this is covered by the action
popover candidate, but the trigger/action-row itself is also a distinct
sub-component opportunity.

Recommended shape:

- `src/components/articles/actions/ArticleHeaderActionRow.astro`
- `src/components/articles/actions/ArticleHeaderActionTrigger.astro` or a
  UI-level `InlineAction.astro`
- Use the existing citation/share menu components as children instead of
  merging their domain behavior.

Benefits:

- Keeps article header actions visually consistent as features change.
- Prevents PDF/link actions from drifting away from popover triggers.
- Gives the platform an obvious place to add or remove article actions based on
  configuration.

Verification:

- E2e checks for action row wrapping at mobile/tablet/desktop widths.
- Catalog examples for one action, several actions, disabled/missing PDF, and
  long localized labels.

### 8. Surface And Panel Primitive Consolidation

Status: mostly silent refactor candidate, but visual consistency should be
reviewed.

Value: medium-high.

Risk: low to medium.

Evidence:

- `src/components/ui/Card.astro`
- `src/components/blocks/home/HomeCurrentPanel.astro`
- `src/components/blocks/home/HomeStartHerePanel.astro`
- `src/components/blocks/shared/SupportBlock.astro`
- `src/components/blocks/terms/TermOverviewBlock.astro`
- `src/components/bibliography/BibliographyEmptyState.astro`
- Repeated class fragment:
  `border-border bg-muted/30 grid min-w-0 content-start gap-4 rounded-sm border p-4`.

The site has a few framed surfaces that are legitimate cards or panels, plus
some page sections that should stay flat. A reusable surface primitive can help
if it does not encourage wrapping every section in a card.

Recommended shape:

- Keep `Card.astro` for repeated item cards.
- Add a narrowly named `Panel.astro` or extend `Card.astro` with explicit
  `surface="muted|plain|popover"` variants only if real repeated panels remain.
- Do not create a vague `.box` abstraction.

Benefits:

- Makes empty states, compact panels, and support blocks consistent.
- Keeps radius/border/background tokens centralized.

Verification:

- Visual review on homepage, support blocks, empty states, and term index
  pages.

### 9. External Brand CTA Primitive

Status: silent refactor candidate.

Value: medium.

Risk: low.

Evidence:

- `src/components/ui/PatreonButton.astro`
- `src/components/ui/DiscordButton.astro`
- `src/components/blocks/shared/SupportBlock.astro`
- `src/components/blocks/home/HomeHeroBlock.astro`

Patreon and Discord buttons now share almost identical dimensions, shape,
focus, and asset behavior. The implementation should keep brand assets separate
but centralize the shared CTA frame.

Recommended shape:

- `src/components/ui/BrandButton.astro`
- Props: `href`, `ariaLabel`, `background`, `hoverBackground`, `asset`,
  `assetAlt=""`, `target`, `rel`, `size`.
- `PatreonButton` and `DiscordButton` can remain thin wrappers around it.

Benefits:

- Adds future YouTube, Instagram, newsletter, or platform-specific CTAs without
  class drift.
- Keeps official brand assets decorative while preserving accessible labels.
- Makes webmaster configuration easier later.

Verification:

- Visual review on homepage and article support block.
- E2e or catalog examples for button row shrink behavior.

### 10. Page Body And Layout Shell Consolidation

Status: design-sensitive refactor candidate.

Value: medium-high.

Risk: medium.

Evidence:

- `src/components/layout/PageFrame.astro`
- `src/components/layout/BrowsingBody.astro`
- `src/components/layout/ReadingBody.astro`
- `src/components/layout/SectionStack.astro`
- `src/components/layout/EndcapStack.astro`
- `src/layouts/ArticleLayout.astro`
- `src/pages/index.astro`
- `src/pages/articles/index.astro`

The project has good layout primitives, but page routes still choose spacing,
grid gaps, and layout width directly in several places. That is reasonable
during active design, but long-term platform reuse benefits from a smaller set
of named layout recipes.

Recommended shape:

- Keep `ReadingBody` and `BrowsingBody`; they encode real product differences.
- Audit `PageFrame` and `BrowsingBody` overlap before adding new page shells.
- Use `SectionStack` and `EndcapStack` consistently for vertical rhythm.
- Consider a `PageSection.astro` wrapper only after `SectionHeader` exists.

Benefits:

- Page routes become easier for agents and platform users to compose safely.
- Spacing regressions around article endcaps, support blocks, and browse pages
  become less likely.

Verification:

- Visual regression checks for homepage, article pages, article index, tags,
  collections, authors, bibliography, and search.

### 11. Article Layout View-Model Boundary

Status: not first, but important.

Value: high.

Risk: high if done before smaller primitives.

Evidence:

- `src/layouts/ArticleLayout.astro`

`ArticleLayout` does a lot: social image optimization, author profile lookup,
category lookup, related/continuity selection, citation view model, share view
model, reading navigation, scholar metadata, pagefind visibility, layout
composition, and rendering.

Recommended shape:

- First complete smaller UI extractions.
- Then move pure data shaping into a typed helper such as
  `src/lib/content/article-page-view-model.ts`.
- Keep the Astro layout focused on composing article header, body, references,
  and endcaps.

Benefits:

- Easier to test article page behavior without rendering Astro.
- Future platform options such as disabling citations, PDFs, references, tags,
  support, or related articles become simpler.
- Reduces risk when article-specific features are added.

Verification:

- Unit tests for the article page view model.
- Existing article e2e, build, feed, PDF, and SEO tests.

## Non-Silent Consistency Candidates

These could improve the product, but they should be treated as design work
instead of silent refactors.

### Canonical Section Header Rhythm

The site should decide one canonical section header pattern for:

- article endcap blocks;
- homepage rail/list sections;
- archive/list pages;
- bibliography subheadings;
- search and browse pages.

The current differences are mostly reasonable, but the design would benefit
from a documented set of header sizes and action-link placement rules.

### Canonical Compact List Style

Announcements, start-here entries, compact recent lists, and current/project
links are similar enough that the reader should not have to relearn their
structure. Choose a canonical compact list style and let variants tune density,
not markup.

### Canonical Term Surfaces

Categories, tags, collections, authors, and possibly future series are all
browse-entry surfaces. They should not be forced into one domain model, but
their index cards/rails can share size, count, empty, and long-label behavior.

### Branded CTA Consistency

The site now uses official Patreon and Discord buttons in multiple contexts.
If future platform users configure socials, the CTAs should come from a common
brand/social configuration rather than ad hoc component imports.

### Popover/Menu Visual Language

Citation, share, category previews, search reveal, and image inspectors all
need floating UI. They should remain semantically distinct, but panel radius,
border, shadow, spacing, focus, close behavior, and mobile width should follow
one documented visual language.

## Configurability Pressure Points

The repo has already moved many TPM-specific decisions into `site/config`.
That is the right direction. Remaining pressure points:

### Hardcoded Component Defaults

Several components still contain user-facing default strings such as
"Featured Articles", "Start Here", "Items will appear here", "No categories are
available yet", "View more", "View category", "Related Articles", and
"View Site Bibliography".

Defaults are useful for component catalog examples, but platform routes should
prefer passing labels from configuration or typed view models.

### Direct Site Config Imports In Visual Components

Some components import `siteConfig` directly:

- `src/components/layout/SiteHeader.astro`
- `src/components/layout/SiteFooter.astro`
- `src/components/navigation/SupportLink.astro`
- `src/components/authors/AuthorLink.astro`
- `src/components/articles/references/ArticleBibliography.astro`
- `src/components/blocks/home/HomeHeroBlock.astro`
- `src/components/blocks/shared/SupportBlock.astro`

This is acceptable for application-level shell components such as header and
footer. It is less ideal for reusable blocks. Long term, reusable blocks should
accept explicit props from route/view-model code, while shell components may
read global config.

### Homepage Recipe Still Lives In Route Composition

`src/pages/index.astro` is much cleaner than a prototype page, but it still
hardcodes the home page block order and grid placement. That may be right for
TPM, but a reusable platform eventually needs a homepage recipe model that can
choose blocks and content sources without requiring route edits.

Do not solve this too early. First consolidate the component families used by
the homepage.

### Feature Flags Are Good But Need Component Boundaries

`siteConfig.features` is strong. It already gates announcements, categories,
collections, support, search, tags, bibliography, feed, and PDFs. The next
platform step is making sure hidden features do not leave empty UI shells or
force components to know global feature policy.

## Catalog-Only Or Legacy Surface Risk

The current codebase contains components referenced only by the component
catalog or docs, not by public routes:

- `src/components/blocks/home/HomeRecentPostsBlock.astro`
- `src/components/blocks/home/HomeAnnouncementBlock.astro`
- `src/components/blocks/home/HomeLatestArticleBlock.astro`
- `src/components/blocks/home/HomeFeaturedArticlesBlock.astro`
- `src/components/blocks/home/HomeMastheadBlock.astro`
- `src/components/blocks/home/HomeArchiveLinksBlock.astro`
- `src/components/ui/YouTubeButton.astro`
- `src/components/ui/Separator.astro`
- `src/components/ui/Section.astro`
- `src/components/articles/media/ArticleImage.astro`
- `src/components/navigation/SectionNav.astro`
- `src/components/media/EmbedFrame.astro`
- `src/components/media/YouTubeEmbed.astro`

This does not mean they should be deleted. The catalog is a valid consumer.
However, catalog-only components should be explicitly classified as one of:

1. Current primitive intentionally kept for future use.
2. Deprecated prototype kept temporarily for visual comparison.
3. Real dead code to remove.

Recommendation: add a small "component lifecycle" note to the catalog docs or
component comments so future agents know whether catalog-only means "available"
or "stale".

## Do Not Refactor Broadly Yet

This section means "do not rewrite the whole parent system." It does not mean
"do not extract child pieces." The safest approach for these systems is to
identify stable sub-components, extract them behind behavior-preserving tests,
and leave the parent ownership model intact until the child pieces have proven
their value.

### Article Images And PDF/Image Inspector

This system touches Markdown rendering, Astro image optimization, PDF output,
remote/local image migration, lazy loading, article image overlays, and
accessibility. It is too easy to regress. Only extract narrowly repeated UI
pieces after behavior is stable.

Safe sub-component candidates:

- Image action button/overlay styling for inspect affordances.
- Figure/caption shell if it can preserve current Markdown output exactly.
- Fullscreen image inspector chrome, close button, and focus behavior.
- PDF-only image fallback helpers, as long as they stay separate from browser
  image inspection.
- Pure image metadata helpers that are covered by tests and do not alter the
  Markdown/MDX render path.

Avoid:

- Replacing the Markdown image transform pipeline without a dedicated design.
- Combining browser inspector behavior and PDF image sizing into one
  abstraction.
- Changing the source-selection policy while doing a visual cleanup.

Resume trigger: repeated image/media behavior appears outside article prose, or
PDF/image tests become stable enough to support a larger extraction.

### Article Table Of Contents

The TOC now handles sidebar, inline, generated reference sections, numbering,
sticky header offsets, and hidden/open behavior. It is a domain component, not a
generic disclosure. Avoid broad extraction until another hierarchical contents
component exists.

Safe sub-component candidates:

- TOC heading/header row.
- Show/hide trigger with compact hidden state.
- Numbered TOC list renderer.
- Individual TOC link item with active/current state.
- Placement shell for inline versus sidebar rendering, if it does not change
  heading extraction.

Avoid:

- Turning the TOC into a generic tree component before another tree-like
  consumer exists.
- Changing generated footnote/bibliography inclusion rules during styling
  cleanup.
- Changing sticky-header offset behavior without targeted anchor-navigation
  tests.

Resume trigger: a second page type needs hierarchical contents, or the TOC
styling must be shared with generated docs.

### Site Header Priority Layout

The header solved several difficult responsive invariants around centered logo,
side controls, support button, category row, touch menu, and tiny widths. Avoid
large structural refactors unless a header redesign is explicitly active.

Safe sub-component candidates:

- Header nav link primitive.
- Header action cluster wrapper.
- Mobile menu section and mobile menu item renderers.
- Category-row item renderer, as long as category dropdown behavior is not
  changed.
- Support link wrapper and responsive label selection.

Avoid:

- Rewriting the centered priority layout.
- Changing support-button shrink rules or logo sizing without re-running header
  invariants.
- Moving breakpoint policy into one-off page CSS.

Resume trigger: platform theming needs multiple header layouts, or header
responsive tests become brittle enough to justify a dedicated layout primitive
upgrade.

### Home Featured Carousel

The carousel has product-specific editorial behavior. Do not extract a general
carousel until another real carousel exists. Small primitives for controls,
dots, and fixed slide layout are reasonable if they prevent layout shifts.

Safe sub-component candidates:

- Carousel controls and indicator dots.
- Fixed slide frame.
- Featured entry metadata line.
- Featured image frame and fallback-image surface.
- Slide body layout, if it remains specific to featured publishable entries.

Avoid:

- Creating a fully generic carousel API before a second real carousel exists.
- Mixing collection selection/order logic into visual carousel components.
- Changing autoplay or rotation behavior during a visual extraction.

Resume trigger: collections, homepage, or media galleries need a second
carousel-like surface.

### ArticleCard Fit Logic

`ArticleCard` encodes real editorial list behavior: responsive image frames,
title-fit classes, description-fit classes, and metadata hierarchy. Avoid
generalizing it into a generic card until the compact-entry family and metadata
primitive are stable.

Safe sub-component candidates:

- Article image thumbnail frame.
- Article card kicker/metadata row.
- Title/description fit-class helpers as pure tested utilities.
- Article card text body shell if it preserves the current row contract.

Avoid:

- Turning `ArticleCard` into a universal content card before the publishable
  entry model is more explicit.
- Changing title/description fit thresholds while extracting markup.
- Moving image aspect-ratio policy into page-level callers.

Resume trigger: another content type needs the exact same rich row with
different data.

### ArticleLayout Orchestration

`ArticleLayout` is the right place to compose the article page, but it should
not permanently own every data-normalization detail.

Safe sub-component candidates:

- Article action row.
- Article endcap section composition.
- Reading navigation placement.
- Pure article page view-model helpers for author/category/continuity/share/PDF
  data.
- SEO/scholar metadata helpers that can be tested outside Astro rendering.

Avoid:

- Splitting the layout by file size alone.
- Moving IO or content collection reads into visual child components.
- Changing feature-flag behavior while extracting view-model helpers.

## Suggested Implementation Milestones

These are intentionally sequenced so each milestone lowers risk for the next.

### Milestone A: Silent UI Foundation

- Add `SectionHeader`.
- Extract button/link variant maps.
- Add `BrandButton` and keep Patreon/Discord wrappers.
- Add `ArticleActionRow`/`ArticleActionTrigger` if it can be done without
  changing cite/share/PDF behavior.
- Add metadata-line primitive if it can be done without touching
  `ArticleCard` fit logic.

Verification:

- Component catalog examples.
- `bun --silent run check`.
- Targeted e2e for article header/actions if touched.

### Milestone B: Compact Entry Lists

- Build `CompactEntryList`, `CompactEntryRow`, and optional
  `CompactEntryPanel`.
- Migrate `FlatArticleList` internals first.
- Then migrate homepage start-here/announcements/recent variants where the
  visual output can stay stable.

Verification:

- Homepage visual checks at mobile, tablet, desktop.
- Article/announcement/collection route smoke tests.
- Catalog examples for empty/long/missing metadata states.

### Milestone C: Rails And Term Surfaces

- Extract `ScrollRail`.
- Rebuild `CategoryRailBlock` on top of it.
- Reuse it on the articles page category section.
- Consider `TermRailCard` only if categories/tags/collections converge.

Verification:

- E2e horizontal scroll controls.
- Visual checks for both rail endpoints.
- Mobile/touch behavior.

### Milestone D: Action Menus And Popovers

- Build an action popover/menu layer over anchored primitives.
- Migrate share and citation triggers/panels only.
- Leave category dropdown and search reveal on low-level anchored primitives
  unless they naturally fit.

Verification:

- Share/cite e2e positioning and keyboard behavior.
- A11y check for buttons, labels, focus, and popover close behavior.

### Active B-D Implementation Decisions

The B-D implementation batch may make small visible consistency improvements,
but it should preserve information architecture and interaction contracts.

- Compact entry primitives should serve dense publishable-entry lists without
  thumbnails. They may standardize separator rhythm, empty-state text, and
  title/metadata wrapping across homepage panels and flat publishable lists.
  They should not absorb rich article-card image or description layout.
- Scroll rail primitives should own horizontal overflow behavior, edge fades,
  scroll controls, disabled states, accessibility hooks, and script data hooks.
  Category or term cards should stay as small domain wrappers over label,
  count, link, and pluralization.
- Action menu primitives should sit above `AnchoredRoot`, `AnchoredTrigger`,
  and `AnchoredPanel`, not replace them. Citation and share components should
  keep their format/share-target logic while delegating panel surface and menu
  item presentation to the shared action-menu layer.
- Category dropdown and search reveal stay on low-level anchored primitives for
  this pass. Article images, table of contents, header priority layout,
  carousel internals, and broad `ArticleLayout` orchestration are out of scope.

### Milestone E: Platform Config Boundaries

- Audit reusable blocks that import `siteConfig`.
- Move config reads toward route/view-model boundaries where practical.
- Keep shell components allowed to read global config.
- Document which labels are site-configurable and which are component defaults.

Verification:

- Unit tests for site config normalization.
- Build with a minimal fixture config if feasible.

### Milestone F: Article Page View Model

- Move pure data composition out of `ArticleLayout`.
- Keep rendering in Astro.
- Add tests for author/category/continuity/share/citation/PDF visibility data.

Verification:

- Article unit tests.
- `bun --silent run check`.
- `bun --silent run build`.
- `bun --silent run validate:html`.

### Active E-F Implementation Decisions

Milestones E and F are platform-boundary refactors. They may make small
internal API changes, but public layout, content hierarchy, feature-flag
behavior, and authoring behavior should stay stable.

For Milestone E:

- Application shell components may keep reading `siteConfig` directly:
  `BaseLayout`, `SiteHeader`, `SiteFooter`, and navigation-only wrappers such
  as `SupportLink`.
- Reusable blocks and article components should not decide global feature
  policy themselves. They should receive explicit props or typed view-models
  from route/layout/view-model code.
- Support CTAs should use a shared support view-model so Patreon/Discord hrefs,
  labels, aria labels, and the support feature flag are normalized once.
- `ArticleBibliography` should receive the optional site-bibliography action
  instead of importing global feature flags.
- `AuthorLink` should receive author-profile-link enablement from byline
  callers. This keeps the link/span decision testable without making every
  author primitive read global config.

For Milestone F:

- `ArticleLayout` remains the Astro composition shell for the article page.
  The extraction target is data preparation: canonical/social metadata,
  authors, author bios, category discovery, continuity, citation/share/PDF
  models, reading-navigation links, support data, tag/search visibility, and
  bibliography action data.
- The view model may perform build-time content collection reads because it is
  route/layout-layer code, not a visual component.
- Visual child components should continue receiving plain props and should not
  gain new content collection or site-config reads as part of the extraction.
- Existing article image, table-of-contents, reference rendering, PDF
  generation, and header action behavior are out of scope except where props
  need to be threaded through the new view model.

## Second-Pass Findings After Milestones A-F

Milestones A-F validated the direction of the original audit. Small primitives
and typed view models reduced component coupling without turning the UI into a
mega-component system. The main new lesson is that the highest-value refactors
are now one layer higher: page recipes and route view models, plus one layer
lower: narrowly named child components for rich media/list/card systems.

The first tranche also revealed a practical architecture rule:

```text
Reusable UI should not read site config.
Route/view-model code may read site config.
Application shell code may read site config.
```

That rule held up well. It made components easier to test and made catalog
fixtures less dependent on TPM-specific defaults. The remaining work should
continue that direction without overcorrecting into prop plumbing for shell
components that are intentionally global.

### What The Refactor Tranches Have Achieved

- `SectionHeader`, `BrandButton`, button/link variant maps, action-menu
  primitives, compact-entry primitives, scroll-rail primitives, support view
  models, and `articlePageViewModel` now provide real reusable seams.
- `ArticleLayout` is still a readable Astro composition shell, but most of its
  data preparation is now testable outside Astro rendering.
- Homepage compact panels and article action menus now have more consistent
  presentation and narrower domain responsibilities.
- `homePageRouteViewModel` now moves homepage config/content assembly out of
  `src/pages/index.astro` while keeping the current TPM homepage layout
  explicit and static.
- `PageHeader`, `TermCard`, `TermRailBlock`, `PublishableMediaFrame`, and
  `ArticleCardBody` now cover the most obvious browse/header/term/rich-entry
  extraction points without changing content policy.
- Share actions now carry presentation metadata from the action view model, so
  adding future share targets no longer requires the renderer to infer icons
  from endpoint IDs.
- The catalog has lifecycle metadata and remains a useful regression surface,
  but `ComponentCatalog.astro` is still large enough that section-level
  extraction remains a maintenance priority.

### Current Handoff Status

- Milestones G-J are implemented in code and covered by focused tests.
- Milestone K is implemented for this pass: lifecycle metadata exists,
  catalog-only examples are classified, and the UI primitives domain section is
  split out of the monolithic catalog component.
- Milestone L is implemented for this pass: default config values have moved
  into `site-config-defaults`, preserving the public parser/export API. The
  documentation, schema-related checks, platform-boundary checks, and release
  verification have been completed for this pass.
- Milestone M is implemented for this pass with code-backed decisions: TOC and
  header already have stable child boundaries, article images gained
  `ArticleImageFrame`, carousel controls gained a dedicated child component,
  and article-card media/body extraction is covered by Milestone J.
- A documentation drift audit is now required before handoff because this pass
  added new primitives, config-default boundaries, and catalog lifecycle
  metadata that affect developer-facing docs.

### Opportunities Revealed By The Changes

#### 1. Homepage Recipe And Route View Model

The homepage route is now the clearest remaining TPM-specific composition
surface. It directly loads articles, announcements, categories, authors,
collections, page content, homepage labels, limits, support actions, discovery
links, and block placement. That is acceptable for a site-specific Astro route,
but it is not yet a platform-quality homepage recipe.

Recommended direction:

- Add a `homePageRouteViewModel` or `homePageRecipeViewModel` that accepts
  content collections plus `SiteConfig` and returns:
  - document metadata;
  - hero props;
  - lead-grid slots;
  - featured carousel props;
  - compact panel props;
  - category rail props;
  - recent feed props;
  - support/social CTA data;
  - disabled/empty feature behavior.
- Keep `src/pages/index.astro` as composition only. It should load the page
  entry and call the route view model, then render blocks.
- Do not make a fully dynamic block renderer yet. A typed view model is the
  right intermediate step before exposing arbitrary homepage recipes to
  non-technical site owners.

Why this matters:

- Future site owners can change homepage content and labels without touching
  route code.
- Feature flags can suppress entire blocks without leaving empty shells.
- Homepage variants can become configuration later without rewriting every
  block.

#### 2. Browse Page Header And Section Standardization

`SectionHeader` exists, but page and browse surfaces still render local header
markup in several places:

- `src/pages/articles/index.astro`
- `src/components/blocks/listing/ArchiveListBlock.astro`
- `src/components/blocks/terms/TermOverviewBlock.astro`
- `src/components/blocks/listing/SearchResultsBlock.astro`
- `src/components/authors/AuthorsIndexPage.astro`
- `src/components/authors/AuthorProfileHeader.astro`
- `src/components/pages/PageHeader.astro`

Recommended direction:

- Introduce or extend a `PageIntro`/`BrowsePageHeader` layer on top of
  `SectionHeader` for page-level `h1` plus description/action.
- Migrate route and block headers that already match the contract.
- Keep article headers separate. Their metadata/action row is a domain
  contract, not a generic page intro.

This can be mostly silent, but a small visible standardization of page-heading
rhythm is likely desirable.

#### 3. Generic Term Surfaces

Categories, tags, collections, and future series are not the same domain model,
but their browse surfaces share title, href, count, optional description,
empty state, and responsive card/rail behavior. The rail pass extracted
`ScrollRail` and `TermRailCard`, but `TermOverviewBlock` still owns its own
card markup and category rail still has category-specific labels.

Recommended direction:

- Add a shared `TermCard` for grid cards.
- Add a `TermRailBlock` or generic `TermRail` wrapper, leaving
  `CategoryRailBlock` as a thin adapter.
- Use one `TermSummary` view-model shape for cards/rails:
  `title`, `href`, `count`, `countLabel`, `description`.
- Keep category-specific article-preview dropdowns out of this abstraction.

Visible standardization is acceptable here. Users should experience categories,
tags, and collections as related browse tools.

#### 4. Rich Publishable Entry Media And Article Card Subcomponents

Compact entry lists are now consolidated. The remaining repeated publishable
surface is the rich article row/card family:

- `ArticleCard`
- `HomeFeaturedSlide`
- rich article list thumbnails;
- featured fallback media;
- article-card kicker/meta rows.

Recommended direction:

- Extract `PublishableMediaFrame` or `EntryMediaFrame` for optimized image,
  fallback label, aspect ratio, link wrapping, object-fit, loading policy, and
  focus behavior.
- Extract `ArticleCardKicker` or reuse `EntryMetaLine` where the semantics are
  still article-specific.
- Split `ArticleCard` into small child components only after media and metadata
  contracts are clear.

Avoid changing title/description fit thresholds in this pass. Those are
editorial tuning decisions and already have tests.

#### 5. Support/Social CTA Registry

`supportBlockViewModel` and brand buttons improved the immediate support
surfaces, but the configuration still assumes a small hardcoded support model:
Patreon and Discord are support CTAs, share targets are separate, and future
social promotion buttons would need custom schema fields or components.

Recommended direction:

- Introduce a platform-level external CTA/social link model that can describe
  branded CTAs by key, href, label, aria label, icon/asset, color token, and
  placement.
- Keep Patreon/Discord wrappers as convenience components for TPM.
- Let support blocks and homepage hero CTA rows consume a generic list after
  the brand-specific defaults are normalized.

This is not needed for release, but it is important for productization. A
general blog platform should not require a code change to add a new external
community/support CTA.

#### 6. Share Target Registry Cleanup

`ArticleShareActionRow` still hardcodes the icon mapping for every share target
while `src/lib/site/share-targets.ts` owns URL construction. That split is
okay, but it means adding a new share target requires updating both the URL
registry and the renderer.

Recommended direction:

- Keep URL construction in `src/lib/site/share-targets.ts`.
- Add a small presentation registry for share target icon keys and labels, or
  make the action view model include an `icon` discriminant.
- Keep the actual Lucide imports in the Astro component to avoid putting view
  concerns into pure URL helpers.

This is a low-risk developer-velocity refactor.

#### 7. Site Config Schema Boundaries And Webmaster UX

`src/lib/site/site-config.ts` now carries identity, routes, features, homepage,
support, share, and content defaults in one file. That is still manageable, but
it will become a bottleneck as the platform gets more configurable.

Recommended direction:

- Split schema construction into domain files or at least domain helpers:
  identity, routes, features, homepage, content defaults, support/social, and
  share.
- Keep a single exported `siteConfigSchema` and `parseSiteConfig` entrypoint.
- Add docs near the schema that explain which fields are safe for
  non-technical site owners to edit.
- Consider a future schema-to-docs script only after the manual docs stabilize.

This improves maintainability and sets up a future admin UI without changing
runtime behavior.

#### 8. Component Catalog Lifecycle And Split

`src/catalog/ComponentCatalog.astro` is now over 1,700 lines. It is useful but
too large to act as a clear design-system entrypoint. It also imports
catalog-only components and real route components without marking which are
current, deprecated, or fixtures.

Recommended direction:

- Split catalog sections into section components or data-driven example groups
  by domain: UI, layout, navigation, article, blocks, authors, bibliography,
  media, pages.
- Add lifecycle metadata to examples:
  `current`, `platform-candidate`, `deprecated-fixture`, or `route-only`.
- Keep hostile fixtures centralized.
- Do not delete catalog-only components until the lifecycle metadata makes the
  intent clear.

This is mostly silent but high leverage for future agents and reviewers.

#### 9. Search And Browse Config Boundaries

`SearchResultsBlock` still imports `SITE_TITLE` and owns search labels and
placeholder text. Several browse routes also hardcode descriptions and empty
states. These are small examples of page copy living below the route/config
boundary.

Recommended direction:

- Pass search labels, placeholders, and descriptions from route/view-model
  code.
- Add config fields only for copy that a site owner is likely to change.
- Keep component defaults for catalog examples.

This should be folded into a broader browse-page standardization milestone.

#### 10. Risk-System Refactor Program

The original audit correctly warned against broad rewrites of article images,
TOC, header priority layout, carousel internals, and article card fit logic.
That advice still holds. However, the first tranche proved that small child
extractions can work when the invariant is narrow.

The second-pass policy is not to pick one risky system and ignore the rest.
Every risky system with real refactor value should be addressed, but each
system needs a stronger design/test gate before implementation. Higher risk
means more explicit invariants, earlier focused tests, and tighter verification;
it does not mean the work is permanently avoided.

Safe child extractions to evaluate:

- TOC: header row, hidden-state trigger, numbered-list renderer, link item.
- Article images: inspector chrome, media action button, figure/caption shell.
- Header: nav item renderer, mobile menu section/item renderer, support-label
  adapter.
- Carousel: fixed slide frame, controls/dots, featured media frame.
- Article cards: media frame, kicker row, title/description fit helpers.

Each target should get a design lock before code. The design lock must state
whether the work is behavior-preserving, intentionally standardizing the UI, or
intentionally changing behavior.

### Quality Priorities For Risky And Design-Sensitive Refactors

Risky refactors must name their user-impact priorities before implementation.
The defaults for this project are:

- Reader UX: preserve reading flow, responsive comfort, visual hierarchy, dark
  mode, long-content behavior, touch behavior, keyboard behavior, and editorial
  intent.
- Author UX: preserve simple Markdown/MDX authoring and avoid adding
  frontmatter/component burden unless it solves a real problem.
- Webmaster UX: make configuration easier to understand, document, validate,
  and eventually expose through a GUI.
- Performance: preserve or improve Lighthouse scores, LCP, CLS, interaction
  stability, static output, client-JS size, hydration boundaries, image
  optimization, and build-output payload size.
- Accessibility: preserve semantic HTML, focus visibility, labels, keyboard
  access, touch access, reduced-motion behavior where relevant, and useful alt
  text or explicit decorative image semantics.
- SEO and machine readability: preserve canonical URLs, structured data,
  Scholar metadata, RSS/sitemap correctness, article/PDF discoverability,
  Pagefind indexing rules, and crawlable static HTML.
- Maintainability: reduce repeated layout logic, keep domain rules outside
  generic primitives, prefer typed view models, and make invalid states harder
  to express.

Every risky-system design should include:

- user impact goal;
- non-regression list;
- performance and payload assumptions;
- accessibility contract;
- SEO/machine-readable contract if relevant;
- responsive invariants at 320px, 768px, desktop, wide desktop, and dark mode;
- pre-change or early-change test plan;
- focused verification gate and release-gate expectations.

## Second-Pass Implementation Milestones

These are the recommended next milestones after A-F. They are intentionally
larger than the first pass because the primitive foundation now exists, but
each should still be independently verifiable.

### Milestone G: Homepage Recipe And Route View Model

- Design a typed homepage recipe/view-model boundary that can express the
  current TPM homepage without making the route own config plumbing.
- Move homepage route data assembly into `src/lib/content/home` or a new route
  view model helper.
- Keep the Astro route declarative: load content, build the view model, render
  blocks.
- Preserve the current layout unless a visible standardization is explicitly
  approved.

Verification:

- Homepage unit tests for feature-disabled states, missing collections, empty
  announcements, support disabled, and custom labels.
- Homepage e2e at mobile, tablet, desktop.
- Build and catalog checks.

Status: implemented through `homePageRouteViewModel`; keep future work limited
to recipe extensions or tests that preserve the explicit static composition.

### Milestone H: Browse Page Header And Empty-State Standardization

- Add or extend a page/browse header primitive over `SectionHeader`.
- Migrate articles index, archive blocks, term overview, search, authors index,
  and plain page headers where contracts match.
- Pass user-facing labels/descriptions from routes or view models where
  practical.
- Standardize empty-state text placement and tone.

Verification:

- Component tests for page/browse header variants.
- Route smoke tests for articles, tags, collections, authors, search.
- Visual review for heading rhythm.

Status: implemented through `PageHeader` and `SectionHeader` migration for the
matching browse/header surfaces. Author profile headers remain domain-specific.

### Milestone I: Term Surface Generalization

- Add a shared `TermCard` for grid surfaces.
- Generalize rail wrapper behavior enough that category rails are a thin
  adapter over term rails.
- Use a shared term summary shape for categories, tags, collections, and
  future series.
- Keep category dropdown previews and category-specific discovery behavior
  separate.

Verification:

- Rail endpoint e2e remains stable.
- Tags, categories, and collections pages render equivalent card behavior.
- Long term labels, zero counts, and empty states are covered.

Status: implemented through `TermCard`, `TermRailBlock`, and a thin
`CategoryRailBlock` adapter. Category dropdown previews remain separate by
design.

### Milestone J: Rich Publishable Media And Article Card Split

- Extract a reusable media/fallback frame for linked publishable images.
- Split `ArticleCard` into media, kicker/meta, and body children if the new
  boundaries remain simple.
- Let `HomeFeaturedSlide` reuse the media/fallback frame if it preserves the
  featured layout.
- Do not retune title or description fit thresholds in the same milestone.

Verification:

- Existing article list fit tests.
- Homepage featured carousel e2e for no layout shift.
- Article list visual review with image, no image, long title, long
  description.

Status: implemented through `PublishableMediaFrame` and `ArticleCardBody`.
Title and description fit thresholds were intentionally not retuned.

### Milestone K: Component Catalog Lifecycle And Split

- Add lifecycle metadata for catalog examples and catalog-only components.
- Split `ComponentCatalog.astro` into smaller domain sections or data-driven
  example groups.
- Classify catalog-only components as current, platform-candidate,
  deprecated-fixture, or dead-code candidate.
- Remove only components that are explicitly confirmed dead.

Verification:

- Catalog route tests.
- Catalog component tests.
- `bun --silent run test:catalog`.

Status: implemented for the first productionization pass. Lifecycle metadata
exists, catalog-only components are classified, and the UI primitives domain
section is split out. Further section splits are still valuable, but they are
incremental catalog maintenance rather than a blocker for this milestone.

### Milestone L: Config Schema And Site Owner Copy Boundaries

- Split `site-config` schema internals by domain while preserving the public
  parser/export.
- Move likely site-owner copy into config/view models, not reusable
  components.
- Document the editable config fields for future admin UI and non-technical
  site owners.
- Keep shell components allowed to read normalized config directly.

Verification:

- Site config unit tests.
- Minimal fixture config parse test.
- Platform boundary check.

Status: implemented for the first productionization pass. Config defaults are
split into `site-config-defaults` and covered by tests. Public schema shape is
preserved.

### Milestone M: Risk-System Refactor Program

- Design and implement the safe child extractions for every risky parent
  system that shows concrete refactor value: TOC, article images, header,
  carousel, and rich article cards.
- Work one parent system at a time. Each parent system must have its own design
  lock, test plan, implementation milestone, and verification before moving to
  the next parent system.
- Extract only named child components with stable invariants.
- Do not change source-selection, breakpoint, generated-reference, feature
  flag, SEO, PDF, or performance policy as incidental cleanup.

Verification:

- Existing focused e2e for each selected system.
- Add missing tests before or during the extraction when current coverage does
  not lock the important invariant.
- Manual visual check at 320px, 768px, desktop, wide desktop, and dark mode
  where relevant.
- Release gate before handoff.

## Development Readiness Criteria

Before implementing any milestone from this audit, make the milestone pass this
check:

- The proposed component has a clear design name and responsibility.
- The public props are small enough to explain in one short paragraph.
- Configuration enters from props or a view model unless the component is
  intentionally an application shell.
- Empty, long-content, narrow-width, keyboard, touch, and dark-mode states are
  identified.
- The refactor plan states whether the output must be pixel/markup stable or
  intentionally design-changing.
- The verification plan names concrete unit, catalog, e2e, a11y, build, or
  visual checks.
- The implementation can be reverted independently of unrelated milestones.

If a proposed extraction fails this check, either narrow it to a smaller
sub-component or leave it in the parent component for now.

## Known Blind Spots For Handoff

These are not blockers, but the next developer should keep them visible:

- Component catalog lifecycle metadata exists, but the catalog component is
  still too large. Do not delete catalog-only components unless a later
  lifecycle review explicitly marks them as dead-code candidates.
- The repo does not yet have a separate fixture site configuration for
  platform reuse. Config-boundary refactors should avoid assuming TPM is the
  only future consumer, but they should not invent a full fixture system during
  Milestone A.
- Visual regression protection is mostly targeted e2e plus manual review, not
  broad screenshot baselines. Silent refactors should keep migration scope
  small enough for manual visual verification to be realistic.
- MDX article components and article prose rendering may contain one-off
  editorial behavior. Do not fold MDX-specific behavior into generic list,
  section, or button primitives without checking real MDX usage.
- Some repeated classes are deliberate because the components are semantically
  different. Treat repeated Tailwind as evidence to inspect, not proof that a
  shared component is required.
- Platform configurability should flow from content/config/view models into
  components. Avoid making every primitive read `siteConfig`; that would reduce
  immediate prop plumbing but make future platform extraction harder.

## Completion State For This Refactor Pass

The active refactor pass is complete:

- The second-pass milestones G-M have all been implemented or explicitly
  scoped as incremental future maintenance.
- Developer-facing and site-owner/author-facing documentation has been audited
  and updated for the new primitives, config-default boundary, and catalog
  lifecycle metadata.
- `bun run check:release` passes after the refactor fixes discovered during
  the release gate.

Remaining items are not blockers for this refactor pass. They are future
platformization opportunities or intentionally deferred feature work:

- continue splitting the catalog into smaller sections when touching those
  areas;
- add a separate fixture-site configuration if/when platform reuse work needs
  stronger proof;
- evolve the homepage recipe from typed view model to configurable block recipe
  only after the current explicit composition stops being enough;
- revisit deferred PDF pipeline, citation locator, visible appendix, and asset
  inlining work when their resume triggers fire.
- treat additional catalog section splits and risky-system subcomponent
  extraction as future incremental maintenance unless a concrete product or
  test gap appears.
