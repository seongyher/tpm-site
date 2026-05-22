# Metadata, Semantics, And Accessibility Audit

Date: 2026-05-16

## Scope

This report audits the platform for metadata, semantic HTML, accessibility,
social previews, SEO, AI-agent accessibility, and machine readability. It is
both a current-state audit and a research summary for future platform work.

The audit reviewed:

- Source metadata components and helpers in `src/components/seo/`, `src/lib/`,
  `src/layouts/`, and route files under `src/pages/`.
- Content schemas and site-owner configuration in `src/content.config.ts`,
  `src/lib/content/content-schemas.ts`, `src/lib/site/site-config*`, and
  `site/config/site.json`.
- Representative generated output in `dist/`, plus a generated-output scan of
  all 295 built HTML files.
- A one-off full-site axe sweep of the built preview: 234 non-redirect routes
  scanned, 61 redirect documents skipped.
- Existing tests around SEO, Scholar metadata, social images, build
  verification, article layouts, accessibility, and route behavior.
- Authoritative guidance from Google Search Central, Google Scholar, W3C WAI,
  the Open Graph protocol, and Schema.org.

This report does not implement product changes. It scopes the highest-value
metadata and semantic platform work so later implementation can be explicit,
truthful, validated, and low-maintenance.

## Executive Summary

The site has a good baseline:

- Every real route type inspected uses `BaseLayout`, `SiteHead`, a canonical
  URL, title, description, RSS alternate link, language, viewport, and a real
  `<main id="content">` target for skip links.
- Article pages render semantic article structure, author/date metadata, article
  JSON-LD, Scholar citation meta tags, social-preview images, optimized article
  images, and PDF links where enabled.
- Feed, sitemap, robots, icons, canonical redirects, article image alt text, and
  social image generation have all had meaningful recent cleanup.
- Content is already validated through Astro content collections and Zod
  schemas, which is the right foundation for metadata correctness.

The largest gaps are systematic rather than catastrophic:

- Structured data is almost entirely limited to article `BlogPosting` JSON-LD.
  The home page, author pages, category pages, tag pages, collection pages,
  bibliography, search, and index pages do not yet expose page/list/profile/site
  structured data.
- Article JSON-LD is useful but minimal. It can be enriched with language,
  publisher identity, site relationship, `dateModified` when truthful,
  `mainEntityOfPage` as a `WebPage`, and staged citation data.
- Most non-article pages do not receive a default social-preview image, so many
  shareable pages degrade to `twitter:card=summary` and no `og:image`.
- Site identity config is too thin for a reusable blogging platform. It should
  support logo, same-as social URLs, default social image, locale, theme color,
  organization/person identity, and optional contact/profile fields.
- There is no metadata route contract or built-output metadata matrix test, so
  drift can return quietly when new route types are added.
- We should add a careful frontmatter path for optional special schemas, such as
  reviews, videos, audio, events, datasets, books, and software, but only when
  the visible page content actually supports that markup.

The recommended immediate path is to add typed metadata primitives, route-level
metadata contracts, sitewide structured data, default social image fallbacks,
list/profile structured data, richer article metadata, and validation tests.

## Roadmap Decisions

After review, these items are in scope for the metadata/semantics/accessibility
roadmap. They should be designed and implemented after the core metadata
contract is in place:

- Optional typed special-schema frontmatter for common cases such as reviews,
  videos, audio posts, books, events, datasets, software writeups, and FAQs.
  This should be a narrow validated author interface, not arbitrary JSON-LD.
- Richer bibliography and citation metadata, starting with conservative
  `citation_reference` strings and bibliography collection/list metadata.
  Source-type-specific JSON-LD should wait until citation source typing is
  reliable.
- A truthful modified-date policy. Authors may provide an explicit `updated` or
  equivalent field; the platform should emit `dateModified`,
  `article:modified_time`, and related structured data only when that field is
  present. Do not infer modified dates from git history or file mtimes.
- AI-friendly content surfaces generated from canonical content data, such as a
  route/entity manifest, a public content index, stable `@id` values, and
  optional `llms.txt` after we define a clear contract for it.
- Parser-based image-alt validation that distinguishes missing alt text,
  intentionally empty decorative alt text, and meaningful content-image alt
  text.
- A documented manual validation workflow for major metadata changes, including
  Google Rich Results Test, Schema.org validator, Lighthouse, browser
  accessibility inspection, and social-preview validators where useful.

One item remains deferred:

- Embed accessibility strategy. The broad axe sweep found only third-party
  iframe internals from YouTube and SoundCloud, not first-party template
  failures. Keep provider issues visible, but revisit click-to-load embeds,
  transcripts, captions, and lightweight fallbacks as a separate embed UX
  project.

## Implementation Handoff Summary

### Core Goal

Make metadata, structured data, semantic guarantees, and accessibility checks a
typed platform layer instead of route-by-route incidental markup. A developer
should be able to add a new route or content type and get correct canonical
metadata, social previews, JSON-LD, robots behavior, and validation failures by
using the shared metadata contract.

### Non-Goals

- Do not change public URLs.
- Do not add SSR, middleware, request-time metadata, or client-only metadata.
- Do not add arbitrary JSON-LD frontmatter as the main authoring interface.
- Do not emit review, event, FAQ, or source-type schema unless the visible page
  content and validated source data support it.
- Do not infer modified dates from git history, file mtimes, build time, or
  migration metadata.
- Do not fail first-party accessibility gates on third-party iframe internals
  that the site cannot control.

### Architectural Conclusions

- Add a metadata domain under `src/lib/metadata/` or an equivalent namespace.
  It should own route metadata types, default normalization, JSON-LD builders,
  social-image normalization, robots policy, sitemap inclusion policy, and
  validation helpers.
- Keep `SiteHead` as a renderer over a normalized metadata model. It should not
  know how articles, authors, tags, or collections are loaded.
- Keep route files thin: load content, call the appropriate metadata builder,
  pass the normalized model to layout/head components, and render blocks.
- Build JSON-LD with pure helpers that return serializable objects. Tests should
  exercise helpers without rendering full pages.
- Validate new author-facing fields at the content schema boundary, not inside
  visual components.
- Built-output checks should parse generated HTML and JSON-LD, not rely on
  regexes.

### Route Metadata Matrix

| Route family                 | Robots                                                  | Social image                               | Structured data                                                                 | Notes                                                                           |
| ---------------------------- | ------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Home                         | `index,follow`                                          | Site default or configured home image      | `WebPage`, site `WebSite`, publisher, visible `ItemList` blocks where practical | Main first impression; complete social object is required.                      |
| Article                      | `index,follow` unless content visibility says otherwise | Generated article social JPG with fallback | `BlogPosting` or `Article`, `WebPage`, publisher, optional citation metadata    | Scholar meta and PDF link stay article-specific.                                |
| Announcement                 | `index,follow` unless visibility says otherwise         | Announcement image or default social image | `BlogPosting` or `Article`, `WebPage`, publisher                                | No Scholar metadata by default.                                                 |
| Articles/archive             | `index,follow`                                          | Default social image                       | `CollectionPage`, `ItemList`, breadcrumbs where useful                          | Emit visible entries, not necessarily every historical item if paginated later. |
| Category/tag/collection page | `index,follow`                                          | Default social image                       | `CollectionPage`, `ItemList`, breadcrumbs                                       | ItemList should match visible article list.                                     |
| Author index                 | `index,follow`                                          | Default social image                       | `CollectionPage`, `ItemList`                                                    | List authors or author pages represented visibly.                               |
| Author detail                | `index,follow`                                          | Author image or default social image       | `ProfilePage`, `Person` or `Organization`, article `ItemList`                   | Anonymous/collective authors need explicit type handling.                       |
| Bibliography                 | `index,follow`                                          | Default social image                       | `CollectionPage`, `ItemList`, conservative source entries                       | Use `CreativeWork` only until source typing improves.                           |
| Search                       | `noindex,follow` by default                             | Default social image                       | Plain `WebPage` only                                                            | Static search landing page is useful to users, but not a search-result page.    |
| 404                          | `noindex,follow`                                        | Default social image optional              | Plain `WebPage` only                                                            | Keep accessible navigation, no fake structured data.                            |
| Legacy redirect              | `noindex,follow`                                        | None required                              | None required                                                                   | Canonical + meta refresh + fallback link are the contract.                      |

### Stable Entity ID Policy

Use canonical URLs plus fragments so JSON-LD nodes can reference each other
without duplicating identity:

- Site: `{siteUrl}/#website`
- Publisher: `{siteUrl}/#publisher`
- Page: `{canonicalUrl}#webpage`
- Article or announcement: `{canonicalUrl}#article`
- Author entity: `{authorUrl}#author`
- Collection/list page: `{canonicalUrl}#collection`
- Item list: `{canonicalUrl}#itemlist`
- Bibliography source, after source IDs are stable:
  `{siteUrl}/bibliography/#source-{sourceId}`

IDs must be deterministic, canonical, and generated from route helpers or
canonical content IDs. Do not build them by hand in visual components.

### Cross-Cutting Acceptance Criteria

Every implementation milestone should preserve these invariants:

- Every shareable HTML route has a title, description, canonical URL,
  language, robots policy, Open Graph title/type/url/description, Twitter
  metadata, and either a route social image or default social image.
- Every emitted JSON-LD block parses as JSON, uses stable `@id` values, matches
  visible page content, and avoids unsupported claims.
- Robots policy, sitemap inclusion, feed inclusion, and public content-index
  inclusion stay aligned. A route or entry that is intentionally `noindex` or
  hidden from public discovery must not leak through another machine-readable
  surface.
- Article and announcement metadata is generated from content data and site
  config, not duplicated in templates.
- Author-facing metadata remains small and validated.
- Generated output remains static-first with no new runtime JavaScript for
  metadata.
- Accessibility gates distinguish site-owned markup from third-party iframe
  internals.
- Release verification includes metadata tests, `html-validate`, axe,
  Lighthouse where applicable, and existing release checks.

### Recommended Implementation Order

Implement in dependency order:

1. Metadata contract and route matrix tests.
2. Site identity config, default social image, and sitewide JSON-LD.
3. Route-family structured data.
4. Article/announcement enrichment and explicit modified-date field.
5. Scholar/bibliography enrichment.
6. Validation tooling and docs.
7. Typed special schemas.
8. AI-friendly content surfaces.

Milestones should not skip the validation layer. If a milestone adds metadata
without tests or built-output checks, the work is not complete.

## Research Baseline

### Search Metadata And Structured Data

Google Search Central frames structured data as explicit page information that
helps Google understand page content. Google recommends JSON-LD where possible
and stresses that structured data should match visible page content and follow
the relevant feature guidelines.

High-value Google Search structured-data areas for this platform:

- `Article`, `NewsArticle`, and `BlogPosting` for article-like entries.
- `Organization` and `Person` for publisher and author identity.
- `BreadcrumbList` for site hierarchy.
- `ProfilePage` for author pages where the page is about a person or
  organization.
- `Review` only when a page is truly a review and the reviewed item/rating data
  is visible and truthful.
- `ItemList` and `CollectionPage` are Schema.org vocabulary rather than a
  guaranteed Google rich-result feature, but they are valuable for machine
  readability of archives, collections, tags, and categories.

Google's rich result gallery is narrower than Schema.org. That distinction
matters: not every schema type creates visible Search UI, but well-formed
schema can still help downstream tools, AI agents, crawlers, and internal
platform features understand the site.

### Social Previews

Open Graph requires `og:title`, `og:type`, `og:image`, and `og:url` for a
complete graph object. The site already emits the core fields, including image
dimensions/type/alt when an image exists. The main issue is that many index or
directory pages have no social image fallback, so they do not emit `og:image`.

For a platform, social-preview behavior should be:

- Every public shareable page gets a complete canonical social object.
- Article pages use a generated 1200x630 JPG based on article image/fallback.
- Directory and utility pages use a configurable site default image.
- All social images include width, height, type, and alt text when available.
- Article pages also emit article-specific Open Graph fields.

### Scholar And Academic Discoverability

Google Scholar expects bibliographic metadata in the page head and discoverable
full-text files. The site already emits:

- `citation_title`
- one or more `citation_author`
- `citation_publication_date`
- `citation_pdf_url` when the article PDF is enabled

The next useful fields are:

- `citation_language`
- `citation_keywords`
- `citation_abstract`
- `citation_online_date` if it differs from publication date
- `citation_reference` after bibliography metadata is stable enough to expose
  citation strings reliably

Do not invent journal metadata, volume/issue metadata, institution metadata, or
modified dates unless the site actually owns that information.

### Semantic HTML And Accessibility

W3C WAI guidance reinforces the site's current direction:

- Use real page structure: landmarks, headings, navigation, main content, and
  semantic grouping.
- Use heading levels to describe page outline and subsection hierarchy.
- Give informative images meaningful alternatives.
- Give decorative images empty alternatives so assistive technology can skip
  them.

Important audit note: the built output contains decorative brand/logo images
with shorthand `alt` attributes. In HTML this represents an empty attribute
value, so it is semantically equivalent to `alt=""`. Some simple scanners may
flag it as missing because they search for `alt=` text. That is a scanner
limitation, not necessarily an accessibility failure. We should validate with
real HTML parsers, axe, html-validate, and browser accessibility snapshots
before changing decorative alt handling.

### AI-Agent And Machine Readability

There is no separate magic metadata layer for AI agents. The highest-value
machine-readability work is the same foundation that helps search, readers, and
assistive technology:

- Clean semantic HTML.
- Stable canonical URLs.
- Complete titles/descriptions/headings.
- Structured data that truthfully describes page entities.
- RSS, sitemap, and robots metadata.
- Machine-readable author, publisher, date, tag, category, citation, PDF, and
  bibliography relationships.
- Predictable content schemas and stable route helpers.
- Minimal client-side dependence for primary content.

`llms.txt` is a possible later output after the canonical metadata and content
index surfaces exist. It should not replace standard web semantics and
structured data.

## Current-State Inventory

### Base Document Metadata

`BaseLayout` and `SiteHead` currently provide the core document layer:

- `<!doctype html>`
- `<html lang={siteConfig.identity.language}>`
- charset and viewport
- SVG favicon and Apple touch icon
- canonical URL
- page title
- meta description
- RSS alternate link
- Open Graph site name, type, title, description, URL
- optional Open Graph image, dimensions, type, and alt
- Twitter card, title, description, optional image and alt
- skip link targeting `<main id="content">`

This is a solid baseline.

Immediate improvements:

- Add `og:locale` from site config.
- Add `twitter:site` and optional `twitter:creator` from site config.
- Add default social image fallback for shareable non-article pages.
- Add `theme-color`, `color-scheme`, and `application-name` if the design tokens
  can provide stable values.
- Add route-aware `robots` metadata where needed, especially search/404/utility
  routes if the platform chooses `noindex`.

### Structured Data

The generated output currently contains 59 JSON-LD blocks, all `BlogPosting`,
matching the 59 article pages. Representative article JSON-LD includes:

- `@context`
- `@type: BlogPosting`
- `articleSection`
- `author`
- `datePublished`
- `description`
- `headline`
- `image`
- `keywords`
- `mainEntityOfPage`
- `publisher`
- `url`

Missing structured-data coverage:

- sitewide `WebSite`
- sitewide `Organization` or `Person` publisher entity
- `BreadcrumbList` for major routes
- `CollectionPage`/`ItemList` for home modules, article archives, category
  pages, tag pages, collection pages, author indexes, and bibliography
- `ProfilePage` for author pages
- announcement article-like JSON-LD
- richer article fields such as `inLanguage`, `isPartOf`, `dateModified` when
  available, `mainEntityOfPage` as a `WebPage` object, and publisher logo/url
- citation-aware structured data after bibliography data is stable

### Article Pages

Article pages are the strongest route type:

- Semantic `<article>` layout.
- H1 title.
- Category, author, and date metadata.
- Article actions for cite/share/PDF.
- Tailwind Typography prose.
- In-article table of contents.
- Generated article images as figures with inspect behavior.
- References, bibliography, tags, next article, support block, and related
  category block.
- Scholar meta and article JSON-LD.

Planned improvements:

- Add Open Graph article properties:
  - `article:published_time`
  - `article:modified_time` only when available
  - `article:author`
  - `article:section`
  - repeated `article:tag`
- Add `dateModified` only after we add an `updated` or `modified` field with a
  truthful authoring policy.
- Add `citation_language`, `citation_keywords`, and `citation_abstract`.
- Add `citation_reference` and/or Schema.org `citation` from structured
  bibliography data once citation strings are reliable.
- Defer `ScholarlyArticle` unless we define a truthful, author-controlled
  policy for explicitly scholarly pages. The default should remain
  `BlogPosting` or `Article`.

### Announcements

Announcements are article-like but separate from public article aggregations.
They use public page metadata but currently lack their own JSON-LD.

Recommended behavior:

- Emit `Article` or `BlogPosting` JSON-LD for announcement pages.
- Do not emit Scholar metadata by default.
- Keep announcement visibility controls separate from schema truthfulness.
- Include announcements in feed where `visibility.feed` and feature config
  allow it, which the site already does.

### Author Pages

Author pages have titles, descriptions, canonical URLs, and visible article
lists. They do not currently expose author structured data.

Recommended behavior:

- Emit `ProfilePage` with `mainEntity` as `Person` or `Organization` based on
  author type.
- Include author URL, display name, website, socials as `sameAs`, aliases as
  `alternateName`, and short bio as description when present.
- Keep anonymous/collective author behavior explicit so we do not mislabel
  anonymous entities as normal people.

### Categories, Tags, Collections, And Archives

These route families are important for human navigation and machine
readability. They currently have basic titles, descriptions, canonical URLs, and
visible lists, but no list structured data.

Recommended behavior:

- Emit `CollectionPage` for category, tag, collection, archive, and index pages.
- Emit an `ItemList` of visible entries with `ListItem.position`, `url`, and
  `name`.
- Include page description and `mainEntity` where the page is fundamentally a
  list.
- Keep list size bounded when needed to avoid large JSON-LD output on huge
  archives. A reasonable first rule is to emit items already visible on the
  page, not every possible entry.

### Bibliography

The site bibliography is a valuable machine-readable entity. Today it is a
human-readable route with links and backlinks, but no dedicated structured data.

Recommended behavior:

- Treat `/bibliography/` as a `CollectionPage`.
- Emit an `ItemList` of source entries when the output size remains reasonable.
- Use `CreativeWork`, `Book`, `ScholarlyArticle`, `Article`, `WebPage`, or
  `VideoObject` for entries only after the citation model has reliable source
  type fields. Until then, use conservative `CreativeWork` or list-only
  metadata.
- Link bibliography entries back to citing articles in visible HTML first; make
  JSON-LD an enhancement.

### Search And Utility Pages

The search page has ordinary metadata and a canonical URL. Treat it as
`noindex,follow` by default because the static page is a utility surface, not a
search-result landing page with durable indexable content.

Recommended behavior:

- Emit `noindex,follow` for `/search/` unless a future product decision turns
  it into a content-rich landing page.
- Keep the title/description useful for users who arrive directly.
- Do not add fake query-specific structured data to the static search route.

### Redirect Pages

The generated legacy redirect pages intentionally contain minimal HTML, a
canonical link to the modern article URL, `meta refresh`, `robots noindex`, and
a fallback anchor. The generated-output scan flags them as missing description,
Open Graph, H1, main, and language.

Those findings are acceptable for redirect-only documents. If we want to reduce
scanner noise, we can add `<html lang>` and a tiny body structure to the
redirect template, but this should be low priority because canonical/noindex
behavior is the real contract.

### Images And Alt Text

Article prose images now generally have meaningful alt text and optimized Astro
image output. Article preview image fallbacks were previously added.

The audit found decorative support/social brand logos rendered as `<img alt>`
with shorthand empty alt. That is correct only if the built HTML parser treats
it as an empty value equivalent to `alt=""`; regex-based scanners may still
misread it.

Recommended behavior:

- Keep meaningful alt text required for content images.
- Keep decorative brand art empty-alt or hidden from assistive technology when
  the surrounding link/button has an accessible name.
- Consider rendering decorative SVG/logo assets in a way that serializes as
  `alt=""` if third-party scanner false positives become operationally noisy.
- Add a parser-based built-output check that differentiates missing alt,
  empty decorative alt, and meaningful alt.

### Generated Accessibility Sweep

The repo already has Playwright + `@axe-core/playwright` coverage through
`bun run test:a11y` and `bun run test:a11y:built`. The current CI-style scan is
representative rather than exhaustive: it covers home, articles, one article,
bibliography, categories, one category, about, and search, and fails only on
serious or critical axe violations.

For this research pass, a temporary full-site scanner ran axe across every
non-redirect HTML route in the built preview:

- 295 built HTML files found.
- 61 legacy redirect documents skipped because their meta-refresh behavior
  navigates before axe can reliably inspect the document.
- 234 normal routes scanned.
- 3 routes reported issues, with 5 total serious/critical violations.

The reported violations were all inside third-party embed iframes rather than
site-owned HTML:

- `/articles/gondola-shrine/`: YouTube iframe internals use an `aria-label` on
  a `div` without a valid role.
- `/articles/the-memetic-bottleneck/`: YouTube iframe internals have the same
  `aria-label` issue plus an unnamed internal video-info button.
- `/articles/the-structure-of-hyperspatial-politics/`: SoundCloud iframe
  internals use an invalid `role="bar"` and invalid `aria-role` attribute.

Interpretation:

- The broad sweep did not find serious or critical first-party template
  failures.
- Third-party widgets can still create accessibility debt for users, but we
  cannot directly repair markup inside provider iframes.
- Future automated axe coverage should separate first-party page checks from
  third-party iframe audits. First-party gates should exclude provider iframes
  or configure axe to avoid failing on markup we do not control. Third-party
  iframe results should remain visible as a periodic risk report.
- Embeds should keep accessible first-party wrappers, titles, captions, and
  fallbacks. If a provider iframe remains noisy or poor for users, the platform
  should prefer click-to-load embeds, plain links, transcripts, captions, or
  provider-specific lightweight fallbacks rather than accepting the iframe as
  the only content surface.

## High-Value Immediate Work

### 1. Add A Metadata Route Contract

Create a typed route metadata model that every page family must satisfy before
rendering `BaseLayout`.

The model should normalize:

- `title`
- `description`
- `canonicalPath`
- route kind
- Open Graph type
- social image or default fallback
- robots policy
- sitemap/feed/content-index inclusion policy
- page language/locale
- optional structured-data graph nodes

This should live in `src/lib/metadata` or equivalent, not inside visual
components.

Why it matters:

- Prevents route drift.
- Makes new pages harder to ship without metadata.
- Gives tests one place to assert platform metadata contracts.
- Makes future admin/UI configuration easier.

### 2. Extend Site Identity Config

`site/config/site.json` should grow from basic identity into platform identity.

Recommended fields:

```json
{
  "identity": {
    "title": "The Philosopher's Meme",
    "shortTitle": "TPM",
    "description": "...",
    "url": "https://thephilosophersmeme.com",
    "language": "en",
    "locale": "en_US",
    "publisherName": "The Philosopher's Meme",
    "publisherType": "Organization",
    "logo": "...",
    "defaultSocialImage": "...",
    "sameAs": [
      "https://x.com/philo_meme",
      "https://www.facebook.com/thephilosophersmeme"
    ],
    "themeColor": "#...",
    "timezone": "America/New_York"
  }
}
```

Keep optional fields optional. The platform should emit only truthful data.

### 3. Add Sitewide JSON-LD

Add one graph that identifies the site and publisher:

- `WebSite`
- `Organization` or `Person`
- publisher logo
- site URL
- same-as profiles
- language

Use stable `@id` URLs so other JSON-LD nodes can refer to the site and
publisher without duplicating data.

### 4. Add List And Profile JSON-LD

Add structured data for non-article route types:

- `ProfilePage` for author pages.
- `CollectionPage` + `ItemList` for archives, category pages, tag pages,
  collection pages, announcements index, author index, and bibliography.
- `BreadcrumbList` for major route hierarchies.

Emit only items visible on the page or otherwise clearly represented by the
page.

### 5. Enrich Article And Announcement Metadata

Enhance article JSON-LD and social metadata:

- `inLanguage`
- `isPartOf`
- publisher `@id`
- `mainEntityOfPage` as a `WebPage` object
- `article:published_time`
- `article:section`
- `article:tag`
- `twitter:site`
- optional `twitter:creator`
- `dateModified` and `article:modified_time` only after an author-facing
  modified-date policy exists

Extend announcement pages with article-like JSON-LD but skip Scholar metadata
unless explicitly enabled later.

### 6. Improve Scholar Metadata Carefully

Immediate low-risk additions:

- `citation_language`
- `citation_keywords`
- `citation_abstract`

Future additions after bibliography stabilization:

- `citation_reference`
- source-level citation metadata in JSON-LD
- richer PDF metadata validation

### 7. Add Metadata Validation

Add validation that covers source models and built output:

- Unit tests for structured-data builders.
- Component tests for `SiteHead` and route metadata normalization.
- A built-output metadata matrix that checks representative pages by route
  type.
- JSON-LD parse validation and required-property assertions.
- Social image checks for shareable route types.
- Parser-based image-alt audit.
- `html-validate`, accessibility, Lighthouse, and release checks as final gates.
- Exhaustive axe audit mode that reports all first-party serious/critical
  issues across built routes while treating third-party iframe internals as a
  separately reported provider risk.

## Forward-Looking Platform Opportunities

### Optional Special Schemas

Some articles may benefit from extra schema. This is now a planned platform
capability, but it must be opt-in, typed, validated, and truthful.

This is a platform feature, not a TPM-only SEO enhancement. The author-facing
interface should help different site owners describe richer page intent without
learning JSON-LD or Schema.org internals, while keeping invalid and misleading
metadata hard to publish.

Target frontmatter shape:

```yaml
semantic:
  kind: review
  item:
    type: video
    name: Undertale
    url: https://undertale.com/
  rating:
    value: 9
    best: 10
```

Design principles:

- Keep base route identity separate from the semantic profile. An article page
  remains `BlogPosting`/`Article`; a review, event, dataset, video, or software
  profile adds a related `Review`, `Event`, `Dataset`, `VideoObject`, or
  `SoftwareApplication` node rather than pretending the page itself is that
  object.
- Use the same normalized semantic data for visible page details and JSON-LD.
  This keeps structured data aligned with what readers can see.
- Model semantic frontmatter as a discriminated union. Do not expose arbitrary
  JSON-LD as the normal authoring interface.
- Prefer a complete, tested subset of each kind over a broad, loose field bag.
- Allow platform users with different editorial goals to use the feature
  without TPM-specific assumptions.

Initial supported kinds should cover the common platform cases:

- `review` for qualitative or rated reviews of a book, article, video, audio,
  software project, dataset, event, or other creative work.
- `event` for pages or announcements centered on a real event with visible
  date/time and location/online attendance data.
- `video` for pages centered on a visible video.
- `audio` for pages centered on a visible audio work or embed.
- `book` for pages centered on a book, especially book announcements or
  reviewable works.
- `dataset` for published datasets, corpora, downloadable research material,
  or data-driven project pages.
- `software` for software/project release pages.
- `faq` only for pages with visible question/answer content.

First implementation scope:

- Add the `semantic` field to article-like publishable content.
- Add strict Zod schemas and TypeScript types for the supported profile kinds.
- Add pure normalization and JSON-LD builder helpers.
- Add a compact visible details component that renders only useful facts.
- Integrate article and announcement JSON-LD with optional semantic nodes.
- Document the authoring rules in `site/README.md`.

Non-goals for the first implementation:

- Do not add raw arbitrary JSON-LD frontmatter.
- Do not add schema kinds without a typed contract and tests.
- Do not infer semantic profiles from prose, embeds, filenames, or categories.
- Do not emit hidden structured data that is not represented in visible page
  content.
- Do not chase every Google rich-result property on day one; use complete
  enough Schema.org nodes and document which extra fields improve eligibility.

Validation expectations:

- Content schema tests for valid and invalid profile frontmatter.
- Helper tests for normalized details and JSON-LD output.
- Component tests proving visible details render useful facts and omit empty
  fields.
- Article and announcement JSON-LD tests proving semantic nodes are included
  only when frontmatter opts in.
- Release validation continues to parse emitted JSON-LD.

Implemented platform shape:

- `src/lib/metadata/semantic-metadata.ts` owns the typed `semantic` schema,
  visible details view model, and JSON-LD node builder.
- `src/lib/content/content-schemas.ts` exposes `semantic` on article-like
  publishable entries while preserving strict frontmatter validation.
- `ArticleJsonLd` and `AnnouncementJsonLd` keep normal `BlogPosting` output for
  ordinary entries and switch to a graph only when semantic nodes are present.
- `SemanticDetails` renders the reader-visible facts in the article opening so
  optional structured data does not become hidden metadata.
- The first implementation supports `review`, `event`, `video`, `audio`,
  `book`, `dataset`, `software`, and `faq` profiles.
- Build verification recognizes `BlogPosting` nodes inside JSON-LD graphs, so
  social-image and article-metadata checks continue to cover semantic pages.

Future expansion opportunities:

- More item subtypes for reviews.
- More rich-result fields where there is real visible source data.
- Site-config defaults for labels and profile availability.
- Advanced raw JSON-LD escape hatch only after typed profiles are stable and
  only for technical maintainers, not as the primary authoring model.

Do not add generic freeform JSON-LD frontmatter as the primary interface. It is
too easy for non-technical authors to create invalid or misleading data. Prefer
typed, narrow frontmatter variants that the platform maps to valid JSON-LD.

### Citation And Bibliography Graphs

The article-reference system creates a meaningful foundation for richer
metadata:

- Article JSON-LD `citation` can point to structured source entries.
- The site bibliography can become a machine-readable collection of cited
  works.
- PDF Scholar metadata can include `citation_reference`.
- Backlinks from source entries to citing articles can become explicit
  `isPartOf` or `subjectOf` relationships later.

This work should be staged. Conservative citation strings and list metadata are
safe to add first. Source-specific JSON-LD remains blocked on source typing: we
should not emit a `ScholarlyArticle`, `Book`, or `VideoObject` for a
bibliography entry until the citation model knows the entry type reliably.

### AI-Friendly Content Surfaces

Useful planned surfaces:

- A concise machine-readable site manifest with routes and feature flags.
- A public content index endpoint for articles, announcements, collections,
  authors, categories, and tags.
- Stable content IDs and `@id` values for authors, articles, collections,
  source entries, and publisher identity.
- Optional `llms.txt` only after we define what it should promise and how it
  stays current.

These should be generated from canonical content data, not hand-maintained.

## Recommended Implementation Milestones

### Milestone A: Metadata Contract Design

Design and document the metadata contract before broad implementation. This is
the highest-leverage milestone because every later milestone should compose
through this model instead of adding route-specific head markup.

Entry conditions:

- None.

Likely touch points:

- New metadata helpers under `src/lib/metadata/` or equivalent.
- Tests under `tests/src/lib/metadata/`.
- Existing metadata tests in `tests/src/lib/metadata/seo.test.ts` and related
  route tests.

Deliverables:

- Route metadata taxonomy.
- Typed metadata view model.
- Social image fallback policy.
- Robots policy by route type.
- Sitemap, feed, and public content-index inclusion policy by route/content
  visibility.
- JSON-LD graph ownership model.
- Validation matrix.
- Stable entity ID policy encoded as helpers.
- Decision for `/search/`: default `noindex,follow` unless a later product
  decision makes the static search page an indexable landing page.

Primary risks:

- Overfitting to current TPM content.
- Making author frontmatter too complex.
- Emitting metadata that does not match visible content.

Tests to write early:

- Metadata normalization tests for articles, announcements, list pages, author
  pages, search, 404, and redirects.
- Robots, sitemap, feed, and public content-index inclusion tests for public
  pages, utility pages, noindex pages, and hidden content.
- Stable `@id` helper tests.

Acceptance criteria:

- A developer can identify one metadata builder or normalization path for every
  route family in the route matrix.
- New route families cannot accidentally bypass the metadata contract without
  becoming obvious in tests.
- The contract distinguishes route metadata, site identity, content metadata,
  and JSON-LD graph nodes.
- No visual component owns content-specific metadata decisions.

### Milestone B: Site Identity And Head Metadata

Implement platform identity config and richer head tags.

Dependencies:

- Milestone A route metadata contract.

Likely touch points:

- `site/config/site.json`
- site config schemas and tests under `src/lib/site/site-config*`
- `src/components/seo/SiteHead.astro` or equivalent
- social-image helpers and existing social-image tests
- author/site-owner docs in `site/README.md` if configuration changes

Deliverables:

- Extended site identity schema and docs.
- Default social image support for shareable routes.
- `og:locale`, `twitter:site`, optional `twitter:creator`.
- `theme-color`, `color-scheme`, and `application-name` if supported by tokens.
- Sitewide `WebSite` and publisher JSON-LD.
- Publisher identity fields: type, name, URL, logo, same-as links, language,
  locale, and default social image.

Tests:

- Site config schema tests.
- `SiteHead` component tests.
- Built-output checks for article and non-article social tags.
- Sitemap output checks for route classes with `index` and `noindex` policies.

Acceptance criteria:

- Every shareable HTML route has a complete Open Graph and Twitter preview
  object, including a default image when route-specific image data is absent.
- The publisher and website JSON-LD nodes use stable `@id`s and are referenced
  by article/list/profile graph nodes later.
- Missing optional identity fields do not produce empty or misleading meta tags.
- Site owners can understand the new config fields from docs without reading
  implementation code.

### Milestone C: Route Structured Data

Add route-family structured data.

Dependencies:

- Milestone A metadata contract.
- Milestone B site identity graph IDs.

Likely touch points:

- JSON-LD builder helpers in `src/lib/metadata/`.
- Route files under `src/pages/`.
- Article/list/author/category/tag/collection data helpers under `src/lib/`.
- Built-output verification scripts.

Deliverables:

- `BreadcrumbList` helpers.
- `CollectionPage` and `ItemList` helpers.
- `ProfilePage` helpers.
- Route integration for authors, categories, tags, collections, archives,
  bibliography, announcements, and home.
- Bounded `ItemList` policy: emit items visibly represented on the page, not
  invisible unbounded datasets.
- Conservative bibliography metadata: list/page structure first, source-type
  metadata later.

Tests:

- JSON-LD builder tests.
- Route output tests for representative pages.
- Build verifier checks for parseable JSON-LD.

Acceptance criteria:

- Home, articles/archive, authors, author detail, categories, tags,
  collections, announcements index, bibliography, and article-like pages emit
  appropriate structured data.
- JSON-LD items match visible page content and canonical URLs.
- Breadcrumbs are emitted only where they represent real hierarchy.
- The implementation avoids duplicate or contradictory publisher/site nodes.

### Milestone D: Article And Announcement Enrichment

Enrich publishable metadata without changing author burden.

Dependencies:

- Milestone A metadata contract.
- Milestone B site identity.
- Milestone C structured-data helpers.

Likely touch points:

- Article and announcement content schemas.
- Article route and announcement route metadata builders.
- `SiteHead` article Open Graph rendering.
- Scholar metadata helpers and tests.
- Author-facing docs for the modified-date field.

Deliverables:

- More complete article JSON-LD.
- Announcement JSON-LD.
- Article Open Graph properties.
- Explicit author-facing modified-date policy and schema field.
- `dateModified` and `article:modified_time` emitted only when a truthful
  modified date is present.
- `inLanguage`, `isPartOf`, publisher `@id`, `WebPage` `mainEntityOfPage`,
  `article:published_time`, `article:section`, and repeated `article:tag`.

Tests:

- Article/announcement component tests.
- Existing PDF and social-image tests.
- Built-output checks against representative article and announcement pages.

Acceptance criteria:

- Articles and announcements share the same publishable-entry metadata path
  where appropriate, while preserving announcement-specific differences.
- Announcements emit article-like schema but not Scholar metadata by default.
- Modified dates are absent when authors do not set an explicit field.
- Existing article authoring remains valid unless it contains invalid dates or
  explicitly invalid new metadata.

### Milestone E: Scholar And Bibliography Metadata

Improve academic metadata and citation relationships.

Dependencies:

- Milestone D article metadata.
- Existing article-reference/bibliography system.

Likely touch points:

- Article reference helpers under `src/lib/references/article-references/`.
- Bibliography route/components.
- Scholar metadata tests.
- PDF generation metadata if Scholar/PDF output shares citation strings.

Deliverables:

- `citation_language`, `citation_keywords`, and `citation_abstract`.
- Conservative `citation_reference` output when citation strings can be derived
  reliably.
- Conservative bibliography `CollectionPage`/`ItemList` output.
- A staged design for source-typed bibliography JSON-LD once source typing is
  available.
- Documentation for what Scholar metadata does and does not promise.
- Clear fallback behavior when an article has no references or when references
  cannot be converted into high-quality citation strings.

Tests:

- Scholar meta tests.
- Citation-reference validation once implemented.
- Bibliography route JSON-LD parse tests.

Acceptance criteria:

- Scholar fields are emitted only when the platform has truthful source data.
- `citation_reference` output is deterministic and does not expose malformed or
  placeholder citation strings.
- Bibliography structured data is conservative and useful without pretending to
  know source types the model does not yet represent.

### Milestone F: Metadata Validation Tooling

Make drift visible.

Dependencies:

- Can begin after Milestone A; should expand as B-E land.

Likely touch points:

- Existing verifier scripts under `scripts/`.
- SEO/route tests under `tests/src/lib/` and `tests/config/`.
- Playwright accessibility tests under `tests/a11y/`.
- `PACKAGE_SCRIPTS.md` if new scripts are added.
- CI workflow if a new release gate is promoted.

Deliverables:

- Route metadata matrix test.
- Sitemap/feed/content-index policy test.
- Built-output JSON-LD parse test.
- Parser-based image-alt audit.
- First-party full-site axe sweep with redirect handling and third-party iframe
  reporting separated from site-owned failures.
- Social-preview metadata test for route classes.
- Docs describing which validators to run manually before major releases.
- Clear distinction between blocking release gates and advisory/manual
  validators.

Manual validation tools:

- Google Rich Results Test for representative pages.
- Schema.org validator for non-Google schema types.
- Lighthouse SEO and accessibility audits.
- Browser accessibility snapshots for core templates.
- Social preview validators where available.

Acceptance criteria:

- A developer can run one documented validation path and know whether metadata
  is release-ready.
- Built-output tests fail on missing canonical metadata, invalid JSON-LD,
  missing required social images, broken robots policy, and real missing image
  alt text.
- Sitemap/feed/content-index tests fail when noindex or hidden content leaks
  into public machine-readable discovery surfaces.
- Third-party iframe accessibility issues are reported but do not fail
  first-party markup gates.
- Existing release checks remain green or are intentionally updated with docs.

### Milestone G: Typed Special Schemas

Add optional author-facing schema variants after the core route metadata model
is stable.

Dependencies:

- Milestone A metadata contract.
- Milestone D article/announcement enrichment.
- Milestone F validation infrastructure.

Likely touch points:

- Content schema definitions.
- JSON-LD builders.
- Author docs in `site/README.md`.
- Tests for invalid content fixtures if available.

Deliverables:

- Narrow frontmatter schemas for approved kinds such as review, video, audio,
  book, event, dataset, software, and FAQ.
- Source-to-JSON-LD builders that emit only fields supported by visible page
  content and validated frontmatter.
- Author docs explaining when to use each schema kind and when not to use it.
- No generic arbitrary JSON-LD escape hatch in the first implementation.

Tests:

- Schema validation tests for valid and invalid frontmatter.
- JSON-LD builder tests for each supported kind.
- Representative article output tests proving structured data matches visible
  page content.

Acceptance criteria:

- Authors can opt into common schema types without learning JSON-LD.
- Invalid combinations fail at content validation time.
- Optional schemas never emit fields that are absent from visible content or
  validated frontmatter.
- The first implementation may support a smaller subset of schema kinds if each
  supported kind is complete and well tested.

### Milestone H: AI-Friendly Content Surfaces

Generate machine-readable indexes from canonical content data.

Dependencies:

- Milestone A metadata contract.
- Milestone B stable site identity.
- Milestone C route structured data.

Likely touch points:

- Static endpoint routes under `src/pages/`.
- Content/route helpers under `src/lib/`.
- Build verifier scripts.
- Documentation for platform consumers and site owners.

Deliverables:

- Stable entity `@id` policy for site, publisher, authors, articles,
  announcements, collections, categories, tags, and bibliography sources.
- Public content index endpoint for route discovery and article metadata.
- Route/entity manifest for platform tooling and future admin UI work.
- Decision document for whether to add `llms.txt`, including what it promises
  and how it remains current.

Tests:

- Endpoint schema tests.
- Built-output checks for stable IDs and canonical URLs.
- Snapshot or contract tests that make accidental field removals visible.

Acceptance criteria:

- Public indexes are generated from canonical content data and route helpers,
  not hand-maintained JSON.
- Endpoints avoid private drafts, hidden content, or internal implementation
  details, and they respect the same robots/visibility policy used by sitemap
  and feed generation.
- The payload is useful for agents/tools without bloating normal page HTML.
- `llms.txt` is not added until the project defines a truthful maintenance
  contract for it.

## Action Priority

1. Metadata contract and default social image fallback.
2. Site identity config and sitewide JSON-LD.
3. Route structured data for author/list pages.
4. Article and announcement enrichment, including explicit modified dates.
5. Scholar/bibliography expansion.
6. Validation tooling and docs.
7. Typed special-schema frontmatter after the core metadata contract is stable.
8. AI-friendly content surfaces generated from canonical data.
9. Embed accessibility strategy as a separate deferred embed UX project.

This order improves visible sharing, SEO, and machine readability quickly while
building the abstractions needed for long-term platform configurability.

## Developer Handoff

### Readiness

This audit is ready to hand off for implementation. Milestones A-F are
unblocked and should be treated as the first implementation batch. Milestones G
and H are planned platform work, but they should wait until the core metadata
contract, site identity graph, route structured data, and validation tooling are
stable enough to support them cleanly.

### First Implementation Batch

Implement these in order:

1. `src/lib/metadata` contract, stable ID helpers, route metadata matrix tests.
2. Extended site identity config and default social image fallback.
3. Sitewide `WebSite` and publisher JSON-LD.
4. `CollectionPage`, `ItemList`, `ProfilePage`, and breadcrumb helpers.
5. Article/announcement enrichment and explicit `updated` field policy.
6. Scholar/bibliography metadata expansion.
7. Built-output validation scripts and docs.

Each item should ship with tests in the same milestone. Do not batch all code
first and add validation at the end.

### Required Test Plan

At minimum, implementation should add or update tests for:

- Metadata normalization for every route family in the route matrix.
- Site identity schema validation.
- `SiteHead` output for route-specific and default social images.
- JSON-LD builder output and stable `@id` relationships.
- Built HTML parsing for representative route types.
- Parser-based image-alt audit.
- First-party full-site axe scan behavior with third-party iframe handling.
- Scholar metadata and citation-reference behavior.
- Author docs for new frontmatter/config fields.

### Blocking Risks To Watch

- Emitting metadata that does not match visible content.
- Creating author-facing frontmatter that is too broad or too technical.
- Duplicating metadata logic between routes, layouts, and components.
- Letting route files hand-build canonical URLs or entity IDs.
- Treating third-party iframe accessibility errors as first-party template
  failures.
- Adding AI/content-index endpoints that expose hidden content, drafts, or
  internal implementation details.

### Non-Blocking Follow-Ups

- Source-type-specific bibliography JSON-LD waits on reliable source typing.
- `ScholarlyArticle` waits on an explicit editorial policy.
- `llms.txt` waits on a clear generated-content contract.
- Click-to-load embeds, transcripts, and lightweight embed fallbacks belong to
  a separate embed UX milestone.

## References

- Google Search Central: Structured data introduction:
  <https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data>
- Google Search Central: Article structured data:
  <https://developers.google.com/search/docs/appearance/structured-data/article>
- Google Search Central: Organization structured data:
  <https://developers.google.com/search/docs/appearance/structured-data/organization>
- Google Search Central: Breadcrumb structured data:
  <https://developers.google.com/search/docs/appearance/structured-data/breadcrumb>
- Google Search Central: Profile page structured data:
  <https://developers.google.com/search/docs/appearance/structured-data/profile-page>
- Google Search Central: Review snippet structured data:
  <https://developers.google.com/search/docs/appearance/structured-data/review-snippet>
- Google Search Central: Special tags and robots controls:
  <https://developers.google.com/search/docs/crawling-indexing/special-tags>
- Google Scholar inclusion guidelines:
  <https://scholar.google.com/intl/en/scholar/inclusion.html>
- W3C WAI image alt decision tree:
  <https://www.w3.org/WAI/tutorials/images/decision-tree/>
- W3C WAI page structure tutorial:
  <https://www.w3.org/WAI/tutorials/page-structure/>
- Open Graph protocol:
  <https://ogp.me/>
- Schema.org Article:
  <https://schema.org/Article>
- Schema.org BlogPosting:
  <https://schema.org/BlogPosting>
- Schema.org WebSite:
  <https://schema.org/WebSite>
- Schema.org Organization:
  <https://schema.org/Organization>
- Schema.org BreadcrumbList:
  <https://schema.org/BreadcrumbList>
- Schema.org ProfilePage:
  <https://schema.org/ProfilePage>
- Schema.org CollectionPage:
  <https://schema.org/CollectionPage>
- Schema.org ItemList:
  <https://schema.org/ItemList>
