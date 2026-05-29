# Metadata Graph And Semantic Profiles

This document defines the target contract for site metadata. The goal is one
normalized metadata graph that can drive HTML `<head>` tags, Schema.org JSON-LD,
Open Graph, Twitter cards, Google Scholar tags, feeds, search records, PDF
metadata, and generated-output verification without duplicating route/content
rules.

## Goals

- Keep metadata truthful, conservative, and derived from visible or configured
  facts.
- Make author-facing defaults simple: normal articles should not need semantic
  configuration.
- Allow advanced metadata when an author or site owner has explicit facts for a
  review, event, book, media work, dataset, software project, or FAQ.
- Give future studio, CLI, MCP, and package consumers a stable data contract
  that can be rendered through Astro today and other adapters later.
- Let verifiers compare generated HTML, feeds, search records, PDFs, and JSON-LD
  against one typed source of truth.

## Non-Goals

- Do not infer hidden claims from prose.
- Do not expose arbitrary author-written JSON-LD blobs.
- Do not add metadata that is more specific than the available facts justify.
- Do not require authors to understand Schema.org, Open Graph, Twitter, or
  Scholar internals.

## Graph Sources

The metadata graph is built from four source layers, in this order:

1. Platform defaults: route families, feature flags, visibility defaults,
   discovery defaults, and stable entity ID policy.
2. Site configuration: publisher identity, site title, language, locale, social
   handles, route roots, feature routes, and fallback images.
3. Content frontmatter and compiler artifacts: title, description, dates,
   authors, category, tags, visibility, image, citations, PDF eligibility, and
   optional semantic profile facts.
4. Generated artifact facts: optimized social images, generated PDF hrefs,
   search record paths, feed item paths, and output file metadata.

The graph must preserve which layer supplied each fact when that matters for
diagnostics. For example, a missing article image is not an error when the site
fallback image can truthfully represent the page, but a broken explicitly
configured image should be diagnostic.

## Core Nodes

These nodes are first-class graph concepts even if their current Astro adapter
renders only a subset of them.

| Node                      | Source of truth                    | Stable ID shape                     | Primary consumers                          |
| ------------------------- | ---------------------------------- | ----------------------------------- | ------------------------------------------ |
| `Site` / `WebSite`        | `site/config/site.json`            | `https://site.example/#website`     | JSON-LD, head tags, feed, search           |
| `Publisher`               | `site/config/site.json`            | `https://site.example/#publisher`   | JSON-LD, article JSON-LD, Scholar/PDF      |
| `Route` / `WebPage`       | route metadata input               | `<canonical>#webpage`               | JSON-LD, canonical, robots, sitemap/search |
| `Article` / `BlogPosting` | article compiler artifact          | `<article-url>#article`             | JSON-LD, Scholar, PDF, search, feed        |
| `Announcement`            | announcement compiler artifact     | `<announcement-url>#announcement`   | JSON-LD, feed, search, homepage            |
| `Author` / `Profile`      | author collection entry            | `<author-url>#author`               | JSON-LD, profile pages, bylines            |
| `Category`                | category entry and route registry  | `<category-url>#category`           | route metadata, lists, breadcrumbs         |
| `Tag`                     | tag normalization                  | `<tag-url>#tag`                     | route metadata, lists, search              |
| `Collection`              | collection content entry           | `<collection-url>#collection`       | route metadata, lists, breadcrumbs         |
| `BreadcrumbList`          | route hierarchy                    | `<route-url>#breadcrumb`            | JSON-LD                                    |
| `ItemList`                | visible route lists                | `<route-url>#itemlist`              | JSON-LD, search/list verification          |
| `CitationSource`          | normalized article-reference model | canonical citation identity         | bibliography, Scholar, PDF, exports        |
| `MediaAsset`              | image/media policy result          | asset path or generated artifact ID | social, article images, feeds, PDFs        |
| `GeneratedArtifact`       | build/generator manifest           | output path                         | verifiers, release reports, future studio  |

Every route should have at most one canonical `WebPage` node. Article-like
routes may additionally have one primary publishable node. A route may have zero
or more supporting nodes such as breadcrumbs, lists, semantic profiles, media,
and citations.

## Discovery Policy

Discovery is explicit and shared across sitemap, feeds, search, robots, and
generated-output verification.

- `robots` controls whether the route may be indexed.
- `sitemap` controls sitemap inclusion.
- `feed` controls feed item inclusion.
- `contentIndex` controls generated search/content-index inclusion.

Route defaults come from route family. Publishable entry defaults come from
visibility settings. Generated outputs must consume the normalized discovery
policy instead of recalculating visibility from frontmatter.

## Semantic Profiles

Semantic profiles are optional author-facing frontmatter blocks. They are
validated at the content schema boundary and normalized into graph nodes by the
metadata layer.

Supported profile families:

| Profile kind | JSON-LD target                                  | Required author facts                 | Notes                                                      |
| ------------ | ----------------------------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| `review`     | `Review` with `itemReviewed`                    | reviewed item name and type           | Rating is optional. Review body must be visible summary.   |
| `book`       | `Book`                                          | book name                             | ISBN, publisher, author, date, URL are optional facts.     |
| `audio`      | `AudioObject`                                   | title                                 | Duration, upload date, URL, embed URL may be supplied.     |
| `video`      | `VideoObject`                                   | title                                 | Thumbnail/embed facts must be explicit when emitted.       |
| `event`      | `Event`                                         | event name and start date             | Status and attendance defaults must be conservative.       |
| `dataset`    | `Dataset`                                       | dataset name and visible description  | Distribution and license URLs are optional explicit facts. |
| `software`   | `SoftwareApplication`                           | software name                         | Version, license, OS, and category are optional facts.     |
| `faq`        | `FAQPage` plus `Question` / `Answer` list       | visible question/answer pairs         | Should only be used for visible FAQ-like content.          |
| `article`    | base `BlogPosting` / future `Article` variants  | normal article frontmatter            | No explicit `semantic.kind` needed for normal articles.    |
| `site`       | `WebSite`, publisher `Organization` or `Person` | site identity config                  | Site-level only, not author frontmatter.                   |
| `list`       | `ItemList`, `CollectionPage`, `ProfilePage`     | visible route list and route metadata | Route-owned; not author frontmatter.                       |

Future profiles must be added as discriminated frontmatter shapes rather than
free-form JSON. Each new profile needs:

- schema validation;
- visible details parity when structured data exposes non-obvious facts;
- JSON-LD builder coverage;
- generated-output verification coverage;
- author documentation with examples and “when not to use this” guidance.

## Truthfulness Rules

Structured data may only emit a fact when at least one of these is true:

- the fact is visible on the route;
- the fact is configured site identity;
- the fact is a generated artifact fact that the route links to;
- the fact is a stable platform relationship, such as an article being part of
  the site.

Do not emit hidden claims such as “reviewed item,” “event location,” “rating,”
“license,” or “download” unless the profile supplies that fact and the page
renders visible details or an equivalent visible link.

If a profile is ambiguous, the validator should reject it or the normalizer
should omit the ambiguous field. Diagnostics should explain the missing or
ambiguous fact instead of guessing.

## Adapter Boundary

The core graph should be framework-neutral data. Astro components should be
adapters:

- `BaseLayout` and `SiteHead` render document-level head tags and route graph
  nodes.
- `ArticleLayout` renders article-specific Scholar, social, PDF, and JSON-LD
  nodes.
- Feed, search, sitemap, PDF, and verifier scripts consume the same normalized
  facts.

This keeps route files thin and gives future package, CLI, MCP, studio, or
non-Astro adapters a single contract to consume.

## Testing And Verification

Milestone implementation must add or preserve:

- pure helper tests for graph node construction, discovery policy, entity IDs,
  semantic profile normalization, and compact JSON-LD output;
- snapshot-like tests for representative route metadata without making output
  brittle to harmless ordering;
- generated-output verifier checks for canonical, robots, description,
  social-image metadata, JSON-LD shape, Scholar tags, PDF links, feed/search
  alignment, and sitemap alignment;
- fixtures for normal articles, announcements, noindex/hidden entries,
  semantic profile entries, pages without images, and disabled optional feature
  routes.

Verification should prove the graph is at least as strict as the current output:
metadata regressions should fail early in pure tests or generated-output checks,
not surface first in external crawlers.
