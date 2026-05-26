# CLI Design Decision Review

This document critiques the TPM CLI product strategy after the product survey,
feature matrix, future help draft, platform roadmap, and studio vision were
written. Its job is to make the major product and architecture decisions
explicit before a later command-spec or implementation milestone treats the
current direction as settled.

The review is intentionally opinionated. The goal is not to preserve the first
reasonable idea; it is to choose the most useful and elegant command language
for a static publishing platform that can support a GUI studio, CLI, MCP server,
CI workflows, and extension ecosystem without creating parallel product models.

## Review Standard

A good CLI design for this platform must satisfy these standards:

1. It expresses publishing intent, not implementation mechanics.
2. It is simple for common local publishing while remaining powerful enough for
   TPM-like teams and complex publishers.
3. It maps every command to a shared platform operation, so GUI, CLI, MCP, CI,
   and extensions cannot drift.
4. It makes dangerous actions plan-first, reviewable, scriptable, and
   reversible where the provider supports reversal.
5. It treats diagnostics, release artifacts, media policy, metadata, routes,
   and generated output as product surfaces rather than hidden build details.
6. It avoids hard-coding Git, GitHub, Cloudflare, repo-local media, Astro, or
   one editorial workflow as the product model.
7. It gives machines stable output and humans concise, actionable output from
   the beginning.

## Executive Critique

The current strategy is directionally strong. The feature matrix correctly
shows that the product opportunity is not a nicer wrapper around Astro, a deploy
CLI, or a Git-backed CMS. The stronger opportunity is a static publishing
operations interface: a tool that lets users inspect, validate, preview, package,
publish, roll back, and automate a static publication through explicit platform
contracts.

The main weakness in the current documents is that several choices were implied
instead of defended. The docs already prefer `publish` over provider-specific
deploy vocabulary, `media` as a first-class domain, `check` and `doctor` as
separate commands, a `release` artifact, and source/workflow adapters. Those are
the right choices, but the rationale needs to be explicit because later
implementers will be tempted to collapse them into fewer commands or lower-level
scripts.

The strongest refinement is to name the core abstraction:

> The CLI is a command-language projection of versioned platform operations.
> Each command should load a workspace context, create or execute a typed
> operation, emit a typed result, and render that result for humans or machines.

That operation model should be treated as the product center. Command handlers,
GUI actions, MCP tools, CI scripts, and extension hooks should use the same
operation contracts. The CLI grammar is important, but it should not own the
business logic.

## Decision 1: What Is The CLI?

### Options

1. **A wrapper around existing Bun/Astro scripts.**
   - Strength: fastest to implement.
   - Weakness: exposes implementation details, duplicates current script
     boundaries, and creates brittle user-facing contracts.
2. **A developer convenience CLI for this repo.**
   - Strength: useful for TPM maintainers.
   - Weakness: overfits to current repo structure and does not serve the studio
     product, external users, or complex publishers.
3. **A deploy CLI for static output.**
   - Strength: clear immediate value after build.
   - Weakness: provider vocabulary becomes central and the tool ignores
     authoring, diagnostics, media, metadata, releases, and preservation.
4. **A publishing operations interface over platform contracts.**
   - Strength: unifies author intent, diagnostics, release artifacts, media,
     source, workflow, deploy, GUI, MCP, CI, and extension needs.
   - Weakness: requires more up-front platform seams before many commands can
     be implemented cleanly.

### Recommendation

Choose option 4. The CLI should be a publishing operations interface over shared
platform contracts.

This is the only option that satisfies the long-term studio vision without
creating a second source model. It also gives the CLI real product-market fit:
it can answer "what will this publication produce, is it safe to publish, and
what happens if I apply this plan?" Existing static-site, deploy, and CMS tools
only solve pieces of that job.

### Tradeoffs And Mitigation

- Tradeoff: implementation is slower than wrapping scripts.
  - Mitigation: ship a narrow first slice around status, check, build/report,
    preview, and artifact inspection, but build it on the same operation model
    that later publish/media/import commands need.
- Tradeoff: operation contracts may feel abstract early.
  - Mitigation: define each operation around concrete user jobs and fixtures,
    not abstract architecture diagrams.

## Decision 2: Command Grammar Shape

### Options

1. **Verb-first journeys:** `write`, `preview`, `publish`, `rollback`.
   - Strength: approachable and action-oriented.
   - Weakness: hard to scale once the product includes media, source,
     workflow, adapters, imports, diagnostics, and artifact inspection.
2. **Domain nouns:** `site`, `content`, `media`, `source`, `workflow`,
   `release`, `publish`.
   - Strength: maps to durable platform domains and scales cleanly.
   - Weakness: users must learn several nouns.
3. **Provider nouns:** `git`, `github`, `cloudflare`, `r2`, `s3`.
   - Strength: clear for provider specialists.
   - Weakness: locks the product language to implementation choices and
     excludes default users.
4. **Framework nouns:** `astro`, `collections`, `dist`, `frontmatter`.
   - Strength: convenient for current developers.
   - Weakness: makes author-facing UX worse and harms portability.

### Recommendation

Use domain nouns as the canonical grammar, with short guided journeys layered on
top where they genuinely reduce friction.

The mature root should expose domain families because the platform itself is a
domain compiler. However, beginner workflows should still be easy:

```text
tpm site init --starter personal-blog
tpm content new article
tpm preview
tpm check
tpm publish
```

The grammar should support both:

- **Journeys** for common flows: create, preview, check, publish.
- **Domains** for exact control: media inventory, release diff, source
  snapshot, workflow submit, adapter inspect.

### Tradeoffs And Mitigation

- Tradeoff: domain nouns can feel heavier than a tiny CLI.
  - Mitigation: `status`, `help`, examples, command aliases, and guided flows
    should teach the domain gradually.
- Tradeoff: too many top-level nouns can become clutter.
  - Mitigation: only make a noun top-level when it names a real platform domain
    with multiple jobs, policies, diagnostics, and future adapters.

## Decision 3: `publish` Versus `deploy`

### Options

1. **Use `deploy` as the primary command.**
   - Strength: familiar to developers and deploy providers.
   - Weakness: narrows the product to infrastructure movement.
2. **Use `publish` as the primary command.**
   - Strength: matches author intent and accommodates provider-neutral
     planning, release verification, target status, and rollback.
   - Weakness: developers may initially look for `deploy`.
3. **Expose both equally.**
   - Strength: discoverable for both audiences.
   - Weakness: creates ambiguity unless one is clearly canonical.

### Recommendation

Use `publish` as canonical. Treat `deploy` as provider vocabulary, an advanced
detail, or a documented alias only if usability testing shows users expect it.

Publishing is what the user wants. Deployment is one implementation step a
target adapter may perform. The CLI should keep the product action higher level:
select a release, create a target plan, apply it, verify it, and roll back when
possible.

### Tradeoffs And Mitigation

- Tradeoff: `deploy` is familiar to technical users.
  - Mitigation: help text can mention "publish/deploy target" and provider
    adapters can expose deploy details under `adapter` or verbose output.
- Tradeoff: provider docs will often say deploy.
  - Mitigation: adapter diagnostics can translate provider language into
    product language while linking to provider docs when needed.

## Decision 4: Should `release` Be First-Class?

### Options

1. **No release concept; build writes an output directory and publish reads it.**
   - Strength: simplest static-site-generator model.
   - Weakness: weak auditability, rollback, artifact inspection, and
     provider-neutral publish planning.
2. **Release exists internally but has no user-facing command.**
   - Strength: hides complexity from default users.
   - Weakness: power users and CI cannot inspect the object that actually gets
     published.
3. **Release is a first-class domain with `create`, `inspect`, `verify`,
   `diff`, `archive`, and `restore`.**
   - Strength: gives publishing, rollback, preservation, CI, and review a
     stable artifact boundary.
   - Weakness: adds a concept that simple users do not need to think about.

### Recommendation

Make `release` first-class while allowing simple `publish` flows to create and
use releases automatically.

The release object is the bridge between source, generated output, verification,
and provider state. Without it, publish commands will either read loose `dist/`
folders or recreate implicit state. A release manifest gives the GUI, CLI, MCP,
CI, and deploy adapters one thing to inspect and compare.

### Tradeoffs And Mitigation

- Tradeoff: default users should not be forced to understand releases.
  - Mitigation: GUI and simple CLI flows can say "Publishing latest checked
    version" while advanced output links to the release ID.
- Tradeoff: release manifests require schema governance.
  - Mitigation: version the schema from the start and test it with fixtures.

## Decision 5: `check` And `doctor`

### Options

1. **Only `check`.**
   - Strength: simple and CI-friendly.
   - Weakness: risks becoming terse and unfriendly for repair workflows.
2. **Only `doctor`.**
   - Strength: friendly and explanatory.
   - Weakness: ambiguous in CI and may imply repair when the job is only
     validation.
3. **Both, backed by the same diagnostics model.**
   - Strength: separates gating from explanation while preventing diagnostic
     drift.
   - Weakness: overlap must be carefully documented.

### Recommendation

Keep both. `check` should validate and fail cleanly. `doctor` should explain,
group, prioritize, and create repair plans.

Both commands must consume the same versioned diagnostic model. The difference
is renderer and workflow, not business logic.

### Tradeoffs And Mitigation

- Tradeoff: users may wonder which command to run.
  - Mitigation: `check` output should say `Run tpm doctor --explain <code>` for
    deeper help; `doctor` can run a check first when no report is supplied.
- Tradeoff: repair plans can become unsafe.
  - Mitigation: repair is plan-first, scoped, and explicit; safe fixes can be
    auto-applied only when diagnostics mark them reversible and local.

## Decision 6: Source, History, And Workflow Boundaries

### Options

1. **Treat Git/GitHub as the workflow model.**
   - Strength: great for TPM and many developer teams.
   - Weakness: excludes default users and complex publishers with different
     systems.
2. **Hide all source/history/workflow concerns behind `site`.**
   - Strength: simple command tree.
   - Weakness: conflates storage, backup, review, editorial state, and publish
     policy.
3. **Separate `source` and `workflow` domains.**
   - Strength: storage/history and editorial process can vary independently.
   - Weakness: adds conceptual surface.

### Recommendation

Keep `source` and `workflow` separate.

`source` answers where site state lives, how it syncs, how it is backed up, and
how snapshots are restored. `workflow` answers what editorial process governs
submit, review, approval, rejection, and promotion to publishable work. GitHub
can implement both for TPM-like teams, but the product should not collapse them.

### Tradeoffs And Mitigation

- Tradeoff: default users should not see source/workflow complexity.
  - Mitigation: default profile can use app-managed local source/history and a
    no-review workflow. `status` can summarize it in plain language.
- Tradeoff: adapters will need capability negotiation.
  - Mitigation: capability reporting is already part of the studio adapter
    model and should be exposed through `adapter show`.

## Decision 7: Media As A First-Class Domain

### Options

1. **Treat media as content attachments only.**
   - Strength: simple for articles.
   - Weakness: fails once media storage, derivatives, alt text, unused assets,
     social images, remote sources, and migrations matter.
2. **Treat media as source-provider data.**
   - Strength: aligns with repo-local media today.
   - Weakness: locks media to source storage and makes external media awkward.
3. **Make `media` a first-class domain.**
   - Strength: supports inventory, policy, optimization, provider migration,
     reference rewrites, generated derivatives, and accessibility.
   - Weakness: adds command surface even before migration is implemented.

### Recommendation

Make `media` first-class.

This is non-negotiable for the end-state product. Media is one of the first
places where a simple local blog turns into a real publication problem. The CLI
should treat media policy and inventory as visible product surfaces before it
attempts migration apply.

### Tradeoffs And Mitigation

- Tradeoff: early media commands may be diagnostic-only.
  - Mitigation: make `media inventory` and `media check` excellent first; defer
    `media migrate --apply` until provider contracts and reference rewrite
    plans are ready.
- Tradeoff: media terms can expose technical details.
  - Mitigation: default output should say "large image", "unused image",
    "remote image", "missing alt text", and "not publish-ready" before it says
    derivative, fingerprint, or provider key.

## Decision 8: Adapter And Extension Language

### Options

1. **Only plugins/extensions.**
   - Strength: common product language.
   - Weakness: too broad; does not distinguish provider capability from package
     distribution.
2. **Only adapters.**
   - Strength: precise for source/media/workflow/build/deploy/identity.
   - Weakness: does not cover UI, diagnostics, policies, article components,
     PDF generation, support CTAs, or bundled product modules.
3. **Use both terms deliberately.**
   - Strength: extension is the distribution/composition boundary; adapter is a
     provider capability implementation.
   - Weakness: documentation must teach the distinction.

### Recommendation

Use both terms. An extension can contribute adapters, UI, policies, commands,
diagnostics, templates, or docs. An adapter implements a specific capability
kind such as source, media, workflow, deploy, build, identity, diagnostics, or
observability.

### Tradeoffs And Mitigation

- Tradeoff: two terms can confuse users.
  - Mitigation: default users should rarely see either. Developer help and
    diagnostics should define the distinction consistently.
- Tradeoff: extension boundaries can be overdesigned.
  - Mitigation: do not implement marketplace behavior early. Start with
    manifest validation and capability inspection.

## Decision 9: Plan/Apply Pattern

### Options

1. **Use only `--dry-run` flags.**
   - Strength: familiar and lightweight.
   - Weakness: dry-run output is often not a durable review artifact.
2. **Use Terraform-style plan/apply for all risky operations.**
   - Strength: safe, inspectable, automatable, and reviewable.
   - Weakness: can feel heavy for simple actions.
3. **Use prompts only.**
   - Strength: easy for humans in terminals.
   - Weakness: unusable for CI/MCP/GUI and risky for scripted operations.
4. **Use plan/apply where risk or complexity warrants it, with simple commands
   creating plans internally.**
   - Strength: keeps safety and artifact review without forcing every user to
     learn the full model immediately.
   - Weakness: implementers must define risk classes carefully.

### Recommendation

Choose option 4. Plan/apply should be the canonical model for mutating,
remote-changing, bulk, destructive, import, migration, repair, and rollback
operations. Simple flows may hide plan creation behind a confirmation or GUI
review, but the underlying operation should still be plan-backed.

### Tradeoffs And Mitigation

- Tradeoff: saved plans introduce compatibility concerns.
  - Mitigation: plan files are versioned, target-bound, and invalidated when
    relevant source, release, adapter, or credential context changes.
- Tradeoff: users may overuse `--yes`.
  - Mitigation: `--yes` should require a saved plan or explicit target context
    for severe-risk operations.

## Decision 10: Machine Output From The Start

### Options

1. **Human output first; add JSON later.**
   - Strength: easier early implementation.
   - Weakness: scripts, GUI, MCP, and CI will scrape prose and create
     compatibility debt.
2. **JSON only.**
   - Strength: simple for machines.
   - Weakness: poor terminal UX.
3. **Human output plus versioned JSON and NDJSON where streaming matters.**
   - Strength: supports humans, CI, GUI, MCP, and long-running operations.
   - Weakness: requires schema design and compatibility tests.

### Recommendation

Use human output plus versioned JSON from the first implementation. Add NDJSON
for streaming diagnostics, long-running checks, previews, imports, migrations,
and publish operations when needed.

Every command does not need every format immediately, but every operation result
should be designed so it can render to stable machine output.

### Tradeoffs And Mitigation

- Tradeoff: schemas can slow initial development.
  - Mitigation: start with a small shared envelope: schema version, command
    context, status, diagnostics, artifacts, and summary.
- Tradeoff: machine schemas become contracts.
  - Mitigation: version them explicitly and add compatibility tests.

## Decision 11: Profiles, Targets, And Context

### Options

1. **Use only flags on each command.**
   - Strength: explicit and easy to understand for small tools.
   - Weakness: repetitive and unsafe for multi-target publishing.
2. **Use only environment names such as development/staging/production.**
   - Strength: familiar.
   - Weakness: conflates config policy, source state, and publish target.
3. **Use profiles for policy/config and targets for publish destinations.**
   - Strength: separates "how should the site be built/checked?" from "where
     should this release be published?"
   - Weakness: users must understand two concepts.

### Recommendation

Use profiles and targets. A profile selects configuration/policy such as local,
preview, production, strictness, feature flags, and generated artifact behavior.
A target selects a publish destination such as a static folder, Cloudflare
production, Cloudflare preview, GitHub Pages, S3/CDN, or a custom adapter.

### Tradeoffs And Mitigation

- Tradeoff: profile/target confusion.
  - Mitigation: `status` and publish plans must always show active profile and
    target separately.
- Tradeoff: too much configuration.
  - Mitigation: ship one excellent default profile and require explicit target
    selection only for remote mutation.

## Decision 12: GUI, CLI, And MCP Relationship

### Options

1. **CLI is the product; GUI and MCP are later wrappers around it.**
   - Strength: terminal workflows are easy to automate.
   - Weakness: makes non-technical studio UX secondary and risks shelling out
     from GUI/MCP.
2. **GUI is the product; CLI is a developer-only script surface.**
   - Strength: focuses on default users.
   - Weakness: weakens CI, power users, and complex publisher integration.
3. **GUI, CLI, MCP, CI, and extensions are peer interfaces over one operation
   model.**
   - Strength: prevents drift and lets each interface serve its audience.
   - Weakness: requires disciplined contracts before any interface goes deep.

### Recommendation

Choose option 3.

The GUI should be the default non-technical product experience. The CLI should
be the scriptable/operator/developer interface. MCP should be the agent
interface. None of them should own source parsing, diagnostics, publish policy,
media migration, or release logic independently.

### Tradeoffs And Mitigation

- Tradeoff: shared operation contracts can become lowest-common-denominator.
  - Mitigation: operations should expose rich typed results; each interface
    renders them differently.
- Tradeoff: command design may be constrained by future GUI/MCP needs.
  - Mitigation: that constraint is desirable. It keeps the CLI honest and
    prevents terminal-only assumptions.

## Decision 13: Import/Export Scope

### Options

1. **Make import/export a late afterthought.**
   - Strength: keeps early CLI smaller.
   - Weakness: migrations and preservation are central to serious publishing.
2. **Build many importers immediately.**
   - Strength: attractive demos.
   - Weakness: high correctness risk and many edge cases before preservation
     contracts are stable.
3. **Make import/export first-class in the language, but phase implementation
   around plan/report contracts before broad importer coverage.**
   - Strength: honest about product importance while preserving quality.
   - Weakness: early users may see commands that are not fully implemented.

### Recommendation

Choose option 3.

Import/export belongs in the mature help contract because preservation and
portability are part of the product promise. Implementation should start with
plan/report/ledger contracts and a small number of well-tested sources before
adding breadth.

### Tradeoffs And Mitigation

- Tradeoff: visible but incomplete importers can disappoint users.
  - Mitigation: mark incomplete sources experimental and expose capability
    status clearly.
- Tradeoff: importer correctness requires manual review states.
  - Mitigation: import plans should explicitly label uncertain mappings,
    inferred metadata, media failures, and required human checks.

## Decision 14: Should The CLI Be Installed As A Real Product?

### Options

1. **Keep it as `bun run` scripts.**
   - Strength: trivial inside this repo.
   - Weakness: not a product CLI and unusable as a platform distribution
     surface.
2. **Ship a real `tpm` CLI package over the platform operation layer.**
   - Strength: supports external users, starters, CI, docs, and future studio
     internals.
   - Weakness: introduces versioning and packaging obligations.
3. **Make the CLI only part of the GUI app bundle.**
   - Strength: one product distribution.
   - Weakness: weaker automation and power-user story.

### Recommendation

Ship a real CLI package eventually. It may dogfood this repo first, but it
should not be designed as a `bun run` script collection.

The current repo scripts can remain internal implementation details and quality
gates. The public CLI should have stable help, schemas, exit codes, and
operation contracts.

### Tradeoffs And Mitigation

- Tradeoff: packaging adds overhead.
  - Mitigation: delay public packaging until the operation model and first
    commands are stable enough; do not delay the product design.
- Tradeoff: users may run different CLI/platform versions.
  - Mitigation: `version` and `status` must report CLI, platform, schema, and
    adapter versions.

## Decision 15: `content` Versus `article`, `post`, Or `entry`

### Options

1. **Top-level `article` or `post` commands.**
   - Strength: very friendly for blog users.
   - Weakness: does not cover announcements, pages, authors, collections,
     redirects, data records, or future custom content types.
2. **Top-level `entry` commands.**
   - Strength: maps to normalized content entries.
   - Weakness: "entry" is platform jargon for many authors.
3. **Top-level `content`, with type-aware subcommands and friendly aliases.**
   - Strength: broad enough for the platform while allowing article/post
     language in examples, prompts, and shortcuts.
   - Weakness: "content" can become too broad unless scoped carefully.

### Recommendation

Use `content` as the canonical domain, with article/post/page/announcement
types inside it and optional aliases only after the canonical model is stable.

The CLI should be able to say:

```text
tpm content new article
tpm content list --type announcement
tpm content show articles/a-short-note
```

Beginner flows can still phrase the job as "write a post" or "create an
article." The internal command domain should stay generic enough for future
custom content types and studio forms.

### Tradeoffs And Mitigation

- Tradeoff: `content new article` is longer than `post new`.
  - Mitigation: examples, shell completion, and future aliases can reduce
    friction once the canonical behavior is tested.
- Tradeoff: `content` can become a junk drawer.
  - Mitigation: keep media, source, workflow, release, and publish outside it.
    `content` owns authored entries and their normalized metadata, not every
    file in the site workspace.

## Decision 16: Guided Flows Versus Exact Commands

### Options

1. **Wizard-first CLI.**
   - Strength: approachable in a terminal.
   - Weakness: weak automation and harder documentation/testing.
2. **Exact-command-only CLI.**
   - Strength: scriptable and clear for power users.
   - Weakness: intimidating for default users and support workflows.
3. **Exact commands as the contract, with guided TTY flows over the same
   operations.**
   - Strength: supports humans, CI, GUI, MCP, and tests without duplicate
     logic.
   - Weakness: requires careful prompt-to-flag parity.

### Recommendation

Use exact commands as the durable contract and provide guided TTY flows for
setup, publish, provider connection, media migration planning, import planning,
and repair where guidance materially helps.

Every guided answer must map to a flag, config value, stdin/file input, or plan
field. CI mode must never prompt. The GUI should use the same operation inputs
directly rather than shelling into prompts.

### Tradeoffs And Mitigation

- Tradeoff: building both guided and exact paths costs more.
  - Mitigation: do not implement separate paths. Guided flows should collect
    operation inputs, then call the same planner/executor.
- Tradeoff: prompts can hide important defaults.
  - Mitigation: prompts should show defaults, consequences, target identity,
    and whether the action changes local source, generated output, or a remote
    provider.

## Decision 17: Configuration Interface

### Options

1. **Users edit config files directly; CLI only validates.**
   - Strength: simple for developers and keeps the CLI smaller.
   - Weakness: not enough for default users, GUI parity, or schema-derived
     diagnostics.
2. **CLI owns its own config format.**
   - Strength: can optimize for command UX.
   - Weakness: creates a parallel product model and drift from the studio.
3. **CLI reads and writes typed site config through shared schemas and policy
   helpers.**
   - Strength: keeps CLI, GUI, MCP, docs, diagnostics, and config files in
     sync.
   - Weakness: requires mature config schemas and migration behavior.

### Recommendation

Expose configuration through shared typed schemas. `tpm site config explain`,
`show`, `set`, `unset`, `validate`, `plan`, and `apply` should be
schema-driven and should show source, default, override, profile, validation,
and downstream effects.

Power users can still edit files directly. The CLI should make safe, intended
changes easier and make invalid config noisy before build or publish.

### Tradeoffs And Mitigation

- Tradeoff: schema-driven config requires stronger schema metadata.
  - Mitigation: invest in schema descriptions, examples, defaults,
    deprecations, migrations, and generated docs because the studio needs them
    anyway.
- Tradeoff: CLI config writes may reformat files.
  - Mitigation: prefer narrow structured edits where possible and show a file
    diff or plan before writing when changes are broad.

## Decision 18: Astro-Specific Versus Platform-Agnostic Core

### Options

1. **Make the CLI an Astro-site CLI.**
   - Strength: fastest path from the current repo.
   - Weakness: weakens extractability and makes the product less portable.
2. **Make the CLI entirely framework-agnostic immediately.**
   - Strength: maximum portability.
   - Weakness: risks abstraction without enough product proof.
3. **Make the operation core platform/domain-driven, with Astro as the first
   compiler adapter and current implementation substrate.**
   - Strength: protects future portability without pretending the current
     implementation is framework-neutral today.
   - Weakness: requires discipline to avoid leaking Astro into public command
     language and schemas.

### Recommendation

Choose option 3. The public command language should be platform/domain-driven.
Astro can remain the first renderer/compiler implementation, but users should
not have to think in Astro terms unless they are debugging or developing the
adapter.

This preserves the option to reuse operation contracts, diagnostics, media
policy, release manifests, adapters, and studio models in non-Astro contexts
later.

### Tradeoffs And Mitigation

- Tradeoff: hiding Astro completely is dishonest while Astro owns the build.
  - Mitigation: advanced diagnostics and `version` output can report Astro
    versions and adapter details. Default commands should still speak
    publishing language.
- Tradeoff: platform-agnostic contracts may be harder to design.
  - Mitigation: start by naming domain outputs and policies that are already
    framework-independent: routes, entries, media, metadata, diagnostics,
    release artifacts, and publish plans.

## Decision 19: MCP Surface Timing

### Options

1. **Ignore MCP until the GUI and CLI are done.**
   - Strength: avoids premature agent design.
   - Weakness: risks operation contracts that are hard to expose safely to
     agents later.
2. **Build MCP first.**
   - Strength: proves machine interface early.
   - Weakness: poor default-user value before operations are stable.
3. **Design operations for MCP safety now; implement MCP after the shared
   operation, diagnostics, plan, and permission model settles.**
   - Strength: avoids drift while keeping implementation sequence sane.
   - Weakness: requires documenting future MCP constraints before code exists.

### Recommendation

Choose option 3. The CLI help can include `mcp` in the mature vision, but the
implementation should wait until operations have safety levels, serializable
inputs/outputs, permission scopes, and plan-first behavior.

### Tradeoffs And Mitigation

- Tradeoff: some MCP-specific needs may be discovered later.
  - Mitigation: design operation envelopes with caller identity, safety level,
    required capabilities, diagnostics, and structured results from the start.
- Tradeoff: premature command help can overpromise.
  - Mitigation: mark MCP as a mature-surface goal and capability-gate commands
    until real implementation begins.

## Rejected Hard Pivots

### Pivot: Build Only A GUI, No CLI

Reject. The GUI is essential for default users, but the CLI is the most natural
automation, CI, local support, migration, and operator surface. Without it, the
platform will still need scripts, and those scripts will become an accidental
CLI without design discipline.

### Pivot: Build A Cloudflare-First Publishing CLI

Reject. Cloudflare can be the first excellent default deploy adapter, but the
product model must remain provider-neutral. Otherwise source, media, workflow,
release, and publish semantics will be shaped by one provider.

### Pivot: Build An Astro-Specific CLI

Reject as the public product direction. Astro is the current implementation
substrate and can be the first compiler adapter, but the CLI should not make
Astro concepts the durable language of site ownership, publishing, media,
workflow, release, or diagnostics.

### Pivot: Make GitHub The Source And Workflow Model

Reject. GitHub is useful for TPM-like teams, but default users should not need
Git, and complex publishers may have unrelated workflow systems. Git/GitHub
should be adapters.

### Pivot: Build A Headless CMS Database First

Reject for this roadmap stage. A database-backed CMS could solve some editorial
needs but would compromise the current static compiler strengths and portability
unless it is treated as an optional source adapter later.

### Pivot: Keep The CLI Tiny By Omitting Media, Release, Workflow, And Import

Reject. That would make the CLI simpler only by refusing the hard problems that
make the product valuable. The better path is a mature language with phased
implementation and clear capability status.

## Refinements To Apply To The Strategy

The strategy should be sharpened in these ways:

1. Name the shared operation model as the core abstraction.
2. State that command handlers should be thin renderers/controllers over typed
   operations.
3. Keep `publish`, `release`, `media`, `source`, `workflow`, `check`, and
   `doctor` first-class.
4. Clarify that the first implementation slice is narrow, but the product
   language is intentionally mature.
5. Make profile versus target semantics explicit.
6. Explain that `extension` and `adapter` are distinct but related concepts.
7. Treat machine output schemas as first-release architecture, not later polish.
8. Treat plan/apply as a product safety primitive, not a provider-specific
   command style.

## Final Design Thesis

The best CLI is not the smallest command tree. It is the clearest language for
expressing static publishing operations safely.

The command language should let a user say:

- "show me what site I am working on";
- "tell me what is wrong and how to fix it";
- "show me the media risk before it becomes expensive";
- "build a release I can inspect";
- "publish this exact release to this exact target";
- "prove the live target matches the release";
- "roll back safely";
- "move media/source/workflow providers without rewriting the whole product";
- "export or import without losing provenance";
- "let my GUI, CI, MCP server, and custom extensions do the same operations."

That is the product language worth protecting. The later command spec should
optimize names and syntax, but it should not collapse these concepts unless a
better abstraction preserves the same expressive power with less surface area.
