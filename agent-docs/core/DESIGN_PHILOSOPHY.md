# Design Philosophy

This project is a modern Astro site composed from responsive design blocks and
responsive components. The current implementation is useful for tone, palette,
content structure, and broad visual direction, but it is not an architectural
contract.

Content fidelity is strict. Layout and implementation details are allowed to
change when a more professional, maintainable, accessible, or performant
approach is available.

## Core Standard

The site should be:

- Static-first.
- Mobile-first.
- Responsive all the way down.
- Componentized all the way down.
- Content-out rather than canvas-in.
- Tailwind-first for styling.
- Astro-first for rendering.
- Accessible by default.
- Designed to maximize Lighthouse scores.
- Easy for authors to maintain without touching application code.

The default implementation model is:

```text
Pages
  compose responsive Blocks

Blocks
  compose responsive Components

Components
  compose responsive UI primitives

UI primitives
  consume Tailwind utilities and project design tokens
```

Every component should be correct by its own merits. A component should define
its own spacing, wrapping, sizing constraints, focus states, dark mode behavior,
and responsive behavior. Pages should compose components, not patch them.

The site should function like a small design system. Components and blocks
should expose stable props, clear slots, consistent variants, and predictable
responsive behavior. shadcn and Radix are useful references because they model
composable primitives, explicit state, accessibility, and reusable styling
contracts. Use those patterns when they fit, even when the implementation is a
plain Astro component.

## Tech Stack

Use this stack as the default:

- Astro for pages, layouts, build-time rendering, and content collections.
- Astro components for site UI, layout, navigation, article templates, and
  reusable blocks.
- Markdown for normal articles.
- MDX for future articles that need custom content components.
- Tailwind CSS for application styling.
- `@tailwindcss/typography` for Markdown-rendered article bodies.
- Bun for dependency management and local scripts.
- Lighthouse CI for score tracking and release gates.
- Playwright for viewport, navigation, menu, and no-overflow checks.
- axe, preferably through Playwright, for accessibility checks.

React and shadcn-style components may be used, but they are not the default
runtime model. Use them when they improve maintainability or interaction quality
without compromising the static-first architecture.

## Tailwind Boundary

Tailwind should be the default way to style the site.

Use Tailwind for:

- Layout.
- Spacing.
- Sizing.
- Responsive behavior.
- Typography.
- Color.
- Borders.
- Radius.
- Shadows.
- Focus states.
- Hover and active states.
- Dark mode variants.
- Component-level visual states.

The non-Tailwind layer should be small and foundational. It exists mainly for
things Tailwind consumes or cannot define alone:

- Tailwind imports.
- Design tokens and CSS variables.
- Theme values for light and dark mode.
- Font registration or Astro font configuration.
- Base `html` and `body` styles.
- Tailwind Typography customization.
- Rare browser defaults such as `::selection`.
- Rare keyframes or animation tokens.

Do not build large handcrafted CSS or SCSS files. Do not use page-level CSS to
repair component-level layout problems. Do not add one-off media query patches
when the real issue is component design.

## Responsive Design

Responsive design is a component contract, not a final cleanup pass. The goal is
not to maintain a few device-specific layouts. The goal is to build content
systems that remain readable, usable, and aesthetically coherent across unknown
screen sizes, input modes, network conditions, and user preferences.

Build mobile-first:

- Start from the narrowest useful viewport.
- Add complexity as space becomes available.
- Prefer progressive disclosure over crowded layouts.
- Let blocks stack naturally before introducing dense desktop layouts.

Mobile-first is the implementation default, not a reason to ignore wide,
tablet, short, or awkward states. During design and QA, inspect the component at
multiple widths and heights. The most useful breakpoint is often where the
component starts to lose its shape, not where a named device begins.

Use Tailwind's responsive utilities for standard viewport changes. In Tailwind,
unprefixed utilities define the default/narrow state, while `sm:`, `md:`,
`lg:`, `xl:`, and `2xl:` layer on behavior at wider breakpoints. Use `max-*`
and range variants only when they make the component clearer.

Use container queries when component behavior depends on the component's own
available width rather than the full viewport. This is especially important for
reusable cards, media objects, navigation groups, sidebars, callouts, and article
blocks that may appear in multiple contexts.

Avoid brittle one-off pixel breakpoints such as:

```css
@media (max-width: 873px) {
  /* layout patch */
}
```

Prefer:

- Tailwind breakpoint tiers.
- Tailwind container queries for portable components.
- `min-w-0` for flex/grid children that must shrink.
- `w-full`, `max-w-*`, and `flex-1` for flexible sizing.
- Grid and flex layouts that naturally adapt.
- Explicit aspect ratios for fixed-format media.
- `clamp()` only when fluid sizing is genuinely needed.
- Measured behavior only for components whose layout depends on real rendered
  width, such as complex priority navigation.

Evaluate responsive components through five questions:

- Width: does the layout still fit without overlap or overflow?
- Hierarchy: does the most important content remain first and clear?
- Interaction: does the control model still make sense for available space and
  likely input methods?
- Density: is extra information added only when it improves the experience?
- Media: do images and videos preserve their meaning at each rendered size?

Navigation deserves special care. Hiding navigation behind a menu can be right,
but it should be a deliberate prioritization decision, not a way to avoid
simplifying the information architecture. Prefer focused navigation, progressive
disclosure, and a reliable all-items fallback over crowded rows that collide or
menus that bury primary tasks.

The quality bar is simple: no horizontal overflow, no overlapping controls, no
unreadable content, and no layout that only works at the viewport sizes where it
was manually tested.

Localization is part of responsive design, not a separate translation pass.
Reusable components that render labels, metadata rows, actions, or prose-adjacent
content should tolerate longer translated strings, non-Latin scripts, and
right-to-left direction. English word length, slash-separated metadata, and
left-to-right inline order are defaults, not invariants.

## Component Architecture

Prefer this directory shape:

```text
src/components/ui/
src/components/layout/
src/components/navigation/
src/components/articles/
src/components/blocks/
```

Suggested responsibilities:

- `ui/`: buttons, links, inputs, badges, separators, icon buttons, containers.
- `layout/`: base layout, site shell, page frame, header, footer.
- `navigation/`: primary nav, mobile nav, category navigation, breadcrumbs.
- `articles/`: article header, metadata, article lists, cards, prose wrapper.
- `blocks/`: homepage sections, support blocks, category sections, about sections.

Pages should read as composition:

```astro
<BaseLayout title={title}>
  <HomeHero />
  <LatestArticles articles={articles} />
  <CategoryOverview categories={categories} />
  <SupportBlock />
</BaseLayout>
```

Components should have stable public props and should not reach across the
application for unrelated data. Shared data normalization belongs in `src/lib/`,
not in visual components.

Build patterns before pages. A homepage, article page, category archive, and search
page should feel like different compositions of the same system, not unrelated
templates. When a new design need appears, prefer extracting a reusable block or
component over adding page-local markup that cannot be reused.

Component APIs should be boring and predictable:

- One primary reusable component per file.
- PascalCase component filenames and references.
- Explicit typed props.
- Defaults for optional props.
- Semantic variants such as `variant`, `size`, and `tone`.
- No custom meanings for native names such as `class`, `style`, `href`, or
  `disabled`.
- Sparse prop spreading, with implementation-only props filtered out first.
- Stable keys for repeated items.
- Semantic HTML and valid ARIA before custom accessibility workarounds.

React components are reserved for islands that need client state or complex
accessible interactions. When React is used, prefer function components,
composition, hooks, and narrow state boundaries. Do not use React as a styling
or layout default when an Astro component can render static HTML.

## UI Excellence Bar

Excellent UI implementation is not just visual fidelity. It is a system where
future changes are predictable, accessible, performant, and easy to compose.

Use these practices as the default:

- Treat component props as public APIs.
- Prefer composition over broad configuration.
- Prefer named variants over clusters of boolean props.
- Make invalid states unrepresentable with typed unions or normalized state
  objects.
- Keep visual components free of parsing, routing, and data cleanup
  logic.
- Normalize data at boundaries before passing it into UI.
- Handle loading, empty, error, disabled, selected, expanded, and long-content
  states deliberately.
- Use semantic HTML before custom behavior.
- Keep focus states, keyboard behavior, reduced motion, and color contrast part
  of the component contract.
- Test production-like behavior, not only the happy path in dev mode.

Avoid these anti-patterns:

- Page-first implementation where every route becomes a custom template.
- God components that combine data loading, formatting, layout, interaction, and
  presentation.
- Leaky components that require parents to know internal selectors or wrapper
  rules.
- Prop dumping and broad spreading of unknown objects.
- State soup made from duplicated or contradictory booleans.
- Hydrating static content, page shells, article prose, or basic cards.
- Dependency-as-design, where a package is added instead of understanding a
  small UI problem.
- Accessibility patches on top of incorrect HTML.
- Unbounded assumptions about title length, label length, image size, or nav
  item count.
- CSS specificity wars, `!important`, and distant page-level overrides.
- Premature abstraction before a real repeated pattern exists.
- Copy-pasted markup after a real pattern has clearly emerged.

## CSS And Tailwind Discipline

Tailwind is valuable because it turns raw CSS values into a shared design
language. Agents should prefer the shared scale before inventing values.

Prefer:

- Tailwind spacing, sizing, typography, color, radius, shadow, and breakpoint
  tokens.
- Flow, flex, grid, `minmax()`, `auto-fit`, `auto-fill`, intrinsic sizing, and
  container queries.
- `min-w-0`, `max-w-*`, `w-full`, `flex-1`, and grid tracks that let content
  shrink and grow naturally.
- `aspect-ratio` and `object-fit` for media constraints.
- `clamp()` only when fluid sizing is intentional and clearer than breakpoint
  steps.
- Logical start/end thinking for spacing and alignment, especially for reusable
  primitives.

Avoid:

- Raw pixel values without a design-system reason.
- Magic numbers that merely hide a layout failure.
- Arbitrary values such as `max-w-[873px]` unless a measured invariant demands
  it.
- Custom CSS media queries that duplicate Tailwind breakpoint or container-query
  behavior.
- Absolute positioning to force normal document flow.
- Large handcrafted CSS for component behavior that Tailwind and modern CSS can
  express directly.

Good reasons for explicit values include icons, tap targets, borders, known
image aspect ratios, stable media dimensions, and documented design tokens. If
an arbitrary value appears more than once, strongly consider promoting it into a
token, component variant, or named helper.

Logical sizing means thinking in the inline and block axes rather than assuming
every layout is left-to-right horizontal forever. For this project, normal
Tailwind physical utilities are fine when they are clearer, but reusable
components should prefer flow-aware thinking: start/end over left/right when it
matters, available inline space over fixed viewport width, and container width
over page width when the component may move between contexts.

## Content Authoring

Article authors should only need to add Markdown or MDX files.

Adding an article should not require editing:

- Routes.
- Index pages.
- Navigation code.
- RSS code.
- Sitemap code.
- Search code.
- Build scripts, except when intentionally changing the content model.

The content system should derive or validate mechanical metadata wherever
reasonable. Author-facing frontmatter should remain small and meaningful.

Plain Markdown is the default for articles. MDX is available when an article
needs custom content blocks.

The article shell is componentized:

```astro
<ArticleLayout article={article}>
  <ArticleHeader article={article} />
  <ArticleProse>
    <Content />
  </ArticleProse>
</ArticleLayout>
```

Plain Markdown body content is rendered by Astro and styled through
`ArticleProse` using Tailwind Typography. Future MDX articles may use explicit
custom components such as callouts, figures, annotations, or interactive
examples.

Do not build a complicated Markdown transformation layer unless there is a
specific content need that cannot be handled by Markdown, MDX, or Tailwind
Typography.

## Astro Rendering Model

Prefer static Astro output.

Astro components should render to HTML at build time unless there is a specific
interactive requirement. Framework components can also be prerendered when they
are not given a `client:*` directive.

Use Astro content collections for article data. Prefer build-time collections
for this site because articles are mostly static, benefit from build-time type
checking, and should produce fast static pages.

Avoid runtime content fetching unless a future feature truly needs live data.

Use Astro layouts for page shells and article templates. Do not use Markdown
`layout` frontmatter as an authoring requirement for articles in collections.

## Islands And Hydration

Hydration is an exception, not the default.

Every hydrated component spends Lighthouse budget through JavaScript transfer,
parse time, execution time, hydration work, and possible layout work. Minifying
helps, but it does not remove runtime cost.

Default rule:

- Render static HTML with Astro.
- Add browser JavaScript only at the smallest useful interactive boundary.
- Prefer zero-JS or low-JS solutions when they provide the same user experience.
- Hide low-level behavior inside reusable components so authors never deal with
  implementation details.

Use client directives intentionally:

- `client:load`: only for above-the-fold UI that must be interactive
  immediately.
- `client:idle`: for lower-priority UI that can hydrate after initial load.
- `client:visible`: for below-the-fold or heavier components.
- `client:media`: for components only useful at certain viewport sizes.
- Avoid `client:only` unless server rendering is impossible or actively wrong.

React, Radix, and shadcn-style components are acceptable when they are the right
tool, but do not hydrate a whole interaction system for a simple static visual.
Static shadcn-style primitives are fine. Interactive shadcn/Radix components
need a clear reason.

## JavaScript Budget

Keep client JavaScript small and deliberate.

Expected client-side behavior may include:

- Theme toggle persistence.
- Mobile or responsive navigation behavior.
- Search enhancement.
- Optional future MDX article interactions.

Avoid:

- Hydrating large layout regions.
- Shipping React for static content.
- Loading third-party scripts by default.
- Adding client-side routing unless there is a strong reason.
- Adding animation libraries for simple transitions.
- Making article reading depend on JavaScript.

Core reading, navigation, article pages, RSS, sitemap, and static content should
work without client JavaScript.

Prefer route-level JavaScript isolation. Search can load Pagefind on the search
page. Article-specific MDX interactions should load only on articles that use
them. Layout-level JavaScript should stay tiny enough to audit at a glance.

## Build Output And Minification

Astro's production build should be the source of deployable output. Do not ship
development assets or unbuilt source files.

The production build contract is:

- `just build` runs `astro build` and generates the Pagefind search index.
- `astro build` writes deployable static output to `dist/`.
- Astro/Vite owns bundled CSS and processed client JavaScript from project
  source.
- Astro emits bundled project assets under `_astro/` with content-hashed
  filenames for cacheability.
- Pagefind owns its generated search files under `dist/pagefind/`.
- Files in `site/public/` are copied as static files and should be treated as
  already production-ready.

The production build should:

- Prerender static pages whenever possible.
- Minify and chunk CSS through the Astro/Vite production pipeline.
- Process, bundle, deduplicate, and minify Astro-managed client JavaScript.
- Keep generated HTML compact and static.
- Tree-shake unused JavaScript.
- Generate a small Tailwind CSS bundle by scanning only real source files.
- Avoid importing large libraries into client-side code unless they are
  necessary for a measured interaction.
- Avoid duplicate client bundles caused by repeated framework islands.
- Produce hashed immutable assets where the build tool supports them.
- Keep `dist/` as the only directory intended for static hosting.

Astro only optimizes assets that go through its build pipeline. Be deliberate
with anything outside that path:

- Use normal Astro component styles and scripts when Astro should bundle and
  optimize them.
- Use `is:inline` only for tiny boot scripts or code that intentionally must
  appear exactly where authored.
- Keep scripts loaded from `site/public/` or external URLs rare and
  intentionally reviewed.
- Keep Pagefind enhancement isolated to search pages.

Compression is a hosting concern, but the site should assume production serves:

- Brotli when supported.
- gzip as a fallback.
- Long-lived cache headers for hashed assets.
- Shorter cache headers for HTML, RSS, sitemap, and search index files that may
  change between builds.

Do not rely on minification to justify shipping unnecessary runtime code. The
best byte is the byte that is never sent.

## Critical Resource Strategy

Optimize the first viewport before optimizing decorative details.

For each important page type, identify the likely Largest Contentful Paint
element and protect it:

- Do not lazy-load the LCP image or main text block.
- Avoid hiding the LCP element behind client-side rendering.
- Avoid layout shifts above the fold.
- Keep above-the-fold fonts and CSS minimal.
- Preload only resources that are truly critical for initial rendering.
- Do not preload resources that are not needed immediately.
- Use `fetchpriority="high"` only for a proven critical image.
- Use `preconnect` only for unavoidable external origins.

Prefer simple document navigation over client-side routing unless client-side
navigation has a clear product reason. For this editorial site, fast static
pages are more important than app-like route transitions.

## Images And Media

Images are a major Lighthouse risk. Treat image handling as architecture, not
decoration.

Use Astro image tooling where possible:

- Use `<Image />` or `<Picture />` for layout images and component-controlled
  images.
- Prefer images stored in `site/assets/` where Astro can optimize them.
- Use `site/assets/articles/<article-slug>/` by convention for article-owned
  images, `site/assets/shared/` for images shared across articles, and
  `site/assets/site/` for site UI images.
- Use relative paths for source image references in Markdown, MDX,
  frontmatter, and components.
- Avoid adding new optimizable assets directly to `site/public/` unless they
  must be copied unchanged.
- Provide useful `alt` text, or `alt=""` only for decorative images.
- Provide stable width and height or an explicit aspect ratio.
- Avoid cumulative layout shift.
- Right-size images for their rendered container.
- Generate responsive `srcset` and `sizes` values for images that vary by
  viewport.
- Lazy-load below-the-fold images.
- Do not lazy-load a likely LCP image.
- Compress oversized source images before committing when practical.
- Prefer modern formats such as AVIF or WebP where Astro can generate them.
- Avoid serving a full-resolution upload when the rendered slot is much smaller.
- Avoid background images for meaningful content images, because they are harder
  to optimize, size, and describe accessibly.
- Keep animated media rare and intentionally compressed.

Markdown images should continue to work, but the long-term goal should be a
content pipeline that validates image existence, dimensions, and alt text where
reasonable.

For article images, the pipeline should eventually detect:

- Missing files.
- Missing or empty alt text where the image is meaningful.
- Source images that are far larger than their maximum rendered size.
- Images without known dimensions.
- Images likely to become LCP candidates.
- Broken root-relative paths.

For new non-article image components, prefer an explicit image API that requires
alt text, dimensions, loading behavior, and responsive sizes. This makes the
fast path the default path instead of relying on manual review to catch
oversized or unstable media.

## Fonts

Fonts should not damage performance or layout stability.

Prefer:

- Local or Astro-managed fonts.
- A small number of font families and weights.
- `font-display` behavior that avoids invisible text.
- Optimized fallbacks where available.
- Selective preloading only for truly critical font files.

Avoid:

- Loading many weights.
- Loading multiple decorative families.
- Remote font dependencies that block rendering.
- Preloading fonts that are not needed above the fold.

## Accessibility

Accessibility is a release requirement.

Every page should have:

- One clear `h1`.
- Semantic landmarks: `header`, `nav`, `main`, `article`, `aside`, `footer`
  where appropriate.
- Correct heading order.
- Descriptive link text.
- Keyboard-accessible controls.
- Visible focus states.
- Adequate color contrast in light and dark mode.
- Accessible labels for icon-only buttons.
- Valid `aria-expanded`, `aria-controls`, and related attributes for disclosure
  UI.
- Reduced-motion support for motion-heavy interactions.

Do not use divs and click handlers where a semantic element exists. A component
abstraction should produce good HTML, not hide poor semantics.

## SEO And Metadata

Every public page should have:

- Unique `<title>`.
- Useful meta description.
- Canonical URL.
- Appropriate Open Graph metadata when available.
- Semantic document structure.

Article pages should include:

- Article title.
- Publish date in a machine-readable `<time>`.
- Author when available.
- Category metadata when available.
- Description or excerpt.

RSS, sitemap, search indexing, category pages, and article archives should all come
from the same published article source. Drafts must not appear in production
pages, RSS, sitemap, or search indexes.

## Lighthouse Strategy

The target is 100 across Lighthouse categories:

- Performance.
- Accessibility.
- Best Practices.
- SEO.

Perfect scores may not always be stable in CI, especially for performance, but
the implementation should be designed as if 100 is the standard.

Hard expectations:

- Accessibility should be treated as a hard quality gate.
- SEO should be treated as a hard quality gate.
- Best Practices should be treated as a hard quality gate.
- Performance should be protected through budgets and high thresholds.

Use Lighthouse CI against representative pages, not just the homepage:

- `/`
- `/articles/`
- A long article.
- An article with images.
- A category page.
- `/about/`

Track category scores and concrete budgets:

- JavaScript transfer size.
- CSS transfer size.
- Image transfer size.
- Total request count.
- Largest Contentful Paint.
- Cumulative Layout Shift.
- Total Blocking Time.

Do not chase a Lighthouse score by making the site less maintainable or less
accessible. The score is a measurement of the quality bar, not the only quality
bar.

## Release Gates

Use automated checks before release.

Concrete script usage lives in `COMMANDS.md`. This section defines the
quality bar those scripts should enforce.

Required checks should include:

- `astro check`.
- Production build.
- Content verification.
- Lighthouse CI.
- Playwright viewport tests.
- No-horizontal-overflow assertions.
- Mobile navigation tests.
- Theme tests.
- axe accessibility checks.
- Internal link checks.
- Draft exclusion checks.
- RSS and sitemap checks.

Representative viewport tests should include mobile, tablet, laptop, desktop,
and wide desktop sizes. The goal is not to snapshot every pixel. The goal is to
catch structural failures: overflow, overlap, unreadable content, broken menus,
and missing interactive affordances.

## Design System Rules

Use shared tokens for:

- Background.
- Foreground.
- Muted text.
- Primary action.
- Border.
- Ring/focus color.
- Card or surface.
- Sidebar or navigation surface.
- Radius.
- Shadow.
- Font family.

Light and dark mode must both be first-class. Do not style only one mode and
patch the other later.

Use a restrained editorial visual language:

- Clear typography.
- Strong reading rhythm.
- Calm spacing.
- Stable navigation.
- High contrast.
- Few decorative effects.

Do not use gradients unless the project explicitly re-approves them. The current
direction is flat, readable, and editorial.

## Shadcn And UI Primitives

The site may borrow from shadcn's philosophy:

- Tokenized design system.
- Small composable primitives.
- Tailwind-first styling.
- Accessible interaction patterns.
- Reusable blocks built from primitives.

But shadcn components should not dictate the runtime architecture. For this
Astro site:

- Prefer `.astro` primitives for static UI.
- Prerender React/shadcn components when they are static and useful.
- Hydrate shadcn/Radix components only when their interaction quality justifies
  the client-side cost.
- Keep the final visual style aligned with the project's design tokens.

The goal is not to use shadcn everywhere. The goal is to build a small, coherent
component system with similar discipline.

## Current Prototype Policy

The current UI is a prototype, not a constraint.

Preserve:

- Content.
- Broad editorial tone.
- Approximate color direction.
- Category/article structure.
- The idea of a readable essay-first site.

Do not preserve by default:

- Fragile header mechanics.
- Large global stylesheet patterns.
- One-off breakpoint fixes.
- Historical permalink routing logic.
- Layout decisions that fight responsive design.
- Implementation details that make authors care about the codebase.

Prefer professional Astro, Tailwind, accessibility, and performance standards
over matching earlier prototypes.

## Default Decision Rules

When making implementation choices, use these defaults:

- Use Astro components unless a framework component is clearly better.
- Use Tailwind utilities unless styling belongs in foundational tokens.
- Use static rendering unless interaction requires hydration.
- Use build-time content collections unless live data is required.
- Use Markdown for normal articles.
- Use MDX only when article content needs components.
- Use Tailwind Typography for Markdown-rendered prose.
- Use semantic HTML even when wrapped by components.
- Use responsive component contracts instead of page-level patches.
- Use automated verification instead of visual guessing.

The site should feel simple to author, simple to reason about, fast to load, and
hard to break.
