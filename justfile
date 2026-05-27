# Repository command router. Keep recipes as orchestration only.

# Show available recipes.
default:
    @just --list

# Show available recipes.
list:
    @just --list

# Run the normal local validation path plus additive Rust checks.
check: js-check rust-check

# Run the fast local validation path plus additive Rust type checks.
check-fast: js-check-fast rust-check-fast

# Run the heavier pre-release validation path plus additive Rust checks.
release-check: js-release-check rust-check

# Run all automatic fixes for JavaScript/TypeScript/Astro/Tailwind, Markdown, and Rust.
fix: js-fix markdown-fix rust-fix

# Run automatic JavaScript/TypeScript/Astro/Tailwind fixes.
js-fix:
    bun --silent run fix
    bun --silent run lint:packages:fix

# Run automatic Markdown/MDX formatting.
markdown-fix:
    bun --silent run fix:markdown
    bun --silent run lint:markdown:fix
    bun --silent run fix:markdown

# Run automatic Rust formatting and Clippy machine-applicable fixes.
rust-fix:
    cargo fmt --all
    cargo clippy --fix --workspace --all-targets --all-features --locked --allow-dirty --allow-staged -- -D warnings

# Build the current static site.
build:
    bun --silent run build

# Preview the current static site.
preview:
    bun --silent run preview

# Run the existing Bun validation path.
js-check:
    bun --silent run check

# Run the existing fast Bun validation path.
js-check-fast:
    bun --silent run check:fast

# Run the existing Bun release gate.
js-release-check:
    bun --silent run check:release

# Run all blocking Rust gates.
rust-check: rust-fmt rust-cargo-check rust-clippy rust-doc rust-doc-test rust-test rust-deny

# Run the fastest blocking Rust gate.
rust-check-fast:
    cargo check --workspace --all-targets --all-features --locked

# Check Rust formatting.
rust-fmt:
    cargo fmt --all --check

# Write Rust formatting changes.
rust-fmt-write:
    cargo fmt --all

# Type-check all Rust crates and targets.
rust-cargo-check:
    cargo check --workspace --all-targets --all-features --locked

# Run strict Rust lints.
rust-clippy:
    cargo clippy --workspace --all-targets --all-features --locked -- -D warnings

# Build Rust docs with warnings treated as errors.
rust-doc:
    RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps --document-private-items --locked

# Run Rust doctests.
rust-doc-test:
    cargo test --workspace --doc --all-features --locked

# Run Rust unit and integration tests.
rust-test:
    cargo test --workspace --all-features --locked

# Run Rust coverage review. Review-only; not part of `just rust-check`.
rust-coverage:
    @command -v cargo-llvm-cov >/dev/null 2>&1 || (echo 'cargo-llvm-cov is review-only and is not installed. Install it with: cargo install cargo-llvm-cov' >&2; exit 127)
    @rustup component list --installed | grep -q '^llvm-tools' || (echo 'llvm-tools-preview is required for Rust coverage on the active toolchain. Install it with: rustup component add llvm-tools-preview' >&2; exit 127)
    cargo llvm-cov --workspace --all-features --summary-only

# Run cargo-deny supply-chain policy.
rust-deny:
    @command -v cargo-deny >/dev/null 2>&1 || (echo 'cargo-deny is required for the Rust supply-chain gate. Install it with: cargo install cargo-deny --locked' >&2; exit 127)
    cargo deny check

# Run cargo-nextest. Review-only until the tool is installed and promoted.
rust-nextest:
    @cargo nextest --version >/dev/null 2>&1 || (echo 'cargo-nextest is review-only and is not installed. Install it with: cargo install cargo-nextest --locked' >&2; exit 127)
    cargo nextest run --workspace --all-features --locked

# Run the additive TPM CLI shell.
cli *args:
    cargo run --package tpm-cli --bin tpm -- {{args}}
