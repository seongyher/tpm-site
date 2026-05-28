---
title: Support, Social, And Share
description: Configure support links, community links, and article share targets.
date: 2026-05-08
author: Platform Team
tags:
  - configuration
  - support
  - sharing
---

Support and sharing are site-owned choices. The platform owns button behavior
and share endpoint builders; the site chooses labels, links, handles, and
target order.

## Support Links

```json
{
  "features": {
    "support": true
  },
  "support": {
    "patreon": {
      "href": "https://example.com/sponsor",
      "label": "Sponsor",
      "compactLabel": "Sponsor"
    },
    "discord": {
      "href": "https://example.com/community",
      "label": "Community"
    }
  }
}
```

## Share Targets

```json
{
  "share": {
    "targets": ["bluesky", "x", "linkedin", "reddit"],
    "xViaHandle": "blog_platform",
    "threadsMention": "@blog_platform"
  }
}
```

Copy link and email stay available because they do not rely on third-party
share endpoints.

## Verify

```sh
SITE_INSTANCE_ROOT=examples/docs-site just site-schema-check --quiet
```
