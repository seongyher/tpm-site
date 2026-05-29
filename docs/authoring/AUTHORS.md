# Author Metadata Technical Design

## Purpose

This document defines how The Philosopher's Meme should represent authors,
bylines, author profile pages, and author metadata without relying on fragile
free-text matching.

Author pages are browsing pages: they help readers discover more work by a
person, group, organization, or anonymous byline.

## Corpus Survey

All 61 current article files use a single `author` frontmatter string.

Unique author strings:

| Author string                               | Count | Target interpretation           |
| ------------------------------------------- | ----: | ------------------------------- |
| `Seong-Young Her`                           |    41 | one person author               |
| `Anonymous`                                 |     3 | anonymous byline                |
| `Mike M.`                                   |     3 | one person/pseudonymous author  |
| `Thomas Rososchansky`                       |     3 | one person author               |
| `Seong-Young Her & Masha Zharova`           |     2 | two author references           |
| `The Philosopher's Meme`                    |     2 | organization/publication author |
| `Chicago School of Countercultural Inquiry` |     1 | group/collective author         |
| `Claudia Vulliamy`                          |     1 | one person author               |
| `Isaac van Bakel & Ulysses King`            |     1 | two author references           |
| `Masha Zharova`                             |     1 | one person author               |
| `Mikhail Conrad Nacua`                      |     1 | one person author               |
| `Samuel Tannert`                            |     1 | one person author               |
| `Simon J. Evnine`                           |     1 | one person author               |

No current article uses structured `authors`, author IDs, author profile
references, or social/profile metadata.

## Design Decision

Add an `authors` content collection.

Recommended structure:

```text
site/content/authors/
  seong-young-her.md
  masha-zharova.md
  anonymous.md
  the-philosophers-meme.md
```

Author entries use frontmatter for structured metadata and Markdown body for
long profile content:

```md
---
displayName: "Seong-Young Her"
type: "person"
shortBio: "..."
website: "https://..."
socials:
  - label: "Website"
    href: "https://..."
aliases:
  - "Seong-Young Her"
---

Longer author profile body.
```

Article frontmatter should eventually use stable author references:

```yaml
authors:
  - seong-young-her
  - masha-zharova
```

The current `author` string is preserved article content. The Astro layer maps
that string through author aliases while article-content migration is deferred.
Do not rewrite article bylines unless an article-content milestone explicitly
requires it.

## Author Model

```ts
interface AuthorProfile {
  id: string;
  displayName: string;
  type: "person" | "organization" | "collective" | "anonymous";
  shortBio: string | undefined;
  website: string | undefined;
  socials: readonly AuthorSocialLink[];
  aliases: readonly string[];
  articles: readonly ArticleEntry[];
}
```

`id` comes from the author content entry ID. It is the stable identity used in
URLs and article references.

## Identity Rules

- Author IDs are lowercase slug strings and should not change after publication.
- Display names may change without changing URLs.
- Aliases support legacy bylines and spelling variants.
- Multiple authors are an ordered array of author references.
- Group and organization authors are first-class author types.
- Anonymous is an explicit author profile type, not a missing author.
- Unknown free-text authors should fail after migration unless an explicit
  temporary exception is documented.

## Profile Fallbacks

An author page is useful even without profile metadata.

Fallback behavior:

- display name is required;
- article list is always shown;
- short bio is optional;
- long bio body is optional;
- social links are optional;
- avatar is optional;
- no placeholder bio text;
- no fake image;
- no broken "About the author" block.

For anonymous authors, the page may explain that the author is anonymous only if
that copy is explicitly provided in the author profile.

## Article Frontmatter Migration

Article-content changes are required to move from `author` strings to
`authors` references.

Required migrations:

- split `Seong-Young Her & Masha Zharova` into two author references;
- split `Isaac van Bakel & Ulysses King` into two author references;
- map organization/group bylines to organization/collective author entries;
- map `Anonymous` to the explicit `anonymous` author profile;
- preserve article wording and byline intent.

During migration, display can read from structured `authors` when present and
fall back to legacy `author` when not present. After migration, published
articles should require known author references.

## Machine-Readable Metadata

Article JSON-LD should use structured author data when available:

- `Person` for `type: "person"`;
- `Organization` for `type: "organization"` or publication bylines;
- a conservative `Organization` or `Person` decision for collectives only if
  profile metadata supports it;
- omit unsupported social/profile fields rather than inventing them.

RSS can use display names. Open Graph can keep article-level metadata and does
not need rich author objects.

Author pages should emit canonical URLs and normal page metadata. Person or
Organization JSON-LD is optional and should only be emitted when metadata is
accurate.

## Validation And Enforcement

Before migration:

- warn or review-report legacy `author` strings that lack a known alias;
- allow fallback display for existing articles.

After migration:

- every published article should have `authors`;
- every referenced author ID must exist in the authors collection;
- duplicate author IDs in one article fail;
- unknown legacy author strings fail unless explicitly excepted;
- social links must be valid URLs;
- avatar paths must use Astro asset conventions.

## Tests

Required tests:

- author collection schema validation;
- unique author IDs and aliases;
- legacy string to author ID mapping;
- multi-author ordering;
- anonymous, organization, and collective profiles;
- article-to-author relationships;
- author page route generation;
- author article list sorting;
- JSON-LD author output;
- RSS author output;
- fallback behavior for missing bios/socials/avatars.

## Privacy And Editorial Rules

Do not add personal websites, social accounts, avatars, locations, or bios
without explicit content-owner approval. Author metadata is public content.

For pseudonymous or anonymous authors, preserve the byline chosen by the
article. Do not infer real names.

## Implementation Milestones

The checklist breaks implementation into:

- author page component designs;
- author metadata source/schema;
- article frontmatter normalization;
- author routes;
- byline linking;
- metadata/RSS/JSON-LD integration;
- tests and author-facing documentation.
