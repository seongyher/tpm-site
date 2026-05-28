---
title: Site Config
description: Edit the validated JSON contract that controls a site instance.
date: 2026-05-08
author: Platform Team
tags:
  - configuration
  - site config
  - reference
---

The site config is the main webmaster-facing contract. It is plain JSON so
people, scripts, and a future GUI can all edit the same file.

Edit this file for the docs site:

```text
examples/docs-site/config/site.json
```

## Minimal Shape

Every real site needs identity, routes, navigation, homepage settings, feature
flags, support settings, share settings, and content defaults.

```json
{
  "identity": {
    "title": "Platform Docs",
    "description": "Documentation and tutorials for the reusable blog platform.",
    "url": "https://platform.example.com",
    "language": "en"
  },
  "features": {
    "search": true
  }
}
```

The real schema is stricter than this excerpt. Run the schema and doctor checks
after edits:

```sh
SITE_INSTANCE_ROOT=examples/docs-site just site-schema-check --quiet
SITE_INSTANCE_ROOT=examples/docs-site just site-doctor --quiet
```

## What Belongs Here

Use site config for site-wide choices:

- site identity and canonical URL;
- navigation and footer links;
- homepage labels, empty-state copy, limits, and discovery links;
- feature flags;
- support and social links;
- share menu targets;
- content defaults for articles and announcements.

Entry-specific editorial choices belong in Markdown frontmatter instead.
Platform code keeps the default values in a typed defaults module, then the
single site config parser applies those defaults when a site omits optional
fields.

## Next

Use [Homepage Config](/articles/homepage-config/) for homepage-specific fields,
[Navigation Config](/articles/navigation-config/) for menus, and
[Feature Flags](/articles/feature-flags/) for optional platform surfaces.
