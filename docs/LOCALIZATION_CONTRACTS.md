# Localization Contracts

This document completes the design pass for `IRK-129`. It defines the platform
contracts needed for locale-aware content, routes, labels, formatting,
metadata, feeds, PDFs, and future studio interfaces.

The current TPM site is effectively a single English-language publication. The
contract below keeps that case simple while making non-English, multilingual,
and right-to-left sites possible without rewriting platform domains later.

## Design Principles

- Single-locale sites should not pay complexity tax.
- Locale must be explicit at normalized platform boundaries.
- Reusable platform code should not hard-code English user-facing strings.
- Formatting is locale policy, not incidental component logic.
- Route and metadata behavior must stay consistent across HTML, sitemap, RSS,
  search, PDFs, and social previews.
- Right-to-left support must be a layout and component concern, not only an
  `<html dir>` flag.
- Missing translations should be diagnosed, not guessed.

## Locale Model

The platform should normalize locale configuration into one model:

```ts
interface LocaleProfile {
  id: string;
  languageTag: string;
  label: string;
  direction: "ltr" | "rtl";
  isDefault: boolean;
  routePrefix?: string;
  timeZone?: string;
  dateFormat?: DateFormatProfile;
  numberFormat?: NumberFormatProfile;
  labels?: LocaleLabelOverrides;
}
```

For a single-locale site, config can remain minimal:

```json
{
  "locale": "en-US"
}
```

The platform can derive the default profile unless the site owner opts into
multiple locales or custom formatting.

## Content Locale Contract

Publishable entries should normalize to:

- entry locale;
- language tag;
- text direction;
- translation group ID when applicable;
- default-locale fallback relationship when applicable;
- localized route reference;
- localized title, description, and metadata fields;
- translation completeness diagnostics.

Content authors should not need to set locale on every entry for a
single-locale site. Multi-locale sites should require enough explicit data to
avoid accidentally publishing a page under the wrong language.

## Route Policy

Route policy should support three modes:

1. `single`: no locale prefix; all content uses the site default locale.
2. `prefixed-default`: every locale, including default, has a route prefix.
3. `unprefixed-default`: the default locale has no prefix; non-default locales
   are prefixed.

Routes should be generated from route references rather than string
concatenation. Locale route behavior should apply consistently to:

- articles;
- announcements;
- pages;
- authors;
- categories;
- tags;
- collections;
- feeds;
- sitemap;
- search data;
- PDF routes;
- redirects and historical aliases.

Localized historical redirects should declare which locale owns them when the
target is ambiguous.

## Metadata Contract

Locale data should flow into:

- `<html lang>` and `<html dir>`;
- canonical URL;
- alternate language links;
- sitemap alternate language entries when supported;
- RSS or feed language;
- Open Graph locale fields;
- JSON-LD `inLanguage`;
- article and page semantic metadata;
- PDF language and document metadata;
- search index language;
- share URLs and email body text.

The metadata graph should consume normalized locale profiles. Individual SEO
components should not duplicate locale rules.

## Label Registry

Reusable UI labels should move behind a typed label registry as localization
work begins. Examples:

- navigation labels;
- "Read", "Archive", "Authors", "Collections", "Tags";
- article actions such as "Cite", "Share", and "PDF";
- table-of-contents labels;
- citation and bibliography labels;
- "View more" and "View category";
- form labels, empty states, and diagnostics.

The registry should provide:

- default English labels;
- per-locale overrides;
- stable label IDs;
- diagnostics for missing required labels in active locales;
- clear ownership for site-specific labels versus platform labels.

Site-specific copy such as TPM support text should remain site config or site
content, not platform labels.

## Formatting Policy

Formatting helpers should own:

- dates;
- date ranges;
- times and time zones;
- ordinal or numbered table-of-contents labels when localized;
- counts such as "8 articles";
- list formatting;
- author/date metadata lines;
- citation access-date display;
- PDF date display.

Components should receive already-normalized display view models or call typed
formatting helpers. They should not call `toLocaleDateString()` with ad hoc
options.

## Slug And Identifier Policy

Entry IDs and canonical route IDs should stay stable. Localized slugs are route
presentation data, not identity.

The platform should distinguish:

- stable entry ID;
- translation group ID;
- localized slug;
- generated localized route;
- historical aliases;
- redirect sources.

This keeps imports, citations, links, and generated artifacts stable even when
a localized slug changes.

## Right-To-Left And Layout Policy

RTL support requires component-level verification:

- inline action rows should preserve meaning when order changes;
- icons with direction, such as arrows, may need mirrored variants;
- separators and metadata lines should not assume English slash spacing;
- menus, popovers, and anchored panels should remain in viewport;
- prose, blockquotes, tables, footnotes, citations, and bibliography entries
  should preserve readable measure;
- horizontal rails should scroll in the expected direction;
- PDF output should have an explicit direction policy.

Layout primitives should make this easier by owning wrapping, gutters, and
inline flow behavior.

## Current Assumption Inventory

Future implementation should audit and migrate these assumptions:

- hard-coded English labels in navigation, article actions, home blocks,
  discovery links, related blocks, bibliography links, and empty states;
- date formatting helpers and tests that assume English month names;
- RSS/feed language defaults;
- sitemap and canonical route generation without alternate language handling;
- metadata and JSON-LD helpers that assume one language;
- PDF title page, headers, footers, and disclaimers;
- share menu labels and composed share text;
- generated diagnostics written only for English output;
- slugs and historical aliases that assume Latin text;
- component tests that only cover LTR layouts.

This inventory is not an implementation checklist by itself. It names the
areas that should move behind locale-aware helpers and fixtures when
localization implementation begins.

## Fixture States

Implementation should define fixtures for:

- single English site with no explicit per-entry locale;
- single non-English LTR site;
- single RTL site;
- multilingual site with default locale unprefixed;
- multilingual site with all locales prefixed;
- translated article with complete alternates;
- article missing a required translation;
- localized route collision;
- localized metadata and feed output;
- localized PDF output.

These fixtures should protect both product behavior and generated-output
contracts.

## Diagnostics

Localization diagnostics should include:

- `LOCALE_INVALID_TAG`;
- `LOCALE_DUPLICATE_PREFIX`;
- `LOCALE_MISSING_DEFAULT`;
- `LOCALE_ROUTE_COLLISION`;
- `LOCALE_MISSING_LABEL`;
- `LOCALE_MISSING_TRANSLATION`;
- `LOCALE_ALTERNATE_TARGET_MISSING`;
- `LOCALE_METADATA_INCOMPLETE`;
- `LOCALE_RTL_UNSUPPORTED_SURFACE`.

Diagnostics should identify the source config, entry, route, or generated
artifact and explain the remediation in author-facing language.

## Verification Plan

Implementation work should add:

- locale schema fixtures;
- route registry snapshots for each route policy mode;
- metadata snapshots for HTML, JSON-LD, RSS, sitemap, PDF, and search data;
- label registry tests for default, override, and missing-label behavior;
- date and count formatting tests;
- RTL component/layout Playwright checks for high-risk components;
- import/export tests proving locale and translation-group data round-trip;
- diagnostics tests for invalid locale config and route collisions.

The design issue is complete when downstream localization and metadata work can
use this document as the platform locale contract.
