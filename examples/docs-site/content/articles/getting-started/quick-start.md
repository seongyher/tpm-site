---
title: Quick Start
description: Run the example site, make the first edit, and validate the result.
date: 2026-05-08
author: Platform Team
image: ../../../assets/articles/quick-start/platform-map.svg
imageAlt: Diagram showing reusable platform code connected to a site instance.
tags:
  - quick start
  - authoring
  - configuration
---

Start here if you want the shortest path from a clean checkout to a working
editable site. The goal is to run the docs-site instance, edit real content,
and verify that the platform still accepts the result.

## Install And Run

From the repository root:

```sh
just setup
just docs-site-dev
```

The docs-site command runs the same platform code with this site instance:

```text
examples/docs-site/
  config/
  content/
  assets/
  public/
  theme.css
```

![Platform and site split](../../../assets/articles/quick-start/platform-map.svg)

## Make The First Edit

Open an existing article:

```text
examples/docs-site/content/articles/getting-started/create-first-article.md
```

Change a sentence, save the file, and refresh the browser. The platform rebuilds
from Markdown content; you do not need to edit an Astro route to change normal
article copy.

## Add Content To The Homepage

The homepage starter list is controlled by a collection:

```text
examples/docs-site/content/collections/start-here.md
```

Add a slug to the `items` list:

```yaml
items:
  - quick-start
  - create-first-article
  - customize-homepage
```

## Validate The Site

Run the docs-site check after changing config or content:

```sh
just test-docs-site
```

For a faster author-facing check against the active default site instance, use:

```sh
just author-check
```

## Next

Read [Create Your First Article](/articles/create-first-article/) when you are
ready to add new content, then [Customize The Homepage](/articles/customize-homepage/)
to put that content in front of readers.
