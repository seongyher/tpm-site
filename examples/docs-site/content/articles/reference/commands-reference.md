---
title: Commands Reference
description: Choose the right repository command for development, authoring, validation, and release checks.
date: 2026-05-08
author: Platform Team
tags:
  - reference
  - commands
---

The platform uses Bun for JavaScript dependencies and tests, but `just` is the
repository command surface. Use `just` recipes for development, checks, and
site-instance operations.

## Development

```sh
just dev
just docs-site-dev
```

## Authoring

```sh
just author-check
just author-fix
```

## Docs Site

```sh
just test-docs-site
just docs-site-preview-fresh
```

## External Fixture

```sh
just test-site-instance
```

## Platform Checks

```sh
just platform-check
just check
```

## Release

```sh
just release-check
```

## Generated Contracts

```sh
just site-schema
just site-schema-check
```

Use [Validate Your Site](/articles/validate-site/) for the onboarding path and
[Troubleshooting](/articles/troubleshooting/) when a command fails.
