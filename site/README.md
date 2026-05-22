# Editing The TPM Site

This folder contains the editable content and settings for The Philosopher's
Meme website.

If you mostly want to write articles, add announcements, update featured
articles, or make small site copy changes, start here. You should not need to
edit the technical platform code under `src/` for ordinary publishing work.

For a slower step-by-step article walkthrough, see
[`../AUTHOR_TUTORIAL.md`](../AUTHOR_TUTORIAL.md).

## What You Can Edit Here

- `content/articles/`: articles, grouped by category.
- `content/announcements/`: short announcement posts.
- `content/collections/`: curated lists such as Featured and Start Here.
- `content/authors/`: author names, aliases, bios, and links.
- `content/categories/`: category display names and order.
- `content/pages/`: standalone site pages such as Home and About.
- `assets/`: images and SVGs that should be optimized by the site build.
- `config/site.json`: site title, navigation, homepage labels, support links,
  share settings, feature switches, and defaults.
- `theme.css`: site colors, fonts, radius, and visual theme tokens.
- `public/`: files copied directly to the site root, such as favicons,
  `robots.txt`, `CNAME`, `_headers`, and well-known compatibility files.
  `_headers` is a Cloudflare deployment file; it should stay scoped to static
  platform concerns such as immutable caching for hashed `_astro` assets and
  MIME types for well-known files.
- `unused-assets/`: old assets kept for reference. Do not link to files from
  this folder in new content.

## The Common Workflow

Most content changes follow this pattern:

1. Update your copy of the repository.
2. Create a branch for your change.
3. Edit files inside `site/`.
4. Run `bun run author:check` if you can.
5. Commit your change.
6. Push the branch.
7. Open a pull request for review.

The repository is:

```text
https://github.com/seongyher/tpm-site
```

GitHub Desktop is the easiest tool if you are not comfortable with terminal
commands. It can clone the repository, create a branch, commit your edits,
push, and open a pull request.

## Add A New Article

Put normal articles in:

```text
site/content/articles/<category>/<article-slug>.md
```

Example:

```text
site/content/articles/history/my-new-article.md
```

This becomes:

```text
/articles/my-new-article/
```

Use `.md` for normal articles. Use `.mdx` only when the article needs a custom
component, such as a special embed or button.

Current article category folders:

- `aesthetics`
- `game-studies`
- `history`
- `irony`
- `memeculture` (shown as Culture)
- `metamemetics`
- `philosophy`
- `politics`

Ask a maintainer before creating a new category.

### Article Template

Start a new article with this:

```md
---
title: "My New Article"
description: "A short one-sentence summary for search, feeds, and previews."
date: 2026-04-30
author: "Author Name"
tags:
  - example tag
image: "../../../assets/articles/my-new-article/cover.png"
imageAlt: "Short description of the cover image."
---

Article body starts here.
```

Only `title`, `description`, `date`, and `author` are required for a normal
article. Tags and images are strongly recommended when they help readers find
or understand the article.

Use `updated` only when a published article has a meaningful revision that
readers and search engines should know about. Do not change it for typo fixes,
formatting-only edits, or build/tooling changes.

Do not add `slug` or `category` fields. The filename becomes the slug. The
folder becomes the category.

### Article Metadata

| Field         | Meaning                                                                |
| ------------- | ---------------------------------------------------------------------- |
| `title`       | The article title shown on the page.                                   |
| `description` | A short summary used in previews, search, RSS, and metadata.           |
| `date`        | Publication date. Use `YYYY-MM-DD` unless a maintainer asks otherwise. |
| `updated`     | Optional meaningful update date. Use only for substantive revisions.   |
| `author`      | Must match an author name or alias in `content/authors/`.              |
| `tags`        | Optional grouping labels. They become clickable tag pages.             |
| `image`       | Optional preview image for article lists and social previews.          |
| `imageAlt`    | Description of the preview image for readers who cannot see it.        |
| `draft`       | Set `draft: true` to keep an entry unpublished.                        |
| `pdf`         | Articles default to PDF export. Set `pdf: false` only for exceptions.  |
| `visibility`  | Optional controls for where a published entry appears. See below.      |
| `semantic`    | Optional special metadata for reviews, events, media, datasets, etc.   |

Tags should be lowercase, trimmed, and unique. Do not use `/` in tags.

Good:

```yaml
tags:
  - internet culture
  - memes
  - philosophy
```

Avoid:

```yaml
tags:
  - Internet Culture
  - memes/memetics
  - memes
  - memes
```

If tag formatting is the only problem, `bun run author:fix` can usually fix it.

## Visibility, Drafts, And Exceptions

By default, articles and announcements are visible everywhere they normally
should be: directories, homepage surfaces, collections, RSS, search, sitemap
discovery, related-entry blocks, PDFs when supported, and future export/API
surfaces.

Use `draft: true` when something should not be published at all.

Use `visibility` only for unusual cases where a published page should exist but
stay out of one or more automatic lists:

```yaml
visibility:
  homepage: false
  directory: false
  collections: false
  search: false
  feed: false
  sitemap: false
  related: false
  pdf: false
  external: false
```

What each option means:

- `homepage`: automatic homepage slots and homepage curation.
- `directory`: browsing pages such as archive, category, tag, author,
- `collections`: curated collection pages.
- `feed`: the RSS feed.
- `search`: the site search index.
- `sitemap`: sitemap discovery for search engines.
- `related`: Next Article, More in Category, and similar reading blocks.
- `pdf`: generated PDF links and PDF-related discovery. This only applies to
  articles.
- `external`: future API, MCP, studio, and export manifests.

You can set only the values you need. Omitted values use the defaults from
`config/site.json`.

## Special Semantic Metadata

Most articles and announcements do not need this section.

Use `semantic` only when the page is clearly a special kind of content, such as
a review, event, video, audio work, book, dataset, software project, or FAQ.
The site uses this information in two ways:

- it shows a small visible details block on the page;
- it adds machine-readable metadata for search engines, social tools, and other
  software.

Only add facts that are also true and visible to readers. Do not use
`semantic` just to add hidden search keywords.

### Review Example

```yaml
semantic:
  kind: review
  item:
    type: book
    name: "Example Book"
    author: "Example Author"
    url: "https://example.com/book"
  rating:
    value: 4
    best: 5
  summary: "A short visible summary of what is being reviewed."
```

The reviewed item `type` can be:

- `article`
- `audio`
- `book`
- `creative-work`
- `dataset`
- `event`
- `software`
- `video`

The rating is optional. If there is no clear rating, leave it out.

### Event Example

```yaml
semantic:
  kind: event
  name: "TPM Reading Group"
  startDate: 2026-06-01T19:00:00-04:00
  attendance: online
  location:
    type: online
    url: "https://example.com/live"
```

Use events only for real events with a clear date or time. If the page only
mentions an event in passing, do not add event metadata.

### Media, Book, Dataset, Software, And FAQ Examples

```yaml
semantic:
  kind: video
  name: "Interview Title"
  url: "https://example.com/video"
  embedUrl: "https://example.com/embed/video"
  uploadDate: 2026-06-01
```

```yaml
semantic:
  kind: dataset
  name: "Example Meme Dataset"
  description: "A short description of the dataset."
  url: "https://example.com/dataset"
  license: "https://creativecommons.org/licenses/by/4.0/"
```

```yaml
semantic:
  kind: faq
  items:
    - question: "Who is this for?"
      answer: "Readers who want a concise answer visible on the page."
```

Ask a maintainer before using `semantic` if you are unsure. It is better to
omit this metadata than to publish inaccurate structured data.

## Write The Article Body

The page title is already created from frontmatter, so start body headings at
`##`, not `#`.

```md
## Main Section

Text here.

### Smaller Section

More text here.
```

Use normal Markdown links for ordinary links:

```md
See the [Know Your Meme entry](https://knowyourmeme.com/).
```

For footnotes, citations, and bibliography entries, use the project citation
format documented in
[`../docs/ARTICLE_REFERENCE_AUTHORING.md`](../docs/ARTICLE_REFERENCE_AUTHORING.md).
The short version:

- explanatory notes use `[^note-something]`;
- source citations use `[^cite-source-key]`;
- bibliography source data goes in a hidden `tpm-bibtex` block.

Ask a maintainer if you are unsure whether something should be an ordinary link
or a bibliography citation.

## Add Images

Put article-specific images in a folder matching the article slug:

```text
site/assets/articles/my-new-article/
  cover.png
  diagram.png
```

Use them in the article like this:

```md
![Alt text describing the image](../../../assets/articles/my-new-article/diagram.png)
```

Use a preview image in frontmatter like this:

```yaml
image: "../../../assets/articles/my-new-article/cover.png"
imageAlt: "Short description of the cover image."
```

If an image is reused by several articles or pages, put it in:

```text
site/assets/shared/
```

Do not add new article images to `public/`, `unused-assets/`, or random folders.
Images in `site/assets/` are checked and optimized by the site.

Alt text should describe what the image communicates. Decorative logos may have
minimal alt text or be handled by the component, but article images should
usually have useful alt text.

## Add An Announcement

Announcements are article-like posts for site news, calls to action, or short
updates. Put them in:

```text
site/content/announcements/<announcement-slug>.md
```

Example:

```text
site/content/announcements/forum-update.md
```

This becomes:

```text
/announcements/forum-update/
```

Announcement frontmatter is almost the same as article frontmatter:

```md
---
title: "Forum Update"
description: "A short summary of the announcement."
date: 2026-05-01
author: "The Philosopher's Meme"
updated: 2026-05-02
tags: []
---

Announcement body starts here.
```

Announcements appear on the announcements page, can appear in RSS, and the
newest homepage-visible announcements appear on the homepage.

The optional `updated` field works the same way as article `updated`: use it
only for substantive changes to a published announcement.

Use `visibility` if an announcement should have a direct link but stay out of
homepage, RSS, search, or directory lists:

```yaml
visibility:
  homepage: false
  directory: false
  search: false
  feed: false
```

Announcements do not use the article PDF setting.

## Edit Featured Articles And Start Here

Homepage curation is managed with collections:

- `content/collections/featured.md` controls Featured Articles.
- `content/collections/start-here.md` controls Start Here.

Each collection lists article or announcement slugs in the order they should
appear.

Simple item:

```yaml
items:
  - what-is-a-meme
  - homesteading-the-memeosphere
```

Item with custom display note:

```yaml
items:
  - slug: what-is-a-meme
    note: A clear entry point into TPM's approach to memes and humor.
```

The slug is the filename without `.md` or `.mdx`. It can point to an article or
an announcement. If a slug is misspelled, the checks will fail with a message
naming the missing entry.

The body text in a collection file is mainly editorial notes for now. The
public collection page uses the frontmatter title, description, and item list.

## Add A New Collection

Collections are curated reading lists. Add a file in:

```text
site/content/collections/<collection-slug>.md
```

Example:

```md
---
title: "Meme Theory Basics"
description: "A short path through introductory TPM articles."
items:
  - what-is-a-meme
  - memes-are-not-jokes-they-are-diagram-games
  - homesteading-the-memeosphere
---

Internal notes about why this collection exists.
```

This creates:

```text
/collections/meme-theory-basics/
```

It also appears on:

```text
/collections/
```

Use `draft: true` in collection frontmatter if the collection is not ready to
show publicly.

## Edit Authors

Author files live in:

```text
site/content/authors/
```

Example:

```md
---
displayName: "Author Name"
type: "person"
aliases:
  - "Author Name"
shortBio: "Optional short author bio."
website: "https://example.com"
socials:
  - label: "Website"
    href: "https://example.com"
---
```

The `author` field in articles and announcements should match either
`displayName` or one of the `aliases`.

Ask a maintainer before adding a new author profile unless you have been asked
to do it.

Allowed author `type` values:

- `person`
- `organization`
- `collective`
- `anonymous`

## Edit Categories

Categories are based on article folders. The matching display metadata lives in:

```text
site/content/categories/<category-folder>.json
```

Example:

```json
{
  "title": "Media Theory",
  "description": "Articles about media theory and internet culture.",
  "order": 9
}
```

Ask a maintainer before adding, renaming, or removing a category. Category
changes affect URLs, navigation, archives, and old links.

## Edit Home And About Pages

Standalone pages live in:

```text
site/content/pages/
```

Important files:

- `index.md`: homepage text and hero metadata.
- `about.md`: about page content.

You can edit ordinary Markdown body text directly. Be more careful with
frontmatter such as hero images, because those values connect to page layout.

## Edit Site Settings

Most site-wide settings are in:

```text
site/config/site.json
```

Common things a webmaster might change there:

- site title and description;
- site identity metadata such as language, locale, publisher type, logo,
  theme color, and official social profiles;
- primary and footer navigation links;
- homepage labels, discovery links, empty-state text, and list limits;
- support links;
- share-menu targets and social handles;
- metadata settings such as which optional semantic profiles authors may use;
- feature switches;
- default visibility and PDF behavior.

The `identity.sameAs` list should contain only official public profiles for
the site or publication. These links are used for machine-readable publisher
metadata and social/SEO context, not as ordinary footer links.

For English-language sites, `identity.language` and `identity.locale` can stay
simple:

```json
{
  "identity": {
    "language": "en",
    "locale": "en_US"
  }
}
```

Use `language` for the web page language tag. It should use hyphens when it has
a region, such as `fr-CA` or `ar-EG`. Use `locale` for social preview metadata.
It should use Open Graph format, such as `fr_CA` or `ar_EG`.

If you change the site to a non-English language, also translate homepage
labels, homepage empty-state text, and homepage discovery-link labels. The site
doctor will warn if a non-English site is still using the default English
platform labels.

Most omitted optional fields have safe defaults. For example, articles and
announcements are visible in directories, search, RSS, and homepage surfaces by
default unless their frontmatter or the site defaults say otherwise. PDFs are
enabled by default for articles that can be rendered as PDFs.

Site owners can disable advanced semantic profile kinds if they do not fit the
publication:

```json
{
  "metadata": {
    "semanticProfiles": {
      "enabled": ["review", "event", "book", "video"]
    }
  }
}
```

Leave this setting out to allow every supported profile kind.

After changing `site/config/site.json`, run:

```sh
bun run site:doctor
```

If the schema check says `site/config/site.schema.json` is stale, a maintainer
can regenerate it with:

```sh
bun run site:schema
```

## Edit Theme

Site-owned colors, fonts, radius, and shadows live in:

```text
site/theme.css
```

Small color or theme-token changes belong there. Avoid one-off styling inside
articles. If a visual change affects layout or components, ask a maintainer.

## Run Checks

If you can use the terminal, install dependencies once:

```sh
bun install
```

Run the author-facing check after content edits:

```sh
bun run author:check
```

If the only issue is tag normalization, run:

```sh
bun run author:fix
```

Then run the check again:

```sh
bun run author:check
```

If you cannot run local checks, it is still okay to open a pull request. GitHub
will run checks automatically, and maintainers can help interpret failures.

## Submit A Pull Request

### With GitHub Desktop

1. Open the repository in GitHub Desktop.
2. Click **Fetch origin**, then **Pull origin** if it appears.
3. Create a new branch with a clear name, such as
   `article/my-new-article`.
4. Make your edits inside `site/`.
5. Review the changed files in GitHub Desktop.
6. Write a short commit message, such as `Add my new article`.
7. Click **Commit**.
8. Click **Push origin**.
9. Click **Create Pull Request**.
10. In GitHub, make sure the base branch is `main`, then submit the pull
    request.

### With The Terminal

```sh
git switch main
git pull
git switch -c article/my-new-article
```

Make your edits, then:

```sh
bun run author:check
git add site/
git commit -m "Add my new article"
git push -u origin article/my-new-article
```

Then open:

```text
https://github.com/seongyher/tpm-site
```

GitHub should show a button to compare your branch and open a pull request.

## Pull Request Checklist

Before asking for review:

- The article or announcement is in the correct folder.
- The filename is lowercase words separated by hyphens.
- Required frontmatter is present.
- The author exists in `content/authors/` or a maintainer knows to add them.
- Tags are lowercase, unique, and do not contain `/`.
- Images live under `site/assets/`.
- Article images have useful alt text.
- Body headings start at `##`, not `#`.
- Featured and Start Here slugs match real article or announcement filenames.
- `draft: true` is used for unpublished work.
- `visibility` is used only when a published page should be hidden from a
  specific surface.
- `bun run author:check` passes, if you can run it.

If a check fails and you do not understand it, leave a comment on the pull
request and ask for help. Do not open a second pull request for the same
article unless a maintainer asks.

## When To Ask A Maintainer

Ask before:

- creating or renaming a category;
- adding a new author profile;
- using MDX or importing components;
- changing `config/site.json` feature switches or routes;
- changing `theme.css` layout-related tokens;
- editing `public/CNAME`, redirects, or deployment-related files;
- moving old assets out of `unused-assets/`.

Most ordinary article, announcement, image, tag, and collection edits can be
submitted directly for review.
