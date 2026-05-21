# Media Policy And Provider Adapters

This document defines the target media policy contract for article images,
inline images, hover images, list thumbnails, social images, PDF images,
external embeds, fallback media, downloads, and generated artifacts.

The goal is not to make authors configure every output. Authors should keep
using normal Markdown image syntax, small MDX components when needed, and
simple frontmatter preview images. The platform should normalize those inputs
into media records, choose output policies by role and surface, and verify the
generated artifacts.

## Goals

- Keep authoring simple while making media behavior explicit and testable.
- Use Astro image optimization for local image output whenever practical.
- Keep generated HTML, social previews, feeds, search records, PDFs, and
  no-JS fallbacks consistent without duplicating policy logic.
- Make unsupported or risky media states visible through diagnostics instead
  of silently degrading output.
- Let new providers such as future video, audio, document, gallery, or
  interactive embeds add adapter contracts without changing article syntax.

## Non-Goals

- Do not replace Astro's asset pipeline.
- Do not require authors to choose formats, widths, fetch priority, or PDF
  behavior for ordinary media.
- Do not fetch remote image metadata during a normal build.
- Do not make every component consume a large universal config object.
- Do not add runtime JavaScript for static media decisions.

## Media Roles

Media roles describe why media is being rendered. They are narrower than file
types and broader than components.

- `article-image`: standalone Markdown images and explicit `ArticleImage`;
  owned by article prose/media policy.
- `inline-image`: emoji-like inline images and mixed prose images; owned by
  the Markdown image pipeline.
- `hover-image`: `HoverImageLink` and `HoverImageParagraph` previews; owned by
  the hover image adapter.
- `list-thumbnail`: home, article lists, related entries, and collections;
  owned by publishable media policy.
- `social-image`: Open Graph, Twitter, and JSON-LD image metadata; owned by
  metadata/social preview policy.
- `pdf-image`: images rendered into generated article PDFs; owned by PDF media
  policy.
- `embed`: YouTube, SoundCloud, and generic responsive iframes; owned by
  provider adapters.
- `fallback`: text/logo placeholders, print links, and no-JS links; owned by
  role-specific fallback policy.
- `download`: generated PDFs or future static download artifacts; owned by
  generated artifact policy.
- `generated-artifact`: optimized images, PDFs, search indexes, and feed
  records; owned by output verification and the artifact manifest.

One source can produce several role records. For example, an article preview
image may produce `list-thumbnail`, `social-image`, `search`, and `pdf-image`
outputs with different sizing, format, alt, and fallback rules.

## Media Surfaces

Surfaces describe where a policy record will be consumed:

- `article-html`;
- `listing-html`;
- `home-html`;
- `metadata`;
- `feed`;
- `search`;
- `pdf`;
- `print`;
- `no-js`;
- `generated-output-verifier`;
- `download`;
- `catalog`.

Surface-specific decisions belong in policy helpers. Components should receive
already-normalized media view models with explicit dimensions, alt text,
layout, loading, and fallback behavior.

## Source Records

Media source records should be framework-neutral data. They should identify the
source without deciding final output transforms.

Required concepts:

- stable source ID;
- source kind: local image, remote URL, provider embed, static public file,
  generated artifact, text fallback, or download;
- source path or URL;
- source owner: article content, announcement content, site config, platform
  fixture, generated output, or external provider;
- author-provided alt text, caption, title, credit, and link target;
- known width, height, and MIME type when available;
- route or publishable entry that owns the source;
- visibility and PDF eligibility hints;
- diagnostics for missing facts, invalid paths, unsupported remote sources,
  broken links, oversized output, or missing fallbacks.

Source records may contain `ImageMetadata` at Astro boundaries, but the policy
types should keep the framework-specific value behind an adapter field so most
logic remains testable without rendering Astro components.

## Policy Records

A media policy record is the output plan for one role on one surface.

It should express:

- `role` and `surface`;
- source identity and provider identity;
- required accessibility facts such as `alt`, `ariaLabel`, `title`, or
  decorative status;
- layout facts such as aspect ratio, object fit, crop policy, max height,
  intrinsic dimensions, and stable frame size;
- loading facts such as `loading`, `decoding`, `fetchpriority`, `sizes`, and
  prefetch/preload eligibility;
- optimization facts such as target format, quality, widths, max byte budget,
  max rendered width, and whether original assets are allowed;
- fallback facts for missing images, no-JS, print/PDF, feeds/search, and
  unsupported providers;
- generated artifact facts such as output extension, MIME type, public route,
  cache policy, and verification owner;
- diagnostics with severity, owner, source path, output path, and remediation.

Policy records must make invalid output hard to represent. For example:

- an image policy that renders pixels must carry non-empty alt text or be
  explicitly decorative;
- a provider embed must carry a static fallback link for PDF/print/no-JS;
- a social image must carry the configured social dimensions, MIME type, and
  byte budget;
- a PDF image must declare whether it is supported, omitted with a note, or
  blocks PDF generation.

## Provider Adapter Shape

Provider adapters translate source records into role/surface policy records.
They should be small, pure, and provider-specific.

Target adapter shape:

```ts
interface MediaProviderAdapter<TSource> {
  provider: string;
  supports(source: MediaSourceRecord): source is TSource;
  normalize(source: TSource): NormalizedMediaSource;
  policyFor(input: MediaPolicyInput<TSource>): MediaPolicyRecord[];
  diagnostics(source: TSource): MediaDiagnostic[];
}
```

Adapters should not render HTML directly. They return policies that Astro
components, endpoints, PDF generation, metadata helpers, search/feed writers,
and generated-output verifiers can consume.

## Initial Adapters

### Local Image Adapter

Handles project-owned images under `site/assets/` and component/catalog fixture
images.

- Uses Astro `Image`, `Picture`, or `getImage` at rendering/output boundaries.
- Preserves source width/height when available.
- Rejects accidental raw public output unless the role explicitly allows an
  unprocessed public file.
- Provides alt/caption/credit diagnostics.

### Article Image Adapter

Handles standalone Markdown article images and explicit `ArticleImage` MDX
usage.

- Default role is bounded, optimized, inspectable article image.
- First standalone article image may be eager/high-priority; later images stay
  lazy.
- Linked Markdown images keep the author's link behavior and do not become
  nested interactive controls.
- PDF policy should include the image when supported and emit diagnostics when
  a PDF fallback is missing.

### Hover Image Adapter

Handles inline hover image links.

- HTML policy renders an inline link plus optimized hover/focus/tap preview.
- No-JS and PDF policy degrade to an ordinary link to the image or source.
- Search and feed policy should keep the visible text, not inject preview
  images into prose summaries.

### Publishable Thumbnail Adapter

Handles list thumbnails, related-entry media, home carousel/media, collections,
search records, and feed image hints.

- Uses entry media facts and configured fallbacks.
- Keeps fallback labels accessible without pretending text placeholders are
  article images.
- Carries stable dimensions so list layouts do not shift.

### Social Preview Adapter

Handles Open Graph, Twitter, and JSON-LD image output.

- Default target is a 1200 by 630 JPEG social preview.
- Uses cover crop as a best-effort preview; author editorial guidelines should
  encourage usable aspect ratios.
- Enforces a byte budget and exposes verifier diagnostics for oversized output.
- Uses configured fallback imagery when an entry has no image.

### PDF Image Adapter

Handles media that enters generated PDFs.

- Uses small, readable image sizes appropriate for academic-style PDFs.
- Prefers optimized local image output over original source assets.
- Emits diagnostics for unsupported media, oversized output, missing fallback,
  or author-disabled PDF generation.
- Does not degrade article HTML to make PDFs easier.

### Embed Adapter

Handles YouTube, SoundCloud, and generic external iframe embeds.

- Provider-specific adapters normalize URLs and layout: video embeds use stable
  video frames, SoundCloud uses compact audio frames.
- Every embed must have a title and static fallback link.
- PDF/print/no-JS policies render a source link or concise fallback note.
- Runtime scripts from third-party providers are not loaded unless the author
  explicitly uses a provider that requires them.

### Download And Generated Artifact Adapter

Handles generated PDFs and future downloadable/static artifacts.

- Records public route, file path, MIME type, cache policy, source entry, and
  generated-output verifier ownership.
- Keeps downloads out of media display policies unless the route explicitly
  renders a download CTA.

## Ownership Boundaries

- Publishable entries carry representative media facts, but not optimization
  choices.
- Metadata helpers consume social-image policy records instead of deciding
  crop/format/byte budgets locally.
- Article prose components consume article-image and hover-image policy records
  instead of reimplementing responsive image logic.
- PDF helpers consume PDF media policies and PDF eligibility diagnostics rather
  than inspecting MDX imports alone.
- Feed/search helpers consume feed/search media fallbacks rather than scraping
  rendered HTML.
- Generated-output verifiers consume policy records and generated artifacts to
  distinguish intentional exceptions from accidental raw assets.
- Site configuration owns publication fallback imagery and provider feature
  toggles. Platform code owns default policy behavior.

## Diagnostics

Media diagnostics should be structured enough to power author-facing checks,
release verification, future GUI validation, CLI output, and MCP output.

Required diagnostic families:

- missing required alt text;
- decorative image used where descriptive alt is required;
- missing local asset;
- unsupported remote image;
- raw public asset emitted where optimized output was expected;
- non-WebP or non-JPEG exception without policy approval;
- oversized social image or PDF output;
- missing PDF/no-JS/print fallback;
- unsupported embed provider;
- unsafe iframe or provider URL;
- missing provider title;
- feed/search/media mismatch;
- cache-policy mismatch for generated artifacts.

Diagnostics should distinguish blocking errors from warnings. Missing local
assets, unsafe providers, and missing required fallbacks are usually errors.
Oversized output, weak alt text, and unsupported PDF media may be warnings or
PDF-eligibility blockers depending on surface.

## Implementation Sequence

1. Introduce framework-neutral media source, policy, provider, and diagnostic
   types in `src/lib/media-policy.ts`.
2. Move existing article image, social preview, embed, hover image, publishable
   thumbnail, and PDF compatibility constants behind policy helpers without
   changing author syntax.
3. Migrate components and output helpers to consume narrow policy-derived view
   models, not the full policy record.
4. Add diagnostics to author checks and generated-output verification.
5. Add fixtures for local images, linked images, inline images, hover images,
   missing media, unsupported providers, social previews, feeds/search, and
   PDF fallbacks.
6. Update author-facing docs only where behavior becomes more explicit.

## Current Implementation Slice

The first implementation slice introduces `src/lib/media-policy.ts` as the
shared policy vocabulary and migrates existing helpers without changing author
syntax or public page output.

Current consumers:

- `src/lib/article-image-policy.ts` consumes article image role policy for
  bounded/natural display, inspectability, preview sizing, and cache-key facts.
- `src/lib/social-images.ts` consumes social preview policy for dimensions,
  MIME type, transform options, quality, and byte budget.
- `src/lib/embed-media.ts` consumes provider classification and layout classes
  from the shared embed policy.
- `src/lib/article-pdf-compatibility.ts` consumes MDX component PDF fallback
  policy from the shared media policy layer.
- `src/components/articles/PublishableMediaFrame.astro` consumes text fallback
  policy for image-less publishable media frames.
- `scripts/build/generate-article-pdfs.ts` and
  `scripts/build/verify-build/pdf-verifier.ts` consume media diagnostics for
  unloaded PDF images, unoptimized PDF image sources, and oversized generated
  PDF artifacts.
- `scripts/build/verify-build/html-verifier.ts` checks scoped article, hover,
  and publishable media image output for accidental remote/raw images and
  verifies article embeds keep static fallbacks.
- `scripts/build/verify-build/asset-verifier.ts` checks the generated
  `_headers` file keeps immutable cache policy for hashed Astro assets.

The implementation deliberately keeps component props narrow. Components still
receive the exact display facts they need; the policy layer owns how those
facts are selected and verified.

## Verification

Unit tests should cover:

- source normalization for local images, missing images, remote URLs, embeds,
  downloads, and fallbacks;
- role/surface policy selection;
- social preview dimensions, MIME type, quality, and byte budget;
- article image priority and inspectability;
- hover image no-JS and PDF fallback policy;
- embed provider classification and fallback requirements;
- PDF eligibility diagnostics.

Component tests should cover:

- article image, hover image, publishable thumbnail, YouTube, SoundCloud, and
  generic embed components consuming policy-derived props;
- alt text and decorative image semantics;
- stable dimensions and responsive constraints.

Generated-output checks should cover:

- optimized image output and intentional exceptions;
- no accidental remote image references;
- social image size and type;
- PDF links and PDF media diagnostics;
- feed/search media consistency;
- cache policy for generated media artifacts.

E2E and performance checks should cover:

- no article image overflow;
- no layout shift from thumbnails, embeds, carousel media, or PDF CTAs;
- no eager loading beyond explicitly prioritized above-the-fold media;
- small client JavaScript boundaries for media interactions.

## Critical Review

This contract intentionally keeps policy separate from components. A universal
component-level media prop would be too broad and would make simple cases hard
to read. The reusable unit is the policy engine: it chooses a small output view
model for each component or output writer.

The design also keeps Astro-specific rendering at the edge. That lets most
policy decisions be tested as ordinary TypeScript and leaves Astro responsible
for what it already does well: image imports, responsive sources, hashed output,
and static asset generation.
