# Public Documentation Site

The docs-site instance should be both a platform example and the public
documentation experience. It should teach by editing the same files a real site
owner edits, then link readers into deeper reference when they need it.

## Goals

- Reduce time to first successful edit.
- Keep pages focused and task-oriented instead of monolithic.
- Front-load commands and file paths that let a reader run, edit, and validate
  the example quickly.
- Explain the platform/site-instance split through concrete examples before
  abstract architecture.
- Keep reference pages available for users who need complete contracts.

## Audience Paths

New users should be able to follow this path without understanding the entire
platform:

1. Run the docs site locally.
2. Add or edit an article.
3. Put content on the homepage.
4. Change site identity or navigation.
5. Change theme colors.
6. Validate the site.

Authors need pages for content files, frontmatter, images, citations,
collections, PDFs, and visibility.

Webmasters need pages for site config, homepage config, navigation, feature
flags, support/social/share, redirects, local previews, checks, and external
site instances.

Maintainers need reference pages for commands, frontmatter, config, modules,
theme contracts, and customization boundaries.

## Audience Definitions

Public docs should route readers by what they are trying to accomplish, not by
the platform's internal architecture.

| Audience           | Primary desire                                                                                             | What the docs should hide at first                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Author             | Write or revise content and submit it safely.                                                              | Astro internals, route generation, schema implementation, and deploy details.                              |
| Site owner         | Change site identity, navigation, homepage curation, features, theme, redirects, and support/social links. | Component implementation, generated-output internals, and provider-specific deploy mechanics until needed. |
| Deploy operator    | Preview, validate, release, deploy, roll back, and triage production issues.                               | Content-writing details unless diagnostics point there.                                                    |
| Developer          | Extend platform behavior while preserving contracts and release checks.                                    | Beginner author guidance except as product context.                                                        |
| Extension author   | Add portable UI, deploy, media, metadata, diagnostics, or workflow extensions.                             | TPM-specific content and platform-private implementation details.                                          |
| Future studio user | Use GUI/CLI/MCP tools to edit and publish without understanding source files.                              | Git, frontmatter, Cloudflare, and build artifacts unless they choose advanced modes.                       |

Docs may share pages across audiences, but each page should still name the
reader it primarily serves.

## First-Success Journey

The default public-docs journey should be short enough for a non-technical site
owner to complete without learning the whole repository.

1. **Open or clone the example site.**
   Show the smallest path to getting files locally. For the current repo this
   means Git/GitHub Desktop; for the future studio this should become the
   one-click project setup path.
2. **Run the site.**
   Use Bun commands and explain that the preview is local.
3. **Add one article.**
   Give one Markdown file path, one minimal frontmatter block, one body
   example, and one image example.
4. **Put it somewhere visible.**
   Show default visibility, Featured, Start Here, and collections as the first
   curation levers.
5. **Validate.**
   Use `just author-check` and explain diagnostics in author language.
6. **Publish or submit.**
   For the current repo this means a pull request. Future studio docs should
   translate the same source contracts into "publish" and optional "submit for
   review" actions.

Every deeper page should connect back to this journey so users can recover
from getting lost in reference material.

## Information Architecture

The docs site uses five top-level article categories:

- **Getting Started:** short first-success tasks.
- **Authoring:** content creation and editorial workflow.
- **Configuration:** site-wide config surfaces.
- **Operations:** local development, checks, preview, deployment model, and
  troubleshooting.
- **Reference:** durable contracts and module boundaries.

Each page should answer one question. Prefer creating a new page over expanding
an existing page past a clear task boundary.

## Target Page Map

The public docs site should eventually expose these pages or page families.
The slugs are target IA, not a requirement to create route files in this pass.

### Getting Started

| Page                        | Primary audience  | Purpose                                                                            |
| --------------------------- | ----------------- | ---------------------------------------------------------------------------------- |
| `/docs/start/`              | new user          | Install/open the project, run a local preview, and know where editable files live. |
| `/docs/start/add-article/`  | author            | Add the smallest valid article and run the author check.                           |
| `/docs/start/publish/`      | author/site owner | Submit or publish the change through the current workflow.                         |
| `/docs/start/site-anatomy/` | site owner        | Explain `site/` versus platform code through concrete files.                       |

### Authoring

| Page                                 | Primary audience  | Purpose                                                                                           |
| ------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| `/docs/authoring/articles/`          | author            | Article file placement, required metadata, body headings, Markdown, MDX escape hatch, and checks. |
| `/docs/authoring/announcements/`     | author            | Announcement entries, RSS/search/default visibility, and differences from articles.               |
| `/docs/authoring/pages/`             | author/site owner | Standalone pages such as Home and About.                                                          |
| `/docs/authoring/images/`            | author            | Asset placement, preview images, alt text, optimization, captions, and image troubleshooting.     |
| `/docs/authoring/citations/`         | author            | Notes, citations, BibTeX blocks, bibliography previews, and source verification expectations.     |
| `/docs/authoring/collections/`       | author/site owner | Featured, Start Here, custom collections, item ordering, draft collections, and slug repair.      |
| `/docs/authoring/visibility/`        | author/site owner | Drafts, visibility overrides, PDF toggles, RSS/search/sitemap surfaces, and safe defaults.        |
| `/docs/authoring/semantic-metadata/` | advanced author   | Review/event/media/dataset/software/FAQ metadata, visible truth requirements, and validation.     |

### Configuration

| Page                                 | Primary audience           | Purpose                                                                                          |
| ------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------ |
| `/docs/config/site-config/`          | site owner                 | Site identity, language, publisher facts, routes, and feature switches.                          |
| `/docs/config/homepage/`             | site owner                 | Homepage labels, panels, featured collections, announcements, discovery links, and empty states. |
| `/docs/config/navigation/`           | site owner                 | Primary/footer navigation, categories, reading links, and More/Read surfaces.                    |
| `/docs/config/support-social-share/` | site owner                 | Patreon/Discord/social links, share targets, handles, and CTA button assets.                     |
| `/docs/config/redirects/`            | site owner/deploy operator | Hand-written redirects, legacy URLs, generated redirects, duplicate detection, and validation.   |
| `/docs/config/theme/`                | site owner                 | Theme tokens, colors, fonts, radius, and safe visual edits.                                      |

### Operations

| Page                              | Primary audience           | Purpose                                                                                              |
| --------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/docs/operations/checks/`        | author/deploy operator     | `just author-check`, `just site-doctor`, release checks, JSON diagnostics, and when to ask for help. |
| `/docs/operations/deploy/`        | deploy operator            | Current Cloudflare Worker deployment flow, verified artifacts, domain notes, and rollback posture.   |
| `/docs/operations/observability/` | site owner/deploy operator | Webmaster imports, route-linked reports, noise triage, and diagnostic escalation.                    |
| `/docs/operations/performance/`   | deploy operator/developer  | Payload budgets, Lighthouse, cache headers, image optimization, and route-class budgets.             |
| `/docs/operations/pdf-scholar/`   | site owner/author          | PDF eligibility, Google Scholar metadata, fallbacks, and opt-out behavior.                           |

### Reference

| Page                           | Primary audience           | Purpose                                                                                    |
| ------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------ |
| `/docs/reference/frontmatter/` | author/developer           | Generated frontmatter schema reference and examples.                                       |
| `/docs/reference/site-config/` | site owner/developer       | Generated site config schema reference and examples.                                       |
| `/docs/reference/routes/`      | developer/deploy operator  | Route registry, redirects, generated outputs, and compatibility rules.                     |
| `/docs/reference/components/`  | developer/extension author | Component inventory, layout primitives, extension boundaries, and accessibility contracts. |
| `/docs/reference/extensions/`  | extension author/developer | Future extension API, bundled extensions, and ownership rules.                             |
| `/docs/reference/commands/`    | maintainer/developer       | Package scripts, check tiers, release checks, and CI parity.                               |

## Author Path Details

The authoring path should keep a strict distinction between common tasks and
advanced escape hatches.

Common article path:

1. Create `site/content/articles/<category>/<slug>.md`.
2. Add `title`, `description`, `date`, and `author`.
3. Add optional `tags`, `image`, and `imageAlt` when useful.
4. Put article images in `site/assets/articles/<slug>/`.
5. Write body headings starting at `##`.
6. Run `just author-check`.

Common announcement path:

1. Create `site/content/announcements/<slug>.md`.
2. Use article-like metadata.
3. Rely on default visibility unless the announcement needs a direct URL but
   should stay out of homepage, RSS, search, or directories.
4. Run `just author-check`.

Common collection path:

1. Edit `site/content/collections/featured.md`,
   `site/content/collections/start-here.md`, or create a new collection file.
2. Add article or announcement slugs in explicit display order.
3. Use `draft: true` for unfinished collections.
4. Run `just site-doctor` or `just author-check` to catch misspelled
   slugs.

Common image path:

1. Store source images in `site/assets/`, not `site/public/`.
2. Write useful alt text for article images.
3. Use `site/public/` only for root-level static files such as favicons,
   `robots.txt`, `CNAME`, `_headers`, and verification files.
4. Let Astro optimize publication images instead of linking to arbitrary
   generated output.

Common redirect path:

1. Add site-owned hand-written redirects to `site/config/redirects.json`.
2. Prefer fixing broken internal content links directly when the source link is
   wrong.
3. Use redirects for legacy public URLs, moved routes, and compatibility URLs
   that external sites may still cite.
4. Run `just site-doctor` to catch duplicate redirects, chains, and route
   conflicts.

Common site settings path:

1. Edit `site/config/site.json` for identity, routes, navigation, homepage,
   support/social/share, feature flags, metadata defaults, and visibility
   defaults.
2. Keep hidden metadata truthful and consistent with visible page facts.
3. Run `just site-doctor`.
4. Regenerate schema references only when schema contracts change.

Advanced pages should describe MDX components, semantic profiles, PDF
fallbacks, generated references, and deploy/provider details, but they should
not be prerequisites for publishing a normal article.

## Page Pattern

Documentation pages should usually include:

- a short explanation of what the page is for;
- the files the user edits;
- a minimal copy-pasteable example;
- the command that verifies the change;
- common mistakes or confusion points;
- next links into related docs.

Code examples should use real platform paths and commands. Configuration
examples should be small excerpts instead of full config files unless the full
file is the subject of the page.

## Non-Goals

- Do not build a custom docs UI in this pass.
- Do not add a separate docs framework.
- Do not generate reference pages from schemas yet, although future generated
  docs should reuse the same content organization.
- Do not start GUI work.

## Implementation Milestones

1. Add focused docs pages for first-run onboarding, content edits, homepage
   customization, theme edits, validation, authoring, config, operations, and
   reference.
2. Reorganize docs-site categories and collections so the homepage teaches the
   intended path.
3. Update docs-site navigation and README around the public documentation role.
4. Verify with `just docs-check`, markdown review, and affected platform
   checks.
