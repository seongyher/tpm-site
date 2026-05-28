# Platform Configurability Audit

The platform should give site owners control over editorial presentation without
turning reusable components into a bag of loosely related options. The future
GUI should edit durable, validated site-instance contracts, not page internals
or arbitrary code.

## Decision Rules

Classify a hard-coded value by who owns the decision:

- **Config now:** site-wide editorial copy, feature behavior, route-linked
  navigation, support/social choices, or limits that a non-technical webmaster
  reasonably expects to tune.
- **Component prop:** local presentation text needed by one reusable component
  call site, especially when the page already has the relevant context.
- **Platform default:** structural behavior that should be consistent across
  sites, with a sensible default and no clear author-facing benefit from
  configuration yet.
- **Content/frontmatter:** entry-specific editorial data such as article title,
  description, images, visibility, PDF eligibility, collection membership, and
  feature notes.
- **Deferred:** customization that needs a product decision, GUI model, or broad
  route/build redesign before it can be made safe.

The default bias is to keep components general through props and helpers. Add
global config only when the setting is genuinely site-wide and stable enough to
validate.

## Current Config-Now Candidates

### Homepage Discovery

The compact `Read / ...` row is a site-owner navigation recipe. Its labels,
order, and route choices are editorial and vary across sites. It should be
configured as a small list of links that can target known route keys or explicit
paths. Route-key links should be skipped or diagnosed when their feature is
disabled.

### Homepage Section Copy

Home section labels and empty states are site-wide editorial copy. The platform
can keep a conventional default while allowing a site to rename `Read`,
`Start Here`, `Announcements`, `Categories`, and `Recent` without touching
Astro pages.

### Article Share Targets

The share menu is a platform feature, but the chosen networks and order are a
site-owner decision. The platform should own endpoint builders for known
targets, while the site config chooses which targets appear. Copy and email
remain always available because they do not depend on third-party endpoints.

## Component-Prop Candidates

- Related-content headings such as `More in {category}` and `Related Articles`
  can stay component props for now. Article pages already know the category and
  related article context.
- Support block title/body are already config-backed but remain overridable by
  props for special placements.
- Homepage carousel slides should keep layout rules platform-owned while
  item-specific text comes from collections and publishable entries.

## Platform Defaults To Keep

- Article card truncation, thumbnail ratios, and carousel behavior should remain
  component-owned defaults. Making those global config now would create fragile
  layout combinations.
- PDF scholarly export structure should remain platform-owned, with per-entry
  enable/disable in frontmatter and site defaults already available.
- Share endpoint URL builders should remain platform-owned because the external
  APIs are implementation detail, not author-facing configuration.

## Deferred Candidates

- Arbitrary route segment renaming remains deferred until fixed-route platform
  output is fully mature.
- JSON-driven theme generation is still a later step after the `theme.css`
  contract proves stable.
- A page-builder-style homepage is intentionally deferred. The current homepage
  should stay a typed recipe made of known blocks.
- Catalog fixture cleanup belongs to the broader public-engine cleanup tranche.

## Implementation Plan

This pass should add only the low-risk config surfaces:

1. Add `homepage.discoveryLinks`, `homepage.labels`, and homepage empty-state
   copy to the validated site config.
2. Resolve homepage discovery links through a typed helper so route-key links
   share the configured route model.
3. Add `share.targets` as an ordered list of supported third-party target IDs.
4. Update `site-doctor` to diagnose configured homepage route links that point
   at disabled features.
5. Update TPM, fixture, and docs-site configs plus generated schemas.
6. Add focused tests for parsing defaults, homepage link resolution, share target
   filtering/order, and disabled-feature diagnostics.

After this pass, remaining customization should be driven by evidence from
future sites rather than speculative global options.
