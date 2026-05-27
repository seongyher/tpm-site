# minify-html Research

## Purpose

This document records the research needed before adding a post-build
`minify-html` step to the static Astro build. The goal is an objectively smaller
and faster generated site for gzip/Brotli-capable static hosting, without
invalid HTML, broken search, broken structured data, layout regressions, or UX
regressions.

`compressHTML: true` is already enabled in `astro.config.ts`, so this work is
not about basic whitespace removal. It is about measuring whether a parser-based
post-build pass can safely reduce the final `dist/**/*.html` output further,
including inline CSS and JavaScript when that is proven safe.

## Sources

- `minify-html` repository:
  <https://github.com/wilsonzlin/minify-html>
- `minify-html` Rust `Cfg` option reference:
  <https://docs.rs/minify-html/latest/minify_html/struct.Cfg.html>
- `minify-html-onepass` crate page:
  <https://docs.rs/crate/minify-html-onepass/latest>
- Node package page:
  <https://www.npmjs.com/package/@minify-html/node>

## Tooling Summary

`minify-html` is a Rust HTML minifier with bindings for Node, Deno, Java,
Python, Ruby, and WASM. The Node binding is `@minify-html/node`, exposes
TypeScript declarations, and accepts the Rust `Cfg` fields as snake_case
options.

The standard library is the production candidate because it is documented as
handling invalid HTML and templating syntax gracefully, has the Node binding we
can run in Bun tooling, and exposes the full configuration surface.

`minify-html-onepass` is not the default production candidate. It is faster and
uses less memory, but the documented tradeoff is stricter parsing and less
configurability. Its parsing constraints are stricter than the standard library:
opening tags cannot be omitted, invalid closing tags are not allowed, and the
document cannot end unexpectedly. For this repo, post-build minification speed
is not a meaningful user-facing bottleneck; build correctness, validation, and
cross-platform CI are higher priority.

## One-Pass Decision

Do not adopt one-pass by default.

Reasons:

- The current practical Node path is the standard `@minify-html/node` binding.
  The one-pass package is documented primarily as Rust/Python-level tooling with
  a different API surface.
- The one-pass parser rejects more malformed input. That can be useful as a
  validator, but this repo already has `html-validate`, Astro checks, and
  e2e/a11y gates. Minification should not become a second, differently shaped
  parser gate unless it earns that role through experiments.
- Our site has about hundreds, not millions, of static HTML files. A slightly
  slower but more tolerant post-build pass is the right tradeoff if the output
  is smaller and fully verified.

One-pass can still be experimented with if a cross-platform Bun-friendly package
or CLI path is proven. It must beat the standard pass on output size or build
time without losing any validation guarantees. Speed alone is insufficient.

## Option Review

All omitted `Cfg` fields default to `false` in the Node API. Production should
turn on only options that are either semantically conservative or proven safe by
repo-specific experiments.

| Option                                         | What It Does                                                                                                       | Production Position                                 | Blocker If Enabled                                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `allow_noncompliant_unquoted_attribute_values` | Allows shorter unquoted attribute values that the WHATWG spec does not permit, though browsers usually parse them. | Keep off. Measure only in an aggressive experiment. | Any `validate:html` failure is a hard blocker. Standards noncompliance is not acceptable for normal production output.           |
| `allow_optimal_entities`                       | Allows entity minifications that may not pass validation but browser engines usually parse.                        | Keep off. Measure only in an aggressive experiment. | Validation failure, changed visible text, changed copied text, changed JSON-LD, or search excerpt mismatch.                      |
| `allow_removing_spaces_between_attributes`     | Removes spaces between attributes when possible, which may be noncompliant.                                        | Keep off.                                           | Validation failure. This is too risky for minimal likely gzip gain.                                                              |
| `keep_closing_tags`                            | Prevents omission of optional closing tags.                                                                        | Enable by default.                                  | If disabling produces meaningful savings and all checks pass, it may still be rejected for debuggability and parser consistency. |
| `keep_comments`                                | Preserves HTML comments.                                                                                           | Keep off.                                           | Enable only if a required built comment exists. None is expected in production output.                                           |
| `keep_html_and_head_opening_tags`              | Preserves optional `<html>` and `<head>` opening tags when possible.                                               | Enable by default.                                  | If disabling passes validation, it still weakens document-shape clarity for very small savings.                                  |
| `keep_input_type_text_attr`                    | Preserves `type="text"` on text inputs.                                                                            | Start off.                                          | Enable if search/input styling, tests, or accessibility expectations rely on explicit `type="text"`.                             |
| `keep_ssi_comments`                            | Preserves server-side include comments.                                                                            | Keep off.                                           | No SSI is used or expected on Cloudflare Workers Static Assets.                                                                  |
| `minify_css`                                   | Minifies inline `<style>` blocks and `style` attributes with Lightning CSS.                                        | Experiment, likely enable if safe.                  | CSS parse errors, changed theming, changed responsive behavior, or e2e visual/layout failures.                                   |
| `minify_doctype`                               | Shortens doctypes in a way that may be noncompliant.                                                               | Keep off.                                           | Validation failure or standards noncompliance.                                                                                   |
| `minify_js`                                    | Minifies JavaScript in `<script>` tags.                                                                            | Experiment before enabling.                         | Broken theme boot, search, anchored surfaces, prefetch, JSON-LD, non-JS script data, or any e2e/a11y failure.                    |
| `preserve_brace_template_syntax`               | Preserves `{{...}}`, `{%...%}`, and `{#...#}` template blocks.                                                     | Keep off for built output.                          | Built `dist` should not contain template syntax. If it does, that should be detected as a content/build issue.                   |
| `preserve_chevron_percent_template_syntax`     | Preserves `<%...%>` template blocks.                                                                               | Keep off for built output.                          | Same as brace template syntax.                                                                                                   |
| `remove_bangs`                                 | Removes bang declarations.                                                                                         | Keep off.                                           | Unknown effect on document declarations; no need for this in validated static HTML.                                              |
| `remove_processing_instructions`               | Removes processing instructions.                                                                                   | Keep off.                                           | Could remove intentional non-HTML instructions if any ever exist. No meaningful gain expected.                                   |
| `enable_possibly_noncompliant`                 | Rust helper that enables the noncompliant option family.                                                           | Do not use.                                         | It bundles options that conflict with our validation-first production standard.                                                  |

## Repo-Specific Hard Blockers

A minification configuration is not production-eligible if any of the following
occur:

- `just validate-html` fails.
- `just verify` fails.
- Search page behavior or Pagefind result rendering changes.
- JSON-LD script content fails to parse or loses required SEO fields.
- `pre`, `code`, Markdown prose, article references, or bibliography/footnote
  output changes visible text.
- Direct article hash navigation, TOC behavior, anchored surfaces, theme
  persistence, or mobile navigation regress.
- Any e2e, a11y, or release quality gate fails.
- The package cannot install and run reliably on macOS and Linux CI through
  Bun.
- The minified output is smaller raw but not materially smaller after gzip on
  representative pages.

## Experiment Finding

The reproducible suite in `scripts/payload/run-minify-html-experiments.ts` found that
the tested standard-library configurations are not production-eligible for this
repo today.

Observed hard blockers:

- Even the conservative configuration removes explicit `type="button"` from
  buttons. That fails `html-validate` and is semantically unsafe because an
  omitted button type defaults to submit inside forms.
- The tested configurations decode some `&amp;` entities to raw `&`, which
  fails the repo's strict HTML validation gate.
- Optional tag omission provides more raw and compressed savings, but it causes
  broad implicit-close and close-order validation failures under the current
  strict validator.
- The noncompliant measurement configuration creates invalid doctype output
  that the validator cannot tokenize.

The size savings are real but not enough to justify invalid output:

- Conservative: `-219,293 B` raw HTML, `-33,313 B` gzip HTML, `-27,589 B`
  Brotli HTML.
- Optional tags: `-301,026 B` raw HTML, `-43,446 B` gzip HTML, `-30,999 B`
  Brotli HTML.

Until a configuration or upstream change preserves explicit button types,
standards-compliant entities, valid document shape, and every release gate,
`minify-html` should remain an experiment tool rather than a production build
step.

## Initial Recommendation

Research supported trying the standard `@minify-html/node` package as a
post-build HTML pass. The reproducible experiment suite did that, and no tested
configuration passed production gates. The initial conservative configuration
remains useful as the baseline scenario for future reruns:

```ts
{
  keep_closing_tags: true,
  keep_html_and_head_opening_tags: true,
  keep_comments: false,
  keep_input_type_text_attr: false,
  keep_ssi_comments: false,
  minify_css: true,
  minify_js: false,
  allow_noncompliant_unquoted_attribute_values: false,
  allow_optimal_entities: false,
  allow_removing_spaces_between_attributes: false,
  minify_doctype: false,
  preserve_brace_template_syntax: false,
  preserve_chevron_percent_template_syntax: false,
  remove_bangs: false,
  remove_processing_instructions: false,
}
```

Then test `minify_js: true` separately. If JavaScript minification passes every
gate, it can be promoted. If it fails, keep JS minification off and rely on
Astro/Vite for bundled scripts.
