# TPM CLI Product Strategy Research

This folder contains working notes for a product-specific CLI strategy report.
The final report is
[`TPM_CLI_PRODUCT_STRATEGY.md`](../TPM_CLI_PRODUCT_STRATEGY.md).

This research applies the general
[`CLI_DESIGN_GUIDE.md`](../CLI_DESIGN_GUIDE.md) to the TPM platform. It should
not become a final command reference yet. The goal is to understand users,
market patterns, product opportunities, platform seams, and implementation
slices that work backward from the mature CLI vision before command specs are
written.

## Research Questions

1. What real publishing, site-management, migration, diagnostics, build, deploy,
   and automation needs should this CLI satisfy?
2. Which adjacent products already solve parts of this problem, and where do
   they create friction or lock-in?
3. Which feature sets are table stakes for this niche, which are differentiators,
   and which should wait?
4. How can the CLI make difficult platform work easy without leaking platform
   internals, Git assumptions, provider details, or implementation jargon?
5. Which platform contracts must exist so the CLI, GUI studio, MCP server, CI,
   and extension ecosystem share one source of truth?
6. How should the implementation sequence work backward from the mature CLI
   vision without shrinking the product language?

## Source Quality Bar

Use the strongest available evidence first:

- official product documentation;
- official CLI references;
- official product positioning or pricing/capability pages;
- high-quality implementation docs and developer docs;
- credible third-party analysis only when official docs do not answer the
  product question;
- direct local repo/roadmap inspection for TPM-specific platform constraints.

## Comparison Criteria

Evaluate products across:

- target user and product promise;
- source/content model;
- authoring and editorial UX;
- initialization and templates;
- content modeling and validation;
- media and asset storage;
- preview and local development;
- build/export/static output;
- deploy and hosting model;
- migration/import/export;
- diagnostics and repair;
- collaboration/review/history;
- extension/plugin/provider model;
- CLI surface and machine output;
- auth/secrets/provider credentials;
- pricing/lock-in/portability implications;
- lessons for the TPM CLI.

## Research Documents

- [`SOURCE_LOG.md`](./SOURCE_LOG.md): primary sources and evidence notes.
- [`PRODUCT_SURVEY.md`](./PRODUCT_SURVEY.md): product-by-product notes.
- [`FEATURE_CATALOG.md`](./FEATURE_CATALOG.md): feature patterns by product
  class.
- [`FEATURE_COMPARISON_MATRIX.md`](./FEATURE_COMPARISON_MATRIX.md): detailed
  feature comparison matrix against the mature TPM CLI/platform vision.
- [`DESIGN_DECISION_REVIEW.md`](./DESIGN_DECISION_REVIEW.md): objective design
  critique with alternatives, recommendations, tradeoffs, rejected hard pivots,
  and refinements for the CLI strategy.
- [`USER_JOURNEY_DESIGNS.md`](./USER_JOURNEY_DESIGNS.md): realistic user
  journeys with concrete files, routes, commands, reports, plans, and tool
  behavior explanations.
- [`USER_JOBS.md`](./USER_JOBS.md): user segments and jobs-to-be-done.
- [`OPPORTUNITY_SYNTHESIS.md`](./OPPORTUNITY_SYNTHESIS.md): product
  opportunity and differentiation notes.
- [`COMMAND_SURFACE_NOTES.md`](./COMMAND_SURFACE_NOTES.md): command grammar,
  safety, output, and compatibility notes.
- [`PLATFORM_MAPPING.md`](./PLATFORM_MAPPING.md): CLI responsibility areas
  mapped to platform contracts.
- [`PHASE_RISKS_VALIDATION.md`](./PHASE_RISKS_VALIDATION.md): implementation
  phases, risks, non-goals, and validation.

## Evidence Labels

- **Strong:** official docs or multiple credible sources support the claim.
- **Moderate:** official source, but product-positioning oriented or
  context-dependent.
- **Limited:** single source, observation, or inference.
- **Judgment:** reasoned product synthesis from research and roadmap goals.
