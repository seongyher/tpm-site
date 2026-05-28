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
    run_release_inspect, run_site_doctor, run_workspace_status,
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
            Self::WorkspaceStatus => vec![PermissionScope::Inspect, PermissionScope::SourceRead],
        }
    }

    const fn all() -> [Self; 6] {
        [
            Self::WorkspaceStatus,
            Self::SiteDiagnostics,
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
    /// Read current diagnostics.
    DiagnosticsRead,
    /// Inspect read-only platform state.
    Inspect,
    /// Read media reports.
    MediaRead,
    /// Read provider status and capabilities.
    ProviderStatusRead,
    /// Read release and generated-output reports.
    ReleaseRead,
    /// Read route and redirect reports.
    RoutesRead,
    /// Read source/workspace summaries.
    SourceRead,
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
            PermissionScope::ProviderStatusRead,
            PermissionScope::ReleaseRead,
            PermissionScope::RoutesRead,
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
            safety_class: ResourceSafetyClass::ReadOnly,
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
    /// The request performed no source, provider, credential, or output writes.
    ReadOnly,
}

/// Credential access recorded in MCP audit events.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AuditCredentialAccess {
    /// The request did not access credential references or secret values.
    None,
}

/// Mutation class recorded in MCP audit events.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AuditMutation {
    /// The request did not mutate source, providers, credentials, or output.
    None,
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
    /// Inspect adapter capability availability.
    AdapterCapabilities,
    /// Inspect current site diagnostics.
    Diagnostics,
    /// List available read-only MCP resources.
    ResourceCatalog,
    /// Inspect workspace status.
    SiteStatus,
}

impl ToolKind {
    /// Returns the stable tool name.
    #[must_use]
    pub const fn name(self) -> &'static str {
        match self {
            Self::AdapterCapabilities => "adapter_capabilities",
            Self::Diagnostics => "site_diagnostics",
            Self::ResourceCatalog => "resource_catalog",
            Self::SiteStatus => "site_status",
        }
    }

    /// Returns a concise tool description.
    #[must_use]
    pub const fn description(self) -> &'static str {
        match self {
            Self::AdapterCapabilities => {
                "Inspect adapter capability availability when the runtime exists."
            }
            Self::Diagnostics => "Return the current site diagnostic operation resource.",
            Self::ResourceCatalog => "List read-only MCP resources and required scopes.",
            Self::SiteStatus => "Return the current workspace status operation resource.",
        }
    }

    fn required_scopes(self) -> Vec<PermissionScope> {
        match self {
            Self::AdapterCapabilities => ResourceKind::AdapterCapabilities.required_scopes(),
            Self::Diagnostics => ResourceKind::SiteDiagnostics.required_scopes(),
            Self::ResourceCatalog => vec![PermissionScope::Inspect],
            Self::SiteStatus => ResourceKind::WorkspaceStatus.required_scopes(),
        }
    }

    const fn all() -> [Self; 4] {
        [
            Self::SiteStatus,
            Self::Diagnostics,
            Self::ResourceCatalog,
            Self::AdapterCapabilities,
        ]
    }
}

/// Safety class for the current MCP tool surface.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ToolSafetyClass {
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
            safety_class: ToolSafetyClass::ReadOnly,
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
        ToolKind::ResourceCatalog => resource_catalog_tool_response(descriptor),
        ToolKind::SiteStatus => resource_tool_response(
            descriptor,
            &resource_for_tool(request, ResourceKind::WorkspaceStatus),
        ),
    };

    audited_tool_response(response, &request.permissions, Vec::new())
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
        safety_class: AuditSafetyClass::ReadOnly,
        outcome: AuditOutcome::from(response.status()),
        required_scopes: response.resource.required_scopes().to_vec(),
        granted_scopes: permissions.scopes().collect(),
        missing_scopes,
        credential_access: AuditCredentialAccess::None,
        mutation: AuditMutation::None,
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
        safety_class: AuditSafetyClass::ReadOnly,
        outcome: AuditOutcome::from(response.status()),
        required_scopes: response.tool.required_scopes().to_vec(),
        granted_scopes: permissions.scopes().collect(),
        missing_scopes,
        credential_access: AuditCredentialAccess::None,
        mutation: AuditMutation::None,
        redaction: response.redaction,
    }];

    response
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
        PermissionScope::DiagnosticsRead => "diagnostics.read",
        PermissionScope::Inspect => "inspect",
        PermissionScope::MediaRead => "media.read",
        PermissionScope::ProviderStatusRead => "provider.status.read",
        PermissionScope::ReleaseRead => "release.read",
        PermissionScope::RoutesRead => "routes.read",
        PermissionScope::SourceRead => "source.read",
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
            result.pointer("/resources/5/kind"),
            Some(&json!("adapter-capabilities"))
        );
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
