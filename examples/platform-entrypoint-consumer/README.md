# Platform Entrypoint Consumer

This example proves that selected platform domains can be consumed through
`src/platform/*` entrypoints without importing TPM content, branding, assets, or
route files.

It is intentionally tiny. The goal is not to be a starter site; the goal is to
exercise internal package seams before any external package publication.

Covered domains:

- diagnostics;
- interaction primitives;
- media policy;
- article references and citation source normalization;
- route registry helpers.

Domains that still depend on active site configuration, Astro collection
adapters, filesystem state, or current site paths should stay out of this
example until those dependencies are explicit inputs.
