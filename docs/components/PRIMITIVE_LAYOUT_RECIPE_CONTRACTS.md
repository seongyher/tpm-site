# Primitive And Layout Recipe Contracts

This document closes the design pass for IRK-81. It records the shared
component vocabulary that should guide the remaining Milestone 3 component and
interaction work.

The goal is to make common UI changes local and safe: authors and site owners
should not need app-code edits for normal publication changes, and developers
should not need to remember page-specific spacing, wrapping, focus, or
responsive rules when composing new surfaces.

## Current Audit

The current component tree already has the right shape:

- UI primitives in `src/components/ui/` own buttons, links, branded CTAs,
  anchored surfaces, scroll rails, section headers, cards, inputs, badges,
  separators, containers, and sections.
- Layout recipes in `src/components/layout/` own reading measures, browsing
  measures, margin rails, action rows, endcap stacks, section stacks, and site
  shell framing.
- Article components own article-specific metadata, references, prose, images,
  action rows, compact entries, and discovery blocks.
- Block components adapt normalized route or homepage view models into
  reusable page sections.
- The component catalog and one-pagers are already the correct review surface,
  but inventory drift showed that the catalog/docs contract needs explicit
  ownership.

Repeated risk patterns still worth guarding:

- Section headings with right-side links.
- Compact entry rows and metadata separators.
- Branded CTA sizing and accessible labels.
- Horizontal rails and edge controls.
- Article-header action popovers.
- End-of-article discovery/support rhythm.
- Reading and browsing body measures.
- Long titles, long words, missing media, empty lists, and narrow containers.

## Canonical Primitive Families

### Action Primitives

Use `Button`, `LinkButton`, `IconButton`, `TextLink`, `ActionCluster`,
`ActionMenuItem`, `ActionPopover`, and article-header action primitives for
reader actions. These components own focus rings, disabled/current state,
accessible labels, alignment, compact sizing, and link/button semantics.

Do not hand-roll ad hoc action rows in routes or page blocks. A new action row
should be a composition of these primitives or a narrow domain component with a
one-pager.

### Surface Primitives

Use `Card`, `Section`, `Container`, `Separator`, `Badge`, and `Input` for
framing, bands, gutters, dividers, compact labels, and native form styling.
Cards are only for repeated items, modals, or genuinely framed tools. Page
sections should be normal bands or unframed layout regions.

### Anchored Surface Primitives

Use `AnchoredRoot`, `AnchoredTrigger`, `AnchoredPanel`, and `ActionPopover` for
floating surfaces. Product presets must come from the anchored-positioning
domain instead of hard-coded per-component geometry.

The primitive contract is:

- a semantic trigger;
- one panel with a stable ID and label;
- viewport-safe fixed positioning;
- no-JS meaningful fallback where possible;
- keyboard and pointer behavior owned by the interaction adapter.

### Rail Primitives

Use `ScrollRail`, `TermRailBlock`, `TermRailCard`, `CategoryRailBlock`, and
carousel controls for horizontal scrolling. Rails must expose real buttons for
users who cannot scroll horizontally, use edge fades only when scrollable
content exists beyond the edge, and keep cards equal-sized inside the rail.

### Branded CTA Primitives

Use `BrandButton` through platform-specific wrappers such as `PatreonButton`
and `DiscordButton`. Branded CTAs own fixed visual dimensions, asset sizing,
external-link safety, and accessible labels. Do not repeat brand dimensions or
raw asset markup in homepage/support blocks.

## Canonical Layout Recipes

### Reading Body

`ReadingBody` and `MarginSidebarLayout` own article and prose reading measures,
margin rails, sticky sidebar offsets, and mobile collapse. Article routes
should not patch prose width or rail spacing directly.

### Browsing Body

`BrowsingBody`, `PageFrame`, and `MainFrame` own archive, category, search,
authors, tags, collections, and static page measures. Browsing pages should
share list/card/rail components rather than route-local grids.

### Section Stack

`SectionStack`, `SectionHeader`, and block-level components own vertical
rhythm between sections. Discovery sections with right-side actions should use
`SectionHeader` unless a domain-specific header component has a stronger
reason to exist.

### Endcap Stack

`EndcapStack` and `ArticleEndcap` own after-article ordering and spacing:
next article, support, more-in-category, related/discovery, references, and
metadata. Individual endcap children should not add margins that create
double-spacing when optional siblings are absent.

### Compact Entry Panels

`CompactEntryPanel`, `CompactEntryList`, `CompactEntryRow`, and
`EntryMetaLine` own dense article-like lists such as homepage Start Here,
announcements, and current links. The list model should accept publishable
entries from articles, announcements, collections, or future sources.

## Catalog And One-Pager Rules

Every public component must have either:

- a catalog example and a one-pager, or
- a documented catalog ignore reason when the component is internal,
  non-visual, or route-only.

Catalog examples should cover the states that create real regression risk:

- normal content;
- long titles or long words;
- missing optional content;
- empty lists;
- dense lists;
- narrow containers;
- dark mode;
- keyboard focus;
- hostile but valid author content.

One-pagers should document the public contract and testable invariants. They
should not turn accidental prototype behavior into desired behavior.

## Verification Contract

The remaining implementation work should verify:

- component docs and source inventory stay aligned;
- catalog examples cover all public components or documented ignores;
- primitives render semantic HTML with accessible names;
- long and hostile content does not overflow horizontally;
- rails, popovers, and action rows have keyboard and touch paths;
- route pages compose primitives instead of duplicating layout recipes;
- focused component/catalog tests run before broad release checks.
