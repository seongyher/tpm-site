---
title: Homepage Config
description: Configure homepage labels, starter collections, discovery links, and list limits.
date: 2026-05-08
author: Platform Team
tags:
  - configuration
  - homepage
---

The homepage is intentionally configurable but not a page builder. It is a small
typed recipe designed to be safe for future GUI editing.

## Main Fields

```json
{
  "homepage": {
    "featuredCollection": "featured",
    "startHereCollection": "start-here",
    "announcementLimit": 2,
    "recentLimit": 6
  }
}
```

## Labels

```json
{
  "homepage": {
    "labels": {
      "read": "Docs",
      "featured": "Featured",
      "startHere": "Start Here",
      "announcements": "Updates",
      "categories": "Browse",
      "recent": "Latest"
    }
  }
}
```

## Discovery Links

Discovery links can point to a configured route key:

```json
{
  "label": "Collections",
  "route": "collections"
}
```

They can also point to a specific path:

```json
{
  "label": "Quick Start",
  "href": "/articles/quick-start/"
}
```

## Empty States

Each homepage panel has default empty text. Override only the copy your site
needs to change:

```json
{
  "homepage": {
    "emptyText": {
      "featured": "Featured posts will appear here.",
      "startHere": "Starter articles will appear here."
    }
  }
}
```

## Verify

```sh
SITE_INSTANCE_ROOT=examples/docs-site just site-doctor --quiet
```
