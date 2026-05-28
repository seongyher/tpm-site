---
title: PDFs And Scholarship
description: Generate lightweight academic-style PDFs for articles.
date: 2026-05-08
author: Platform Team
tags:
  - authoring
  - pdfs
  - scholarship
---

The platform can generate simplified article PDFs for reading, citation, and
scholarly indexing. PDFs remove site chrome and promotional blocks so the
article reads like a plain academic document.

## Default Behavior

Article PDF generation is controlled by site defaults:

```json
{
  "contentDefaults": {
    "articles": {
      "pdf": {
        "enabled": true
      }
    }
  }
}
```

## Per-Article Override

Disable a PDF for an article only when the article cannot be represented well:

```yaml
---
pdf: false
---
```

## Generate PDFs

```sh
just build-pdf
```

## Common Reasons To Disable

- The article relies on interactive MDX that has no useful static fallback.
- The article contains third-party media that cannot be represented in print.
- The generated PDF would be misleading without a manual editorial pass.

## Next

Use [Images](/articles/images/) to keep article media local and optimizable.
