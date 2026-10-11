---
title: Frontmatter Reference
description: Review common article and announcement frontmatter fields.
date: 2026-05-08
author: Platform Team
tags:
  - reference
  - frontmatter
  - authoring
---

Frontmatter is the structured metadata at the top of Markdown and MDX files.
The platform validates it before building public pages.

## Article Fields

```yaml
---
title: Article Title
description: A concise summary for lists and metadata.
date: 2026-05-08
author: Platform Team
image: ../../../assets/articles/example/image.svg
imageAlt: Useful alt text.
tags:
  - example
draft: false
visibility:
  directory: true
  feed: true
  homepage: true
  search: true
---
```

## Required In Normal Use

Most articles need:

- `title`;
- `description`;
- `date`;
- `author`;
- `tags`.

Many other fields have site defaults.

## Announcements

Announcements use the same core fields.

## Pages

Standalone pages use a smaller page schema with `title`, optional
`description`, optional hero config, and optional starter links.
