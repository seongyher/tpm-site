---
title: Collections
description: Curate ordered lists of articles and announcements without editing each entry.
date: 2026-05-08
author: Platform Team
tags:
  - authoring
  - collections
  - homepage
---

Collections let editors build deliberate reading lists. An article can belong
to many collections without changing the article file.

## File Location

```text
site/content/collections/<collection-id>.md
```

## Basic Collection

```yaml
---
title: Start Here
description: A short path through the platform documentation.
items:
  - quick-start
  - create-first-article
  - customize-homepage
---
```

## Collection Notes

Use item notes when a specific collection needs extra editorial context:

```yaml
items:
  - slug: quick-start
    note: Run the platform and make the first edit.
```

## Homepage Collections

The homepage reads collection IDs from site config:

```json
{
  "homepage": {
    "featuredCollection": "featured",
    "startHereCollection": "start-here"
  }
}
```

## Verify

```sh
SITE_INSTANCE_ROOT=examples/docs-site just site-doctor --quiet
```
