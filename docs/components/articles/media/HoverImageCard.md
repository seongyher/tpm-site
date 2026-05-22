# Hover Image Card

Source: `src/components/articles/media/HoverImageCard.astro`

## Purpose

`HoverImageCard` renders an inline article link that previews an image on
hover, keyboard focus, or touch tap. It exists for MDX article prose that
intentionally embeds image previews inside a sentence.

## Public Contract

- `image: ImageMetadata`
- `label: string`
- `alt?: string`
- `expanded?: boolean`

The label is author-visible prose and must render unchanged. The link always
points to `image.src` so readers have a no-JavaScript fallback.

## Composition Relationships

```text
MDX article prose
  HoverImageLink or HoverImageParagraph
    HoverImageCard
      AnchoredRoot preset="inline-hover-preview" disclosure="hover-focus-tap"
        AnchoredTrigger as="a" data-disclosure-trigger
        AnchoredPanel
          a
            img
```

`HoverImageCard` owns the preview media, size variant, and anchored
relationship. It does not parse Markdown or load article data.

## Layout And Responsiveness

The trigger remains inline and must not start a new paragraph or line by
itself. The preview is fixed-positioned by the shared anchored adapter, remains
visually tethered to the trigger, and uses viewport max-size variables to avoid
horizontal overflow. `expanded` increases the preview cap only; it must not
change the inline trigger.

The visible preview is image-only. It must not render as a card, popover, or
padded box. A subtle shadow, outline/ring, and image radius are acceptable when
needed for contrast, but the panel background stays transparent and the panel
box should match the image box.

## Layering And Scrolling

Uses the shared `inline-hover-preview` preset and anchored disclosure behavior.
The panel may sit above or below the trigger depending on viewport space. It
must not hydrate React/Radix or use component-local placement math.

## Interaction States

Support default, fine-pointer hover, keyboard focus, touch tap, outside
dismiss, Escape close, expanded, narrow viewport, left-edge, right-edge,
bottom-edge, light, and dark states.

## Accessibility Semantics

The trigger is a real link to the image. Mouse click and no-JavaScript behavior
open that image normally. Touch tap opens the preview because touch has no
reliable hover equivalent. The preview image is also a link to the full image
so touch users still have a direct path to the destination.

The preview image uses the supplied alt text, or empty alt when the preview is
decorative relative to the link label. Focus must reveal the same preview
available on hover.

## Testable Invariants

- Renders `data-anchor-preset="inline-hover-preview"`.
- Renders a real trigger link whose `href` is `image.src`.
- Renders shared disclosure hooks for touch and keyboard access.
- Renders the preview image inside a second full-image link for touch users.
- Renders no React hydration directive and no Radix/shadcn hover-card markup.
- Keeps the trigger inline in prose and preserves the exact label text.
- Renders as image-only media, with no popover background or padding.
- Preview remains viewport-contained at left, right, and bottom edges.
- `expanded` changes preview sizing without changing trigger semantics.
