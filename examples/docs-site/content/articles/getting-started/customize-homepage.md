---
title: Customize The Homepage
description: Put articles on the homepage by editing collections and homepage config.
date: 2026-05-08
author: Platform Team
tags:
  - quick start
  - homepage
  - configuration
---

The homepage is a typed recipe. Site owners control the content through
collections and a few validated config fields.

## Edit Starter Content

The `Start Here` list uses this collection:

```text
examples/docs-site/content/collections/start-here.md
```

Add article slugs in the order readers should see them:

```yaml
---
title: Start Here
items:
  - quick-start
  - create-first-article
  - customize-homepage
---
```

## Edit Featured Content

The featured carousel uses:

```text
examples/docs-site/content/collections/featured.md
```

You can add an optional note for homepage copy:

```yaml
items:
  - slug: quick-start
    note: Start here to run the platform and make your first edit.
```

## Edit Homepage Labels

Homepage labels live in site config:

```json
{
  "homepage": {
    "labels": {
      "read": "Docs",
      "featured": "Featured",
      "startHere": "Start Here"
    }
  }
}
```

## Verify

Run:

```sh
just test-docs-site
```

## Next

Use [Homepage Config](/articles/homepage-config/) for the complete homepage
contract.
