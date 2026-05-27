---
title: Change Theme Colors
description: Customize the site theme with a small site-owned CSS file.
date: 2026-05-08
author: Platform Team
tags:
  - quick start
  - theme
  - customization
---

Each site instance owns its theme tokens. The platform components consume
semantic tokens such as `--background`, `--foreground`, and `--primary`.

## Edit The Theme File

Open:

```text
examples/docs-site/theme.css
```

Try a small primary color change:

```css
:root {
  --primary: oklch(0.48 0.16 245);
  --primary-foreground: oklch(0.98 0.02 245);
}
```

The platform keeps component behavior stable while the site changes visual
identity.

## Check Dark Mode

Dark theme values live under the site theme selector:

```css
:root[data-theme="dark"] {
  --background: oklch(0.16 0.02 245);
  --foreground: oklch(0.96 0.01 245);
}
```

## Verify

Run:

```sh
just test-docs-site
```

## Next

Read [Theme Contract](/articles/theme-contract/) before making broad visual
changes.
