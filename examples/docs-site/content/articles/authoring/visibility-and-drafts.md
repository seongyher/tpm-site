---
title: Visibility And Drafts
description: Control where a publishable entry appears without deleting it.
date: 2026-05-08
author: Platform Team
tags:
  - authoring
  - visibility
  - drafts
---

Visibility lets an entry exist without appearing everywhere. Drafts hide content
from public output. Visibility flags control specific public surfaces.

## Drafts

```yaml
---
draft: true
---
```

Use drafts for unfinished content.

## Visibility

```yaml
---
visibility:
  directory: true
  feed: false
  homepage: false
  search: true
---
```

Use visibility for intentional exceptions, such as an announcement that should
be shareable by URL but not promoted on the homepage.

## Defaults

Site owners configure defaults here:

```json
{
  "contentDefaults": {
    "articles": {
      "draft": false,
      "visibility": {
        "directory": true,
        "feed": true,
        "homepage": true,
        "search": true
      }
    }
  }
}
```

## Verify

```sh
just author-check
```
