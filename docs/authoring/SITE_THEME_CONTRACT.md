# Site Theme Contract

## Purpose

The platform owns semantic styling contracts. A site instance owns concrete
branding choices.

This split lets the platform keep reusable components and Tailwind utilities
stable while each publication controls its colors, type choices, radius, and
shadow feel without editing `src/`.

## File Contract

Every site instance must provide:

```text
theme.css
```

The file is loaded through `@site/theme.css`. The active site instance is
chosen by `SITE_INSTANCE_ROOT`; the default instance is `site/`.

`src/layouts/BaseLayout.astro` imports styles in this order:

1. `src/styles/global.css`
2. `@site/theme.css`
3. `src/styles/print.css`

The order is intentional. Platform base styles define the token API, the site
theme overrides normal screen branding, and print styles override both for
academic PDF/print output.

## Site-Owned Tokens

Site themes should set semantic CSS variables, not component selectors:

- `--background`, `--foreground`;
- `--card`, `--card-foreground`;
- `--popover`, `--popover-foreground`;
- `--primary`, `--primary-foreground`;
- `--secondary`, `--secondary-foreground`;
- `--muted`, `--muted-foreground`;
- `--accent`, `--accent-foreground`;
- `--destructive`, `--destructive-foreground`;
- `--border`, `--input`, `--ring`;
- `--chart-1` through `--chart-5`;
- `--sidebar-*` when sidebar-like surfaces need distinct colors;
- `--font-sans`, `--font-serif`, `--font-mono`;
- `--radius`;
- `--shadow-*`;
- `--title` and `--accent-strong` when the site needs explicit aliases.

Themes may define both `:root` and `:root[data-theme="dark"]`.

## Platform-Owned Styles

The platform keeps:

- Tailwind imports and `@theme inline` token wiring;
- semantic base styles for document, links, focus, images, and reference
  markers;
- print/PDF behavior;
- responsive component layout and interaction styles.

Do not put publication-specific selectors or TPM-specific palette decisions in
`src/styles/global.css`. Put them in the active site instance instead.

## Future GUI

A future GUI can edit `theme.css` directly or generate it from a structured
theme editor. The important durable contract is the semantic token set above,
not the authoring interface used to produce the file.
