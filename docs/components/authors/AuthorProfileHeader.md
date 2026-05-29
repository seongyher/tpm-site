# Author Profile Header

Source: `src/components/authors/AuthorProfileHeader.astro`

## Purpose

`AuthorProfileHeader` opens an author profile page with identity, optional
short bio, optional avatar, and article count.

It must work even when the author has only a display name and articles.

## Public Contract

- `author: AuthorProfile`
- `articleCount: number`

## Composition Relationships

```text
AuthorPage
  AuthorProfileHeader
    AuthorSocialLinks
```

The profile page owns surrounding layout. Header owns identity presentation.

## Layout And Responsiveness

Mobile: stack identity, bio, and optional links.

Desktop: avatar/socials may sit beside text if present, but the header should
not reserve space when no avatar exists.

## Layering And Scrolling

No layering.

## Interaction States

Support no bio, no avatar, no socials, long name, organization/collective type,
and anonymous type.

## Accessibility Semantics

Render the author display name as the page H1. Avatar alt text should be empty
if decorative or meaningful if editorially important.

## Content Edge Cases

Handle long names, pseudonyms, anonymous authors, organizations, group authors,
zero articles only for draft/internal states, and long short bios.

## Theme Behavior

Use semantic foreground/muted tokens. Keep profile identity visually clear but
not hero-marketing styled.

## Testable Invariants

- Renders H1 display name.
- Shows article count.
- Does not reserve avatar space when no avatar exists.
- Keeps long names inside the browsing measure.
- Renders no fake bio or fake social links.

## Follow-Up Notes

- If author pages later get portraits, use Astro assets and document image
  approval/privacy rules in `docs/authoring/AUTHORS.md`.
