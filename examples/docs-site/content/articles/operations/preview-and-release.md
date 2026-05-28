---
title: Preview And Release Checks
description: Build production-like output and run release-level verification.
date: 2026-05-08
author: Platform Team
tags:
  - operations
  - preview
  - release
---

Use preview commands when you need to inspect optimized generated output instead
of the development server.

## Docs-Site Preview

```sh
just docs-site-preview-fresh
```

This builds the docs site into:

```text
dist/examples/docs-site
```

## Default Release Preview

```sh
just preview-release-fresh
```

This builds, verifies, validates HTML, and then serves the default site
instance.

## Full Release Gate

```sh
just release-check
```

Use this before high-confidence release handoff. It is intentionally slower
than authoring checks.
