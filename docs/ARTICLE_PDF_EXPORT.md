# Article PDF Export — Retired

Generated article PDFs and the Save PDF button were removed in October 2026
([issue #169](https://github.com/seongyher/tpm-site/issues/169)). The build emits
HTML articles, assets, feeds, search data, and other static metadata. It does not
launch Chromium or produce article PDFs.

The `build:pdf` command, PDF generator, PDF-only dependencies, `features.pdf`,
`contentDefaults.articles.pdf`, and article `pdf` frontmatter are removed.
Existing site instances must remove those configuration fields; strict schemas
reject them. MDX imports no longer need a PDF compatibility declaration.

## Preserved Contracts

- `src/lib/article-scholar-meta.ts` derives HTML title, author, publication date,
  language, abstract, keyword, and reference metadata.
- `ArticleScholarMeta` emits these tags without `citation_pdf_url`.
- Article headers keep the Cite and Share controls.
- Native browser printing keeps article text, local images, references, and
  media source-link fallbacks. Print exclusions use `data-print-exclude`.
- External PDF citations and ordinary static assets remain supported.

Generated-output verification rejects stale same-directory article PDF files,
download controls, and PDF metadata. A clean build removes the retired output.
The former PDF pipeline replacement roadmap is superseded by this removal.
