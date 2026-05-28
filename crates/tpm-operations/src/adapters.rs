//! Provider adapter contracts and capability reporting.
//!
//! This module defines provider-neutral contracts for source, history, media,
//! workflow, build, deploy, identity, diagnostics, and observability adapters.
//! The contracts are intentionally data-oriented so CLI, GUI, MCP, CI, and
//! tests can inspect capabilities before attempting provider-backed work.

use std::fmt::{Display, Formatter, Result as FormatResult};

use serde::de::Error as DeserializeError;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use tpm_core::Severity;
use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticReport};

use crate::OperationInterface;

/// Stable provider or adapter identifier.
#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct ProviderId(String);

impl ProviderId {
    /// Builds a provider ID after validating its stable display form.
    ///
    /// Provider IDs must be lowercase strings such as `local-source` or
    /// `cloudflare-pages`.
    ///
    /// # Errors
    ///
    /// Returns [`ProviderIdError`] when the value is empty or contains an
    /// unsupported character.
    pub fn parse(value: impl Into<String>) -> Result<Self, ProviderIdError> {
        let value = value.into();

        if value.is_empty() {
            return Err(ProviderIdError::Empty);
        }

        if value
            .bytes()
            .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
        {
            Ok(Self(value))
        } else {
            Err(ProviderIdError::InvalidCharacter)
        }
    }

    /// Returns the stable provider identifier.
    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl Display for ProviderId {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        formatter.write_str(self.as_str())
    }
}

impl Serialize for ProviderId {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.as_str().serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for ProviderId {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = String::deserialize(deserializer)?;
        Self::parse(value).map_err(DeserializeError::custom)
    }
}

/// Validation failures for provider identifiers.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ProviderIdError {
    /// The provider ID was empty.
    Empty,
    /// The provider ID contained an unsupported character.
    InvalidCharacter,
}

impl Display for ProviderIdError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        let message = match self {
            Self::Empty => "provider ID must not be empty",
            Self::InvalidCharacter => {
                "provider ID may only contain ASCII lowercase letters, numbers, and hyphens"
            }
        };

        formatter.write_str(message)
    }
}

impl std::error::Error for ProviderIdError {}

/// Provider adapter family.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AdapterFamily {
    /// Editable source storage.
    Source,
    /// Version and restore behavior.
    History,
    /// Media storage and materialization.
    Media,
    /// Editorial workflow transitions.
    Workflow,
    /// Build and preview execution.
    Build,
    /// Static output deployment.
    Deploy,
    /// Provider identity and account context.
    Identity,
    /// Credential reference and scope handling.
    Credential,
    /// Provider diagnostics and logs.
    Diagnostics,
    /// Analytics, crawl errors, and release health imports.
    Observability,
}

impl Display for AdapterFamily {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        formatter.write_str(match self {
            Self::Source => "source",
            Self::History => "history",
            Self::Media => "media",
            Self::Workflow => "workflow",
            Self::Build => "build",
            Self::Deploy => "deploy",
            Self::Identity => "identity",
            Self::Credential => "credential",
            Self::Diagnostics => "diagnostics",
            Self::Observability => "observability",
        })
    }
}

/// Provider capability operation.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CapabilityOperation {
    /// Read workspace source.
    SourceReadWorkspace,
    /// Write a draft source change.
    SourceWriteDraft,
    /// Write a source patch.
    SourceWritePatch,
    /// Compute or retrieve source diffs.
    SourceDiff,
    /// Export source content.
    SourceExport,
    /// Import source content.
    SourceImport,
    /// Detect source conflicts.
    SourceConflictDetection,
    /// Create a restore point.
    HistoryCreateRestorePoint,
    /// List historical versions.
    HistoryListVersions,
    /// Diff historical versions.
    HistoryDiffVersions,
    /// Restore a historical version.
    HistoryRestoreVersion,
    /// Submit source for review.
    HistorySubmitForReview,
    /// Approve a review workflow.
    HistoryApproveReview,
    /// Resolve a media reference.
    MediaResolve,
    /// Upload media.
    MediaUpload,
    /// Relink media references.
    MediaRelink,
    /// Materialize a media asset for build input.
    MediaMaterializeBuildInput,
    /// Inspect media usage.
    MediaInspectUsage,
    /// Migrate media storage.
    MediaMigrateStorage,
    /// Delete media.
    MediaDelete,
    /// Optimize media.
    MediaOptimize,
    /// Cache media derivatives.
    MediaCache,
    /// Save a draft workflow state.
    WorkflowSaveDraft,
    /// Submit content for review.
    WorkflowSubmitForReview,
    /// Approve a workflow transition.
    WorkflowApprove,
    /// Request workflow changes.
    WorkflowRequestChanges,
    /// Schedule a workflow transition.
    WorkflowSchedule,
    /// Run diagnostics-only checks.
    BuildDiagnosticsCheck,
    /// Run a preview build.
    BuildPreview,
    /// Run a full build.
    BuildFull,
    /// Verify generated build artifacts.
    BuildVerifyArtifacts,
    /// Check deploy target readiness.
    DeployCheck,
    /// Create a deploy preview.
    DeployPreview,
    /// Publish static output.
    DeployPublish,
    /// Roll back a deployed release.
    DeployRollback,
    /// Apply or inspect cache policy.
    DeployCachePolicy,
    /// Inspect domain status.
    DeployDomainStatus,
    /// Authenticate with a provider.
    IdentityAuthenticate,
    /// Test provider connection.
    IdentityTestConnection,
    /// List provider account context.
    IdentityListContext,
    /// Revoke provider identity.
    IdentityRevoke,
    /// Resolve a credential reference.
    CredentialResolveReference,
    /// Validate credential scope.
    CredentialValidateScope,
    /// Import provider diagnostics.
    DiagnosticsImportProvider,
    /// Normalize provider logs.
    DiagnosticsNormalizeLogs,
    /// Attach provider diagnostics to source references.
    DiagnosticsAttachSourceReferences,
    /// Import analytics data.
    ObservabilityImportAnalytics,
    /// Import crawl errors.
    ObservabilityImportCrawlErrors,
    /// Import performance data.
    ObservabilityImportPerformance,
    /// Import release health data.
    ObservabilityReleaseHealth,
}

impl CapabilityOperation {
    /// Returns the adapter family that owns this capability.
    #[must_use]
    pub const fn family(self) -> AdapterFamily {
        match self {
            Self::SourceReadWorkspace
            | Self::SourceWriteDraft
            | Self::SourceWritePatch
            | Self::SourceDiff
            | Self::SourceExport
            | Self::SourceImport
            | Self::SourceConflictDetection => AdapterFamily::Source,
            Self::HistoryCreateRestorePoint
            | Self::HistoryListVersions
            | Self::HistoryDiffVersions
            | Self::HistoryRestoreVersion
            | Self::HistorySubmitForReview
            | Self::HistoryApproveReview => AdapterFamily::History,
            Self::MediaResolve
            | Self::MediaUpload
            | Self::MediaRelink
            | Self::MediaMaterializeBuildInput
            | Self::MediaInspectUsage
            | Self::MediaMigrateStorage
            | Self::MediaDelete
            | Self::MediaOptimize
            | Self::MediaCache => AdapterFamily::Media,
            Self::WorkflowSaveDraft
            | Self::WorkflowSubmitForReview
            | Self::WorkflowApprove
            | Self::WorkflowRequestChanges
            | Self::WorkflowSchedule => AdapterFamily::Workflow,
            Self::BuildDiagnosticsCheck
            | Self::BuildPreview
            | Self::BuildFull
            | Self::BuildVerifyArtifacts => AdapterFamily::Build,
            Self::DeployCheck
            | Self::DeployPreview
            | Self::DeployPublish
            | Self::DeployRollback
            | Self::DeployCachePolicy
            | Self::DeployDomainStatus => AdapterFamily::Deploy,
            Self::IdentityAuthenticate
            | Self::IdentityTestConnection
            | Self::IdentityListContext
            | Self::IdentityRevoke => AdapterFamily::Identity,
            Self::CredentialResolveReference | Self::CredentialValidateScope => {
                AdapterFamily::Credential
            }
            Self::DiagnosticsImportProvider
            | Self::DiagnosticsNormalizeLogs
            | Self::DiagnosticsAttachSourceReferences => AdapterFamily::Diagnostics,
            Self::ObservabilityImportAnalytics
            | Self::ObservabilityImportCrawlErrors
            | Self::ObservabilityImportPerformance
            | Self::ObservabilityReleaseHealth => AdapterFamily::Observability,
        }
    }

    /// Returns the stable capability operation label.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::SourceReadWorkspace => "source-read-workspace",
            Self::SourceWriteDraft => "source-write-draft",
            Self::SourceWritePatch => "source-write-patch",
            Self::SourceDiff => "source-diff",
            Self::SourceExport => "source-export",
            Self::SourceImport => "source-import",
            Self::SourceConflictDetection => "source-conflict-detection",
            Self::HistoryCreateRestorePoint => "history-create-restore-point",
            Self::HistoryListVersions => "history-list-versions",
            Self::HistoryDiffVersions => "history-diff-versions",
            Self::HistoryRestoreVersion => "history-restore-version",
            Self::HistorySubmitForReview => "history-submit-for-review",
            Self::HistoryApproveReview => "history-approve-review",
            Self::MediaResolve => "media-resolve",
            Self::MediaUpload => "media-upload",
            Self::MediaRelink => "media-relink",
            Self::MediaMaterializeBuildInput => "media-materialize-build-input",
            Self::MediaInspectUsage => "media-inspect-usage",
            Self::MediaMigrateStorage => "media-migrate-storage",
            Self::MediaDelete => "media-delete",
            Self::MediaOptimize => "media-optimize",
            Self::MediaCache => "media-cache",
            Self::WorkflowSaveDraft => "workflow-save-draft",
            Self::WorkflowSubmitForReview => "workflow-submit-for-review",
            Self::WorkflowApprove => "workflow-approve",
            Self::WorkflowRequestChanges => "workflow-request-changes",
            Self::WorkflowSchedule => "workflow-schedule",
            Self::BuildDiagnosticsCheck => "build-diagnostics-check",
            Self::BuildPreview => "build-preview",
            Self::BuildFull => "build-full",
            Self::BuildVerifyArtifacts => "build-verify-artifacts",
            Self::DeployCheck => "deploy-check",
            Self::DeployPreview => "deploy-preview",
            Self::DeployPublish => "deploy-publish",
            Self::DeployRollback => "deploy-rollback",
            Self::DeployCachePolicy => "deploy-cache-policy",
            Self::DeployDomainStatus => "deploy-domain-status",
            Self::IdentityAuthenticate => "identity-authenticate",
            Self::IdentityTestConnection => "identity-test-connection",
            Self::IdentityListContext => "identity-list-context",
            Self::IdentityRevoke => "identity-revoke",
            Self::CredentialResolveReference => "credential-resolve-reference",
            Self::CredentialValidateScope => "credential-validate-scope",
            Self::DiagnosticsImportProvider => "diagnostics-import-provider",
            Self::DiagnosticsNormalizeLogs => "diagnostics-normalize-logs",
            Self::DiagnosticsAttachSourceReferences => "diagnostics-attach-source-references",
            Self::ObservabilityImportAnalytics => "observability-import-analytics",
            Self::ObservabilityImportCrawlErrors => "observability-import-crawl-errors",
            Self::ObservabilityImportPerformance => "observability-import-performance",
            Self::ObservabilityReleaseHealth => "observability-release-health",
        }
    }
}

impl Display for CapabilityOperation {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        formatter.write_str(self.as_str())
    }
}

/// Capability support status.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CapabilityStatus {
    /// Operation is supported.
    Supported,
    /// Operation is unsupported for this provider.
    Unsupported,
    /// Operation is manual and cannot be automated by this provider.
    Manual,
    /// Operation is partially supported with limitations.
    Partial,
    /// Support cannot be known before authentication.
    UnknownUntilAuthenticated,
    /// Operation is disabled by site or provider policy.
    DisabledByPolicy,
    /// Operation requires an extension that is not enabled.
    RequiresExtension,
}

impl CapabilityStatus {
    /// Returns whether this status can perform the requested operation without
    /// extra human or provider work.
    #[must_use]
    pub const fn is_directly_supported(self) -> bool {
        matches!(self, Self::Supported)
    }

    /// Returns whether this status should produce an unsupported-operation
    /// diagnostic when a caller attempts it directly.
    #[must_use]
    pub const fn should_diagnose_attempt(self) -> bool {
        matches!(
            self,
            Self::Unsupported
                | Self::UnknownUntilAuthenticated
                | Self::DisabledByPolicy
                | Self::RequiresExtension
        )
    }
}

impl Display for CapabilityStatus {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        formatter.write_str(match self {
            Self::Supported => "supported",
            Self::Unsupported => "unsupported",
            Self::Manual => "manual",
            Self::Partial => "partial",
            Self::UnknownUntilAuthenticated => "unknown-until-authenticated",
            Self::DisabledByPolicy => "disabled-by-policy",
            Self::RequiresExtension => "requires-extension",
        })
    }
}

/// Credential scope required by a provider capability.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CredentialScope {
    /// Source read access.
    SourceRead,
    /// Source write access.
    SourceWrite,
    /// History write access.
    HistoryWrite,
    /// Media read access.
    MediaRead,
    /// Media write access.
    MediaWrite,
    /// Workflow transition access.
    WorkflowTransition,
    /// Build execution access.
    BuildRun,
    /// Deploy read access.
    DeployRead,
    /// Deploy mutation access.
    DeployWrite,
    /// Identity read access.
    IdentityRead,
    /// Observability read access.
    ObservabilityRead,
}

/// Credential state required for a capability.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CredentialRequirement {
    /// No credentials are required.
    None,
    /// Credentials can improve behavior but are not required.
    Optional,
    /// Credentials are required before the operation can run.
    Required,
    /// Credential state must be tested before support can be known.
    UnknownUntilAuthenticated,
}

/// Runtime subject that owns or uses a credential reference.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CredentialSubject {
    /// Local desktop or CLI user.
    LocalUser,
    /// Publication workspace.
    Workspace,
    /// Provider account.
    ProviderAccount,
    /// Provider organization.
    Organization,
    /// Continuous integration job.
    CiJob,
    /// MCP client.
    McpClient,
    /// Hosted studio service account.
    HostedStudioService,
    /// Third-party extension grant.
    ExtensionGrant,
}

/// Runtime credential state.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CredentialState {
    /// Credential is missing.
    Missing,
    /// Credential is pending connection or approval.
    Pending,
    /// Credential is connected and usable for its declared scopes.
    Connected,
    /// Credential has expired.
    Expired,
    /// Credential has been revoked.
    Revoked,
    /// Credential exists but lacks required scopes.
    InsufficientScope,
    /// Provider could not be reached.
    ProviderUnreachable,
    /// Credential is disabled by local or provider policy.
    Disabled,
    /// Credential belongs to an untrusted extension.
    UntrustedExtension,
    /// Credential state has not been checked.
    Unknown,
}

/// Runtime storage profile for a credential reference.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CredentialStorageProfile {
    /// Operating-system keychain or secure desktop storage.
    DesktopKeychain,
    /// Explicit local credential store.
    LocalCredentialStore,
    /// CI secret manager or injected environment.
    CiSecretManager,
    /// Hosted studio secret store.
    HostedSecretStore,
    /// Provider-managed token storage.
    ProviderManaged,
    /// No secret storage is available.
    None,
    /// Storage profile is unknown.
    Unknown,
}

/// Opaque runtime secret reference that always serializes as redacted.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CredentialSecretReference(String);

impl CredentialSecretReference {
    /// Creates an opaque credential secret reference.
    ///
    /// The value is a runtime handle to a secret location, not a secret value.
    /// Serialized operation reports always redact it.
    #[must_use]
    pub fn new(reference: impl Into<String>) -> Self {
        Self(reference.into())
    }

    /// Returns the redacted report value.
    #[must_use]
    pub const fn redacted() -> &'static str {
        "[redacted]"
    }

    /// Returns whether the opaque runtime handle is present.
    #[must_use]
    pub const fn has_runtime_handle(&self) -> bool {
        !self.0.is_empty()
    }
}

impl Display for CredentialSecretReference {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        formatter.write_str(Self::redacted())
    }
}

impl Serialize for CredentialSecretReference {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        Self::redacted().serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for CredentialSecretReference {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = String::deserialize(deserializer)?;
        Ok(Self(value))
    }
}

/// Non-secret credential reference passed to provider adapters.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CredentialReference {
    id: String,
    provider_id: ProviderId,
    subject: CredentialSubject,
    storage: CredentialStorageProfile,
    state: CredentialState,
    scopes: Vec<CredentialScope>,
    #[serde(skip_serializing_if = "Option::is_none")]
    secret_reference: Option<CredentialSecretReference>,
}

impl CredentialReference {
    /// Creates a non-secret credential reference.
    #[must_use]
    pub fn new(
        id: impl Into<String>,
        provider_id: ProviderId,
        subject: CredentialSubject,
        storage: CredentialStorageProfile,
        state: CredentialState,
        scopes: Vec<CredentialScope>,
    ) -> Self {
        Self {
            id: id.into(),
            provider_id,
            subject,
            storage,
            state,
            scopes,
            secret_reference: None,
        }
    }

    /// Adds an opaque runtime secret reference.
    #[must_use]
    pub fn with_secret_reference(mut self, secret_reference: CredentialSecretReference) -> Self {
        self.secret_reference = Some(secret_reference);
        self
    }

    /// Returns the stable credential reference ID.
    #[must_use]
    pub fn id(&self) -> &str {
        &self.id
    }

    /// Returns the provider ID.
    #[must_use]
    pub const fn provider_id(&self) -> &ProviderId {
        &self.provider_id
    }

    /// Returns the credential subject.
    #[must_use]
    pub const fn subject(&self) -> CredentialSubject {
        self.subject
    }

    /// Returns the credential storage profile.
    #[must_use]
    pub const fn storage(&self) -> CredentialStorageProfile {
        self.storage
    }

    /// Returns the credential state.
    #[must_use]
    pub const fn state(&self) -> CredentialState {
        self.state
    }

    /// Returns declared platform scopes.
    #[must_use]
    pub fn scopes(&self) -> &[CredentialScope] {
        &self.scopes
    }

    /// Returns the redacted secret reference display value, when present.
    #[must_use]
    pub fn redacted_secret_reference(&self) -> Option<&'static str> {
        self.secret_reference
            .as_ref()
            .map(|_| CredentialSecretReference::redacted())
    }
}

/// Dry-run support for a provider operation.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum DryRunSupport {
    /// Operation has no effect and does not need dry-run support.
    NotApplicable,
    /// Operation supports deterministic dry-run planning.
    Supported,
    /// Operation cannot be dry-run.
    Unsupported,
    /// Operation supports only partial dry-run planning.
    Partial,
}

impl DryRunSupport {
    /// Returns a stable display label.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::NotApplicable => "not-applicable",
            Self::Supported => "supported",
            Self::Unsupported => "unsupported",
            Self::Partial => "partial",
        }
    }
}

impl Display for DryRunSupport {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        formatter.write_str(self.as_str())
    }
}

/// Reversibility model for provider operations.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum Reversibility {
    /// Operation does not mutate state.
    NotApplicable,
    /// Operation can be reversed automatically.
    Automatic,
    /// Operation has a manual recovery path.
    Manual,
    /// Operation cannot be reversed.
    Irreversible,
    /// Reversibility depends on provider state.
    Partial,
}

/// Destructive behavior classification.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum DestructiveBehavior {
    /// Operation is read-only.
    ReadOnly,
    /// Operation writes local state only.
    LocalWrite,
    /// Operation writes source state.
    SourceWrite,
    /// Operation mutates a provider.
    ProviderMutation,
    /// Operation publishes externally visible output.
    Publish,
    /// Operation can delete or permanently overwrite state.
    Destructive,
}

/// Audit requirements for a capability.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AuditRequirement {
    /// No audit event is required.
    None,
    /// Local audit event should be emitted.
    Local,
    /// Provider audit event should be emitted.
    Provider,
    /// Both local and provider audit events should be emitted.
    LocalAndProvider,
}

/// Boundary category for an adapter or extension.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AdapterBoundary {
    /// Platform core behavior.
    Core,
    /// Bundled adapter shipped with the platform.
    Bundled,
    /// Default adapter enabled for the current profile.
    Default,
    /// Optional adapter that can be enabled.
    Optional,
    /// Site-owned adapter.
    Site,
    /// Third-party adapter.
    ThirdParty,
}

impl AdapterBoundary {
    /// Returns a stable display label.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Core => "core",
            Self::Bundled => "bundled",
            Self::Default => "default",
            Self::Optional => "optional",
            Self::Site => "site",
            Self::ThirdParty => "third-party",
        }
    }
}

impl Display for AdapterBoundary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        formatter.write_str(self.as_str())
    }
}

/// Interface behavior for unavailable capabilities.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum UnsupportedBehavior {
    /// Hide the action because it is irrelevant for this provider.
    Hidden,
    /// Disable the action with an explanation.
    DisabledWithExplanation,
    /// Reject attempted use with a diagnostic.
    RejectedWithDiagnostic,
    /// Expose a manual or advanced escape hatch.
    ExplicitEscapeHatch,
    /// Route the action through another capability or provider.
    Rerouted,
}

/// Interface behavior derived from a capability record.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CapabilityActionBehavior {
    /// The action is enabled.
    Enabled,
    /// The action should be hidden.
    Hidden,
    /// The action should be disabled with an explanation.
    DisabledWithExplanation,
    /// Attempted execution should be rejected with a diagnostic.
    RejectedWithDiagnostic,
    /// The action may be exposed as an explicit escape hatch.
    ExplicitEscapeHatch,
    /// The action should be routed through another provider or capability.
    Rerouted,
    /// The action should show provider-owned manual steps.
    ManualSteps,
    /// The action is available with limitations.
    Degraded,
    /// The action requires authentication or credential testing first.
    PromptAuthentication,
    /// The action is disabled by policy.
    DisabledByPolicy,
    /// The action requires an extension that is not enabled.
    RequiresExtension,
}

/// Human-readable manual step owned by a provider.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ManualStep {
    title: String,
    description: String,
}

impl ManualStep {
    /// Creates a manual step.
    #[must_use]
    pub fn new(title: impl Into<String>, description: impl Into<String>) -> Self {
        Self {
            title: title.into(),
            description: description.into(),
        }
    }

    /// Returns the manual step title.
    #[must_use]
    pub fn title(&self) -> &str {
        &self.title
    }

    /// Returns the manual step description.
    #[must_use]
    pub fn description(&self) -> &str {
        &self.description
    }
}

/// Provider capability record shared by CLI, GUI, MCP, CI, and tests.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderCapability {
    provider_id: ProviderId,
    family: AdapterFamily,
    operation: CapabilityOperation,
    status: CapabilityStatus,
    required_inputs: Vec<String>,
    outputs: Vec<String>,
    credential_scopes: Vec<CredentialScope>,
    credential_requirement: CredentialRequirement,
    dry_run: DryRunSupport,
    reversibility: Reversibility,
    destructive_behavior: DestructiveBehavior,
    audit_requirement: AuditRequirement,
    unsupported_behavior: UnsupportedBehavior,
    supported_interfaces: Vec<OperationInterface>,
    manual_steps: Vec<ManualStep>,
    #[serde(skip_serializing_if = "Option::is_none")]
    remediation: Option<String>,
}

impl ProviderCapability {
    /// Creates a capability record with conservative defaults.
    #[must_use]
    pub fn new(
        provider_id: ProviderId,
        operation: CapabilityOperation,
        status: CapabilityStatus,
    ) -> Self {
        Self {
            provider_id,
            family: operation.family(),
            operation,
            status,
            required_inputs: Vec::new(),
            outputs: Vec::new(),
            credential_scopes: Vec::new(),
            credential_requirement: CredentialRequirement::None,
            dry_run: DryRunSupport::NotApplicable,
            reversibility: Reversibility::NotApplicable,
            destructive_behavior: DestructiveBehavior::ReadOnly,
            audit_requirement: AuditRequirement::None,
            unsupported_behavior: UnsupportedBehavior::RejectedWithDiagnostic,
            supported_interfaces: vec![
                OperationInterface::Cli,
                OperationInterface::Gui,
                OperationInterface::Mcp,
                OperationInterface::Ci,
            ],
            manual_steps: Vec::new(),
            remediation: None,
        }
    }

    /// Adds required input labels.
    #[must_use]
    pub fn with_required_inputs(mut self, inputs: impl IntoIterator<Item = &'static str>) -> Self {
        self.required_inputs = strings(inputs);
        self
    }

    /// Adds output labels.
    #[must_use]
    pub fn with_outputs(mut self, outputs: impl IntoIterator<Item = &'static str>) -> Self {
        self.outputs = strings(outputs);
        self
    }

    /// Adds credential requirements.
    #[must_use]
    pub fn with_credentials(
        mut self,
        requirement: CredentialRequirement,
        scopes: Vec<CredentialScope>,
    ) -> Self {
        self.credential_requirement = requirement;
        self.credential_scopes = scopes;
        self
    }

    /// Adds dry-run support classification.
    #[must_use]
    pub const fn with_dry_run(mut self, dry_run: DryRunSupport) -> Self {
        self.dry_run = dry_run;
        self
    }

    /// Adds reversibility classification.
    #[must_use]
    pub const fn with_reversibility(mut self, reversibility: Reversibility) -> Self {
        self.reversibility = reversibility;
        self
    }

    /// Adds destructive behavior classification.
    #[must_use]
    pub const fn with_destructive_behavior(mut self, behavior: DestructiveBehavior) -> Self {
        self.destructive_behavior = behavior;
        self
    }

    /// Adds audit requirement classification.
    #[must_use]
    pub const fn with_audit(mut self, audit: AuditRequirement) -> Self {
        self.audit_requirement = audit;
        self
    }

    /// Adds unsupported behavior classification.
    #[must_use]
    pub const fn with_unsupported_behavior(mut self, behavior: UnsupportedBehavior) -> Self {
        self.unsupported_behavior = behavior;
        self
    }

    /// Adds a manual step.
    #[must_use]
    pub fn with_manual_step(mut self, step: ManualStep) -> Self {
        self.manual_steps.push(step);
        self
    }

    /// Adds remediation guidance.
    #[must_use]
    pub fn with_remediation(mut self, remediation: impl Into<String>) -> Self {
        self.remediation = Some(remediation.into());
        self
    }

    /// Returns the provider ID.
    #[must_use]
    pub const fn provider_id(&self) -> &ProviderId {
        &self.provider_id
    }

    /// Returns the capability family.
    #[must_use]
    pub const fn family(&self) -> AdapterFamily {
        self.family
    }

    /// Returns the capability operation.
    #[must_use]
    pub const fn operation(&self) -> CapabilityOperation {
        self.operation
    }

    /// Returns the capability status.
    #[must_use]
    pub const fn status(&self) -> CapabilityStatus {
        self.status
    }

    /// Returns the interface behavior implied by the capability status.
    #[must_use]
    pub const fn action_behavior(&self) -> CapabilityActionBehavior {
        match self.status {
            CapabilityStatus::Supported => CapabilityActionBehavior::Enabled,
            CapabilityStatus::Manual => CapabilityActionBehavior::ManualSteps,
            CapabilityStatus::Partial => CapabilityActionBehavior::Degraded,
            CapabilityStatus::UnknownUntilAuthenticated => {
                CapabilityActionBehavior::PromptAuthentication
            }
            CapabilityStatus::DisabledByPolicy => CapabilityActionBehavior::DisabledByPolicy,
            CapabilityStatus::RequiresExtension => CapabilityActionBehavior::RequiresExtension,
            CapabilityStatus::Unsupported => match self.unsupported_behavior {
                UnsupportedBehavior::Hidden => CapabilityActionBehavior::Hidden,
                UnsupportedBehavior::DisabledWithExplanation => {
                    CapabilityActionBehavior::DisabledWithExplanation
                }
                UnsupportedBehavior::RejectedWithDiagnostic => {
                    CapabilityActionBehavior::RejectedWithDiagnostic
                }
                UnsupportedBehavior::ExplicitEscapeHatch => {
                    CapabilityActionBehavior::ExplicitEscapeHatch
                }
                UnsupportedBehavior::Rerouted => CapabilityActionBehavior::Rerouted,
            },
        }
    }

    /// Returns required credential scopes.
    #[must_use]
    pub fn credential_scopes(&self) -> &[CredentialScope] {
        &self.credential_scopes
    }

    /// Returns output labels.
    #[must_use]
    pub fn outputs(&self) -> &[String] {
        &self.outputs
    }

    /// Returns required input labels.
    #[must_use]
    pub fn required_inputs(&self) -> &[String] {
        &self.required_inputs
    }

    /// Returns credential requirement.
    #[must_use]
    pub const fn credential_requirement(&self) -> CredentialRequirement {
        self.credential_requirement
    }

    /// Returns dry-run support.
    #[must_use]
    pub const fn dry_run(&self) -> DryRunSupport {
        self.dry_run
    }

    /// Returns reversibility classification.
    #[must_use]
    pub const fn reversibility(&self) -> Reversibility {
        self.reversibility
    }

    /// Returns destructive behavior classification.
    #[must_use]
    pub const fn destructive_behavior(&self) -> DestructiveBehavior {
        self.destructive_behavior
    }

    /// Returns audit requirements.
    #[must_use]
    pub const fn audit_requirement(&self) -> AuditRequirement {
        self.audit_requirement
    }

    /// Returns unsupported behavior.
    #[must_use]
    pub const fn unsupported_behavior(&self) -> UnsupportedBehavior {
        self.unsupported_behavior
    }

    /// Returns the operation interfaces that may use this capability.
    #[must_use]
    pub fn supported_interfaces(&self) -> &[OperationInterface] {
        &self.supported_interfaces
    }

    /// Returns manual provider-owned steps.
    #[must_use]
    pub fn manual_steps(&self) -> &[ManualStep] {
        &self.manual_steps
    }

    /// Returns remediation guidance when available.
    #[must_use]
    pub fn remediation(&self) -> Option<&str> {
        self.remediation.as_deref()
    }
}

/// Provider adapter descriptor.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdapterDescriptor {
    provider_id: ProviderId,
    label: String,
    boundary: AdapterBoundary,
    families: Vec<AdapterFamily>,
    capabilities: Vec<ProviderCapability>,
}

impl AdapterDescriptor {
    /// Creates an adapter descriptor.
    #[must_use]
    pub fn new(
        provider_id: ProviderId,
        label: impl Into<String>,
        boundary: AdapterBoundary,
        capabilities: Vec<ProviderCapability>,
    ) -> Self {
        let mut families = capabilities
            .iter()
            .map(ProviderCapability::family)
            .collect::<Vec<_>>();
        families.sort_unstable();
        families.dedup();

        Self {
            provider_id,
            label: label.into(),
            boundary,
            families,
            capabilities,
        }
    }

    /// Returns the provider ID.
    #[must_use]
    pub const fn provider_id(&self) -> &ProviderId {
        &self.provider_id
    }

    /// Returns the adapter label.
    #[must_use]
    pub fn label(&self) -> &str {
        &self.label
    }

    /// Returns the adapter boundary category.
    #[must_use]
    pub const fn boundary(&self) -> AdapterBoundary {
        self.boundary
    }

    /// Returns adapter capability records.
    #[must_use]
    pub fn capabilities(&self) -> &[ProviderCapability] {
        &self.capabilities
    }
}

/// Runtime profile used by mock providers and inspection fixtures.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AdapterRuntimeProfile {
    /// Simple local publisher with no Git requirement.
    LocalOnly,
    /// TPM-like static publication with optional Git/GitHub and Cloudflare adapters.
    TpmLike,
    /// Complex publisher with enterprise-style provider placeholders.
    ComplexPublisher,
}

impl AdapterRuntimeProfile {
    /// Returns a stable profile label.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::LocalOnly => "local-only",
            Self::TpmLike => "tpm-like",
            Self::ComplexPublisher => "complex-publisher",
        }
    }
}

impl Display for AdapterRuntimeProfile {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        formatter.write_str(self.as_str())
    }
}

/// Capability registry for configured provider adapters.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityRegistry {
    profile: AdapterRuntimeProfile,
    adapters: Vec<AdapterDescriptor>,
}

impl CapabilityRegistry {
    /// Creates a registry from adapter descriptors.
    #[must_use]
    pub const fn new(profile: AdapterRuntimeProfile, adapters: Vec<AdapterDescriptor>) -> Self {
        Self { profile, adapters }
    }

    /// Returns the runtime profile.
    #[must_use]
    pub const fn profile(&self) -> AdapterRuntimeProfile {
        self.profile
    }

    /// Returns configured adapters.
    #[must_use]
    pub fn adapters(&self) -> &[AdapterDescriptor] {
        &self.adapters
    }

    /// Returns all capability records in deterministic adapter order.
    #[must_use]
    pub fn capabilities(&self) -> Vec<&ProviderCapability> {
        self.adapters
            .iter()
            .flat_map(AdapterDescriptor::capabilities)
            .collect()
    }

    /// Returns all capabilities for an adapter family.
    #[must_use]
    pub fn capabilities_for_family(&self, family: AdapterFamily) -> Vec<&ProviderCapability> {
        self.capabilities()
            .into_iter()
            .filter(|capability| capability.family() == family)
            .collect()
    }

    /// Finds a capability for a provider and operation.
    #[must_use]
    pub fn find(
        &self,
        provider_id: &ProviderId,
        operation: CapabilityOperation,
    ) -> Option<&ProviderCapability> {
        self.capabilities().into_iter().find(|capability| {
            capability.provider_id() == provider_id && capability.operation() == operation
        })
    }

    /// Returns all capability records that are not directly supported.
    #[must_use]
    pub fn unavailable_capabilities(&self) -> Vec<&ProviderCapability> {
        self.capabilities()
            .into_iter()
            .filter(|capability| !capability.status().is_directly_supported())
            .collect()
    }

    /// Returns non-blocking diagnostics for unavailable capability inventory.
    #[must_use]
    pub fn unavailable_capability_diagnostics(&self) -> DiagnosticReport {
        DiagnosticReport::from_diagnostics(
            self.unavailable_capabilities()
                .into_iter()
                .map(unavailable_capability_diagnostic)
                .collect(),
        )
    }

    /// Returns diagnostics for unsupported or unavailable capability records.
    #[must_use]
    pub fn unsupported_diagnostics(&self) -> DiagnosticReport {
        DiagnosticReport::from_diagnostics(
            self.capabilities()
                .into_iter()
                .filter(|capability| capability.status().should_diagnose_attempt())
                .map(unsupported_operation_diagnostic)
                .collect(),
        )
    }
}

/// Inspection payload attached to adapter inspection operations.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdapterInspectionPayload {
    profile: AdapterRuntimeProfile,
    adapters: Vec<AdapterDescriptor>,
}

impl AdapterInspectionPayload {
    /// Creates an inspection payload from a registry.
    #[must_use]
    pub fn from_registry(registry: &CapabilityRegistry) -> Self {
        Self {
            profile: registry.profile(),
            adapters: registry.adapters().to_vec(),
        }
    }

    /// Returns the inspected runtime profile.
    #[must_use]
    pub const fn profile(&self) -> AdapterRuntimeProfile {
        self.profile
    }

    /// Returns adapter descriptors.
    #[must_use]
    pub fn adapters(&self) -> &[AdapterDescriptor] {
        &self.adapters
    }

    /// Returns all capabilities in deterministic adapter order.
    #[must_use]
    pub fn capabilities(&self) -> Vec<&ProviderCapability> {
        self.adapters
            .iter()
            .flat_map(AdapterDescriptor::capabilities)
            .collect()
    }

    /// Renders a stable human-facing summary.
    #[must_use]
    pub fn render_human(&self) -> String {
        let mut output = format!("adapter profile: {}\n", self.profile());

        for adapter in self.adapters() {
            output.push_str("- adapter ");
            output.push_str(adapter.provider_id().as_str());
            output.push_str(" (");
            output.push_str(adapter.label());
            output.push_str("): ");
            output.push_str(adapter.boundary().as_str());
            output.push('\n');

            for capability in adapter.capabilities() {
                output.push_str("  - ");
                output.push_str(capability.operation().as_str());
                output.push_str(": ");
                output.push_str(&capability.status().to_string());
                output.push_str(", dry-run ");
                output.push_str(capability.dry_run().as_str());
                output.push('\n');
            }
        }

        output
    }
}

/// Returns a mock capability registry for a runtime profile.
///
/// The mock registries are deterministic, credential-free, and intended to
/// verify interface behavior before real provider SDKs are introduced.
#[must_use]
pub fn mock_registry(profile: AdapterRuntimeProfile) -> CapabilityRegistry {
    let adapters = match profile {
        AdapterRuntimeProfile::LocalOnly => local_only_adapters(),
        AdapterRuntimeProfile::TpmLike => tpm_like_adapters(),
        AdapterRuntimeProfile::ComplexPublisher => complex_publisher_adapters(),
    };

    CapabilityRegistry::new(profile, adapters)
}

/// Creates an actionable unsupported-operation diagnostic for a capability.
#[must_use]
pub fn unsupported_operation_diagnostic(capability: &ProviderCapability) -> Diagnostic {
    let message = format!(
        "Provider `{}` cannot run `{}` because capability status is `{}`.",
        capability.provider_id(),
        capability.operation(),
        capability.status()
    );
    let remediation = capability
        .remediation()
        .unwrap_or("Choose a provider that supports this operation or change the workflow.");

    Diagnostic::new(
        static_diagnostic_code("TPM-ADAPTER-UNSUPPORTED-OPERATION"),
        Severity::Error,
        message,
    )
    .with_remediation(remediation)
}

fn unavailable_capability_diagnostic(capability: &ProviderCapability) -> Diagnostic {
    let remediation = capability
        .remediation()
        .unwrap_or("Use a different provider, connect credentials, or choose another workflow.");
    Diagnostic::new(
        static_diagnostic_code("TPM-ADAPTER-CAPABILITY-UNAVAILABLE"),
        Severity::Warning,
        format!(
            "Provider `{}` reports `{}` as `{}`.",
            capability.provider_id(),
            capability.operation(),
            capability.status()
        ),
    )
    .with_remediation(remediation)
    .with_developer_message(format!(
        "family={}, behavior={:?}",
        capability.family(),
        capability.action_behavior()
    ))
}

fn local_only_adapters() -> Vec<AdapterDescriptor> {
    vec![
        local_source_adapter(),
        local_history_adapter(),
        local_media_adapter(),
        local_workflow_adapter(),
        local_build_adapter(),
        manual_deploy_adapter(),
        local_identity_adapter(),
        local_diagnostics_adapter(),
        local_observability_adapter(),
    ]
}

fn tpm_like_adapters() -> Vec<AdapterDescriptor> {
    vec![
        local_source_adapter(),
        git_history_adapter(),
        repo_media_adapter(),
        github_review_adapter(),
        local_build_adapter(),
        cloudflare_deploy_adapter(),
        provider_identity_adapter(
            "github-identity",
            "GitHub Identity",
            AdapterBoundary::Bundled,
        ),
        provider_identity_adapter(
            "cloudflare-identity",
            "Cloudflare Identity",
            AdapterBoundary::Bundled,
        ),
        local_diagnostics_adapter(),
        cloudflare_observability_adapter(),
    ]
}

fn complex_publisher_adapters() -> Vec<AdapterDescriptor> {
    vec![
        content_api_source_adapter(),
        enterprise_history_adapter(),
        dam_media_adapter(),
        enterprise_workflow_adapter(),
        remote_build_adapter(),
        enterprise_deploy_adapter(),
        provider_identity_adapter(
            "enterprise-identity",
            "Enterprise Identity",
            AdapterBoundary::ThirdParty,
        ),
        local_diagnostics_adapter(),
        enterprise_observability_adapter(),
    ]
}

fn local_source_adapter() -> AdapterDescriptor {
    let provider = provider_id("local-source");
    AdapterDescriptor::new(
        provider.clone(),
        "Local source workspace",
        AdapterBoundary::Default,
        vec![
            supported(provider.clone(), CapabilityOperation::SourceReadWorkspace)
                .with_outputs(["source references", "source inventory"]),
            supported(provider.clone(), CapabilityOperation::SourceWriteDraft)
                .with_destructive_behavior(DestructiveBehavior::SourceWrite)
                .with_dry_run(DryRunSupport::Supported)
                .with_outputs(["source patch"]),
            supported(provider.clone(), CapabilityOperation::SourceWritePatch)
                .with_destructive_behavior(DestructiveBehavior::SourceWrite)
                .with_dry_run(DryRunSupport::Supported)
                .with_outputs(["source patch"]),
            supported(provider.clone(), CapabilityOperation::SourceDiff)
                .with_outputs(["source diff"]),
            supported(provider.clone(), CapabilityOperation::SourceExport)
                .with_outputs(["portable source snapshot"]),
            unsupported(provider.clone(), CapabilityOperation::SourceImport)
                .with_remediation("Use the future import adapter or copy source files manually.")
                .with_unsupported_behavior(UnsupportedBehavior::ExplicitEscapeHatch),
            unsupported(provider, CapabilityOperation::SourceConflictDetection)
                .with_remediation("Enable a history or sync provider to detect conflicts."),
        ],
    )
}

fn local_history_adapter() -> AdapterDescriptor {
    let provider = provider_id("local-history");
    AdapterDescriptor::new(
        provider.clone(),
        "Local restore points",
        AdapterBoundary::Default,
        vec![
            partial(
                provider.clone(),
                CapabilityOperation::HistoryCreateRestorePoint,
            )
            .with_destructive_behavior(DestructiveBehavior::LocalWrite)
            .with_outputs(["restore point"]),
            partial(provider.clone(), CapabilityOperation::HistoryListVersions)
                .with_outputs(["local versions"]),
            unsupported(provider.clone(), CapabilityOperation::HistoryDiffVersions)
                .with_remediation("Enable Git-like history to diff arbitrary versions."),
            partial(provider.clone(), CapabilityOperation::HistoryRestoreVersion)
                .with_dry_run(DryRunSupport::Supported)
                .with_reversibility(Reversibility::Manual)
                .with_destructive_behavior(DestructiveBehavior::SourceWrite)
                .with_outputs(["restore plan"]),
            unsupported(
                provider.clone(),
                CapabilityOperation::HistorySubmitForReview,
            )
            .with_remediation("Solo local publishing does not require review."),
            unsupported(provider, CapabilityOperation::HistoryApproveReview)
                .with_remediation("Enable a workflow adapter before using review approvals."),
        ],
    )
}

fn git_history_adapter() -> AdapterDescriptor {
    let provider = provider_id("git-history");
    AdapterDescriptor::new(
        provider.clone(),
        "Git history",
        AdapterBoundary::Optional,
        vec![
            supported(provider.clone(), CapabilityOperation::HistoryCreateRestorePoint)
                .with_destructive_behavior(DestructiveBehavior::LocalWrite)
                .with_outputs(["commit or restore point"]),
            supported(provider.clone(), CapabilityOperation::HistoryListVersions)
                .with_outputs(["version references"]),
            supported(provider.clone(), CapabilityOperation::HistoryDiffVersions)
                .with_outputs(["source diff"]),
            supported(provider.clone(), CapabilityOperation::HistoryRestoreVersion)
                .with_dry_run(DryRunSupport::Supported)
                .with_reversibility(Reversibility::Automatic)
                .with_destructive_behavior(DestructiveBehavior::SourceWrite)
                .with_outputs(["restore plan"]),
            manual(provider.clone(), CapabilityOperation::HistorySubmitForReview)
                .with_manual_step(ManualStep::new(
                    "Open review",
                    "Use a configured review provider such as GitHub when collaborative review is desired.",
                )),
            manual(provider, CapabilityOperation::HistoryApproveReview).with_manual_step(
                ManualStep::new(
                    "Approve review",
                    "Approve through the configured review provider.",
                ),
            ),
        ],
    )
}

fn repo_media_adapter() -> AdapterDescriptor {
    let provider = provider_id("repo-media");
    AdapterDescriptor::new(
        provider.clone(),
        "Repository media assets",
        AdapterBoundary::Default,
        media_capabilities(provider, true),
    )
}

fn local_media_adapter() -> AdapterDescriptor {
    let provider = provider_id("local-media");
    AdapterDescriptor::new(
        provider.clone(),
        "Local media assets",
        AdapterBoundary::Default,
        media_capabilities(provider, false),
    )
}

fn dam_media_adapter() -> AdapterDescriptor {
    let provider = provider_id("external-dam");
    let mut capabilities = media_capabilities(provider.clone(), true);
    capabilities.retain(|capability| {
        capability.operation() != CapabilityOperation::MediaMaterializeBuildInput
    });
    capabilities.push(
        partial(provider, CapabilityOperation::MediaMaterializeBuildInput)
            .with_outputs(["materialization manifest", "cache key"])
            .with_remediation(
                "Confirm the DAM adapter can materialize optimized build inputs before preview.",
            ),
    );

    AdapterDescriptor::new(
        provider_id("external-dam"),
        "External DAM media",
        AdapterBoundary::ThirdParty,
        capabilities,
    )
}

fn media_capabilities(provider: ProviderId, supports_write: bool) -> Vec<ProviderCapability> {
    let write_status = if supports_write {
        CapabilityStatus::Supported
    } else {
        CapabilityStatus::Unsupported
    };

    vec![
        supported(provider.clone(), CapabilityOperation::MediaResolve)
            .with_outputs(["media reference", "media metadata"]),
        ProviderCapability::new(
            provider.clone(),
            CapabilityOperation::MediaUpload,
            write_status,
        )
        .with_destructive_behavior(DestructiveBehavior::SourceWrite)
        .with_outputs(["media reference"])
        .with_remediation("Choose a writable media provider before uploading assets."),
        ProviderCapability::new(
            provider.clone(),
            CapabilityOperation::MediaRelink,
            write_status,
        )
        .with_dry_run(DryRunSupport::Supported)
        .with_destructive_behavior(DestructiveBehavior::SourceWrite)
        .with_outputs(["source patch"])
        .with_remediation("Choose a writable media provider before relinking assets."),
        supported(
            provider.clone(),
            CapabilityOperation::MediaMaterializeBuildInput,
        )
        .with_outputs(["materialized asset", "source hash", "cache key"]),
        supported(provider.clone(), CapabilityOperation::MediaInspectUsage)
            .with_outputs(["usage report"]),
        partial(provider.clone(), CapabilityOperation::MediaMigrateStorage)
            .with_dry_run(DryRunSupport::Supported)
            .with_reversibility(Reversibility::Manual)
            .with_outputs(["migration plan", "cache invalidation plan"]),
        ProviderCapability::new(
            provider.clone(),
            CapabilityOperation::MediaDelete,
            write_status,
        )
        .with_destructive_behavior(DestructiveBehavior::Destructive)
        .with_reversibility(Reversibility::Manual)
        .with_remediation("Choose a writable media provider before deleting assets."),
        supported(provider.clone(), CapabilityOperation::MediaOptimize)
            .with_outputs(["optimized derivative"]),
        supported(provider, CapabilityOperation::MediaCache)
            .with_outputs(["cache key", "invalidation hint"]),
    ]
}

fn local_workflow_adapter() -> AdapterDescriptor {
    let provider = provider_id("direct-workflow");
    AdapterDescriptor::new(
        provider.clone(),
        "Direct publish workflow",
        AdapterBoundary::Default,
        vec![
            supported(provider.clone(), CapabilityOperation::WorkflowSaveDraft)
                .with_destructive_behavior(DestructiveBehavior::SourceWrite),
            unsupported(
                provider.clone(),
                CapabilityOperation::WorkflowSubmitForReview,
            )
            .with_remediation("Solo local publishing does not require review."),
            unsupported(provider.clone(), CapabilityOperation::WorkflowApprove)
                .with_remediation("Enable a review workflow before approving changes."),
            unsupported(
                provider.clone(),
                CapabilityOperation::WorkflowRequestChanges,
            )
            .with_remediation("Enable a review workflow before requesting changes."),
            ProviderCapability::new(
                provider,
                CapabilityOperation::WorkflowSchedule,
                CapabilityStatus::DisabledByPolicy,
            )
            .with_remediation("Enable a scheduling workflow policy before scheduling."),
        ],
    )
}

fn github_review_adapter() -> AdapterDescriptor {
    let provider = provider_id("github-review");
    AdapterDescriptor::new(
        provider.clone(),
        "GitHub review workflow",
        AdapterBoundary::Optional,
        vec![
            supported(provider.clone(), CapabilityOperation::WorkflowSaveDraft)
                .with_destructive_behavior(DestructiveBehavior::SourceWrite),
            supported(
                provider.clone(),
                CapabilityOperation::WorkflowSubmitForReview,
            )
            .with_credentials(
                CredentialRequirement::Required,
                vec![
                    CredentialScope::WorkflowTransition,
                    CredentialScope::SourceWrite,
                ],
            )
            .with_dry_run(DryRunSupport::Supported)
            .with_outputs(["review reference"]),
            supported(provider.clone(), CapabilityOperation::WorkflowApprove)
                .with_credentials(
                    CredentialRequirement::Required,
                    vec![CredentialScope::WorkflowTransition],
                )
                .with_audit(AuditRequirement::Provider),
            supported(
                provider.clone(),
                CapabilityOperation::WorkflowRequestChanges,
            )
            .with_credentials(
                CredentialRequirement::Required,
                vec![CredentialScope::WorkflowTransition],
            )
            .with_audit(AuditRequirement::Provider),
            unsupported(provider, CapabilityOperation::WorkflowSchedule)
                .with_remediation("Use a scheduling-capable workflow adapter."),
        ],
    )
}

fn enterprise_workflow_adapter() -> AdapterDescriptor {
    let provider = provider_id("enterprise-workflow");
    AdapterDescriptor::new(
        provider.clone(),
        "Enterprise workflow",
        AdapterBoundary::ThirdParty,
        vec![
            supported(provider.clone(), CapabilityOperation::WorkflowSaveDraft),
            supported(
                provider.clone(),
                CapabilityOperation::WorkflowSubmitForReview,
            )
            .with_credentials(
                CredentialRequirement::Required,
                vec![CredentialScope::WorkflowTransition],
            )
            .with_audit(AuditRequirement::Provider),
            supported(provider.clone(), CapabilityOperation::WorkflowApprove)
                .with_credentials(
                    CredentialRequirement::Required,
                    vec![CredentialScope::WorkflowTransition],
                )
                .with_audit(AuditRequirement::Provider),
            supported(
                provider.clone(),
                CapabilityOperation::WorkflowRequestChanges,
            )
            .with_credentials(
                CredentialRequirement::Required,
                vec![CredentialScope::WorkflowTransition],
            )
            .with_audit(AuditRequirement::Provider),
            supported(provider, CapabilityOperation::WorkflowSchedule)
                .with_credentials(
                    CredentialRequirement::Required,
                    vec![CredentialScope::WorkflowTransition],
                )
                .with_audit(AuditRequirement::Provider),
        ],
    )
}

fn local_build_adapter() -> AdapterDescriptor {
    let provider = provider_id("local-build");
    AdapterDescriptor::new(
        provider.clone(),
        "Local static build",
        AdapterBoundary::Default,
        vec![
            supported(provider.clone(), CapabilityOperation::BuildDiagnosticsCheck)
                .with_outputs(["diagnostics"]),
            supported(provider.clone(), CapabilityOperation::BuildPreview)
                .with_dry_run(DryRunSupport::Supported)
                .with_outputs(["preview artifact"]),
            supported(provider.clone(), CapabilityOperation::BuildFull)
                .with_outputs(["static artifacts", "release manifest"]),
            supported(provider, CapabilityOperation::BuildVerifyArtifacts)
                .with_outputs(["verification report"]),
        ],
    )
}

fn remote_build_adapter() -> AdapterDescriptor {
    let provider = provider_id("remote-build");
    AdapterDescriptor::new(
        provider.clone(),
        "Remote build service",
        AdapterBoundary::ThirdParty,
        vec![
            supported(provider.clone(), CapabilityOperation::BuildDiagnosticsCheck)
                .with_credentials(
                    CredentialRequirement::Required,
                    vec![CredentialScope::BuildRun],
                ),
            partial(provider.clone(), CapabilityOperation::BuildPreview)
                .with_credentials(
                    CredentialRequirement::Required,
                    vec![CredentialScope::BuildRun],
                )
                .with_outputs(["remote preview reference"]),
            supported(provider.clone(), CapabilityOperation::BuildFull)
                .with_credentials(
                    CredentialRequirement::Required,
                    vec![CredentialScope::BuildRun],
                )
                .with_outputs(["remote build artifact"]),
            supported(provider, CapabilityOperation::BuildVerifyArtifacts)
                .with_outputs(["verification report"]),
        ],
    )
}

fn manual_deploy_adapter() -> AdapterDescriptor {
    let provider = provider_id("manual-deploy");
    AdapterDescriptor::new(
        provider.clone(),
        "Manual deploy",
        AdapterBoundary::Default,
        vec![
            manual(provider.clone(), CapabilityOperation::DeployCheck),
            manual(provider.clone(), CapabilityOperation::DeployPreview),
            manual(provider.clone(), CapabilityOperation::DeployPublish)
                .with_dry_run(DryRunSupport::Supported)
                .with_manual_step(ManualStep::new(
                    "Publish manually",
                    "Build static output and upload it to the chosen host.",
                )),
            manual(provider.clone(), CapabilityOperation::DeployRollback).with_manual_step(
                ManualStep::new(
                    "Rollback manually",
                    "Restore a previous generated output and publish it through the chosen host.",
                ),
            ),
            manual(provider.clone(), CapabilityOperation::DeployCachePolicy),
            manual(provider, CapabilityOperation::DeployDomainStatus),
        ],
    )
}

fn cloudflare_deploy_adapter() -> AdapterDescriptor {
    let provider = provider_id("cloudflare-deploy");
    AdapterDescriptor::new(
        provider.clone(),
        "Cloudflare deploy",
        AdapterBoundary::Bundled,
        vec![
            supported(provider.clone(), CapabilityOperation::DeployCheck)
                .with_credentials(
                    CredentialRequirement::Required,
                    vec![CredentialScope::DeployRead],
                )
                .with_outputs(["provider readiness report"]),
            supported(provider.clone(), CapabilityOperation::DeployPreview)
                .with_credentials(
                    CredentialRequirement::Required,
                    vec![CredentialScope::DeployWrite],
                )
                .with_dry_run(DryRunSupport::Supported)
                .with_outputs(["preview URL"]),
            supported(provider.clone(), CapabilityOperation::DeployPublish)
                .with_credentials(
                    CredentialRequirement::Required,
                    vec![CredentialScope::DeployWrite],
                )
                .with_dry_run(DryRunSupport::Supported)
                .with_reversibility(Reversibility::Manual)
                .with_destructive_behavior(DestructiveBehavior::Publish)
                .with_audit(AuditRequirement::Provider)
                .with_outputs(["public URL", "deploy ID"]),
            partial(provider.clone(), CapabilityOperation::DeployRollback)
                .with_credentials(
                    CredentialRequirement::Required,
                    vec![CredentialScope::DeployWrite],
                )
                .with_dry_run(DryRunSupport::Supported)
                .with_reversibility(Reversibility::Partial)
                .with_outputs(["rollback plan"]),
            supported(provider.clone(), CapabilityOperation::DeployCachePolicy).with_credentials(
                CredentialRequirement::Required,
                vec![CredentialScope::DeployWrite],
            ),
            supported(provider, CapabilityOperation::DeployDomainStatus)
                .with_credentials(
                    CredentialRequirement::Required,
                    vec![CredentialScope::DeployRead],
                )
                .with_outputs(["domain status"]),
        ],
    )
}

fn enterprise_deploy_adapter() -> AdapterDescriptor {
    let provider = provider_id("enterprise-deploy");
    AdapterDescriptor::new(
        provider.clone(),
        "Enterprise deploy",
        AdapterBoundary::ThirdParty,
        vec![
            supported(provider.clone(), CapabilityOperation::DeployCheck),
            supported(provider.clone(), CapabilityOperation::DeployPreview),
            supported(provider.clone(), CapabilityOperation::DeployPublish)
                .with_credentials(
                    CredentialRequirement::Required,
                    vec![CredentialScope::DeployWrite],
                )
                .with_dry_run(DryRunSupport::Supported)
                .with_audit(AuditRequirement::LocalAndProvider),
            partial(provider.clone(), CapabilityOperation::DeployRollback)
                .with_dry_run(DryRunSupport::Partial)
                .with_reversibility(Reversibility::Partial),
            supported(provider.clone(), CapabilityOperation::DeployCachePolicy),
            supported(provider, CapabilityOperation::DeployDomainStatus),
        ],
    )
}

fn local_identity_adapter() -> AdapterDescriptor {
    let provider = provider_id("local-identity");
    AdapterDescriptor::new(
        provider.clone(),
        "Local identity",
        AdapterBoundary::Default,
        vec![
            supported(provider.clone(), CapabilityOperation::IdentityListContext)
                .with_outputs(["local actor"]),
            unsupported(provider.clone(), CapabilityOperation::IdentityAuthenticate)
                .with_remediation(
                    "Local-only publishing does not require provider authentication.",
                ),
            unsupported(
                provider.clone(),
                CapabilityOperation::IdentityTestConnection,
            )
            .with_remediation("No provider connection is configured for local-only publishing."),
            unsupported(provider, CapabilityOperation::IdentityRevoke)
                .with_remediation("No provider credential exists to revoke."),
        ],
    )
}

fn provider_identity_adapter(
    id: &'static str,
    label: &'static str,
    boundary: AdapterBoundary,
) -> AdapterDescriptor {
    let provider = provider_id(id);
    AdapterDescriptor::new(
        provider.clone(),
        label,
        boundary,
        vec![
            ProviderCapability::new(
                provider.clone(),
                CapabilityOperation::IdentityAuthenticate,
                CapabilityStatus::UnknownUntilAuthenticated,
            )
            .with_credentials(
                CredentialRequirement::UnknownUntilAuthenticated,
                vec![CredentialScope::IdentityRead],
            )
            .with_outputs(["credential reference"]),
            ProviderCapability::new(
                provider.clone(),
                CapabilityOperation::IdentityTestConnection,
                CapabilityStatus::UnknownUntilAuthenticated,
            )
            .with_credentials(
                CredentialRequirement::UnknownUntilAuthenticated,
                vec![CredentialScope::IdentityRead],
            )
            .with_outputs(["connection health"]),
            supported(provider.clone(), CapabilityOperation::IdentityListContext)
                .with_credentials(
                    CredentialRequirement::Required,
                    vec![CredentialScope::IdentityRead],
                )
                .with_outputs(["account context"]),
            supported(provider, CapabilityOperation::IdentityRevoke)
                .with_credentials(
                    CredentialRequirement::Required,
                    vec![CredentialScope::IdentityRead],
                )
                .with_audit(AuditRequirement::Provider),
        ],
    )
}

fn local_diagnostics_adapter() -> AdapterDescriptor {
    let provider = provider_id("platform-diagnostics");
    AdapterDescriptor::new(
        provider.clone(),
        "Platform diagnostics",
        AdapterBoundary::Core,
        vec![
            supported(
                provider.clone(),
                CapabilityOperation::DiagnosticsNormalizeLogs,
            )
            .with_outputs(["diagnostic records"]),
            supported(
                provider.clone(),
                CapabilityOperation::DiagnosticsAttachSourceReferences,
            )
            .with_outputs(["sourceable diagnostics"]),
            unsupported(provider, CapabilityOperation::DiagnosticsImportProvider)
                .with_remediation("Connect a provider diagnostics adapter before importing logs."),
        ],
    )
}

fn local_observability_adapter() -> AdapterDescriptor {
    let provider = provider_id("local-observability");
    AdapterDescriptor::new(
        provider.clone(),
        "Local observability",
        AdapterBoundary::Default,
        vec![
            ProviderCapability::new(
                provider.clone(),
                CapabilityOperation::ObservabilityImportAnalytics,
                CapabilityStatus::RequiresExtension,
            )
            .with_remediation("Enable an analytics provider extension before importing analytics."),
            unsupported(
                provider.clone(),
                CapabilityOperation::ObservabilityImportCrawlErrors,
            )
            .with_remediation(
                "Connect a crawl diagnostics provider before importing crawl errors.",
            ),
            ProviderCapability::new(
                provider.clone(),
                CapabilityOperation::ObservabilityImportPerformance,
                CapabilityStatus::RequiresExtension,
            )
            .with_remediation(
                "Enable a performance data provider extension before importing metrics.",
            ),
            partial(provider, CapabilityOperation::ObservabilityReleaseHealth)
                .with_outputs(["local release health"]),
        ],
    )
}

fn cloudflare_observability_adapter() -> AdapterDescriptor {
    let provider = provider_id("cloudflare-observability");
    AdapterDescriptor::new(
        provider.clone(),
        "Cloudflare observability",
        AdapterBoundary::Bundled,
        vec![
            partial(
                provider.clone(),
                CapabilityOperation::ObservabilityImportAnalytics,
            )
            .with_credentials(
                CredentialRequirement::Required,
                vec![CredentialScope::ObservabilityRead],
            )
            .with_outputs(["observability report"]),
            unsupported(
                provider.clone(),
                CapabilityOperation::ObservabilityImportCrawlErrors,
            )
            .with_remediation("Connect a search-console provider before importing crawl errors."),
            partial(
                provider.clone(),
                CapabilityOperation::ObservabilityImportPerformance,
            )
            .with_credentials(
                CredentialRequirement::Required,
                vec![CredentialScope::ObservabilityRead],
            )
            .with_outputs(["performance report", "sourceable diagnostics"]),
            supported(provider, CapabilityOperation::ObservabilityReleaseHealth)
                .with_outputs(["release health report"]),
        ],
    )
}

fn enterprise_observability_adapter() -> AdapterDescriptor {
    let provider = provider_id("enterprise-observability");
    AdapterDescriptor::new(
        provider.clone(),
        "Enterprise observability",
        AdapterBoundary::ThirdParty,
        vec![
            supported(
                provider.clone(),
                CapabilityOperation::ObservabilityImportAnalytics,
            )
            .with_credentials(
                CredentialRequirement::Required,
                vec![CredentialScope::ObservabilityRead],
            )
            .with_outputs(["observability report"]),
            supported(
                provider.clone(),
                CapabilityOperation::ObservabilityImportCrawlErrors,
            )
            .with_credentials(
                CredentialRequirement::Required,
                vec![CredentialScope::ObservabilityRead],
            )
            .with_outputs(["crawl diagnostics", "sourceable diagnostics"]),
            supported(
                provider.clone(),
                CapabilityOperation::ObservabilityImportPerformance,
            )
            .with_credentials(
                CredentialRequirement::Required,
                vec![CredentialScope::ObservabilityRead],
            )
            .with_outputs(["performance report", "sourceable diagnostics"]),
            supported(provider, CapabilityOperation::ObservabilityReleaseHealth)
                .with_outputs(["release health report"]),
        ],
    )
}

fn content_api_source_adapter() -> AdapterDescriptor {
    let provider = provider_id("content-api-source");
    AdapterDescriptor::new(
        provider.clone(),
        "Content API source",
        AdapterBoundary::ThirdParty,
        vec![
            supported(provider.clone(), CapabilityOperation::SourceReadWorkspace),
            supported(provider.clone(), CapabilityOperation::SourceWriteDraft).with_credentials(
                CredentialRequirement::Required,
                vec![CredentialScope::SourceWrite],
            ),
            supported(provider.clone(), CapabilityOperation::SourceWritePatch).with_credentials(
                CredentialRequirement::Required,
                vec![CredentialScope::SourceWrite],
            ),
            supported(provider.clone(), CapabilityOperation::SourceDiff),
            supported(provider.clone(), CapabilityOperation::SourceExport),
            supported(provider.clone(), CapabilityOperation::SourceImport).with_credentials(
                CredentialRequirement::Required,
                vec![CredentialScope::SourceWrite],
            ),
            partial(provider, CapabilityOperation::SourceConflictDetection),
        ],
    )
}

fn enterprise_history_adapter() -> AdapterDescriptor {
    let provider = provider_id("enterprise-history");
    AdapterDescriptor::new(
        provider.clone(),
        "Enterprise history",
        AdapterBoundary::ThirdParty,
        vec![
            supported(
                provider.clone(),
                CapabilityOperation::HistoryCreateRestorePoint,
            ),
            supported(provider.clone(), CapabilityOperation::HistoryListVersions),
            supported(provider.clone(), CapabilityOperation::HistoryDiffVersions),
            supported(provider.clone(), CapabilityOperation::HistoryRestoreVersion)
                .with_dry_run(DryRunSupport::Supported),
            supported(
                provider.clone(),
                CapabilityOperation::HistorySubmitForReview,
            )
            .with_credentials(
                CredentialRequirement::Required,
                vec![CredentialScope::WorkflowTransition],
            ),
            supported(provider, CapabilityOperation::HistoryApproveReview).with_credentials(
                CredentialRequirement::Required,
                vec![CredentialScope::WorkflowTransition],
            ),
        ],
    )
}

fn supported(provider: ProviderId, operation: CapabilityOperation) -> ProviderCapability {
    ProviderCapability::new(provider, operation, CapabilityStatus::Supported)
}

fn partial(provider: ProviderId, operation: CapabilityOperation) -> ProviderCapability {
    ProviderCapability::new(provider, operation, CapabilityStatus::Partial)
}

fn manual(provider: ProviderId, operation: CapabilityOperation) -> ProviderCapability {
    ProviderCapability::new(provider, operation, CapabilityStatus::Manual)
        .with_unsupported_behavior(UnsupportedBehavior::ExplicitEscapeHatch)
}

fn unsupported(provider: ProviderId, operation: CapabilityOperation) -> ProviderCapability {
    ProviderCapability::new(provider, operation, CapabilityStatus::Unsupported)
        .with_unsupported_behavior(UnsupportedBehavior::DisabledWithExplanation)
}

fn strings(values: impl IntoIterator<Item = &'static str>) -> Vec<String> {
    values.into_iter().map(String::from).collect()
}

#[expect(
    clippy::expect_used,
    reason = "mock provider IDs are static repository invariants"
)]
fn provider_id(value: &'static str) -> ProviderId {
    ProviderId::parse(value).expect("mock provider ID should be valid")
}

#[expect(
    clippy::expect_used,
    reason = "adapter diagnostic codes are static repository invariants"
)]
fn static_diagnostic_code(value: &'static str) -> DiagnosticCode {
    DiagnosticCode::parse(value).expect("adapter diagnostic code should be valid")
}

#[cfg(test)]
mod tests {
    #![expect(
        clippy::expect_used,
        clippy::unwrap_used,
        reason = "adapter tests use static fixture IDs"
    )]

    use super::{
        AdapterBoundary, AdapterFamily, AdapterRuntimeProfile, AuditRequirement,
        CapabilityActionBehavior, CapabilityOperation, CapabilityStatus, CredentialReference,
        CredentialRequirement, CredentialScope, CredentialSecretReference, CredentialState,
        CredentialStorageProfile, CredentialSubject, DestructiveBehavior, DryRunSupport,
        ManualStep, ProviderCapability, ProviderId, ProviderIdError, Reversibility,
        UnsupportedBehavior, mock_registry,
    };
    use crate::OperationInterface;
    use std::collections::BTreeSet;
    use tpm_core::Severity;

    #[test]
    fn provider_ids_validate_stable_format() {
        assert_eq!(
            ProviderId::parse("local-source").unwrap().as_str(),
            "local-source"
        );
        assert!(ProviderId::parse("").is_err());
        assert!(ProviderId::parse("Local Source").is_err());
    }

    #[test]
    fn provider_ids_serialize_deserialize_and_report_validation_errors() {
        let provider = serde_json::from_str::<ProviderId>("\"cloudflare-deploy\"").unwrap();

        assert_eq!(provider.as_str(), "cloudflare-deploy");
        assert_eq!(
            serde_json::to_string(&provider).unwrap(),
            "\"cloudflare-deploy\""
        );
        assert_eq!(
            ProviderIdError::Empty.to_string(),
            "provider ID must not be empty"
        );
        assert_eq!(
            ProviderIdError::InvalidCharacter.to_string(),
            "provider ID may only contain ASCII lowercase letters, numbers, and hyphens"
        );
        assert!(
            serde_json::from_str::<ProviderId>("\"Cloudflare\"")
                .unwrap_err()
                .to_string()
                .contains("provider ID may only contain")
        );
    }

    #[test]
    fn adapter_family_display_labels_are_stable() {
        for (family, label) in [
            (AdapterFamily::Source, "source"),
            (AdapterFamily::History, "history"),
            (AdapterFamily::Media, "media"),
            (AdapterFamily::Workflow, "workflow"),
            (AdapterFamily::Build, "build"),
            (AdapterFamily::Deploy, "deploy"),
            (AdapterFamily::Identity, "identity"),
            (AdapterFamily::Credential, "credential"),
            (AdapterFamily::Diagnostics, "diagnostics"),
            (AdapterFamily::Observability, "observability"),
        ] {
            assert_eq!(family.to_string(), label);
        }
    }

    fn assert_capability_operation_labels(cases: &[(CapabilityOperation, AdapterFamily, &str)]) {
        for &(operation, family, label) in cases {
            assert_eq!(operation.family(), family);
            assert_eq!(operation.as_str(), label);
            assert_eq!(operation.to_string(), label);
        }
    }

    #[test]
    fn source_and_history_capability_operation_labels_are_stable() {
        assert_capability_operation_labels(&[
            (
                CapabilityOperation::SourceReadWorkspace,
                AdapterFamily::Source,
                "source-read-workspace",
            ),
            (
                CapabilityOperation::SourceWriteDraft,
                AdapterFamily::Source,
                "source-write-draft",
            ),
            (
                CapabilityOperation::SourceWritePatch,
                AdapterFamily::Source,
                "source-write-patch",
            ),
            (
                CapabilityOperation::SourceDiff,
                AdapterFamily::Source,
                "source-diff",
            ),
            (
                CapabilityOperation::SourceExport,
                AdapterFamily::Source,
                "source-export",
            ),
            (
                CapabilityOperation::SourceImport,
                AdapterFamily::Source,
                "source-import",
            ),
            (
                CapabilityOperation::SourceConflictDetection,
                AdapterFamily::Source,
                "source-conflict-detection",
            ),
            (
                CapabilityOperation::HistoryCreateRestorePoint,
                AdapterFamily::History,
                "history-create-restore-point",
            ),
            (
                CapabilityOperation::HistoryListVersions,
                AdapterFamily::History,
                "history-list-versions",
            ),
            (
                CapabilityOperation::HistoryDiffVersions,
                AdapterFamily::History,
                "history-diff-versions",
            ),
            (
                CapabilityOperation::HistoryRestoreVersion,
                AdapterFamily::History,
                "history-restore-version",
            ),
            (
                CapabilityOperation::HistorySubmitForReview,
                AdapterFamily::History,
                "history-submit-for-review",
            ),
            (
                CapabilityOperation::HistoryApproveReview,
                AdapterFamily::History,
                "history-approve-review",
            ),
        ]);
    }

    #[test]
    fn media_and_workflow_capability_operation_labels_are_stable() {
        assert_capability_operation_labels(&[
            (
                CapabilityOperation::MediaResolve,
                AdapterFamily::Media,
                "media-resolve",
            ),
            (
                CapabilityOperation::MediaUpload,
                AdapterFamily::Media,
                "media-upload",
            ),
            (
                CapabilityOperation::MediaRelink,
                AdapterFamily::Media,
                "media-relink",
            ),
            (
                CapabilityOperation::MediaMaterializeBuildInput,
                AdapterFamily::Media,
                "media-materialize-build-input",
            ),
            (
                CapabilityOperation::MediaInspectUsage,
                AdapterFamily::Media,
                "media-inspect-usage",
            ),
            (
                CapabilityOperation::MediaMigrateStorage,
                AdapterFamily::Media,
                "media-migrate-storage",
            ),
            (
                CapabilityOperation::MediaDelete,
                AdapterFamily::Media,
                "media-delete",
            ),
            (
                CapabilityOperation::MediaOptimize,
                AdapterFamily::Media,
                "media-optimize",
            ),
            (
                CapabilityOperation::MediaCache,
                AdapterFamily::Media,
                "media-cache",
            ),
            (
                CapabilityOperation::WorkflowSaveDraft,
                AdapterFamily::Workflow,
                "workflow-save-draft",
            ),
            (
                CapabilityOperation::WorkflowSubmitForReview,
                AdapterFamily::Workflow,
                "workflow-submit-for-review",
            ),
            (
                CapabilityOperation::WorkflowApprove,
                AdapterFamily::Workflow,
                "workflow-approve",
            ),
            (
                CapabilityOperation::WorkflowRequestChanges,
                AdapterFamily::Workflow,
                "workflow-request-changes",
            ),
            (
                CapabilityOperation::WorkflowSchedule,
                AdapterFamily::Workflow,
                "workflow-schedule",
            ),
        ]);
    }

    #[test]
    fn build_deploy_and_account_capability_operation_labels_are_stable() {
        assert_capability_operation_labels(&[
            (
                CapabilityOperation::BuildDiagnosticsCheck,
                AdapterFamily::Build,
                "build-diagnostics-check",
            ),
            (
                CapabilityOperation::BuildPreview,
                AdapterFamily::Build,
                "build-preview",
            ),
            (
                CapabilityOperation::BuildFull,
                AdapterFamily::Build,
                "build-full",
            ),
            (
                CapabilityOperation::BuildVerifyArtifacts,
                AdapterFamily::Build,
                "build-verify-artifacts",
            ),
            (
                CapabilityOperation::DeployCheck,
                AdapterFamily::Deploy,
                "deploy-check",
            ),
            (
                CapabilityOperation::DeployPreview,
                AdapterFamily::Deploy,
                "deploy-preview",
            ),
            (
                CapabilityOperation::DeployPublish,
                AdapterFamily::Deploy,
                "deploy-publish",
            ),
            (
                CapabilityOperation::DeployRollback,
                AdapterFamily::Deploy,
                "deploy-rollback",
            ),
            (
                CapabilityOperation::DeployCachePolicy,
                AdapterFamily::Deploy,
                "deploy-cache-policy",
            ),
            (
                CapabilityOperation::DeployDomainStatus,
                AdapterFamily::Deploy,
                "deploy-domain-status",
            ),
            (
                CapabilityOperation::IdentityAuthenticate,
                AdapterFamily::Identity,
                "identity-authenticate",
            ),
            (
                CapabilityOperation::IdentityTestConnection,
                AdapterFamily::Identity,
                "identity-test-connection",
            ),
            (
                CapabilityOperation::IdentityListContext,
                AdapterFamily::Identity,
                "identity-list-context",
            ),
            (
                CapabilityOperation::IdentityRevoke,
                AdapterFamily::Identity,
                "identity-revoke",
            ),
            (
                CapabilityOperation::CredentialResolveReference,
                AdapterFamily::Credential,
                "credential-resolve-reference",
            ),
            (
                CapabilityOperation::CredentialValidateScope,
                AdapterFamily::Credential,
                "credential-validate-scope",
            ),
        ]);
    }

    #[test]
    fn diagnostics_and_observability_capability_operation_labels_are_stable() {
        assert_capability_operation_labels(&[
            (
                CapabilityOperation::DiagnosticsImportProvider,
                AdapterFamily::Diagnostics,
                "diagnostics-import-provider",
            ),
            (
                CapabilityOperation::DiagnosticsNormalizeLogs,
                AdapterFamily::Diagnostics,
                "diagnostics-normalize-logs",
            ),
            (
                CapabilityOperation::DiagnosticsAttachSourceReferences,
                AdapterFamily::Diagnostics,
                "diagnostics-attach-source-references",
            ),
            (
                CapabilityOperation::ObservabilityImportAnalytics,
                AdapterFamily::Observability,
                "observability-import-analytics",
            ),
            (
                CapabilityOperation::ObservabilityImportCrawlErrors,
                AdapterFamily::Observability,
                "observability-import-crawl-errors",
            ),
            (
                CapabilityOperation::ObservabilityImportPerformance,
                AdapterFamily::Observability,
                "observability-import-performance",
            ),
            (
                CapabilityOperation::ObservabilityReleaseHealth,
                AdapterFamily::Observability,
                "observability-release-health",
            ),
        ]);
    }

    #[test]
    fn local_only_source_and_history_do_not_require_git() {
        let registry = mock_registry(AdapterRuntimeProfile::LocalOnly);
        let local_source = ProviderId::parse("local-source").unwrap();
        let local_history = ProviderId::parse("local-history").unwrap();

        assert_eq!(
            registry
                .find(&local_source, CapabilityOperation::SourceReadWorkspace)
                .expect("local source read should exist")
                .status(),
            CapabilityStatus::Supported
        );
        assert_eq!(
            registry
                .find(&local_history, CapabilityOperation::HistorySubmitForReview)
                .expect("local history review capability should exist")
                .status(),
            CapabilityStatus::Unsupported
        );
        assert!(
            registry
                .adapters()
                .iter()
                .all(|adapter| adapter.provider_id().as_str() != "git-history")
        );
    }

    #[test]
    fn tpm_like_profile_keeps_git_and_github_optional() {
        let registry = mock_registry(AdapterRuntimeProfile::TpmLike);
        let git_history = ProviderId::parse("git-history").unwrap();
        let github_review = ProviderId::parse("github-review").unwrap();

        assert_eq!(
            registry
                .find(&git_history, CapabilityOperation::HistoryRestoreVersion)
                .expect("git restore should exist")
                .status(),
            CapabilityStatus::Supported
        );
        assert_eq!(
            registry
                .find(&github_review, CapabilityOperation::WorkflowSubmitForReview)
                .expect("github review submit should exist")
                .credential_requirement(),
            CredentialRequirement::Required
        );
    }

    #[test]
    fn media_capabilities_model_materialization_and_cache() {
        let registry = mock_registry(AdapterRuntimeProfile::TpmLike);
        let repo_media = ProviderId::parse("repo-media").unwrap();
        let materialize = registry
            .find(&repo_media, CapabilityOperation::MediaMaterializeBuildInput)
            .expect("repo media materialization should exist");
        let cache = registry
            .find(&repo_media, CapabilityOperation::MediaCache)
            .expect("repo media cache should exist");

        assert_eq!(materialize.status(), CapabilityStatus::Supported);
        assert!(
            materialize
                .outputs()
                .iter()
                .any(|output| output == "source hash")
        );
        assert!(
            materialize
                .outputs()
                .iter()
                .any(|output| output == "cache key")
        );
        assert_eq!(cache.status(), CapabilityStatus::Supported);
    }

    #[test]
    fn local_media_reports_write_operations_as_unsupported() {
        let registry = mock_registry(AdapterRuntimeProfile::LocalOnly);
        let local_media = ProviderId::parse("local-media").unwrap();
        let upload = registry
            .find(&local_media, CapabilityOperation::MediaUpload)
            .expect("local media upload capability should exist");
        let delete = registry
            .find(&local_media, CapabilityOperation::MediaDelete)
            .expect("local media delete capability should exist");

        assert_eq!(upload.status(), CapabilityStatus::Unsupported);
        assert_eq!(delete.status(), CapabilityStatus::Unsupported);
        assert!(upload.remediation().is_some());
        assert!(delete.remediation().is_some());
    }

    #[test]
    fn media_migration_models_cache_invalidation_outputs() {
        let registry = mock_registry(AdapterRuntimeProfile::TpmLike);
        let repo_media = ProviderId::parse("repo-media").unwrap();
        let migration = registry
            .find(&repo_media, CapabilityOperation::MediaMigrateStorage)
            .expect("repo media migration capability should exist");

        assert_eq!(migration.status(), CapabilityStatus::Partial);
        assert_eq!(migration.dry_run(), DryRunSupport::Supported);
        assert!(
            migration
                .outputs()
                .iter()
                .any(|output| output == "cache invalidation plan")
        );
    }

    #[test]
    fn external_media_can_require_partial_materialization() {
        let registry = mock_registry(AdapterRuntimeProfile::ComplexPublisher);
        let external_dam = ProviderId::parse("external-dam").unwrap();
        let materialize = registry
            .find(
                &external_dam,
                CapabilityOperation::MediaMaterializeBuildInput,
            )
            .expect("external DAM materialization capability should exist");

        assert_eq!(materialize.status(), CapabilityStatus::Partial);
        assert!(materialize.remediation().is_some());
    }

    #[test]
    fn deploy_publish_requires_scoped_credentials() {
        let registry = mock_registry(AdapterRuntimeProfile::TpmLike);
        let cloudflare = ProviderId::parse("cloudflare-deploy").unwrap();
        let publish = registry
            .find(&cloudflare, CapabilityOperation::DeployPublish)
            .expect("cloudflare publish should exist");

        assert_eq!(
            publish.credential_requirement(),
            CredentialRequirement::Required
        );
        assert!(
            publish
                .credential_scopes()
                .contains(&CredentialScope::DeployWrite)
        );
    }

    #[test]
    fn local_workflow_keeps_review_optional_and_direct_publish_available() {
        let registry = mock_registry(AdapterRuntimeProfile::LocalOnly);
        let workflow = ProviderId::parse("direct-workflow").unwrap();
        let deploy = ProviderId::parse("manual-deploy").unwrap();
        let save_draft = registry
            .find(&workflow, CapabilityOperation::WorkflowSaveDraft)
            .expect("direct workflow save draft should exist");
        let submit_for_review = registry
            .find(&workflow, CapabilityOperation::WorkflowSubmitForReview)
            .expect("direct workflow review submit should exist");
        let manual_publish = registry
            .find(&deploy, CapabilityOperation::DeployPublish)
            .expect("manual deploy publish should exist");

        assert_eq!(save_draft.status(), CapabilityStatus::Supported);
        assert_eq!(
            save_draft.destructive_behavior(),
            DestructiveBehavior::SourceWrite
        );
        assert_eq!(submit_for_review.status(), CapabilityStatus::Unsupported);
        assert_eq!(manual_publish.status(), CapabilityStatus::Manual);
        assert_eq!(manual_publish.dry_run(), DryRunSupport::Supported);
        assert_eq!(manual_publish.manual_steps().len(), 1);
        assert_eq!(manual_publish.manual_steps()[0].title(), "Publish manually");
    }

    #[test]
    fn local_build_models_static_export_without_provider_truth() {
        let registry = mock_registry(AdapterRuntimeProfile::LocalOnly);
        let build = ProviderId::parse("local-build").unwrap();

        for operation in [
            CapabilityOperation::BuildDiagnosticsCheck,
            CapabilityOperation::BuildPreview,
            CapabilityOperation::BuildFull,
            CapabilityOperation::BuildVerifyArtifacts,
        ] {
            let capability = registry
                .find(&build, operation)
                .expect("local build capability should exist");

            assert_eq!(capability.status(), CapabilityStatus::Supported);
            assert_eq!(
                capability.credential_requirement(),
                CredentialRequirement::None
            );
        }

        let preview = registry
            .find(&build, CapabilityOperation::BuildPreview)
            .expect("local build preview should exist");
        let full = registry
            .find(&build, CapabilityOperation::BuildFull)
            .expect("local full build should exist");

        assert_eq!(preview.dry_run(), DryRunSupport::Supported);
        assert!(
            full.outputs()
                .iter()
                .any(|output| output == "static artifacts")
        );
        assert!(
            full.outputs()
                .iter()
                .any(|output| output == "release manifest")
        );
    }

    #[test]
    fn cloudflare_deploy_is_bundled_reference_adapter_not_core() {
        let registry = mock_registry(AdapterRuntimeProfile::TpmLike);
        let cloudflare_adapter = registry
            .adapters()
            .iter()
            .find(|adapter| adapter.provider_id().as_str() == "cloudflare-deploy")
            .expect("cloudflare deploy adapter should exist");
        let cloudflare = ProviderId::parse("cloudflare-deploy").unwrap();
        let publish = registry
            .find(&cloudflare, CapabilityOperation::DeployPublish)
            .expect("cloudflare publish should exist");
        let rollback = registry
            .find(&cloudflare, CapabilityOperation::DeployRollback)
            .expect("cloudflare rollback should exist");

        assert_eq!(cloudflare_adapter.boundary(), AdapterBoundary::Bundled);
        assert_eq!(publish.status(), CapabilityStatus::Supported);
        assert_eq!(
            publish.credential_requirement(),
            CredentialRequirement::Required
        );
        assert!(
            publish
                .credential_scopes()
                .contains(&CredentialScope::DeployWrite)
        );
        assert_eq!(publish.dry_run(), DryRunSupport::Supported);
        assert_eq!(publish.destructive_behavior(), DestructiveBehavior::Publish);
        assert_eq!(publish.reversibility(), Reversibility::Manual);
        assert_eq!(publish.audit_requirement(), AuditRequirement::Provider);
        assert_eq!(rollback.status(), CapabilityStatus::Partial);
        assert_eq!(rollback.dry_run(), DryRunSupport::Supported);
        assert_eq!(rollback.reversibility(), Reversibility::Partial);
    }

    #[test]
    fn enterprise_workflow_and_deploy_support_external_policy_engines() {
        let registry = mock_registry(AdapterRuntimeProfile::ComplexPublisher);
        let workflow = ProviderId::parse("enterprise-workflow").unwrap();
        let deploy = ProviderId::parse("enterprise-deploy").unwrap();
        let schedule = registry
            .find(&workflow, CapabilityOperation::WorkflowSchedule)
            .expect("enterprise workflow schedule should exist");
        let publish = registry
            .find(&deploy, CapabilityOperation::DeployPublish)
            .expect("enterprise deploy publish should exist");

        assert_eq!(schedule.status(), CapabilityStatus::Supported);
        assert_eq!(schedule.audit_requirement(), AuditRequirement::Provider);
        assert_eq!(publish.status(), CapabilityStatus::Supported);
        assert_eq!(publish.dry_run(), DryRunSupport::Supported);
        assert_eq!(
            publish.audit_requirement(),
            AuditRequirement::LocalAndProvider
        );
    }

    #[test]
    fn credential_references_serialize_without_secret_values() {
        let provider = ProviderId::parse("cloudflare-deploy").unwrap();
        let credential = CredentialReference::new(
            "cloudflare-deploy-publish",
            provider.clone(),
            CredentialSubject::Workspace,
            CredentialStorageProfile::DesktopKeychain,
            CredentialState::Connected,
            vec![CredentialScope::DeployWrite],
        )
        .with_secret_reference(CredentialSecretReference::new(
            "desktop-keychain-cloudflare-publish-handle",
        ));
        let output =
            serde_json::to_string(&credential).expect("credential reference should serialize");
        let secret =
            serde_json::from_str::<CredentialSecretReference>("\"runtime-handle\"").unwrap();
        let empty_secret = CredentialSecretReference::new("");

        assert_eq!(credential.id(), "cloudflare-deploy-publish");
        assert_eq!(credential.provider_id(), &provider);
        assert_eq!(credential.subject(), CredentialSubject::Workspace);
        assert_eq!(
            credential.storage(),
            CredentialStorageProfile::DesktopKeychain
        );
        assert_eq!(credential.state(), CredentialState::Connected);
        assert_eq!(credential.scopes(), &[CredentialScope::DeployWrite]);
        assert!(output.contains("\"secretReference\":\"[redacted]\""));
        assert!(!output.contains("desktop-keychain-cloudflare-publish-handle"));
        assert_eq!(
            credential.redacted_secret_reference(),
            Some(CredentialSecretReference::redacted())
        );
        assert_eq!(secret.to_string(), CredentialSecretReference::redacted());
        assert!(secret.has_runtime_handle());
        assert!(!empty_secret.has_runtime_handle());
    }

    #[test]
    fn identity_capabilities_expose_requirements_before_actions() {
        let registry = mock_registry(AdapterRuntimeProfile::TpmLike);
        let identity = ProviderId::parse("cloudflare-identity").unwrap();
        let authenticate = registry
            .find(&identity, CapabilityOperation::IdentityAuthenticate)
            .expect("cloudflare identity authentication capability should exist");
        let context = registry
            .find(&identity, CapabilityOperation::IdentityListContext)
            .expect("cloudflare identity context capability should exist");

        assert_eq!(
            authenticate.credential_requirement(),
            CredentialRequirement::UnknownUntilAuthenticated
        );
        assert!(
            authenticate
                .credential_scopes()
                .contains(&CredentialScope::IdentityRead)
        );
        assert!(
            authenticate
                .outputs()
                .iter()
                .any(|output| output == "credential reference")
        );
        assert_eq!(
            context.credential_requirement(),
            CredentialRequirement::Required
        );
    }

    #[test]
    fn diagnostics_and_observability_report_sourceable_outputs() {
        let registry = mock_registry(AdapterRuntimeProfile::ComplexPublisher);
        let diagnostics = ProviderId::parse("platform-diagnostics").unwrap();
        let observability = ProviderId::parse("enterprise-observability").unwrap();
        let attach = registry
            .find(
                &diagnostics,
                CapabilityOperation::DiagnosticsAttachSourceReferences,
            )
            .expect("source reference attachment should exist");
        let crawl_errors = registry
            .find(
                &observability,
                CapabilityOperation::ObservabilityImportCrawlErrors,
            )
            .expect("crawl diagnostics import should exist");

        assert_eq!(attach.status(), CapabilityStatus::Supported);
        assert!(
            attach
                .outputs()
                .iter()
                .any(|output| output == "sourceable diagnostics")
        );
        assert_eq!(crawl_errors.status(), CapabilityStatus::Supported);
        assert!(
            crawl_errors
                .credential_scopes()
                .contains(&CredentialScope::ObservabilityRead)
        );
        assert!(
            crawl_errors
                .outputs()
                .iter()
                .any(|output| output == "sourceable diagnostics")
        );
    }

    #[test]
    fn unsupported_diagnostics_are_actionable() {
        let registry = mock_registry(AdapterRuntimeProfile::LocalOnly);
        let diagnostics = registry.unsupported_diagnostics();
        let first = diagnostics.errors()[0];

        assert_eq!(first.code().as_str(), "TPM-ADAPTER-UNSUPPORTED-OPERATION");
        assert_eq!(first.severity(), Severity::Error);
        assert!(first.message().contains("cannot run"));
        assert!(first.remediation().is_some());
    }

    #[test]
    fn unavailable_capability_inventory_uses_non_blocking_diagnostics() {
        let registry = mock_registry(AdapterRuntimeProfile::LocalOnly);
        let diagnostics = registry.unavailable_capability_diagnostics();
        let first = diagnostics
            .warnings()
            .first()
            .copied()
            .expect("unavailable capability warning should exist");

        assert_eq!(first.code().as_str(), "TPM-ADAPTER-CAPABILITY-UNAVAILABLE");
        assert_eq!(first.severity(), Severity::Warning);
        assert!(!diagnostics.has_blocking());
        assert!(first.developer_message().is_some());
    }

    #[test]
    fn capability_action_behavior_maps_supported_and_unavailable_states() {
        let provider = ProviderId::parse("test-provider").unwrap();

        for (unsupported_behavior, action_behavior) in [
            (
                UnsupportedBehavior::Hidden,
                CapabilityActionBehavior::Hidden,
            ),
            (
                UnsupportedBehavior::DisabledWithExplanation,
                CapabilityActionBehavior::DisabledWithExplanation,
            ),
            (
                UnsupportedBehavior::RejectedWithDiagnostic,
                CapabilityActionBehavior::RejectedWithDiagnostic,
            ),
            (
                UnsupportedBehavior::ExplicitEscapeHatch,
                CapabilityActionBehavior::ExplicitEscapeHatch,
            ),
            (
                UnsupportedBehavior::Rerouted,
                CapabilityActionBehavior::Rerouted,
            ),
        ] {
            let capability = ProviderCapability::new(
                provider.clone(),
                CapabilityOperation::SourceImport,
                CapabilityStatus::Unsupported,
            )
            .with_unsupported_behavior(unsupported_behavior);

            assert_eq!(capability.action_behavior(), action_behavior);
        }

        assert_eq!(
            ProviderCapability::new(
                provider.clone(),
                CapabilityOperation::SourceReadWorkspace,
                CapabilityStatus::Supported,
            )
            .action_behavior(),
            CapabilityActionBehavior::Enabled
        );
        assert_eq!(
            ProviderCapability::new(
                provider.clone(),
                CapabilityOperation::DeployPublish,
                CapabilityStatus::Manual,
            )
            .action_behavior(),
            CapabilityActionBehavior::ManualSteps
        );
        assert_eq!(
            ProviderCapability::new(
                provider.clone(),
                CapabilityOperation::DeployRollback,
                CapabilityStatus::Partial,
            )
            .action_behavior(),
            CapabilityActionBehavior::Degraded
        );
        assert_eq!(
            ProviderCapability::new(
                provider.clone(),
                CapabilityOperation::IdentityAuthenticate,
                CapabilityStatus::UnknownUntilAuthenticated,
            )
            .action_behavior(),
            CapabilityActionBehavior::PromptAuthentication
        );
        assert_eq!(
            ProviderCapability::new(
                provider.clone(),
                CapabilityOperation::WorkflowSchedule,
                CapabilityStatus::DisabledByPolicy,
            )
            .action_behavior(),
            CapabilityActionBehavior::DisabledByPolicy
        );
        assert_eq!(
            ProviderCapability::new(
                provider,
                CapabilityOperation::ObservabilityImportAnalytics,
                CapabilityStatus::RequiresExtension,
            )
            .action_behavior(),
            CapabilityActionBehavior::RequiresExtension
        );
    }

    #[test]
    fn provider_capability_builder_preserves_public_contract_fields() {
        let provider = ProviderId::parse("review-provider").unwrap();
        let manual_step = ManualStep::new(
            "Open provider console",
            "Approve the queued review request in the external workflow.",
        );
        let capability = ProviderCapability::new(
            provider.clone(),
            CapabilityOperation::WorkflowSubmitForReview,
            CapabilityStatus::Partial,
        )
        .with_required_inputs(["source patch", "review target"])
        .with_outputs(["review request"])
        .with_credentials(
            CredentialRequirement::Required,
            vec![CredentialScope::WorkflowTransition],
        )
        .with_dry_run(DryRunSupport::Partial)
        .with_reversibility(Reversibility::Manual)
        .with_destructive_behavior(DestructiveBehavior::ProviderMutation)
        .with_audit(AuditRequirement::LocalAndProvider)
        .with_unsupported_behavior(UnsupportedBehavior::DisabledWithExplanation)
        .with_manual_step(manual_step)
        .with_remediation("Connect a review workflow provider.");

        assert_eq!(capability.provider_id(), &provider);
        assert_eq!(capability.family(), AdapterFamily::Workflow);
        assert_eq!(
            capability.operation(),
            CapabilityOperation::WorkflowSubmitForReview
        );
        assert_eq!(capability.status(), CapabilityStatus::Partial);
        assert_eq!(
            capability.required_inputs(),
            &["source patch".to_owned(), "review target".to_owned()]
        );
        assert_eq!(capability.outputs(), &["review request".to_owned()]);
        assert_eq!(
            capability.credential_scopes(),
            &[CredentialScope::WorkflowTransition]
        );
        assert_eq!(
            capability.credential_requirement(),
            CredentialRequirement::Required
        );
        assert_eq!(capability.dry_run(), DryRunSupport::Partial);
        assert_eq!(capability.reversibility(), Reversibility::Manual);
        assert_eq!(
            capability.destructive_behavior(),
            DestructiveBehavior::ProviderMutation
        );
        assert_eq!(
            capability.audit_requirement(),
            AuditRequirement::LocalAndProvider
        );
        assert_eq!(
            capability.unsupported_behavior(),
            UnsupportedBehavior::DisabledWithExplanation
        );
        assert_eq!(
            capability.supported_interfaces(),
            &[
                OperationInterface::Cli,
                OperationInterface::Gui,
                OperationInterface::Mcp,
                OperationInterface::Ci,
            ]
        );
        assert_eq!(
            capability.manual_steps()[0].title(),
            "Open provider console"
        );
        assert_eq!(
            capability.manual_steps()[0].description(),
            "Approve the queued review request in the external workflow."
        );
        assert_eq!(
            capability.remediation(),
            Some("Connect a review workflow provider.")
        );
    }

    #[test]
    fn stable_adapter_enum_display_labels_cover_all_variants() {
        for (support, label) in [
            (DryRunSupport::NotApplicable, "not-applicable"),
            (DryRunSupport::Supported, "supported"),
            (DryRunSupport::Unsupported, "unsupported"),
            (DryRunSupport::Partial, "partial"),
        ] {
            assert_eq!(support.as_str(), label);
            assert_eq!(support.to_string(), label);
        }

        for (boundary, label) in [
            (AdapterBoundary::Core, "core"),
            (AdapterBoundary::Bundled, "bundled"),
            (AdapterBoundary::Default, "default"),
            (AdapterBoundary::Optional, "optional"),
            (AdapterBoundary::Site, "site"),
            (AdapterBoundary::ThirdParty, "third-party"),
        ] {
            assert_eq!(boundary.as_str(), label);
            assert_eq!(boundary.to_string(), label);
        }
    }

    #[test]
    fn mock_profiles_cover_registry_status_fixtures() {
        let statuses = [
            AdapterRuntimeProfile::LocalOnly,
            AdapterRuntimeProfile::TpmLike,
            AdapterRuntimeProfile::ComplexPublisher,
        ]
        .into_iter()
        .flat_map(|profile| {
            mock_registry(profile)
                .capabilities()
                .into_iter()
                .map(ProviderCapability::status)
                .collect::<Vec<_>>()
        })
        .collect::<BTreeSet<_>>();

        for status in [
            CapabilityStatus::Supported,
            CapabilityStatus::Unsupported,
            CapabilityStatus::Manual,
            CapabilityStatus::Partial,
            CapabilityStatus::UnknownUntilAuthenticated,
            CapabilityStatus::DisabledByPolicy,
            CapabilityStatus::RequiresExtension,
        ] {
            assert!(
                statuses.contains(&status),
                "missing status fixture: {status:?}"
            );
        }
    }

    #[test]
    fn registry_queries_capabilities_by_family() {
        let registry = mock_registry(AdapterRuntimeProfile::TpmLike);
        let deploy_capabilities = registry.capabilities_for_family(AdapterFamily::Deploy);

        assert!(!deploy_capabilities.is_empty());
        assert!(
            deploy_capabilities
                .iter()
                .all(|capability| capability.family() == AdapterFamily::Deploy)
        );
    }

    #[test]
    fn complex_profile_has_enterprise_boundaries() {
        let registry = mock_registry(AdapterRuntimeProfile::ComplexPublisher);

        assert!(
            registry
                .adapters()
                .iter()
                .any(|adapter| adapter.provider_id().as_str() == "enterprise-workflow")
        );
        assert!(
            registry
                .adapters()
                .iter()
                .any(|adapter| adapter.provider_id().as_str() == "external-dam")
        );
    }
}
