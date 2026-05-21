# AnnouncementJsonLd

Source: `src/components/seo/AnnouncementJsonLd.astro`

## Purpose

`AnnouncementJsonLd` emits JSON-LD for announcement entries using the same
publishable metadata model as article-like content.

## Public Contract

- `announcement: AnnouncementEntry`
- `image?: SocialPreviewImage`

## Invariants

- Emits one inline `application/ld+json` script.
- Combines publishable BlogPosting metadata with semantic metadata nodes when
  present.
- Uses the announcement route helper for canonical paths.
- Does not render visible UI.
