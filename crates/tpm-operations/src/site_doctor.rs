//! Rust site-doctor operation for parity-protected migration.

use std::path::{Path, PathBuf};

use tpm_core::Severity;
use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticReport};
use tpm_workspace::WorkspaceContext;

use crate::{
    OperationId, OperationInterface, OperationRequest, OperationResult, OperationSummary,
    OperationTiming,
};

/// Runs the Rust site-doctor operation.
#[must_use]
pub fn run_site_doctor(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    let start = start.into();
    let request = OperationRequest::new(operation_id("site.doctor"), interface)
        .with_workspace(display_path(&start));

    match WorkspaceContext::discover(&start) {
        Ok(context) => {
            let mut diagnostics = context.validate_required_paths();
            diagnostics.push(transition_note(
                "TPM-SITE-DOCTOR-DUAL-RUN",
                "Rust site doctor is running in dual-run mode; current TypeScript site:doctor remains source of truth until promotion.",
                context.root(),
                &context,
            ));
            let summary = OperationSummary::new("Site doctor completed")
                .with_detail("checked required site workspace paths")
                .with_detail("dual-run parity target: site:doctor");

            OperationResult::new(request, summary, OperationTiming::default(), diagnostics)
        }
        Err(error) => OperationResult::new(
            request,
            OperationSummary::new("Site doctor failed")
                .with_detail(format!("workspace discovery failed: {error}")),
            OperationTiming::default(),
            DiagnosticReport::from_diagnostics(vec![
                Diagnostic::new(
                    diagnostic_code("TPM-SITE-DOCTOR-WORKSPACE"),
                    Severity::Error,
                    "Could not discover a workspace for site doctor.",
                )
                .with_location(DiagnosticLocation::source(display_path(&start)))
                .with_remediation(
                    "Run site doctor from a repo with site/config/site.json or pass --site.",
                ),
            ]),
        ),
    }
}

fn transition_note(
    code: &'static str,
    message: &'static str,
    path: &Path,
    context: &WorkspaceContext,
) -> Diagnostic {
    Diagnostic::new(diagnostic_code(code), Severity::Note, message)
        .with_location(DiagnosticLocation::source(context.display_path(path)))
        .with_remediation(
            "Compare this Rust report with the current TypeScript site:doctor before promotion.",
        )
}

fn operation_id(value: &'static str) -> OperationId {
    OperationId::parse(value).unwrap_or_else(|error| {
        panic!("site doctor operation ID should be valid: {error}");
    })
}

fn diagnostic_code(value: &'static str) -> DiagnosticCode {
    DiagnosticCode::parse(value).unwrap_or_else(|error| {
        panic!("site doctor diagnostic code should be valid: {error}");
    })
}

fn display_path(path: &Path) -> String {
    if path.as_os_str().is_empty() {
        return String::from(".");
    }

    path.to_string_lossy()
        .replace([std::path::MAIN_SEPARATOR, '\\'], "/")
}

#[cfg(test)]
mod tests {
    use std::path::{Path, PathBuf};

    use super::{display_path, run_site_doctor};
    use crate::{OperationInterface, OperationStatus};

    fn fixture_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .join("tests/fixtures/rust-workspace")
    }

    #[test]
    fn site_doctor_reports_dual_run_note_for_valid_fixture() {
        let result = run_site_doctor(fixture_root(), OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Warning);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-SITE-DOCTOR-DUAL-RUN")
        );
    }

    #[test]
    fn site_doctor_reports_missing_workspace_as_failure() {
        let result = run_site_doctor(
            PathBuf::from("/tmp/tpm-site-doctor-missing-workspace"),
            OperationInterface::Test,
        );

        assert_eq!(result.status(), OperationStatus::Failed);
        assert_eq!(
            result.diagnostics().errors()[0].code().as_str(),
            "TPM-SITE-DOCTOR-WORKSPACE"
        );
    }

    #[test]
    fn site_doctor_display_path_handles_empty_paths() {
        assert_eq!(display_path(Path::new("")), ".");
    }
}
