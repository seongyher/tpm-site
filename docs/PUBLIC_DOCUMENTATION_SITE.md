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
collections, scholarly metadata, and visibility.

Webmasters need pages for site config, homepage config, navigation, feature
flags, support/social/share, redirects, local previews, checks, and external
site instances.

Maintainers need reference pages for commands, frontmatter, config, modules,
theme contracts, and customization boundaries.

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
4. Verify with docs-site build checks, markdown review, and affected platform
   checks.
