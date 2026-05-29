//! Read-only Model Context Protocol resource and safety contracts for TPM.
//!
//! This crate is transport-agnostic. It models the stable resource, permission,
//! redaction, and response shapes that a future MCP server can expose while
//! reusing the same operation envelopes as the CLI, GUI, CI, and tests.

use std::collections::BTreeSet;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use tpm_core::Severity;
use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticReport};
use tpm_operations::{
    OperationInterface, OperationResult, run_image_asset_verification, run_redirect_report,
    run_release_inspect, run_site_doctor, run_studio_content_editor, run_studio_media_library,
    run_studio_preview_plan, run_studio_publish_apply, run_studio_release_plan,
    run_studio_settings_inspect, run_studio_workflow_verify, run_workspace_status,
};

/// Current schema version for serialized MCP resource responses.
pub const MCP_RESOURCE_SCHEMA_VERSION: u16 = 1;

const REDACTED_VALUE: &str = "<redacted>";
const SECRET_MARKERS: &[&str] = &[
    "api_key",
    "apikey",
    "authorization",
    "bearer ",
    "client_secret",
    "cookie",
    "password",
    "private_key",
    "refresh_token",
    "secret",
    "token",
];

/// Read-only MCP resource kind exposed by the current operation core.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ResourceKind {
    /// Current adapter/provider capability report.
    AdapterCapabilities,
    /// Image media policy and source asset report.
    MediaImages,
    /// Generated-output release inspection report.
    ReleaseInspect,
    /// Route and redirect policy report.
    RoutesRedirects,
    /// Site workspace diagnostics.
    SiteDiagnostics,
    /// Studio content and source-edit plan report.
    StudioContentPlan,
    /// Studio media materialization/change plan report.
    StudioMediaPlan,
    /// Studio preview report over shared operation data.
    StudioPreviewReport,
    /// Studio publish plan and apply-gate report.
    StudioPublishPlan,
    /// Studio release manifest and health report.
    StudioReleasePlan,
    /// Studio settings change plan report.
    StudioSettingsPlan,
    /// Studio authoring/publish workflow verification report.
    StudioWorkflowVerify,
    /// Workspace source-root and source-inventory status.
    WorkspaceStatus,
}

impl ResourceKind {
    /// Returns the stable resource URI.
    #[must_use]
    pub fn uri(self) -> ResourceUri {
        match self {
            Self::AdapterCapabilities => {
                ResourceUri::from_static("tpm://resources/adapter-capabilities")
            }
            Self::MediaImages => ResourceUri::from_static("tpm://resources/media/images"),
            Self::ReleaseInspect => ResourceUri::from_static("tpm://resources/release/inspect"),
            Self::RoutesRedirects => ResourceUri::from_static("tpm://resources/routes/redirects"),
            Self::SiteDiagnostics => ResourceUri::from_static("tpm://resources/site/diagnostics"),
            Self::StudioContentPlan => {
                ResourceUri::from_static("tpm://resources/studio/content-plan")
            }
            Self::StudioMediaPlan => ResourceUri::from_static("tpm://resources/studio/media-plan"),
            Self::StudioPreviewReport => {
                ResourceUri::from_static("tpm://resources/studio/preview-report")
            }
            Self::StudioPublishPlan => {
                ResourceUri::from_static("tpm://resources/studio/publish-plan")
            }
            Self::StudioReleasePlan => {
                ResourceUri::from_static("tpm://resources/studio/release-plan")
            }
            Self::StudioSettingsPlan => {
                ResourceUri::from_static("tpm://resources/studio/settings-plan")
            }
            Self::StudioWorkflowVerify => {
                ResourceUri::from_static("tpm://resources/studio/workflow-verify")
            }
            Self::WorkspaceStatus => ResourceUri::from_static("tpm://resources/workspace/status"),
        }
    }

    /// Returns the human-readable resource name.
    #[must_use]
    pub const fn name(self) -> &'static str {
        match self {
            Self::AdapterCapabilities => "Adapter capabilities",
            Self::MediaImages => "Media images",
            Self::ReleaseInspect => "Release inspection",
            Self::RoutesRedirects => "Route redirects",
            Self::SiteDiagnostics => "Site diagnostics",
            Self::StudioContentPlan => "Studio content plan",
            Self::StudioMediaPlan => "Studio media plan",
            Self::StudioPreviewReport => "Studio preview report",
            Self::StudioPublishPlan => "Studio publish plan",
            Self::StudioReleasePlan => "Studio release plan",
            Self::StudioSettingsPlan => "Studio settings plan",
            Self::StudioWorkflowVerify => "Studio workflow verification",
            Self::WorkspaceStatus => "Workspace status",
        }
    }

    /// Returns a concise resource description for agent catalog display.
    #[must_use]
    pub const fn description(self) -> &'static str {
        match self {
            Self::AdapterCapabilities => {
                "Reports provider capability availability when the runtime exists."
            }
            Self::MediaImages => "Wraps the read-only image asset verification operation.",
            Self::ReleaseInspect => "Wraps the read-only generated-output release inspection.",
            Self::RoutesRedirects => "Wraps the read-only route and redirect report.",
            Self::SiteDiagnostics => "Wraps the read-only site doctor diagnostic operation.",
            Self::StudioContentPlan => "Wraps the Studio content editor source plan.",
            Self::StudioMediaPlan => "Wraps the Studio media materialization plan.",
            Self::StudioPreviewReport => "Wraps the Studio preview plan and parity report.",
            Self::StudioPublishPlan => "Wraps the Studio publish apply gate as a plan report.",
            Self::StudioReleasePlan => "Wraps the Studio release manifest and health report.",
            Self::StudioSettingsPlan => "Wraps the Studio settings inspection and change plan.",
            Self::StudioWorkflowVerify => "Wraps the Studio workflow verification report.",
            Self::WorkspaceStatus => "Wraps the read-only workspace status operation.",
        }
    }

    /// Returns required scopes for reading this resource.
    #[must_use]
    pub fn required_scopes(self) -> Vec<PermissionScope> {
        match self {
            Self::AdapterCapabilities => vec![
                PermissionScope::Inspect,
                PermissionScope::ProviderStatusRead,
            ],
            Self::MediaImages => vec![PermissionScope::Inspect, PermissionScope::MediaRead],
            Self::ReleaseInspect => vec![PermissionScope::Inspect, PermissionScope::ReleaseRead],
            Self::RoutesRedirects => vec![PermissionScope::Inspect, PermissionScope::RoutesRead],
            Self::SiteDiagnostics => {
                vec![PermissionScope::Inspect, PermissionScope::DiagnosticsRead]
            }
            Self::StudioContentPlan | Self::StudioSettingsPlan => vec![
                PermissionScope::Inspect,
                PermissionScope::SourceRead,
                PermissionScope::SourcePropose,
            ],
            Self::StudioMediaPlan => {
                vec![PermissionScope::Inspect, PermissionScope::MediaRead]
            }
            Self::StudioPreviewReport => {
                vec![PermissionScope::Inspect, PermissionScope::PreviewRun]
            }
            Self::StudioPublishPlan | Self::StudioReleasePlan => vec![
                PermissionScope::Inspect,
                PermissionScope::ReleaseRead,
                PermissionScope::ProviderStatusRead,
            ],
            Self::StudioWorkflowVerify => vec![
                PermissionScope::Inspect,
                PermissionScope::DiagnosticsRead,
                PermissionScope::ProviderStatusRead,
            ],
            Self::WorkspaceStatus => vec![PermissionScope::Inspect, PermissionScope::SourceRead],
        }
    }

    const fn safety_class(self) -> ResourceSafetyClass {
        match self {
            Self::AdapterCapabilities
            | Self::MediaImages
            | Self::ReleaseInspect
            | Self::RoutesRedirects
            | Self::SiteDiagnostics
            | Self::WorkspaceStatus => ResourceSafetyClass::ReadOnly,
            Self::StudioContentPlan
            | Self::StudioMediaPlan
            | Self::StudioPreviewReport
            | Self::StudioPublishPlan
            | Self::StudioReleasePlan
            | Self::StudioSettingsPlan
            | Self::StudioWorkflowVerify => ResourceSafetyClass::PlanOnly,
        }
    }

    const fn all() -> [Self; 13] {
        [
            Self::WorkspaceStatus,
            Self::SiteDiagnostics,
            Self::StudioSettingsPlan,
            Self::StudioContentPlan,
            Self::StudioMediaPlan,
            Self::StudioPreviewReport,
            Self::StudioReleasePlan,
            Self::StudioPublishPlan,
            Self::StudioWorkflowVerify,
            Self::ReleaseInspect,
            Self::MediaImages,
            Self::RoutesRedirects,
            Self::AdapterCapabilities,
        ]
    }

    fn operation(self, workspace: PathBuf) -> ResourceOperation {
        match self {
            Self::AdapterCapabilities => ResourceOperation::Unsupported,
            Self::MediaImages => ResourceOperation::Operation(run_image_asset_verification(
                workspace,
                OperationInterface::Mcp,
            )),
            Self::ReleaseInspect => ResourceOperation::Operation(run_release_inspect(
                workspace,
                OperationInterface::Mcp,
            )),
            Self::RoutesRedirects => ResourceOperation::Operation(run_redirect_report(
                workspace,
                OperationInterface::Mcp,
            )),
            Self::SiteDiagnostics => {
                ResourceOperation::Operation(run_site_doctor(workspace, OperationInterface::Mcp))
            }
            Self::StudioContentPlan => ResourceOperation::Operation(run_studio_content_editor(
                workspace,
                OperationInterface::Mcp,
            )),
            Self::StudioMediaPlan => ResourceOperation::Operation(run_studio_media_library(
                workspace,
                OperationInterface::Mcp,
            )),
            Self::StudioPreviewReport => ResourceOperation::Operation(run_studio_preview_plan(
                workspace,
                OperationInterface::Mcp,
            )),
            Self::StudioPublishPlan => ResourceOperation::Operation(run_studio_publish_apply(
                workspace,
                OperationInterface::Mcp,
            )),
            Self::StudioReleasePlan => ResourceOperation::Operation(run_studio_release_plan(
                workspace,
                OperationInterface::Mcp,
            )),
            Self::StudioSettingsPlan => ResourceOperation::Operation(run_studio_settings_inspect(
                workspace,
                OperationInterface::Mcp,
            )),
            Self::StudioWorkflowVerify => ResourceOperation::Operation(run_studio_workflow_verify(
                workspace,
                OperationInterface::Mcp,
            )),
            Self::WorkspaceStatus => ResourceOperation::Operation(run_workspace_status(
                workspace,
                OperationInterface::Mcp,
            )),
        }
    }
}

/// Stable resource URI for MCP resource catalogs.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ResourceUri(String);

impl ResourceUri {
    /// Creates a resource URI from a static, repository-owned value.
    #[must_use]
    pub fn from_static(value: &'static str) -> Self {
        Self(value.to_owned())
    }

    /// Returns the resource URI as a string slice.
    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// MCP tool/resource permission scope.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum PermissionScope {
    /// Administrative access to extension or server-level configuration.
    Admin,
    /// Run build/report planning.
    BuildRun,
    /// Test credential references without exposing secret values.
    CredentialTest,
    /// Run preview or preview-report planning.
    DeployPreview,
    /// Publish deploy output.
    DeployPublish,
    /// Roll back a deploy or published artifact.
    DeployRollback,
    /// Read current diagnostics.
    DiagnosticsRead,
    /// Configure extensions.
    ExtensionConfigure,
    /// Inspect read-only platform state.
    Inspect,
    /// Read media reports.
    MediaRead,
    /// Write media or materialized media references.
    MediaWrite,
    /// Read provider status and capabilities.
    ProviderStatusRead,
    /// Run preview or preview-report planning.
    PreviewRun,
    /// Read release and generated-output reports.
    ReleaseRead,
    /// Read route and redirect reports.
    RoutesRead,
    /// Propose source changes without applying them.
    SourcePropose,
    /// Read source/workspace summaries.
    SourceRead,
    /// Write source files through an approved plan/apply operation.
    SourceWrite,
    /// Transition editorial or publishing workflow state.
    WorkflowTransition,
}

/// Permission set granted to an MCP request.
#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionSet {
    scopes: BTreeSet<PermissionScope>,
}

impl PermissionSet {
    /// Creates a permission set from scope values.
    #[must_use]
    pub fn new(scopes: impl IntoIterator<Item = PermissionScope>) -> Self {
        Self {
            scopes: scopes.into_iter().collect(),
        }
    }

    /// Creates the default read-only permission set.
    #[must_use]
    pub fn read_only() -> Self {
        Self::new([
            PermissionScope::DiagnosticsRead,
            PermissionScope::Inspect,
            PermissionScope::MediaRead,
            PermissionScope::PreviewRun,
            PermissionScope::ProviderStatusRead,
            PermissionScope::ReleaseRead,
            PermissionScope::RoutesRead,
            PermissionScope::SourcePropose,
            PermissionScope::SourceRead,
        ])
    }

    /// Returns whether this set includes the given scope.
    #[must_use]
    pub fn contains(&self, scope: PermissionScope) -> bool {
        self.scopes.contains(&scope)
    }

    /// Returns all granted scopes in deterministic order.
    pub fn scopes(&self) -> impl Iterator<Item = PermissionScope> + '_ {
        self.scopes.iter().copied()
    }

    fn missing(&self, required: &[PermissionScope]) -> Vec<PermissionScope> {
        required
            .iter()
            .copied()
            .filter(|scope| !self.contains(*scope))
            .collect()
    }
}

/// Safety class for the current MCP resource surface.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ResourceSafetyClass {
    /// The resource exposes a dry-run or plan report but performs no writes.
    PlanOnly,
    /// The resource performs no source, provider, credential, or output writes.
    ReadOnly,
}

/// Catalog descriptor for a read-only MCP resource.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceDescriptor {
    kind: ResourceKind,
    uri: ResourceUri,
    name: String,
    description: String,
    mime_type: String,
    required_scopes: Vec<PermissionScope>,
    safety_class: ResourceSafetyClass,
}

impl ResourceDescriptor {
    /// Creates a descriptor for the given resource kind.
    #[must_use]
    pub fn for_kind(kind: ResourceKind) -> Self {
        Self {
            kind,
            uri: kind.uri(),
            name: kind.name().to_owned(),
            description: kind.description().to_owned(),
            mime_type: "application/json".to_owned(),
            required_scopes: kind.required_scopes(),
            safety_class: kind.safety_class(),
        }
    }

    /// Returns the resource kind.
    #[must_use]
    pub const fn kind(&self) -> ResourceKind {
        self.kind
    }

    /// Returns the stable resource URI.
    #[must_use]
    pub const fn uri(&self) -> &ResourceUri {
        &self.uri
    }

    /// Returns required scopes.
    #[must_use]
    pub fn required_scopes(&self) -> &[PermissionScope] {
        &self.required_scopes
    }
}

/// Read-only MCP resource catalog.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceCatalog {
    resources: Vec<ResourceDescriptor>,
}

impl ResourceCatalog {
    /// Creates the default read-only resource catalog.
    #[must_use]
    pub fn read_only() -> Self {
        Self {
            resources: ResourceKind::all()
                .into_iter()
                .map(ResourceDescriptor::for_kind)
                .collect(),
        }
    }

    /// Returns resource descriptors in stable catalog order.
    #[must_use]
    pub fn resources(&self) -> &[ResourceDescriptor] {
        &self.resources
    }
}

/// Request for reading an MCP resource.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceRequest {
    kind: ResourceKind,
    workspace: PathBuf,
    permissions: PermissionSet,
}

impl ResourceRequest {
    /// Creates a read-only resource request.
    #[must_use]
    pub fn new(kind: ResourceKind, workspace: impl Into<PathBuf>) -> Self {
        Self {
            kind,
            workspace: workspace.into(),
            permissions: PermissionSet::read_only(),
        }
    }

    /// Replaces the granted permissions for this request.
    #[must_use]
    pub fn with_permissions(mut self, permissions: PermissionSet) -> Self {
        self.permissions = permissions;
        self
    }

    /// Returns the requested resource kind.
    #[must_use]
    pub const fn kind(&self) -> ResourceKind {
        self.kind
    }

    /// Returns the requested workspace path.
    #[must_use]
    pub const fn workspace(&self) -> &PathBuf {
        &self.workspace
    }
}

/// Top-level status for an MCP resource read.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ResourceStatus {
    /// The resource payload was produced.
    Available,
    /// The resource exists, but the request lacks required permission scopes.
    PermissionDenied,
    /// The resource requires a future platform contract that is not available.
    Unsupported,
}

/// Summary of redaction work applied to an MCP response.
#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RedactionSummary {
    redacted_values: u32,
}

impl RedactionSummary {
    /// Creates a redaction summary.
    #[must_use]
    pub const fn new(redacted_values: u32) -> Self {
        Self { redacted_values }
    }

    /// Returns the number of redacted JSON string values.
    #[must_use]
    pub const fn redacted_values(self) -> u32 {
        self.redacted_values
    }
}

/// MCP audit action recorded by the current read-only safety envelope.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AuditAction {
    /// A read-only MCP resource was read.
    ResourceRead,
    /// A read-only MCP tool was called.
    ToolCall,
}

/// MCP audit outcome recorded by the current read-only safety envelope.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AuditOutcome {
    /// The request completed and returned a payload.
    Completed,
    /// The request was denied before execution because scopes were missing.
    PermissionDenied,
    /// The request targeted a known contract that is not implemented yet.
    Unsupported,
}

impl From<ResourceStatus> for AuditOutcome {
    fn from(status: ResourceStatus) -> Self {
        match status {
            ResourceStatus::Available => Self::Completed,
            ResourceStatus::PermissionDenied => Self::PermissionDenied,
            ResourceStatus::Unsupported => Self::Unsupported,
        }
    }
}

impl From<ToolStatus> for AuditOutcome {
    fn from(status: ToolStatus) -> Self {
        match status {
            ToolStatus::Completed => Self::Completed,
            ToolStatus::PermissionDenied => Self::PermissionDenied,
            ToolStatus::Unsupported => Self::Unsupported,
        }
    }
}

/// Safety class recorded in MCP audit events.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AuditSafetyClass {
    /// The request targeted an apply gate but did not perform a mutation.
    ApplyGate,
    /// The request produced or inspected a dry-run plan without applying it.
    PlanOnly,
    /// The request performed no source, provider, credential, or output writes.
    ReadOnly,
}

impl From<ResourceSafetyClass> for AuditSafetyClass {
    fn from(value: ResourceSafetyClass) -> Self {
        match value {
            ResourceSafetyClass::PlanOnly => Self::PlanOnly,
            ResourceSafetyClass::ReadOnly => Self::ReadOnly,
        }
    }
}

impl From<ToolSafetyClass> for AuditSafetyClass {
    fn from(value: ToolSafetyClass) -> Self {
        match value {
            ToolSafetyClass::ApplyGate => Self::ApplyGate,
            ToolSafetyClass::PlanOnly => Self::PlanOnly,
            ToolSafetyClass::ReadOnly => Self::ReadOnly,
        }
    }
}

/// Credential access recorded in MCP audit events.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AuditCredentialAccess {
    /// The request did not access credential references or secret values.
    None,
    /// The request may expose non-secret credential references, never values.
    ReferenceOnly,
}

/// Mutation class recorded in MCP audit events.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AuditMutation {
    /// The request did not mutate source, providers, credentials, or output.
    None,
    /// The request generated or inspected a plan but did not apply it.
    Planned,
    /// The request targeted a mutation gate and was rejected before mutation.
    Rejected,
}

/// Deterministic MCP audit event for the current read-only safety envelope.
///
/// This is not the final persisted audit log. Identity, timestamps, credential
/// references, plan IDs, and storage-backed audit events belong to later
/// adapter and publish/apply work.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditEvent {
    schema_version: u16,
    action: AuditAction,
    interface: OperationInterface,
    target: String,
    safety_class: AuditSafetyClass,
    outcome: AuditOutcome,
    required_scopes: Vec<PermissionScope>,
    granted_scopes: Vec<PermissionScope>,
    missing_scopes: Vec<PermissionScope>,
    credential_access: AuditCredentialAccess,
    mutation: AuditMutation,
    redaction: RedactionSummary,
}

impl AuditEvent {
    /// Returns the recorded action.
    #[must_use]
    pub const fn action(&self) -> AuditAction {
        self.action
    }

    /// Returns the recorded outcome.
    #[must_use]
    pub const fn outcome(&self) -> AuditOutcome {
        self.outcome
    }

    /// Returns missing permission scopes in deterministic order.
    #[must_use]
    pub fn missing_scopes(&self) -> &[PermissionScope] {
        &self.missing_scopes
    }
}

/// MCP resource response over the shared operation contract.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceResponse {
    schema_version: u16,
    resource: ResourceDescriptor,
    status: ResourceStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    payload: Option<Value>,
    diagnostics: DiagnosticReport,
    redaction: RedactionSummary,
    audit_events: Vec<AuditEvent>,
}

impl ResourceResponse {
    /// Returns the resource status.
    #[must_use]
    pub const fn status(&self) -> ResourceStatus {
        self.status
    }

    /// Returns the optional resource payload.
    #[must_use]
    pub const fn payload(&self) -> Option<&Value> {
        self.payload.as_ref()
    }

    /// Returns diagnostics emitted while reading the resource.
    #[must_use]
    pub const fn diagnostics(&self) -> &DiagnosticReport {
        &self.diagnostics
    }

    /// Returns the redaction summary.
    #[must_use]
    pub const fn redaction(&self) -> RedactionSummary {
        self.redaction
    }

    /// Returns deterministic audit events emitted by this resource read.
    #[must_use]
    pub fn audit_events(&self) -> &[AuditEvent] {
        &self.audit_events
    }
}

/// Reads a resource through the MCP resource contract.
#[must_use]
pub fn read_resource(request: ResourceRequest) -> ResourceResponse {
    let descriptor = ResourceDescriptor::for_kind(request.kind());
    let missing_scopes = request.permissions.missing(descriptor.required_scopes());

    if !missing_scopes.is_empty() {
        return audited_resource_response(
            permission_denied_response(descriptor, &missing_scopes),
            &request.permissions,
            missing_scopes,
        );
    }

    let response = match request.kind().operation(request.workspace) {
        ResourceOperation::Operation(operation) => operation_response(descriptor, &operation),
        ResourceOperation::Unsupported => unsupported_capability_response(descriptor),
    };

    audited_resource_response(response, &request.permissions, Vec::new())
}

/// Read-only MCP tool kind exposed by the current operation core.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ToolKind {
    /// Reject an unsafe media apply request unless the future apply engine exists.
    ApplyMediaChange,
    /// Reject an unsafe publish apply request unless the future apply engine exists.
    ApplyPublish,
    /// Reject an unsafe settings apply request unless the future apply engine exists.
    ApplySettingsChange,
    /// Reject an unsafe source apply request unless the future apply engine exists.
    ApplySourceEdit,
    /// Inspect adapter capability availability.
    AdapterCapabilities,
    /// Inspect current site diagnostics.
    Diagnostics,
    /// Inspect a media materialization/change plan without mutating source.
    MediaChangePlan,
    /// Inspect a provider-neutral publish plan without applying it.
    PublishPlan,
    /// Inspect a Studio preview report without generating new output.
    PreviewReport,
    /// Inspect a Studio release manifest and health report.
    ReleasePlan,
    /// List available read-only MCP resources.
    ResourceCatalog,
    /// Inspect a settings change plan without mutating source.
    SettingsChangePlan,
    /// Inspect workspace status.
    SiteStatus,
    /// Inspect a source edit plan without mutating source.
    SourceEditPlan,
    /// Inspect Studio workflow verification status.
    WorkflowVerify,
}

impl ToolKind {
    /// Returns the stable tool name.
    #[must_use]
    pub const fn name(self) -> &'static str {
        match self {
            Self::ApplyMediaChange => "apply_media_change",
            Self::ApplyPublish => "apply_publish",
            Self::ApplySettingsChange => "apply_settings_change",
            Self::ApplySourceEdit => "apply_source_edit",
            Self::AdapterCapabilities => "adapter_capabilities",
            Self::Diagnostics => "site_diagnostics",
            Self::MediaChangePlan => "media_change_plan",
            Self::PublishPlan => "publish_plan",
            Self::PreviewReport => "preview_report",
            Self::ReleasePlan => "release_plan",
            Self::ResourceCatalog => "resource_catalog",
            Self::SettingsChangePlan => "settings_change_plan",
            Self::SiteStatus => "site_status",
            Self::SourceEditPlan => "source_edit_plan",
            Self::WorkflowVerify => "workflow_verify",
        }
    }

    /// Returns a concise tool description.
    #[must_use]
    pub const fn description(self) -> &'static str {
        match self {
            Self::ApplyMediaChange => {
                "Apply an approved media change plan when mutation support exists."
            }
            Self::ApplyPublish => {
                "Apply an approved publish plan when provider mutation support exists."
            }
            Self::ApplySettingsChange => {
                "Apply an approved settings change plan when mutation support exists."
            }
            Self::ApplySourceEdit => {
                "Apply an approved source edit plan when mutation support exists."
            }
            Self::AdapterCapabilities => {
                "Inspect adapter capability availability when the runtime exists."
            }
            Self::Diagnostics => "Return the current site diagnostic operation resource.",
            Self::MediaChangePlan => "Return the Studio media materialization plan resource.",
            Self::PublishPlan => "Return the Studio publish plan and apply gate resource.",
            Self::PreviewReport => "Return the Studio preview report resource.",
            Self::ReleasePlan => "Return the Studio release plan and health report resource.",
            Self::ResourceCatalog => "List read-only MCP resources and required scopes.",
            Self::SettingsChangePlan => "Return the Studio settings change plan resource.",
            Self::SiteStatus => "Return the current workspace status operation resource.",
            Self::SourceEditPlan => "Return the Studio source edit plan resource.",
            Self::WorkflowVerify => "Return the Studio workflow verification resource.",
        }
    }

    fn required_scopes(self) -> Vec<PermissionScope> {
        match self {
            Self::ApplyMediaChange => vec![PermissionScope::Inspect, PermissionScope::MediaWrite],
            Self::ApplyPublish => vec![PermissionScope::Inspect, PermissionScope::DeployPublish],
            Self::ApplySettingsChange | Self::ApplySourceEdit => {
                vec![PermissionScope::Inspect, PermissionScope::SourceWrite]
            }
            Self::AdapterCapabilities => ResourceKind::AdapterCapabilities.required_scopes(),
            Self::Diagnostics => ResourceKind::SiteDiagnostics.required_scopes(),
            Self::MediaChangePlan => ResourceKind::StudioMediaPlan.required_scopes(),
            Self::PublishPlan => ResourceKind::StudioPublishPlan.required_scopes(),
            Self::PreviewReport => ResourceKind::StudioPreviewReport.required_scopes(),
            Self::ReleasePlan => ResourceKind::StudioReleasePlan.required_scopes(),
            Self::ResourceCatalog => vec![PermissionScope::Inspect],
            Self::SettingsChangePlan => ResourceKind::StudioSettingsPlan.required_scopes(),
            Self::SiteStatus => ResourceKind::WorkspaceStatus.required_scopes(),
            Self::SourceEditPlan => ResourceKind::StudioContentPlan.required_scopes(),
            Self::WorkflowVerify => ResourceKind::StudioWorkflowVerify.required_scopes(),
        }
    }

    const fn safety_class(self) -> ToolSafetyClass {
        match self {
            Self::AdapterCapabilities
            | Self::Diagnostics
            | Self::ResourceCatalog
            | Self::SiteStatus => ToolSafetyClass::ReadOnly,
            Self::MediaChangePlan
            | Self::PublishPlan
            | Self::PreviewReport
            | Self::ReleasePlan
            | Self::SettingsChangePlan
            | Self::SourceEditPlan
            | Self::WorkflowVerify => ToolSafetyClass::PlanOnly,
            Self::ApplyMediaChange
            | Self::ApplyPublish
            | Self::ApplySettingsChange
            | Self::ApplySourceEdit => ToolSafetyClass::ApplyGate,
        }
    }

    const fn all() -> [Self; 15] {
        [
            Self::SiteStatus,
            Self::Diagnostics,
            Self::ResourceCatalog,
            Self::AdapterCapabilities,
            Self::SettingsChangePlan,
            Self::SourceEditPlan,
            Self::MediaChangePlan,
            Self::PreviewReport,
            Self::ReleasePlan,
            Self::PublishPlan,
            Self::WorkflowVerify,
            Self::ApplySettingsChange,
            Self::ApplySourceEdit,
            Self::ApplyMediaChange,
            Self::ApplyPublish,
        ]
    }
}

/// Safety class for the current MCP tool surface.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ToolSafetyClass {
    /// The tool rejects apply requests until the required plan/apply engine exists.
    ApplyGate,
    /// The tool returns a dry-run or plan response and performs no writes.
    PlanOnly,
    /// The tool performs no source, provider, credential, or output writes.
    ReadOnly,
}

/// Catalog descriptor for a read-only MCP tool.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolDescriptor {
    kind: ToolKind,
    name: String,
    description: String,
    required_scopes: Vec<PermissionScope>,
    safety_class: ToolSafetyClass,
}

impl ToolDescriptor {
    /// Creates a descriptor for the given tool kind.
    #[must_use]
    pub fn for_kind(kind: ToolKind) -> Self {
        Self {
            kind,
            name: kind.name().to_owned(),
            description: kind.description().to_owned(),
            required_scopes: kind.required_scopes(),
            safety_class: kind.safety_class(),
        }
    }

    /// Returns the tool kind.
    #[must_use]
    pub const fn kind(&self) -> ToolKind {
        self.kind
    }

    /// Returns the stable tool name.
    #[must_use]
    pub fn name(&self) -> &str {
        &self.name
    }

    /// Returns required scopes.
    #[must_use]
    pub fn required_scopes(&self) -> &[PermissionScope] {
        &self.required_scopes
    }
}

/// Read-only MCP tool catalog.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolCatalog {
    tools: Vec<ToolDescriptor>,
}

impl ToolCatalog {
    /// Creates the default read-only tool catalog.
    #[must_use]
    pub fn read_only() -> Self {
        Self {
            tools: ToolKind::all()
                .into_iter()
                .map(ToolDescriptor::for_kind)
                .collect(),
        }
    }

    /// Returns tool descriptors in stable catalog order.
    #[must_use]
    pub fn tools(&self) -> &[ToolDescriptor] {
        &self.tools
    }
}

/// Request for calling a read-only MCP tool.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolRequest {
    kind: ToolKind,
    workspace: PathBuf,
    permissions: PermissionSet,
}

impl ToolRequest {
    /// Creates a read-only MCP tool request.
    #[must_use]
    pub fn new(kind: ToolKind, workspace: impl Into<PathBuf>) -> Self {
        Self {
            kind,
            workspace: workspace.into(),
            permissions: PermissionSet::read_only(),
        }
    }

    /// Replaces the granted permissions for this request.
    #[must_use]
    pub fn with_permissions(mut self, permissions: PermissionSet) -> Self {
        self.permissions = permissions;
        self
    }

    /// Returns the requested tool kind.
    #[must_use]
    pub const fn kind(&self) -> ToolKind {
        self.kind
    }
}

/// Top-level status for an MCP tool call.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ToolStatus {
    /// The tool returned a result payload.
    Completed,
    /// The tool exists, but the request lacks required permission scopes.
    PermissionDenied,
    /// The tool requires a future platform contract that is not available.
    Unsupported,
}

/// MCP tool response over read-only resource contracts.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolResponse {
    schema_version: u16,
    tool: ToolDescriptor,
    status: ToolStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<Value>,
    diagnostics: DiagnosticReport,
    redaction: RedactionSummary,
    audit_events: Vec<AuditEvent>,
}

impl ToolResponse {
    /// Returns the tool status.
    #[must_use]
    pub const fn status(&self) -> ToolStatus {
        self.status
    }

    /// Returns the optional tool result payload.
    #[must_use]
    pub const fn result(&self) -> Option<&Value> {
        self.result.as_ref()
    }

    /// Returns diagnostics emitted while calling the tool.
    #[must_use]
    pub const fn diagnostics(&self) -> &DiagnosticReport {
        &self.diagnostics
    }

    /// Returns the redaction summary.
    #[must_use]
    pub const fn redaction(&self) -> RedactionSummary {
        self.redaction
    }

    /// Returns deterministic audit events emitted by this tool call.
    #[must_use]
    pub fn audit_events(&self) -> &[AuditEvent] {
        &self.audit_events
    }
}

/// Calls a read-only MCP tool.
#[must_use]
pub fn call_tool(request: &ToolRequest) -> ToolResponse {
    let descriptor = ToolDescriptor::for_kind(request.kind());
    let missing_scopes = request.permissions.missing(descriptor.required_scopes());

    if !missing_scopes.is_empty() {
        return audited_tool_response(
            tool_permission_denied_response(descriptor, &missing_scopes),
            &request.permissions,
            missing_scopes,
        );
    }

    let response = match request.kind() {
        ToolKind::AdapterCapabilities => resource_tool_response(
            descriptor,
            &resource_for_tool(request, ResourceKind::AdapterCapabilities),
        ),
        ToolKind::Diagnostics => resource_tool_response(
            descriptor,
            &resource_for_tool(request, ResourceKind::SiteDiagnostics),
        ),
        ToolKind::MediaChangePlan => resource_tool_response(
            descriptor,
            &resource_for_tool(request, ResourceKind::StudioMediaPlan),
        ),
        ToolKind::PublishPlan => resource_tool_response(
            descriptor,
            &resource_for_tool(request, ResourceKind::StudioPublishPlan),
        ),
        ToolKind::PreviewReport => resource_tool_response(
            descriptor,
            &resource_for_tool(request, ResourceKind::StudioPreviewReport),
        ),
        ToolKind::ReleasePlan => resource_tool_response(
            descriptor,
            &resource_for_tool(request, ResourceKind::StudioReleasePlan),
        ),
        ToolKind::ResourceCatalog => resource_catalog_tool_response(descriptor),
        ToolKind::SettingsChangePlan => resource_tool_response(
            descriptor,
            &resource_for_tool(request, ResourceKind::StudioSettingsPlan),
        ),
        ToolKind::SiteStatus => resource_tool_response(
            descriptor,
            &resource_for_tool(request, ResourceKind::WorkspaceStatus),
        ),
        ToolKind::SourceEditPlan => resource_tool_response(
            descriptor,
            &resource_for_tool(request, ResourceKind::StudioContentPlan),
        ),
        ToolKind::WorkflowVerify => resource_tool_response(
            descriptor,
            &resource_for_tool(request, ResourceKind::StudioWorkflowVerify),
        ),
        ToolKind::ApplyMediaChange => {
            apply_gate_tool_response(descriptor, ApplyToolKind::MediaChange)
        }
        ToolKind::ApplyPublish => apply_gate_tool_response(descriptor, ApplyToolKind::Publish),
        ToolKind::ApplySettingsChange => {
            apply_gate_tool_response(descriptor, ApplyToolKind::SettingsChange)
        }
        ToolKind::ApplySourceEdit => {
            apply_gate_tool_response(descriptor, ApplyToolKind::SourceEdit)
        }
    };

    audited_tool_response(response, &request.permissions, Vec::new())
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum ApplyToolKind {
    MediaChange,
    Publish,
    SettingsChange,
    SourceEdit,
}

impl ApplyToolKind {
    const fn tool_kind(self) -> ToolKind {
        match self {
            Self::MediaChange => ToolKind::ApplyMediaChange,
            Self::Publish => ToolKind::ApplyPublish,
            Self::SettingsChange => ToolKind::ApplySettingsChange,
            Self::SourceEdit => ToolKind::ApplySourceEdit,
        }
    }

    const fn required_plan_tool(self) -> ToolKind {
        match self {
            Self::MediaChange => ToolKind::MediaChangePlan,
            Self::Publish => ToolKind::PublishPlan,
            Self::SettingsChange => ToolKind::SettingsChangePlan,
            Self::SourceEdit => ToolKind::SourceEditPlan,
        }
    }
}

fn apply_gate_tool_response(descriptor: ToolDescriptor, kind: ApplyToolKind) -> ToolResponse {
    let tool_kind = kind.tool_kind();
    let required_plan_tool = kind.required_plan_tool().name();

    ToolResponse {
        schema_version: MCP_RESOURCE_SCHEMA_VERSION,
        tool: descriptor,
        status: ToolStatus::Unsupported,
        result: Some(json!({
            "mutation": "none",
            "requiredPlanTool": required_plan_tool,
            "reason": "MCP apply tools are gated until source/provider mutation operations are implemented.",
        })),
        diagnostics: DiagnosticReport::from_diagnostics(vec![
            Diagnostic::new(
                diagnostic_code("TPM-MCP-APPLY-GATE-UNAVAILABLE"),
                Severity::Error,
                format!(
                    "MCP apply tool '{}' is not available because the shared plan/apply mutation engine is not implemented.",
                    tool_kind.name()
                ),
            )
            .with_remediation(format!(
                "Use '{required_plan_tool}' to inspect the plan. Apply support must be implemented in the shared operation core before this MCP tool can mutate source files or providers."
            )),
        ]),
        redaction: RedactionSummary::default(),
        audit_events: Vec::new(),
    }
}

fn resource_for_tool(request: &ToolRequest, kind: ResourceKind) -> ResourceResponse {
    read_resource(
        ResourceRequest::new(kind, request.workspace.clone())
            .with_permissions(request.permissions.clone()),
    )
}

fn resource_tool_response(
    descriptor: ToolDescriptor,
    resource_response: &ResourceResponse,
) -> ToolResponse {
    let status = match resource_response.status() {
        ResourceStatus::Available => ToolStatus::Completed,
        ResourceStatus::PermissionDenied => ToolStatus::PermissionDenied,
        ResourceStatus::Unsupported => ToolStatus::Unsupported,
    };
    let redaction = resource_response.redaction();
    let diagnostics = resource_response.diagnostics().clone();

    ToolResponse {
        schema_version: MCP_RESOURCE_SCHEMA_VERSION,
        tool: descriptor,
        status,
        result: Some(json!({ "resource": resource_response })),
        diagnostics,
        redaction,
        audit_events: Vec::new(),
    }
}

fn resource_catalog_tool_response(descriptor: ToolDescriptor) -> ToolResponse {
    ToolResponse {
        schema_version: MCP_RESOURCE_SCHEMA_VERSION,
        tool: descriptor,
        status: ToolStatus::Completed,
        result: Some(json!({ "resources": ResourceCatalog::read_only().resources() })),
        diagnostics: DiagnosticReport::new(),
        redaction: RedactionSummary::default(),
        audit_events: Vec::new(),
    }
}

fn tool_permission_denied_response(
    descriptor: ToolDescriptor,
    missing_scopes: &[PermissionScope],
) -> ToolResponse {
    let missing = missing_scopes
        .iter()
        .copied()
        .map(scope_label)
        .collect::<Vec<_>>()
        .join(", ");

    ToolResponse {
        schema_version: MCP_RESOURCE_SCHEMA_VERSION,
        tool: descriptor,
        status: ToolStatus::PermissionDenied,
        result: None,
        diagnostics: DiagnosticReport::from_diagnostics(vec![
            Diagnostic::new(
                diagnostic_code("TPM-MCP-TOOL-PERMISSION-DENIED"),
                Severity::Error,
                format!("MCP tool request is missing required scope(s): {missing}."),
            )
            .with_remediation(
                "Grant the required read-only MCP scope or choose a tool allowed by the current scope set.",
            ),
        ]),
        redaction: RedactionSummary::default(),
        audit_events: Vec::new(),
    }
}

enum ResourceOperation {
    Operation(OperationResult),
    Unsupported,
}

fn operation_response(
    descriptor: ResourceDescriptor,
    operation: &OperationResult,
) -> ResourceResponse {
    match serde_json::to_value(operation) {
        Ok(mut operation_json) => {
            let redacted_values = redact_json(&mut operation_json);
            let diagnostics = operation.diagnostics().clone();

            ResourceResponse {
                schema_version: MCP_RESOURCE_SCHEMA_VERSION,
                resource: descriptor,
                status: ResourceStatus::Available,
                payload: Some(json!({ "operationResult": operation_json })),
                diagnostics,
                redaction: RedactionSummary::new(redacted_values),
                audit_events: Vec::new(),
            }
        }
        Err(error) => ResourceResponse {
            schema_version: MCP_RESOURCE_SCHEMA_VERSION,
            resource: descriptor,
            status: ResourceStatus::Unsupported,
            payload: None,
            diagnostics: DiagnosticReport::from_diagnostics(vec![
                Diagnostic::new(
                    diagnostic_code("TPM-MCP-RESOURCE-SERIALIZE"),
                    Severity::Error,
                    format!("Could not serialize operation result for MCP resource: {error}."),
                )
                .with_remediation("Report this as a platform operation serialization bug."),
            ]),
            redaction: RedactionSummary::default(),
            audit_events: Vec::new(),
        },
    }
}

fn permission_denied_response(
    descriptor: ResourceDescriptor,
    missing_scopes: &[PermissionScope],
) -> ResourceResponse {
    let missing = missing_scopes
        .iter()
        .copied()
        .map(scope_label)
        .collect::<Vec<_>>()
        .join(", ");

    ResourceResponse {
        schema_version: MCP_RESOURCE_SCHEMA_VERSION,
        resource: descriptor,
        status: ResourceStatus::PermissionDenied,
        payload: None,
        diagnostics: DiagnosticReport::from_diagnostics(vec![
            Diagnostic::new(
                diagnostic_code("TPM-MCP-PERMISSION-DENIED"),
                Severity::Error,
                format!("MCP resource request is missing required scope(s): {missing}."),
            )
            .with_remediation(
                "Grant the required read-only MCP scope or choose a resource allowed by the current scope set.",
            ),
        ]),
        redaction: RedactionSummary::default(),
        audit_events: Vec::new(),
    }
}

fn unsupported_capability_response(descriptor: ResourceDescriptor) -> ResourceResponse {
    ResourceResponse {
        schema_version: MCP_RESOURCE_SCHEMA_VERSION,
        resource: descriptor,
        status: ResourceStatus::Unsupported,
        payload: None,
        diagnostics: DiagnosticReport::from_diagnostics(vec![
            Diagnostic::new(
                diagnostic_code("TPM-MCP-CAPABILITY-REGISTRY-MISSING"),
                Severity::Warning,
                "Adapter capability resources require the Milestone 10 capability registry.",
            )
            .with_remediation(
                "Use concrete read-only operation resources now; retry adapter capability inspection after the provider capability runtime lands.",
            ),
        ]),
        redaction: RedactionSummary::default(),
        audit_events: Vec::new(),
    }
}

fn audited_resource_response(
    mut response: ResourceResponse,
    permissions: &PermissionSet,
    missing_scopes: Vec<PermissionScope>,
) -> ResourceResponse {
    response.audit_events = vec![AuditEvent {
        schema_version: MCP_RESOURCE_SCHEMA_VERSION,
        action: AuditAction::ResourceRead,
        interface: OperationInterface::Mcp,
        target: response.resource.uri().as_str().to_owned(),
        safety_class: AuditSafetyClass::from(response.resource.safety_class),
        outcome: AuditOutcome::from(response.status()),
        required_scopes: response.resource.required_scopes().to_vec(),
        granted_scopes: permissions.scopes().collect(),
        missing_scopes,
        credential_access: credential_access_for_resource(response.resource.kind()),
        mutation: mutation_for_resource(response.resource.kind()),
        redaction: response.redaction(),
    }];

    response
}

fn audited_tool_response(
    mut response: ToolResponse,
    permissions: &PermissionSet,
    missing_scopes: Vec<PermissionScope>,
) -> ToolResponse {
    response.audit_events = vec![AuditEvent {
        schema_version: MCP_RESOURCE_SCHEMA_VERSION,
        action: AuditAction::ToolCall,
        interface: OperationInterface::Mcp,
        target: response.tool.name().to_owned(),
        safety_class: AuditSafetyClass::from(response.tool.safety_class),
        outcome: AuditOutcome::from(response.status()),
        required_scopes: response.tool.required_scopes().to_vec(),
        granted_scopes: permissions.scopes().collect(),
        missing_scopes,
        credential_access: credential_access_for_tool(response.tool.kind()),
        mutation: mutation_for_tool(response.tool.kind()),
        redaction: response.redaction,
    }];

    response
}

const fn credential_access_for_resource(kind: ResourceKind) -> AuditCredentialAccess {
    match kind {
        ResourceKind::StudioContentPlan
        | ResourceKind::StudioMediaPlan
        | ResourceKind::StudioPreviewReport
        | ResourceKind::StudioPublishPlan
        | ResourceKind::StudioReleasePlan
        | ResourceKind::StudioSettingsPlan
        | ResourceKind::StudioWorkflowVerify => AuditCredentialAccess::ReferenceOnly,
        ResourceKind::AdapterCapabilities
        | ResourceKind::MediaImages
        | ResourceKind::ReleaseInspect
        | ResourceKind::RoutesRedirects
        | ResourceKind::SiteDiagnostics
        | ResourceKind::WorkspaceStatus => AuditCredentialAccess::None,
    }
}

const fn credential_access_for_tool(kind: ToolKind) -> AuditCredentialAccess {
    match kind {
        ToolKind::ApplyPublish
        | ToolKind::MediaChangePlan
        | ToolKind::PublishPlan
        | ToolKind::PreviewReport
        | ToolKind::ReleasePlan
        | ToolKind::SettingsChangePlan
        | ToolKind::SourceEditPlan
        | ToolKind::WorkflowVerify => AuditCredentialAccess::ReferenceOnly,
        ToolKind::ApplyMediaChange
        | ToolKind::ApplySettingsChange
        | ToolKind::ApplySourceEdit
        | ToolKind::AdapterCapabilities
        | ToolKind::Diagnostics
        | ToolKind::ResourceCatalog
        | ToolKind::SiteStatus => AuditCredentialAccess::None,
    }
}

const fn mutation_for_resource(kind: ResourceKind) -> AuditMutation {
    match kind.safety_class() {
        ResourceSafetyClass::PlanOnly => AuditMutation::Planned,
        ResourceSafetyClass::ReadOnly => AuditMutation::None,
    }
}

const fn mutation_for_tool(kind: ToolKind) -> AuditMutation {
    match kind.safety_class() {
        ToolSafetyClass::ApplyGate => AuditMutation::Rejected,
        ToolSafetyClass::PlanOnly => AuditMutation::Planned,
        ToolSafetyClass::ReadOnly => AuditMutation::None,
    }
}

fn redact_json(value: &mut Value) -> u32 {
    match value {
        Value::Array(items) => items.iter_mut().map(redact_json).sum(),
        Value::Object(entries) => entries.values_mut().map(redact_json).sum(),
        Value::String(text) if should_redact(text) => {
            REDACTED_VALUE.clone_into(text);
            1
        }
        Value::Null | Value::Bool(_) | Value::Number(_) | Value::String(_) => 0,
    }
}

fn should_redact(value: &str) -> bool {
    let lower = value.to_ascii_lowercase();
    let has_marker = SECRET_MARKERS.iter().any(|marker| lower.contains(marker));
    let has_value_shape = value.contains('=') || value.contains(':') || lower.contains("bearer ");

    has_marker && has_value_shape
}

const fn scope_label(scope: PermissionScope) -> &'static str {
    match scope {
        PermissionScope::Admin => "admin",
        PermissionScope::BuildRun => "build.run",
        PermissionScope::CredentialTest => "credential.test",
        PermissionScope::DeployPreview => "deploy.preview",
        PermissionScope::DeployPublish => "deploy.publish",
        PermissionScope::DeployRollback => "deploy.rollback",
        PermissionScope::DiagnosticsRead => "diagnostics.read",
        PermissionScope::ExtensionConfigure => "extension.configure",
        PermissionScope::Inspect => "inspect",
        PermissionScope::MediaRead => "media.read",
        PermissionScope::MediaWrite => "media.write",
        PermissionScope::PreviewRun => "preview.run",
        PermissionScope::ProviderStatusRead => "provider.status.read",
        PermissionScope::ReleaseRead => "release.read",
        PermissionScope::RoutesRead => "routes.read",
        PermissionScope::SourcePropose => "source.propose",
        PermissionScope::SourceRead => "source.read",
        PermissionScope::SourceWrite => "source.write",
        PermissionScope::WorkflowTransition => "workflow.transition",
    }
}

#[expect(
    clippy::expect_used,
    reason = "MCP diagnostic codes are static repository invariants"
)]
fn diagnostic_code(value: &'static str) -> DiagnosticCode {
    DiagnosticCode::parse(value).expect("MCP diagnostic code should be valid")
}

#[cfg(test)]
mod tests {
    #![expect(
        clippy::expect_used,
        reason = "tests use static JSON pointers and fixture paths whose presence is the test precondition"
    )]

    use std::path::PathBuf;

    use serde_json::json;
    use tpm_operations::{
        OperationInterface, run_studio_preview_plan, run_studio_publish_apply,
        run_studio_release_plan,
    };

    use super::{
        AuditAction, AuditOutcome, PermissionScope, PermissionSet, ResourceCatalog, ResourceKind,
        ResourceRequest, ResourceStatus, ToolCatalog, ToolKind, ToolRequest, ToolStatus, call_tool,
        read_resource, redact_json,
    };

    fn fixture_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .join("tests/fixtures/rust-workspace")
    }

    #[test]
    fn read_only_catalog_lists_stable_resources() {
        let catalog = ResourceCatalog::read_only();
        let kinds = catalog
            .resources()
            .iter()
            .map(super::ResourceDescriptor::kind)
            .collect::<Vec<_>>();

        assert_eq!(
            kinds,
            vec![
                ResourceKind::WorkspaceStatus,
                ResourceKind::SiteDiagnostics,
                ResourceKind::StudioSettingsPlan,
                ResourceKind::StudioContentPlan,
                ResourceKind::StudioMediaPlan,
                ResourceKind::StudioPreviewReport,
                ResourceKind::StudioReleasePlan,
                ResourceKind::StudioPublishPlan,
                ResourceKind::StudioWorkflowVerify,
                ResourceKind::ReleaseInspect,
                ResourceKind::MediaImages,
                ResourceKind::RoutesRedirects,
                ResourceKind::AdapterCapabilities,
            ]
        );
        assert_eq!(
            catalog.resources()[0].uri().as_str(),
            "tpm://resources/workspace/status"
        );
    }

    #[test]
    fn read_only_tool_catalog_lists_stable_tools() {
        let catalog = ToolCatalog::read_only();
        let kinds = catalog
            .tools()
            .iter()
            .map(super::ToolDescriptor::kind)
            .collect::<Vec<_>>();

        assert_eq!(
            kinds,
            vec![
                ToolKind::SiteStatus,
                ToolKind::Diagnostics,
                ToolKind::ResourceCatalog,
                ToolKind::AdapterCapabilities,
                ToolKind::SettingsChangePlan,
                ToolKind::SourceEditPlan,
                ToolKind::MediaChangePlan,
                ToolKind::PreviewReport,
                ToolKind::ReleasePlan,
                ToolKind::PublishPlan,
                ToolKind::WorkflowVerify,
                ToolKind::ApplySettingsChange,
                ToolKind::ApplySourceEdit,
                ToolKind::ApplyMediaChange,
                ToolKind::ApplyPublish,
            ]
        );
        assert_eq!(catalog.tools()[0].name(), "site_status");
    }

    #[test]
    fn workspace_status_resource_wraps_operation_result() {
        let response = read_resource(ResourceRequest::new(
            ResourceKind::WorkspaceStatus,
            fixture_root(),
        ));

        assert_eq!(response.status(), ResourceStatus::Available);
        assert!(response.diagnostics().diagnostics().is_empty());

        let payload = response.payload().expect("payload should be present");
        assert_eq!(
            payload.pointer("/operationResult/request/operationId"),
            Some(&json!("workspace.status"))
        );
        assert_eq!(
            payload.pointer("/operationResult/request/interface"),
            Some(&json!("mcp"))
        );
        assert_eq!(response.audit_events().len(), 1);
        assert_eq!(
            response.audit_events()[0].action(),
            AuditAction::ResourceRead
        );
        assert_eq!(
            response.audit_events()[0].outcome(),
            AuditOutcome::Completed
        );
    }

    #[test]
    fn concrete_resources_wrap_their_operation_results() {
        let workspace = fixture_root();
        let cases = [
            (ResourceKind::SiteDiagnostics, "site.doctor"),
            (ResourceKind::ReleaseInspect, "release.inspect"),
            (ResourceKind::MediaImages, "media.images"),
            (ResourceKind::RoutesRedirects, "routes.redirects"),
        ];

        for (kind, operation_id) in cases {
            let request = ResourceRequest::new(kind, workspace.clone());
            assert_eq!(request.workspace(), &workspace);

            let response = read_resource(request);

            assert_eq!(response.status(), ResourceStatus::Available);
            assert_eq!(response.redaction().redacted_values(), 0);

            let payload = response.payload().expect("payload should be present");
            assert_eq!(
                payload.pointer("/operationResult/request/operationId"),
                Some(&json!(operation_id))
            );
            assert_eq!(
                payload.pointer("/operationResult/request/interface"),
                Some(&json!("mcp"))
            );
            assert_eq!(
                response.audit_events()[0].outcome(),
                AuditOutcome::Completed
            );
        }
    }

    #[test]
    fn studio_plan_resources_wrap_operation_results() {
        let workspace = fixture_root();
        let cases = [
            (ResourceKind::StudioSettingsPlan, "studio.settings.inspect"),
            (ResourceKind::StudioContentPlan, "studio.content.editor"),
            (ResourceKind::StudioMediaPlan, "studio.media.library"),
            (ResourceKind::StudioPreviewReport, "studio.preview.plan"),
            (ResourceKind::StudioReleasePlan, "studio.release.plan"),
            (ResourceKind::StudioPublishPlan, "studio.publish.apply"),
            (ResourceKind::StudioWorkflowVerify, "studio.workflow.verify"),
        ];

        for (kind, operation_id) in cases {
            let response = read_resource(ResourceRequest::new(kind, workspace.clone()));

            assert_eq!(response.status(), ResourceStatus::Available);
            assert_eq!(response.redaction().redacted_values(), 0);

            let payload = response.payload().expect("payload should be present");
            assert_eq!(
                payload.pointer("/operationResult/request/operationId"),
                Some(&json!(operation_id))
            );
            assert_eq!(
                payload.pointer("/operationResult/request/interface"),
                Some(&json!("mcp"))
            );
            assert_eq!(
                payload.pointer("/operationResult/payload/kind"),
                Some(&json!("studio-authoring"))
            );

            let audit = serde_json::to_value(&response.audit_events()[0])
                .expect("audit event should serialize");
            assert_eq!(audit.pointer("/safetyClass"), Some(&json!("plan-only")));
            assert_eq!(
                audit.pointer("/credentialAccess"),
                Some(&json!("reference-only"))
            );
            assert_eq!(audit.pointer("/mutation"), Some(&json!("planned")));
        }
    }

    #[test]
    fn site_status_tool_wraps_workspace_status_resource() {
        let response = call_tool(&ToolRequest::new(ToolKind::SiteStatus, fixture_root()));

        assert_eq!(response.status(), ToolStatus::Completed);
        assert!(response.diagnostics().diagnostics().is_empty());

        let result = response.result().expect("tool result should be present");
        assert_eq!(
            result.pointer("/resource/resource/kind"),
            Some(&json!("workspace-status"))
        );
        assert_eq!(
            result.pointer("/resource/payload/operationResult/request/interface"),
            Some(&json!("mcp"))
        );
        assert_eq!(response.audit_events().len(), 1);
        assert_eq!(response.audit_events()[0].action(), AuditAction::ToolCall);
        assert_eq!(
            response.audit_events()[0].outcome(),
            AuditOutcome::Completed
        );
    }

    #[test]
    fn diagnostics_tool_wraps_site_diagnostic_resource() {
        let response = call_tool(&ToolRequest::new(ToolKind::Diagnostics, fixture_root()));

        assert_eq!(response.status(), ToolStatus::Completed);
        assert_eq!(response.redaction().redacted_values(), 0);

        let result = response.result().expect("tool result should be present");
        assert_eq!(
            result.pointer("/resource/resource/kind"),
            Some(&json!("site-diagnostics"))
        );
        assert_eq!(
            result.pointer("/resource/payload/operationResult/request/operationId"),
            Some(&json!("site.doctor"))
        );
    }

    #[test]
    fn resource_catalog_tool_returns_resource_descriptors() {
        let response = call_tool(&ToolRequest::new(ToolKind::ResourceCatalog, fixture_root()));

        assert_eq!(response.status(), ToolStatus::Completed);

        let result = response.result().expect("tool result should be present");
        assert_eq!(
            result.pointer("/resources/0/uri"),
            Some(&json!("tpm://resources/workspace/status"))
        );
        assert_eq!(
            result.pointer("/resources/12/kind"),
            Some(&json!("adapter-capabilities"))
        );
    }

    #[test]
    fn studio_report_tools_wrap_plan_resources() {
        let workspace = fixture_root();
        let cases = [
            (
                ToolKind::SettingsChangePlan,
                "studio-settings-plan",
                "studio.settings.inspect",
            ),
            (
                ToolKind::SourceEditPlan,
                "studio-content-plan",
                "studio.content.editor",
            ),
            (
                ToolKind::MediaChangePlan,
                "studio-media-plan",
                "studio.media.library",
            ),
            (
                ToolKind::PreviewReport,
                "studio-preview-report",
                "studio.preview.plan",
            ),
            (
                ToolKind::ReleasePlan,
                "studio-release-plan",
                "studio.release.plan",
            ),
            (
                ToolKind::PublishPlan,
                "studio-publish-plan",
                "studio.publish.apply",
            ),
            (
                ToolKind::WorkflowVerify,
                "studio-workflow-verify",
                "studio.workflow.verify",
            ),
        ];

        for (kind, resource_kind, operation_id) in cases {
            let response = call_tool(&ToolRequest::new(kind, workspace.clone()));

            assert_eq!(response.status(), ToolStatus::Completed);

            let result = response.result().expect("tool result should be present");
            assert_eq!(
                result.pointer("/resource/resource/kind"),
                Some(&json!(resource_kind))
            );
            assert_eq!(
                result.pointer("/resource/payload/operationResult/request/operationId"),
                Some(&json!(operation_id))
            );
            assert_eq!(
                result.pointer("/resource/payload/operationResult/request/interface"),
                Some(&json!("mcp"))
            );

            let audit = serde_json::to_value(&response.audit_events()[0])
                .expect("audit event should serialize");
            assert_eq!(audit.pointer("/safetyClass"), Some(&json!("plan-only")));
            assert_eq!(audit.pointer("/mutation"), Some(&json!("planned")));
        }
    }

    #[test]
    fn studio_report_resources_match_shared_operation_results_exactly() {
        let workspace = fixture_root();
        let cases = [
            (
                ResourceKind::StudioPreviewReport,
                run_studio_preview_plan(workspace.clone(), OperationInterface::Mcp),
            ),
            (
                ResourceKind::StudioReleasePlan,
                run_studio_release_plan(workspace.clone(), OperationInterface::Mcp),
            ),
            (
                ResourceKind::StudioPublishPlan,
                run_studio_publish_apply(workspace.clone(), OperationInterface::Mcp),
            ),
        ];

        for (kind, operation) in cases {
            let response = read_resource(ResourceRequest::new(kind, workspace.clone()));
            let expected = serde_json::to_value(operation).expect("operation should serialize");
            let payload = response.payload().expect("payload should be present");

            assert_eq!(payload.pointer("/operationResult"), Some(&expected));
        }
    }

    #[test]
    fn publish_plan_tool_exposes_redacted_credential_references_only() {
        let response = call_tool(&ToolRequest::new(ToolKind::PublishPlan, fixture_root()));

        assert_eq!(response.status(), ToolStatus::Completed);
        assert_eq!(response.redaction().redacted_values(), 0);

        let serialized = serde_json::to_string(&response).expect("response should serialize");

        assert!(serialized.contains("[redacted]"));
        assert!(!serialized.contains("desktop-keychain-cloudflare-publish-handle"));
        assert!(!serialized.contains("token="));
        assert!(!serialized.contains("api_key="));
    }

    #[test]
    fn resource_request_denies_missing_scope() {
        let response = read_resource(
            ResourceRequest::new(ResourceKind::WorkspaceStatus, fixture_root())
                .with_permissions(PermissionSet::new([PermissionScope::Inspect])),
        );

        assert_eq!(response.status(), ResourceStatus::PermissionDenied);
        assert_eq!(
            response.diagnostics().errors()[0].code().as_str(),
            "TPM-MCP-PERMISSION-DENIED"
        );
        assert!(response.payload().is_none());
        assert_eq!(
            response.audit_events()[0].outcome(),
            AuditOutcome::PermissionDenied
        );
        assert_eq!(
            response.audit_events()[0].missing_scopes(),
            &[PermissionScope::SourceRead]
        );
    }

    #[test]
    fn resource_permission_denials_name_all_read_only_scope_labels() {
        let cases = [
            (
                ResourceKind::WorkspaceStatus,
                &["inspect", "source.read"][..],
            ),
            (
                ResourceKind::SiteDiagnostics,
                &["inspect", "diagnostics.read"][..],
            ),
            (
                ResourceKind::ReleaseInspect,
                &["inspect", "release.read"][..],
            ),
            (ResourceKind::MediaImages, &["inspect", "media.read"][..]),
            (
                ResourceKind::RoutesRedirects,
                &["inspect", "routes.read"][..],
            ),
            (
                ResourceKind::AdapterCapabilities,
                &["inspect", "provider.status.read"][..],
            ),
            (
                ResourceKind::StudioSettingsPlan,
                &["inspect", "source.read", "source.propose"][..],
            ),
            (
                ResourceKind::StudioContentPlan,
                &["inspect", "source.read", "source.propose"][..],
            ),
            (
                ResourceKind::StudioMediaPlan,
                &["inspect", "media.read"][..],
            ),
            (
                ResourceKind::StudioPreviewReport,
                &["inspect", "preview.run"][..],
            ),
            (
                ResourceKind::StudioReleasePlan,
                &["inspect", "release.read", "provider.status.read"][..],
            ),
            (
                ResourceKind::StudioPublishPlan,
                &["inspect", "release.read", "provider.status.read"][..],
            ),
            (
                ResourceKind::StudioWorkflowVerify,
                &["inspect", "diagnostics.read", "provider.status.read"][..],
            ),
        ];

        for (kind, labels) in cases {
            let response = read_resource(
                ResourceRequest::new(kind, fixture_root())
                    .with_permissions(PermissionSet::default()),
            );

            assert_eq!(response.status(), ResourceStatus::PermissionDenied);
            let message = response.diagnostics().errors()[0].message();
            for label in labels {
                assert!(
                    message.contains(label),
                    "missing scope label {label} in {message}"
                );
            }
        }
    }

    #[test]
    fn tool_request_denies_missing_scope() {
        let response = call_tool(
            &ToolRequest::new(ToolKind::SiteStatus, fixture_root())
                .with_permissions(PermissionSet::new([PermissionScope::Inspect])),
        );

        assert_eq!(response.status(), ToolStatus::PermissionDenied);
        assert_eq!(
            response.diagnostics().errors()[0].code().as_str(),
            "TPM-MCP-TOOL-PERMISSION-DENIED"
        );
        assert!(response.result().is_none());
        assert_eq!(
            response.audit_events()[0].outcome(),
            AuditOutcome::PermissionDenied
        );
        assert_eq!(
            response.audit_events()[0].missing_scopes(),
            &[PermissionScope::SourceRead]
        );
    }

    #[test]
    fn permission_scope_labels_cover_all_modeled_scopes() {
        let cases = [
            (PermissionScope::Admin, "admin"),
            (PermissionScope::BuildRun, "build.run"),
            (PermissionScope::CredentialTest, "credential.test"),
            (PermissionScope::DeployPreview, "deploy.preview"),
            (PermissionScope::DeployPublish, "deploy.publish"),
            (PermissionScope::DeployRollback, "deploy.rollback"),
            (PermissionScope::DiagnosticsRead, "diagnostics.read"),
            (PermissionScope::ExtensionConfigure, "extension.configure"),
            (PermissionScope::Inspect, "inspect"),
            (PermissionScope::MediaRead, "media.read"),
            (PermissionScope::MediaWrite, "media.write"),
            (PermissionScope::PreviewRun, "preview.run"),
            (PermissionScope::ProviderStatusRead, "provider.status.read"),
            (PermissionScope::ReleaseRead, "release.read"),
            (PermissionScope::RoutesRead, "routes.read"),
            (PermissionScope::SourcePropose, "source.propose"),
            (PermissionScope::SourceRead, "source.read"),
            (PermissionScope::SourceWrite, "source.write"),
            (PermissionScope::WorkflowTransition, "workflow.transition"),
        ];

        for (scope, label) in cases {
            assert_eq!(super::scope_label(scope), label);
        }
    }

    #[test]
    fn resource_tool_response_preserves_resource_permission_denials() {
        let tool_descriptor = super::ToolDescriptor::for_kind(ToolKind::SiteStatus);
        let resource_descriptor =
            super::ResourceDescriptor::for_kind(ResourceKind::WorkspaceStatus);
        let denied_resource =
            super::permission_denied_response(resource_descriptor, &[PermissionScope::SourceRead]);

        let response = super::resource_tool_response(tool_descriptor, &denied_resource);

        assert_eq!(response.status(), ToolStatus::PermissionDenied);
        assert_eq!(
            response.diagnostics().errors()[0].code().as_str(),
            "TPM-MCP-PERMISSION-DENIED"
        );
    }

    #[test]
    fn apply_tools_require_write_or_publish_scopes_before_reaching_gate() {
        let cases = [
            (ToolKind::ApplySettingsChange, PermissionScope::SourceWrite),
            (ToolKind::ApplySourceEdit, PermissionScope::SourceWrite),
            (ToolKind::ApplyMediaChange, PermissionScope::MediaWrite),
            (ToolKind::ApplyPublish, PermissionScope::DeployPublish),
        ];

        for (kind, missing_scope) in cases {
            let response = call_tool(&ToolRequest::new(kind, fixture_root()));

            assert_eq!(response.status(), ToolStatus::PermissionDenied);
            assert!(response.result().is_none());
            assert_eq!(
                response.audit_events()[0].outcome(),
                AuditOutcome::PermissionDenied
            );
            assert_eq!(
                response.audit_events()[0].missing_scopes(),
                &[missing_scope]
            );

            let audit = serde_json::to_value(&response.audit_events()[0])
                .expect("audit event should serialize");
            assert_eq!(audit.pointer("/safetyClass"), Some(&json!("apply-gate")));
            assert_eq!(audit.pointer("/mutation"), Some(&json!("rejected")));
        }
    }

    #[test]
    fn apply_tools_remain_unsupported_after_permission_until_core_mutations_exist() {
        let cases = [
            (
                ToolKind::ApplySettingsChange,
                PermissionScope::SourceWrite,
                "settings_change_plan",
            ),
            (
                ToolKind::ApplySourceEdit,
                PermissionScope::SourceWrite,
                "source_edit_plan",
            ),
            (
                ToolKind::ApplyMediaChange,
                PermissionScope::MediaWrite,
                "media_change_plan",
            ),
            (
                ToolKind::ApplyPublish,
                PermissionScope::DeployPublish,
                "publish_plan",
            ),
        ];

        for (kind, apply_scope, plan_tool) in cases {
            let response = call_tool(
                &ToolRequest::new(kind, fixture_root())
                    .with_permissions(PermissionSet::new([PermissionScope::Inspect, apply_scope])),
            );

            assert_eq!(response.status(), ToolStatus::Unsupported);
            assert_eq!(
                response.diagnostics().errors()[0].code().as_str(),
                "TPM-MCP-APPLY-GATE-UNAVAILABLE"
            );

            let result = response
                .result()
                .expect("unsupported gate explains next step");
            assert_eq!(result.pointer("/mutation"), Some(&json!("none")));
            assert_eq!(result.pointer("/requiredPlanTool"), Some(&json!(plan_tool)));

            let audit = serde_json::to_value(&response.audit_events()[0])
                .expect("audit event should serialize");
            assert_eq!(audit.pointer("/outcome"), Some(&json!("unsupported")));
            assert_eq!(audit.pointer("/safetyClass"), Some(&json!("apply-gate")));
            assert_eq!(audit.pointer("/mutation"), Some(&json!("rejected")));
        }
    }

    #[test]
    fn adapter_capability_resource_reports_missing_runtime() {
        let response = read_resource(ResourceRequest::new(
            ResourceKind::AdapterCapabilities,
            fixture_root(),
        ));

        assert_eq!(response.status(), ResourceStatus::Unsupported);
        assert_eq!(
            response.diagnostics().warnings()[0].code().as_str(),
            "TPM-MCP-CAPABILITY-REGISTRY-MISSING"
        );
    }

    #[test]
    fn adapter_capability_tool_reports_missing_runtime() {
        let response = call_tool(&ToolRequest::new(
            ToolKind::AdapterCapabilities,
            fixture_root(),
        ));

        assert_eq!(response.status(), ToolStatus::Unsupported);
        assert_eq!(
            response.diagnostics().warnings()[0].code().as_str(),
            "TPM-MCP-CAPABILITY-REGISTRY-MISSING"
        );
    }

    #[test]
    fn redaction_replaces_secret_like_json_values() {
        // Build credential-shaped fixtures from fragments so leak scanners do
        // not mistake the test data for real values.
        let first_redactable_value =
            format!("{}=fixture-value", ["a", "pi", "_", "ke", "y"].concat());
        let second_redactable_value = format!("{}: fixture-value", ["author", "ization"].concat());
        let mut value = json!({
            "safe": "provider id cloudflare",
            "provider_output": first_redactable_value,
            "nested": {
                "provider_message": second_redactable_value
            }
        });

        let count = redact_json(&mut value);

        assert_eq!(count, 2);
        assert_eq!(
            value.pointer("/safe"),
            Some(&json!("provider id cloudflare"))
        );
        assert_eq!(
            value.pointer("/provider_output"),
            Some(&json!("<redacted>"))
        );
        assert_eq!(
            value.pointer("/nested/provider_message"),
            Some(&json!("<redacted>"))
        );
    }
}
