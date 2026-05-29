# Show available recipes.
default:
    @just --list

# Show available recipes.
list:
    @just --list

# Install repository dependencies.
setup: setup-js setup-rust

# Install JavaScript, Astro, and browser-tool dependencies.
setup-js:
    bun install

# Install the Rust components expected by local QA.
setup-rust:
    rustup component add rustfmt clippy llvm-tools-preview

# Install Playwright's Chromium browser for browser-backed tests.
setup-browser:
    bunx playwright install chromium

# Run the cheap high-signal source and configuration checks.
check-fast: content-check tags-check site-doctor site-schema-check starters-check docs-references-check platform-check assets-locations assets-shared catalog-check package-check test-config

# Run the normal local validation path.
check: check-fast typecheck lint format deadcode test rust-check-fast

# Run the heavier pre-release validation path.
release-check: test-accountability-release check review-markdown docs-check test-catalog test-catalog-site-instance build-release payload-check verify validate-html test-e2e-built audit secrets rust-check distribution-check

# Run all automatic fixes for JS/TS/Astro/Tailwind, Markdown/MDX, package ordering, and Rust.
fix: js-fix markdown-fix rust-fix

# Run safe JavaScript/TypeScript/Astro/Tailwind automatic fixes.
js-fix:
    just lint-fix
    just format-code-write
    ./node_modules/.bin/sort-package-json package.json

# Run safe Markdown/MDX automatic fixes.
markdown-fix:
    just format-markdown-write
    ./node_modules/.bin/markdownlint-cli2 --fix
    just format-markdown-write

# Run automatic Rust formatting and Clippy machine-applicable fixes.
rust-fix:
    cargo fmt --all
    cargo clippy --fix --workspace --all-targets --all-features --locked --allow-dirty --allow-staged -- -D warnings

# Start the current site in Astro dev mode.
dev *args:
    ./node_modules/.bin/astro dev {{args}}

# Preview the current built site.
preview *args:
    ./node_modules/.bin/astro preview {{args}}

# Build the current static site.
build: build-raw build-pdf build-optimize

# Build the current static site plus deploy-target files.
build-release: build build-cloudflare

# Run the raw Astro/Pagefind build.
build-raw *args:
    just _xtask build-raw {{args}}

# Generate same-directory static article PDFs.
build-pdf *args:
    bun scripts/build/generate-article-pdfs.ts {{args}}

# Optimize generated build output.
build-optimize *args:
    just _xtask build-optimize {{args}}

# Generate Cloudflare Workers Static Assets redirect files.
build-cloudflare *args:
    just _xtask build-cloudflare {{args}}

# Preview a release-like build locally.
preview-fresh *args:
    just build
    just preview {{args}}

# Preview a release build after verification.
preview-release-fresh *args:
    just build-release
    just verify
    just validate-html
    just preview {{args}}

# Start Wrangler against the Cloudflare Workers Static Assets config.
preview-cloudflare *args:
    ./node_modules/.bin/wrangler dev {{args}}

# Build release output, then start Wrangler locally.
preview-cloudflare-fresh *args:
    just build-release
    just preview-cloudflare {{args}}

# Deploy the current verified dist output to Cloudflare.
deploy-cloudflare *args:
    ./node_modules/.bin/wrangler deploy {{args}}

# Run author-facing source checks.
author-check:
    just content-check --quiet
    just tags-check --quiet
    just assets-locations --quiet
    just assets-shared --quiet
    just site-doctor --quiet
    just site-schema-check --quiet

# Apply safe author-facing source fixes.
author-fix:
    just tags-normalize

# Verify content source invariants.
content-check *args:
    just _xtask content-check {{args}}

# Dry-run safe tag normalization.
tags-check *args:
    just _xtask tags-check {{args}}

# Write safe tag normalization.
tags-normalize *args:
    just _xtask tags-normalize {{args}}

# Run the Rust site-doctor report.
site-doctor *args:
    just cli site doctor {{args}}

# Generate the site config JSON schema.
site-schema *args:
    just _xtask site-schema {{args}}

# Check whether the site config JSON schema is current.
site-schema-check *args:
    just _xtask site-schema-check {{args}}

# Verify maintained starter templates.
starters-check *args:
    just _xtask starters-check {{args}}

# Run the Rust media image report.
media-images *args:
    just cli media images {{args}}

# Check image asset locations.
assets-locations *args:
    just _xtask assets-locations {{args}}

# Check shared image asset policy.
assets-shared *args:
    just _xtask assets-shared {{args}}

# Review duplicate images.
assets-duplicates *args:
    just _xtask assets-duplicates {{args}}

# Review unused images.
assets-unused *args:
    just _xtask assets-unused {{args}}

# Run duplicate and unused image review signals.
review-assets:
    just assets-duplicates --quiet
    just assets-unused --quiet

# Run the Rust redirect report.
routes-redirects *args:
    just cli routes redirects {{args}}

# Verify generated build output.
verify *args:
    just _xtask verify {{args}}

# Validate representative built HTML output.
validate-html *args:
    just _xtask validate-html {{args}}

# Run the internal Rust generated-output report bridge.
output-verify *args:
    just _xtask output-verify {{args}}

# Check generated platform reference drift.
docs-references-check *args:
    just _xtask docs-references-check {{args}}

# Generate platform reference docs.
docs-references *args:
    just _xtask docs-references {{args}}

# Run documentation checks, including generated references and docs-site validation.
docs-check: docs-references-check cli-reference-check test-docs-site

# Generate the TPM CLI command reference.
cli-reference *args:
    just _xtask cli-reference {{args}}

# Check whether the TPM CLI command reference is current.
cli-reference-check *args:
    just _xtask cli-reference-check {{args}}

# Build the documentation-site example.
docs-site-build:
    SITE_INSTANCE_ROOT=examples/docs-site SITE_OUTPUT_DIR=dist/examples/docs-site just build-release

# Start the documentation-site example in Astro dev mode.
docs-site-dev *args:
    SITE_INSTANCE_ROOT=examples/docs-site just dev {{args}}

# Preview the documentation-site example.
docs-site-preview *args:
    SITE_INSTANCE_ROOT=examples/docs-site SITE_OUTPUT_DIR=dist/examples/docs-site just preview {{args}}

# Build, then preview the documentation-site example.
docs-site-preview-fresh *args:
    SITE_INSTANCE_ROOT=examples/docs-site SITE_OUTPUT_DIR=dist/examples/docs-site just build-release
    SITE_INSTANCE_ROOT=examples/docs-site SITE_OUTPUT_DIR=dist/examples/docs-site just preview {{args}}

# Start the static Studio frontend shell in Astro dev mode.
studio-dev *args:
    ./node_modules/.bin/astro dev --root apps/studio {{args}}

# Build the static Studio frontend shell.
studio-build *args:
    ./node_modules/.bin/astro build --root apps/studio {{args}}

# Type-check the static Studio frontend shell with warnings as failures.
studio-check:
    ./node_modules/.bin/astro check --root apps/studio --minimumFailingSeverity warning --minimumSeverity warning

# Preview the built Studio frontend shell.
studio-preview *args:
    ./node_modules/.bin/astro preview --root apps/studio {{args}}

# Build, then preview the static Studio frontend shell.
studio-preview-fresh *args:
    just studio-build
    just studio-preview {{args}}

# Start the TPM Studio Tauri shell in development mode.
[working-directory: 'apps/studio']
studio-tauri-dev *args:
    ../../node_modules/.bin/tauri dev {{args}}

# Build the TPM Studio Tauri shell.
[working-directory: 'apps/studio']
studio-tauri-build *args:
    ../../node_modules/.bin/tauri build {{args}}

# Run unsigned Studio packageability checks that do not require signing credentials.
studio-package-check:
    just studio-build
    cargo build --package tpm-studio --bin tpm-studio --locked

# Build the private component catalog.
catalog-build:
    PLATFORM_COMPONENT_CATALOG=true SITE_OUTPUT_DIR=dist-catalog just build

# Verify component catalog accountability.
catalog-check *args:
    just _xtask catalog-check {{args}}

# Start the private component catalog in Astro dev mode.
catalog-dev *args:
    PLATFORM_COMPONENT_CATALOG=true just dev {{args}}

# Preview the private component catalog.
catalog-preview *args:
    PLATFORM_COMPONENT_CATALOG=true SITE_OUTPUT_DIR=dist-catalog just preview {{args}}

# Build, then preview the private component catalog.
catalog-preview-fresh *args:
    just catalog-build
    just catalog-preview {{args}}

# Verify platform module boundary rules.
platform-check *args:
    just _xtask platform-check {{args}}

# Type-check Astro, Studio, and repository TypeScript tooling.
typecheck: typecheck-astro studio-check typecheck-tools

# Run Astro typechecking with warnings as failures.
typecheck-astro:
    ./node_modules/.bin/astro check --minimumFailingSeverity warning --minimumSeverity warning

# Run TypeScript checks for tooling, configs, and tests.
typecheck-tools:
    ./node_modules/.bin/tsc --project tsconfig.tools.json --pretty false

# Run strict ESLint.
lint:
    ./node_modules/.bin/eslint . --ignore-pattern "**/*.md" --ignore-pattern "**/*.mdx" --max-warnings=0 --no-cache

# Run strict ESLint with automatic fixes.
lint-fix:
    ./node_modules/.bin/eslint . --ignore-pattern "**/*.md" --ignore-pattern "**/*.mdx" --fix --max-warnings=0 --no-cache

# Run Markdownlint.
lint-markdown:
    ./node_modules/.bin/markdownlint-cli2

# Run ESLint over MDX article files.
lint-mdx:
    ./node_modules/.bin/eslint "site/content/articles/**/*.mdx" --max-warnings=0 --no-cache

# Check package/config sorting and package-script guard.
package-check:
    ./node_modules/.bin/sort-package-json --check --quiet package.json

# Check code/config formatting.
format: format-code

# Check Astro, CSS, JS/TS, JSON, and YAML formatting.
format-code:
    ./node_modules/.bin/prettier --check "**/*.{astro,css,cjs,js,json,jsonc,mjs,ts,tsx,yaml,yml}" --log-level warn

# Write Astro, CSS, JS/TS, JSON, and YAML formatting.
format-code-write:
    ./node_modules/.bin/prettier --write --list-different "**/*.{astro,css,cjs,js,json,jsonc,mjs,ts,tsx,yaml,yml}"

# Check Markdown/MDX formatting.
format-markdown:
    ./node_modules/.bin/prettier --check "**/*.{md,mdx}" --log-level warn

# Write Markdown/MDX formatting.
format-markdown-write:
    ./node_modules/.bin/prettier --write --list-different "**/*.{md,mdx}"

# Write code/config formatting.
format-write: format-code-write

# Run Markdown/MDX style review.
review-markdown: lint-markdown lint-mdx format-markdown

# Run Knip dead-code/dependency checks.
deadcode:
    ./node_modules/.bin/knip --no-config-hints --no-progress

# Run repository tests.
test: test-accountability test-unit test-astro

# Run Bun unit/script/component/page tests.
test-unit:
    bun test tests/config tests/eslint tests/src tests/types tests/lib tests/build tests/components tests/pages --reporter=dots --randomize --concurrent

# Run Astro component/container tests.
test-astro:
    ./node_modules/.bin/astro sync --force
    just _xtask sync-astro-test-store
    ./node_modules/.bin/vitest run --config vitest.config.ts

# Run repository config tests.
test-config:
    bun test tests/config --reporter=dots

# Run broad test-accountability verification.
test-accountability *args:
    just _xtask test-accountability {{args}}

# Run release-mode test-accountability verification.
test-accountability-release:
    just _xtask test-accountability-release --quiet

# Build, then run Playwright browser tests.
test-e2e *args:
    just build
    just test-e2e-built {{args}}

# Run Playwright browser tests against existing built output.
test-e2e-built *args:
    ./node_modules/.bin/playwright test tests/e2e {{args}}

# Build, then run axe accessibility review tests.
test-a11y *args:
    just build
    just test-a11y-built {{args}}

# Run axe accessibility review tests against existing built output.
test-a11y-built *args:
    ./node_modules/.bin/playwright test tests/a11y {{args}}

# Build, then run Lighthouse CI review.
test-perf *args:
    just build
    just test-perf-built {{args}}

# Run Lighthouse CI review against existing built output.
test-perf-built *args:
    ./node_modules/.bin/lhci autorun {{args}}

# Run randomized flake detection.
test-flake *args:
    just _xtask test-flake {{args}}

# Build and test the private component catalog.
test-catalog *args:
    just _xtask test-catalog {{args}}

# Build the external fixture site with the private component catalog enabled.
test-catalog-site-instance:
    SITE_INSTANCE_ROOT=tests/fixtures/site-instance SITE_OUTPUT_DIR=dist/fixtures/site-instance-catalog PLATFORM_COMPONENT_CATALOG=true just build-raw

# Validate, build, verify, and HTML-validate the documentation site.
test-docs-site:
    SITE_INSTANCE_ROOT=examples/docs-site SITE_OUTPUT_DIR=dist/examples/docs-site just content-check --quiet
    SITE_INSTANCE_ROOT=examples/docs-site SITE_OUTPUT_DIR=dist/examples/docs-site just site-doctor --site examples/docs-site --quiet
    SITE_INSTANCE_ROOT=examples/docs-site SITE_OUTPUT_DIR=dist/examples/docs-site just site-schema-check --quiet
    SITE_INSTANCE_ROOT=examples/docs-site SITE_OUTPUT_DIR=dist/examples/docs-site just build-release
    SITE_INSTANCE_ROOT=examples/docs-site SITE_OUTPUT_DIR=dist/examples/docs-site just verify
    SITE_INSTANCE_ROOT=examples/docs-site SITE_OUTPUT_DIR=dist/examples/docs-site just validate-html

# Build, generate PDFs, and optimize the external fixture site.
test-site-instance:
    SITE_INSTANCE_ROOT=tests/fixtures/site-instance SITE_OUTPUT_DIR=dist/fixtures/site-instance just build-raw
    SITE_INSTANCE_ROOT=tests/fixtures/site-instance SITE_OUTPUT_DIR=dist/fixtures/site-instance just build-pdf
    SITE_INSTANCE_ROOT=tests/fixtures/site-instance SITE_OUTPUT_DIR=dist/fixtures/site-instance just build-optimize

# Run all coverage review signals.
coverage: coverage-ts coverage-rust

# Run TypeScript/Astro unit coverage and broad coverage accountability.
coverage-ts *args:
    just _coverage-ts-report
    just coverage-verify {{args}}

# Generate TypeScript/Astro LCOV and text coverage reports.
[private]
_coverage-ts-report:
    bun test tests/config tests/eslint tests/src tests/types tests/lib tests/build tests/components tests/pages --randomize --coverage --coverage-reporter=text --coverage-reporter=lcov

# Verify broad source coverage accountability.
[private]
coverage-verify *args:
    just _xtask coverage-verify {{args}}

# Run quiet quality gate plus review-only signals.
quality:
    just check
    -just review-assets
    -just review-markdown
    -just coverage

# Run release quality gate plus review-only signals.
quality-release:
    just release-check
    -just review-assets
    -just test-a11y-built
    -just test-perf-built
    -just audit-all
    -just coverage

# Run payload budget checks.
payload-check *args:
    just _xtask payload-check {{args}}

# Run payload report.
payload-report *args:
    just _xtask payload-report {{args}}

# Run the internal Rust QA command registry report.
qa-registry *args:
    just _xtask qa-registry {{args}}

# Compare normalized diagnostic snapshots with the internal Rust operation.
diagnostics-diff *args:
    just _xtask diagnostics-diff {{args}}

# Run high-severity dependency audit.
audit:
    bun audit --audit-level=high

# Run all-severity dependency audit review.
audit-all:
    bun audit

# Run local secrets scan.
secrets:
    gitleaks git --redact --no-banner --log-opts=HEAD

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
coverage-rust:
    @command -v cargo-llvm-cov >/dev/null 2>&1 || (echo 'cargo-llvm-cov is review-only and is not installed. Install it with: cargo install cargo-llvm-cov' >&2; exit 127)
    @rustup component list --installed | grep -q '^llvm-tools' || (echo 'llvm-tools-preview is required for Rust coverage on the active toolchain. Install it with: rustup component add llvm-tools-preview' >&2; exit 127)
    cargo llvm-cov --workspace --all-features --summary-only --show-missing-lines

# Run cargo-deny supply-chain policy.
rust-deny:
    @command -v cargo-deny >/dev/null 2>&1 || (echo 'cargo-deny is required for the Rust supply-chain gate. Install it with: cargo install cargo-deny --locked' >&2; exit 127)
    cargo deny check

# Run cargo-nextest. Review-only until the tool is installed and promoted.
rust-nextest:
    @cargo nextest --version >/dev/null 2>&1 || (echo 'cargo-nextest is review-only and is not installed. Install it with: cargo install cargo-nextest --locked' >&2; exit 127)
    cargo nextest run --workspace --all-features --locked

# Check current public API/package compatibility policy.
rust-public-api-check *args:
    just _xtask public-api-check {{args}}

# Run optional Rust dependency cleanup review.
rust-dependency-review:
    @cargo machete --version >/dev/null 2>&1 || (echo 'cargo-machete is review-only and is not installed. Install it with: cargo install cargo-machete --locked' >&2; exit 127)
    cargo machete

# Run optional CLI binary size review.
rust-binary-size-review:
    @cargo bloat --version >/dev/null 2>&1 || (echo 'cargo-bloat is review-only and is not installed. Install it with: cargo install cargo-bloat --locked' >&2; exit 127)
    cargo bloat --package tpm-cli --release --crates

# Run all optional Rust public-distribution review signals.
rust-distribution-review: rust-public-api-check
    -just rust-dependency-review
    -just rust-binary-size-review

# Run local CLI release artifact smoke checks.
cli-release-smoke:
    cargo build --package tpm-cli --bin tpm --release --locked
    ./target/release/tpm --help >/dev/null
    ./target/release/tpm --version >/dev/null
    ./target/release/tpm site status --site tests/fixtures/rust-workspace --format json >/dev/null

# Verify public distribution readiness invariants.
distribution-check *args:
    just _xtask distribution-check {{args}}

# Run internal Rust repository automation used by named just recipes.
_xtask *args:
    cargo run --package tpm-xtask --bin tpm-xtask -- {{args}}

# Run the additive TPM CLI shell.
cli *args:
    cargo run --package tpm-cli --bin tpm -- {{args}}

# Show internal migration classifications and script debt.
migration-baseline *args:
    just _xtask migration-baseline {{args}}
