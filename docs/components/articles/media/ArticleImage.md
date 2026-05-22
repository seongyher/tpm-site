# Article Image

Source: `src/components/articles/media/ArticleImage.astro`

## Purpose

`ArticleImage` renders explicit MDX/article images using the same simplified
editorial image contract as default Markdown images.

Normal Markdown authors should use standard Markdown image syntax. This
component exists for MDX articles and rare explicit escape hatches.

## Public Contract

- `alt: string`
- `caption?: string | undefined`
- `heightPolicy?: "auto" | "natural"`
- `src: ImageMetadata`

Keep props narrow. Do not add broad configuration objects for per-image
styling; the default contract should be good enough for ordinary article
images.

## Composition Relationships

```text
MDX article
  ArticleProse
    ArticleImage
      ArticleImageFrame
        optimized Astro Image
        optional inspect trigger
```

`ArticleImage` calls the shared article image policy helper. It does not fetch
content, inspect Markdown source, or choose global image assets.
`ArticleImageFrame` owns the button/div chrome around the optimized image so
the policy and frame rendering can be tested separately.

## Layout And Responsiveness

Default images render as full prose-width editorial previews with a square-height
cap:

```text
max-width: 100%
max-height: min(70svh, 34rem)
fit: object-contain
```

The default preview is inspectable. Clicking the image opens the shared
full-screen inspector, which can request a larger responsive candidate on
demand.

`heightPolicy="natural"` is the only approved visual escape hatch. It removes
the preview height cap and disables the inspector for rare deliberate
full-height MDX figures.

## Layering And Scrolling

The component should not create a card-like surface around images. It owns only
the image trigger, optional caption, and focus states. The full-screen inspector
is owned by the shared script installed by `ArticleProse`.

## Interaction States

Default, natural, captioned, long-alt, hover, focus-visible, full-screen
inspector, and dark-mode states should be represented in tests or the catalog.

## Accessibility Semantics

Use `figure` and `figcaption` semantics. The image trigger must be a real
button with an accessible name such as `View full image: <alt>`. The full-screen
inspector must restore focus to the trigger after close.

## Testable Invariants

- renders without horizontal overflow at mobile, tablet, desktop, and wide
  desktop widths;
- preserves alt text and caption semantics;
- default preview does not exceed the square-height cap;
- preview image uses accurate prose-width `sizes`;
- default image opens the shared inspector;
- natural images render without the cap and without inspector behavior;
- focus states remain visible in light and dark modes.

## Follow-Up Notes

- Keep this component aligned with
  `docs/rehype-plugins/article-images.md`. That technical design is the source
  of truth for default article image behavior.
