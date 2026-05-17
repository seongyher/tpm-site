# Social Preview Images

Social preview images are crawler-facing publication metadata. They are not the
same surface as article body images, image-inspector originals, downloads, or
PDF figures.

## Goals

- Keep authoring unchanged: authors continue to set normal `image` frontmatter
  when an article or announcement has a preview image.
- Generate social preview assets automatically at build time.
- Avoid raw source images in `og:image`, `twitter:image`, and article JSON-LD.
- Keep previews compatible with major crawlers and link unfurlers.
- Make accidental large metadata images fail verification.

## Output Contract

Generated social preview images should use one shared contract:

- dimensions: `1200 x 630`;
- aspect ratio: `1.91:1`;
- format: `jpg`;
- fit: center `cover`, allowing crop when source aspect ratio differs;
- target quality: high enough for text/meme legibility, low enough for small
  files;
- hard compatibility ceiling: below `5 MB`;
- project budget: `500 KB`, enforced in build verification.

This target is chosen because LinkedIn documents `1200 x 627`, a `1.91:1`
ratio, and a `5 MB` cap for share images; X large image cards require images
under `5 MB` and support wide card imagery; long-standing Open Graph guidance
for Facebook-style link previews also centers on `1200 x 630` and `1.91:1`.

## Cropping Policy

Cropping is acceptable for social preview images. These images are promotional
link-preview media, not canonical article content.

The default crop is center `cover`. Authors should choose article preview
images that still communicate well when center-cropped to `1.91:1`. Important
text, faces, and meme elements should stay near the center. Dense charts, tall
screenshots, and edge-dependent compositions are poor frontmatter-image
candidates unless they survive the crop.

Article body images must not inherit this behavior. Body images preserve their
own editorial rendering rules.

## Metadata Contract

Pages with a generated social image should emit:

- `og:image`;
- `og:image:width`;
- `og:image:height`;
- `og:image:type`;
- `og:image:alt` when alt text is available;
- `twitter:card=summary_large_image`;
- `twitter:image`;
- `twitter:image:alt` when alt text is available;
- article JSON-LD `image` using the same generated asset;
- RSS `<enclosure>` image URLs using the same generated asset.

The generated URL should be absolute in metadata, but should resolve to a local
optimized asset in the generated static site.

## Fallbacks

If a publishable page has no frontmatter image, the pipeline may use a site
default image. The fallback should be a source asset that can be processed into
the same `1200 x 630` JPG contract. It should not require authors to provide a
placeholder image just to make metadata valid. The default site fallback uses
the homepage hero dark image when configured, with the light image only as a
compatibility fallback.

## Non-Goals

- Do not change article prose image behavior.
- Do not remove intentionally linked full-size source images.
- Do not add author-facing crop controls until real content shows the default
  is insufficient.
- Do not rely on WebP support for social metadata until crawler validation
  proves it is safe enough for the project.

## Verification Requirements

Build verification should fail when an article metadata image:

- is missing when a social preview is expected;
- is not a generated local JPG asset;
- is missing declared width, height, or MIME type metadata;
- does not use the expected `1200 x 630` dimensions;
- exceeds the project social-image size budget;
- diverges between Open Graph, Twitter, and JSON-LD surfaces.

Feed generation should use the same helper so feed enclosures do not keep raw
frontmatter image assets alive accidentally.

The verifier should allow raw source image files in `dist` only when another
surface intentionally links to them. The production post-build optimizer should
remove unreferenced generated raster files under `_astro/` after the build
finishes. The invariant is not "no raw images in `dist`"; the invariant is
"social metadata never points to raw source images, and accidental orphaned
Astro raster assets do not ship."

## Design Review

The design keeps author burden low by reusing existing frontmatter and adding a
site fallback. It chooses JPG over WebP because WebP crawler support remains
less clearly documented across all desired link-preview surfaces. It accepts
center cropping because social previews are best-effort promotional media and
because avoiding crop produces inconsistent, lower-impact previews. It keeps the
format, size, and crop policy centralized so future content-specific overrides
or a WebP migration can happen without changing article files.
