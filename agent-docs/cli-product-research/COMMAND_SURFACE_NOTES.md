# Command Surface Notes

This file applies the general CLI design guide to TPM-specific command surface
principles. It is not a final command reference.

## Topics

- Command grammar.
- Output modes.
- Interactivity and prompts.
- Safety levels.
- Diagnostics.
- Config and auth.
- Machine output and CI.
- Compatibility.

## Status

This is not a final command reference. Command examples use `tpm` as a
placeholder product name so the design can be concrete enough to evaluate. The
actual CLI name and exact commands should be finalized in a later command-spec
milestone.

## Product Vocabulary

Use publishing vocabulary before implementation vocabulary:

- create/open site;
- check/doctor;
- preview;
- build/export;
- publish;
- rollback;
- inspect;
- import/export;
- connect provider;
- manage media;
- manage extensions.

Avoid making these the default vocabulary:

- Astro collections;
- Wrangler deploy;
- Git commit/branch/PR;
- CI artifact;
- Cloudflare Worker;
- frontmatter schema;
- `dist/`;
- plugin internals.

Technical terms can appear in advanced detail, adapter diagnostics, and
developer commands, but the top-level human output should explain the
publishing action.

## Candidate Command Families

These are responsibility areas, not approved command names.

### Site Workspace

Likely jobs:

- create a site workspace from a starter;
- identify current workspace;
- explain active site config and source roots;
- validate site structure.

Candidate shape:

```text
tpm init
tpm status
tpm config show
tpm config explain <key>
```

Design notes:

- `init` should create site source, not platform source.
- `status` should be the fastest orientation command.
- config explanation should show source, precedence, defaults, and overrides.

### Diagnostics

Likely jobs:

- check content/config/routes/media/metadata/generated output;
- repair or explain issues;
- produce CI-compatible JSON.

Candidate shape:

```text
tpm check
tpm doctor
tpm doctor --json
tpm doctor --fix --dry-run
```

Design notes:

- `check` can be strict and CI-oriented.
- `doctor` can be more explanatory and repair-oriented.
- `--fix` should require dry-run/plan behavior before mutating source.
- Diagnostics need stable codes and artifact/file/route references.

### Preview

Likely jobs:

- preview source locally;
- preview built output;
- preview generated artifacts;
- preview provider deployment when supported.

Candidate shape:

```text
tpm preview
tpm preview --built
tpm preview artifact <kind>
tpm publish preview --target <target>
```

Design notes:

- Do not overload one preview command to mean source server, built server, and
  provider preview without clear mode output.
- Provider previews require deploy adapter capabilities and should be planned.

### Build, Export, And Artifacts

Likely jobs:

- build static output;
- export source or generated artifacts;
- inspect release artifact manifests.

Candidate shape:

```text
tpm build
tpm artifact list
tpm artifact show <artifact>
tpm export
```

Design notes:

- `build` should run the platform compiler and verifier, not just wrap Astro.
- `artifact` commands expose what would otherwise be hidden in `dist/`.
- `export` should distinguish source export from generated-output export.

### Publish And Deploy

Likely jobs:

- plan publication to a target;
- publish to target;
- check target/provider readiness;
- inspect publish target status;
- rollback when supported.

Candidate shape:

```text
tpm publish plan
tpm publish
tpm publish status
tpm publish rollback <release>
```

Design notes:

- `publish` is product vocabulary; `deploy` may be an advanced/provider area.
- Mutating publish should have plan semantics and explicit target identity.
- Automation should use saved plan/artifact or explicit approval, not prompts.

### Media

Likely jobs:

- inventory media;
- validate image/source policy;
- find large/unoptimized/unused/remote media;
- plan migration between media adapters.

Candidate shape:

```text
tpm media check
tpm media list
tpm media plan-migration
tpm media migrate --plan <file>
```

Design notes:

- First phase can be diagnostics only.
- Migration must be plan-first, reversible where possible, and preserve
  references/metadata.

### Import, Export, And Preservation

Likely jobs:

- import legacy content;
- map old URLs and metadata;
- generate preservation diagnostics;
- export source/generation bundles.

Candidate shape:

```text
tpm import plan <source>
tpm import apply <plan>
tpm export source
tpm export release
```

Design notes:

- Import should never be a blind conversion.
- Plans should identify uncertain mappings and manual-review items.

### Extensions And Adapters

Likely jobs:

- list available/installed extensions;
- validate manifests;
- inspect adapter capabilities;
- scaffold extension fixtures later.

Candidate shape:

```text
tpm extension list
tpm extension check
tpm adapter list
tpm adapter capabilities <adapter>
```

Design notes:

- This is likely a later phase unless needed for bundled adapters.
- Extension commands should consume manifest contracts, not inspect random
  files.

## Output Modes

Human output:

- concise by default;
- remediation-first for diagnostics;
- show current context before dangerous operations;
- summarize generated artifact counts and release state.

Machine output:

- every check/status/build/publish-plan command should support JSON;
- JSON should include schema version, command version, status, diagnostics,
  artifacts, and target context;
- stdout is JSON/data in machine mode;
- stderr is progress/logs/diagnostics not part of the data stream.

## Interactivity

Rules:

- Prompt only in TTY mode.
- Support `--no-input` globally for commands that might prompt.
- Every prompt must have flags/config equivalents.
- CI mode should fail with remediation, not wait.
- Secrets must use provider credential stores, stdin, no-echo prompts, or
  environment references, never ordinary logged flags.

## Safety Levels

Low risk:

- `status`, `list`, `show`, `check`, read-only inspect commands.

Moderate risk:

- source edits, config writes, starter initialization into non-empty
  directories, generated-output cleanup.

Severe risk:

- publish to production, rollback, unpublish, delete generated/provider state,
  media migration that rewrites references, import apply over existing content.

Safety requirements:

- severe commands need plan/dry-run output;
- production publish needs explicit target and account context;
- destructive commands need typed confirmation or saved plan/approval;
- automation needs explicit `--yes`, `--force`, or saved plan semantics;
- rollback capability must be reported before publish.

## Compatibility

Public contracts:

- command names and flags;
- JSON output schemas;
- diagnostic codes;
- release artifact schemas;
- extension/adapter manifest fields;
- exit code classes.

Policy notes:

- mark experimental commands before release;
- version JSON/release schemas;
- avoid arbitrary command abbreviations;
- add compatibility tests for command grammar and machine output.

## Command Design Guardrail

For every future command, fill the command contract template from
`agent-docs/CLI_DESIGN_GUIDE.md` before implementation. If the command cannot
answer its mutation risk, output mode, platform contract, and non-interactive
behavior, it is not ready to build.
