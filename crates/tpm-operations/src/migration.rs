//! Migration baseline and command-surface classification operations.

use std::fs;
use std::path::PathBuf;

use serde::Serialize;
use tpm_core::Severity;
use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticReport};
use tpm_workspace::WorkspaceContext;

use crate::{
    OperationId, OperationInterface, OperationRequest, OperationResult, OperationSummary,
    OperationTiming,
};

/// Current migration disposition for an existing script or script domain.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ScriptMigrationDisposition {
    /// Replace the domain with a Rust-owned operation once parity is proven.
    RustReplacement,
    /// Keep the command behind `just` because the underlying JS/Astro tool is
    /// still the right implementation boundary.
    EcosystemWrapper,
    /// Delete the command when the clearer Rust/`just` path exists.
    DeleteCandidate,
    /// Keep a shim only with an explicit reason and retirement trigger.
    TemporaryShim,
}

/// One command or domain planned for the milestone 9 migration.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriptMigration {
    domain: &'static str,
    disposition: ScriptMigrationDisposition,
    scripts: &'static [&'static str],
    target: &'static str,
    preserve: &'static str,
    cleanup: &'static str,
}

impl ScriptMigration {
    /// Returns the migration domain.
    #[must_use]
    pub const fn domain(self) -> &'static str {
        self.domain
    }

    /// Returns the planned disposition.
    #[must_use]
    pub const fn disposition(self) -> ScriptMigrationDisposition {
        self.disposition
    }

    /// Returns current package scripts or current tooling entrypoints.
    #[must_use]
    pub const fn scripts(self) -> &'static [&'static str] {
        self.scripts
    }

    /// Returns the intended command or operation target.
    #[must_use]
    pub const fn target(self) -> &'static str {
        self.target
    }

    /// Returns behavior that should be preserved during migration.
    #[must_use]
    pub const fn preserve(self) -> &'static str {
        self.preserve
    }

    /// Returns cleanup or improvement target for the migration.
    #[must_use]
    pub const fn cleanup(self) -> &'static str {
        self.cleanup
    }
}

const MIGRATION_PLAN: &[ScriptMigration] = &[
    ScriptMigration {
        domain: "site doctor",
        disposition: ScriptMigrationDisposition::RustReplacement,
        scripts: &["site:doctor"],
        target: "tpm site doctor",
        preserve: "source-mapped author diagnostics and quiet/json behavior",
        cleanup: "move durable relationship checks behind shared Rust diagnostics",
    },
    ScriptMigration {
        domain: "image assets",
        disposition: ScriptMigrationDisposition::RustReplacement,
        scripts: &[
            "assets:locations",
            "assets:shared",
            "assets:duplicates",
            "assets:unused",
            "review:assets",
        ],
        target: "tpm media images",
        preserve: "asset policy, ignored paths, and review-only duplicate/unused signals",
        cleanup: "unify image inventory so each image policy check scans once",
    },
    ScriptMigration {
        domain: "redirects",
        disposition: ScriptMigrationDisposition::RustReplacement,
        scripts: &["build:cloudflare"],
        target: "tpm routes redirects",
        preserve: "legacy permalink redirects, configured redirects, and Cloudflare limits",
        cleanup: "separate provider-neutral redirect rules from Cloudflare formatting",
    },
    ScriptMigration {
        domain: "qa registry",
        disposition: ScriptMigrationDisposition::RustReplacement,
        scripts: &["diagnostics:diff", "test:config"],
        target: "just qa-registry",
        preserve: "CI/local parity evidence and diagnostic diff semantics",
        cleanup: "track `just` and Rust command ownership without treating package scripts as permanent",
    },
    ScriptMigration {
        domain: "generated output",
        disposition: ScriptMigrationDisposition::RustReplacement,
        scripts: &["verify"],
        target: "just output-verify",
        preserve: "release diagnostics for routes, metadata, links, assets, feeds, PDFs, and redirects",
        cleanup: "split the verifier into reusable report modules for CLI, GUI, MCP, and CI",
    },
    ScriptMigration {
        domain: "rust package wrappers",
        disposition: ScriptMigrationDisposition::DeleteCandidate,
        scripts: &["rust:check", "rust:coverage", "rust:deny", "rust:nextest"],
        target: "just rust-*",
        preserve: "same Rust QA gates",
        cleanup: "remove package scripts that only delegate to `just`",
    },
    ScriptMigration {
        domain: "astro renderer",
        disposition: ScriptMigrationDisposition::EcosystemWrapper,
        scripts: &["build:raw", "typecheck:astro", "test:astro"],
        target: "just js-* / Astro tools",
        preserve: "Astro rendering, content collections, component tests, and browser-bound behavior",
        cleanup: "keep JS ecosystem commands behind `just` rather than exposing implementation details as long-term UX",
    },
];

/// Returns the milestone 9 migration classification table.
#[must_use]
pub const fn migration_plan() -> &'static [ScriptMigration] {
    MIGRATION_PLAN
}

/// Runs the migration baseline operation.
#[must_use]
pub fn run_migration_baseline(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    let start = start.into();
    let request = OperationRequest::new(operation_id("migration.baseline"), interface)
        .with_workspace(display_path(&start));

    match WorkspaceContext::discover(&start) {
        Ok(context) => {
            let diagnostics = validate_package_scripts(&context);
            let summary = migration_summary();
            OperationResult::new(request, summary, OperationTiming::default(), diagnostics)
        }
        Err(error) => OperationResult::new(
            request,
            migration_summary().with_detail(format!("workspace discovery failed: {error}")),
            OperationTiming::default(),
            DiagnosticReport::from_diagnostics(vec![
                Diagnostic::new(
                    diagnostic_code("TPM-MIGRATION-WORKSPACE"),
                    Severity::Error,
                    "Could not discover a workspace for the migration baseline.",
                )
                .with_location(DiagnosticLocation::source(display_path(&start)))
                .with_remediation(
                    "Run the migration baseline from a repo with site/config/site.json.",
                ),
            ]),
        ),
    }
}

fn migration_summary() -> OperationSummary {
    let rust_replacements = MIGRATION_PLAN
        .iter()
        .filter(|entry| entry.disposition() == ScriptMigrationDisposition::RustReplacement)
        .count();
    let delete_candidates = MIGRATION_PLAN
        .iter()
        .filter(|entry| entry.disposition() == ScriptMigrationDisposition::DeleteCandidate)
        .count();
    let ecosystem_wrappers = MIGRATION_PLAN
        .iter()
        .filter(|entry| entry.disposition() == ScriptMigrationDisposition::EcosystemWrapper)
        .count();

    OperationSummary::new("Migration baseline captured")
        .with_detail(format!("migration domains: {}", MIGRATION_PLAN.len()))
        .with_detail(format!("rust replacement domains: {rust_replacements}"))
        .with_detail(format!("delete-candidate domains: {delete_candidates}"))
        .with_detail(format!("ecosystem-wrapper domains: {ecosystem_wrappers}"))
        .with_detail("policy: parity is the safety mechanism; cleanup is the migration goal")
}

fn validate_package_scripts(context: &WorkspaceContext) -> DiagnosticReport {
    let package_json = context.root().join("package.json");
    let mut diagnostics = Vec::new();
    let contents = match fs::read_to_string(&package_json) {
        Ok(contents) => contents,
        Err(error) => {
            diagnostics.push(
                Diagnostic::new(
                    diagnostic_code("TPM-MIGRATION-PACKAGE-READ"),
                    Severity::Error,
                    format!("Could not read package.json for script classification: {error}."),
                )
                .with_location(DiagnosticLocation::source(
                    context.display_path(&package_json),
                ))
                .with_remediation("Check package.json exists and is readable."),
            );
            return DiagnosticReport::from_diagnostics(diagnostics);
        }
    };

    for entry in MIGRATION_PLAN {
        for script in entry.scripts() {
            if contents.contains(&format!("\"{script}\"")) {
                continue;
            }

            diagnostics.push(
                Diagnostic::new(
                    diagnostic_code("TPM-MIGRATION-SCRIPT-ABSENT"),
                    Severity::Note,
                    format!(
                        "Script `{script}` is already absent while `{}` is classified as {}.",
                        entry.domain(),
                        disposition_label(entry.disposition())
                    ),
                )
                .with_location(DiagnosticLocation::source(
                    context.display_path(&package_json),
                ))
                .with_remediation(
                    "Keep the migration baseline classification current as script debt is retired.",
                ),
            );
        }
    }

    DiagnosticReport::from_diagnostics(diagnostics)
}

const fn disposition_label(disposition: ScriptMigrationDisposition) -> &'static str {
    match disposition {
        ScriptMigrationDisposition::RustReplacement => "rust replacement",
        ScriptMigrationDisposition::EcosystemWrapper => "ecosystem wrapper",
        ScriptMigrationDisposition::DeleteCandidate => "delete candidate",
        ScriptMigrationDisposition::TemporaryShim => "temporary shim",
    }
}

#[expect(
    clippy::expect_used,
    reason = "migration operation IDs are static repository invariants"
)]
fn operation_id(value: &'static str) -> OperationId {
    OperationId::parse(value).expect("migration operation ID should be valid")
}

#[expect(
    clippy::expect_used,
    reason = "migration diagnostic codes are static repository invariants"
)]
fn diagnostic_code(value: &'static str) -> DiagnosticCode {
    DiagnosticCode::parse(value).expect("migration diagnostic code should be valid")
}

fn display_path(path: &std::path::Path) -> String {
    if path.as_os_str().is_empty() {
        return String::from(".");
    }

    path.to_string_lossy()
        .replace([std::path::MAIN_SEPARATOR, '\\'], "/")
}

#[cfg(test)]
mod tests {
    #![expect(
        clippy::expect_used,
        reason = "migration tests assert required fixture rows with static lookup keys"
    )]

    use std::error::Error;
    use std::fs;
    use std::path::{Path, PathBuf};

    use super::{ScriptMigrationDisposition, migration_plan, run_migration_baseline};
    use crate::{OperationInterface, OperationStatus};

    fn fixture_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .join("tests/fixtures/rust-workspace")
    }

    fn repo_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
    }

    fn temp_workspace(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("tpm-migration-{name}-{}", std::process::id()))
    }

    fn write_file(path: &Path, contents: &str) -> Result<(), Box<dyn Error>> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, contents)?;
        Ok(())
    }

    #[test]
    fn migration_plan_classifies_first_domains() {
        let domains = migration_plan()
            .iter()
            .map(|entry| (entry.domain(), entry.disposition()))
            .collect::<Vec<_>>();

        assert!(domains.contains(&("site doctor", ScriptMigrationDisposition::RustReplacement)));
        assert!(domains.contains(&(
            "rust package wrappers",
            ScriptMigrationDisposition::DeleteCandidate
        )));
        assert!(domains.contains(&(
            "astro renderer",
            ScriptMigrationDisposition::EcosystemWrapper
        )));

        let site_doctor = migration_plan()
            .iter()
            .find(|entry| entry.domain() == "site doctor")
            .expect("site doctor migration entry should exist");
        assert_eq!(site_doctor.scripts(), &["site:doctor"]);
        assert_eq!(site_doctor.target(), "tpm site doctor");
        assert!(site_doctor.preserve().contains("source-mapped"));
        assert!(site_doctor.cleanup().contains("shared Rust diagnostics"));
        assert_eq!(
            super::disposition_label(ScriptMigrationDisposition::TemporaryShim),
            "temporary shim"
        );
    }

    #[test]
    fn migration_baseline_reports_repo_script_state() {
        let result = run_migration_baseline(repo_root(), OperationInterface::Test);

        assert_ne!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .summary()
                .details()
                .iter()
                .any(|detail| detail.contains("migration domains"))
        );
    }

    #[test]
    fn migration_baseline_reports_missing_package_json() {
        let result = run_migration_baseline(fixture_root(), OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-MIGRATION-PACKAGE-READ")
        );
    }

    #[test]
    fn migration_baseline_reports_retired_script_notes() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("retired-scripts");
        let _ = fs::remove_dir_all(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        write_file(
            &root.join("package.json"),
            "{\"scripts\":{\"site:doctor\":\"old\"}}",
        )?;

        let result = run_migration_baseline(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Warning);
        assert!(result.diagnostics().diagnostics().iter().any(|diagnostic| {
            diagnostic.code().as_str() == "TPM-MIGRATION-SCRIPT-ABSENT"
                && diagnostic.message().contains("image assets")
        }));

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn migration_baseline_reports_missing_workspace() {
        let result = run_migration_baseline(
            PathBuf::from("/tmp/tpm-migration-missing-workspace"),
            OperationInterface::Test,
        );

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-MIGRATION-WORKSPACE")
        );
    }

    #[test]
    fn migration_display_path_handles_empty_paths() {
        assert_eq!(super::display_path(Path::new("")), ".");
    }
}
