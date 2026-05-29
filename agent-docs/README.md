# Agent Documentation Map

This directory contains internal planning, philosophy, research, and audit
material for agents and maintainers. Durable platform contracts belong in
`docs/`; use `agent-docs/` for decision aids, roadmap thinking, research notes,
and handoff context.

## Directories

- `audits/`: refactor audits, metadata/accessibility research, SEO scan
  findings, and large-file planning notes.
- `cli/`: evergreen CLI design guidance and TPM CLI product strategy.
- `cli-design-research/`: source logs, case studies, anti-patterns, and
  synthesis notes behind the CLI design guide.
- `cli-product-research/`: product survey, feature catalog, comparison matrix,
  user jobs, journey designs, and CLI opportunity analysis.
- `codebase-roadmap/`: older comprehensive roadmap notes and evidence ledgers.
- `core/`: engineering philosophy, design philosophy, Astro guidance, Tailwind
  guidance, and component architecture guidance.
- `fresh-codebase-audit-2026-05-20/`: independent second-pass audit notes and
  roadmap draft kept for historical comparison.
- `migrations/`: milestone-specific migration reports and command-surface
  transition notes.
- `qa/`: QA preflight planning, command inventory, and tooling cleanup notes.
- `roadmap/`: authoritative long-term platform roadmap and coordinated
  CLI/Rust/GUI integration plan.
- `rust/`: Rust engineering guide, Rust migration plan, and xtask architecture
  redesign.
- `rust-migration-research/`: Rust QA/tooling research, strictness decisions,
  migration audit, and source logs.
- `studio/`: Studio product vision, workspace model, adapter model, and
  extension model.

## Placement Rules

- Keep current executable contracts in `docs/`, not `agent-docs/`.
- Promote findings from audits or research into `docs/` when implementation
  should treat them as source-of-truth contracts.
- Keep scratch research with its source log in a domain-specific research
  folder.
- Keep root-level `agent-docs/` thin. New files should normally live in one of
  the directories above.
- Update `AGENTS.md` when adding a new long-lived agent-docs directory or
  changing directory ownership.
