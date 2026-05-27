---
title: Redirects
description: Keep legacy URLs working with site-owned redirect config.
date: 2026-05-08
author: Platform Team
tags:
  - configuration
  - redirects
---

Redirects are compatibility data. They belong to the site instance because they
usually preserve one publication's history.

## File Location

```text
site/config/redirects.json
```

The docs site uses:

```text
examples/docs-site/config/redirects.json
```

## Example

```json
{
  "/old-guide/": "/articles/quick-start/"
}
```

## Verify

```sh
SITE_INSTANCE_ROOT=examples/docs-site just site-doctor --quiet
just test-docs-site
```

## Rule Of Thumb

Add redirects for real public URL migrations. Do not use redirects as normal
navigation or as a substitute for stable article slugs.
