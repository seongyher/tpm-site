---
title: Validate Your Site
description: Run the checks that catch broken config, content, assets, and output.
date: 2026-05-08
author: Platform Team
tags:
  - quick start
  - checks
  - operations
---

Validation should be part of normal authoring. The platform provides focused
checks for content, config, assets, generated output, and complete site builds.

## Fast Docs-Site Check

Run:

```sh
just test-docs-site
```

This validates the docs-site instance and builds it into an isolated output
directory.

## Config Relationship Check

Run:

```sh
SITE_INSTANCE_ROOT=examples/docs-site just site-doctor --quiet
```

Use this after editing navigation, homepage collections, routes, feature flags,
or required site directories.

## Content Check

Run:

```sh
SITE_INSTANCE_ROOT=examples/docs-site just content-check --quiet
```

Use this after adding articles, announcements, authors, categories, tags, or
collections.

## Full Release Check

For the default production site instance, run:

```sh
just release-check
```

This is intentionally heavier than an authoring check.

## Next

Use [Troubleshooting](/articles/troubleshooting/) when a check fails.
