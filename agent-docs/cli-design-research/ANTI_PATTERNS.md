# CLI Anti-Pattern Notes

This file records CLI design hazards and tradeoffs discovered during research.
The final guide should include only anti-patterns that are supported by
evidence or explicitly marked as judgment-based synthesis.

## Anti-Pattern Rubric

- Pattern.
- Why it harms users, automation, safety, or maintainability.
- Evidence strength.
- When it may be acceptable.
- Better default.

## Treating Human Output As A Machine Contract

- **Pattern:** Scripts parse colorful tables, progress text, localized prose, or
  debug logs because no stable machine output exists.
- **Why harmful:** Human output changes for readability; scripts need stable
  schemas. Terraform explicitly documents that unstructured UI text is not a
  stable interface and uses `-json` for machine-readable output.
- **Evidence strength:** Strong.
- **Acceptable when:** The command is purely human-facing and documents no
  automation promise.
- **Better default:** Provide explicit `--json`, JSON lines, stable
  record-oriented text, or a versioned machine UI. Keep human output free to be
  readable.

## Prompting In Non-Interactive Contexts

- **Pattern:** A command prompts even when stdin is piped, running in CI, or
  called by an agent/script.
- **Why harmful:** It hangs automation, hides missing inputs, and makes failure
  modes unpredictable. CLIG recommends prompting only when stdin is a TTY and
  providing `--no-input`; Terraform uses `-input=false` for automation.
- **Evidence strength:** Strong.
- **Acceptable when:** A command is explicitly an interactive TUI and documents
  no headless mode.
- **Better default:** Detect TTYs, fail with a concrete remediation when input
  is missing, and provide flags/files/stdin paths for every required value.

## Destructive Operations Without Preview Or Proportional Friction

- **Pattern:** A command mutates or deletes important local/remote state without
  a preview, confirmation, or automation-safe equivalent.
- **Why harmful:** Users cannot validate intent before damage. Terraform's
  plan/apply split and CLIG's severity-based confirmations show that risky
  commands need proportional friction.
- **Evidence strength:** Strong.
- **Acceptable when:** The operation is trivially reversible or its command name
  already makes the action explicit and low risk.
- **Better default:** Add dry-run/plan/diff, require confirmation for
  moderate/severe actions, and use typed confirmation for severe actions. Keep a
  documented `--force`, `--yes`, or saved-plan path for automation.

## Flag And Alias Sprawl

- **Pattern:** Many short aliases, inconsistent synonyms, boolean clusters, and
  flags that act as commands.
- **Why harmful:** Short aliases collide, scripts depend on accidental names,
  and users cannot transfer knowledge across subcommands. Microsoft guidance
  recommends minimizing short aliases and treating options as command
  parameters; GNU recommends common long option names.
- **Evidence strength:** Strong.
- **Acceptable when:** A short alias is conventional (`-h`, `-o`, `-v` when
  unambiguous, `-q`, `-f`) or the command is a high-frequency expert tool.
- **Better default:** Prefer clear long flags, stable explicit aliases, and
  subcommands for actions.

## Arbitrary Abbreviations And Magic Inference

- **Pattern:** Accepting any non-ambiguous subcommand prefix, silently guessing
  resource types, or changing meaning based on remote state without explaining
  the rule.
- **Why harmful:** It creates compatibility traps: future commands can break old
  scripts. It also makes failures hard to diagnose.
- **Evidence strength:** Strong for abbreviation risk via CLIG; moderate for
  broader inference.
- **Acceptable when:** The abbreviation is an explicit permanent alias with
  documented semantics.
- **Better default:** Use stable aliases, suggestions for mistyped commands,
  and dry-run/explain output for inferred behavior.

## Hidden Network Or Filesystem Side Effects

- **Pattern:** A command reads/writes unexpected files, changes external config,
  downloads remote resources, or calls analytics without explicit user intent.
- **Why harmful:** It breaks trust, surprises users in scripts, complicates
  reproducibility, and can create privacy/security issues. CLIG calls out
  boundary-crossing actions as usually needing explicitness.
- **Evidence strength:** Moderate to strong.
- **Acceptable when:** The side effect is a clearly documented cache or internal
  state needed for the command and has safe invalidation.
- **Better default:** Print what changed, ask before modifying files outside the
  command's own state, keep caches in standard locations, and make remote calls
  clear.

## Secrets In Flags, URLs, Logs, Or Shell History

- **Pattern:** Accepting `--password value`, printing tokens in debug output, or
  encouraging secrets in shell history.
- **Why harmful:** CLI arguments are often visible in process listings and shell
  history. CLIG recommends secret files or stdin instead of direct secret flags.
- **Evidence strength:** Strong.
- **Acceptable when:** A compatibility path is unavoidable and explicitly
  marked unsafe/deprecated.
- **Better default:** Read secrets from stdin, keychain/credential stores,
  files with permission checks, or interactive no-echo prompts. Redact logs.

## Color, Spinners, And Tables As Meaning

- **Pattern:** Color is the only signal of success/error, progress animation
  corrupts logs, or tables wrap unpredictably when piped.
- **Why harmful:** It harms accessibility, screen readers, copy/paste, logs, and
  machine parsing. PatternFly warns against color-only meaning and dynamic
  animations; CLIG recommends disabling color outside TTYs or on request.
- **Evidence strength:** Strong.
- **Acceptable when:** Rich display is TTY-only, non-essential, and has a plain
  equivalent.
- **Better default:** Label statuses in text, detect TTY, support `NO_COLOR` and
  explicit color modes, send progress to stderr, and provide plain/JSON output.

## No Current-State Or Recovery Command

- **Pattern:** Workflow commands mutate state, but there is no obvious command
  to inspect current state, undo, retry, resume, or explain what happened.
- **Why harmful:** Users get stranded after partial failure or long workflows.
  CLIG emphasizes making current state visible and suggesting next commands.
- **Evidence strength:** Moderate.
- **Acceptable when:** The tool is stateless and each command has no durable
  side effects.
- **Better default:** Provide `status`, `doctor`, `list`, `show`, `logs`,
  `resume`, `rollback`, or equivalent commands where state exists.

## Documentation That Only Lists Flags

- **Pattern:** Help output names flags but does not show examples, workflows,
  failure modes, or next steps.
- **Why harmful:** CLIs force recall; examples and suggestions turn help into a
  discovery surface. CLIG emphasizes examples and "what to run next."
- **Evidence strength:** Moderate to strong.
- **Acceptable when:** A tiny Unix-style filter has only one obvious usage.
- **Better default:** Include synopsis, plain-language description, common
  examples, important defaults, automation notes, environment/config
  precedence, and links to full docs.

## Treating Compatibility As An Afterthought

- **Pattern:** Renaming commands, changing output shape, removing flags, or
  changing defaults without deprecation, versioning, or migration guidance.
- **Why harmful:** CLIs are APIs. Microsoft guidance explicitly notes they are
  hard to change once scripts rely on them.
- **Evidence strength:** Strong.
- **Acceptable when:** The CLI is clearly experimental and versioned as such.
- **Better default:** Design command grammar carefully, version machine output,
  deprecate with warnings, preserve aliases, and publish migration notes.

## Excessive Scope In One Command

- **Pattern:** A single command both discovers, validates, mutates, deploys,
  watches, and reports without separable steps.
- **Why harmful:** It is difficult to test, automate, recover, preview, or
  explain. It often forces prompts and hidden side effects.
- **Evidence strength:** Judgment supported by Terraform and CLIG workflow
  guidance.
- **Acceptable when:** The command is a convenience wrapper that clearly prints
  each step and delegates to explicit subcommands.
- **Better default:** Provide composable primitives and a high-level workflow
  command that can be decomposed, previewed, and resumed.

## Tradeoff Notes

1. **Human-first vs script-first:** A modern CLI can be friendly by default if
   it also provides explicit machine modes. The mistake is making one output
   serve both audiences accidentally.
2. **Opinionated defaults vs exhaustive control:** Defaults should match the
   dominant use case, but every ignored/excluded/skipped thing should be
   discoverable and overrideable.
3. **Interactive guidance vs CI safety:** Prompts are useful onboarding tools;
   they are bugs in non-interactive contexts unless explicitly requested.
4. **Powerful DSLs vs simple flags:** A DSL can be appropriate for recurring
   structured transformations, but it must earn its complexity with examples,
   stable semantics, and useful errors.
5. **Compatibility vs cleanup:** Once released, a CLI should prefer aliases,
   deprecations, and migrations over breaking old command lines. Experimental
   channels can move faster but must be labeled.
