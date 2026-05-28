---
title: Create Your First Article
description: Add a Markdown article and see it appear in platform article surfaces.
date: 2026-05-08
author: Platform Team
tags:
  - quick start
  - authoring
  - articles
---

Articles are normal Markdown or MDX files inside the active site instance. You
do not need to edit platform routes to publish a normal article.

## Create The File

Create a file under a category folder:

```text
examples/docs-site/content/articles/getting-started/my-first-article.md
```

Use this starter content:

```markdown
---
title: My First Article
description: A short summary for lists, feeds, and metadata.
date: 2026-05-08
author: Platform Team
tags:
  - example
---

This is my first article.

## What I Changed

I added a Markdown file inside the site instance.
```

The URL is based on the file name:

```text
/articles/my-first-article/
```

## Verify

Run:

```sh
SITE_INSTANCE_ROOT=examples/docs-site just content-check --quiet
```

Then run the full docs-site check when the article is ready:

```sh
just test-docs-site
```

## Common Mistakes

- Tags must be lowercase and cannot contain `/`.
- The `author` value must match an author alias.
- Article file names should be stable because they become public slugs.

## Next

Use [Customize The Homepage](/articles/customize-homepage/) to place the new
article in a homepage collection.
