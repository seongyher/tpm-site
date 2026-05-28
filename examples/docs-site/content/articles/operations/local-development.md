---
title: Local Development
description: Run a site instance locally while editing config, content, and theme files.
date: 2026-05-08
author: Platform Team
tags:
  - operations
  - local development
---

Development commands run the platform against a selected site instance.

## Docs Site

```sh
just docs-site-dev
```

## Default Site

```sh
just dev
```

## Explicit Site Instance

Use `SITE_INSTANCE_ROOT` when adding a new instance script:

```sh
SITE_INSTANCE_ROOT=examples/docs-site just dev
```

## What To Edit

For site-specific work, edit the site instance:

```text
examples/docs-site/config/
examples/docs-site/content/
examples/docs-site/assets/
examples/docs-site/public/
examples/docs-site/theme.css
```

For reusable behavior, edit platform files under `src/`, `scripts/`, and
`tests/`.
