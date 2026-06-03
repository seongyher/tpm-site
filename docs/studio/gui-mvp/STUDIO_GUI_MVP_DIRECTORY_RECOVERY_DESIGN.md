# Studio GUI MVP Directory Recovery Design

This document covers `IRK-299`: the article directory and sidebar article tree
must feel like fast content-management surfaces, not oversized demo cards.

## Goals

- Make article browsing compact, stable, and easy to scan.
- Preserve the directory as the richer browse/manage surface while keeping the
  sidebar tree as quick navigation.
- Keep all interactions command-backed and fixture-backed.
- Make thumbnail dimensions impossible to vary accidentally.
- Avoid explanatory screen headings and subheadings that repeat navigation.

## Directory Shape

The default directory should be a single-column list of compact article rows.
Rows are easier to scan than a two-column card grid when the user is managing
titles, statuses, warnings, dates, tags, and open actions.

Each row contains:

- a fixed social-preview thumbnail area with `aspect-ratio: 1.91 / 1`;
- a compact metadata stack with status/category, title, excerpt or warning,
  author/date/read time, and a small tag set;
- trailing actions: `Open editor` and an overflow menu.

Rows must keep stable dimensions across:

- articles with images;
- articles without images;
- articles with missing image warnings;
- long titles and excerpts;
- compact desktop widths.

Warnings should be visible but not allowed to turn one row into a large alert
card. Use a compact warning badge or one-line warning text with an icon.

## Sidebar Tree Shape

The sidebar tree is quick navigation, not the primary management surface.

Requirements:

- one selected row at a time;
- folder collapse/expand is reducer-owned;
- single-click article open is deterministic;
- row icons stay small and aligned;
- warning/status markers remain compact;
- long titles truncate with the full title available through the native title
  attribute.

The sidebar should not also highlight `Articles` when an article row is
selected. Selection belongs to the currently opened screen or document.

## Implementation Notes

- Keep `ArticleDirectoryScreen` as a view over `ArticleDirectoryViewModel`.
- Do not parse source content or media in React components.
- Add a small directory row composition rather than growing one card component
  with layout booleans.
- Test stable thumbnail geometry with semantic test IDs that correspond to
  product structure, not test-only internals.
- Keep the tree state in `StudioAppState.collapsedArticleTreeNodeIds`.

## Verification

Automated checks should cover:

- directory rows render as a compact list;
- thumbnail boxes have matching dimensions and social-preview aspect ratio;
- missing-media rows do not become taller than normal rows by more than a
  small tolerance;
- search/filter/reset still use command-backed reducer state;
- `Open editor` switches articles on first click;
- sidebar folder collapse removes child rows and expand restores them;
- sidebar selection remains singular.

Manual visual QA should inspect:

- desktop directory;
- compact desktop directory;
- article tree expanded and collapsed;
- warning row readability;
- no horizontal overflow or text overlap.
