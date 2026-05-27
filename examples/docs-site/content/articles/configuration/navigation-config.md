---
title: Navigation Config
description: Configure primary and footer navigation without editing components.
date: 2026-05-08
author: Platform Team
tags:
  - configuration
  - navigation
---

Navigation belongs to the site instance because it is an editorial and
information-architecture decision.

## Primary Navigation

```json
{
  "navigation": {
    "primary": [
      {
        "label": "Quick Start",
        "href": "/articles/quick-start/"
      },
      {
        "label": "Guides",
        "href": "/articles/"
      }
    ]
  }
}
```

## Footer Navigation

Footer links can include optional surfaces, stable pages, feeds, or external
URLs:

```json
{
  "navigation": {
    "footer": [
      {
        "label": "Collections",
        "href": "/collections/"
      },
      {
        "label": "RSS",
        "href": "/feed.xml"
      }
    ]
  }
}
```

## Feature Flags

Do not link to disabled optional features. `site-doctor` catches many of these
mistakes.

```sh
SITE_INSTANCE_ROOT=examples/docs-site just site-doctor --quiet
```
