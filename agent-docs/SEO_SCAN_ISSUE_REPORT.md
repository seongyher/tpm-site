# SEO Scan Issue Report

This report traces the Bing and local bad-link scan findings to source causes
in the repository and records the cleanup implemented in Milestone 110 of
`CHECKLIST.md`.

## Summary

The reported issues come from five separate root causes:

1. Several current articles still link to old dated WordPress URLs whose dates
   do not match the redirects currently generated from `legacyPermalink`.
2. One Facebook URL in article content is missing a URL scheme, so browsers
   resolve it as an internal relative path.
3. A few Markdown images are wrapped in links to source asset paths under
   `../../../assets/...`; Astro optimizes the image itself but leaves the link
   target pointing at a file path that is not emitted to `dist`.
4. The built site contains many images with empty/minimized alt text. The most
   important source is article preview images on archive, author, category, and
   tag pages, where the data layer falls back to an empty string when article
   frontmatter has `image` but no `imageAlt`.
5. Cloudflare's top 4xx paths are a mix of stale legacy image URLs, missing
   browser/device icon compatibility files, a registered but unsupported
   `/.well-known/traffic-advice` request, and expected security scanner noise.

## Cleanup Status

Milestone 110 fixed the actionable issues from this report:

- Same-site article links now point directly at canonical `/articles/.../`
  routes instead of the broken one-day-off dated URLs.
- The malformed Facebook link in `early-trash-dove` now has an explicit
  `https://` scheme.
- Markdown images that linked to source asset paths are now plain images, so the
  optimized image renders without exposing a missing `/assets/...` link target.
- Article preview image data now falls back to the article title when
  `imageAlt` is omitted.
- Root compatibility icons now ship as `/favicon.ico`,
  `/apple-touch-icon.png`, and `/apple-touch-icon-precomposed.png`, with an
  explicit `apple-touch-icon` link in the base layout and narrow
  asset-location verifier allow-list entries for these required root files.

## Investigation Plan

1. Map each Bing broken redirect and 4xx URL to configured redirects and source
   article links.
2. Compare local bad-link scanner paths with built HTML and source Markdown.
3. Audit built HTML for image `alt` output shape and identify the component or
   content source responsible.
4. Classify Cloudflare top 4xx paths by whether they are site compatibility
   issues, stale legacy URLs, or intentional 404s.
5. Recommend fixes that address the source causes rather than patching generated
   `dist` output.

## Broken Legacy Redirects

### Finding

Bing reported broken redirects and 400-499 responses for these dated URLs:

| Observed URL                                 | Configured legacy redirect                   | Canonical route                            |
| -------------------------------------------- | -------------------------------------------- | ------------------------------------------ |
| `/2015/11/25/bane-loss-and-phylogeny/`       | `/2015/11/26/bane-loss-and-phylogeny/`       | `/articles/bane-loss-and-phylogeny/`       |
| `/2017/03/09/post-irony-against-meta-irony/` | `/2017/03/10/post-irony-against-meta-irony/` | `/articles/post-irony-against-meta-irony/` |
| `/2017/11/14/when-you-drink-water/`          | `/2017/11/13/when-you-drink-water/`          | `/articles/when-you-drink-water/`          |
| `/2016/04/15/social-media-freedom/`          | `/2016/04/14/social-media-freedom/`          | `/articles/social-media-freedom/`          |
| `/2015/11/28/a-short-note-on-gondola/`       | `/2015/11/29/a-short-note-on-gondola/`       | `/articles/a-short-note-on-gondola/`       |

Configured redirects live in `site/config/redirects.json` and match the current
article `legacyPermalink` frontmatter. The Bing URLs are one day off from those
configured redirects.

### Source References

Current content still links to the broken dated URLs:

| Source                                                                                                | Broken link                                                                |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `site/content/articles/memeculture/early-trash-dove.md:23`                                            | `http://thephilosophersmeme.com/2015/11/25/bane-loss-and-phylogeny/`       |
| `site/content/articles/history/2010-decade-review-part-2.md:89`                                       | `http://thephilosophersmeme.com/2017/11/14/when-you-drink-water/`          |
| `site/content/articles/irony/defining-normie-casual-ironist-and-autist-in-internet-subcultures.md:52` | `http://thephilosophersmeme.com/2017/03/09/post-irony-against-meta-irony/` |
| `site/content/articles/irony/post-irony-against-meta-irony.md:34`                                     | `http://thephilosophersmeme.com/2015/11/28/a-short-note-on-gondola/`       |
| `site/content/articles/politics/the-structure-of-hyperspatial-politics.mdx:109`                       | `http://thephilosophersmeme.com/2016/04/15/social-media-freedom/`          |

### Root Cause

The redirect map is generated from the current legacy permalink data, but some
historical internal links and crawler-known URLs use adjacent dates. This looks
like a legacy WordPress date or timezone mismatch, not a route helper failure.

### Recommended Fix

1. Add explicit alias redirects for the observed off-by-one dated URLs.
2. Replace same-site dated links in article content with canonical
   `/articles/.../` links.
3. Add a content verification rule that flags same-site dated article URLs in
   source Markdown/MDX unless they are explicitly approved.

## Malformed Facebook Link

### Finding

Bing reported:

`https://thephilosophersmeme.com/articles/early-trash-dove/www.facebook.com/thephilosophersmeme/photos/a.1652774414956178.1073741828.1652760244957595/1914910985409185`

### Source Reference

`site/content/articles/memeculture/early-trash-dove.md:43` contains:

```markdown
[page](www.facebook.com/thephilosophersmeme/photos/a.1652774414956178.1073741828.1652760244957595/1914910985409185)
```

### Root Cause

The link lacks `https://`. Markdown renders it as `href="www.facebook.com/..."`,
which browsers resolve relative to the current article path.

### Recommended Fix

Change it to an absolute URL:

```markdown
[page](https://www.facebook.com/thephilosophersmeme/photos/a.1652774414956178.1073741828.1652760244957595/1914910985409185)
```

Add a content verification rule for bare external domains in Markdown links.

## Broken Raw Asset Links

### Finding

The local bad-link scanner reported missing links like:

- `/assets/articles/a-golden-age-of-meme-pages-and-the-microcosm-of-art-history/10300685_995672170473094_7981932479859758424_n.jpg`
- `/assets/articles/the-quadrant-system-for-the-categorization-of-internet-memes/table-of-meme.jpg`

### Source References

The source Markdown wraps images in links to source asset paths:

| Source                                                                                            | Pattern                                                                 |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `site/content/articles/history/a-golden-age-of-meme-pages-and-the-microcosm-of-art-history.md:23` | linked image points to `../../../assets/articles/...jpg`                |
| `site/content/articles/history/a-golden-age-of-meme-pages-and-the-microcosm-of-art-history.md:27` | linked image points to `../../../assets/articles/...jpg`                |
| `site/content/articles/history/a-golden-age-of-meme-pages-and-the-microcosm-of-art-history.md:31` | linked image points to `../../../assets/articles/...jpg`                |
| `site/content/articles/history/a-golden-age-of-meme-pages-and-the-microcosm-of-art-history.md:35` | linked image points to `../../../assets/articles/...jpg`                |
| `site/content/articles/irony/the-quadrant-system-for-the-categorization-of-internet-memes.md:20`  | linked image points to `../../../assets/articles/.../table-of-meme.jpg` |

### Root Cause

Astro correctly optimizes the rendered image to `/_astro/*.webp`, but the outer
Markdown link remains a normal anchor. In the built article, a source link like
`../../../assets/articles/...jpg` resolves to `/assets/articles/...jpg`, which
is not emitted to `dist` because `site/assets` is processed source input, not
public static output.

This is why the images appear visually while the link checker still finds bad
links.

### Recommended Fix

1. Remove the outer Markdown image links when the link only points to the same
   source asset. Let the article image inspector own the full-image interaction.
2. Add content verification for links targeting `../../../assets/` from article
   Markdown/MDX.
3. Consider a build verification rule that fails any local `href` in built HTML
   that resolves to a missing output file.

## Image Alt Warnings

### Finding

A scan of the current built `dist` HTML found:

- 0 image tags with a literally absent `alt` attribute.
- 843 image tags with minimized empty alt output, for example `<img ... alt loading="lazy" ...>`.
- 178 image tags with non-empty alt text.
- 216 pages with at least one empty/minimized alt image.

Bing reports this as missing alt text. The examples it surfaced under author
and tag pages line up with article preview images.

### Source References

The primary article-list source path was:

- `src/lib/content/archive.ts` mapped preview images as
  `alt: article.data.imageAlt ?? ""`.
- `src/components/articles/lists/ArticleCard.astro:84` renders that value through
  Astro's `<Image alt={image.alt} />`.
- `src/lib/content/content-schemas.ts` allows `imageAlt` to be optional.

That meant any article with `image` but without `imageAlt` produced an article
preview image with empty alt text on archive, author, category, and tag pages.
Milestone 110 changed that fallback to the article title.

There are two additional sources:

1. Some article-body Markdown images have empty or filename-like alt text.
2. Decorative CTA brand images intentionally use empty alt text in components
   such as `src/components/ui/PatreonButton.astro` and
   `src/components/ui/DiscordButton.astro`.

### Root Cause

The data model treats `imageAlt` as optional and previously used an empty string
fallback for article preview images. That is technically acceptable only when
the image is decorative. Article preview thumbnails are linked editorial
content, so Milestone 110 now uses the article title as a meaningful fallback.

The minimized output shape (`alt` instead of `alt=""`) may also be making Bing's
scanner report empty alt text as a missing attribute.

### Recommended Fix

1. For article preview images, use the article title as the fallback alt text
   when `imageAlt` is absent. Implemented in Milestone 110.
2. Keep decorative CTA logo images empty-alt for accessibility, but consider a
   serializer or component strategy if external scanners require explicit
   `alt=""` output.
3. Add a content verification report for standalone article Markdown images
   whose alt text is empty, filename-like, or too weak.
4. Optionally make `imageAlt` required when article frontmatter includes `image`,
   once legacy content is cleaned up enough that this is not noisy.

## Cloudflare Top 4xx Paths

### Finding

Recent Cloudflare 4xx counts include:

| Path                                                  |   Count | Classification                               |
| ----------------------------------------------------- | ------: | -------------------------------------------- |
| `/assets/2016-10-13-what-we-talk-about-harambe/3.jpg` |      66 | stale legacy media URL                       |
| `/favicon.ico`                                        |      28 | missing root compatibility icon              |
| `/assets/2016-10-13-what-we-talk-about-harambe/1.jpg` |      26 | stale legacy media URL                       |
| `/.well-known/traffic-advice`                         |      25 | unsupported registered well-known URI        |
| `/apple-touch-icon-precomposed.png`                   |      23 | missing Apple legacy touch icon probe        |
| `/apple-touch-icon.png`                               |      23 | missing Apple touch icon                     |
| `/chat`                                               |      22 | unrelated route probe or stale external link |
| `/.github/funding.yml`                                |      22 | repository metadata probe                    |
| `/attacker/docker-compose.yml`                        |      22 | security scanner probe                       |
| `/assets/2016-10-13-what-we-talk-about-harambe/4.jpg` |      19 | stale legacy media URL                       |
| `/.env`                                               | unknown | security scanner probe                       |

### Harambe Legacy Media URLs

The current article route and legacy article redirect both exist:

- `/articles/what-we-talk-about-harambe/`
- `/2016/10/13/what-we-talk-about-harambe/`

The missing Cloudflare paths are not article routes. They are old raw media
paths under `/assets/2016-10-13-what-we-talk-about-harambe/*.jpg`.

Current source images exist in the repository at:

- `site/assets/articles/what-we-talk-about-harambe/1.jpg`
- `site/assets/articles/what-we-talk-about-harambe/3.jpg`
- `site/assets/articles/what-we-talk-about-harambe/4.jpg`

Those source assets are processed by Astro into hashed `/_astro/*` output and
are not copied to `/assets/2016-10-13-what-we-talk-about-harambe/`.

#### Root Cause

These are stale image URLs from the old site structure, probably still known to
image search, crawlers, or old social posts. They do not indicate that the
current Harambe article is missing images.

#### Recommended Fix

This is optional. If we want to preserve old image URLs for image search
continuity, add static compatibility copies under
`site/public/assets/2016-10-13-what-we-talk-about-harambe/`. The three observed
files are small enough that this would not meaningfully hurt payload size, but
it does intentionally preserve legacy raw media URLs.

If we do not care about old image-result continuity, leaving these as 404s is
acceptable.

### Favicon And Apple Touch Icons

The site currently publishes `site/public/favicon.svg`, and
`src/layouts/BaseLayout.astro` links it as:

```html
<link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
```

The build does not include:

- `/favicon.ico`
- `/apple-touch-icon.png`
- `/apple-touch-icon-precomposed.png`

Apple's Safari web app documentation says that, if touch icons are not declared,
the root directory is searched for files with the `apple-touch-icon...` prefix:
[Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).
Chrome's Lighthouse documentation also treats `apple-touch-icon` as the expected
way to provide an iOS home-screen icon, recommends 180x180 or 192x192 PNGs, and
notes that `apple-touch-icon-precomposed` is obsolete but still recognized:
[Does not provide a valid apple-touch-icon](https://developer.chrome.com/docs/lighthouse/pwa/apple-touch-icon/).

#### Root Cause

The current icon setup is modern but minimal. It is valid for browsers that
support SVG favicons, but crawlers and older or platform-specific clients still
request the conventional root `.ico` and Apple touch icon PNG paths.

#### Recommended Fix

Add a small compatibility icon set:

1. `site/public/favicon.ico`
2. `site/public/apple-touch-icon.png`
3. Optionally `site/public/apple-touch-icon-precomposed.png` as the same PNG if
   we want to quiet legacy iOS probes.
4. Add `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` to
   `BaseLayout`.
5. Add specific asset-location verifier allow-list entries for these root icon
   files, because they must be served from `site/public` rather than processed
   through `site/assets`.

This is low-risk and worth doing.

### `/.well-known/traffic-advice`

`traffic-advice` is listed in IANA's Well-Known URI registry as a provisional
well-known URI:
[IANA Well-Known URIs](https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml).
The referenced proposal describes it as a way for publishers to control traffic
from private prefetch proxies:
[Traffic Advice](https://buettner.github.io/private-prefetch-proxy/traffic-advice.html).

#### Root Cause

This is likely a client, crawler, or proxy asking whether the origin publishes
traffic advice metadata. The site does not currently support that feature.

#### Recommended Fix

Leave it as a 404 unless we later identify a concrete crawler or performance
benefit from publishing traffic advice. It is not an accidental broken site
link.

### Scanner And Probe Noise

These paths have no in-repo route or content references:

- `/chat`
- `/.github/funding.yml`
- `/attacker/docker-compose.yml`
- `/.env`

#### Root Cause

These look like bot traffic, stale guesses, or security scanner probes. The
`.env` and Docker Compose paths especially should continue to fail.

#### Recommended Fix

Do not add routes or files for these. Keep them as 404s.

## Proposed Implementation Order

1. Fix the concrete broken-link issues:
   - add alias redirects for the five observed off-by-one legacy URLs;
   - rewrite same-site dated article links to canonical article routes;
   - repair the malformed Facebook URL;
   - unwrap linked source-asset Markdown images.
2. Fix article preview alt text fallback in the archive data layer.
3. Add verifier coverage:
   - same-site dated links in content;
   - bare external domains in Markdown links;
   - article links to source asset paths;
   - built local hrefs that do not resolve to output files.
4. Add root icon compatibility assets for `/favicon.ico` and Apple touch icons.
5. Decide whether to preserve old Harambe raw media URLs as static compatibility
   copies.
6. Add an alt-quality follow-up pass for article-body Markdown images.

## Verification Targets

After fixes, run:

```sh
bun run build
bun run verify
bun run validate:html
```

Then rerun the local bad-link scanner against `dist` and confirm these paths no
longer appear:

- `/articles/early-trash-dove/www.facebook.com/...`
- `/assets/articles/a-golden-age-of-meme-pages-and-the-microcosm-of-art-history/*.jpg`
- `/assets/articles/the-quadrant-system-for-the-categorization-of-internet-memes/table-of-meme.jpg`

Finally, rerun the built-alt audit and verify that author, category, tag, and
archive article preview images no longer emit empty alt text.
