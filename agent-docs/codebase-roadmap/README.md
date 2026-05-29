# Codebase Roadmap Audit

This folder contains the working documents and final synthesis for the
comprehensive repo roadmap audit.

The audit uses `agent-docs/core/ENGINEERING_PHILOSOPHY.md` as its standard. The goal
is to map what the repo should become, not merely what should be fixed in the
next patch.

## Documents

- `COVERAGE_LEDGER.md`: repo areas inspected, evidence gathered, and coverage
  status. This is the audit completeness record.
- `FINDINGS_SCRATCHPAD.md`: raw observations, risks, ideas, repeated patterns,
  and roadmap candidates. This is intentionally less polished than the final
  roadmap.
- `DOMAIN_MAP.md`: platform domains, current file ownership, desired
  boundaries, and possible extractable modules.
- `COMPREHENSIVE_ROADMAP.md`: final synthesized roadmap, execution protocol,
  design-packet template, sequencing guidance, and implementation handoff plan.

## Final Output

The roadmap in `COMPREHENSIVE_ROADMAP.md` is the handoff document. It should be
used to design future checklist milestones, not as permission to begin coding
without a design packet. The other files explain coverage and reasoning so
future agents can update the roadmap without restarting the audit from scratch.

## Audit Rules

- Keep findings traceable to concrete files, scripts, docs, or generated-output
  contracts.
- Treat the platform as a hierarchy of domains and subdomains.
- Prefer ambitious target states with clear verification paths.
- Sequence work by dependency, risk, and leverage without dismissing valid
  long-term work.
- Record open questions explicitly when source evidence is not enough.
