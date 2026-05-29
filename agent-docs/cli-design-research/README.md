# CLI Design Research

This folder contains research notes for an evergreen guide to excellent command
line interface design. The final guide is
[`CLI_DESIGN_GUIDE.md`](../cli/CLI_DESIGN_GUIDE.md).

The research intentionally avoids designing a project-specific CLI. It records
evidence, case studies, critiques, and principles that can guide future CLI
work in this repository and in unrelated projects.

## Research Questions

1. What makes a CLI predictable, discoverable, safe, scriptable, and pleasant
   for both humans and automation?
2. Which guidance is backed by standards, platform documentation, expert
   practice, or repeated community evidence?
3. Which CLIs are cited as influential or well-designed, and which traits make
   them useful examples?
4. Which popular CLIs are powerful but controversial, and what should future
   designs avoid learning from them?
5. How should CLI design balance rich interactive UX with stable automation?
6. What review rubric can engineers reuse before implementing a CLI?

## Source Quality Bar

Use the strongest available evidence first:

- **Primary standard:** POSIX, GNU, language/platform documentation, or official
  CLI documentation.
- **Primary implementation guidance:** official docs from a CLI project or
  platform explaining its command design, output, errors, auth, or
  compatibility policy.
- **Expert guidance:** named practitioners or organizations with substantial
  CLI/platform experience.
- **Community evidence:** repeated praise, critique, surveys, or field reports
  from developers using the tool.
- **Observed behavior:** direct inspection of documented CLI behavior. Use only
  as supporting evidence, not as proof of broad user preference.

## Evidence Strength Labels

- **Strong:** primary standard or multiple high-quality sources agree.
- **Moderate:** credible expert guidance or a strong primary source, but with
  context-specific tradeoffs.
- **Limited:** useful observation, community signal, or single-source guidance
  that should not be treated as universal.
- **Judgment:** reasoned synthesis from the project goals and available
  evidence; mark clearly.

## Evaluation Rubric

Evaluate guidance and case-study CLIs across these dimensions:

- command grammar and naming;
- discoverability and help;
- output design for humans and machines;
- diagnostics and error recovery;
- safety defaults, confirmation, dry-run, and diff behavior;
- scriptability, composability, and exit status;
- configuration, environment, and workspace discovery;
- authentication and credential handling;
- long-running operations, progress, and cancellation;
- backwards compatibility and deprecation;
- extension/plugin/provider model;
- documentation and examples;
- testing and release compatibility.
