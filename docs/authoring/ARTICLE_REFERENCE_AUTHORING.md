# Article Reference Authoring

Use ordinary Markdown for article prose. Only use the reference syntax below
when a note or bibliography entry should be part of the site's structured
article-reference system.

Published articles use strict reference validation. Arbitrary Markdown
footnotes such as `[^1]` or `[^source]` fail the build; use `note-*` for
explanatory notes and `cite-*` plus `tpm-bibtex` for bibliography sources.

## Explanatory Notes

Use `note-*` footnotes for explanatory asides.

```md
This sentence needs extra context.[^note-context]

[^note-context]: This is the explanatory note.
```

Rules:

- note labels use lowercase ASCII words separated by hyphens;
- each note may be referenced once;
- note prose can use normal Markdown;
- notes are not bibliography sources.

## Bibliography Citations

Use `cite-*` markers plus a hidden `tpm-bibtex` block for bibliography sources.

````md
This claim cites a source.[^cite-baudrillard-1981]

```tpm-bibtex
@book{baudrillard-1981,
  author = {Baudrillard, Jean},
  title = {Simulacra and Simulation},
  year = {1981},
  url = {https://example.com/source}
}
```
````

Rules:

- the marker is `[^cite-<key>]`;
- the BibTeX key is `<key>` without the `cite-` prefix;
- citation keys use lowercase ASCII words separated by hyphens;
- citations may be referenced more than once;
- inline citation markers render as bracketed numbers by default, such as
  `[1]`, even when source metadata can generate an author-year label;
- do not add `[^cite-*]:` footnote definitions;
- `tpm-bibtex` blocks are hidden source data and should never appear to
  readers.

Prefer structured BibTeX fields over a prose-only source string. For ordinary
sources, include as much of the following as is easy to verify:

- `author` or `editor`;
- `title`;
- `year` or `date`;
- `journal`, `booktitle`, `publisher`, `volume`, `number`, and `pages` when
  they apply;
- `doi`, `isbn`, `url`, and `urldate` when available.

Use the source type that best matches the work:

- `@article` for journal or magazine articles;
- `@book` for books;
- `@inbook` or `@incollection` for chapters and anthology entries;
- `@inproceedings` for conference papers;
- `@online` for web pages, videos, social posts, archives, and other web-only
  sources;
- `@misc` only when no better type fits.

When metadata is uncertain, do not invent fields. Keep the author's intended
source clear with a conservative title, URL, access date, and any known
creator/date information. If the source is dead, dynamic, private, ambiguous,
or needs an edition/translator decision, leave a short note for a maintainer in
the pull request instead of forcing the citation to look more complete than it
is.

## Ordinary Links

Normal Markdown links are just prose links.

```md
Read the [archive](https://example.com/archive) for context.
```

Do not expect ordinary links to appear in the article bibliography or global
bibliography. If a link is a cited source, use a `cite-*` marker and a matching
BibTeX entry.
