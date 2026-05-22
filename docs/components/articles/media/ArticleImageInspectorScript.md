# Article Image Inspector Script

Source: `src/components/articles/media/ArticleImageInspectorScript.astro`

## Purpose

`ArticleImageInspectorScript` includes the processed browser controller for
article image inspection. It is a script boundary, not a visual component.

## Public Contract

- Emits the bundled `src/scripts/article-image-inspector.ts` script once through
  Astro's normal script pipeline.
- Does not accept props or slots.

## Composition Relationships

It should be included by article image surfaces that need click-to-inspect
behavior. Visual markup, image sizing, and dialog content belong to
`ArticleImage` and the script controller.

## Layout And Responsiveness

No layout. The script must preserve the existing responsive image layout and
must not depend on a viewport-specific DOM shape beyond documented
`data-article-image-*` hooks.

## Layering And Scrolling

The script may control modal/open state for inspector UI, but this wrapper
should not create z-index, sticky, fixed, or scroll behavior.

## Interaction States

Supports the image inspector lifecycle through the external controller:
closed, opened, close button, Escape, and outside navigation cleanup.

## Accessibility Semantics

The controller must preserve keyboard access and focus restoration. The wrapper
itself has no accessible name because it renders only a script.

## Content Edge Cases

Must tolerate pages with zero images, many images, missing captions, long alt
text, and images rendered from Markdown or MDX.

## Theme Behavior

No direct theme behavior. Inspector surfaces should use semantic tokens.

## Testable Invariants

- The script is bundled by Astro rather than inlined repeatedly.
- Pages without inspectable images do not error.
- Inspectable images remain keyboard reachable.
- Opening and closing the inspector preserves page scroll and focus.

## Follow-Up Notes

- Keep this wrapper tiny. Any behavior belongs in
  `src/scripts/article-image-inspector.ts`.
