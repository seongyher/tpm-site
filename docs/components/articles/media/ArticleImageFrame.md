# Article Image Frame

Source: `src/components/articles/media/ArticleImageFrame.astro`

## Purpose

`ArticleImageFrame` renders the optimized image chrome for `ArticleImage`.
Inspectable images render as a real button with the expand affordance;
non-inspectable images render as a plain frame.

## Public Contract

- `alt: string`
- `frameClass: string`
- `imageClass: string`
- `inspectLabel: string`
- `inspectable: boolean`
- `inspectionClass: string`
- `previewSizes: string`
- `src: ImageMetadata`

## Invariants

- Keeps Astro image optimization in the frame.
- Keeps inspectable images keyboard reachable through a native button.
- Does not decide the image height policy; callers pass policy-derived classes.
- Does not install the inspector script. `ArticleImage` owns that lifecycle.
