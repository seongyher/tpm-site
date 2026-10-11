---
title: Configurability Contracts
description: Decide which customization belongs in site config, component props, content, or platform defaults.
date: 2026-05-08
author: Platform Team
tags:
  - configuration
  - customization
  - reference
---

Customization should have a clear owner. The platform is easier to maintain
when site owners edit durable contracts instead of platform internals.

## Site Config

Use site config for stable site-wide choices a webmaster expects to manage:

- homepage discovery links and section labels;
- support and social links;
- share targets;
- feature flags;
- routes and navigation;
- content defaults.

## Content And Frontmatter

Use content for editorial choices tied to one entry: title, description, date,
author, image, tags, and visibility overrides.

```yaml
---
title: Hidden Draft
visibility:
  homepage: false
  search: false
---
```

## Component Props

Use component props when the page already has local context. Related-content
headings, one-off empty states, and section-specific labels should remain close
to the component unless they become a site-wide convention.

## Platform Defaults

Keep layout mechanics, share endpoint builders, and
article-card fitting behavior in the platform until there is clear evidence
that site owners need safe customization.

## Deferred Customization

Do not add speculative config. If a setting needs a product decision, schema
design, or route/build redesign, document it as deferred instead.
