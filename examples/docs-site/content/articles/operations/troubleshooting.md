---
title: Troubleshooting
description: Fix common content, config, theme, and build failures.
date: 2026-05-08
author: Platform Team
tags:
  - operations
  - troubleshooting
---

When something fails, start with the smallest check that matches the file you
changed.

## Config Fails

Run:

```sh
SITE_INSTANCE_ROOT=examples/docs-site just site-schema-check --quiet
SITE_INSTANCE_ROOT=examples/docs-site just site-doctor --quiet
```

Common causes:

- navigation links point at disabled features;
- homepage collections reference missing files;
- route paths do not start with `/`;
- URLs are not absolute where required.

## Content Fails

Run:

```sh
SITE_INSTANCE_ROOT=examples/docs-site just content-check --quiet
```

Common causes:

- tags are not canonical lowercase values;
- author names do not match author aliases;
- required frontmatter fields are missing;
- article slugs collide.

## Build Fails

Run:

```sh
just test-docs-site
```

Common causes:

- local image paths are wrong;
- feature-disabled routes are still linked;
- generated output validation catches broken internal links.

## Still Stuck

Use [Commands Reference](/articles/commands-reference/) to choose a narrower
check, then inspect the first reported failure before changing unrelated files.
