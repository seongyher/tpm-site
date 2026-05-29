# Tailwind Guidance

Compressed agent playbook for using Tailwind CSS well in this project. Use the
current Tailwind docs at `https://tailwindcss.com/docs` for exact API details.
Do not use older versioned docs as the source of truth for setup, configuration,
or production behavior.

## Project Baseline

This project uses Tailwind CSS 4 with Astro and Vite:

- `tailwindcss`
- `@tailwindcss/vite`
- `@tailwindcss/typography`
- `prettier-plugin-tailwindcss`
- `clsx`
- `tailwind-merge`

The setup is CSS-first:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@custom-variant dark (&:is([data-theme="dark"] *));

@theme inline {
  --color-background: var(--bg);
}
```

`astro.config.ts` should load `tailwindcss()` through Vite. There does not need
to be a `tailwind.config.js` unless a tool specifically requires one. Prefer the
CSS-first v4 APIs: `@theme`, `@source`, `@utility`, `@variant`,
`@custom-variant`, and `@plugin`.

## Core Model

Tailwind is a utility-first design-system API. Utilities are small,
single-purpose classes selected from a constrained scale. They are not random
inline styles:

- They use shared tokens for color, spacing, type, radius, shadow, and
  breakpoints.
- They support variants for responsive behavior, state, dark mode, motion,
  attributes, structural selectors, and container queries.
- They are statically detected and compiled into only the CSS the project uses.

Default to Tailwind utilities in Astro, React, MDX components, and reusable UI
blocks. Reach for custom CSS only when utilities, variants, tokens, and normal
component composition are not enough.

Good Tailwind code is explicit at the element boundary. A reader should be able
to inspect an element and understand its layout, spacing, color, state behavior,
and responsive behavior without chasing a private CSS selector.

## Utility-First Practice

Use utilities directly while designing. Extract only after duplication proves a
pattern exists.

Prefer this progression:

1. Start with semantic HTML and direct utilities.
2. Extract repeated markup into an Astro component.
3. Add typed props for stable variants such as `tone`, `size`, and `layout`.
4. Compose classes with `class:list` in Astro or `cn()` in React.
5. Add `@utility` or `@layer components` only when a true CSS abstraction is
   better than a component.

Do not prematurely create `.card`, `.button`, or `.sidebar` CSS classes because
the class list looks long. Long utility lists are acceptable when they describe
a real component once. Repeated utility lists should become reusable components,
not global CSS.

Use `src/lib/utils.ts` `cn()` for React class composition. It combines `clsx`
with `tailwind-merge`, so conditional classes are readable and conflicts are
resolved intentionally.

## Responsive Design

Tailwind breakpoints are mobile-first min-width variants. Unprefixed utilities
apply to every viewport. `sm:`, `md:`, `lg:`, `xl:`, and `2xl:` apply from that
breakpoint upward.

Do not think of `sm:` as "mobile". Mobile is the unprefixed base:

```html
<section class="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem] lg:gap-8">
  ...
</section>
```

Build the smallest useful version first, then add enhancements as space
increases. Every component should answer:

- What is the narrow layout?
- What grows, wraps, shrinks, or collapses?
- What happens to long titles, long links, and missing images?
- Does it need viewport breakpoints, container queries, or both?
- Can it survive narrow, medium, wide, short, and awkward sizes?

Use `max-*` variants when a behavior should stop at a breakpoint, and stack
range variants when a behavior belongs only to one band:

```html
<div class="flex-col md:max-xl:flex-row xl:grid xl:grid-cols-3">...</div>
```

Prefer modern layout primitives:

- `flex`, `grid`, `gap`, `place-*`, `items-*`, `justify-*`
- `min-w-0`, `min-h-0`, `shrink-0`, `basis-*`, `grow`
- `max-w-*`, `w-full`, `size-*`, `aspect-*`
- `grid-cols-[repeat(auto-fit,minmax(...))]` when a responsive grid should
  adapt by available space
- `object-cover`, `object-contain`, and `object-position-*` for media behavior
- `overflow-*` deliberately, never as a casual mask for layout bugs

Use container queries for portable components that should respond to the space
their parent gives them instead of the whole viewport:

```html
<article class="@container">
  <div class="grid gap-4 @md:grid-cols-[12rem_minmax(0,1fr)]">...</div>
</article>
```

Reach for viewport breakpoints for page-level layout changes. Reach for
container queries for reusable cards, media blocks, sidebars, and embedded
components.

Container query variants support max/range targeting, named containers, custom
`--container-*` theme variables, arbitrary sizes, and container query units such
as `cqw`. Use named containers only when nested containers would otherwise make
the target ambiguous.

Breakpoint values are tokens, not guesses. Avoid one-off pixel breakpoints. If
a custom breakpoint is genuinely needed, define it as a `--breakpoint-*` theme
variable in `rem`, then use it consistently.

## Logical Sizing

Think in constraints and relationships, not fixed pixels.

Good sizing answers "how should this behave as space changes?":

- `w-full max-w-prose` means fill available space up to a readable measure.
- `min-w-0 flex-1` means take remaining flex space and allow text truncation or
  wrapping inside the box.
- `grid-cols-[minmax(0,1fr)_auto]` means content gets flexible space and actions
  keep intrinsic width.
- `aspect-video object-cover` means media has a stable frame and may crop.
- `max-h-* overflow-y-auto` means this region may scroll after a limit.

Use logical size utilities when the component's contract is about flow rather
than physical axes:

- `size-*`: both width and height.
- `w-*`/`h-*`: physical dimensions.
- `inline-size` utilities: width in the writing direction.
- `block-size` utilities: height in the block direction.

Most of this site can use physical width/height utilities, but logical sizing is
useful for reusable primitives, internationalization, and content that should
survive writing-mode changes.

Avoid raw pixels and magic numbers. Tailwind already provides a shared spacing,
size, text, radius, shadow, color, breakpoint, and container scale. Arbitrary
values are acceptable for real constraints, but repeated arbitrary values should
become a token, component prop, or named utility.

Use `rem`-based breakpoints and text sizes. Do not scale font size with viewport
width. Keep letter spacing at `tracking-normal` unless a specific typographic
case needs otherwise.

## Theme Variables And Tokens

Tailwind v4 theme variables create utilities. `@theme` is for design tokens that
should become utility classes. Plain `:root` variables are for runtime values or
aliases that do not need generated utilities.

Common token namespaces:

- `--color-*` -> `bg-*`, `text-*`, `border-*`, `fill-*`, `stroke-*`
- `--font-*` -> `font-*`
- `--text-*` -> `text-*`
- `--font-weight-*` -> `font-*`
- `--tracking-*` -> `tracking-*`
- `--leading-*` -> `leading-*`
- `--breakpoint-*` -> responsive variants
- `--container-*` -> container query variants and container size utilities
- `--spacing-*` -> spacing and many sizing utilities
- `--radius-*` -> `rounded-*`
- `--shadow-*` -> `shadow-*`
- `--ease-*` -> `ease-*`
- `--animate-*` -> `animate-*`

This repo uses semantic color tokens such as `background`, `foreground`,
`card`, `muted`, `border`, `input`, `ring`, and `primary`. Prefer semantic
utilities like `bg-background`, `text-foreground`, and `border-border` over
hard-coded palette classes in project UI.

Use palette classes for local, intentionally non-semantic details only. If a
color becomes part of the product language, promote it to a token.

## Dark Mode

The project uses a data-attribute dark variant:

```css
@custom-variant dark (&:is([data-theme="dark"] *));
```

Use semantic tokens first. A component that uses `bg-background`,
`text-foreground`, `border-border`, and `text-muted-foreground` often needs no
explicit `dark:` classes because the tokens change with the theme.

Use `dark:` when the relationship itself changes, not merely because a color
changes:

```html
<div class="border-border bg-card shadow-sm dark:shadow-none">...</div>
```

Always check light and dark modes. Do not leave hover, focus, disabled, border,
ring, prose, or image-overlay states untested in either theme.

## Variants And State

Variants are the core of Tailwind. They conditionally apply a utility without
leaving markup.

Common variants:

- Interactive: `hover:`, `focus:`, `focus-visible:`, `focus-within:`,
  `active:`, `disabled:`, `visited:`
- Structural: `first:`, `last:`, `odd:`, `even:`, `empty:`, `only:`
- Parent/sibling: `group-*`, `peer-*`
- Attributes: `aria-*`, `data-*`, `open:`
- Media: breakpoints, `motion-safe:`, `motion-reduce:`, `contrast-more:`
- Theme: `dark:`
- Selector logic: `has-*`, `not-*`, arbitrary variants
- Direction/interaction environment: `ltr:`, `rtl:`, `pointer-*`,
  `any-pointer-*`, `portrait:`, `landscape:`, `print:`
- Generated content: `before:`, `after:`, `placeholder:`, `selection:`,
  `marker:`, `file:`

Use state variants to make component state visible and accessible:

```html
<button
  aria-pressed="false"
  class="text-muted-foreground hover:text-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground rounded-md px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
>
  ...
</button>
```

Prefer ARIA and data variants over adding custom state classes. They keep visual
state tied to semantic or component state.

Hover-only UI is incomplete. Anything revealed on hover must also work for
keyboard and touch, usually through focus, click, or an accessible disclosure.

Use `motion-safe:` for decorative motion and `motion-reduce:` to remove or
simplify motion when the user requests reduced motion.

Use `has-*`, `group-has-*`, and `peer-has-*` to reflect descendant or sibling
state without extra JavaScript. Use `not-*` to avoid awkward conditional
template logic. Use `in-*` only when styling based on any ancestor is genuinely
clearer than adding a named `group`.

The `*` and `**` child selector variants are useful for generated content you do
not control, but avoid them in first-party components. They create broad rules
that children cannot easily override because of generated order and specificity.

Use `open:`, `popover-open:`, `target:`, and `inert:` when native HTML state
exists. Prefer styling native state over duplicating state in custom classes.

## Class Detection

Tailwind scans source files as plain text. It does not understand string
interpolation. Dynamic class construction will fail:

```tsx
// Wrong: Tailwind cannot see bg-${color}-600.
`bg-${color}-600`;
```

Map variants to complete class strings:

```tsx
const toneClasses = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  quiet: "bg-transparent text-foreground hover:bg-muted",
} as const;
```

Tailwind v4 automatically scans source files and ignores files in `.gitignore`,
`node_modules`, binary files, CSS files, and common lock files. Use the
`@source` directive only when classes live somewhere automatic detection does
not scan. Use `@source not` to exclude noisy generated or external paths. Use
`@source inline()` only to safelist classes that cannot appear literally in
source, and prefer small explicit safelists over broad generated ranges.

Keep class names complete in Markdown, MDX, Astro, React, and string maps.

## CSS Layers And Directives

The normal entry point is:

```css
@import "tailwindcss";
```

Important directives:

- `@theme`: define design tokens that generate utilities or variants.
- `@source`: explicitly include or exclude files from class detection.
- `@utility`: define custom utilities that work with variants.
- `@variant`: apply a Tailwind variant inside custom CSS.
- `@custom-variant`: define project variants such as data-attribute dark mode.
- `@apply`: inline utilities into custom CSS.
- `@reference`: make theme variables, utilities, and variants available inside
  scoped CSS modules or framework style blocks without duplicating CSS.
- `@plugin`: load a JavaScript-based Tailwind plugin such as Typography.

Tailwind also exposes build-time CSS functions:

- `--alpha(color / opacity)` for token-based opacity mixing.
- `--spacing(n)` for spacing-scale math inside custom CSS or arbitrary values.

The compatibility `theme()` function exists for older patterns, but prefer CSS theme
variables in new code.

Use `@apply` sparingly. It is best for third-party CSS integration or rare base
styles that must reuse tokens. It is usually worse than an Astro component or a
typed React component for first-party UI.

Use `@layer base` only for document-level defaults and Markdown/prose
customization. Use `@layer components` rarely for third-party components or
classes that must be overridden by utilities. Use `@utility` for a real missing
utility, not for project-specific component styling.

## Preflight

Tailwind's Preflight base layer is included by `@import "tailwindcss"`.
Important effects:

- Default margins are removed.
- Borders are reset so `border` works predictably.
- Headings are unstyled by default.
- Lists are unstyled by default.
- Replaced elements such as images and videos are block-level.
- Images and videos are constrained to their parent width by default.
- The `hidden` attribute remains hidden.

This is why UI components must consciously style headings, lists, images, and
content rhythm. For Markdown article prose, use Tailwind Typography rather than
trying to restore browser defaults globally.

If an unstyled list is still semantically a list, keep list semantics. Use
`role="list"` where a browser/screen reader combination needs it.

## Components And Duplication

Tailwind's answer to duplication is component extraction, not selector
invention.

Extract a component when:

- the same markup and utility pattern appears repeatedly;
- the pattern has a stable semantic role;
- state, variants, or accessibility need to be standardized;
- a repeated block needs tests or a clear API.

Do not extract a component when:

- the pattern appears once;
- the abstraction hides layout decisions instead of clarifying them;
- the result becomes a boolean prop cluster;
- every use immediately needs overrides.

Use slots/children for content, typed props for real variants, and normal
attribute forwarding for native affordances. Keep components responsive by
their own merits.

## Utility Families

Use this mental map when choosing utilities:

- Layout: `block`, `inline`, `flex`, `grid`, `contents`, `hidden`,
  `flow-root`, `isolate`. Use columns and `break-*` for true multi-column or
  paged content, not as a replacement for grid.
- Positioning: `relative`, `absolute`, `fixed`, `sticky`, `inset-*`, `z-*`.
  Use sticky headers with matching `scroll-mt-*` or `scroll-pt-*` so anchor
  targets are not hidden.
- Media: `aspect-*`, `object-cover`, `object-contain`, `object-*`,
  `overflow-*`, `overscroll-*`. Use `overscroll-contain` or
  `overscroll-none` only when nested scrolling needs containment.
- Flex/grid: `flex-*`, `grid-*`, `basis-*`, `grow`, `shrink`, `order-*`,
  `gap-*`, `place-*`, `items-*`, `justify-*`, `content-*`. Avoid `order-*`
  when it would make visual order conflict with reading or tab order.
- Spacing: `p*`, `m*`, `gap-*`. Prefer `gap` over `space-*` when children can
  wrap or be conditionally rendered.
- Sizing: `w-*`, `h-*`, `size-*`, `min-*`, `max-*`, logical size utilities.
- Typography: `font-*`, `text-*`, `leading-*`, `tracking-*`, `text-wrap`,
  `truncate`, `line-clamp-*`, `whitespace-*`, `break-*`, `hyphens-*`.
  Use `text-balance` for short headings, `text-pretty` for nicer paragraphs,
  `wrap-anywhere`/`break-words` for hostile long strings, and `line-clamp-*`
  only when hiding extra text is acceptable.
- Color: semantic `bg-*`, `text-*`, `border-*`, `ring-*`, `fill-*`,
  `stroke-*`.
- Borders/rings: `rounded-*`, `border-*`, `divide-*`, `outline-*`, `ring-*`.
  Prefer outlines/rings for focus and visible affordances over extra wrapper
  elements.
- Effects: `shadow-*`, `opacity-*`, `mix-blend-*`, `blur-*`, `drop-shadow-*`,
  `backdrop-*`, `mask-*`. Treat masks, blend modes, filters, backdrop filters,
  and text shadows as exceptional visual effects, not defaults.
- Motion: `transition-*`, `duration-*`, `ease-*`, `delay-*`, `animate-*`,
  `transform`, `translate-*`, `scale-*`, `rotate-*`. Use `transition-behavior`
  only when discrete transitions are intentional.
- Interactivity: `cursor-*`, `pointer-events-*`, `select-*`, `resize-*`,
  `touch-*`, `scroll-*`, `accent-*`, `caret-*`, `color-scheme-*`,
  `field-sizing-*`. Use `accent-*` for native form controls and
  `field-sizing-content` for inputs/textareas that should grow to content.
- Accessibility: `sr-only`, `not-sr-only`, `forced-color-adjust-*`.

Prefer semantic HTML and accessible components over display utilities that fake
semantics. Use real tables for tabular data. Use lists for lists. Use buttons
for actions and links for navigation.

## Utility Class Catalog

This is a working map of the current Tailwind utility surface. `*` means the
utility accepts theme tokens, fractions, CSS variables, arbitrary values, or
generated variants where Tailwind supports them. Use this catalog to choose the
right family quickly, then check the docs for exact edge cases.

### Variant Prefixes

- Responsive viewport: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`, `max-*`,
  `min-[...]`, `max-[...]`, range stacks like `md:max-xl:`.
- Responsive container: `@container`, `@sm:`, `@md:`, `@max-*`, `@min-[...]`,
  named containers like `@container/card` and `@md/card:*`.
- Theme: `dark:*` using this repo's `[data-theme="dark"]` custom variant.
- Interaction: `hover:`, `focus:`, `focus-visible:`, `focus-within:`,
  `active:`, `visited:`, `disabled:`, `enabled:`.
- Structure: `first:`, `last:`, `only:`, `odd:`, `even:`, `empty:`.
- Parent/sibling: `group-*`, named groups like `group/nav`, `peer-*`, named
  peers like `peer/search`.
- Attribute/state: `aria-*`, `data-*`, `open:`, `popover-open:`, `inert:`,
  `target:`.
- Selector logic: `has-*`, `group-has-*`, `peer-has-*`, `not-*`, `in-*`,
  arbitrary variants like `[&>p]:mt-4`.
- Media environment: `motion-safe:`, `motion-reduce:`, `contrast-more:`,
  `contrast-less:`, `forced-colors:`, `pointer-*`, `any-pointer-*`,
  `portrait:`, `landscape:`, `print:`, `supports-[...]`.
- Direction: `ltr:`, `rtl:`.
- Generated content and child styling: `before:`, `after:`, `placeholder:`,
  `selection:`, `marker:`, `file:`, `backdrop:`, `*`, `**`.

### Layout

- Aspect ratio: `aspect-auto`, `aspect-square`, `aspect-video`,
  `aspect-<ratio>`, `aspect-[...]`.
- Columns: `columns-*` for true multi-column content.
- Fragment breaks: `break-before-*`, `break-after-*`, `break-inside-*` for
  columns, pages, and print-like flows.
- Decoration fragments: `box-decoration-slice`, `box-decoration-clone`.
- Box sizing: `box-border`, `box-content`.
- Display: `block`, `inline-block`, `inline`, `flex`, `inline-flex`, `grid`,
  `inline-grid`, `flow-root`, `contents`, `list-item`, `hidden`, table display
  utilities like `table`, `table-row`, `table-cell`, `table-caption`.
- Float/clear: `float-start`, `float-end`, `float-left`, `float-right`,
  `float-none`, `clear-start`, `clear-end`, `clear-left`, `clear-right`,
  `clear-both`, `clear-none`.
- Isolation: `isolate`, `isolation-auto`.
- Object media: `object-contain`, `object-cover`, `object-fill`,
  `object-none`, `object-scale-down`, `object-*` positions.
- Overflow: `overflow-auto`, `overflow-hidden`, `overflow-clip`,
  `overflow-visible`, `overflow-scroll`, plus `overflow-x-*`, `overflow-y-*`.
- Overscroll: `overscroll-auto`, `overscroll-contain`, `overscroll-none`, plus
  axis variants.
- Position: `static`, `relative`, `absolute`, `fixed`, `sticky`.
- Insets: `inset-*`, `inset-x-*`, `inset-y-*`, `start-*`, `end-*`, `top-*`,
  `right-*`, `bottom-*`, `left-*`.
- Visibility: `visible`, `invisible`, `collapse`.
- Stack order: `z-*`, `z-auto`.

### Flexbox And Grid

- Flex direction: `flex-row`, `flex-row-reverse`, `flex-col`,
  `flex-col-reverse`.
- Flex wrapping: `flex-wrap`, `flex-nowrap`, `flex-wrap-reverse`.
- Flex shorthand: `flex-1`, `flex-auto`, `flex-initial`, `flex-none`,
  `flex-*`.
- Flex basis/grow/shrink: `basis-*`, `grow`, `grow-0`, `grow-*`, `shrink`,
  `shrink-0`, `shrink-*`.
- Order: `order-first`, `order-last`, `order-none`, `order-*`.
- Grid templates: `grid-cols-*`, `grid-cols-none`, `grid-cols-subgrid`,
  `grid-rows-*`, `grid-rows-none`, `grid-rows-subgrid`.
- Grid placement: `col-auto`, `col-span-*`, `col-start-*`, `col-end-*`,
  `row-auto`, `row-span-*`, `row-start-*`, `row-end-*`.
- Grid auto placement: `grid-flow-row`, `grid-flow-col`, `grid-flow-dense`,
  `grid-flow-row-dense`, `grid-flow-col-dense`.
- Implicit tracks: `auto-cols-auto`, `auto-cols-min`, `auto-cols-max`,
  `auto-cols-fr`, `auto-cols-*`, `auto-rows-auto`, `auto-rows-min`,
  `auto-rows-max`, `auto-rows-fr`, `auto-rows-*`.
- Gaps: `gap-*`, `gap-x-*`, `gap-y-*`.
- Main-axis packing: `justify-normal`, `justify-start`, `justify-end`,
  `justify-center`, `justify-between`, `justify-around`, `justify-evenly`,
  `justify-stretch`, `justify-baseline`.
- Grid inline-axis items: `justify-items-normal`, `justify-items-start`,
  `justify-items-end`, `justify-items-center`, `justify-items-stretch`.
- Grid self inline-axis: `justify-self-auto`, `justify-self-start`,
  `justify-self-end`, `justify-self-center`, `justify-self-stretch`.
- Cross-axis/multi-line packing: `content-normal`, `content-center`,
  `content-start`, `content-end`, `content-between`, `content-around`,
  `content-evenly`, `content-baseline`, `content-stretch`.
- Cross-axis items: `items-start`, `items-end`, `items-center`,
  `items-baseline`, `items-stretch`.
- Cross-axis self: `self-auto`, `self-start`, `self-end`, `self-center`,
  `self-stretch`, `self-baseline`.
- Combined alignment: `place-content-*`, `place-items-*`, `place-self-*`.

### Spacing

- Padding: `p-*`, `px-*`, `py-*`, `ps-*`, `pe-*`, `pt-*`, `pr-*`, `pb-*`,
  `pl-*`.
- Margin: `m-*`, `mx-*`, `my-*`, `ms-*`, `me-*`, `mt-*`, `mr-*`, `mb-*`,
  `ml-*`, with `auto` where supported.
- Sibling spacing: `space-x-*`, `space-y-*`, reverse helpers. Prefer `gap-*`
  when children can wrap, reorder, or be conditionally omitted.
- Negative spacing: negative margin and translate utilities are available when
  deliberate overlap is the actual design.

### Sizing

- Physical width: `w-*`, `min-w-*`, `max-w-*`.
- Physical height: `h-*`, `min-h-*`, `max-h-*`.
- Both axes: `size-*`.
- Logical inline size: `inline-*`, `min-inline-*`, `max-inline-*`.
- Logical block size: `block-*`, `min-block-*`, `max-block-*`.
- Common values: spacing tokens, fractions, `auto`, `px`, `full`, `screen`,
  viewport units like `dvw`/`svw`/`lvw` and `dvh`/`svh`/`lvh`, `min`, `max`,
  `fit`, container sizes such as `prose`, `screen-*`, and arbitrary values.

### Typography

- Families: `font-sans`, `font-serif`, `font-mono`, custom `font-*`.
- Size/line-height: `text-*`, slash line-height like `text-sm/6`, arbitrary
  values.
- Smoothing: `antialiased`, `subpixel-antialiased`.
- Style/weight/stretch: `italic`, `not-italic`, `font-thin`,
  `font-extralight`, `font-light`, `font-normal`, `font-medium`,
  `font-semibold`, `font-bold`, `font-extrabold`, `font-black`,
  `font-stretch-*`.
- Numeric and font features: `ordinal`, `slashed-zero`, `lining-nums`,
  `oldstyle-nums`, `proportional-nums`, `tabular-nums`,
  `diagonal-fractions`, `stacked-fractions`, arbitrary font-feature utilities.
- Tracking/leading: `tracking-*`, `leading-*`.
- Lists: `list-none`, `list-disc`, `list-decimal`, `list-inside`,
  `list-outside`, `list-image-*`.
- Alignment: `text-left`, `text-center`, `text-right`, `text-justify`,
  `text-start`, `text-end`.
- Text color: `text-*`, semantic colors, opacity modifiers.
- Decoration: `underline`, `overline`, `line-through`, `no-underline`,
  `decoration-*`, `decoration-solid`, `decoration-double`,
  `decoration-dotted`, `decoration-dashed`, `decoration-wavy`,
  `decoration-from-font`, `decoration-auto`, `decoration-<number>`,
  `underline-offset-*`.
- Case: `uppercase`, `lowercase`, `capitalize`, `normal-case`.
- Overflow: `truncate`, `text-ellipsis`, `text-clip`, `line-clamp-*`.
- Wrapping: `text-wrap`, `text-nowrap`, `text-balance`, `text-pretty`,
  `whitespace-*`, `break-normal`, `break-all`, `break-keep`, `break-words`,
  `wrap-anywhere`, `hyphens-none`, `hyphens-manual`, `hyphens-auto`.
- Other text flow: `indent-*`, `align-baseline`, `align-top`,
  `align-middle`, `align-bottom`, `align-text-top`, `align-text-bottom`,
  `content-*` for pseudo-elements.

### Backgrounds

- Attachment: `bg-fixed`, `bg-local`, `bg-scroll`.
- Clip: `bg-clip-border`, `bg-clip-padding`, `bg-clip-content`,
  `bg-clip-text`.
- Color: `bg-*`, semantic colors, opacity modifiers.
- Image: `bg-none`, `bg-[image:var(--hero-image)]`, gradient utilities.
  Gradients are not part of this site's current visual direction unless
  re-approved.
- Origin: `bg-origin-border`, `bg-origin-padding`, `bg-origin-content`.
- Position: `bg-center`, `bg-top`, `bg-right`, `bg-bottom`, `bg-left`, corner
  combinations, arbitrary positions.
- Repeat: `bg-repeat`, `bg-no-repeat`, `bg-repeat-x`, `bg-repeat-y`,
  `bg-repeat-round`, `bg-repeat-space`.
- Size: `bg-auto`, `bg-cover`, `bg-contain`, arbitrary sizes.

### Borders, Outlines, Rings, And Shadows

- Radius: `rounded-*`, `rounded-none`, `rounded-full`, side/corner/logical
  variants.
- Border width: `border`, `border-*`, `border-x-*`, `border-y-*`, logical and
  side variants.
- Border color/style: `border-*`, `border-solid`, `border-dashed`,
  `border-dotted`, `border-double`, `border-hidden`, `border-none`.
- Divide lines: `divide-x-*`, `divide-y-*`, `divide-*`, `divide-solid`,
  `divide-dashed`, `divide-dotted`, `divide-double`, `divide-none`.
- Outline: `outline`, `outline-*`, `outline-hidden`, `outline-none`,
  `outline-offset-*`, `outline-*` colors and styles.
- Rings and shadows: `shadow-*`, `inset-shadow-*`, `ring`, `ring-*`,
  `ring-inset`, `inset-ring`, `inset-ring-*`, shadow/ring color utilities.
- Text shadow: `text-shadow-*`.

### Effects, Filters, And Masks

- Opacity: `opacity-*`.
- Blend modes: `mix-blend-*`, `bg-blend-*`.
- Filters: `filter`, `filter-none`, `blur-*`, `brightness-*`, `contrast-*`,
  `drop-shadow-*`, `grayscale`, `grayscale-*`, `hue-rotate-*`, `invert`,
  `invert-*`, `saturate-*`, `sepia`, `sepia-*`.
- Backdrop filters: `backdrop-filter`, `backdrop-filter-none`,
  `backdrop-blur-*`, `backdrop-brightness-*`, `backdrop-contrast-*`,
  `backdrop-grayscale`, `backdrop-hue-rotate-*`, `backdrop-invert`,
  `backdrop-opacity-*`, `backdrop-saturate-*`, `backdrop-sepia`.
- Masks: `mask-*`, `mask-clip-*`, `mask-composite-*`, `mask-image` utilities,
  `mask-mode-*`, `mask-origin-*`, `mask-position-*`, `mask-repeat-*`,
  `mask-size-*`, `mask-type-*`.

### Tables

- Border model: `border-collapse`, `border-separate`.
- Spacing: `border-spacing-*`, `border-spacing-x-*`, `border-spacing-y-*`.
- Layout: `table-auto`, `table-fixed`.
- Captions: `caption-top`, `caption-bottom`.

### Transitions, Animation, And Transforms

- Transition property: `transition`, `transition-all`, `transition-colors`,
  `transition-opacity`, `transition-shadow`, `transition-transform`,
  `transition-none`, and arbitrary property transitions.
- Discrete transitions: `transition-discrete`, `transition-normal`.
- Timing: `duration-*`, `ease-*`, `delay-*`.
- Animation: `animate-spin`, `animate-ping`, `animate-pulse`,
  `animate-bounce`, `animate-none`, custom `animate-*`.
- 3D visibility/context: `backface-visible`, `backface-hidden`,
  `perspective-*`, `perspective-origin-*`, `transform-3d`, `transform-flat`.
- Transform: `transform`, `transform-gpu`, `transform-cpu`, `transform-none`.
- Transform origin: `origin-*`.
- Rotate/scale/skew/translate: `rotate-*`, `scale-*`, `scale-x-*`,
  `scale-y-*`, `skew-*`, `skew-x-*`, `skew-y-*`, `translate-*`,
  `translate-x-*`, `translate-y-*`, `translate-z-*`.

### Interactivity And Scrolling

- Native control color: `accent-*`, `caret-*`, `scheme-*`.
- Native appearance: `appearance-none`, `appearance-auto`.
- Cursor: `cursor-*`.
- Field sizing: `field-sizing-fixed`, `field-sizing-content`.
- Pointer events: `pointer-events-none`, `pointer-events-auto`.
- Resize: `resize`, `resize-none`, `resize-x`, `resize-y`.
- Scroll behavior: `scroll-auto`, `scroll-smooth`.
- Scroll offsets: `scroll-m-*`, `scroll-mx-*`, `scroll-my-*`,
  `scroll-ms-*`, `scroll-me-*`, `scroll-mt-*`, `scroll-mr-*`,
  `scroll-mb-*`, `scroll-ml-*`; matching `scroll-p*` utilities.
- Scroll snapping: `snap-none`, `snap-x`, `snap-y`, `snap-both`,
  `snap-mandatory`, `snap-proximity`, `snap-start`, `snap-end`,
  `snap-center`, `snap-align-none`, `snap-normal`, `snap-always`.
- Touch: `touch-auto`, `touch-none`, `touch-pan-x`, `touch-pan-y`,
  `touch-pinch-zoom`, directional pan utilities, manipulation utilities.
- Selection: `select-none`, `select-text`, `select-all`, `select-auto`.
- Performance hint: `will-change-auto`, `will-change-scroll`,
  `will-change-contents`, `will-change-transform`, arbitrary `will-change-*`.

### SVG And Accessibility

- SVG fill/stroke: `fill-*`, `stroke-*`, `stroke-<number>`, arbitrary stroke
  widths. Prefer `currentColor`-driven icons unless a separate color is needed.
- Screen-reader utilities: `sr-only`, `not-sr-only`.
- Forced colors: `forced-color-adjust-auto`, `forced-color-adjust-none`.

### Plugins And Integrated Utilities

- Typography plugin: `prose`, size modifiers like `prose-lg`, color modifiers,
  element modifiers like `prose-a:*`, `dark:prose-invert`, and `not-prose`.
- Aspect ratio and line clamp are core utility families in current Tailwind;
  do not add old plugins for them.
- Forms are usually best handled with native controls plus project components.
  Add `@tailwindcss/forms` only if the project deliberately chooses that
  baseline.
- Custom plugins are a last resort for reusable utility families that cannot be
  expressed cleanly with `@theme`, `@utility`, components, or local variants.

## Typography And Markdown

The Typography plugin provides `prose` classes for content generated from
Markdown, MDX, or a CMS. Use it for article bodies and long-form content where
the generated elements do not naturally carry utility classes.

Recommended pattern:

```astro
<article
  class="prose prose-neutral dark:prose-invert prose-a:text-primary max-w-none"
>
  <slot />
</article>
```

Do not globally style every `h1`, `p`, `ul`, or `blockquote` to make Markdown
look right. Keep prose styling scoped to the content region.

For UI text outside prose, use explicit utilities. Reserve large display type
for real display contexts. Compact cards, sidebars, controls, and nav items
should use tighter, smaller type.

Use truncation deliberately:

- `truncate` for one-line labels where full text is available elsewhere.
- `line-clamp-*` for summaries where loss is acceptable.
- `whitespace-nowrap` only when the container has a plan for overflow.
- `break-words`, `wrap-anywhere`, and `hyphens-auto` when prose or URLs can
  otherwise overflow.

## Images And Media

Tailwind controls layout and presentation; Astro should control image
processing where possible.

Use Tailwind for image frames:

- `w-full`
- `h-auto`
- `aspect-*`
- `object-cover` or `object-contain`
- `rounded-*`
- `overflow-hidden`

Use Astro `Image`/`Picture` for component-controlled images when possible.
Prefer `layout="full-width"` or Astro's image layout options over hand-writing
unnecessary `widths`/`sizes` unless there is a measured reason.

Do not use CSS background images for meaningful content images. Use real image
elements with useful `alt` text.

## Production And Performance

Tailwind v4 generates CSS from detected class names and is designed for small
production output. The production source of truth is the built site.

Performance rules:

- Keep class names statically visible.
- Avoid dynamic class construction.
- Keep global CSS small.
- Avoid shipping client JavaScript for static styling.
- Avoid decorative filters, backdrop blur, shadows, and animations unless they
  improve the interface.
- Use `motion-safe:` and `motion-reduce:`.
- Use responsive image constraints so media does not cause layout shift or
  overflow.
- Use `will-change-*` only immediately around known animation-heavy elements;
  do not leave broad `will-change` hints on static UI.
- Let Prettier with `prettier-plugin-tailwindcss` sort classes.

Do not add post-build CSS mutation. If output is wrong, fix source components,
tokens, Tailwind directives, or Astro config.

## Accessibility

Tailwind can express accessible states, but it does not create accessibility by
itself.

Required habits:

- Use semantic elements first.
- Keep visible focus states with `focus-visible:*`.
- Do not remove outlines without replacing them.
- Use `sr-only` for text labels on icon-only controls.
- Use `not-sr-only` when hidden labels should reappear at wider sizes.
- Style `disabled`, `aria-*`, `data-*`, and `open` states explicitly.
- Preserve contrast in light and dark modes.
- Do not rely on color alone for state.
- Do not rely on hover alone for information or interaction.
- Respect reduced motion.
- Ensure horizontal overflow is deliberate and contained.

## Project Preferences

For this site:

- Use Tailwind utilities as the default styling language.
- Use Astro components for static UI.
- Use React/shadcn/Radix only for interaction that benefits from them.
- Keep global CSS foundational and small.
- Prefer semantic color tokens over raw palette colors.
- Prefer responsive components and container queries over page-level patches.
- Avoid gradients unless explicitly re-approved.
- Avoid raw pixels and magic numbers.
- Avoid custom CSS for things Tailwind can express cleanly.
- Use Tailwind Typography for article prose.
- Keep component APIs typed, small, and composable.

## Common Mistakes

Avoid these:

- Building class names dynamically with interpolation.
- Adding page-level CSS to patch a broken component.
- Treating breakpoints as device names.
- Using `sm:` for mobile styles.
- Adding one-off pixel breakpoints after visual trial and error.
- Hiding overflow to conceal layout bugs.
- Forgetting `min-w-0` in flex/grid children with long text.
- Using `space-*` where wrapping children need `gap`.
- Using `order-*` to change layout in a way that breaks reading or tab order.
- Using `pointer-events-none` on elements that still need interaction or focus.
- Removing focus outlines.
- Styling hover but not focus/touch.
- Using global CSS for first-party components.
- Overusing `@apply`.
- Overusing child selector variants instead of styling the actual component
  children.
- Creating component classes before a reusable component exists.
- Using arbitrary values repeatedly instead of tokens.
- Putting meaningful images in CSS backgrounds.
- Overusing `z-*` instead of fixing stacking context or DOM order.
- Leaving `will-change-*` on ordinary elements.
- Adding filters/backdrop blur/animation as decoration without checking
  performance, readability, and reduced-motion behavior.
- Assuming the docs for an older Tailwind version describe this project's
  configuration model.

## Agent Workflow

When implementing UI:

1. Start with semantic HTML and accessible structure.
2. Build the mobile/narrow version first.
3. Add responsive enhancements with Tailwind variants.
4. Use container queries when component space matters more than viewport width.
5. Use tokens and semantic utilities.
6. Extract repeated patterns into Astro components or small React components.
7. Keep class names statically detectable.
8. Test light, dark, narrow, medium, wide, keyboard, hover, and reduced-motion
   states.
9. Run the relevant project checks.

If unsure, search the current Tailwind docs precisely, for example:

- `Tailwind v4 @theme color tokens`
- `Tailwind responsive design container queries`
- `Tailwind detecting classes dynamic class names`
- `Tailwind dark mode data attribute custom variant`
- `Tailwind @utility custom utility variants`
- `Tailwind Typography prose dark mode`
