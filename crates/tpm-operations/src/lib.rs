//! Shared operation request and result envelopes for the TPM publishing platform.

mod adapters;
mod generated_output;
mod media;
mod migration;
mod qa;
mod redirects;
mod site_doctor;
mod studio;

use std::fmt::{Display, Formatter, Result as FormatResult};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use serde::de::Error as DeserializeError;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use tpm_core::Severity;
use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticReport};
use tpm_workspace::{WorkspaceContext, WorkspaceDiscoveryError};

pub use adapters::{
    AdapterBoundary, AdapterDescriptor, AdapterFamily, AdapterInspectionPayload,
    AdapterRuntimeProfile, AuditRequirement, CapabilityActionBehavior, CapabilityOperation,
    CapabilityRegistry, CapabilityStatus, CredentialReference, CredentialRequirement,
    CredentialScope, CredentialSecretReference, CredentialState, CredentialStorageProfile,
    CredentialSubject, DestructiveBehavior, DryRunSupport, ManualStep, ProviderCapability,
    ProviderId, ProviderIdError, Reversibility, UnsupportedBehavior, mock_registry,
    unsupported_operation_diagnostic,
};
pub use generated_output::run_generated_output_bridge;
pub use media::run_image_asset_verification;
pub use migration::{
    ScriptMigration, ScriptMigrationDisposition, migration_plan, run_migration_baseline,
};
pub use qa::{DiagnosticRecord, run_qa_diagnostic_diff, run_qa_registry};
pub use redirects::run_redirect_report;
pub use site_doctor::run_site_doctor;
pub use studio::{
    StudioAuthoringPayload, run_studio_content_editor, run_studio_media_library,
    run_studio_preview_plan, run_studio_publish_apply, run_studio_release_plan,
    run_studio_settings_inspect, run_studio_workflow_verify,
};

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
    /// The operation produced a plan that needs explicit approval before apply.
    RequiresApproval,
    /// The operation needs credentials before the requested provider action can run.
    RequiresCredentials,
    /// The operation is only partially available for the configured providers.
    Partial,
    /// The operation is unavailable for the configured providers.
    Unsupported,
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
            Self::RequiresApproval => "requires-approval",
            Self::RequiresCredentials => "requires-credentials",
            Self::Partial => "partial",
            Self::Unsupported => "unsupported",
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

/// Typed payload attached to operation results that need more than summary
/// lines and diagnostics.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case", tag = "kind", content = "data")]
pub enum OperationPayload {
    /// Adapter capability inspection payload.
    AdapterInspection(AdapterInspectionPayload),
    /// Studio authoring and publish workflow payload.
    StudioAuthoring(Box<StudioAuthoringPayload>),
}

impl OperationPayload {
    /// Renders payload details for human output.
    #[must_use]
    pub fn render_human(&self) -> String {
        match self {
            Self::AdapterInspection(payload) => payload.render_human(),
            Self::StudioAuthoring(payload) => payload.render_human(),
        }
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
    #[serde(skip_serializing_if = "Option::is_none")]
    payload: Option<OperationPayload>,
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
            payload: None,
        }
    }

    /// Attaches a typed payload to the operation result.
    #[must_use]
    pub fn with_payload(mut self, payload: OperationPayload) -> Self {
        self.payload = Some(payload);
        self
    }

    /// Overrides the derived lifecycle status for plan/apply operations whose
    /// state is not equivalent to diagnostic severity.
    #[must_use]
    pub const fn with_status(mut self, status: OperationStatus) -> Self {
        self.status = status;
        self
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

    /// Returns the typed payload when the operation has one.
    #[must_use]
    pub const fn payload(&self) -> Option<&OperationPayload> {
        self.payload.as_ref()
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

        if let Some(payload) = &self.payload {
            output.push_str(&payload.render_human());
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

/// Runs adapter capability inspection for the default TPM-like profile.
#[must_use]
pub fn run_adapter_inspect(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    run_adapter_inspect_for_profile(start, interface, AdapterRuntimeProfile::TpmLike)
}

/// Runs adapter capability inspection for an explicit mock runtime profile.
#[must_use]
pub fn run_adapter_inspect_for_profile(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
    profile: AdapterRuntimeProfile,
) -> OperationResult {
    let start = start.into();
    let request = OperationRequest::new(operation_id("adapters.inspect"), interface)
        .with_workspace(display_path(&start));
    let registry = mock_registry(profile);
    let payload = AdapterInspectionPayload::from_registry(&registry);
    let unavailable_capabilities = registry.unavailable_capabilities().len();
    let mut diagnostics = registry.unavailable_capability_diagnostics();

    if let Ok(context) = WorkspaceContext::discover(&start) {
        for diagnostic in context.validate_required_paths().diagnostics() {
            diagnostics.push(diagnostic.clone());
        }
    } else {
        diagnostics.push(
            Diagnostic::new(
                diagnostic_code("TPM-ADAPTER-WORKSPACE-UNRESOLVED"),
                Severity::Warning,
                "Adapter inspection could not resolve a site workspace.",
            )
            .with_location(DiagnosticLocation::source(display_path(&start)))
            .with_remediation(
                "Run from a site workspace or pass --site to include workspace diagnostics.",
            ),
        );
    }

    OperationResult::new(
        request,
        OperationSummary::new("Adapter capabilities inspected")
            .with_detail(format!("profile: {profile}"))
            .with_detail(format!("adapters: {}", registry.adapters().len()))
            .with_detail(format!("capabilities: {}", registry.capabilities().len()))
            .with_detail(format!(
                "unavailable capabilities: {unavailable_capabilities}"
            )),
        OperationTiming::default(),
        diagnostics,
    )
    .with_payload(OperationPayload::AdapterInspection(payload))
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
        } else {
            count += 1;
        }
    }

    Ok(count)
}

#[expect(
    clippy::expect_used,
    reason = "operation IDs are static repository invariants"
)]
fn operation_id(value: &'static str) -> OperationId {
    OperationId::parse(value).expect("operation ID should be valid")
}

#[expect(
    clippy::expect_used,
    reason = "operation diagnostic codes are static repository invariants"
)]
fn diagnostic_code(value: &'static str) -> DiagnosticCode {
    DiagnosticCode::parse(value).expect("diagnostic code should be valid")
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
#[expect(
    clippy::expect_used,
    reason = "operation test helper IDs are static fixture invariants"
)]
fn test_operation_id(value: &str) -> OperationId {
    OperationId::parse(value).expect("test operation ID should be valid")
}

/// Creates a warning diagnostic for operation tests.
#[cfg(test)]
#[expect(
    clippy::expect_used,
    reason = "operation test helper diagnostic codes are static fixture invariants"
)]
fn test_warning(code: &str, message: &str) -> Diagnostic {
    let code = DiagnosticCode::parse(code).expect("test diagnostic code should be valid");

    Diagnostic::new(code, Severity::Warning, message)
}

#[cfg(test)]
pub(crate) mod test_support {
    //! Shared helpers for operation tests.

    use std::fs;
    use std::io;
    use std::path::Path;

    /// Removes a temporary test directory, accepting an already-clean path.
    #[expect(
        clippy::redundant_pub_crate,
        reason = "shared cfg(test) helper is intentionally visible to sibling test modules only"
    )]
    pub(super) fn remove_test_dir(path: impl AsRef<Path>) {
        match fs::remove_dir_all(path.as_ref()) {
            Ok(()) => {}
            Err(error) if error.kind() == io::ErrorKind::NotFound => {}
            Err(error) => panic!("failed to remove test directory: {error}"),
        }
    }
}

#[cfg(test)]
mod tests {
    #![expect(
        clippy::expect_used,
        reason = "operation tests use static fixture identifiers and diagnostics"
    )]

    use std::error::Error;
    use std::fs;
    use std::path::{Path, PathBuf};

    #[cfg(unix)]
    use std::os::unix::fs::PermissionsExt as _;

    use super::{
        AdapterRuntimeProfile, OPERATION_SCHEMA_VERSION, OperationInterface, OperationPayload,
        OperationRequest, OperationResult, OperationStatus, OperationSummary, OperationTiming,
        run_adapter_inspect_for_profile, run_release_inspect, run_workspace_check,
        run_workspace_doctor, run_workspace_status, test_operation_id, test_warning,
    };
    use tpm_core::Severity;
    use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticReport};

    fn diagnostic_code(value: &str) -> DiagnosticCode {
        DiagnosticCode::parse(value).expect("test diagnostic code should be valid")
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

    fn temp_workspace(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("tpm-operations-{name}-{}", std::process::id()))
    }

    fn write_file(path: &Path, contents: &str) -> Result<(), Box<dyn Error>> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, contents)?;
        Ok(())
    }

    #[cfg(unix)]
    fn make_unreadable(path: &Path) -> Result<fs::Permissions, Box<dyn Error>> {
        let original = fs::metadata(path)?.permissions();
        fs::set_permissions(path, fs::Permissions::from_mode(0o000))?;
        Ok(original)
    }

    #[test]
    fn operation_ids_reject_invalid_values() {
        assert_eq!(
            test_operation_id("workspace.status").as_str(),
            "workspace.status"
        );
        assert_eq!(
            super::OperationId::parse("").err(),
            Some(super::OperationIdError::Empty)
        );
        assert_eq!(
            super::OperationIdError::Empty.to_string(),
            "operation ID must not be empty"
        );
        assert_eq!(
            super::OperationId::parse("workspace..status").err(),
            Some(super::OperationIdError::EmptySegment)
        );
        assert_eq!(
            super::OperationIdError::EmptySegment.to_string(),
            "operation ID must not contain empty segments"
        );
        assert_eq!(
            super::OperationId::parse("Workspace Status").err(),
            Some(super::OperationIdError::InvalidCharacter)
        );
        assert_eq!(
            super::OperationIdError::InvalidCharacter.to_string(),
            "operation ID may only contain ASCII lowercase letters, numbers, dots, and hyphens"
        );
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
    fn operation_status_display_covers_plan_apply_states() {
        assert_eq!(
            OperationStatus::RequiresApproval.to_string(),
            "requires-approval"
        );
        assert_eq!(
            OperationStatus::RequiresCredentials.to_string(),
            "requires-credentials"
        );
        assert_eq!(OperationStatus::Partial.to_string(), "partial");
        assert_eq!(OperationStatus::Unsupported.to_string(), "unsupported");

        let result = OperationResult::new(
            request(),
            OperationSummary::new("Plan created"),
            OperationTiming::default(),
            DiagnosticReport::new(),
        )
        .with_status(OperationStatus::RequiresApproval);

        assert_eq!(result.status(), OperationStatus::RequiresApproval);
        assert!(result.render_human().contains("(requires-approval)"));
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
            OperationSummary::new("Workspace status checked")
                .with_detail("source roots: site/config/site.json, site/content, site/assets, site/public")
                .with_detail("required roots: 4")
                .with_detail("operation source: shared parity fixture"),
            OperationTiming::completed(7),
            DiagnosticReport::from_diagnostics(vec![
                test_warning("TPM-OP-WARNING", "Review this warning.")
                    .with_remediation(
                        "Review the shared operation fixture before changing interface-specific rendering.",
                    )
                    .with_location(DiagnosticLocation::source(
                        "tests/fixtures/rust-operations/workspace-status-warning.json",
                    )),
            ]),
        );

        let rendered = result.render_json_pretty()?;

        assert_eq!(result.schema_version(), OPERATION_SCHEMA_VERSION);
        assert_eq!(result.request().interface(), OperationInterface::Test);
        assert_eq!(
            result.request().workspace(),
            Some("tests/fixtures/rust-workspace")
        );
        assert_eq!(result.timing().duration_ms(), Some(7));
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
    fn workspace_check_and_doctor_report_fixture_inventory() {
        let check = run_workspace_check(fixture_root(), OperationInterface::Test);
        let doctor = run_workspace_doctor(fixture_root(), OperationInterface::Test);

        assert_eq!(check.status(), OperationStatus::Success);
        assert_eq!(check.request().operation_id().as_str(), "workspace.check");
        assert!(check.summary().details().iter().any(|detail| {
            detail == "source roots: 4" || detail.starts_with("source artifacts: ")
        }));
        assert_eq!(doctor.status(), OperationStatus::Success);
        assert_eq!(doctor.request().operation_id().as_str(), "workspace.doctor");
        assert!(
            doctor
                .summary()
                .details()
                .iter()
                .any(|detail| detail == "required roots: 4")
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
    fn release_inspect_reports_missing_workspace() {
        let result = run_release_inspect(
            PathBuf::from("/tmp/tpm-missing-release-workspace"),
            OperationInterface::Test,
        );

        assert_eq!(result.status(), OperationStatus::Failed);
        assert_eq!(result.request().operation_id().as_str(), "release.inspect");
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

    #[test]
    fn adapter_inspect_operation_reports_each_mock_profile() {
        for (profile, expected_provider) in [
            (AdapterRuntimeProfile::LocalOnly, "manual-deploy"),
            (AdapterRuntimeProfile::TpmLike, "cloudflare-deploy"),
            (AdapterRuntimeProfile::ComplexPublisher, "enterprise-deploy"),
        ] {
            let result =
                run_adapter_inspect_for_profile(fixture_root(), OperationInterface::Test, profile);
            let payload = match result
                .payload()
                .expect("adapter inspect should include payload")
            {
                OperationPayload::AdapterInspection(payload) => payload,
                OperationPayload::StudioAuthoring(_) => {
                    panic!("adapter inspect should not include a studio authoring payload")
                }
            };

            assert_eq!(result.status(), OperationStatus::Warning);
            assert_eq!(result.request().operation_id().as_str(), "adapters.inspect");
            assert_eq!(payload.profile(), profile);
            assert!(
                payload
                    .adapters()
                    .iter()
                    .any(|adapter| adapter.provider_id().as_str() == expected_provider)
            );
            assert!(!payload.capabilities().is_empty());
            assert!(!result.diagnostics().has_blocking());
            assert!(result.warnings().iter().all(
                |diagnostic| diagnostic.code().as_str() == "TPM-ADAPTER-CAPABILITY-UNAVAILABLE"
            ));
        }
    }

    #[test]
    fn adapter_inspect_json_exposes_dry_run_credentials_and_boundaries()
    -> Result<(), Box<dyn Error>> {
        let result = run_adapter_inspect_for_profile(
            fixture_root(),
            OperationInterface::Test,
            AdapterRuntimeProfile::TpmLike,
        );
        let value = serde_json::from_str::<serde_json::Value>(&result.render_json_pretty()?)?;
        let adapters = value["payload"]["data"]["adapters"]
            .as_array()
            .expect("adapter payload should contain adapters");
        let cloudflare = adapters
            .iter()
            .find(|adapter| adapter["providerId"] == "cloudflare-deploy")
            .expect("tpm-like profile should include cloudflare deploy");
        let deploy_publish = cloudflare["capabilities"]
            .as_array()
            .expect("cloudflare adapter should include capabilities")
            .iter()
            .find(|capability| capability["operation"] == "deploy-publish")
            .expect("cloudflare deploy should include publish capability");

        assert_eq!(value["schemaVersion"], OPERATION_SCHEMA_VERSION);
        assert_eq!(cloudflare["boundary"], "bundled");
        assert_eq!(deploy_publish["credentialRequirement"], "required");
        assert_eq!(
            deploy_publish["credentialScopes"],
            serde_json::json!(["deploy-write"])
        );
        assert_eq!(deploy_publish["dryRun"], "supported");
        assert_eq!(deploy_publish["destructiveBehavior"], "publish");
        assert_eq!(deploy_publish["auditRequirement"], "provider");

        Ok(())
    }

    #[test]
    fn adapter_inspect_missing_workspace_is_warning_only() {
        let result = run_adapter_inspect_for_profile(
            PathBuf::from("/tmp/tpm-missing-adapter-workspace"),
            OperationInterface::Test,
            AdapterRuntimeProfile::LocalOnly,
        );

        assert_eq!(result.status(), OperationStatus::Warning);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-ADAPTER-WORKSPACE-UNRESOLVED")
        );
        assert!(!result.diagnostics().has_blocking());
    }

    #[test]
    fn adapter_inspect_reports_resolved_workspace_path_warnings() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("adapter-required-paths");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;

        let result = run_adapter_inspect_for_profile(
            &root,
            OperationInterface::Test,
            AdapterRuntimeProfile::LocalOnly,
        );

        let diagnostic_codes = result
            .diagnostics()
            .diagnostics()
            .iter()
            .map(|diagnostic| diagnostic.code().as_str())
            .collect::<Vec<_>>();

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(diagnostic_codes.contains(&"TPM-WORKSPACE-CONTENT"));
        assert!(diagnostic_codes.contains(&"TPM-WORKSPACE-ASSETS"));
        assert!(diagnostic_codes.contains(&"TPM-WORKSPACE-PUBLIC"));
        assert!(!diagnostic_codes.contains(&"TPM-ADAPTER-WORKSPACE-UNRESOLVED"));

        crate::test_support::remove_test_dir(&root);
        Ok(())
    }

    #[test]
    fn release_inspect_counts_nested_output_artifacts() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("release-output");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        write_file(&root.join("dist/index.html"), "<!doctype html>")?;
        write_file(
            &root.join("dist/articles/example/index.html"),
            "<!doctype html>",
        )?;

        let result = run_release_inspect(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Success);
        assert!(
            result
                .summary()
                .details()
                .iter()
                .any(|detail| detail == "output artifacts: 2")
        );

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[cfg(unix)]
    #[test]
    fn release_inspect_reports_output_permission_failures() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("release-output-failure");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        fs::create_dir_all(root.join("dist/unreadable"))?;
        let original_permissions = make_unreadable(&root.join("dist/unreadable"))?;

        let result = run_release_inspect(&root, OperationInterface::Test);

        fs::set_permissions(root.join("dist/unreadable"), original_permissions)?;
        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-RELEASE-OUTPUT-READ")
        );

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[cfg(unix)]
    #[test]
    fn workspace_status_reports_inventory_permission_failures() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("source-inventory-failure");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        fs::create_dir_all(root.join("site/content/unreadable"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        let original_permissions = make_unreadable(&root.join("site/content/unreadable"))?;

        let result = run_workspace_status(&root, OperationInterface::Test);

        fs::set_permissions(root.join("site/content/unreadable"), original_permissions)?;
        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-WORKSPACE-INVENTORY")
        );

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn operation_display_path_handles_empty_paths() {
        assert_eq!(super::display_path(Path::new("")), ".");
    }

    #[test]
    fn workspace_doctor_reports_missing_workspace() {
        let result = run_workspace_doctor(
            PathBuf::from("/tmp/tpm-missing-doctor-workspace"),
            OperationInterface::Test,
        );

        assert_eq!(result.status(), OperationStatus::Failed);
        assert_eq!(result.request().operation_id().as_str(), "workspace.doctor");
    }
}
