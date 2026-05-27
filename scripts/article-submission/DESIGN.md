# Article Submission Tool Design

This document defines the planned author-facing article submission tool.

The goal is to make article submission easy for non-technical authors while
protecting the repository from accidental unrelated changes.

## Proposed Command

```sh
just submit-article --file <path-to-markdown> --assets <path-to-assets> --category <category-slug>
```

The command should also support an interactive mode:

```sh
just submit-article
```

Missing options should be prompted for in plain terminal text.

## Main Goals

- Accept an article Markdown/MDX file from outside or inside the repo.
- Accept either one asset file or one asset folder.
- Place article and assets in the conventional repo locations.
- Validate article/category/asset state before submission.
- Run the same quality checks authors and reviewers care about.
- Create a well-formed pull request when GitHub CLI is available.
- Fall back to native `git` push plus a GitHub compare URL when `gh` is not
  available.
- Fall back to clear manual instructions when pushing is not possible.
- Refuse to operate when unrelated local changes are present.

## Cross-Platform Requirements

This tool must work on macOS, Windows, and Linux.

Use:

- a `just` recipe as the human command surface.
- Rust operations or a temporary TypeScript fallback behind that recipe while
  the article-submission workflow is being promoted.
- Node/Bun filesystem APIs.
- `node:path` for filesystem operations.
- `spawn`/`spawnSync` with argument arrays.
- plain terminal prompts.

Avoid:

- shell scripts;
- shell command strings;
- `cp`, `mv`, `mkdir`, `sed`, `grep`, `find`, `realpath`, or `test`;
- OS-specific commands such as `open`, `xdg-open`, or `start`;
- GitHub Desktop deep links as required behavior;
- assumptions about credential managers.

Displayed repository paths should use POSIX-style `/` separators even on
Windows.

## Safety Model

The tool is for article submissions only.

Before preparing, committing, or pushing, it must inspect the working tree and
abort if unrelated changes exist.

Allowed changed paths:

- `site/content/articles/**`
- `site/content/categories/**`
- `site/assets/**`

Optional allowed paths when the tool later manages templates or generated PR
body files:

- a temporary file under an ignored cache directory;
- a generated PR body in a temporary OS directory.

Disallowed examples:

- `src/components/**`
- `src/pages/**`
- `package.json`
- workflow/config files
- root docs

The tool should never stage the whole repository. It should stage only the
specific allowed files it prepared or validated.

## Modes

### Prepare Mode

Default behavior.

Prepare mode should:

1. validate the repo state;
2. collect or prompt for article path, category, assets, and slug;
3. copy or move files into the right locations;
4. validate the article and assets;
5. run checks;
6. print next steps.

Prepare mode must not commit, push, or open a pull request.

### Submit Mode

Explicit opt-in:

```sh
just submit-article --submit
```

Submit mode should run prepare mode first, then:

1. create or verify the submission branch;
2. stage only allowed files;
3. commit with a generated message;
4. push the branch;
5. create a pull request with `gh` if available and authenticated;
6. otherwise print a GitHub compare URL.

Submit mode must stop before committing if unrelated diffs appear.

## Inputs

Required or prompted:

- article file path;
- category slug;
- optional asset file or folder path;
- submit mode yes/no.

Optional:

- explicit article slug;
- title override;
- author override;
- date override;
- draft/ready-to-publish choice;
- create missing category yes/no;
- category title;
- category description;
- category order.

## Article Placement

Article source path:

```text
site/content/articles/<category>/<slug>.md
site/content/articles/<category>/<slug>.mdx
```

Slug defaults to the input filename stem.

Slug rules:

- lowercase letters;
- numbers;
- hyphens;
- no spaces;
- no date prefix;
- no duplicate slug across categories.

If the article file is already in the correct place, the tool should leave it in
place and continue validation.

If the article is inside `site/content/articles/` but in the wrong category, the
tool should ask before moving it.

## Category Handling

Existing categories are defined by:

```text
site/content/categories/*.json
```

Article folder:

```text
site/content/articles/<category>/
```

If the category does not exist, show the current categories and ask whether to
create a new one.

New category file:

```json
{
  "title": "Category Title",
  "order": 9
}
```

Optional:

```json
{
  "title": "Category Title",
  "description": "Short category description.",
  "order": 9
}
```

The tool should suggest the next `order` value by reading existing category
metadata.

## Asset Placement

Default article asset path:

```text
site/assets/articles/<slug>/
```

Shared assets should live in:

```text
site/assets/shared/
```

The tool should accept:

- no assets;
- one asset file;
- one asset directory.

If assets are already under `site/assets/`, leave them in place.

If assets are outside the repo, copy them into the target asset folder.

If an asset filename conflicts, fail with an actionable message rather than
overwriting.

The first implementation should not rewrite article image paths automatically
unless the transformation is straightforward and test-covered. It can instead
print the paths authors should use.

## Article Validation

Validate:

- file extension is `.md` or `.mdx`;
- frontmatter parses;
- required frontmatter exists:
  - `title`;
  - `description`;
  - `date`;
  - `author`;
- `date` is valid;
- `draft` is either absent or boolean;
- body headings do not start with `#`;
- image references resolve when they point into `site/assets/`;
- frontmatter `image`, if present, points into `site/assets/`;
- `imageAlt` exists when frontmatter `image` exists;
- no disallowed frontmatter fields such as `slug`, `topic`, or `category`;
- slug is URL-safe;
- category is URL-safe;
- article slug is unique.

Use Astro/content validation as the authority where possible, then add
tool-specific checks for author-friendly messages.

## Checks To Run

Blocking checks:

```sh
just check
just build
just verify
```

Review-only checks:

```sh
just review-markdown
just review-assets
```

Submit mode should require blocking checks to pass.

Review-only failures should be shown as warnings. They should not prevent
submission unless the author chooses to stop.

## Automatic Fixing

If blocking checks fail with formatting or linting issues, the tool may offer:

```sh
just fix
```

If Markdown review reports formatting issues, the tool may offer:

```sh
just fix-markdown
```

Markdown fixing should require confirmation because it may reformat article
content. The tool should remind authors to review the article diff afterward.

## Pull Request Creation

Preferred automated path:

1. Verify `gh --version`.
2. Verify `gh auth status`.
3. Push branch with native `git`.
4. Create PR with:

   ```sh
   gh pr create --base main --head <branch> --title <title> --body-file <file>
   ```

Fallback path when `gh` is missing or unauthenticated:

1. Use native `git` to commit and push if possible.
2. Print a compare URL:

   ```text
   https://github.com/seongyher/tpm-site/compare/main...<branch>?quick_pull=1
   ```

Final fallback when push fails:

1. Leave prepared files locally.
2. Print manual GitHub Desktop instructions.
3. Print terminal commands the author can ask a maintainer to help run.

## Pull Request Body

The tool should generate a clear PR body from a template.

Recommended fields:

- article title;
- category;
- slug;
- public URL;
- draft or ready to publish;
- assets added;
- local checks run;
- review-only warnings;
- notes for maintainers.

The template should live near the tool, for example:

```text
scripts/article-submission/templates/article-pr.md
```

## Article Template

Provide a starter article template for authors:

```text
scripts/article-submission/templates/article.md
```

The template should include:

- required frontmatter;
- optional tags;
- optional preview image;
- `draft: true` by default;
- `##` heading example;
- image example;
- short comments that explain what to replace.

The submit tool can offer to copy this template when the author starts without a
source file.

## Implementation Plan

### Phase 1: Prepare Tool

- Add `scripts/article-submission/submit-article.ts`.
- Add argument parsing and interactive prompts.
- Add category lookup and optional category creation.
- Add article placement.
- Add asset placement.
- Add author-friendly validation.
- Run blocking and review checks.
- Print next steps.
- Add focused unit tests for pure helpers.

### Phase 2: Submit Tool

- Add explicit `--submit`.
- Add branch creation/validation.
- Add unrelated-diff guard.
- Stage only allowed files.
- Commit with generated message.
- Push with native `git`.
- Create PR with `gh` when available.
- Fall back to compare URL/manual instructions.

### Phase 3: Polish

- Add article and PR templates.
- Add `--dry-run`.
- Add `--json` output for agent/tooling use.
- Add better image-reference assistance.
- Add screenshots or examples to the author tutorial if useful.

## Open Questions

- Should article files be copied or moved by default when the input file is
  outside the repo?
- Should new articles default to `draft: true`, or should the tool ask?
- Should the tool ever rewrite Markdown image references automatically?
- Should the branch name always be generated from the slug?
- Should `review:markdown` warnings be shown before or after PR creation?
