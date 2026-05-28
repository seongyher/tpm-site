---
title: Feature Flags
description: Turn optional platform surfaces on or off coherently.
date: 2026-05-08
author: Platform Team
tags:
  - configuration
  - features
---

Feature flags let one platform support different kinds of sites without making
authors delete route files or edit components.

## Example

```json
{
  "features": {
    "announcements": true,
    "authors": true,
    "bibliography": true,
    "categories": true,
    "collections": true,
    "feed": true,
    "pdf": true,
    "search": true,
    "support": false,
    "tags": true,
    "themeToggle": true
  }
}
```

## What Flags Affect

Flags control UI visibility and generated-output pruning for optional surfaces.
The platform still owns route files; the site instance controls whether a
surface is part of this site.

## Verify

```sh
just test-docs-site
```

## Common Mistake

If a feature is disabled, remove it from navigation and homepage discovery
links. The doctor check reports broken references where it can.
