# Metadata Schema Contracts

This document records the external metadata contracts the platform emits and
how those contracts are enforced. It is meant to keep search, social previews,
Scholar indexing, feeds, sitemaps, and machine-readable JSON-LD from drifting
as the platform becomes more configurable.

## Principles

- Emit truthful metadata only from visible content, site config, normalized
  route data, or validated frontmatter.
- Prefer typed builders and schemas over arbitrary JSON-LD escape hatches.
- Distinguish Schema.org vocabulary support from Google rich-result
  eligibility. A valid Schema.org node is useful for machines, but it does not
  necessarily satisfy every Google feature contract.
- Validate generated HTML and generated artifacts, not just source helpers.
- Keep author burden low: normal articles, announcements, collections, and
  author profiles should get correct metadata by default.

## Source References

- Google structured data introduction:
  <https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data>
- Google `ProfilePage` structured data:
  <https://developers.google.com/search/docs/appearance/structured-data/profile-page>
- Google `Article` structured data:
  <https://developers.google.com/search/docs/appearance/structured-data/article>
- Google `BreadcrumbList` structured data:
  <https://developers.google.com/search/docs/appearance/structured-data/breadcrumb>
- Google Organization structured data:
  <https://developers.google.com/search/docs/appearance/structured-data/organization>
- Google Dataset structured data:
  <https://developers.google.com/search/docs/appearance/structured-data/dataset>
- Google Event structured data:
  <https://developers.google.com/search/docs/appearance/structured-data/event>
- Google Review snippet structured data:
  <https://developers.google.com/search/docs/appearance/structured-data/review-snippet>
- Google Software app structured data:
  <https://developers.google.com/search/docs/appearance/structured-data/software-app>
- Google Video structured data:
  <https://developers.google.com/search/docs/appearance/structured-data/video>
- Google Scholar inclusion guidelines:
  <https://scholar.google.com/intl/en/scholar/inclusion.html>
- Open Graph protocol:
  <https://ogp.me/>
- X Cards markup:
  <https://developer.x.com/cards/markup>
- RSS 2.0 specification:
  <https://www.rssboard.org/rss-specification>
- Sitemaps protocol:
  <https://www.sitemaps.org/protocol.html>
- Google robots meta tag documentation:
  <https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag>
- Google canonical URL documentation:
  <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls>
- Schema.org vocabulary:
  <https://schema.org/>

## Route Metadata

Every HTML route goes through `normalizeRouteMetadata()` and `SiteHead`.

Required emitted fields:

- exactly one `<title>`;
- exactly one canonical link;
- one meta description;
- one robots policy;
- one JSON-LD graph for indexable and noindex route documents.

Generated-output verification checks these basics for every generated HTML
page. Noindex utility routes may omit social preview image metadata, but they
still need a title, canonical URL, description, robots policy, and valid
JSON-LD.

## Site Identity JSON-LD

`siteIdentityJsonLd()` emits:

- publisher `Organization` or `Person`;
- `WebSite`.

Source data comes from `site/config/site.json` identity fields. The publisher
node uses a stable `#publisher` ID and `sameAs` values from configured social
links. The `WebSite` node points back to the publisher.

The current contract is a general Schema.org identity contract. It is not
claiming Google Organization/logo rich-result completeness beyond configured
facts. If the platform later explicitly targets Organization rich-result
features, the config schema and verifier should enforce the relevant required
and recommended fields.

## WebPage, CollectionPage, And ProfilePage

`webPageJsonLd()` emits one route-scoped page node with:

- stable `#webpage` ID;
- `@type` based on route kind;
- `name`;
- `description`;
- `url`;
- `inLanguage`;
- `isPartOf` pointing to `#website`;
- `publisher` pointing to `#publisher`.

Route kind mapping:

- article and announcement detail routes emit `WebPage`;
- directory, archive, category, tag, collection, and bibliography routes emit
  `CollectionPage`;
- author detail routes emit `ProfilePage`.

Google's `ProfilePage` guidance models the person or organization represented
by the page as `mainEntity`, and Search Console reports missing `mainEntity` as
a critical issue for profile pages. Therefore the platform contract is stricter
than a generic `WebPage`: `ProfilePage` output must include a concrete
`mainEntity` whose type is `Person` or `Organization` and whose `name` is
present.

Enforcement:

- `webPageJsonLd()` throws if a `ProfilePage` is built without a valid
  `mainEntity`;
- `SiteHead` accepts a narrow `webPageMainEntity` prop for routes that need it;
- author profile routes pass the normalized author entity through that prop;
- build verification scans generated JSON-LD and reports any `ProfilePage`
  without a `Person` or `Organization` main entity.

## Author Profile Entities

`profileEntityJsonLd()` emits a route-scoped author entity:

- `Person` for normal and anonymous author profiles;
- `Organization` for organization and collective author profiles;
- `name`;
- `description` when the profile has a short bio;
- `sameAs` when explicit profile/social links exist;
- `url`.

The entity is embedded as the author page `ProfilePage.mainEntity`. Article
JSON-LD separately emits structured author objects when author metadata is
available. The platform must not infer real identities, websites, social links,
or avatars from prose.

## Article And Announcement JSON-LD

Article and announcement pages emit `BlogPosting` JSON-LD through the shared
publishable builder.

The platform emits the Google-recommended article facts that apply to this
site:

- `headline`;
- `description`;
- `datePublished`;
- `dateModified` when available;
- `author`;
- `publisher`;
- `image`;
- `mainEntityOfPage`;
- `url`;
- `keywords`;
- `articleSection` when a category or section is known;
- `inLanguage`.

Google's Article documentation treats `Article`, `NewsArticle`, and
`BlogPosting` as supported article types and recommends including as many
applicable properties as possible. Generated-output verification checks that
article pages have `BlogPosting` JSON-LD and that `BlogPosting.image` matches
the generated social preview image.

## BreadcrumbList And ItemList

`breadcrumbListJsonLd()` emits Google-compatible breadcrumb lists when a route
has at least two hierarchy items. Each list item includes:

- `@type: ListItem`;
- `position`;
- `name`;
- `item` URL.

`itemListJsonLd()` emits general Schema.org `ItemList` nodes for visible lists
on collection-like pages. It is a machine-readable description of visible
route content; it is not currently targeted at a specific Google rich-result
feature.

## Semantic Frontmatter Profiles

Article-like content can opt into validated `semantic` frontmatter. Supported
profiles currently emit these Schema.org nodes:

- `Review`;
- `Event`;
- `AudioObject`;
- `VideoObject`;
- `Book`;
- `Dataset`;
- `SoftwareApplication`;
- `FAQPage`.

These profiles are intentionally narrow and validated by Zod in
`src/lib/metadata/semantic-metadata.ts`. They are general Schema.org
machine-readable metadata unless this document says otherwise. Google
rich-result features for events, reviews, video, datasets, software apps, and
FAQ pages each have additional eligibility rules. Before claiming eligibility
for one of those features, the corresponding content schema, visible rendering,
builder tests, and build verifier must be upgraded to that feature's documented
contract.

Current rich-result target status:

- `FAQPage`: emits `mainEntity` question/answer pairs from visible FAQ text.
- `Dataset`: emits required general dataset facts (`name`, `description`) and
  optional distribution/license facts.
- `Event`, `Review`, `VideoObject`, `AudioObject`, `Book`, and
  `SoftwareApplication`: general Schema.org only unless a future milestone
  explicitly upgrades the profile to a Google feature contract.

## Social Metadata

Indexable shareable pages emit:

- `og:site_name`;
- `og:locale`;
- `og:type`;
- `og:title`;
- `og:description`;
- `og:url`;
- `og:image`;
- `og:image:width`;
- `og:image:height`;
- `og:image:type`;
- `og:image:alt` when alt text exists;
- `twitter:card`;
- `twitter:site` when configured;
- `twitter:title`;
- `twitter:description`;
- `twitter:image`;
- `twitter:image:alt` when alt text exists.

The social image contract is defined in `docs/SOCIAL_PREVIEW_IMAGES.md`.
Generated-output verification checks required Open Graph and Twitter metadata
on indexable pages and checks article social images against the generated local
JPG policy.

## Google Scholar Metadata

Article pages emit Highwire-style Scholar tags:

- `citation_title`;
- `citation_language`;
- `citation_abstract`;
- one `citation_author` per visible author;
- `citation_keywords` when tags exist;
- `citation_publication_date`;
- `citation_reference` for structured references;
- `citation_pdf_url` only when the generated PDF is enabled.

PDF-disabled articles keep base Scholar tags but omit `citation_pdf_url`.
Generated-output verification checks title, author, date, PDF link, and PDF
document metadata for article pages and generated PDFs.

## RSS

The feed is RSS output from `@astrojs/rss` plus Dublin Core creator metadata.
It includes articles and announcements whose visibility allows feed output.

The feed intentionally does not emit RSS `<enclosure>` elements. Social preview
metadata on the canonical HTML pages already owns crawler-facing preview
images, and omitting enclosures avoids malformed or ambiguous media metadata in
RSS sitemap contexts.

Build verification fails if generated RSS contains item enclosures.

## Sitemap, Robots, And Canonical URLs

The sitemap contract follows the sitemaps.org protocol: generated sitemap
`<loc>` values must be absolute URLs for canonical indexable routes. The
platform excludes noindex utility routes and redirects through
`sitemapIncludesPath()`.

Every generated HTML page emits one canonical URL. Google recommends using
canonical signals consistently; this platform treats duplicate or empty
canonical links as verifier failures.

Robots policies are normalized by route kind. Public routes default to
`index,follow`. Utility routes such as search, catalog, not-found, and redirect
fallback pages use `noindex,follow`.

## Verification Matrix

Use these checks when changing metadata code:

- focused unit tests for builders in `tests/src/lib/metadata/metadata.test.ts`
  and `tests/src/lib/metadata/seo.test.ts`;
- component render tests for `SiteHead`, `ArticleJsonLd`,
  `AnnouncementJsonLd`, `ArticleScholarMeta`, and social metadata;
- build-output verifier tests in `tests/scripts/build/build-verifier.test.ts`;
- `bun run verify` to parse generated output and enforce public artifact
  contracts;
- `bun run check:release` before release handoff.

Any new author-facing metadata field should include:

- schema validation;
- source docs or author docs;
- a typed builder or normalized model;
- a generated-output verifier when the field affects public artifacts;
- tests for omitted, valid, and invalid states.
