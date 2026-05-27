//! Shared operation request and result envelopes for the TPM publishing platform.

mod generated_output;
mod media;
mod migration;
mod qa;
mod redirects;
mod site_doctor;

use std::fmt::{Display, Formatter, Result as FormatResult};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use serde::de::Error as DeserializeError;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use tpm_core::Severity;
use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticReport};
use tpm_workspace::{WorkspaceContext, WorkspaceDiscoveryError};

pub use generated_output::run_generated_output_bridge;
pub use media::run_image_asset_verification;
pub use migration::{
    ScriptMigration, ScriptMigrationDisposition, migration_plan, run_migration_baseline,
};
pub use qa::{DiagnosticRecord, run_qa_diagnostic_diff, run_qa_registry};
pub use redirects::run_redirect_report;
pub use site_doctor::run_site_doctor;

/// Current schema version for serialized operation reports.
pub const OPERATION_SCHEMA_VERSION: u16 = 1;

/// Stable operation identifier.
#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct OperationId(String);

impl OperationId {
    /// Builds an operation ID after validating its stable display form.
    ///
    /// IDs must be lowercase domain names such as `workspace.status`.
    ///
    /// # Errors
    ///
    /// Returns [`OperationIdError`] when the value is empty, contains an empty
    /// dot-separated segment, or contains an unsupported character.
    pub fn parse(value: impl Into<String>) -> Result<Self, OperationIdError> {
        let value = value.into();

        if value.is_empty() {
            return Err(OperationIdError::Empty);
        }

        for segment in value.split('.') {
            if segment.is_empty() {
                return Err(OperationIdError::EmptySegment);
            }

            if !segment
                .bytes()
                .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
            {
                return Err(OperationIdError::InvalidCharacter);
            }
        }

        Ok(Self(value))
    }

    /// Returns the stable operation identifier.
    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl Display for OperationId {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        formatter.write_str(self.as_str())
    }
}

impl Serialize for OperationId {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.as_str().serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for OperationId {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = String::deserialize(deserializer)?;
        Self::parse(value).map_err(DeserializeError::custom)
    }
}

/// Validation failures for operation identifiers.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum OperationIdError {
    /// The operation ID was empty.
    Empty,
    /// The operation ID contained an empty dot-separated segment.
    EmptySegment,
    /// The operation ID contained an unsupported character.
    InvalidCharacter,
}

impl Display for OperationIdError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        let message = match self {
            Self::Empty => "operation ID must not be empty",
            Self::EmptySegment => "operation ID must not contain empty segments",
            Self::InvalidCharacter => {
                "operation ID may only contain ASCII lowercase letters, numbers, dots, and hyphens"
            }
        };

        formatter.write_str(message)
    }
}

impl std::error::Error for OperationIdError {}

/// Interface that requested an operation.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum OperationInterface {
    /// Command-line interface.
    Cli,
    /// Graphical studio interface.
    Gui,
    /// Model Context Protocol server/tooling.
    Mcp,
    /// Continuous integration or local automation.
    Ci,
    /// Test fixture or internal verification.
    Test,
}

/// Current operation lifecycle status.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum OperationStatus {
    /// The operation completed without diagnostics.
    Success,
    /// The operation completed with non-blocking diagnostics.
    Warning,
    /// The operation failed because at least one diagnostic was blocking.
    Failed,
}

impl OperationStatus {
    /// Derives status from a diagnostic report.
    #[must_use]
    pub fn from_report(report: &DiagnosticReport) -> Self {
        if report.has_blocking() {
            Self::Failed
        } else if report.diagnostics().is_empty() {
            Self::Success
        } else {
            Self::Warning
        }
    }
}

impl Display for OperationStatus {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        let label = match self {
            Self::Success => "success",
            Self::Warning => "warning",
            Self::Failed => "failed",
        };

        formatter.write_str(label)
    }
}

/// Caller-supplied operation request metadata.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationRequest {
    operation_id: OperationId,
    interface: OperationInterface,
    #[serde(skip_serializing_if = "Option::is_none")]
    workspace: Option<String>,
}

impl OperationRequest {
    /// Creates an operation request.
    #[must_use]
    pub const fn new(operation_id: OperationId, interface: OperationInterface) -> Self {
        Self {
            operation_id,
            interface,
            workspace: None,
        }
    }

    /// Adds a workspace display path to the operation request.
    #[must_use]
    pub fn with_workspace(mut self, workspace: impl Into<String>) -> Self {
        self.workspace = Some(workspace.into());
        self
    }

    /// Returns the operation ID.
    #[must_use]
    pub const fn operation_id(&self) -> &OperationId {
        &self.operation_id
    }

    /// Returns the requesting interface.
    #[must_use]
    pub const fn interface(&self) -> OperationInterface {
        self.interface
    }

    /// Returns the workspace display path when available.
    #[must_use]
    pub fn workspace(&self) -> Option<&str> {
        self.workspace.as_deref()
    }
}

/// Operation execution timing.
#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationTiming {
    #[serde(skip_serializing_if = "Option::is_none")]
    duration_ms: Option<u64>,
}

impl OperationTiming {
    /// Creates timing with a completed duration.
    #[must_use]
    pub const fn completed(duration_ms: u64) -> Self {
        Self {
            duration_ms: Some(duration_ms),
        }
    }

    /// Returns the completed duration in milliseconds when available.
    #[must_use]
    pub const fn duration_ms(self) -> Option<u64> {
        self.duration_ms
    }
}

/// Short operation summary for humans and machines.
#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationSummary {
    title: String,
    details: Vec<String>,
}

impl OperationSummary {
    /// Creates an operation summary.
    #[must_use]
    pub fn new(title: impl Into<String>) -> Self {
        Self {
            title: title.into(),
            details: Vec::new(),
        }
    }

    /// Adds a summary detail line.
    #[must_use]
    pub fn with_detail(mut self, detail: impl Into<String>) -> Self {
        self.details.push(detail.into());
        self
    }

    /// Returns the summary title.
    #[must_use]
    pub fn title(&self) -> &str {
        &self.title
    }

    /// Returns summary detail lines.
    #[must_use]
    pub fn details(&self) -> &[String] {
        &self.details
    }
}

/// Serializable result envelope for a platform operation.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationResult {
    schema_version: u16,
    request: OperationRequest,
    status: OperationStatus,
    summary: OperationSummary,
    timing: OperationTiming,
    diagnostics: DiagnosticReport,
}

impl OperationResult {
    /// Creates an operation result and derives status from diagnostics.
    #[must_use]
    pub fn new(
        request: OperationRequest,
        summary: OperationSummary,
        timing: OperationTiming,
        diagnostics: DiagnosticReport,
    ) -> Self {
        let status = OperationStatus::from_report(&diagnostics);

        Self {
            schema_version: OPERATION_SCHEMA_VERSION,
            request,
            status,
            summary,
            timing,
            diagnostics,
        }
    }

    /// Returns the serialized schema version.
    #[must_use]
    pub const fn schema_version(&self) -> u16 {
        self.schema_version
    }

    /// Returns the operation request metadata.
    #[must_use]
    pub const fn request(&self) -> &OperationRequest {
        &self.request
    }

    /// Returns the operation status.
    #[must_use]
    pub const fn status(&self) -> OperationStatus {
        self.status
    }

    /// Returns the operation summary.
    #[must_use]
    pub const fn summary(&self) -> &OperationSummary {
        &self.summary
    }

    /// Returns operation timing.
    #[must_use]
    pub const fn timing(&self) -> OperationTiming {
        self.timing
    }

    /// Returns operation diagnostics.
    #[must_use]
    pub const fn diagnostics(&self) -> &DiagnosticReport {
        &self.diagnostics
    }

    /// Returns warning diagnostics in emission order.
    #[must_use]
    pub fn warnings(&self) -> Vec<&Diagnostic> {
        self.diagnostics.warnings()
    }

    /// Renders the operation result as stable human-facing text.
    #[must_use]
    pub fn render_human(&self) -> String {
        let mut output = format!(
            "{}: {} ({})\n",
            self.request.operation_id(),
            self.summary.title(),
            self.status()
        );

        if let Some(workspace) = self.request.workspace() {
            output.push_str("workspace: ");
            output.push_str(workspace);
            output.push('\n');
        }

        for detail in self.summary.details() {
            output.push_str("- ");
            output.push_str(detail);
            output.push('\n');
        }

        if let Some(duration_ms) = self.timing.duration_ms() {
            output.push_str("duration: ");
            output.push_str(&duration_ms.to_string());
            output.push_str("ms\n");
        }

        let diagnostic_text = self.diagnostics.render_human();
        if !self.diagnostics.is_empty() {
            output.push_str(&diagnostic_text);
        }

        output
    }

    /// Renders the operation result as stable pretty JSON.
    ///
    /// # Errors
    ///
    /// Returns the underlying [`serde_json::Error`] when serialization fails.
    pub fn render_json_pretty(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }
}

/// Runs the read-only workspace status operation.
#[must_use]
pub fn run_workspace_status(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    let start = start.into();
    run_workspace_inventory_operation(
        &start,
        interface,
        "workspace.status",
        "Workspace status checked",
    )
}

/// Runs the first Rust workspace diagnostic check.
#[must_use]
pub fn run_workspace_check(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    let start = start.into();
    run_workspace_inventory_operation(
        &start,
        interface,
        "workspace.check",
        "Workspace check completed",
    )
}

/// Runs the first Rust workspace doctor operation.
#[must_use]
pub fn run_workspace_doctor(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    let start = start.into();
    run_workspace_inventory_operation(
        &start,
        interface,
        "workspace.doctor",
        "Workspace diagnostics explained",
    )
}

/// Runs a read-only release inspection over the conventional generated output.
#[must_use]
pub fn run_release_inspect(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    let start = start.into();
    let request = OperationRequest::new(operation_id("release.inspect"), interface)
        .with_workspace(display_path(&start));

    match WorkspaceContext::discover(&start) {
        Ok(context) => {
            let output = context.layout().output();
            let mut diagnostics = context.validate_required_paths();
            let mut summary = OperationSummary::new("Release inspected")
                .with_detail(format!("output root: {}", context.display_path(output)));

            if output.is_dir() {
                match count_files(output) {
                    Ok(count) => {
                        summary = summary.with_detail(format!("output artifacts: {count}"));
                    }
                    Err(error) => diagnostics.push(io_diagnostic(
                        "TPM-RELEASE-OUTPUT-READ",
                        Severity::Error,
                        format!("Could not inspect generated output: {error}."),
                        context.display_path(output),
                        "Check filesystem permissions for the generated output directory.",
                    )),
                }
            } else {
                diagnostics.push(
                    Diagnostic::new(
                        diagnostic_code("TPM-RELEASE-OUTPUT-MISSING"),
                        Severity::Warning,
                        format!(
                            "No generated output directory exists at `{}`.",
                            context.display_path(output)
                        ),
                    )
                    .with_location(DiagnosticLocation::artifact(context.display_path(output)))
                    .with_remediation("Build release output before inspecting release artifacts."),
                );
            }

            OperationResult::new(request, summary, OperationTiming::default(), diagnostics)
        }
        Err(error) => OperationResult::new(
            request,
            OperationSummary::new("Release inspection failed").with_detail(format!(
                "start path: {}",
                display_path(workspace_discovery_start(&error))
            )),
            OperationTiming::default(),
            DiagnosticReport::from_diagnostics(vec![workspace_not_found_diagnostic(&error)]),
        ),
    }
}

fn run_workspace_inventory_operation(
    start: &Path,
    interface: OperationInterface,
    operation: &'static str,
    title: &'static str,
) -> OperationResult {
    let request = OperationRequest::new(operation_id(operation), interface)
        .with_workspace(display_path(start));

    match WorkspaceContext::discover(start) {
        Ok(context) => {
            let mut diagnostics = context.validate_required_paths();
            let source_roots = context.source_roots();
            let mut summary = OperationSummary::new(title)
                .with_detail(format!("source roots: {}", source_roots.len()))
                .with_detail(format!(
                    "required roots: {}",
                    source_roots.iter().filter(|root| root.required()).count()
                ));

            match context.inventory_source_artifacts() {
                Ok(inventory) => {
                    summary = summary
                        .with_detail(format!("source artifacts: {}", inventory.artifacts().len()));
                }
                Err(error) => diagnostics.push(io_diagnostic(
                    "TPM-WORKSPACE-INVENTORY",
                    Severity::Error,
                    format!("Could not inventory workspace source artifacts: {error}."),
                    context.display_path(context.site()),
                    "Check filesystem permissions for the active site workspace.",
                )),
            }

            OperationResult::new(request, summary, OperationTiming::default(), diagnostics)
        }
        Err(error) => OperationResult::new(
            request,
            OperationSummary::new(format!("{title} with errors")).with_detail(format!(
                "start path: {}",
                display_path(workspace_discovery_start(&error))
            )),
            OperationTiming::default(),
            DiagnosticReport::from_diagnostics(vec![workspace_not_found_diagnostic(&error)]),
        ),
    }
}

fn workspace_not_found_diagnostic(error: &WorkspaceDiscoveryError) -> Diagnostic {
    Diagnostic::new(
        diagnostic_code("TPM-WORKSPACE-NOT-FOUND"),
        Severity::Error,
        format!(
            "Could not find `site/config/site.json` from `{}`.",
            display_path(workspace_discovery_start(error))
        ),
    )
    .with_location(DiagnosticLocation::source(display_path(
        workspace_discovery_start(error),
    )))
    .with_remediation(
        "Run the command from a site workspace or pass `--site <path>` for the workspace root.",
    )
}

fn io_diagnostic(
    code: &'static str,
    severity: Severity,
    message: String,
    path: String,
    remediation: &'static str,
) -> Diagnostic {
    Diagnostic::new(diagnostic_code(code), severity, message)
        .with_location(DiagnosticLocation::source(path))
        .with_remediation(remediation)
}

fn count_files(root: &Path) -> io::Result<usize> {
    let mut count = 0;
    let mut entries = fs::read_dir(root)?.collect::<Result<Vec<_>, _>>()?;
    entries.sort_by_key(fs::DirEntry::path);

    for entry in entries {
        let path = entry.path();
        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            count += count_files(&path)?;
        } else if file_type.is_file() {
            count += 1;
        }
    }

    Ok(count)
}

fn operation_id(value: &'static str) -> OperationId {
    OperationId::parse(value).unwrap_or_else(|error| {
        panic!("operation ID should be valid: {error}");
    })
}

fn diagnostic_code(value: &'static str) -> DiagnosticCode {
    DiagnosticCode::parse(value).unwrap_or_else(|error| {
        panic!("diagnostic code should be valid: {error}");
    })
}

fn display_path(path: &Path) -> String {
    if path.as_os_str().is_empty() {
        return String::from(".");
    }

    path.to_string_lossy()
        .replace([std::path::MAIN_SEPARATOR, '\\'], "/")
}

fn workspace_discovery_start(error: &WorkspaceDiscoveryError) -> &Path {
    match error {
        WorkspaceDiscoveryError::NotFound { start } => start,
    }
}

/// Creates an operation ID for test fixtures.
#[cfg(test)]
fn test_operation_id(value: &str) -> OperationId {
    OperationId::parse(value).unwrap_or_else(|error| {
        panic!("test operation ID should be valid: {error}");
    })
}

/// Creates a warning diagnostic for operation tests.
#[cfg(test)]
fn test_warning(code: &str, message: &str) -> Diagnostic {
    let code = DiagnosticCode::parse(code).unwrap_or_else(|error| {
        panic!("test diagnostic code should be valid: {error}");
    });

    Diagnostic::new(code, Severity::Warning, message)
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::{
        OPERATION_SCHEMA_VERSION, OperationInterface, OperationRequest, OperationResult,
        OperationStatus, OperationSummary, OperationTiming, run_release_inspect,
        run_workspace_check, run_workspace_status, test_operation_id, test_warning,
    };
    use tpm_core::Severity;
    use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticReport};

    fn diagnostic_code(value: &str) -> DiagnosticCode {
        DiagnosticCode::parse(value).unwrap_or_else(|error| {
            panic!("test diagnostic code should be valid: {error}");
        })
    }

    fn request() -> OperationRequest {
        OperationRequest::new(
            test_operation_id("workspace.status"),
            OperationInterface::Test,
        )
        .with_workspace("tests/fixtures/rust-workspace")
    }

    fn fixture_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .join("tests/fixtures/rust-workspace")
    }

    #[test]
    fn operation_ids_reject_invalid_values() {
        assert_eq!(
            test_operation_id("workspace.status").as_str(),
            "workspace.status"
        );
        assert!(super::OperationId::parse("Workspace Status").is_err());
        assert!(super::OperationId::parse("workspace..status").is_err());
    }

    #[test]
    fn operation_status_is_derived_from_diagnostics() {
        let success = OperationStatus::from_report(&DiagnosticReport::new());
        let warning =
            OperationStatus::from_report(&DiagnosticReport::from_diagnostics(vec![test_warning(
                "TPM-OP-WARNING",
                "warning",
            )]));
        let failed = OperationStatus::from_report(&DiagnosticReport::from_diagnostics(vec![
            Diagnostic::new(
                diagnostic_code("TPM-OP-ERROR"),
                Severity::Error,
                "blocking error",
            ),
        ]));

        assert_eq!(success, OperationStatus::Success);
        assert_eq!(warning, OperationStatus::Warning);
        assert_eq!(failed, OperationStatus::Failed);
    }

    #[test]
    fn operation_result_renders_human_success() {
        let result = OperationResult::new(
            request(),
            OperationSummary::new("Workspace status checked")
                .with_detail("3 source artifacts found"),
            OperationTiming::completed(12),
            DiagnosticReport::new(),
        );

        let rendered = result.render_human();

        assert!(rendered.contains("workspace.status: Workspace status checked (success)"));
        assert!(rendered.contains("workspace: tests/fixtures/rust-workspace"));
        assert!(rendered.contains("- 3 source artifacts found"));
        assert!(rendered.contains("duration: 12ms"));
        assert!(!rendered.contains("No diagnostics."));
    }

    #[test]
    fn operation_result_renders_human_warning() {
        let result = OperationResult::new(
            request(),
            OperationSummary::new("Workspace status checked"),
            OperationTiming::default(),
            DiagnosticReport::from_diagnostics(vec![test_warning(
                "TPM-OP-WARNING",
                "Review this warning.",
            )]),
        );

        let rendered = result.render_human();

        assert_eq!(result.status(), OperationStatus::Warning);
        assert!(rendered.contains("warning TPM-OP-WARNING: Review this warning."));
    }

    #[test]
    fn operation_result_renders_json_contract() -> Result<(), serde_json::Error> {
        let expected =
            include_str!("../../../tests/fixtures/rust-operations/workspace-status-warning.json");
        let result = OperationResult::new(
            request(),
            OperationSummary::new("Workspace status checked"),
            OperationTiming::completed(7),
            DiagnosticReport::from_diagnostics(vec![test_warning(
                "TPM-OP-WARNING",
                "Review this warning.",
            )]),
        );

        let rendered = result.render_json_pretty()?;

        assert_eq!(result.schema_version(), OPERATION_SCHEMA_VERSION);
        assert_eq!(result.warnings().len(), 1);
        assert_eq!(rendered, expected.trim_end());

        Ok(())
    }

    #[test]
    fn operation_id_deserialization_rejects_invalid_values() {
        let result = serde_json::from_str::<super::OperationId>("\"Workspace Status\"");

        assert!(result.is_err());
    }

    #[test]
    fn workspace_status_operation_reports_fixture_inventory() {
        let result = run_workspace_status(fixture_root(), OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Success);
        assert_eq!(result.request().operation_id().as_str(), "workspace.status");
        assert!(
            result
                .summary()
                .details()
                .iter()
                .any(|detail| detail == "source artifacts: 3")
        );
    }

    #[test]
    fn workspace_check_operation_reports_missing_workspace() {
        let result = run_workspace_check(
            PathBuf::from("/tmp/tpm-missing-operation-workspace"),
            OperationInterface::Test,
        );

        assert_eq!(result.status(), OperationStatus::Failed);
        assert_eq!(result.request().operation_id().as_str(), "workspace.check");
        assert_eq!(
            result.diagnostics().errors()[0].code().as_str(),
            "TPM-WORKSPACE-NOT-FOUND"
        );
    }

    #[test]
    fn release_inspect_operation_warns_when_output_is_missing() {
        let result = run_release_inspect(fixture_root(), OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Warning);
        assert_eq!(result.request().operation_id().as_str(), "release.inspect");
        assert_eq!(
            result.warnings()[0].code().as_str(),
            "TPM-RELEASE-OUTPUT-MISSING"
        );
    }
}
