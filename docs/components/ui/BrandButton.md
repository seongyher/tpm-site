# BrandButton

Source: `src/components/ui/BrandButton.astro`

## Purpose

`BrandButton` is the shared external CTA frame for branded platform buttons.
Wrappers such as `PatreonButton` and `DiscordButton` provide brand assets and
colors while this component owns dimensions, link safety, image rendering, and
accessible labeling.

## Public Contract

- `href: string`
- `label: string`
- `logo: ImageMetadata`
- `backgroundClass: string`
- `hoverBackgroundClass: string`
- `logoWidth?: number`
- `logoHeight?: number`
- `logoClass?: string`

## Invariants

- Renders an external-safe `<a>`.
- Adds `rel="noreferrer"` when `target="_blank"` has no explicit `rel`.
- Logo image is decorative; the link label provides the accessible name.
- Keeps CTA dimensions stable and shrink-safe in CTA rows.
