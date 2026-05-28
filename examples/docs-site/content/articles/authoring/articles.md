---
title: Articles
description: Write normal publication content with Markdown or MDX.
date: 2026-05-08
author: Platform Team
tags:
  - authoring
  - articles
---

Articles are the main publishable content type. They appear in article indexes,
categories, tags, feeds, search, collections, related content, and PDFs unless
frontmatter or site defaults say otherwise.

## File Location

Use a category folder:

```text
site/content/articles/<category>/<article-slug>.md
```

The docs site uses:

```text
examples/docs-site/content/articles/authoring/articles.md
```

## Frontmatter

```yaml
---
title: Article Title
description: A concise summary for lists and metadata.
date: 2026-05-08
author: Platform Team
tags:
  - authoring
---
```

## Markdown First

Use Markdown for ordinary prose and images. Use MDX only when an article needs a
custom component.

## Verify

```sh
just author-check
```

## Next

Use [Images](/articles/images/) for local images and
[Visibility And Drafts](/articles/visibility-and-drafts/) for hiding content
from specific surfaces.
