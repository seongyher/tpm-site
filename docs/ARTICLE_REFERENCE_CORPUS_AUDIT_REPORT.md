# Article Reference Corpus Audit Report

Generated from `just references-audit` on May 5, 2026.

This is the current corpus status after article-reference normalization. The
generated per-article catalog contains the detailed inventory; the migration
decision log records why each noncanonical pattern was converted or preserved.

## Summary

- Articles scanned: 61
- Manual review candidates: 0
- Canonical citation markers: 62
- Canonical note definitions: 7
- Canonical note markers: 7
- Hidden `tpm-bibtex` blocks: 7
- Noncanonical footnote definitions: 0
- Noncanonical footnote markers: 0
- Reference-section headings: 0
- Raw HTML links: 0
- Markdown links inventoried as prose links: 262
- Archive links inventoried separately: 19
- Raw URLs inventoried as prose URLs: 428

## Manual Review Candidates

No manual review candidates found.

## Interpretation

The audit now finds no legacy article-reference patterns that require manual
normalization. True source footnotes that had a clear inline claim relationship
were converted to `[^cite-*]` markers plus hidden `tpm-bibtex` entries.
Explanatory footnotes were converted to `[^note-*]`.

Historical source-list sections have been converted into structured
`tpm-bibtex` data only when doing so preserves article intent. Where the article
had clear inline numeric source markers, those markers were converted to
`[^cite-*]`. Broad bibliography entries without precise inline claim anchors may
render as bibliography-only sources. Author-owned appendices remain visible
prose until a separate appendix/source-list model is designed.

The 262 Markdown links and 428 raw URL occurrences are intentionally not treated
as bibliography entries. They stay ordinary prose unless an article is
explicitly edited to cite them.
