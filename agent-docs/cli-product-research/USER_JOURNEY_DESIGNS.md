# CLI User Journey Designs

This document turns the CLI product strategy into realistic user journeys. It
is not a final command reference, but it is intentionally concrete enough to
guide future command specs, fixtures, help examples, operation schemas, and
usability tests.

Each journey answers:

1. What is the user trying to accomplish?
2. Which files, artifacts, providers, and routes are involved?
3. What commands might the user run?
4. What does the tool do behind the scenes?
5. What design requirements does the journey imply?

The examples use `tpm` as the placeholder command name and candidate paths such
as `.tpm/reports/` and `.tpm/plans/` for saved reports and plans. Those paths
are design examples, not current implementation promises.

## Journey Design Principles

The examples should obey the product decisions in the strategy:

1. Commands speak publishing language before implementation language.
2. Mutating or remote-changing actions are plan-first.
3. Human output and machine output come from the same operation result.
4. Git, GitHub, Cloudflare, repo-local media, and Astro are adapters or
   implementation details, not the product model.
5. The default path is simple, but the underlying operation model is powerful
   enough for GUI, CLI, MCP, CI, and complex publishers.

## Shared Example Artifacts

Future CLI implementations should have stable places to save reviewable
artifacts. Exact paths can change, but the product should support equivalent
concepts.

Candidate workspace:

```text
mina-field-notes/
  site/
    config/site.json
    content/articles/
    content/announcements/
    content/authors/
    assets/articles/
    public/
    theme.css
  .tpm/
    plans/
    reports/
    releases/
    snapshots/
```

Candidate report envelope:

```json
{
  "schemaVersion": "tpm.report.v1",
  "operation": "check",
  "status": "failed",
  "profile": "production",
  "diagnostics": [],
  "artifacts": [],
  "summary": {}
}
```

The important design point is not the exact folder name. It is that plans,
reports, releases, diagnostics, and provider actions are durable objects that
humans can review and machines can consume.

## Journey 1: Default Local Publisher Creates A First Blog

### User Goal

Mina has no technical background. She wants a small photography blog called
"Mina's Field Notes." She wants to write a first article, add two images, see a
preview, and publish it. She does not want to learn Git, frontmatter, Astro,
Cloudflare Workers, image optimization, RSS, Open Graph, or JSON-LD.

The GUI studio should be the normal interface for this user. The CLI design
still matters because the GUI should call the same operations.

### Files And Routes

```text
~/Sites/mina-field-notes/
  site/config/site.json
  site/content/authors/mina-park.json
  site/content/articles/first-summer-walk.md
  site/assets/articles/first-summer-walk/lake-trail.jpg
  site/assets/articles/first-summer-walk/pine-shadows.jpg
  .tpm/reports/check-first-summer-walk.json
  .tpm/releases/2026-06-02-first-summer-walk/manifest.json
```

Generated route:

```text
/articles/first-summer-walk/
```

### Candidate Command Flow

```text
tpm site init --site ~/Sites/mina-field-notes \
  --starter personal-blog \
  --name "Mina's Field Notes" \
  --author "Mina Park"

tpm content new article \
  --site ~/Sites/mina-field-notes \
  --title "First Summer Walk" \
  --slug first-summer-walk \
  --author mina-park

tpm media ingest ~/Pictures/lake-trail.jpg \
  --entry articles/first-summer-walk \
  --role hero \
  --alt "A sunlit lake trail in early summer"

tpm media ingest ~/Pictures/pine-shadows.jpg \
  --entry articles/first-summer-walk \
  --role inline \
  --alt "Pine tree shadows crossing a gravel path"

tpm preview --site ~/Sites/mina-field-notes
tpm check --site ~/Sites/mina-field-notes
tpm publish plan --site ~/Sites/mina-field-notes --target cloudflare-production
tpm publish apply --plan .tpm/plans/publish-cloudflare-production.json
```

### What The Tool Does

`site init` creates a site workspace, default config, default theme, local
source/history defaults, and starter content. It should not expose platform
source files to Mina.

`content new article` creates a Markdown file with a minimal valid frontmatter
model. The command can ask for missing information in TTY mode, but it must be
equivalent to flags or studio form fields.

`media ingest` copies or registers the source images through the active media
adapter, records alt text, associates the image with the article, and prepares
the image for later optimization. It does not make Mina choose WebP/JPEG
settings or output widths.

`preview` starts a local preview using the shared platform compiler.

`check` validates content, routes, media, metadata, feeds, generated artifacts,
and publish readiness. It should explain problems in author language.

`publish plan` creates a target-bound plan that says what release will be
published, which provider account/target is involved, whether rollback is
available, and what generated artifacts will be uploaded.

`publish apply` executes the reviewed plan. A GUI can render the same plan as a
confirmation screen.

### Design Requirements

- The default user path must not require Git, manual frontmatter edits, or
  provider jargon.
- The CLI and GUI must share the same operations for site init, content create,
  media ingest, preview, check, release, and publish.
- The user-facing output should say "article," "image," "preview," and
  "publish," not "collection entry," "asset pipeline," "adapter operation," or
  "deploy artifact."

## Journey 2: Terminal-Comfortable Owner Fixes A Publish Blocker

### User Goal

Mina is now comfortable enough to use the terminal. She runs a check before
publishing and learns that one image is missing alt text and one old URL
redirect points nowhere. She wants a plain explanation and a repair plan.

### Files And Routes

```text
site/content/articles/first-summer-walk.md
site/assets/articles/first-summer-walk/pine-shadows.jpg
site/redirects.json
.tpm/reports/check-2026-06-02.json
.tpm/plans/repair-2026-06-02.json
```

Broken redirect:

```text
/2026/06/02/first-summer-walk/ -> /articles/first-summer-walk-old/
```

Correct route:

```text
/articles/first-summer-walk/
```

### Candidate Command Flow

```text
tpm check all --strict \
  --output .tpm/reports/check-2026-06-02.json

tpm doctor --explain MEDIA_ALT_MISSING
tpm doctor --explain ROUTE_REDIRECT_TARGET_MISSING

tpm doctor routes --fix \
  --plan .tpm/plans/repair-2026-06-02.json

tpm doctor routes --apply .tpm/plans/repair-2026-06-02.json

tpm content edit articles/first-summer-walk
tpm check all --strict
```

### What The Tool Does

`check` produces a report with stable diagnostic codes, file paths, route
references, severity, cause, and remediation.

`doctor --explain` converts one diagnostic code into plain language:

```text
ROUTE_REDIRECT_TARGET_MISSING
The redirect in site/redirects.json points to a route that this site does not
generate. Search engines and old links will hit a 404.

Suggested fix:
  Change the target to /articles/first-summer-walk/
```

`doctor routes --fix --plan` can propose a redirect correction because it is a
local, reviewable, deterministic edit. It should not invent alt text for the
image, because meaningful alt text requires human judgment.

`content edit` opens the article or routes to the studio editor so Mina can add
human-authored alt text.

### Design Requirements

- `check` gates; `doctor` explains and plans repair.
- Automatic fixes must be limited to changes the platform can justify.
- The tool should make human-required fixes clear instead of pretending it can
  solve them automatically.
- Repair plans should list exact files and diffs before applying changes.

## Journey 3: TPM-Like Team Submits A Scholarly Article

### User Goal

Seong is working on a TPM article with citations, images, social preview, and
legacy URL concerns. The team stores site content in a GitHub-backed site
workspace, but the platform source is separate. Seong wants to create the
article, check changed content, preview generated artifacts, create a release
candidate, and submit it for review.

### Files And Routes

```text
~/Work/tpm-content/
  site/content/articles/baudrillard-and-reaction-memes.md
  site/assets/articles/baudrillard-and-reaction-memes/reaction-chart.png
  site/config/site.json
  site/redirects.json
  .tpm/reports/check-changed.json
  .tpm/releases/2026-07-14-baudrillard-reaction-memes/manifest.json
```

Generated route:

```text
/articles/baudrillard-and-reaction-memes/
```

Legacy URL candidate:

```text
/2026/07/14/baudrillard-and-reaction-memes/
```

### Candidate Command Flow

```text
tpm source status --site ~/Work/tpm-content
tpm source sync --site ~/Work/tpm-content

tpm content new article \
  --site ~/Work/tpm-content \
  --title "Baudrillard and Reaction Memes" \
  --slug baudrillard-and-reaction-memes \
  --author seong-young-her \
  --category culture \
  --template scholarly

tpm media ingest ./notes/reaction-chart.png \
  --entry articles/baudrillard-and-reaction-memes \
  --role figure \
  --caption "Reaction-image circulation model"

tpm check content --changed \
  --format json \
  --output .tpm/reports/check-changed.json

tpm preview artifact social-image \
  --route /articles/baudrillard-and-reaction-memes/

tpm build --profile preview \
  --report .tpm/reports/build-preview.json

tpm release create --from build \
  --name 2026-07-14-baudrillard-reaction-memes

tpm workflow submit \
  --provider github \
  --release 2026-07-14-baudrillard-reaction-memes \
  --title "Add Baudrillard and Reaction Memes"
```

### What The Tool Does

`source status` explains the active source adapter, current branch or snapshot,
sync state, and whether there are local changes. If the source adapter is Git,
the detailed output can mention branch and remote; the primary status should
still say whether the site workspace is in sync.

`content new article` creates a valid article source file and references known
author/category records. If the category or author does not exist, it should
fail early or offer a plan to create them.

`check content --changed` validates changed entries and dependent surfaces:
article metadata, citations, bibliography output, image references, social
image readiness, redirects, and route conflicts.

`preview artifact social-image` shows the generated social card so the team can
verify crop, title wrapping, and image choice before review.

`release create` freezes the build output, diagnostics, route registry,
artifact manifest, and source snapshot into a reviewable object.

`workflow submit --provider github` maps the editorial action "submit" to the
GitHub workflow adapter. The command may create a branch or pull request, but
the user-facing action is still "submit for review."

### Design Requirements

- GitHub is a workflow adapter, not the workflow model.
- The release candidate should be reviewable independently of provider state.
- Citation, metadata, route, media, and social preview checks must be part of
  the same changed-content report.
- Artifact preview commands should let reviewers inspect generated non-page
  output without manually searching `dist/`.

## Journey 4: Publication Moves Media Out Of Git

### User Goal

The TPM-like team notices the site workspace is growing too large because years
of images live in Git. They are not ready for a full SaaS asset manager. They
want to move article images to an external drive mounted at
`/Volumes/TPM-Media`, keep site source in Git, rewrite source references, and
prove the generated site is unchanged.

### Files And Artifacts

```text
site/assets/articles/concept-jjalbang/ascii-jjalbang.png
site/assets/articles/what-is-a-meme/meme-jokes-puns-chart.png
/Volumes/TPM-Media/articles/concept-jjalbang/ascii-jjalbang.png
/Volumes/TPM-Media/articles/what-is-a-meme/meme-jokes-puns-chart.png
.tpm/plans/media-to-external-drive.json
.tpm/reports/media-migration-diff.json
```

### Candidate Command Flow

```text
tpm media inventory \
  --output .tpm/reports/media-inventory.json

tpm media provider connect local-drive \
  --name tpm-external-media \
  --root /Volumes/TPM-Media

tpm media migrate \
  --from repo \
  --to tpm-external-media \
  --plan .tpm/plans/media-to-external-drive.json

tpm media migrate \
  --plan .tpm/plans/media-to-external-drive.json \
  --apply \
  --yes

tpm media rewrite \
  --plan .tpm/plans/media-reference-rewrite.json

tpm check media --strict
tpm release diff previous latest --scope media,html
```

### What The Tool Does

`media inventory` classifies source media, generated derivatives, unused media,
large files, remote images, missing alt text, and references from content.

`media provider connect` registers the external drive as a media adapter with
capabilities and limitations. For example, it may support local reads and
writes but not remote collaborators or CDN URLs.

`media migrate --plan` creates a mapping from repo-local files to provider
locations. The plan includes file hashes, destination paths, source references,
expected rewrites, and rollback limits.

`media migrate --apply` copies files and verifies fingerprints. It should not
delete repo-local originals unless a separate cleanup plan is reviewed.

`media rewrite` updates article/config references through a reviewable source
edit plan.

`release diff --scope media,html` proves that rendered pages and generated
media references are equivalent or explicitly explains the differences.

### Design Requirements

- Media migration must be split into inventory, provider connection, migration
  plan, apply, rewrite, check, and diff.
- The CLI must not assume media and source live in the same provider.
- The user must be able to pause after a plan and review every path before
  applying changes.
- Generated output comparison is critical because the user cares that the live
  site still works, not only that files moved.

## Journey 5: Legacy Blog Import With Preservation Review

### User Goal

A blogger is migrating a WordPress archive. They have a WordPress export file
and a zip of uploads. They want to import content, preserve old URLs as
redirects, review uncertain mappings, and avoid silently losing images,
citations, embeds, or metadata.

### Files And Routes

```text
~/Downloads/wordpress-export-2025-12-31.xml
~/Downloads/wp-uploads.zip
site/content/articles/one-vicepostbot-vs-the-entire-takedown-army-bot-tips.md
site/assets/imported/wordpress/2019/03/one-vicepostbot/header.jpg
site/redirects.json
.tpm/plans/import-wordpress-2025-12-31.json
.tpm/reports/import-wordpress-review.md
```

Old URL:

```text
/2019/03/01/one-vicepostbot-vs-the-entire-takedown-army-bot-tips/
```

New URL:

```text
/articles/one-vicepostbot-vs-the-entire-takedown-army-bot-tips/
```

### Candidate Command Flow

```text
tpm import wordpress \
  --source ~/Downloads/wordpress-export-2025-12-31.xml \
  --media ~/Downloads/wp-uploads.zip \
  --plan .tpm/plans/import-wordpress-2025-12-31.json

tpm import inspect .tpm/plans/import-wordpress-2025-12-31.json \
  --output .tpm/reports/import-wordpress-review.md

tpm import apply .tpm/plans/import-wordpress-2025-12-31.json \
  --yes

tpm check routes --strict
tpm check media --strict
tpm check metadata --strict
```

### What The Tool Does

`import wordpress --plan` reads the export, proposes content files, maps old
URLs to new routes, maps uploads to media assets, identifies unsupported embeds,
detects missing media, and marks uncertain metadata for manual review.

`import inspect` creates a human-readable review report:

```text
Import plan: wordpress-export-2025-12-31.xml

Will create:
  site/content/articles/one-vicepostbot-vs-the-entire-takedown-army-bot-tips.md
  site/assets/imported/wordpress/2019/03/one-vicepostbot/header.jpg

Will add redirect:
  /2019/03/01/one-vicepostbot-vs-the-entire-takedown-army-bot-tips/
  -> /articles/one-vicepostbot-vs-the-entire-takedown-army-bot-tips/

Needs review:
  EMBED_UNSUPPORTED: old Facebook embed could not be converted safely.
  CITATION_WEAK: bibliography text could not be parsed into structured data.
```

`import apply` writes source files only after the plan is reviewed. It should
preserve a source map so users can trace each new article back to its imported
record.

### Design Requirements

- Import must be plan-first and preservation-aware.
- Unsupported or uncertain conversions should be review states, not silent
  failures.
- Redirect generation is part of migration, not an optional afterthought.
- Importers should produce both human review reports and machine-readable
  ledgers.

## Journey 6: CI Publishes A Reviewed Release

### User Goal

A publication team wants CI to run the same checks as local development, build
the site, create a release, publish it to production, and fail safely if any
diagnostic or provider capability is missing. CI must never prompt.

### Files And Artifacts

```text
.github/workflows/publish.yml
.tpm/reports/check-production.ndjson
.tpm/reports/build-production.json
.tpm/releases/2026-07-14-production/manifest.json
.tpm/plans/publish-cloudflare-production.json
.tpm/reports/publish-cloudflare-production.json
```

### Candidate Workflow Step

```yaml
- name: Check site
  run: |
    tpm check all --strict --profile production --ci \
      --format ndjson \
      --output .tpm/reports/check-production.ndjson

- name: Build release
  run: |
    tpm build --profile production --ci \
      --report .tpm/reports/build-production.json

- name: Create release
  run: |
    tpm release create --from build --name 2026-07-14-production --ci

- name: Publish plan
  run: |
    tpm publish plan --target cloudflare-production \
      --release 2026-07-14-production \
      --output .tpm/plans/publish-cloudflare-production.json \
      --ci

- name: Publish
  run: |
    tpm publish apply --plan .tpm/plans/publish-cloudflare-production.json \
      --yes \
      --ci \
      --output .tpm/reports/publish-cloudflare-production.json
```

### What The Tool Does

`--ci` disables prompts, chooses CI-safe output defaults, and turns missing
required input into explicit failures.

`check all --strict` exits nonzero when release-blocking diagnostics exist.
Progress and human-readable summaries should go to stderr. Structured output
should go to the requested file or stdout if explicitly requested.

`publish plan` validates target identity, release identity, adapter
capabilities, credentials, rollback support, headers, redirects, and static
asset behavior before any remote mutation.

`publish apply` requires an approved saved plan and `--yes`. It should refuse
to apply if the release, target, adapter version, or relevant credentials no
longer match the plan context.

### Design Requirements

- CI must never depend on prompts.
- Exit codes, JSON/NDJSON schemas, stdout/stderr behavior, and report paths are
  product contracts.
- Publish apply should be target-bound and plan-bound.
- CI should consume the same diagnostics as local checks and future GUI/MCP
  surfaces.

## Journey 7: Extension Developer Validates A Support CTA Extension

### User Goal

An extension developer wants to package support CTA buttons similar to Patreon
and Discord buttons without hard-coding TPM-specific UI into the core platform.
They need to validate the extension manifest, inspect capabilities, run
fixtures, and see what site config the extension contributes.

### Files

```text
extensions/support-cta/
  tpm.extension.json
  src/index.ts
  src/components/SupportCta.astro
  fixtures/minimal-site/site/config/site.json
  fixtures/minimal-site/site/content/articles/test-post.md
.tpm/reports/support-cta-extension-check.json
```

### Candidate Command Flow

```text
tpm extension check ./extensions/support-cta \
  --output .tpm/reports/support-cta-extension-check.json

tpm extension capabilities ./extensions/support-cta

tpm extension test ./extensions/support-cta \
  --fixture fixtures/minimal-site

tpm adapter list --provided-by ./extensions/support-cta
```

### What The Tool Does

`extension check` validates the manifest, supported platform versions,
capability declarations, contributed config schema, security permissions,
bundled components, and documentation links.

`extension capabilities` prints what the extension contributes:

```text
Extension: support-cta

Capabilities:
  ui.component      SupportCta
  config.schema     support.links[]
  diagnostic        SUPPORT_LINK_INVALID

No adapters provided.
```

`extension test` runs the extension against declared fixtures and verifies that
generated output, accessibility, config diagnostics, and static-output security
contracts still hold.

### Design Requirements

- Extension commands should not inspect arbitrary package internals. They
  should consume manifest and platform contracts.
- Extensions and adapters are different concepts. This extension contributes UI
  and config, but no provider adapter.
- Fixture testing should make extension quality repeatable before marketplace
  or sharing workflows exist.

## Journey 8: MCP Agent Investigates A Broken Article Safely

### User Goal

A site owner asks an AI assistant why one article is failing release checks. The
assistant should inspect diagnostics and propose a repair plan, but it should
not publish, delete media, rewrite source, or change provider settings without
explicit user approval.

### Files

```text
site/content/articles/a-short-note-on-gondola.md
site/assets/articles/a-short-note-on-gondola/gondola.jpg
.tpm/reports/check-gondola.json
.tpm/plans/repair-gondola-routes.json
```

### Candidate Command Flow

```text
tpm mcp serve \
  --site ~/Sites/tpm-content \
  --profile local \
  --allow read,plan
```

Agent-visible tools might map to platform operations:

```text
site.status
diagnostics.list
diagnostics.explain
routes.inspect
media.inventory
doctor.plan
```

If the agent needs to apply a repair, it should return a saved plan for user
review:

```text
.tpm/plans/repair-gondola-routes.json
```

### What The Tool Does

`mcp serve` exposes safe operations under a permission model. With
`--allow read,plan`, the MCP server can inspect source, diagnostics, routes,
media inventory, and create repair plans. It cannot apply plans, publish, edit
credentials, or delete files.

The assistant can explain:

```text
The article is blocked because the legacy redirect points to
/articles/a-short-note-on-gondola-old/, which is not generated. I created a
repair plan that changes the redirect target to
/articles/a-short-note-on-gondola/.
```

### Design Requirements

- MCP should expose the same operation model as CLI and GUI.
- Agent permissions must be explicit and safety-scoped.
- Plan creation and plan application are separate capabilities.
- Every MCP tool result should carry structured diagnostics and artifact
  references, not scraped terminal prose.

## Journey 9: Complex Publisher Uses Custom Providers

### User Goal

A large magazine wants static output but already has internal systems: a DAM
for images, an editorial workflow API, an identity provider, and an Akamai-based
publish pipeline. They do not want TPM to replace those systems. They want TPM
to compile and validate static publications while using custom adapters.

### Files

```text
site/config/site.json
site/config/providers.json
extensions/acme-dam/tpm.extension.json
extensions/acme-workflow/tpm.extension.json
extensions/acme-akamai-publish/tpm.extension.json
.tpm/reports/provider-capabilities.json
.tpm/plans/publish-akamai-production.json
```

### Candidate Command Flow

```text
tpm extension add ./extensions/acme-dam
tpm extension add ./extensions/acme-workflow
tpm extension add ./extensions/acme-akamai-publish

tpm adapter check media acme-dam \
  --output .tpm/reports/provider-capabilities.json

tpm adapter check workflow acme-workflow
tpm adapter check deploy acme-akamai-production

tpm check all --strict --profile production
tpm workflow submit --provider acme-workflow --release latest
tpm publish plan --target acme-akamai-production \
  --release latest \
  --output .tpm/plans/publish-akamai-production.json
```

### What The Tool Does

The CLI validates extension manifests and adapter capability declarations. It
does not assume how the publisher's DAM, workflow API, or Akamai integration
works internally.

`adapter check media acme-dam` asks whether the media adapter can resolve the
site's referenced media, provide metadata, fetch source assets for optimization
or reuse existing derivatives, and report failures with stable diagnostic
codes.

`workflow submit --provider acme-workflow` maps the product action "submit" to
the publisher's internal workflow adapter.

`publish plan --target acme-akamai-production` creates a plan against the
publisher's deploy adapter. The plan should show capability gaps rather than
trying to use Cloudflare assumptions.

### Design Requirements

- Complex publishers need capability contracts more than bundled provider
  features.
- Adapter commands should answer "what can this provider do for this site?"
  before publish or migration begins.
- The platform should not require GitHub, Cloudflare, repo-local media, or a
  specific review model to be useful.

## Journey 10: Support Debugging A User Workspace

### User Goal

A support engineer is helping a user who says, "Publish is broken." The support
engineer needs a small report that explains site identity, versions, active
profile, source provider, media provider, configured publish targets, recent
diagnostics, and whether credentials are missing, without exposing secrets.

### Files And Artifacts

```text
.tpm/reports/support-status-2026-06-02.json
.tpm/reports/support-status-2026-06-02.txt
site/config/site.json
site/config/providers.json
```

### Candidate Command Flow

```text
tpm status --support \
  --output .tpm/reports/support-status-2026-06-02.txt

tpm status --support \
  --format json \
  --output .tpm/reports/support-status-2026-06-02.json
```

### What The Tool Does

`status --support` collects diagnostic context and redacts secrets:

```text
Site: Mina's Field Notes
Workspace: /Users/mina/Sites/mina-field-notes
Profile: production
Source provider: local
Media provider: repo
Publish target: cloudflare-production
Target account: mina@example.com
Credential: present, expires 2026-08-01
Last release: 2026-06-02-first-summer-walk
Last publish: failed
Blocking issue:
  PROVIDER_SCOPE_MISSING
  Cloudflare credential is missing Workers Static Assets deploy permission.
```

### Design Requirements

- Support reports should be redacted by default.
- Status should be the fastest orientation command.
- The report should distinguish missing source, missing config, missing
  provider capability, missing credential, and failed release verification.
- Human and JSON support reports should come from the same operation result.

## Journey 11: Solo Publisher Adds Backup Without Adopting Review Workflow

### User Goal

Mina has published a few articles and starts worrying about losing her site if
her laptop fails. She wants backup and version history, but she does not want a
review process or pull requests. GitHub can be the backup provider, but Git
should not become the editorial workflow.

### Files And Artifacts

```text
site/content/articles/first-summer-walk.md
site/content/articles/autumn-fog-on-the-river.md
site/config/site.json
site/config/source.json
.tpm/snapshots/2026-09-18-before-theme-update.json
.tpm/reports/source-backup-status.json
```

### Candidate Command Flow

```text
tpm source connect github \
  --mode backup \
  --repo mina/mina-field-notes-source

tpm source snapshot \
  --message "Before theme update" \
  --output .tpm/snapshots/2026-09-18-before-theme-update.json

tpm source sync \
  --output .tpm/reports/source-backup-status.json

tpm status
```

### What The Tool Does

`source connect github --mode backup` connects GitHub as a source/history
adapter. It does not enable editorial review, branch policy, pull requests, or
CI publishing unless the user explicitly connects a workflow provider later.

`source snapshot` creates a restorable source checkpoint using the active source
adapter. Human output should say what can be restored and whether media is
included. If the media provider is still repo-local, the report should say so.
If media is external, the snapshot should record references and provider
metadata rather than pretending to own external files.

`source sync` pushes or synchronizes source state through the provider and
reports success, conflicts, or missing credentials in product language.

### Design Requirements

- Source/history and workflow must remain separate.
- GitHub backup should be understandable without teaching branches or pull
  requests.
- `status` should show "Source backup: GitHub, synced" separately from
  "Workflow: none" and "Publish target: Cloudflare production."
- Restore behavior must be explicit about whether content, config, media, and
  generated artifacts are covered.

## Journey 12: Site Owner Changes Support Links And Social Defaults

### User Goal

A site owner wants to add Patreon and Discord support links, change the default
social preview image, and verify that metadata and support CTAs still work. The
owner can edit config files directly, but the CLI should make the safe path
easier and explain downstream effects.

### Files And Routes

```text
site/config/site.json
site/assets/social/default-social-dark.jpg
site/assets/support/discord-logo.svg
site/assets/support/patreon-logo.svg
.tpm/plans/site-config-support-links.json
.tpm/reports/metadata-support-check.json
```

Affected surfaces:

```text
/
/articles/first-summer-walk/
/support/
rss.xml
sitemap-index.xml
```

### Candidate Command Flow

```text
tpm site config explain support.links
tpm site config explain social.defaultImage

tpm media ingest ~/Downloads/default-social-dark.jpg \
  --role social-default \
  --alt "Mina's Field Notes dark social preview image"

tpm site config set support.links \
  --value '[{"label":"Patreon","href":"https://patreon.com/minafieldnotes"},{"label":"Discord","href":"https://discord.gg/minafieldnotes"}]' \
  --plan .tpm/plans/site-config-support-links.json

tpm site config set social.defaultImage \
  --value "site/assets/social/default-social-dark.jpg" \
  --plan .tpm/plans/site-config-social-image.json

tpm site config apply .tpm/plans/site-config-support-links.json
tpm site config apply .tpm/plans/site-config-social-image.json

tpm check metadata --strict \
  --output .tpm/reports/metadata-support-check.json
```

### What The Tool Does

`site config explain` reads the shared typed schema and explains the field,
default, active value, source file, profile overrides, validation rules, and
which generated surfaces may change.

`media ingest --role social-default` validates that the image can be used for
social metadata and generates or records the correct derivative policy.

`site config set --plan` creates a source-edit plan rather than rewriting
config silently. The plan should show the exact key, current value, proposed
value, affected profiles, and affected generated surfaces.

`check metadata --strict` verifies Open Graph, Twitter cards, JSON-LD, feeds,
sitemap, support CTA links, and image references.

### Design Requirements

- Config commands should be schema-driven, not ad hoc JSON mutation helpers.
- The CLI should show downstream effects of config changes before applying
  them.
- Media and config operations should compose cleanly: setting a social image
  should use media policy rather than accepting arbitrary paths blindly.
- Direct config file edits remain valid, but the guided CLI path should make
  invalid state harder to express.

## Journey Coverage Matrix

| Journey                | Primary domains exercised                         | Why it matters                                              |
| ---------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| Default first blog     | site, content, media, preview, check, publish     | Proves the simple path can hide technical complexity.       |
| Publish blocker repair | check, doctor, routes, media, content             | Proves diagnostics and repair plans are useful.             |
| TPM scholarly article  | source, content, media, metadata, release, review | Proves Git/GitHub can be adapters without becoming core.    |
| Media externalization  | media, source, release, diff                      | Proves media can outgrow source storage safely.             |
| Legacy import          | import, media, redirects, preservation, check     | Proves migration is plan-first and fidelity-focused.        |
| CI publish             | check, build, release, publish, machine output    | Proves automation uses stable schemas and no prompts.       |
| Extension developer    | extension, adapter, fixtures, diagnostics         | Proves ecosystem work can be validated.                     |
| MCP troubleshooting    | MCP, diagnostics, routes, media, doctor           | Proves agents can inspect and plan without unsafe mutation. |
| Complex publisher      | extension, adapters, workflow, media, publish     | Proves custom systems can integrate without lock-in.        |
| Support debugging      | status, providers, credentials, diagnostics       | Proves support can debug without leaking secrets.           |
| Backup without review  | source, snapshots, status                         | Proves source/history can be separate from workflow.        |
| Support/social config  | site config, media, metadata, support CTAs        | Proves typed config commands can prevent invalid changes.   |

## Implications For Future Command Specs

1. Every command spec should name the user job, operation contract, safety
   level, input model, output model, and report/plan artifact.
2. Examples should use real-looking workspace paths, file names, route names,
   and target names.
3. Help examples should include both direct human use and CI/machine use where
   relevant.
4. The first implementation slice should choose a smaller subset of journeys,
   but it should use names and operation shapes that remain compatible with the
   mature journeys.
5. Fixture sites should be derived from these journeys so docs, tests, and
   command behavior stay aligned.
