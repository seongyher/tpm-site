---
title: Platform Modules
description: Understand the reusable module boundaries that keep site-specific choices out of the platform.
date: 2026-05-08
author: Platform Team
tags:
  - platform
  - architecture
  - reference
---

The platform is organized around durable domains instead of publication-specific
features. Site owners edit config, content, assets, public files, and theme
tokens. Platform modules own reusable behavior.

## Core Domains

The main reusable domains are:

- content and publishable entries;
- routes and optional feature behavior;
- navigation and homepage composition;
- article rendering, images, PDFs, and scholarly metadata;
- references and bibliography;
- search, feeds, sitemap, and build verification;
- theme and branding contracts;
- site diagnostics and author tooling.

## Site Boundary

Reusable modules should not import concrete site assets or site files. They
should read site-specific values through config adapters, content loaders, or
explicit component props.

## Boundary Checks

Run:

```sh
just platform-check
```

The check verifies that `src/lib` modules have documented owners and that
platform-owned review surfaces do not regain obvious site-specific coupling.
