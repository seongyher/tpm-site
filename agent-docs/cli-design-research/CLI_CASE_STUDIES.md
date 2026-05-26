# CLI Case Study Notes

This file records evidence-backed observations about CLIs that are praised,
influential, controversial, or otherwise instructive. It is working material
for the final evergreen guide.

## Case Study Rubric

- Why this CLI was selected.
- What evidence supports its inclusion.
- Where it is strong.
- Where it is weak or controversial.
- What future CLI designs should learn from it.

## Selection Notes

There is no credible universal ranking of "best" or "most beloved" CLIs.
Selection here is therefore evidence-based but modest: a CLI is included when
it is influential, widely adopted, well documented, repeatedly praised for
specific design traits, or unusually instructive about a design tradeoff.

## GitHub CLI: Product Workflow Near Existing Developer Context

- **Why selected:** `gh` is the official CLI for GitHub and an instructive
  example of placing hosted-product workflows next to `git` rather than inside
  a browser.
- **Evidence:** Official GitHub docs describe `gh` as an open source CLI for
  using GitHub from the command line. The manual documents structured output
  through `--json`, `--jq`, and `--template`, plus generated shell completion
  for bash, zsh, fish, and PowerShell.
- **Strengths:** It models product nouns directly (`repo`, `pr`, `issue`,
  `auth`, `api`), keeps common workflows discoverable, and provides both human
  output and machine-oriented formatting. The `--json fields` requirement makes
  field selection explicit rather than dumping unstable internal objects.
- **Weaknesses/tradeoffs:** Coverage is uneven because not every command exposes
  the same fields or workflows. It also inherits GitHub account/auth complexity.
- **Lessons:** A product CLI should be close to the user's existing workspace,
  model the product domain, expose structured output explicitly, and provide
  completions as first-class UX.

## Terraform: Safety Contract For Dangerous Remote Changes

- **Why selected:** Terraform is a mature example of a CLI where mistakes can
  alter or destroy real infrastructure.
- **Evidence:** Official docs describe `plan` as a preview command that does
  not carry out changes, `apply` as the command that executes a plan, automatic
  approval prompts, `-input=false` for non-interactive automation, saved plan
  files, machine-readable UI through `-json`, and automation guidance centered
  on review-before-apply.
- **Strengths:** It separates preview from execution, preserves a path for
  human review, makes automation explicit, and documents a versioned
  machine-readable message stream because human UI text is not a stable
  integration surface.
- **Weaknesses/tradeoffs:** The domain has unavoidable complexity: state,
  providers, remote locks, drift, and partial failure can be hard to explain.
  Some safety depends on workflow discipline outside the CLI.
- **Lessons:** Dangerous CLIs need dry-run/plan semantics, explicit automation
  modes, saved artifacts when review and execution are separate, stable
  machine-readable output, and diagnostics that explain uncertainty.

## kubectl: Resource Grammar And Structured Output At Scale

- **Why selected:** `kubectl` is one of the most influential modern
  resource-oriented CLIs.
- **Evidence:** Kubernetes docs define the `kubectl [command] [TYPE] [NAME]`
  family and document output options such as JSON, YAML, wide, name, custom
  columns, and JSONPath. Official completion docs generate shell completion code
  for major shells.
- **Strengths:** The resource grammar is powerful and repeatable across a large
  surface. Multiple output modes support humans, scripts, and debugging.
  Generated completions mitigate the complexity of a huge command set.
- **Weaknesses/tradeoffs:** The command surface is large enough that beginners
  often need recipes. JSONPath/custom-columns are powerful but add another
  mini-language to learn.
- **Lessons:** Resource grammar scales when it is consistent, but large CLIs
  need excellent help, examples, completions, aliases, and beginner paths.

## Google Cloud CLI: Output DSL Power And Complexity

- **Why selected:** `gcloud` is a major cloud CLI with unusually expressive
  output shaping.
- **Evidence:** Official docs describe `--format`, `--filter`, projections, and
  resource keys for shaping command output.
- **Strengths:** It makes filtering and formatting cross-cutting primitives,
  which can reduce ad hoc shell parsing and make automation more direct.
- **Weaknesses/tradeoffs:** The output DSL is itself a feature users must
  learn. A powerful universal mechanism can become intimidating if common cases
  are not obvious.
- **Lessons:** Cross-cutting output/filter controls are valuable, but they need
  simple defaults, copyable examples, and clear fallback formats like JSON.

## ripgrep: Opinionated Defaults With Explicit Escape Hatches

- **Why selected:** `rg` is widely adopted by developers and is an instructive
  example of optimizing for a common task while preserving escape hatches.
- **Evidence:** The official README describes recursive search, ignore-file
  awareness, hidden/binary skipping, type filters, and performance. The user
  guide explains stdin, globs, file types, binary data, compressed files,
  preprocessors, and config files.
- **Strengths:** The default usually searches what developers mean to search:
  source files, not build output, ignored files, hidden directories, or binary
  files. Escape hatches (`--hidden`, `--no-ignore`, unrestricted modes, type
  filters) keep the opinionated default from becoming a trap.
- **Weaknesses/tradeoffs:** Users can be surprised when hidden or ignored files
  are excluded. The tool must explain why a file was not searched and how to
  include it.
- **Lessons:** A strong default is good when it fits the dominant task and has
  obvious, documented, composable escape hatches.

## fd: Modernized Syntax For A Legacy Task

- **Why selected:** `fd` is an instructive example of redesigning a common Unix
  task around modern defaults while acknowledging it is not a complete
  replacement for `find`.
- **Evidence:** The official README positions it as a simple, fast,
  user-friendly alternative with intuitive syntax, smart case, color, parallel
  traversal, and ignore-aware defaults.
- **Strengths:** It turns a verbose common operation into a small grammar and
  makes common behavior convenient. It is explicit that it chooses sensible
  defaults for most cases rather than full `find` parity.
- **Weaknesses/tradeoffs:** Opinionated simplification can disappoint users who
  expect every legacy edge case.
- **Lessons:** A CLI can win by solving a high-value subset exceptionally well,
  as long as scope and escape hatches are honest.

## jq: A Focused DSL For Structured Streams

- **Why selected:** `jq` is the canonical example of a CLI that treats JSON as
  a first-class stream transformation format.
- **Evidence:** Official docs define a filter language for selecting,
  transforming, and composing JSON values.
- **Strengths:** It is composable, pipe-friendly, and domain-expressive. It
  makes machine data manipulation a CLI-native workflow instead of forcing
  users into custom scripts.
- **Weaknesses/tradeoffs:** Its DSL is compact and powerful, which means it can
  be difficult to remember and requires good examples.
- **Lessons:** A CLI sublanguage can be justified when the domain is broad and
  recurring, but examples, predictable errors, and stable semantics become part
  of the product.

## Git: Durable Power, Layering, And Compatibility Debt

- **Why selected:** Git is unavoidable in CLI design discussions because it is
  influential, durable, extensible, and also difficult.
- **Evidence:** Official Git docs distinguish high-level porcelain commands
  from low-level plumbing commands and document extension through custom
  subcommands. The Pro Git book explains low-level commands as building blocks.
- **Strengths:** Git's layered model is powerful: porcelain for humans,
  plumbing for tools, and extension through `git-foo` executables. It shows the
  value of stable scriptable surfaces and domain-specific workflows.
- **Weaknesses/tradeoffs:** The UX is famously inconsistent in places because
  the product evolved from internals outward. Some command names and defaults
  carry historical and compatibility baggage.
- **Lessons:** Do not expose implementation vocabulary as the primary UX unless
  users truly need it. Separate human and machine surfaces deliberately before
  compatibility locks in early mistakes.

## Case Study Synthesis

1. Excellent CLIs usually expose a small number of domain nouns and verbs that
   can scale through consistent grammar.
2. Human output and machine output should be separate modes, not accidental
   parsings of the same text.
3. Opinionated defaults are valuable when they match user intent and provide
   transparent escape hatches.
4. Completion, examples, and actionable errors are not polish; they are part of
   the command surface.
5. Safety is a product model, not a prompt. The safest CLIs expose preview,
   explicit approval, saved review artifacts, and non-interactive equivalents.
6. Popularity is not proof of good UX. Git and `kubectl` are essential case
   studies precisely because they combine durable strengths with costly
   complexity.
