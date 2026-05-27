# Astro Guidance

Standalone agent playbook for building Astro projects correctly. Use the Astro
Docs MCP tool for exact version details, rare APIs, or adapter behavior. Search
precisely, for example:

- `Image layout responsiveStyles Tailwind`
- `content collections slug generateId`
- `render MDX components prop`
- `Actions form prerender false`
- `ClientRouter scripts lifecycle`
- `Astro env schema validateSecrets`

## Core Model

Astro is content-first and static-first. Default to build-time HTML and zero
client JavaScript. Choose the least dynamic primitive:

1. Static `.astro` component.
2. Build-time content collection.
3. Small processed `<script>` or custom element.
4. Hydrated framework island.
5. On-demand server route.
6. Client-only component only when SSR is impossible.

Astro frontmatter runs on the server at render time. Template expressions are
not reactive after HTML is sent. `window`, `document`, and `localStorage` belong
in browser scripts or hydrated islands.

Do not treat Astro like React, Next, or a Vite SPA. Pages are documents,
components are templates, and hydration is opt-in.

Responsive design should be content-out and component-first. Build small layout
systems that preserve meaning, hierarchy, usability, and media clarity as
available space changes. Mobile-first is the CSS default, but inspect narrow,
medium, wide, short, dense, and awkward states early.

## Commands And Structure

Astro requires Node.js `22.12.0` or newer. With Bun:

- `bun install`
- `just <recipe>` for repository workflows
- `bunx astro add <integration>`
- `bun create astro`

Astro commands:

- `astro dev`: dev server with HMR.
- `astro build`: production build into `dist/`.
- `astro preview`: preview built output.
- `astro check`: Astro and TypeScript diagnostics.
- `astro sync`: generate virtual module types for content, env, actions, etc.

`dev`, `build`, and `check` run sync automatically, but run `astro sync` after
schema/env changes when editor types are stale.

Conventional structure:

```text
site/content/          active site-instance content collections
site/assets/           active site-instance processed source assets
site/public/           active site-instance files copied as-is to site root
site/config/           active site-instance configuration
src/pages/              file routes and endpoints
src/components/         UI, blocks, primitives, islands
src/layouts/            document and content shells
src/styles/             global CSS entry and tokens
src/actions/            Astro Actions
src/middleware.ts       request middleware
src/env.d.ts            global app types
src/content.config.ts   site-instance-backed content collection config
astro.config.ts         framework config
dist/                   generated output
```

Only `src/pages/` is required and reserved by Astro. This project keeps
publication-owned content and assets in the active site instance, defaulting to
`site/`. Use `site/assets/` for project-owned assets that should be optimized,
fingerprinted, or type checked. Use `site/public/` only for files that must be
copied untouched, such as `favicon.svg`, `robots.txt`, `CNAME`, verification
files, and downloads.

Do not put article/UI images, app CSS, or app JS in `site/public/` unless a
stable unprocessed URL is required.

## Astro Components

An `.astro` file has optional server frontmatter and a template:

```astro
---
import Child from "./Child.astro";

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<section>
  <h2>{title}</h2>
  <Child />
</section>
```

Frontmatter can import modules, use TypeScript, use top-level `await`, fetch
private data, and read `Astro.props`, `Astro.params`, `Astro.url`, etc. It
cannot hold browser state or attach event handlers to HTML.

Template rules:

- Use HTML attributes: `class`, `for`, `tabindex`, `data-value`.
- Do not use React attributes like `className`.
- Use `{value}` for expressions.
- Multiple root elements are allowed.
- HTML comments render; JS comments do not.
- Dynamic tag variables must be capitalized.
- Hydration directives do not work on dynamic tags.
- Directives must be compiler-visible; they cannot be hidden in spread objects.

Use `class:list` for class composition. Use `set:html` only for trusted or
sanitized HTML; prefer normal expressions or `set:text` for text. Use
`Fragment` when a directive needs no wrapper.

Astro does not auto-forward attributes. For wrapper components, type native
attributes, remove implementation props, and spread only onto the intended
element:

```astro
---
import type { HTMLAttributes } from "astro/types";

interface Props extends HTMLAttributes<"a"> {
  variant?: "plain" | "button";
}

const { variant = "plain", class: className, ...attrs } = Astro.props;
---

<a
  {...attrs}
  class:list={[
    "inline-flex items-center",
    variant === "button" && "rounded-md px-3 py-2",
    className,
  ]}
>
  <slot />
</a>
```

Slots: use `<slot />`, named slots for layout regions, and
`Astro.slots.has("name")` when wrapper markup should render only if content
exists. Use `Astro.slots.render()` rarely; it returns HTML strings and often
leads to unnecessary `set:html`.

## Component System

Pages should orchestrate, not implement. Route files load data, choose params,
normalize props, and compose layouts/blocks:

```text
Page route
  Layout
    Blocks
      Components
        UI primitives
```

Use Astro components for static primitives and blocks: `Button`, `Card`,
`Badge`, `Container`, `Section`, `ArticleProse`, `ArticleImage`,
`ArticleCard`, `SiteHeader`, etc. Static primitives do not need React.

Suggested responsibilities:

- `BaseLayout`: `<html>`, `<head>`, global CSS, skip link, body shell, slots.
- `SEO`/`Head`: title, description, canonical, OG/Twitter, RSS, JSON-LD.
- `ArticleLayout`: title, description, dates, author, tags, hero, prose slot.
- `ArticleProse`: Tailwind Typography, measure, headings, links, code, images.
- `ArticleImage`: `Image`/`Picture` defaults, required alt, caption slot.
- `Container`/`Section`: max width, gutters, vertical rhythm, background bands.
- `SiteHeader`/`SiteNav`: static header and links.
- `MobileNav`, `ThemeToggle`, `SearchBox`: smallest interactive boundaries.

Do not hydrate the whole header to open a menu. Hydrate the smallest boundary,
or use a processed script/custom element when simpler.

Component API rules:

- Prefer one primary reusable component per file.
- Use PascalCase filenames/references for reusable components.
- Use explicit prop interfaces.
- Use semantic props: `variant`, `size`, `tone`, `pressed`, `href`.
- Do not repurpose native names like `class`, `style`, `href`, `disabled`.
- Default optional props during destructuring or normalization.
- Prefer named variants over boolean clusters.
- Spread rest attributes sparingly and only after filtering.
- Use stable keys for repeated React items; avoid indexes when order can change.

State rules:

- Model mutually exclusive states as a discriminated state, not many booleans.
- Keep content/server data, URL state, form draft state, and local interaction
  state separate unless combining them is deliberate.
- Derive cheap display values during render instead of duplicating state.
- Normalize content metadata in `src/lib` or loaders, not UI.
- Design loading, empty, error, disabled, selected, expanded, and long-content
  states before calling a component complete.

Responsive contract for every reusable component:

- What is the smallest useful version?
- What happens when it gets much wider than expected?
- Does it depend on viewport width or container width?
- Does hierarchy change when columns collapse?
- Does interaction change with space or input method?
- Is extra density only an enhancement?
- Can text wrap without overlap or horizontal overflow?
- Does media preserve meaning at each size?

Use React, shadcn, and Radix only when interaction complexity justifies it
(dialogs, popovers, hover cards, menus, selects, tabs, command palettes).
Static buttons, cards, prose, layouts, and shells should remain Astro/Tailwind.
Keep Radix state boundaries explicit and hydrate only the interactive island.

## Routing And URLs

Routes come from `src/pages/`:

```text
src/pages/index.astro       -> /
src/pages/about.astro       -> /about
src/pages/about/index.astro -> /about
src/pages/articles/[id].astro
src/pages/articles/[...id].astro
src/pages/rss.xml.ts        -> /rss.xml
src/pages/404.astro         -> custom 404
src/pages/500.astro         -> custom 500
```

Use normal `<a href="/path/">`; Astro has no required `<Link>`.

Markdown/MDX files in `src/pages/` become pages automatically. For many related
entries, use content collections plus one dynamic route. Dynamic routes:

- `[slug].astro`: one segment.
- `[...slug].astro`: any depth; can match root when param is `undefined`.
- Static builds require `getStaticPaths()` for every dynamic route.
- Server routes do not use `getStaticPaths()` unless explicitly prerendered.

Minimal static dynamic route:

```astro
---
import { getCollection, render } from "astro:content";

export async function getStaticPaths() {
  const posts = await getCollection("articles", ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { id: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<h1>{post.data.title}</h1>
<Content />
```

Use `[...id].astro` when content IDs can contain `/`. Prefix route files or
directories with `_` to exclude them. Use `paginate()` in `getStaticPaths` for
archives; it provides a `page` prop with data, URLs, and pagination metadata.

Route priority: reserved routes, more segments, static routes, named dynamic,
rest routes, prerendered dynamic over server dynamic, endpoints over pages, file
routes over configured redirects.

Set `site` in `astro.config.ts` for canonical URLs, sitemap, RSS, and
`Astro.site`. Know these options:

- `trailingSlash: "always" | "never" | "ignore"`
- `build.format: "directory" | "file" | "preserve"`
- `base` for subpath deploys

`build.format: "directory"` writes `/about/index.html`; pair with
`trailingSlash: "always"` for slash consistency. `build.format: "file"` writes
`/about.html`; pair with `trailingSlash: "never"` if needed.

Configured redirects can map static/dynamic paths, but static builds without a
host adapter may output meta-refresh pages instead of real HTTP 301/302. Use
`Astro.redirect()` for runtime redirects and `Astro.rewrite()` to render another
route without changing the browser URL.

## `Astro` Context

Common properties:

- `Astro.props`: component/page props.
- `Astro.params`: dynamic route params.
- `Astro.url`: current URL.
- `Astro.site`: configured site URL.
- `Astro.generator`: generator string.
- `Astro.request`: `Request` object.
- `Astro.response`: response status/headers.
- `Astro.locals`: per-request middleware data.
- `Astro.cookies`: cookie helper in SSR.
- `Astro.clientAddress`: adapter-dependent client IP.
- `Astro.preferredLocale` / `Astro.currentLocale`: i18n.
- `Astro.isPrerendered`: route prerender state.
- `Astro.redirect()`, `Astro.rewrite()`, `Astro.callAction()`.

In static prerendering, request data is limited. Response headers/status are
only meaningful for pages/endpoints that can send them. With streaming SSR, set
headers before child rendering can flush.

## Content Collections

Define collections in `src/content.config.ts`. In this repo, collection loaders
should resolve through the active site instance instead of hard-coding
`src/content`:

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

import { projectRelativePath, siteInstance } from "./lib/site-instance";

const articles = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: projectRelativePath(siteInstance.content.articles),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      draft: z.boolean().default(false),
      image: image().optional(),
    }),
});

export const collections = { articles };
```

Use `glob()` for local files and `file()` for JSON/YAML/CSV data. Schema types
come from Zod. Use `image()` for local image metadata and `reference()` for
content references.

Read entries with `getCollection()`, `getEntry()`, and `render()`:

```ts
const posts = await getCollection("articles", ({ data }) => !data.draft);
posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
```

Always sort collections explicitly. Always use the same published-content
helper/filter for pages, RSS, sitemap, search, related posts, and archives.

`render(entry)` returns a `Content` component and metadata such as headings.
Render bodies in `.astro` pages/layouts:

```astro
---
const { Content } = await render(post);
---

<ArticleProse>
  <Content />
</ArticleProse>
```

Entry IDs come from file paths unless customized. Avoid frontmatter `slug`
unless you intentionally want to change the generated entry ID. Use filename
slugs when stable URLs matter.

Content schema rules:

- Keep author-facing frontmatter small and meaningful.
- Use `draft`/`published` filtering so unpublished content never leaks.
- Frontmatter is data, not executable logic.
- Validate dates, images, tags/categories, authors, and historical metadata at the
  collection boundary.
- Do not rely on Markdown `layout` frontmatter for collection entries.

## Markdown And MDX

Use Markdown for normal articles. Use MDX only when an article needs custom
components or interactivity. MDX can import Astro/framework components, but
hydrated MDX components still follow island rules.

Direct Markdown pages can use `layout` frontmatter. Collection entries should be
rendered by route/layout code with `render(entry)`.

Markdown/MDX plugins belong in Astro config. Keep them minimal and documented.
For generated Markdown elements, use `ArticleProse` plus Tailwind Typography.
For special MDX elements, map to components rather than writing fragile global
selectors.

MDX rendered into RSS can contain components that do not translate cleanly.
Sanitize full-content RSS and fix relative URLs.

## Images And Assets

Use `site/assets/` for project-owned images. Public files are not optimized,
hashed, bundled, or checked. Good convention:

- `site/assets/articles/<article-slug>/`
- `site/assets/shared/`
- `site/assets/site/`

In `.astro`, import local images or use collection `image()`. In Markdown/MDX,
use relative paths. Remote images need configured `image.domains` or
`image.remotePatterns`. Remote images are not discovered at build time unless
used through Astro image tooling.

Use `Image` for optimized images:

```astro
---
import { Image } from "astro:assets";
import hero from "../assets/hero.jpg";
---

<Image src={hero} alt="Description" layout="full-width" />
```

Local images infer dimensions. Remote images usually need explicit dimensions.
Meaningful images need useful `alt`; decorative images use `alt=""`.

`layout` values:

- `constrained`: responsive up to intrinsic/container limit.
- `full-width`: fills container width; good for heroes.
- `fixed`: fixed dimensions.
- `none`: no responsive layout behavior.

When `layout` is set, Astro can generate `srcset` and `sizes`, plus responsive
attributes/styles. Usually do not write manual `widths`/`sizes` unless
overriding intentionally.

Tailwind interaction: Astro responsive image styles can outrank Tailwind
utilities. In Tailwind-heavy projects, either leave `image.responsiveStyles`
disabled and use classes such as `w-full h-auto max-w-full`, or enable Astro
responsive styles and avoid fighting them.

Use `priority` only on the likely LCP image:

```astro
<Image src={hero} alt="..." layout="full-width" priority />
```

It sets eager loading, synchronous decoding, and high fetch priority. Do not
apply it broadly.

Use `Picture` for modern formats or art direction:

```astro
<Picture src={cover} formats={["avif", "webp"]} alt="..." />
```

Use `pictureAttributes` for the outer `<picture>`.

Use `getImage()` in server/frontmatter code when a generated image URL is needed
for custom components, CSS background URLs, endpoints, OG helpers, or metadata.
Never call it in browser code.

Local SVGs can be imported as Astro components in `.astro` files. Framework
component files cannot import `.astro` components; pass SVG/Astro output as
children from an Astro parent when needed.

## Fonts And Imports

Astro Fonts can download, cache, and serve fonts locally. Configure fonts in
`astro.config.ts`, render `<Font />` in `<head>`, and expose variables to
Tailwind through `@theme inline`. Preload fonts sparingly.

Astro uses ESM imports. Supported defaults include `.astro`, `.md`,
`.markdown`, `.mdx` with the integration, `.js`, `.mjs`, `.ts`, `.json`, CSS,
CSS modules, images, assets, and npm packages.

Do not import browser-only packages in frontmatter unless they run on the
server. Import browser-only code inside scripts or framework islands.

For TypeScript imports, omit `.ts`/`.tsx` or use emitted `.js`/`.jsx` according
to TS module resolution. Aliases are fine when configured in `tsconfig.json`,
but avoid casual aliases in projects that prefer relative asset paths.

`import.meta.glob()` only accepts static string literals. If dynamic paths seem
necessary, import a broader static glob and filter. Prefer content collections
over glob imports for content.

Avoid `?raw` and `?url` unless intentionally using unprocessed text or a URL
handle.

## Styling And Tailwind

Astro supports scoped component `<style>`, global CSS imports, CSS modules,
PostCSS, preprocessors, Tailwind, and framework CSS. Default `<style>` is scoped
to the component and does not style child components.

Use Tailwind for component styling. Keep global CSS limited to Tailwind imports,
design tokens, CSS variables, base document styles, fonts, and Markdown prose
customization.

Tailwind is the default value system. Prefer shared spacing, sizing,
typography, color, radius, shadow, breakpoint, and container tokens before
custom CSS or arbitrary values.

Reach first for modern CSS via Tailwind:

- normal document flow;
- flex and grid;
- intrinsic sizing;
- `minmax()`, `auto-fit`, `auto-fill`;
- `aspect-ratio`;
- `object-fit` and `object-position`;
- container queries;
- `min-w-0` and `min-h-0` for shrinkable flex/grid children;
- `w-full`, `max-w-*`, `flex-1`, and content-aware grid tracks.

Be skeptical of raw pixels, `max-w-[873px]`, one-off media queries, absolute
positioning for normal flow, `!important`, distant page selectors, and large CSS
that duplicates Tailwind. Arbitrary values are allowed for real invariants
(icons, tap targets, borders, media dimensions, aspect ratios, design tokens).
If repeated, promote them into a token, variant, or component rule.

Think in logical layout terms: inline axis is text flow; block axis is stacking.
Normal Tailwind physical utilities are fine when clearer, but reusable
components should prefer flow-aware thinking: start/end over left/right where it
matters, available inline space over fixed page width, and container width over
viewport width when portable.

Responsive rules:

- Unprefixed utilities are the mobile/default state.
- `sm:`, `md:`, `lg:`, `xl:`, `2xl:` apply at that breakpoint and wider.
- `sm:` does not mean "mobile".
- Use `max-*` below a breakpoint.
- Use range variants like `md:max-xl:` sparingly.
- Custom breakpoints should be rare tokens with consistent units.
- Avoid arbitrary pixel breakpoints unless measured and unavoidable.

Use viewport breakpoints for page-level changes: page columns, sidebars,
mastheads, homepage grids. Use container queries for portable components:
cards, media objects, nav groups, callouts, metadata blocks. Tailwind container
queries use `@container` on the parent and variants like `@md:` on descendants.

Breakpoints defend content integrity: width, hierarchy, interaction, density,
and media meaning. They should not encode a device catalog.

CSS order: linked styles, imported stylesheets, scoped component styles.
Imported CSS can leak globally. Import global CSS from the root layout before
other imports when it should have low precedence.

Use Tailwind Typography for rendered Markdown:

```astro
<article class="prose prose-neutral dark:prose-invert">
  <Content />
</article>
```

## Scripts And Islands

Processed Astro scripts are `<script>` tags with no attributes except optional
`src`. They support TypeScript/imports, become `type="module"`, are bundled,
deduped, and may be inlined when small.

Unprocessed scripts have extra attributes or `is:inline`. They are not bundled,
deduped, or TypeScript-transformed. Use `is:inline` sparingly, mainly for tiny
boot scripts such as initial theme setup.

Astro HTML does not support `onClick={handler}`. Use scripts/custom elements:

```astro
<theme-toggle>
  <button type="button" aria-label="Toggle theme">Theme</button>
</theme-toggle>

<script>
  class ThemeToggle extends HTMLElement {
    connectedCallback() {
      this.querySelector("button")?.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark");
      });
    }
  }

  customElements.define("theme-toggle", ThemeToggle);
</script>
```

Pass server values to scripts with `data-*` or JSON script data. Avoid
`define:vars` on scripts unless inline duplication is intended.

Framework components render static HTML by default and ship JS only with a
`client:*` directive:

- `client:load`: immediate critical interaction only.
- `client:idle`: non-critical UI.
- `client:visible`: below-the-fold/heavy UI.
- `client:media="(query)"`: hydrate only when query matches.
- `client:only="react"`: skip SSR; use only when SSR is impossible.

Astro components cannot be hydrated. Framework component files cannot import
`.astro` components. Hydrated props must be serializable; functions cannot cross
from Astro server code to client framework props.

Use islands for header/menu toggles, theme persistence, search, article-specific
widgets, and accessible Radix/shadcn components. Do not hydrate page shells,
article prose, static cards, or basic navigation.

React island rules: prefer functions, TypeScript props, local/minimal state,
composition/hooks over HOCs, stable keys, valid ARIA, semantic HTML, no
`accessKey`, useful alt text, and filtered prop spreading. Memoize only when
referential stability or measured cost requires it.

## Built-Ins And Client Routing

Important built-ins:

- `Image`, `Picture`, `Font` from `astro:assets`.
- `Code`, `Prism` from `astro:components`.
- `ClientRouter` and transition helpers from `astro:transitions`.
- `Fragment` in Astro templates.

`Code` uses Shiki and does not inherit Markdown `shikiConfig`; use it for code
from `.astro`/MDX components. Markdown fences use Markdown config. `Prism`
requires Prism styling.

Directives: `class:list`, `set:html`, `set:text`, `client:*`,
`server:defer`, `is:global`, `is:inline`, `define:vars`, `is:raw`,
`transition:*`.

Default Astro navigation is multi-page. `<ClientRouter />` opts into enhanced
client-side routing/view transitions. Use it only when product value outweighs
complexity. Once enabled, scripts may need reinitialization after navigation,
persistent elements can keep state, and load-event assumptions can break.

Transition directives:

- `transition:name`
- `transition:animate`
- `transition:persist`
- `transition:persist-props`

Respect `prefers-reduced-motion`.

## Data, SSR, Middleware, Actions

Static frontmatter fetches run at build time. Deployed pages do not refetch
until rebuild.

Choose the data pattern:

- Static/local content: content collections.
- JSON/XML/file output: static endpoint.
- Browser-triggered server function: Astro Action.
- Request-time personalization: on-demand route or endpoint.
- Live remote data: live collection or SSR fetch.
- Repeated browser updates: script or island.

Endpoints are `.ts`/`.js` files in `src/pages`; the extension before `.ts`
becomes output (`rss.xml.ts -> /rss.xml`). Static endpoints export `GET` and
run at build time. Server endpoints can export HTTP methods such as `GET`,
`POST`, `DELETE`, `ALL`. Use `APIRoute`.

Default output is `static`. To render one route on demand, install an adapter
and add `export const prerender = false`. To default to server rendering, set
`output: "server"` and opt static routes back in with `prerender = true`. Server
output still needs an adapter.

On-demand routes can use full request headers/body, cookies, response headers,
runtime redirects, request-time data, sessions, actions, and server islands.
Adapter APIs differ across Cloudflare, Node, Netlify, Vercel, etc.

Middleware lives at `src/middleware.ts` or `src/middleware/index.ts` and exports
`onRequest`. Use `defineMiddleware` to add `locals`, guard auth, rewrite, or
modify responses. Type `App.Locals` in `src/env.d.ts`. `locals` is per request.
Be careful with rewrites and consumed request bodies.

Actions are type-safe server functions in `src/actions/index.ts`, useful for
validated client/server calls. They use `defineAction`, Zod input, and optional
`ActionError`. Client calls return `{ data, error }`; check `error` before
using `data` unless deliberately using `.orThrow()`. HTML form actions require
on-demand rendering.

## Environment

Astro supports Vite env vars through `import.meta.env`:

- Server code can access all env vars.
- Client code can only access `PUBLIC_*`.
- Never put secrets in `PUBLIC_*`.
- `.env` is not loaded automatically in `astro.config.ts`; use `process.env`
  or Vite `loadEnv()` when necessary.
- Defaults include `MODE`, `DEV`, `PROD`, `BASE_URL`, `SITE`.

Prefer Astro's type-safe env schema in config with `envField`. Use
`astro:env/client` for public client variables and `astro:env/server` for
server variables. `validateSecrets: true` validates secret availability.

## RSS, Sitemap, SEO

Set `site` before canonical URLs, RSS, or sitemap. Use `@astrojs/sitemap` for
static sitemap generation when compatible with the adapter. Use `@astrojs/rss`
from a static endpoint, with the same published-content helper used elsewhere.

RSS URL slash behavior can differ; match its `trailingSlash` option to site
policy. If rendering full RSS content, sanitize HTML and absolutize relative
links/images. MDX content may not translate cleanly.

Generate JSON-LD safely:

```astro
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

Do not interpolate raw untrusted strings into JSON-LD manually.

## Configuration

High-impact options:

- `site`, `base`, `trailingSlash`
- `output`, `adapter`
- `integrations`
- `compressHTML` (defaults to `true`)
- `scopedStyleStrategy`
- `prerenderConflictBehavior` (consider `error`)
- `security`
- `vite`

Build: `outDir`, `build.assets` (`_astro` default),
`build.inlineStylesheets`, `build.assetsPrefix`, `build.concurrency`.

Images: `image.service` (Sharp default), `image.domains`,
`image.remotePatterns`, `image.layout`, `image.responsiveStyles`,
`image.objectFit`, `image.objectPosition`, `image.breakpoints`.

Markdown: `markdown.syntaxHighlight` (Shiki default), `shikiConfig`,
`remarkPlugins`, `rehypePlugins`, `gfm`, `smartypants`.

Prefetch: `prefetch: true`, strategies `hover`, `tap`, `viewport`, `load`.
`prefetchAll` is not automatically good; consider bandwidth.

Security: SSR origin checks help protect unsafe methods from CSRF. Configure
trusted forwarded hosts when needed. CSP is powerful but can conflict with
external assets, Shiki, and view transitions; test build and preview.

## Performance And Accessibility

Astro production builds already compress HTML, bundle/optimize CSS, bundle and
dedupe processed scripts, split shared CSS chunks, hash generated assets under
`_astro/`, and optimize `astro:assets` images.

Most wins come from restraint:

- Keep content pages static.
- Avoid JS for static UI.
- Hydrate the smallest island.
- Prefer `client:idle`/`client:visible` over `client:load`.
- Avoid `client:only`.
- Avoid `is:inline` for ordinary scripts/styles.
- Avoid remote scripts unless explicitly needed.
- Use `Image`/`Picture` for source images.
- Use `priority` only for likely LCP.
- Use stable image dimensions/aspect ratios.
- Keep font families/weights small.
- Preload only critical above-the-fold assets.
- Test production output, not dev mode.

Accessibility defaults:

- Use semantic elements.
- Use anchors for navigation and buttons for actions.
- Label forms.
- Preserve keyboard behavior and visible focus.
- Respect reduced motion.
- Use accurate alt text.
- Use ARIA only when semantic HTML is insufficient.
- Keep heading order coherent.
- Ensure hydrated controls are accessible before and after hydration.

## Common Mistakes

- Treating `.astro` as JSX.
- Using `className` instead of `class`.
- Passing `onClick={handler}` to Astro HTML.
- Importing browser-only packages in frontmatter.
- Assuming frontmatter runs in the browser or is reactive.
- Hydrating Astro components.
- Importing `.astro` inside framework component files.
- Passing functions to hydrated framework props.
- Using `site/public/` for optimizable images.
- Missing `alt` on `Image`/`Picture`.
- Adding `priority` to many images.
- Manually writing `widths`/`sizes` when `layout` should do it.
- Expecting `layout` to handle visual sizing without styles/classes.
- Forgetting Astro responsive image styles can conflict with Tailwind.
- Forgetting to sort `getCollection()` results.
- Letting drafts leak into RSS, sitemap, search, related posts, or archives.
- Using frontmatter `slug` without realizing it changes entry IDs.
- Using `[id].astro` when IDs can contain `/`.
- Depending on `.env` inside `astro.config.ts`.
- Exposing secrets with `PUBLIC_`.
- Using `set:html` on unsanitized content.
- Accidentally adding `is:inline` via script/style attributes.
- Expecting static redirects to always be HTTP 301s.
- Setting response headers inside SSR child components.
- Enabling `ClientRouter` without lifecycle awareness.
- Using live collections for content that should be build-time static.

## Agent Workflow

Before coding:

1. Classify the feature: static, build-time, request-time, or browser-time.
2. Choose the least dynamic Astro primitive.
3. Decide whether content belongs in `src/pages`, a collection, or data file.
4. Decide whether assets belong in `site/assets` or `site/public`.
5. Define metadata, draft filtering, and route helpers before rendering.
6. Search Astro Docs MCP for exact APIs when unsure.

While coding:

1. Keep pages thin and route generation centralized.
2. Use typed props, content schemas, and normalized data.
3. Style with Tailwind/component-local ownership.
4. Keep global CSS tiny.
5. Prefer processed scripts.
6. Hydrate only the smallest island.
7. Use `Image`/`Picture` correctly.
8. Preserve accessibility semantics.

Before handoff:

1. Run project checks, or at least `astro check`.
2. Build when routes, content, images, metadata, or config changed.
3. Preview production output for visual/routing changes.
4. Verify drafts/unpublished content do not leak.
5. Check unexpected client JS was not introduced.
6. Verify image output, dimensions, and LCP behavior for changed templates.
7. Verify RSS, sitemap, and search use the same published-content helper.
