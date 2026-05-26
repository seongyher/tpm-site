# CLI Design Synthesis Notes

This file captures intermediate synthesis before the final guide is refined.

## Candidate Principles

1. A CLI is a user interface and an API contract at the same time.
2. Human output and machine output should be different explicit surfaces.
3. Command grammar should model the user's domain, not implementation details.
4. Defaults should optimize the most common safe intent and expose clear escape
   hatches.
5. Prompts belong only in interactive contexts and must always have headless
   equivalents.
6. Dangerous operations require preview, confirmation, and recovery/status
   proportional to risk.
7. Help, examples, shell completion, suggestions, and actionable diagnostics
   are part of the product surface, not post-launch documentation polish.
8. Configuration should have a visible precedence model and should separate
   invocation-specific flags, environment-specific values, user preferences,
   project config, and system defaults.
9. Compatibility must be designed before release because scripts create
   long-lived contracts.
10. Accessibility means plain text signals, color opt-out, TTY-aware rich
    output, keyboard-safe prompts, and screen-reader-friendly structure.

## Open Questions

1. How aggressively should new CLIs adopt POSIX option ordering when modern
   parsers often permit options anywhere?
   - Resolution: recommend POSIX-compatible behavior where practical, but do not
     require historical constraints when they harm usability. Document parser
     behavior and use `--` as the stable delimiter.
2. Should all CLIs have JSON output?
   - Resolution: no, but any CLI with structured data, automation intent, or
     stateful workflows should have explicit machine output. Tiny filters may
     instead use stable line-oriented records.
3. Are interactive prompts good or bad?
   - Resolution: good for onboarding and missing inputs in a TTY, bad in
     automation. Require explicit non-interactive behavior.
4. Should powerful output DSLs be copied from `gcloud`, `jq`, or `kubectl`?
   - Resolution: only when the domain repeatedly needs shaping/filtering. Start
     with simple JSON and common examples before adding a custom DSL.

## Contradictions To Resolve

1. CLIG says modern CLIs can be human-first, while POSIX/GNU traditions often
   optimize terse scriptability.
   - Resolution: default to humane output for interactive use, but keep explicit
     quiet/plain/JSON modes stable for automation.
2. Opinionated defaults help users, but hidden filtering can surprise them.
   - Resolution: opinionated defaults are acceptable only when explainable,
     observable, and overrideable.
3. Strong confirmation prompts improve safety, but automation needs no prompts.
   - Resolution: pair every interactive confirmation with an explicit
     automation affordance such as a saved plan, typed confirm flag, or
     documented `--yes`/`--force`.
