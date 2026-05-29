# Scholar-Compatible Article PDF Export

## Purpose

The site should publish a lightweight downloadable PDF for every PDF-eligible
published article and expose metadata that gives Google Scholar and similar
scholarly indexers the best possible static signal.

The PDF is not a visual clone of the web article. It is a plain academic export
of the same article content: title, authors, date, canonical URL, contents,
body, generated notes, and generated bibliography. It intentionally omits site
navigation, support prompts, related article lists, browser-only controls, and
interactive UI.

## External Contract

The canonical article page remains the public article URL:

```text
/articles/what-is-a-meme/
```

The generated PDF lives in the same article directory:

```text
/articles/what-is-a-meme/what-is-a-meme.pdf
```

The article page links to that PDF with a compact visible `PDF` article-header
action that remains accessible as `Save PDF`. The article page also emits
Highwire-style Google Scholar metadata:

```html
<meta name="citation_title" content="What Is a Meme?" />
<meta name="citation_author" content="Claudia Vulliamy" />
<meta name="citation_publication_date" content="2021/11/30" />
<meta
  name="citation_pdf_url"
  content="https://thephilosophersmeme.com/articles/what-is-a-meme/what-is-a-meme.pdf"
/>
```

Google Scholar's
[webmaster guidelines](https://scholar.google.es/intl/en/scholar/inclusion.html)
are the source of truth for the metadata contract. They explicitly support
Highwire Press tags such as `citation_title`, `citation_author`,
`citation_publication_date`, and `citation_pdf_url`, and say that
`citation_pdf_url` should point to a PDF in the same subdirectory as the
abstract or article HTML page.

The generated PDF should also satisfy Scholar's direct-PDF fallback parsing
conventions in case it is crawled independently: searchable text, the article
title as the largest text on top of page one, authors immediately near the
title, a visible publication date/canonical article line, and a standard
`Bibliography` heading for references. These visual/text conventions matter
more for Scholar than embedded PDF document properties, but the build should
still set document metadata where the toolchain supports it.

## Non-Goals

- Do not convert Markdown or MDX through LaTeX.
- Do not require authors to maintain separate PDF files.
- Do not require Markdown authors to write PDF-specific syntax.
- Do not create a public `/pdf/` directory or duplicate article directory.
- Do not render the web article's support, related content, navigation, or
  browser-only controls into the PDF.
- Do not make the PDF generator infer bibliography from ordinary prose links.
  The existing article-reference model owns structured citation data.

## Data Model

Article frontmatter supports a small escape hatch:

```yaml
pdf: false
```

The field defaults to `true`. Authors should almost never need it, but it gives
the site an explicit way to publish a web-only article when a future article has
interactive, licensed, or media-heavy content that would make an honest PDF
export misleading. `pdf: false` disables the generated PDF, the visible `PDF`
article-header action, and `citation_pdf_url`. It must not disable base
Scholar metadata such as `citation_title`, `citation_author`, or
`citation_publication_date`, because those tags still describe the canonical
HTML article.

The article PDF helpers expose two related models in `src/lib/article-pdf.ts`:

- a Scholar metadata model that always exists for published article pages;
- a PDF view model that exists only when the article is PDF-eligible.

```ts
interface ArticleScholarMetaViewModel {
  authors: readonly string[];
  pdf?: ArticlePdfViewModel;
  publicationDate: Date;
  publicationDateForScholar: string;
  title: string;
}

interface ArticlePdfViewModel {
  articleUrl: string;
  authors: readonly string[];
  citationPdfUrl: string;
  pdfHref: string;
  pdfOutputPath: string;
  publicationDate: Date;
  publicationDateForScholar: string;
  title: string;
}
```

The model should derive from existing article view, author, and route helpers.
It must not parse rendered HTML and must not read article Markdown source.

## Article Page Integration

`ArticleLayout` already owns the article header and generated article-system
sections. It should derive display-ready Scholar/PDF metadata and pass it to:

- `SiteHead` or an article-specific head component for Scholar meta tags;
- `ArticleHeader` for the `PDF` action.

The visible `PDF` action should be visually secondary, colocated with visible
`Cite`, and rendered as a normal anchor with the accessible name `Save PDF`:

```text
[Save icon] PDF
```

The link points to the static PDF path. It must be a real link so it still works
with no JavaScript. When `pdf: false`, the header should omit the `PDF` action
and the page head should omit `citation_pdf_url`, but the page should keep
`citation_title`, `citation_author`, and `citation_publication_date`.

## PDF Rendering Policy

Generate the PDF from the built article page using print media, not from a
second content parser. The existing Astro Markdown/MDX render pipeline remains
the source of truth for article content. Print CSS then strips or transforms
browser-only layers.

Include:

- article title;
- author names;
- publication date;
- canonical article URL;
- short static-export disclaimer;
- optional article description as a short abstract-like paragraph;
- inline `Contents` section when the article has useful headings;
- rendered article prose;
- Markdown images with captions;
- static links;
- generated `Notes` section when notes exist;
- generated `Bibliography` section when citations exist.

Exclude:

- site header, footer, skip link, mobile menu, search, and theme UI;
- `Cite` popover and all copy/export UI;
- `PDF` itself;
- author bio cards;
- Patreon/Discord/support blocks;
- related/more-in-category article lists;
- article tags;
- hover image preview panels, anchored panels, image inspector buttons, and
  any script-dependent UI;
- decorative shadows, borders, button treatments, and site background color.

The static-export disclaimer should be visible only in print/PDF output. It
should be concise and factual, for example: this PDF is a static export of the
canonical web article, and interactive media or embeds may be represented as
links or omitted from the PDF. The disclaimer exists to make the PDF honest
without interrupting the web reading experience.

The PDF should use:

- US Letter by default;
- white background and black text;
- single-column academic layout;
- serif body typography;
- 11-12pt body text;
- conservative margins;
- page-break avoidance around headings, figures, notes, and bibliography
  entries where practical.

## MDX And Embed Compatibility

Markdown articles should work without author action. MDX articles need a small
explicit compatibility inventory because only a few author-facing article
components are used in content.

Current article-content MDX inventory:

| Component or pattern       | Current usage                          | PDF behavior                                                     |
| -------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| `HoverImageLink`           | inline MDX prose image preview links   | keep the inline anchor text and image `href`; hide preview panel |
| `HoverImageParagraph`      | paragraph wrapper for hover image link | keep paragraph text and inline anchor; hide preview panel        |
| raw YouTube/iframe embeds  | a few Markdown/MDX articles            | replace or accompany the iframe with a plain fallback link block |
| ordinary Markdown links    | Markdown and MDX prose                 | render normally                                                  |
| standalone Markdown images | Markdown and MDX prose                 | render as constrained figures                                    |

Future author-facing MDX article components must have a PDF compatibility
decision before publication. Add a registry-like test fixture in
`src/lib/article-pdf-compatibility.ts`, consumed by the Rust-backed
`just content-check` source verifier, with a discriminated policy:

```ts
type ArticlePdfCompatibility =
  | { kind: "print-as-is" }
  | { kind: "static-link" }
  | { kind: "fallback-block" }
  | { kind: "exclude"; reason: string };
```

The scanner should fail when a published MDX article imports a component that
is not listed in the compatibility policy. This makes unsupported future MDX
components difficult to add accidentally while keeping author burden low.

## Iframe Fallbacks

Raw iframes are not PDF-native content. A printed iframe can become an empty
box or a useless video frame. Article embed handling should normalize iframes
into predictable HTML with:

- the original responsive iframe for web rendering;
- a static fallback link visible in print/PDF;
- meaningful link text from `title` when available, otherwise the iframe `src`.

This can be implemented as a small rehype transform over rendered article HTML
or as a later migration to `ResponsiveIframe`. The author-facing requirement is
the same either way: authors should not have to manually write a separate PDF
fallback for normal embeds.

The first implementation uses the existing article rehype transform so ordinary
raw iframes gain `data-article-embed-fallback` automatically.

## PDF Generation

The retained PDF generator is invoked through the repository command router:

```text
just build-pdf --quiet
```

The script should:

1. read published article slugs from `site/content/articles`;
2. start a local static server for the already-generated `dist/`;
3. open each article page with Playwright Chromium;
4. emulate print media;
5. force printable article images to load and decode;
6. write `dist/articles/<slug>/<slug>.pdf`;
7. set or post-process PDF document metadata when Playwright/Chromium cannot
   set every useful field directly;
8. keep output deterministic and quiet unless there is a failure;
9. fail if a generated PDF is missing, empty, not a PDF, or above the selected
   size budget.

The production build path is:

```text
build-raw -> build-pdf -> build-optimize
```

`build-pdf` should operate only on generated `dist/` output. It should not
modify source content.

The generator must not rely on lazy-loading side effects. Before printing, it
should find printable article images, set their `loading` behavior to eager
where possible, scroll each one into view, wait for it to decode, and verify
that it has a non-zero natural size. If a printable article image cannot load,
generation should fail for that article instead of silently dropping the image
from the PDF. This specifically protects long articles where images below the
first viewport would otherwise remain unloaded when Chromium prints.

External standalone images are allowed on the web page, but they are not
reliable PDF inputs because the PDF build must be deterministic without remote
network access. The article image wrapper should hide external image frames
from print output and expose a concise source-link fallback instead. Local
article images should remain the default for authoring and must go through
Astro's asset pipeline.

## File Size And Performance

The hard compatibility budget is the Google Scholar PDF limit: every generated
article PDF must stay below 5 MB. The script should also report or test a
stricter review threshold, such as 3 MB, so large image-heavy articles are
visible before they approach the hard limit.

Use these defaults unless experiments show a better tradeoff:

- `printBackground: false`;
- `preferCSSPageSize: true`;
- no header/footer templates;
- constrained print image sizes;
- render from the built Astro output so article images use Astro's optimized
  `/_astro/` assets and responsive `srcset`;
- include a 384px Astro image breakpoint and force printable Astro images to a
  compact print candidate at or above 384px before printing, so PDFs use the
  same optimized asset family without embedding unnecessarily large responsive
  candidates;
- lazy/interactive scripts irrelevant to the PDF output.

The generator should report the number of article images it loaded and how many
of those resolved to Astro-optimized build assets. A printable article image
that resolves to a non-`/_astro/` source should be treated as a regression
unless it is explicitly documented as an allowed external/static source. This
keeps PDF size optimization connected to the same image pipeline used by the web
article instead of adding a second image processing path.

Keep PDF document metadata synchronized with article metadata:

- Title: article title.
- Author: comma-separated article author names.
- Subject: article description.
- Keywords: article tags plus category when available.
- Creator: `The Philosopher's Meme Astro PDF pipeline`.
- Producer: the PDF generation/post-processing toolchain.
- Creation date and modification date: the article publication date unless a
  future revision-date model is introduced.

Modern PDF workflows prefer XMP metadata, while older PDF document-information
fields are still widely read by viewers and document managers. The first
implementation should at least set document-information fields after generation
if Chromium cannot do so directly. XMP support should be added only if the
chosen PDF post-processor can keep it synchronized without making PDF
generation brittle.

Do not generate compressed `.gz` or `.br` PDF variants. Static hosts and
browsers handle PDF transfer separately, and generated PDFs must remain normal
files.

## Build Verification

`just verify` should enforce:

- every PDF-eligible published article has `articles/<slug>/<slug>.pdf`;
- every generated PDF has useful title/author document metadata;
- every PDF-eligible article HTML page has exactly one matching
  `citation_pdf_url`;
- every PDF-eligible article HTML page links to its own PDF;
- every PDF-disabled article HTML page omits the PDF action and
  `citation_pdf_url`, and does not leave a stale generated PDF in `dist`;
- `citation_title`, `citation_author`, and `citation_publication_date` are
  present on article pages;
- generated PDF links are not reported as broken internal links;
- generated PDFs are below the hard size limit.

The verifier should derive expected PDFs from source content, not from a
hard-coded article count.

## Testing Requirements

Unit and script tests:

- article PDF URL/path/date helper formatting;
- one author, multiple authors, organization authors, and legacy fallback
  author behavior;
- default `pdf: true` article schema behavior and explicit `pdf: false`
  disabled behavior;
- PDF generator CLI usage, successful output, missing `dist`, missing article
  HTML, oversized PDF, missing PDF metadata, and bad PDF header failures;
- PDF generator image-loading behavior, including lazy images below the first
  viewport and unloaded-image failures;
- PDF generator image-efficiency reporting for Astro-optimized article image
  sources;
- MDX compatibility scanner accepts current article MDX imports and rejects an
  unknown component;
- build verifier reports missing PDF, missing Scholar tags, mismatched
  `citation_pdf_url`, stale disabled PDF surfaces, and oversized PDFs.

Component/page tests:

- article page renders visible `PDF` with accessible name `Save PDF`;
- article page emits Scholar tags with absolute `citation_pdf_url`;
- PDF-disabled article page keeps base Scholar tags but omits `citation_pdf_url`
  and the `PDF` action;
- article page hides `PDF` from print media;
- article header remains valid with long titles and multiple actions.

Browser tests:

- representative article PDF links are reachable and return `application/pdf`
  or a valid PDF response body from preview;
- print media hides site chrome, support blocks, related lists, citation UI,
  hover panels, and image-inspector affordances;
- print media includes the static-export disclaimer;
- inline TOC appears in the print/PDF flow when useful;
- generated Notes and Bibliography appear when the source article has them;
- a hover-image MDX article keeps inline link text without visible preview
  panels under print media;
- an embed-heavy article exposes a fallback link in print media.

Release checks:

- `just check`;
- `just build`;
- `just verify`;
- `just validate-html`;
- focused Playwright PDF/export invariants;
- `just release-check` before release handoff.

## Critical Review

The tempting alternative is a separate Markdown or MDX to LaTeX pipeline. That
would add a second renderer for the same content and would immediately diverge
from Astro's handling of MDX, images, article references, and future content
components. It is not the right first implementation.

Generating PDFs from the existing rendered article page is simpler and more
maintainable, but only if PDF behavior is encoded as a real rendering contract
rather than incidental browser print output. That is why this design requires
explicit print CSS, an MDX compatibility registry, build verification, and PDF
size checks.

The highest-risk areas are image-heavy articles, lazy images below the first
viewport, and raw iframes. These risks are bounded by explicit contracts:
image-heavy PDFs are caught by the hard size gate and image-efficiency report,
lazy images are forced to load and decode before printing, and iframe behavior
is handled by a print fallback transform before release.

The `pdf: false` escape hatch should remain rare. It exists to keep the
publishing system honest when a future article cannot be represented well as a
static PDF, not as a way to avoid fixing normal Markdown, image, note, or
bibliography rendering issues.
