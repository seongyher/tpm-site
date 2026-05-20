# Checklist

This file tracks implementation milestones. It may keep completed items when
they are useful context. Explicitly deferred work belongs in
[DEFERRED.md](./DEFERRED.md).

## Working Rules

- Move postponed work to `DEFERRED.md` with a resume trigger instead of leaving
  stale unchecked milestones here.
- Move deferred work back into this file before implementation begins.
- Add or update design docs before implementing new components, substantial
  layout behavior, or non-component technical systems.
- Verify each milestone before marking it complete.
- Do not edit `site/content/articles/` unless the current task explicitly asks
  for article-content changes.

### Milestone 179: Engineering Philosophy Synthesis

- [x] Synthesize the repo's long-term code-health philosophy across platform
      separation, pure/impure boundaries, UI/logic separation, type-driven
      design, defensive coding, testing, performance, accessibility, and
      authoring simplicity.
- [x] Extend the synthesis with product audience goals, fearless velocity,
      domain-expressive architecture, bug-class elimination, proactive layout
      hardening, efficiency, measurement, and documentation/API policy.
- [x] Add domain hierarchy and extractability/productization principles so
      mature subdomains can be designed toward future Astro libraries,
      integrations, modules, or CLIs without premature extraction.
- [x] Add concrete do/don't examples and review prompts so future refactor
      planning can use the document as a decision aid.
- [x] Add final usage and conflict-resolution guidance so the philosophy helps
      future planning without encouraging abstraction for its own sake.
- [x] Link the document from `AGENTS.md` so future agents discover it during
      normal repository orientation.
      Documented in `agent-docs/ENGINEERING_PHILOSOPHY.md`.
