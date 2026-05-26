# CLI Design Guide

This guide is an evergreen reference for designing excellent command line
interfaces. It synthesizes standards, expert guidance, case studies,
anti-patterns, and practical review criteria.

## Purpose

Use this guide before designing a new CLI, changing an existing command, or
reviewing a command-line interface for usability, safety, automation, and
long-term compatibility. It is intentionally general-purpose. It is not a
product-specific command spec.

The central conclusion is simple:

> A CLI is both a user interface and an API contract. Design the human
> conversation and the automation contract deliberately, or users will invent
> brittle contracts from whatever output happens to exist.

## Evidence Base

This guide leans on several source classes:

- formal and platform conventions:
  [POSIX Utility Conventions](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html),
  [GNU command-line standards](https://www.gnu.org/prep/standards/html_node/Command_002dLine-Interfaces.html),
  [GNU `--help`](https://www.gnu.org/prep/standards/html_node/_002d_002dhelp.html),
  [GNU `--version`](https://www.gnu.org/prep/standards/html_node/_002d_002dversion.html),
  [Microsoft command syntax notation](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/command-line-syntax-key),
  and
  [Microsoft System.CommandLine design guidance](https://learn.microsoft.com/en-us/dotnet/standard/commandline/design-guidance);
- modern CLI UX guidance:
  [Command Line Interface Guidelines](https://clig.dev/),
  [PatternFly's CLI handbook](https://www.patternfly.org/developer-resources/cli-handbook/),
  and general usability guidance such as
  [Nielsen Norman Group heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/);
- official docs for instructive CLIs and tools:
  [GitHub CLI formatting](https://cli.github.com/manual/gh_help_formatting),
  [GitHub CLI completion](https://cli.github.com/manual/gh_completion),
  [Terraform plan](https://developer.hashicorp.com/terraform/cli/commands/plan),
  [Terraform apply](https://developer.hashicorp.com/terraform/cli/commands/apply),
  [Terraform machine-readable UI](https://developer.hashicorp.com/terraform/internals/machine-readable-ui),
  [Terraform automation](https://developer.hashicorp.com/terraform/tutorials/automation/automate-terraform),
  [kubectl reference](https://kubernetes.io/docs/reference/kubectl/),
  [kubectl completion](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_completion/),
  [Google Cloud CLI formats](https://docs.cloud.google.com/sdk/gcloud/reference/topic/formats),
  [ripgrep](https://github.com/BurntSushi/ripgrep),
  [fd](https://github.com/sharkdp/fd),
  [Git](https://git-scm.com/docs/git),
  [Pro Git plumbing and porcelain](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain),
  and [jq](https://jqlang.github.io/jq/manual/);
- environment and accessibility conventions:
  [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/latest/)
  and [`NO_COLOR`](https://no-color.org/).

Evidence labels used below:

- **Strong:** standards or multiple credible sources agree.
- **Moderate:** strong source, but domain-specific or context-dependent.
- **Judgment:** reasoned synthesis from evidence and engineering practice.

## Core Principles

### Design The Conversation And The Contract

Evidence: strong.

A CLI conversation is what a human sees: command names, prompts, progress,
errors, examples, and next-step suggestions. A CLI contract is what automation
depends on: arguments, flags, exit codes, stdout/stderr behavior, machine
output schemas, config precedence, and compatibility promises.

Do not let the contract emerge accidentally from human output. Terraform's
machine-readable UI docs are explicit that unstructured UI text is for terminal
readers, not stable integrations. GitHub CLI similarly exposes explicit
`--json`, `--jq`, and `--template` modes rather than asking scripts to scrape
tables.

Good default:

- readable human output for terminal use;
- explicit `--json`, JSON lines, or stable line-oriented records for
  automation;
- documented exit codes for meaningful failure classes;
- progress/logging on stderr when stdout is data;
- versioned schemas for machine interfaces that may evolve.

### Follow Conventions Until They Harm The User

Evidence: strong.

POSIX and GNU conventions are valuable because they make CLIs guessable and
scriptable. Use familiar long options, support `--help` and `--version`, use
`--` as the end-of-options delimiter, and prefer conventional names such as
`--output`, `--quiet`, `--verbose`, `--force`, `--dry-run`, and `--json`.

Modern CLIs often need subcommands, richer output, and product workflows. That
is fine. The rule is not "copy ancient commands"; it is "make the common path
predictable." When breaking convention improves usability, document the choice
and preserve script safety.

Good default:

```text
tool resource action [resource-id] [flags]
tool action [operands] [flags]
tool --help
tool command --help
tool --version
```

Avoid:

- flag names that mean different things across subcommands;
- short aliases that conflict with common meanings;
- options that perform primary actions instead of parameterizing commands;
- parser behavior that surprises users moving flags before or after operands.

### Model The Domain, Not The Implementation

Evidence: moderate.

Command names should express user concepts. Git's official distinction between
porcelain and plumbing is useful: human-facing commands should be porcelain,
while low-level implementation tools can exist behind a separate surface.

Resource-oriented CLIs such as `kubectl` demonstrate that a consistent grammar
can scale across a large domain. But large grammars need excellent help,
completion, examples, and beginner paths.

Good default:

- use nouns and verbs the user already understands;
- keep implementation vocabulary in advanced or diagnostic commands;
- use subcommands to group areas, not as arbitrary folders;
- keep grammar consistent across the command tree;
- make advanced escape hatches explicit.

### Make Defaults Safe, Useful, And Explainable

Evidence: strong.

Opinionated defaults can make a CLI excellent. `ripgrep` and `fd` succeed
because they skip ignored, hidden, or irrelevant files by default for common
developer searches. They also document escape hatches when users need broader
searches.

An opinionated default is good only if users can understand it, observe it, and
override it.

Good default:

- optimize the most common safe intent;
- print enough status to avoid "is it broken?" uncertainty;
- expose `--dry-run`, `--verbose`, `--explain`, `--debug`, or equivalent when
  users need to understand behavior;
- provide escape hatches for excluded files, remote checks, or safety rails;
- avoid hidden network, filesystem, or analytics behavior.

### Keep Interactivity Explicit And TTY-Aware

Evidence: strong.

Prompts are good onboarding and recovery tools for humans. They are bugs in CI,
pipes, and agent workflows unless explicitly requested.

CLIG recommends prompting only when stdin is an interactive terminal and
providing a no-input mode. Terraform's `-input=false` and automation docs show
the same separation in a high-risk domain.

Good default:

- prompt only when stdin is a TTY;
- fail with a clear remediation when required input is missing in
  non-interactive mode;
- support `--no-input` or an equivalent global non-interactive option;
- make every prompt answerable through flags, files, stdin, or config;
- hide secret input when prompting;
- keep Ctrl-C responsive and explain cleanup behavior.

### Put Safety Before Speed For Dangerous Operations

Evidence: strong.

Destructive or remote-changing commands need friction proportional to risk.
Terraform is the strongest case study: preview with `plan`, execute with
`apply`, confirm before applying, and support saved plan files for review and
automation.

Risk levels:

- **Low:** local, obvious, easy to undo.
- **Moderate:** bulk local changes, remote updates, hard-to-undo changes, or
  non-obvious cascading effects.
- **Severe:** deletion of remote resources, publication, deployment, security
  changes, irreversible data loss, or cross-account actions.

Good default:

- low risk: clear command name and useful output may be enough;
- moderate risk: show summary/diff and ask for confirmation in TTY mode;
- severe risk: require typed confirmation, explicit target names, saved plans,
  or policy gates;
- automation: require explicit flags or saved review artifacts rather than
  relying on prompts;
- always provide state inspection after mutation.

### Make Discovery Part Of The Interface

Evidence: strong.

CLIs force recall, so they must teach as they run. `--help`, command-specific
help, examples, shell completion, suggested next commands, and actionable
errors are part of the UX.

Good help includes:

- one-sentence purpose;
- usage synopsis using standard notation;
- common examples;
- required arguments and defaults;
- important environment variables and config files;
- output modes;
- safety/automation notes for mutating commands;
- links to complete docs when appropriate.

Completions should be generated or tested from the command definition when
possible. GitHub CLI and `kubectl` both provide multi-shell completion
commands, and Cobra's docs frame completion as command/flag/argument discovery.

### Design Output As A Product Surface

Evidence: strong.

Output is the interface. It must tell humans enough and give machines a stable
shape when promised.

Human output rules:

- say what changed when state changes;
- show current state for multi-step workflows;
- suggest next commands when helpful;
- keep success output brief but not silent for long or stateful operations;
- send diagnostics and progress to stderr when stdout may be piped;
- avoid wrapping tables in ways that destroy copy/paste or line-oriented use;
- use color sparingly and never as the only signal.

Machine output rules:

- support explicit structured output for structured data;
- document schema stability and versioning;
- prefer JSON for nested records and JSON lines for streams;
- avoid including terminal control characters in machine output;
- keep field names stable;
- add fields compatibly when possible;
- make breaking changes through a versioned format.

### Make Errors Actionable

Evidence: moderate to strong.

An error message should identify what failed, why it failed if known, and what
the user can do next. General usability heuristics emphasize plain language,
problem precision, and constructive recovery. CLIG similarly recommends
suggesting corrections and next steps.

Good default:

```text
Error: Missing required project config file

Expected: ./config/project.json
Next step: run `tool init` or pass `--config <path>`.
```

Avoid:

- stack traces by default;
- vague messages such as "failed" or "invalid input";
- color-only severity;
- error codes with no explanation;
- swallowing partial success or cleanup status.

### Treat Configuration As A Layered Contract

Evidence: strong.

Configuration should have a documented precedence model. CLIG recommends
thinking about whether a setting varies per invocation, per shell/session, per
project, per user, or per system. XDG specifies Unix-like locations for config,
state, cache, runtime files, and data.

Suggested precedence from highest to lowest:

1. command-line flags;
2. environment variables;
3. project/workspace config;
4. user config;
5. system config;
6. compiled defaults.

Use flags for invocation-specific choices, environment variables for
environment-specific choices, project config for shared workspace policy, user
config for preferences, and system config for machine-wide policy.

Good default:

- expose `config get`, `config set`, and `config explain` for non-trivial
  configuration;
- print where a value came from in diagnostic modes;
- store config/cache/state in platform-appropriate locations;
- do not put secrets in plain config unless explicitly requested and warned;
- support `NO_COLOR` for color opt-out when color is on by default.

### Handle Auth And Secrets As A Dedicated UX

Evidence: strong.

Authentication is not just a flag. It includes login, credential storage,
token refresh, logout, redaction, CI usage, and cross-account clarity.

Good default:

- provide explicit `login`, `status`, and `logout` flows;
- show which account, workspace, tenant, or project is active before dangerous
  remote actions;
- avoid secret values in flags, process listings, URLs, shell history, logs,
  and crash reports;
- read secrets from stdin, no-echo prompts, files, keychains, or provider
  credential stores;
- redact tokens and known secret patterns in debug output;
- provide CI-friendly auth through environment variables or credential files
  with clear warnings.

### Make Compatibility A Release Discipline

Evidence: strong.

A CLI is hard to change once users script it. Microsoft guidance explicitly
frames CLI design as an API-like contract, and Git demonstrates how long
compatibility tails can preserve early decisions for decades.

Good default:

- treat command grammar, flags, exit codes, and machine schemas as public
  contracts;
- keep explicit aliases stable;
- do not accept arbitrary abbreviations that could block future command names;
- add deprecation warnings before removing behavior;
- version machine output;
- mark experimental commands clearly;
- publish migration notes and compatibility windows.

### Keep Accessibility In The Terminal

Evidence: moderate to strong.

Terminal UX still has accessibility concerns. PatternFly highlights color,
clear content, keyboard-safe prompts, screen-reader-friendly structure, and
testing. `NO_COLOR` provides a simple opt-out convention for ANSI color.

Good default:

- do not rely on color alone;
- label success, warning, and error states with text;
- keep interactive flows keyboard-only and escapable;
- avoid essential animations/spinners;
- support plain output modes;
- detect TTY before rich formatting;
- test important flows with color disabled and output redirected.

## Command Grammar Guidelines

### Command Tree

Evidence: moderate.

Use a small command tree that can grow without surprises.

Prefer:

```text
tool init
tool login
tool status
tool doctor
tool resource list
tool resource show <id>
tool resource create [flags]
tool resource update <id> [flags]
tool resource delete <id> [flags]
```

Avoid:

```text
tool --create-resource
tool do-resource-stuff
tool resource --delete <id>
tool r d <id>
```

Rationale:

- verbs are easier to discover as subcommands than as action flags;
- grouping commands improves help output;
- explicit commands leave room for future flags;
- stable aliases can be added later, but arbitrary abbreviations create
  compatibility traps.

### Arguments And Flags

Evidence: strong.

Arguments are usually the primary objects of the command. Flags modify behavior.

Use arguments when:

- the value is required and central to the command;
- positional order is obvious;
- the command would be meaningless without it.

Use flags when:

- the value is optional;
- the value controls mode, output, target, or safety behavior;
- the value may be provided from config or environment;
- naming the value improves clarity.

Prefer long flags. Add short flags only when conventional or high-frequency.

Recommended common flags:

- `--help`, `-h`: help only;
- `--version`: version only;
- `--output`, `-o`: output path or format when unambiguous;
- `--format`: human/table/json/yaml/plain when output type is central;
- `--json`: JSON output for tools with structured data;
- `--quiet`, `-q`: suppress non-essential human output;
- `--verbose`: increase human detail;
- `--debug`: implementation/debug detail, usually stderr;
- `--dry-run`: preview without mutation;
- `--force`: bypass safety checks when appropriate;
- `--yes` or `--confirm`: explicit non-interactive approval;
- `--no-input`: disable prompts.

Avoid optional positional arguments when flags would be clearer.

### Exit Codes

Evidence: judgment supported by POSIX/Unix practice.

At minimum:

- `0`: success;
- non-zero: failure.

For larger CLIs, document stable classes:

- usage/config error;
- validation error;
- not found;
- conflict;
- authentication/authorization failure;
- network/provider failure;
- partial failure;
- interrupted/cancelled.

Do not overfit dozens of exit codes before users need them. A few meaningful
classes plus structured diagnostics are usually better.

## Output And Diagnostics Guidelines

### stdout And stderr

Evidence: strong.

Use stdout for primary command output. Use stderr for diagnostics, progress,
warnings, prompts, and debug logs. This keeps pipes useful:

```sh
tool items list --json | jq '.items[].id'
```

If stdout is a data stream, never mix it with progress bars, prompts, warnings,
or color control sequences.

### Human Output

Evidence: strong.

Human output should answer:

1. What happened?
2. What changed?
3. What is the current state?
4. What should I do next?
5. Where do I get more detail?

Use terse success for simple commands and richer summaries for state changes.
For long-running commands, show progress in a TTY and plain progress or quiet
mode in logs.

### Machine Output

Evidence: strong.

Use machine output when:

- results contain structured data;
- users will script the command;
- another tool or service will call it;
- output has nested or repeated records;
- diagnostics need stable codes.

Design requirements:

- explicit flag such as `--json`;
- documented schema;
- schema version for long-lived integrations;
- stable field names;
- no color/progress/control characters;
- additive changes where possible;
- clear null/missing semantics;
- deterministic ordering where users may diff output.

### Diagnostics

Evidence: moderate to strong.

Good diagnostics include:

- severity;
- concise human message;
- stable code when useful;
- exact file/resource/flag/field involved;
- cause when known;
- remediation;
- link or command for deeper help.

For example:

```text
Error [CONFIG_MISSING_REQUIRED_FIELD]: Missing required field "title"

File: ./config/project.json
Next step: add "title" or run `tool config doctor --fix`.
```

## Safety Patterns

### Preview

Evidence: strong.

Any command that changes important state should consider a preview:

- `--dry-run`;
- `plan`;
- `diff`;
- `validate`;
- `doctor`;
- `check`.

The preview should be as close as practical to the real operation, but it must
state known uncertainty. Terraform's docs explicitly warn that speculative
plans can be invalidated by later changes.

### Confirmation

Evidence: strong.

Use proportional friction:

- low risk: no prompt or a simple summary;
- moderate risk: `Proceed? [y/N]`;
- severe risk: type the target name, pass a saved plan, or provide
  `--confirm <target>`;
- automation: explicit approval flag or saved artifact.

Never make automation depend on answering a prompt.

### Recovery

Evidence: judgment.

If a command mutates durable state, design the recovery story before release:

- `status`;
- `logs`;
- `history`;
- `rollback`;
- `undo`;
- `resume`;
- `retry`;
- cleanup instructions after interruption.

Even when rollback is impossible, state inspection and clear partial-failure
diagnostics reduce user harm.

## Configuration And Environment

### Precedence

Evidence: strong.

Document precedence. A reliable default is:

1. flags;
2. environment variables;
3. project config;
4. user config;
5. system config;
6. built-in defaults.

Make this inspectable:

```sh
tool config explain color
```

Expected output:

```text
color = auto
source = user config: ~/.config/tool/config.json
overrides = --color, TOOL_COLOR, project config
```

### File Locations

Evidence: moderate to strong.

On Unix-like systems, follow XDG for config, data, state, cache, and runtime
files where practical. On macOS and Windows, use platform-appropriate
locations. Do not litter home directories with hidden files unless the
ecosystem strongly expects it.

### Environment Variables

Evidence: strong.

Environment variables are best for environment-specific values, CI behavior,
debugging, and cross-command defaults.

Good conventions:

- uppercase with a tool prefix;
- single-line values where practical;
- no secrets in logs;
- `NO_COLOR` support for color opt-out;
- proxy variables when doing network requests;
- `EDITOR` or equivalent when opening an editor;
- documented interaction with flags and config.

## Interactive UX

### Prompts

Evidence: strong.

Prompts should:

- appear only in interactive terminals unless explicitly requested;
- state why input is needed;
- show defaults;
- validate before proceeding;
- be answerable by flags/config/stdin;
- support cancellation;
- hide secrets.

Avoid multi-step wizards as the only path. A wizard can be a friendly wrapper,
but every result should map to inspectable config or explicit commands.

### Progress

Evidence: moderate.

Progress should reassure without corrupting output:

- use spinners/progress bars only in TTYs;
- use plain log lines in CI;
- put progress on stderr when stdout is data;
- include elapsed time or phases for long operations;
- handle Ctrl-C quickly.

### Shell Completion

Evidence: moderate to strong.

Completion is documentation at typing time. Generate it from command metadata
when possible so it does not drift.

Support at least the dominant shells for the target audience. For broad
developer CLIs, bash, zsh, fish, and PowerShell are reasonable defaults.

## Documentation Requirements

Evidence: strong.

Every CLI should have:

- quickstart;
- command reference;
- examples for common workflows;
- error/troubleshooting guide;
- automation/CI guide if automation is supported;
- config precedence documentation;
- auth/secrets documentation if applicable;
- machine output schemas if any command has machine output;
- deprecation and compatibility policy.

Every command's help should be useful without opening a browser. External docs
can go deeper, but terminal help must be enough to recover from common
mistakes.

## Agent And Automation Readiness

Evidence: judgment based on automation guidance and structured-output sources.

Modern CLIs are increasingly used by CI systems, orchestration tools, editor
agents, MCP servers, and other non-human callers. A CLI that is good for agents
is usually also good for scripts: deterministic input, stable output, clear
errors, and explicit side-effect boundaries.

Agent-ready design requirements:

- commands are deterministic when given the same inputs and environment;
- prompts never appear unless explicitly interactive;
- every mutating command has a dry-run, plan, or confirmation bypass that is
  explicit and safe to review;
- machine output is structured and documented;
- diagnostics include stable codes and remediation;
- file/resource paths are explicit in errors;
- commands can explain discovered config and current state;
- secrets are redacted by default;
- long-running commands expose progress without corrupting stdout;
- destructive commands make target identity unambiguous.

Avoid designing a separate "agent CLI" unless agents truly need different
capabilities. Prefer one stable command contract that humans, scripts, and
agents can all use through different output and interactivity modes.

## Command Contract Template

Evidence: judgment.

Use this template before implementing a command. It forces design decisions to
be made before parser defaults and incidental output become compatibility
contracts.

```text
Command:
Purpose:
Audience:
Primary nouns:
Primary action:
Mutates state:
Risk level:
Required arguments:
Optional flags:
Config inputs:
Environment inputs:
Interactive prompts:
Non-interactive equivalent:
Human output:
Machine output:
stdout:
stderr:
Exit codes:
Diagnostics:
Auth/secrets:
Files read:
Files written:
Network calls:
Preview/dry-run:
Recovery/status command:
Compatibility notes:
Examples:
Tests:
```

## Case-Study Lessons

These are instructive examples, not rankings. Popularity alone is not evidence
of excellent UX, and several important CLIs are useful partly because their
tradeoffs are visible.

### Lessons To Copy

1. **GitHub CLI:** Keep product workflows close to where developers already
   work; provide structured output and completions.
2. **Terraform:** Use preview/apply separation, saved artifacts, explicit
   non-interactive modes, and versioned machine output for risky domains.
3. **kubectl:** A consistent resource grammar can scale, but only with output
   modes, completions, and strong docs.
4. **Google Cloud CLI:** Cross-cutting `--format` and `--filter` can be
   powerful when users need structured output often.
5. **ripgrep and fd:** Opinionated defaults can dramatically improve common
   workflows when escape hatches are obvious.
6. **jq:** A focused DSL can be worth learning when it solves a recurring
   structured-data problem.
7. **Git:** Layered porcelain/plumbing surfaces are useful, but early
   implementation vocabulary can become long-term UX debt.

### Lessons To Avoid

1. Do not mistake popularity for perfect design.
2. Do not expose internals as primary commands unless the audience needs them.
3. Do not make scripts scrape human output.
4. Do not make safety depend only on "Are you sure?" prompts.
5. Do not introduce magic abbreviations that block future command names.
6. Do not add a powerful DSL before simple output modes and examples are
   insufficient.

## Anti-Pattern Checklist

Before release, look for these hazards:

- human output is the only automation surface;
- prompts can hang CI;
- destructive commands lack preview or proportional confirmation;
- secrets can appear in flags, logs, process listings, or shell history;
- color is the only signal;
- progress corrupts stdout;
- many flags act like commands;
- short aliases are inconsistent or speculative;
- arbitrary command abbreviations are accepted;
- hidden filesystem/network side effects occur;
- config precedence is undocumented;
- output schemas are unversioned;
- current state cannot be inspected;
- errors do not suggest remediation;
- help lacks examples;
- breaking changes have no deprecation path.

## CLI Review Rubric

Use this rubric before implementation and again before release.

### Fit

- Who uses this CLI: novice humans, expert humans, scripts, CI, agents, or all
  of them?
- What is the smallest useful command set?
- Which workflows are interactive, automated, or both?
- What external systems can be changed?

### Grammar

- Are commands named in user-domain language?
- Are verbs and nouns consistent?
- Are flags parameters rather than primary actions?
- Are aliases conventional and stable?
- Does the command tree leave room to grow?

### Output

- Is stdout reserved for primary output?
- Is stderr used for diagnostics/progress/prompts?
- Is structured output explicit and documented?
- Is human output concise but informative?
- Does output remain readable with color disabled?

### Safety

- What can be destroyed, published, deployed, billed, or made public?
- Is there preview/diff/plan behavior?
- Is confirmation proportional to risk?
- Is there a non-interactive approval path?
- Can users inspect, resume, retry, or recover after failure?

### Interactivity

- Does prompting require a TTY?
- Is there `--no-input` or equivalent?
- Can every prompt be answered by flags, files, stdin, or config?
- Does Ctrl-C work promptly?

### Configuration

- Is precedence documented?
- Can users inspect where a value came from?
- Are config, cache, state, and runtime files in appropriate locations?
- Are secrets handled separately from ordinary config?

### Errors

- Are messages specific?
- Do they name the bad file, flag, field, or resource?
- Do they give the next command or action?
- Are stable diagnostic codes useful?
- Are stack traces hidden unless debugging?

### Compatibility

- Which surfaces are public contracts?
- Is machine output versioned?
- Are experimental commands labeled?
- Is deprecation behavior defined?
- Are tests protecting command names, flags, schemas, and exit behavior?

## Testing Expectations

Evidence: judgment.

Test the CLI as an interface, not only as functions.

Recommended coverage:

- parser tests for command grammar, aliases, required arguments, and invalid
  combinations;
- golden or snapshot tests for help output, with careful review to avoid
  brittle noise;
- machine output schema tests;
- stdout/stderr separation tests;
- TTY and non-TTY prompt tests;
- color enabled/disabled tests;
- destructive-operation safety tests;
- config precedence tests;
- auth/secrets redaction tests;
- shell completion generation smoke tests;
- compatibility tests for deprecated aliases and output versions;
- integration tests for common workflows.

Prefer pure command planning functions under the CLI adapter:

```text
parse args -> normalize config -> validate intent -> plan operation
          -> execute adapter -> render human/machine output
```

This architecture makes it easier to test invalid states, preview behavior,
machine output, and side-effect boundaries without brittle terminal tests for
every branch.

## Release Checklist

1. Command grammar reviewed against this guide.
2. Help output includes examples and recovery paths.
3. Machine output, if present, has a documented schema.
4. stdout/stderr behavior is tested.
5. TTY and non-TTY behavior is tested.
6. Dangerous operations have preview and explicit approval paths.
7. Config precedence is documented and inspectable.
8. Secrets are not accepted through unsafe defaults.
9. Color and rich formatting have plain fallbacks.
10. Shell completions are generated or documented.
11. Compatibility/deprecation policy is written.
12. Common workflows have end-to-end tests.

## Final Rule

The fastest valid command should also be the safest obvious command. When a CLI
forces users to remember hidden rules, parse unstable output, guess state, or
bypass safety for automation, the design has leaked implementation burden onto
the user. Redesign the command surface until correct use is easy and incorrect
use is hard to express.
