# Article Reference Corpus Audit Design

## Purpose

The corpus audit inventories citation-like article content before and after
article-reference rewrites. It is a review tool, not an automatic migration
tool.

The audit must make these things clear:

- which articles already use canonical `note-*`, `cite-*`, and `tpm-bibtex`
  syntax;
- which articles contain legacy reference structures that require manual
  normalization;
- which articles only contain ordinary prose links that should not be promoted
  into bibliography data without an explicit article edit;
- which patterns are present so a reviewer can normalize one legacy pattern at
  a time.

This keeps source-content changes deliberate. Tooling may scan and report
article content, but it must not rewrite `site/content/articles/`.

## Detection Model

The audit script should scan every Markdown and MDX article under
`site/content/articles/` and report these patterns per article:

- canonical citation markers: `[^cite-*]`;
- canonical note markers and definitions: `[^note-*]`;
- hidden BibTeX data blocks: fenced code with `tpm-bibtex`;
- obsolete citation definitions: `[^cite-*]: ...`;
- noncanonical footnote definitions and markers;
- explicit reference-section headings such as `Reference`, `References`,
  `Bibliography`, `Works Cited`, `Works Consulted`, `Sources`, `Source`, or
  `Source List`;
- visible BibTeX fences using ordinary `bibtex`;
- raw HTML links;
- Markdown links, with archive links counted separately;
- raw URLs in prose;
- media-credit or source-credit lines;
- blockquote attribution lines;
- bracket-style reference lines that look like bibliography entries.

Use the Markdown AST where it provides reliable structure: headings, links,
HTML nodes, code fences, and blockquotes. Use targeted line-level regexes for
authoring shapes that Markdown parsers intentionally leave as text, such as raw
footnote labels and source-credit prose.

## Manual-Review Criteria

An article needs manual reference normalization when it contains one of these
high-confidence legacy structures:

- obsolete `cite-*` footnote definitions;
- noncanonical footnote definitions;
- explicit references/bibliography/sources sections;
- visible `bibtex` fences;
- raw HTML links;
- media-credit/source-credit lines;
- blockquote attributions;
- bracket-style bibliography-looking lines.

Ordinary Markdown links and raw URLs are inventoried but do not automatically
become bibliography work. They remain prose unless a human decides the article
should cite them with `[^cite-*]` and a matching `tpm-bibtex` entry.

Archive links are counted separately because they are often source-like, but
the audit still must not infer bibliography entries from them.

## Output Contract

The script should expose typed helpers for tests and a CLI for reviewers.

Default CLI output should be Markdown:

- totals across the corpus;
- a manual-review table with article path and exact detected patterns;
- a compact all-article inventory when useful.

JSON output should be available for future tooling and CI experiments. The
audit should not fail by default. Release blocking is handled by the strict
Markdown reference plugin now that the published corpus is normalized.

## Testing

Unit tests should cover:

- canonical notes/citations plus `tpm-bibtex`;
- obsolete citation definitions;
- noncanonical footnotes;
- reference-section headings;
- Markdown links, raw HTML links, archive links, and raw URLs;
- visible `bibtex` fences versus hidden `tpm-bibtex` fences;
- media-credit lines, blockquote attributions, and bracket-style entries;
- deterministic sorted output.

The script should be covered through pure helper tests and a CLI smoke test.

## Non-Goals

- Do not rewrite article Markdown.
- Do not infer citations from ordinary links.
- Do not fetch external pages for metadata.
- Do not deduplicate sources globally.
- Do not use audit output as a substitute for the strict Markdown validation
  that enforces canonical labels during build.
