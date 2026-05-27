---
title: Citations And Bibliography
description: Use structured article references when content needs scholarly source data.
date: 2026-05-08
author: Platform Team
tags:
  - authoring
  - citations
  - bibliography
---

The platform supports structured notes, citations, and bibliography output for
articles that need scholarly references. Use it when source data should be
machine-readable, reusable, and visible in the global bibliography.

## When To Use It

Use structured references for articles that need:

- citation markers in prose;
- generated footnotes or references sections;
- global bibliography aggregation;
- stable backlinks from sources to citing articles.

## Authoring Rule

Keep ordinary prose ordinary. Add structured citation syntax only where the
article needs source tracking. The verifier owns citation validation, so do not
disable broken markers with Markdownlint exceptions.

## Verify

```sh
just author-check
```

Historical one-off reference audit commands are no longer part of the active
command surface. Source validation now runs through the normal author-facing
checks.

## Deferred Details

Citation locators such as page numbers are intentionally deferred until their
syntax is designed. Do not invent one-off citation syntax in article prose.

## Next

Use [PDFs And Scholarship](/articles/pdfs-and-scholarship/) for scholarly PDF
exports and [Frontmatter Reference](/articles/frontmatter-reference/) for
article metadata fields.
