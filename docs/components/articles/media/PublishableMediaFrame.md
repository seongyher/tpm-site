# Publishable Media Frame

Source: `src/components/articles/media/PublishableMediaFrame.astro`

## Purpose

`PublishableMediaFrame` renders linked media for article-like entries. It owns
the optimized image link when media exists and the text fallback frame when it
does not.

## Public Contract

- `fallbackClass?: string`
- `fallbackLabel?: string`
- `frameClass?: string`
- `href: string`
- `image?: { alt: string; src: ImageMetadata } | undefined`
- `imageClass?: string`
- `label: string`
- `loading?: "eager" | "lazy"`
- `prefetch?: "hover" | "load" | "tap" | "viewport" | boolean`
- `renderHeight: number`
- `renderWidth: number`

## Invariants

- The whole frame is the link target.
- Existing media uses Astro image optimization.
- Missing media renders a visible fallback rather than reserving blank space.
- The component does not choose article summaries, social images, or editorial
  fallback copy.
