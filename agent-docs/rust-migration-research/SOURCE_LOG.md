# Rust Migration Research Source Log

This source log records the main external references used for the Rust
migration and CLI implementation plan.

## Rust And Cargo

- Cargo workspaces:
  <https://doc.rust-lang.org/cargo/reference/workspaces.html>
  - Workspaces share a lockfile and output directory.
  - Workspace root owns profiles.
  - Workspace dependencies and lints can be inherited by member crates.
- Cargo profiles:
  <https://doc.rust-lang.org/cargo/reference/profiles.html>
  - Profiles control optimization, debug info, overflow checks, LTO, panic
    strategy, and incremental compilation.
  - Root workspace manifest owns profile settings.
- Rust lints:
  <https://doc.rust-lang.org/rustc/lints/index.html>
  - Rust supports lint levels and compiler lint configuration.
- Rust diagnostic attributes:
  <https://rustwiki.org/en/reference/attributes/diagnostics.html>
  - `allow`, `warn`, `deny`, and `forbid` control lints.
  - `forbid` prevents lower-level overrides.
- Rust API Guidelines:
  <https://rust-lang.github.io/api-guidelines/>
  - Public APIs should be documented, include examples where useful, and
    document errors/panics/safety.
- rustup toolchain files:
  <https://rust-lang.github.io/rustup/overrides.html>
  - `rust-toolchain.toml` can pin channel, components, targets, and profile.
- rustup profiles and components:
  <https://rust-lang.github.io/rustup/concepts/profiles.html>
  <https://rust-lang.github.io/rustup/concepts/components.html>
  - `default` includes `rustfmt` and `clippy`.
  - components can be added explicitly.

## CLI Design And Rust CLI Libraries

- Command Line Applications in Rust:
  <https://rust-cli.github.io/book/index.html>
  - Rust is a strong CLI language because it creates portable, fast,
    statically compiled tools.
- clap derive docs:
  <https://docs.rs/clap/latest/clap/_derive/index.html>
  - `Parser`, `Args`, `Subcommand`, and `ValueEnum` support typed command
    trees.
  - Doc comments and attributes drive help output.
- Just manual:
  <https://just.systems/man/en/>
  - `just` is a command runner, not a build system.
  - It supports project recipes, arguments, `.env`, command listing,
    completions, static error detection, and invocation from subdirectories.

## Testing And QA

- cargo-nextest:
  <https://www.nexte.st/>
  - Faster process-per-test execution, CI profiles, JUnit output, retries,
    timeouts, and test selection.
- cargo-llvm-cov:
  <https://github.com/taiki-e/cargo-llvm-cov>
  - LLVM source-based Rust coverage with support for cargo test, nextest, doc
    tests, and lcov/html output.
- proptest:
  <https://docs.rs/proptest>
  <https://proptest-rs.github.io/proptest/proptest/index.html>
  - Property-based testing with generated inputs and shrinking.
- cargo-fuzz:
  <https://rust-fuzz.github.io/book/cargo-fuzz/guide.html>
  - Cargo subcommand for libFuzzer targets.
- insta:
  <https://insta.rs/docs/>
  - Snapshot testing with review tooling and multiple snapshot types.
- trycmd:
  <https://docs.rs/trycmd/>
  - CLI transcript/snapshot tests from TOML and Markdown examples.
- assert_cmd:
  <https://docs.rs/assert_cmd>
  - CLI integration-test helpers.

## Security And Supply Chain

- RustSec:
  <https://rustsec.org/>
  - Advisory database and `cargo-audit`.
- cargo-deny:
  <https://embarkstudios.github.io/cargo-deny/>
  <https://embarkstudios.github.io/cargo-deny/checks/index.html>
  - Dependency graph checks for advisories, licenses, bans, duplicates, and
    sources.
- cargo-machete:
  <https://docs.rs/crate/cargo-machete/latest>
  - Fast, imprecise unused dependency detection.
- cargo-semver-checks:
  <https://docs.rs/crate/cargo-semver-checks/latest>
  - Semver breakage detection for published Rust APIs.

## Diagnostics, Serialization, And Schemas

- miette:
  <https://docs.rs/miette>
  - Rich diagnostic protocol with codes, labels, source snippets, severity,
    related errors, and human-friendly output.
- Serde derive:
  <https://serde.rs/derive.html>
  - Derive-based serialization/deserialization for Rust data structures.
- schemars:
  <https://docs.rs/schemars/latest/schemars/>
  - JSON Schema generation from Rust types.
- camino:
  <https://docs.rs/camino/latest/camino/>
  - UTF-8 path types for cross-platform path handling.

## Tauri And MCP

- Tauri architecture:
  <https://v2.tauri.app/concept/architecture/>
  - Tauri pairs a Rust backend with a webview frontend and message passing.
- Calling Rust from Tauri frontend:
  <https://v2.tauri.app/develop/calling-rust/>
  - Frontend code invokes Rust commands.
- Tauri capabilities:
  <https://v2.tauri.app/security/capabilities/>
  - Capability files grant fine-grained frontend access to core/plugin
    commands and reduce privilege escalation risk.
- Tauri CLI reference:
  <https://v2.tauri.app/reference/cli/>
  - Tauri has its own development/build/plugin CLI; TPM should not conflate
    this with the TPM product CLI.
- Model Context Protocol SDKs:
  <https://modelcontextprotocol.io/docs/sdk>
  - Official SDKs support servers, clients, local/remote transports, and typed
    protocol support.
- Rust MCP SDK:
  <https://rust.sdk.modelcontextprotocol.io/>
  - Official Rust SDK crate for MCP servers and clients; currently listed by
    MCP docs as a Tier 2 SDK, so initial MCP work should be isolated behind the
    `tpm-mcp` crate.
