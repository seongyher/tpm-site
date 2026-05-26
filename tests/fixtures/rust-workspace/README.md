# Rust Workspace Fixture

This fixture is a small, neutral site-like workspace for Rust operation tests.
It intentionally avoids TPM publication copy so workspace discovery,
diagnostics, CLI, MCP, and future studio code can prove they operate on the
platform contract instead of the current production site.

## Ownership

- Keep the fixture generic and author-friendly.
- Add files only when a Rust operation needs a stable source contract.
- Prefer small focused fixtures over copying production content.
- Update expected diagnostics or test assertions in the same change that
  changes fixture structure.
