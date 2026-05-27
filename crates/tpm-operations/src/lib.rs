//! Shared operation request and result envelopes for the TPM publishing platform.

use std::fmt::{Display, Formatter, Result as FormatResult};

use serde::de::Error as DeserializeError;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use tpm_diagnostics::{Diagnostic, DiagnosticReport};

/// Current schema version for serialized operation reports.
pub const OPERATION_SCHEMA_VERSION: u16 = 1;

/// Stable operation identifier.
#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct OperationId(String);

impl OperationId {
    /// Builds an operation ID after validating its stable display form.
    ///
    /// IDs must be lowercase domain names such as `workspace.status`.
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
            output.push_str(&format!("workspace: {workspace}\n"));
        }

        for detail in self.summary.details() {
            output.push_str(&format!("- {detail}\n"));
        }

        if let Some(duration_ms) = self.timing.duration_ms() {
            output.push_str(&format!("duration: {duration_ms}ms\n"));
        }

        let diagnostic_text = self.diagnostics.render_human();
        if !self.diagnostics.is_empty() {
            output.push_str(&diagnostic_text);
        }

        output
    }

    /// Renders the operation result as stable pretty JSON.
    pub fn render_json_pretty(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
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
    let code = tpm_diagnostics::DiagnosticCode::parse(code).unwrap_or_else(|error| {
        panic!("test diagnostic code should be valid: {error}");
    });

    Diagnostic::new(code, tpm_core::Severity::Warning, message)
}

#[cfg(test)]
mod tests {
    use super::{
        OPERATION_SCHEMA_VERSION, OperationInterface, OperationRequest, OperationResult,
        OperationStatus, OperationSummary, OperationTiming, test_operation_id, test_warning,
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
}
