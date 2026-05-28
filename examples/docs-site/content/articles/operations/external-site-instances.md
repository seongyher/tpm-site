---
title: External Site Instances
description: Build a site instance outside the default site directory.
date: 2026-05-08
author: Platform Team
tags:
  - operations
  - site instances
  - platform
---

The platform can build against a site instance selected by environment
variables. This keeps platform code separate from site-owned content and
configuration.

## Required Shape

```text
my-site/
  config/
  content/
  assets/
  public/
  theme.css
```

## Build Command

```sh
SITE_INSTANCE_ROOT=my-site SITE_OUTPUT_DIR=dist/my-site just build
```

## Fixture Proof

The repository includes a small external fixture:

```sh
just test-site-instance
```

## Docs-Site Proof

The docs site uses the same mechanism:

```sh
just test-docs-site
```

## Next

Use [Site Config](/articles/site-config/) and [Theme Contract](/articles/theme-contract/)
when creating a new instance from scratch.
