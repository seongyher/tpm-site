# Author Tutorial

This guide is for article authors who want to submit a new article to The
Philosopher's Meme. It assumes you are not familiar with Git, GitHub, branches,
commits, or pull requests.

You do not need to edit the website code to publish a normal article. Most of
the time, you will add one Markdown file and, optionally, some image files.

The GitHub repository is:

```text
https://github.com/seongyher/tpm-site.git
```

## Plain-English GitHub Terms

- **Repository**: the project folder on GitHub. This site lives at
  `https://github.com/seongyher/tpm-site`.
- **Clone**: download a copy of the repository to your computer.
- **Pull**: update your local copy with the latest changes from GitHub.
- **Branch**: a safe working copy for your article. You make changes on a
  branch so the live site is not changed immediately.
- **Commit**: a saved snapshot of your changes with a short message.
- **Push**: upload your branch and commits to GitHub.
- **Pull request**: a request for maintainers to review your branch and merge it
  into the site.
- **Merge**: accept the pull request. After merging to `main`, GitHub builds
  and publishes the site.

## Recommended Tools

Install these first:

1. **Git**: required for working with the repository.
   Install it from `https://git-scm.com/install`.
2. **GitHub Desktop**: easiest way to pull, branch, commit, push, and open a
   pull request. Install it from `https://github.com/apps/desktop`.
3. **A text editor**: Visual Studio Code is a good default.
4. **Bun**: used to run site checks locally.
   Install it from `https://bun.com/docs/installation`.

If you do not want to use the terminal at all, you can still submit an article
with GitHub Desktop and let GitHub run the checks after you open a pull request.
Running checks locally is recommended, but maintainers can help with failures.

## What You Will Add

Most articles need only:

- one Markdown file in `site/content/articles/<category>/`;
- optional images in `site/assets/articles/<article-slug>/`;
- optional notes or bibliography citations when the article needs them;
- a pull request for review.

Use `.md` for normal articles. Use `.mdx` only when a maintainer tells you the
article needs custom components.

## 1. Get The Site On Your Computer

### GitHub Desktop

1. Open GitHub Desktop.
2. Choose **File > Clone repository**.
3. Choose the **URL** tab.
4. Paste:

   ```text
   https://github.com/seongyher/tpm-site.git
   ```

5. Choose where the folder should live on your computer.
6. Click **Clone**.

If GitHub says you do not have permission to push changes, ask a maintainer for
access or ask them whether they want you to submit from a fork.

### Terminal Option

If you are comfortable with the terminal:

```sh
git clone https://github.com/seongyher/tpm-site.git
cd tpm-site
```

## 2. Get The Latest Version Before You Start

Always update your local copy before starting a new article.

### GitHub Desktop

1. Open the repository in GitHub Desktop.
2. Click **Fetch origin**.
3. If the button changes to **Pull origin**, click **Pull origin**.

### Terminal Option

```sh
git switch main
git pull
```

## 3. Create A Branch For Your Article

A branch keeps your article changes separate until they are reviewed.

### GitHub Desktop

1. Click the **Current Branch** menu.
2. Click **New Branch**.
3. Name it something short, such as:

   ```text
   article/my-new-article
   ```

4. Click **Create Branch**.

### Terminal Option

```sh
git switch -c article/my-new-article
```

Use lowercase words and hyphens in branch names.

## 4. Pick A Category

Current article category folders are:

- `site/content/articles/aesthetics/`
- `site/content/articles/game-studies/`
- `site/content/articles/history/`
- `site/content/articles/irony/`
- `site/content/articles/memeculture/` (`Culture`)
- `site/content/articles/metamemetics/`
- `site/content/articles/philosophy/`
- `site/content/articles/politics/`

Ask a maintainer before creating a new category.

## 5. Make A New Category

Most authors should use an existing category. Only make a new category if a
maintainer agrees that the site needs one.

A category needs two things:

1. a folder for articles;
2. a matching metadata file for the category title and order.

Example new category:

```text
site/content/articles/media-theory/
site/content/categories/media-theory.json
```

The folder name becomes the category URL:

```text
/categories/media-theory/
```

Category folder rules:

- use lowercase letters, numbers, and hyphens;
- do not use spaces;
- keep the folder name short and readable.

The metadata file must use the same name as the folder. For
`site/content/articles/media-theory/`, create:

```text
site/content/categories/media-theory.json
```

Start with this JSON:

```json
{
  "title": "Media Theory",
  "order": 9
}
```

Optional category description:

```json
{
  "title": "Media Theory",
  "description": "Articles about media theory and internet culture.",
  "order": 9
}
```

`title` is the display name. `order` controls where the category appears in
category navigation. Pick the next sensible number, or ask a maintainer where it
should go.

After adding a category, put the article in the new folder:

```text
site/content/articles/media-theory/my-new-article.md
```

## 6. Pick The Article Slug

The filename becomes the public URL.

Example:

```text
site/content/articles/history/my-new-article.md
```

becomes:

```text
/articles/my-new-article/
```

Slug rules:

- use lowercase letters, numbers, and hyphens;
- do not use spaces;
- do not include the date;
- keep it short and readable.

Good:

```text
my-new-article.md
```

Avoid:

```text
2026-04-30 My New Article.markdown
```

## 7. Create The Article File

Create a new `.md` file in the category folder.

Example path:

```text
site/content/articles/history/my-new-article.md
```

Start with this template:

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

Notes:

- `title` is the article title shown on the page.
- `description` should be brief and useful.
- `date` should use `YYYY-MM-DD`.
- `updated` is optional. Use it only for substantive revisions after
  publication, not typo fixes or formatting-only edits.
- `author` should match an existing author display name or alias in
  `site/content/authors/`.
- `tags` are optional, but useful.
- `image` and `imageAlt` are optional, but recommended when the article has a
  preview image.
- Add `draft: true` if the article should not publish yet.

Do not add `slug`, `category`, or `topic` frontmatter. The slug comes from the
filename. The category comes from the folder.

If this is a new author, ask a maintainer before submitting. The maintainer may
add a new file in `site/content/authors/<author-slug>.md` with the author's
display name, type, and approved aliases. Do not invent biographies, websites,
or social links for an author.

## 8. Write The Article Body

The article title is already the page's main heading. Inside the article body,
start headings at `##`, not `#`.

Use:

```md
## Introduction

Text here.

### A Smaller Section

More text here.
```

Avoid:

```md
# Introduction
```

## 9. Add Notes And Sources

Most article prose can use ordinary Markdown links. Use the special note and
citation syntax only when you want the site to create article footnotes,
article bibliography entries, or global bibliography entries.

There are three common cases:

1. **Ordinary link**: use this for context, examples, archives, or a place you
   simply want readers to visit.
2. **Explanatory note**: use this for a side comment that would interrupt the
   paragraph.
3. **Bibliography citation**: use this when a source supports a claim and
   should appear in the article bibliography and the site-wide bibliography.

### Ordinary Links

Use a normal Markdown link when the link is part of the prose.

```md
For background, see the [Know Your Meme entry](https://knowyourmeme.com/).
```

Ordinary links do not appear in the bibliography. That is intentional. A link is
not automatically a source citation.

### Explanatory Notes

Use a note when you want to add extra context without making the paragraph
heavier.

```md
This meme circulated mostly in small Facebook groups.[^note-small-groups]

[^note-small-groups]:
    The exact group boundaries were fuzzy because many users
    shared screenshots across several related groups.
```

The note label can be any short lowercase name after `note-`. Use words and
hyphens, not spaces.

Good:

```md
[^note-small-groups]
```

Avoid:

```md
[^1]
[^Small Groups]
```

Each explanatory note should be used once. If you need to point to the same
source several times, use a bibliography citation instead.

### Bibliography Citations

Use a bibliography citation when a source supports a claim.

The citation has two parts:

1. a short citation marker in the paragraph;
2. a hidden BibTeX entry later in the article file.

Example:

````md
Internet memes often depend on shared participatory practice.[^cite-shifman-2015]

```tpm-bibtex
@book{shifman-2015,
  author = {Shifman, Limor},
  title = {Memes in Digital Culture},
  publisher = {MIT Press},
  year = {2015},
  url = {https://mitpress.mit.edu/9780262525435/memes-in-digital-culture/}
}
```
````

In the article, the citation marker will render as a bracketed number, such as
`[1]`. The `tpm-bibtex` block will not be shown to readers. The site uses it to
make the article bibliography and the global bibliography page.

The marker and BibTeX key must match:

```md
[^cite-shifman-2015]
```

matches:

```bibtex
@book{shifman-2015,
```

Notice that the marker includes `cite-`, but the BibTeX key does not.

Rules:

- citation labels use lowercase words, numbers, and hyphens;
- do not add a normal footnote definition like `[^cite-shifman-2015]: ...`;
- put the source details inside a `tpm-bibtex` code block;
- do not use a plain `bibtex` code block unless you intentionally want visible
  code in the article;
- do not add placeholder citations such as `citation = {^}` or `title = {TBD}`;
- it is okay to cite the same source more than once with the same marker.

If you use Zotero, Google Scholar, or another citation manager, copying BibTeX
is usually the easiest starting point. It is fine if you are not sure whether
the BibTeX is perfect. Include the best source data you have, and a maintainer
can help clean it up.

If a page number matters, write it in the sentence for now:

```md
Shifman describes this as participatory culture (p. 42).[^cite-shifman-2015]
```

There is not yet a special page-number syntax. Keeping page numbers in the prose
is the safest current approach.

If you have a long source list or appendix that is not tied to one exact
sentence, ask a maintainer before converting it. The site can support
bibliography-only source entries, but preserving the author's intent matters
more than forcing every source into a new format.

## 10. Add Images

Put article images in a folder that matches the article slug:

```text
site/assets/articles/my-new-article/
  cover.png
  diagram.png
```

Reference images from the article with a relative path:

```md
![Alt text describing the image](../../../assets/articles/my-new-article/diagram.png)
```

For a preview image in frontmatter:

```yaml
image: "../../../assets/articles/my-new-article/cover.png"
imageAlt: "Short description of the cover image."
```

If an image is shared by multiple articles, put it in:

```text
site/assets/shared/
```

Do not put article images in `site/public/`, root-level folders, `uploads/`, or
`assets/`. Images should normally go through `site/assets/`.

Alt text should describe the image for a reader who cannot see it. Keep it
plain and specific.

## 11. Check The Site Locally

If you can use the terminal, install dependencies once:

```sh
bun install
```

Run the normal checks:

```sh
bun run author:check
```

Helpful review checks:

```sh
bun run review:markdown
bun run review:assets
```

If a check reports a formatting or linting issue, you can try the safe automatic
fix command:

```sh
bun run author:fix
```

Then run `bun run author:check` again. `bun run author:fix` only applies safe
tag normalization. Maintainers may ask you to run broader checks such as
`bun run check`, `bun run build`, and `bun run verify` when a change touches
code, config, or generated-output behavior.

If Markdown review asks for mechanical Markdown formatting, use this separately:

```sh
bun run fix:markdown
```

Only run Markdown formatting when you are comfortable reviewing the article diff
afterward.

Preview the built site:

```sh
bun run preview:fresh
```

Then open the local preview URL shown in the terminal.

## 12. Common Problems

If the check says the filename is not URL-safe, rename the article so it uses
only lowercase letters, numbers, and hyphens.

If the check says there is a duplicate slug, another article already uses that
filename. Pick a different filename.

If the check says a category folder or category metadata filename is not
URL-safe, rename it so it uses only lowercase letters, numbers, and hyphens.

If the check says an image is outside `site/assets/`, move it into
`site/assets/articles/<article-slug>/` or `site/assets/shared/`.

If Markdown review complains about multiple `H1` headings, change body headings
from `#` to `##`, `##` to `###`, and so on.

If the check says an article reference label is invalid, use `note-*` for
explanatory notes or `cite-*` for bibliography citations. Plain numbered
footnotes such as `[^1]` are not allowed in published articles.

If the check says a citation is missing a BibTeX entry, add a matching entry to
a `tpm-bibtex` block. For `[^cite-shifman-2015]`, the matching BibTeX entry
starts with `@book{shifman-2015, ...}` or another BibTeX type using the same
key.

If the check says BibTeX is malformed, check for missing braces, missing commas,
or placeholder fields. A bibliography entry needs real source text, not a
placeholder.

If the check says tags need normalization, run:

```sh
bun run author:fix
```

This can safely trim whitespace, lowercase tags, and remove duplicate tags.
Slash-containing tags still need a manual edit.

## 13. Save Your Changes As A Commit

A commit is a saved snapshot of your article changes.

### GitHub Desktop

1. Open GitHub Desktop.
2. Click the **Changes** tab.
3. Review the changed files. Make sure you only changed the article and related
   assets.
4. In the **Summary** box, write a short message, such as:

   ```text
   Add my new article
   ```

5. Click **Commit to article/my-new-article**.

### Terminal Option

```sh
git add site/content/articles site/assets
git commit -m "Add my new article"
```

## 14. Push Your Branch To GitHub

Pushing uploads your branch to GitHub so maintainers can review it.

### GitHub Desktop

Click **Push origin**.

### Terminal Option

```sh
git push -u origin article/my-new-article
```

## 15. Open A Pull Request

A pull request is how you ask maintainers to review and publish your article.

### GitHub Desktop

1. After pushing, GitHub Desktop should show a **Preview Pull Request** or
   **Create Pull Request** button.
2. Click it. GitHub will open in your browser.
3. Set the pull request title to something clear, such as:

   ```text
   Add my new article
   ```

4. In the description, include anything reviewers should know.
5. Click **Create pull request**.

### GitHub Website

If GitHub Desktop does not show the button:

1. Go to `https://github.com/seongyher/tpm-site`.
2. GitHub may show a banner for your recently pushed branch.
3. Click **Compare & pull request**.
4. Check that the base branch is `main`.
5. Check that the compare branch is your article branch.
6. Click **Create pull request**.

## 16. Wait For Checks And Review

After you open a pull request, GitHub runs automatic checks.

Blocking checks must pass before the article can be merged. Review-only checks
are useful warnings but do not automatically block publishing.

If a check fails:

1. Open the failed check on GitHub.
2. Read the message. It usually lists the file and problem.
3. If you know how to fix it, make the fix locally.
4. Commit the fix.
5. Push again. The pull request updates automatically.

If you do not understand the failure, leave a comment on the pull request and
ask a maintainer for help.

## 17. Respond To Review Comments

Maintainers may leave comments or request changes.

If they ask for changes:

1. Make the requested edits on the same branch.
2. Commit the edits.
3. Push again.
4. Reply to the comment if needed.

Do not open a second pull request for the same article unless a maintainer asks.

## 18. Pull Request Checklist

Before asking for review:

- The article file is in the right category folder.
- New categories, if any, have a matching folder and JSON metadata file.
- The filename slug is URL-safe.
- The frontmatter has `title`, `description`, `date`, and `author`.
- `updated`, if present, marks a real post-publication revision.
- The `author` value matches an existing author profile or a maintainer has
  added the new author metadata.
- Images live under `site/assets/`.
- Meaningful images have alt text.
- Body headings start at `##`, not `#`.
- Explanatory notes use `note-*`, not plain numbered footnotes.
- Bibliography citations use `cite-*` markers and matching `tpm-bibtex` entries.
- Ordinary links are intentionally left out of the bibliography unless you also
  cite them.
- `bun run check`, `bun run build`, and `bun run verify` pass if you can run
  local checks.

GitHub will run additional checks after you open the pull request. Some checks
are review warnings only. A maintainer can help interpret them.
