//! Studio authoring, preview, release, publish, and verification operations.
//!
//! The operations in this module are deterministic product-core contracts for
//! the GUI, CLI, MCP, CI, and tests. They describe source-aware plans and
//! capability-aware authoring surfaces; they do not mutate source files or call
//! live providers.

use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tpm_core::Severity;
use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticReport};
use tpm_workspace::{
    SourceArtifact, SourceArtifactKind, WorkspaceContext, WorkspaceDiscoveryError,
};

use crate::{
    AdapterRuntimeProfile, CapabilityActionBehavior, CapabilityOperation, CapabilityRegistry,
    CapabilityStatus, CredentialReference, CredentialRequirement, CredentialSecretReference,
    CredentialState, CredentialStorageProfile, CredentialSubject, OperationId, OperationInterface,
    OperationPayload, OperationRequest, OperationResult, OperationStatus, OperationSummary,
    OperationTiming, ProviderId, mock_registry, unsupported_operation_diagnostic,
};

/// Operation payload for Milestone 12 Studio authoring and publish workflows.
///
/// The payload is intentionally broad enough to cover settings, content, media,
/// preview, release, publish, rollback, credential, audit, and verification
/// surfaces without creating separate GUI-only models.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudioAuthoringPayload {
    profile: AdapterRuntimeProfile,
    surfaces: Vec<StudioSurface>,
    settings: Vec<StudioSettingsField>,
    content: StudioContentWorkspace,
    media: StudioMediaLibrary,
    preview: StudioPreviewPlan,
    release: StudioReleaseManifest,
    publish: StudioPublishPlan,
    credentials: Vec<StudioCredentialSummary>,
    verification: Vec<StudioVerificationItem>,
}

impl StudioAuthoringPayload {
    /// Renders a stable human-facing summary.
    #[must_use]
    pub fn render_human(&self) -> String {
        format!(
            "\
studio profile: {}
studio surfaces: {}
settings fields: {}
content entries: {}
media entries: {}
preview modes: {}
publish actions: {}
",
            self.profile,
            self.surfaces.len(),
            self.settings.len(),
            self.content.entries.len(),
            self.media.entries.len(),
            self.preview.modes.len(),
            self.publish.provider_actions.len()
        )
    }

    fn from_workspace(workspace: &WorkspaceContext, registry: &CapabilityRegistry) -> Self {
        let config = read_site_config(workspace);
        let source_artifacts = workspace
            .inventory_source_artifacts()
            .map(|inventory| inventory.artifacts().to_vec())
            .unwrap_or_default();
        let content_entries = collect_content_entries(workspace, &source_artifacts);
        let media_entries = collect_media_entries(workspace, &source_artifacts);
        let settings = settings_fields(workspace, config.as_ref(), registry);
        let content_sources = content_workspace(content_entries, registry);
        let media = media_library(media_entries, registry);
        let preview = preview_plan(&content_sources, &media, workspace, registry);
        let release = release_manifest(&preview, workspace, registry);
        let credentials = credential_summaries(registry);
        let publish = publish_plan(&release, &credentials, registry);
        let verification =
            verification_items(&settings, &content_sources, &media, &preview, &publish);
        let surfaces = surfaces(
            &settings,
            &content_sources,
            &media,
            &preview,
            &release,
            &publish,
        );

        Self {
            profile: registry.profile(),
            surfaces,
            settings,
            content: content_sources,
            media,
            preview,
            release,
            publish,
            credentials,
            verification,
        }
    }
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioSurface {
    id: String,
    label: String,
    operation_id: String,
    status: StudioSurfaceStatus,
    summary: String,
    required_capabilities: Vec<StudioCapabilityEffect>,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
enum StudioSurfaceStatus {
    Ready,
    RequiresApproval,
    RequiresCredentials,
    Partial,
    Unsupported,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioCapabilityEffect {
    provider_id: ProviderId,
    operation: CapabilityOperation,
    status: CapabilityStatus,
    behavior: CapabilityActionBehavior,
    required: bool,
    remediation: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioSourceReference {
    domain: String,
    display_path: String,
    owner: String,
}

impl StudioSourceReference {
    fn new(domain: impl Into<String>, display_path: impl Into<String>) -> Self {
        Self {
            domain: domain.into(),
            display_path: display_path.into(),
            owner: String::from("workspace"),
        }
    }
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioSettingsField {
    id: String,
    label: String,
    input_kind: StudioInputKind,
    value: Option<String>,
    required: bool,
    visibility: StudioFieldVisibility,
    source: StudioSourceReference,
    generated_effects: Vec<String>,
    capabilities: Vec<StudioCapabilityEffect>,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
enum StudioInputKind {
    Boolean,
    Number,
    Text,
    Url,
    List,
    Object,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
enum StudioFieldVisibility {
    Beginner,
    Advanced,
    CodeOnly,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioContentWorkspace {
    entries: Vec<StudioContentEntry>,
    editor_document: Option<StudioEditorDocument>,
    draft_plan: StudioMutationPlan,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioContentEntry {
    id: String,
    title: String,
    domain: String,
    format: StudioDocumentFormat,
    source: StudioSourceReference,
    byte_count: usize,
    line_count: usize,
    status: StudioContentStatus,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
enum StudioDocumentFormat {
    Markdown,
    Mdx,
    Json,
    Unknown,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
enum StudioContentStatus {
    DraftPlanAvailable,
    SourceOnly,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioEditorDocument {
    source: StudioSourceReference,
    format: StudioDocumentFormat,
    source_preview: String,
    source_fidelity: String,
    diagnostics: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioMutationPlan {
    id: String,
    label: String,
    safety_class: StudioSafetyClass,
    mode: StudioPlanMode,
    source_diffs: Vec<StudioSourceDiff>,
    required_capabilities: Vec<StudioCapabilityEffect>,
    requires_approval: bool,
    audit_required: bool,
    steps: Vec<String>,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
enum StudioSafetyClass {
    ReadOnly,
    SourceWrite,
    ProviderMutation,
    Publish,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
enum StudioPlanMode {
    DryRun,
    RequiresApproval,
    Unsupported,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioSourceDiff {
    source: StudioSourceReference,
    summary: String,
    additions: usize,
    removals: usize,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioMediaLibrary {
    entries: Vec<StudioMediaEntry>,
    picker: Vec<StudioMediaPickerChoice>,
    materialization_plan: StudioMutationPlan,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioMediaEntry {
    id: String,
    source: StudioSourceReference,
    media_kind: StudioMediaKind,
    status: StudioMediaStatus,
    alt_policy: String,
    usages: Vec<String>,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
enum StudioMediaKind {
    Image,
    StaticFile,
    Unknown,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
enum StudioMediaStatus {
    Available,
    Missing,
    MaterializationRequired,
    Unsupported,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioMediaPickerChoice {
    label: String,
    reference: StudioSourceReference,
    role: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioPreviewPlan {
    modes: Vec<StudioPreviewMode>,
    route_targets: Vec<String>,
    artifact_targets: Vec<String>,
    media_requirements: Vec<String>,
    parity_policy: String,
    required_capabilities: Vec<StudioCapabilityEffect>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioPreviewMode {
    id: String,
    label: String,
    status: StudioSurfaceStatus,
    cost: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioReleaseManifest {
    id: String,
    artifact_root: String,
    affected_routes: Vec<String>,
    affected_assets: Vec<String>,
    metadata_profiles: Vec<String>,
    health: StudioReleaseHealth,
    required_capabilities: Vec<StudioCapabilityEffect>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioReleaseHealth {
    status: StudioSurfaceStatus,
    summary: String,
    warnings: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioPublishPlan {
    id: String,
    status: StudioSurfaceStatus,
    dry_run: bool,
    affected_routes: Vec<String>,
    provider_actions: Vec<StudioProviderAction>,
    manual_steps: Vec<String>,
    required_approval: String,
    credential_refs: Vec<String>,
    audit_events: Vec<StudioAuditEvent>,
    rollback: StudioRollbackPlan,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioProviderAction {
    provider_id: ProviderId,
    operation: CapabilityOperation,
    behavior: CapabilityActionBehavior,
    summary: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioCredentialSummary {
    reference: CredentialReference,
    display_label: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioAuditEvent {
    id: String,
    operation_id: String,
    actor: String,
    safety_class: StudioSafetyClass,
    dry_run: bool,
    summary: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioRollbackPlan {
    status: StudioSurfaceStatus,
    summary: String,
    restore_target: String,
    required_capabilities: Vec<StudioCapabilityEffect>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioVerificationItem {
    id: String,
    label: String,
    status: StudioSurfaceStatus,
    evidence: Vec<String>,
}

/// Runs the Studio settings surface inspection operation.
#[must_use]
pub fn run_studio_settings_inspect(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    run_studio_operation(
        start,
        interface,
        "studio.settings.inspect",
        "Studio settings inspected",
        OperationStatus::Warning,
    )
}

/// Runs the Studio content list and editor-document operation.
#[must_use]
pub fn run_studio_content_editor(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    run_studio_operation(
        start,
        interface,
        "studio.content.editor",
        "Studio content editor model prepared",
        OperationStatus::RequiresApproval,
    )
}

/// Runs the Studio media library and picker operation.
#[must_use]
pub fn run_studio_media_library(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    run_studio_operation(
        start,
        interface,
        "studio.media.library",
        "Studio media library prepared",
        OperationStatus::Partial,
    )
}

/// Runs the Studio preview plan operation.
#[must_use]
pub fn run_studio_preview_plan(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    run_studio_operation(
        start,
        interface,
        "studio.preview.plan",
        "Studio preview plan prepared",
        OperationStatus::Partial,
    )
}

/// Runs the Studio release manifest and publish-plan operation.
#[must_use]
pub fn run_studio_release_plan(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    run_studio_operation(
        start,
        interface,
        "studio.release.plan",
        "Studio release and publish plan prepared",
        OperationStatus::RequiresCredentials,
    )
}

/// Runs the Studio safe publish-apply operation.
#[must_use]
pub fn run_studio_publish_apply(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    run_studio_operation(
        start,
        interface,
        "studio.publish.apply",
        "Studio publish apply gate prepared",
        OperationStatus::RequiresApproval,
    )
}

/// Runs the Studio product workflow verification operation.
#[must_use]
pub fn run_studio_workflow_verify(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    run_studio_operation(
        start,
        interface,
        "studio.workflow.verify",
        "Studio authoring workflow verified",
        OperationStatus::Partial,
    )
}

fn run_studio_operation(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
    operation_id_value: &'static str,
    title: &'static str,
    preferred_status: OperationStatus,
) -> OperationResult {
    let start = start.into();
    let request = OperationRequest::new(operation_id(operation_id_value), interface)
        .with_workspace(display_path(&start));

    match WorkspaceContext::discover(&start) {
        Ok(context) => {
            let registry = mock_registry(AdapterRuntimeProfile::TpmLike);
            let payload = StudioAuthoringPayload::from_workspace(&context, &registry);
            let diagnostics = studio_diagnostics(&context, &payload, &registry);
            let status = if diagnostics.has_blocking() {
                OperationStatus::Failed
            } else {
                preferred_status
            };
            let summary = OperationSummary::new(title)
                .with_detail(format!("profile: {}", payload.profile))
                .with_detail(format!("surfaces: {}", payload.surfaces.len()))
                .with_detail(format!("settings fields: {}", payload.settings.len()))
                .with_detail(format!(
                    "content entries: {}",
                    payload.content.entries.len()
                ))
                .with_detail(format!("media entries: {}", payload.media.entries.len()))
                .with_detail(format!(
                    "publish actions: {}",
                    payload.publish.provider_actions.len()
                ));

            OperationResult::new(request, summary, OperationTiming::default(), diagnostics)
                .with_status(status)
                .with_payload(OperationPayload::StudioAuthoring(Box::new(payload)))
        }
        Err(error) => OperationResult::new(
            request,
            OperationSummary::new("Studio authoring operation failed").with_detail(format!(
                "start path: {}",
                display_path(workspace_discovery_start(&error))
            )),
            OperationTiming::default(),
            DiagnosticReport::from_diagnostics(vec![workspace_not_found_diagnostic(&error)]),
        ),
    }
}

fn read_site_config(context: &WorkspaceContext) -> Option<Value> {
    let contents = fs::read_to_string(context.layout().site_config()).ok()?;
    serde_json::from_str(&contents).ok()
}

fn settings_fields(
    context: &WorkspaceContext,
    config: Option<&Value>,
    registry: &CapabilityRegistry,
) -> Vec<StudioSettingsField> {
    let source = StudioSourceReference::new(
        "site-config",
        context.display_path(context.layout().site_config()),
    );
    let write_capabilities = capabilities(
        registry,
        [
            CapabilityOperation::SourceWritePatch,
            CapabilityOperation::SourceDiff,
        ],
        true,
    );

    vec![
        settings_field(
            "identity.title",
            "Publication title",
            StudioInputKind::Text,
            config_value(config, ["identity", "title"]),
            true,
            StudioFieldVisibility::Beginner,
            source.clone(),
            ["metadata", "navigation", "feeds", "social previews"],
            write_capabilities.clone(),
        ),
        settings_field(
            "identity.description",
            "Publication description",
            StudioInputKind::Text,
            config_value(config, ["identity", "description"]),
            true,
            StudioFieldVisibility::Beginner,
            source.clone(),
            ["metadata", "search", "social previews"],
            write_capabilities.clone(),
        ),
        settings_field(
            "identity.url",
            "Canonical site URL",
            StudioInputKind::Url,
            config_value(config, ["identity", "url"]),
            true,
            StudioFieldVisibility::Advanced,
            source.clone(),
            ["canonical URLs", "sitemap", "feeds"],
            write_capabilities.clone(),
        ),
        settings_field(
            "features.search",
            "Search enabled",
            StudioInputKind::Boolean,
            config_value(config, ["features", "search"]),
            false,
            StudioFieldVisibility::Beginner,
            source.clone(),
            ["search index", "navigation"],
            write_capabilities.clone(),
        ),
        settings_field(
            "navigation.primary",
            "Primary navigation",
            StudioInputKind::List,
            config_value(config, ["navigation", "primary"]),
            false,
            StudioFieldVisibility::Beginner,
            source.clone(),
            ["header navigation", "accessibility landmarks"],
            write_capabilities.clone(),
        ),
        settings_field(
            "support",
            "Support links",
            StudioInputKind::Object,
            config_value(config, ["support"]),
            false,
            StudioFieldVisibility::Advanced,
            source.clone(),
            ["support calls to action"],
            write_capabilities.clone(),
        ),
        settings_field(
            "routes",
            "Route map",
            StudioInputKind::Object,
            config_value(config, ["routes"]),
            true,
            StudioFieldVisibility::CodeOnly,
            source,
            ["routes", "redirects", "sitemap"],
            write_capabilities,
        ),
    ]
}

#[expect(
    clippy::too_many_arguments,
    reason = "field descriptors are explicit product data"
)]
fn settings_field<const N: usize>(
    id: &'static str,
    label: &'static str,
    input_kind: StudioInputKind,
    value: Option<String>,
    required: bool,
    visibility: StudioFieldVisibility,
    source: StudioSourceReference,
    generated_effects: [&'static str; N],
    capabilities: Vec<StudioCapabilityEffect>,
) -> StudioSettingsField {
    StudioSettingsField {
        id: String::from(id),
        label: String::from(label),
        input_kind,
        value,
        required,
        visibility,
        source,
        generated_effects: generated_effects.into_iter().map(String::from).collect(),
        capabilities,
    }
}

fn config_value<const N: usize>(config: Option<&Value>, path: [&'static str; N]) -> Option<String> {
    let mut value = config?;
    for key in path {
        value = value.get(key)?;
    }

    match value {
        Value::String(text) => Some(text.clone()),
        Value::Bool(flag) => Some(flag.to_string()),
        Value::Number(number) => Some(number.to_string()),
        Value::Array(items) => Some(format!("{} items", items.len())),
        Value::Object(object) => Some(format!("{} fields", object.len())),
        Value::Null => None,
    }
}

fn content_workspace(
    entries: Vec<StudioContentEntry>,
    registry: &CapabilityRegistry,
) -> StudioContentWorkspace {
    let editor_document = entries
        .first()
        .map(|entry| editor_document_for_entry(entry, registry));
    let diff_source = entries.first().map_or_else(
        || StudioSourceReference::new("content", "site/content"),
        |entry| entry.source.clone(),
    );

    StudioContentWorkspace {
        entries,
        editor_document,
        draft_plan: StudioMutationPlan {
            id: String::from("content-draft-plan"),
            label: String::from("Save draft"),
            safety_class: StudioSafetyClass::SourceWrite,
            mode: StudioPlanMode::RequiresApproval,
            source_diffs: vec![StudioSourceDiff {
                source: diff_source,
                summary: String::from("Write a source-faithful draft patch."),
                additions: 1,
                removals: 0,
            }],
            required_capabilities: capabilities(
                registry,
                [
                    CapabilityOperation::SourceWriteDraft,
                    CapabilityOperation::SourceDiff,
                    CapabilityOperation::WorkflowSaveDraft,
                ],
                true,
            ),
            requires_approval: true,
            audit_required: true,
            steps: vec![
                String::from("Validate Markdown or MDX source without rewriting it."),
                String::from("Create a source diff for review."),
                String::from("Apply only after explicit save confirmation."),
            ],
        },
    }
}

fn collect_content_entries(
    context: &WorkspaceContext,
    artifacts: &[SourceArtifact],
) -> Vec<StudioContentEntry> {
    artifacts
        .iter()
        .filter(|artifact| artifact.kind() == SourceArtifactKind::Content)
        .filter(|artifact| is_content_document(artifact.path()))
        .map(|artifact| content_entry(context, artifact))
        .collect()
}

fn content_entry(context: &WorkspaceContext, artifact: &SourceArtifact) -> StudioContentEntry {
    let contents = fs::read_to_string(artifact.path()).unwrap_or_default();
    let display_path = artifact.display_path();
    StudioContentEntry {
        id: source_id(display_path),
        title: frontmatter_title(&contents).unwrap_or_else(|| title_from_path(artifact.path())),
        domain: content_domain(display_path),
        format: document_format(artifact.path()),
        source: StudioSourceReference::new("content", display_path),
        byte_count: contents.len(),
        line_count: contents.lines().count(),
        status: if context.layout().content().exists() {
            StudioContentStatus::DraftPlanAvailable
        } else {
            StudioContentStatus::SourceOnly
        },
    }
}

fn editor_document_for_entry(
    entry: &StudioContentEntry,
    registry: &CapabilityRegistry,
) -> StudioEditorDocument {
    let diagnostics = capabilities(registry, [CapabilityOperation::SourceWriteDraft], true)
        .into_iter()
        .filter(|effect| effect.status != CapabilityStatus::Supported)
        .map(|effect| {
            format!(
                "{} is {} for provider {}.",
                effect.operation, effect.status, effect.provider_id
            )
        })
        .collect::<Vec<_>>();

    StudioEditorDocument {
        source: entry.source.clone(),
        format: entry.format,
        source_preview: format!("{} source buffer, {} bytes", entry.title, entry.byte_count),
        source_fidelity: String::from(
            "Markdown/MDX source is preserved; formatter actions must be explicit.",
        ),
        diagnostics,
    }
}

fn media_library(
    entries: Vec<StudioMediaEntry>,
    registry: &CapabilityRegistry,
) -> StudioMediaLibrary {
    let picker = entries
        .iter()
        .take(12)
        .map(|entry| StudioMediaPickerChoice {
            label: entry.source.display_path.clone(),
            reference: entry.source.clone(),
            role: String::from("article or social image"),
        })
        .collect::<Vec<_>>();

    StudioMediaLibrary {
        entries,
        picker,
        materialization_plan: StudioMutationPlan {
            id: String::from("media-materialization-plan"),
            label: String::from("Materialize media for preview"),
            safety_class: StudioSafetyClass::ReadOnly,
            mode: StudioPlanMode::DryRun,
            source_diffs: Vec::new(),
            required_capabilities: capabilities(
                registry,
                [
                    CapabilityOperation::MediaResolve,
                    CapabilityOperation::MediaMaterializeBuildInput,
                    CapabilityOperation::MediaInspectUsage,
                ],
                true,
            ),
            requires_approval: false,
            audit_required: false,
            steps: vec![
                String::from("Resolve provider media references."),
                String::from("Materialize optimized build inputs where supported."),
                String::from("Report unsupported or missing media before preview."),
            ],
        },
    }
}

fn collect_media_entries(
    context: &WorkspaceContext,
    artifacts: &[SourceArtifact],
) -> Vec<StudioMediaEntry> {
    artifacts
        .iter()
        .filter(|artifact| {
            matches!(
                artifact.kind(),
                SourceArtifactKind::Asset | SourceArtifactKind::PublicFile
            )
        })
        .filter(|artifact| is_media_candidate(artifact.path()))
        .map(|artifact| StudioMediaEntry {
            id: source_id(artifact.display_path()),
            source: StudioSourceReference::new("media", artifact.display_path()),
            media_kind: media_kind(artifact.path()),
            status: if artifact.path().starts_with(context.layout().assets()) {
                StudioMediaStatus::Available
            } else {
                StudioMediaStatus::MaterializationRequired
            },
            alt_policy: String::from("Alt text is required when media is rendered as content."),
            usages: vec![String::from(
                "usage inspection planned through media adapter",
            )],
        })
        .collect()
}

fn preview_plan(
    content_workspace: &StudioContentWorkspace,
    media: &StudioMediaLibrary,
    context: &WorkspaceContext,
    registry: &CapabilityRegistry,
) -> StudioPreviewPlan {
    let route_targets = content_workspace
        .entries
        .iter()
        .take(5)
        .map(route_for_entry)
        .collect::<Vec<_>>();

    StudioPreviewPlan {
        modes: vec![
            StudioPreviewMode {
                id: String::from("diagnostics-only"),
                label: String::from("Diagnostics only"),
                status: StudioSurfaceStatus::Ready,
                cost: String::from("fast"),
            },
            StudioPreviewMode {
                id: String::from("route-preview"),
                label: String::from("Route preview"),
                status: StudioSurfaceStatus::Partial,
                cost: String::from("medium"),
            },
            StudioPreviewMode {
                id: String::from("full-build"),
                label: String::from("Full static build"),
                status: StudioSurfaceStatus::RequiresApproval,
                cost: String::from("slow"),
            },
        ],
        route_targets,
        artifact_targets: vec![
            context.display_path(context.layout().output()),
            String::from("metadata summary"),
            String::from("search/feed/social preview artifacts"),
        ],
        media_requirements: media
            .entries
            .iter()
            .take(5)
            .map(|entry| entry.source.display_path.clone())
            .collect(),
        parity_policy: String::from(
            "Fast preview may use caches, but release truth remains the static compiler output.",
        ),
        required_capabilities: capabilities(
            registry,
            [
                CapabilityOperation::BuildDiagnosticsCheck,
                CapabilityOperation::BuildPreview,
                CapabilityOperation::BuildFull,
                CapabilityOperation::BuildVerifyArtifacts,
            ],
            true,
        ),
    }
}

fn release_manifest(
    preview: &StudioPreviewPlan,
    context: &WorkspaceContext,
    registry: &CapabilityRegistry,
) -> StudioReleaseManifest {
    let output = context.layout().output();
    let has_output = output.is_dir();
    let warnings = if has_output {
        Vec::new()
    } else {
        vec![String::from(
            "Generated output is not present; build before publish apply.",
        )]
    };

    StudioReleaseManifest {
        id: String::from("release-draft-local"),
        artifact_root: context.display_path(output),
        affected_routes: preview.route_targets.clone(),
        affected_assets: preview.media_requirements.clone(),
        metadata_profiles: vec![
            String::from("canonical"),
            String::from("open-graph"),
            String::from("schema-org"),
            String::from("rss-search"),
        ],
        health: StudioReleaseHealth {
            status: if has_output {
                StudioSurfaceStatus::Ready
            } else {
                StudioSurfaceStatus::Partial
            },
            summary: if has_output {
                String::from("Generated output is available for release inspection.")
            } else {
                String::from("Release can be planned, but output must be built before apply.")
            },
            warnings,
        },
        required_capabilities: capabilities(
            registry,
            [
                CapabilityOperation::BuildFull,
                CapabilityOperation::BuildVerifyArtifacts,
                CapabilityOperation::DeployCheck,
            ],
            true,
        ),
    }
}

fn credential_summaries(registry: &CapabilityRegistry) -> Vec<StudioCredentialSummary> {
    registry
        .capabilities()
        .into_iter()
        .filter(|capability| {
            capability.credential_requirement() != CredentialRequirement::None
                && !capability.credential_scopes().is_empty()
        })
        .take(4)
        .map(|capability| {
            let reference = CredentialReference::new(
                format!("{}-credential", capability.provider_id()),
                capability.provider_id().clone(),
                CredentialSubject::LocalUser,
                CredentialStorageProfile::DesktopKeychain,
                CredentialState::Missing,
                capability.credential_scopes().to_vec(),
            )
            .with_secret_reference(CredentialSecretReference::new(format!(
                "runtime://{}",
                capability.provider_id()
            )));

            StudioCredentialSummary {
                reference,
                display_label: format!("{} credential", capability.provider_id()),
            }
        })
        .collect()
}

fn publish_plan(
    release: &StudioReleaseManifest,
    credentials: &[StudioCredentialSummary],
    registry: &CapabilityRegistry,
) -> StudioPublishPlan {
    let publish_capabilities = capabilities(
        registry,
        [
            CapabilityOperation::DeployPublish,
            CapabilityOperation::DeployRollback,
            CapabilityOperation::DeployCachePolicy,
        ],
        true,
    );
    let provider_actions = publish_capabilities
        .iter()
        .map(|effect| StudioProviderAction {
            provider_id: effect.provider_id.clone(),
            operation: effect.operation,
            behavior: effect.behavior,
            summary: format!("{} via {}", effect.operation, effect.provider_id),
        })
        .collect::<Vec<_>>();

    StudioPublishPlan {
        id: String::from("publish-plan-draft"),
        status: StudioSurfaceStatus::RequiresCredentials,
        dry_run: true,
        affected_routes: release.affected_routes.clone(),
        provider_actions,
        manual_steps: vec![
            String::from("Review generated-output health."),
            String::from("Connect required provider credentials."),
            String::from("Approve publish apply after reviewing route and asset effects."),
        ],
        required_approval: String::from("Publish apply requires explicit approval."),
        credential_refs: credentials
            .iter()
            .map(|credential| credential.reference.id().to_owned())
            .collect(),
        audit_events: vec![StudioAuditEvent {
            id: String::from("audit-publish-plan"),
            operation_id: String::from("studio.publish.apply"),
            actor: String::from("studio-gui"),
            safety_class: StudioSafetyClass::Publish,
            dry_run: true,
            summary: String::from("Publish apply was planned but not executed."),
        }],
        rollback: StudioRollbackPlan {
            status: StudioSurfaceStatus::Partial,
            summary: String::from(
                "Rollback depends on deploy provider support or redeploying a prior release.",
            ),
            restore_target: String::from("previous-release-artifact"),
            required_capabilities: capabilities(
                registry,
                [
                    CapabilityOperation::HistoryCreateRestorePoint,
                    CapabilityOperation::DeployRollback,
                ],
                true,
            ),
        },
    }
}

fn verification_items(
    settings: &[StudioSettingsField],
    content: &StudioContentWorkspace,
    media: &StudioMediaLibrary,
    preview: &StudioPreviewPlan,
    publish: &StudioPublishPlan,
) -> Vec<StudioVerificationItem> {
    vec![
        StudioVerificationItem {
            id: String::from("settings-schema"),
            label: String::from("Settings are schema-backed"),
            status: StudioSurfaceStatus::Ready,
            evidence: vec![format!("{} settings fields modeled", settings.len())],
        },
        StudioVerificationItem {
            id: String::from("source-fidelity"),
            label: String::from("Content source stays canonical"),
            status: if content.editor_document.is_some() {
                StudioSurfaceStatus::RequiresApproval
            } else {
                StudioSurfaceStatus::Partial
            },
            evidence: vec![
                format!("{} content entries inventoried", content.entries.len()),
                String::from("draft writes are represented as source diffs"),
            ],
        },
        StudioVerificationItem {
            id: String::from("media-materialization"),
            label: String::from("Media is provider-aware"),
            status: StudioSurfaceStatus::Partial,
            evidence: vec![format!("{} media entries inventoried", media.entries.len())],
        },
        StudioVerificationItem {
            id: String::from("preview-release-parity"),
            label: String::from("Preview declares release parity policy"),
            status: StudioSurfaceStatus::Ready,
            evidence: vec![preview.parity_policy.clone()],
        },
        StudioVerificationItem {
            id: String::from("publish-gate"),
            label: String::from("Publish apply is gated"),
            status: publish.status,
            evidence: vec![
                publish.required_approval.clone(),
                format!("{} audit events planned", publish.audit_events.len()),
            ],
        },
    ]
}

fn surfaces(
    settings: &[StudioSettingsField],
    content: &StudioContentWorkspace,
    media: &StudioMediaLibrary,
    preview: &StudioPreviewPlan,
    release: &StudioReleaseManifest,
    publish: &StudioPublishPlan,
) -> Vec<StudioSurface> {
    vec![
        StudioSurface {
            id: String::from("settings"),
            label: String::from("Settings"),
            operation_id: String::from("studio.settings.inspect"),
            status: StudioSurfaceStatus::Ready,
            summary: format!("{} schema-backed fields", settings.len()),
            required_capabilities: first_capabilities(settings),
        },
        StudioSurface {
            id: String::from("content"),
            label: String::from("Content"),
            operation_id: String::from("studio.content.editor"),
            status: StudioSurfaceStatus::RequiresApproval,
            summary: format!("{} editable source entries", content.entries.len()),
            required_capabilities: content.draft_plan.required_capabilities.clone(),
        },
        StudioSurface {
            id: String::from("media"),
            label: String::from("Media"),
            operation_id: String::from("studio.media.library"),
            status: StudioSurfaceStatus::Partial,
            summary: format!("{} provider-aware media entries", media.entries.len()),
            required_capabilities: media.materialization_plan.required_capabilities.clone(),
        },
        StudioSurface {
            id: String::from("preview"),
            label: String::from("Preview"),
            operation_id: String::from("studio.preview.plan"),
            status: StudioSurfaceStatus::Partial,
            summary: format!("{} preview modes", preview.modes.len()),
            required_capabilities: preview.required_capabilities.clone(),
        },
        StudioSurface {
            id: String::from("publish"),
            label: String::from("Publish"),
            operation_id: String::from("studio.release.plan"),
            status: publish.status,
            summary: format!("{} publish actions", publish.provider_actions.len()),
            required_capabilities: release.required_capabilities.clone(),
        },
        StudioSurface {
            id: String::from("audit"),
            label: String::from("Audit"),
            operation_id: String::from("studio.publish.apply"),
            status: StudioSurfaceStatus::RequiresApproval,
            summary: format!("{} audit events planned", publish.audit_events.len()),
            required_capabilities: publish.rollback.required_capabilities.clone(),
        },
    ]
}

fn first_capabilities(settings: &[StudioSettingsField]) -> Vec<StudioCapabilityEffect> {
    settings
        .first()
        .map_or_else(Vec::new, |field| field.capabilities.clone())
}

fn studio_diagnostics(
    context: &WorkspaceContext,
    payload: &StudioAuthoringPayload,
    registry: &CapabilityRegistry,
) -> DiagnosticReport {
    let mut diagnostics = context.validate_required_paths();

    if payload.content.entries.is_empty() {
        diagnostics.push(
            Diagnostic::new(
                diagnostic_code("TPM-STUDIO-CONTENT-EMPTY"),
                Severity::Warning,
                "No editable content documents were found.",
            )
            .with_location(DiagnosticLocation::source(
                context.display_path(context.layout().content()),
            ))
            .with_remediation("Add Markdown or MDX content before using the editor surface."),
        );
    }

    for capability in registry.unavailable_capabilities() {
        if matches!(
            capability.operation(),
            CapabilityOperation::DeployPublish
                | CapabilityOperation::DeployRollback
                | CapabilityOperation::WorkflowSubmitForReview
        ) && capability.status().should_diagnose_attempt()
        {
            diagnostics.push(unsupported_operation_diagnostic(capability));
        }
    }

    diagnostics
}

fn capabilities<const N: usize>(
    registry: &CapabilityRegistry,
    operations: [CapabilityOperation; N],
    required: bool,
) -> Vec<StudioCapabilityEffect> {
    operations
        .into_iter()
        .filter_map(|operation| {
            registry
                .capabilities()
                .into_iter()
                .find(|capability| capability.operation() == operation)
                .map(|capability| StudioCapabilityEffect {
                    provider_id: capability.provider_id().clone(),
                    operation: capability.operation(),
                    status: capability.status(),
                    behavior: capability.action_behavior(),
                    required,
                    remediation: capability.remediation().map(str::to_owned),
                })
        })
        .collect()
}

fn is_content_document(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|extension| extension.to_str()),
        Some("md" | "mdx" | "json")
    )
}

fn document_format(path: &Path) -> StudioDocumentFormat {
    match path.extension().and_then(|extension| extension.to_str()) {
        Some("md") => StudioDocumentFormat::Markdown,
        Some("mdx") => StudioDocumentFormat::Mdx,
        Some("json") => StudioDocumentFormat::Json,
        _ => StudioDocumentFormat::Unknown,
    }
}

fn frontmatter_title(contents: &str) -> Option<String> {
    contents
        .lines()
        .take(30)
        .find_map(|line| line.strip_prefix("title:"))
        .map(str::trim)
        .map(|value| value.trim_matches('"'))
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
}

fn title_from_path(path: &Path) -> String {
    path.file_stem().and_then(|stem| stem.to_str()).map_or_else(
        || String::from("Untitled source"),
        |stem| stem.replace('-', " "),
    )
}

fn content_domain(display_path: &str) -> String {
    if display_path.contains("/articles/") {
        String::from("article")
    } else if display_path.contains("/announcements/") {
        String::from("announcement")
    } else if display_path.contains("/pages/") {
        String::from("page")
    } else if display_path.contains("/authors/") {
        String::from("author")
    } else if display_path.contains("/collections/") {
        String::from("collection")
    } else {
        String::from("content")
    }
}

fn route_for_entry(entry: &StudioContentEntry) -> String {
    let slug = entry
        .source
        .display_path
        .split('/')
        .next_back()
        .unwrap_or(entry.id.as_str())
        .trim_end_matches(".md")
        .trim_end_matches(".mdx")
        .trim_end_matches(".json");
    match entry.domain.as_str() {
        "article" => format!("/articles/{slug}/"),
        "announcement" => format!("/announcements/{slug}/"),
        "author" => format!("/authors/{slug}/"),
        "collection" => format!("/collections/{slug}/"),
        _ => format!("/{slug}/"),
    }
}

fn is_media_candidate(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|extension| extension.to_str()),
        Some("avif" | "gif" | "jpeg" | "jpg" | "png" | "svg" | "webp" | "mp3" | "mp4" | "pdf")
    )
}

fn media_kind(path: &Path) -> StudioMediaKind {
    match path.extension().and_then(|extension| extension.to_str()) {
        Some("avif" | "gif" | "jpeg" | "jpg" | "png" | "svg" | "webp") => StudioMediaKind::Image,
        Some("mp3" | "mp4" | "pdf") => StudioMediaKind::StaticFile,
        _ => StudioMediaKind::Unknown,
    }
}

fn source_id(display_path: &str) -> String {
    display_path
        .trim_start_matches("site/")
        .trim_end_matches(".md")
        .trim_end_matches(".mdx")
        .trim_end_matches(".json")
        .replace(['/', '.'], "-")
}

#[expect(
    clippy::expect_used,
    reason = "studio operation IDs are static repository invariants"
)]
fn operation_id(value: &'static str) -> OperationId {
    OperationId::parse(value).expect("studio operation ID should be valid")
}

#[expect(
    clippy::expect_used,
    reason = "studio diagnostic codes are static repository invariants"
)]
fn diagnostic_code(value: &'static str) -> DiagnosticCode {
    DiagnosticCode::parse(value).expect("studio diagnostic code should be valid")
}

fn workspace_not_found_diagnostic(error: &WorkspaceDiscoveryError) -> Diagnostic {
    Diagnostic::new(
        diagnostic_code("TPM-STUDIO-WORKSPACE"),
        Severity::Error,
        "Could not discover a workspace for Studio authoring.",
    )
    .with_location(DiagnosticLocation::source(display_path(
        workspace_discovery_start(error),
    )))
    .with_remediation(
        "Run Studio operations from a repo with site/config/site.json or pass --site.",
    )
}

fn workspace_discovery_start(error: &WorkspaceDiscoveryError) -> &Path {
    match error {
        WorkspaceDiscoveryError::NotFound { start } => start,
    }
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
    #![expect(
        clippy::expect_used,
        reason = "studio operation tests use static JSON and workspace fixtures"
    )]

    use std::error::Error;
    use std::fs;
    use std::path::{Path, PathBuf};

    use super::{
        StudioDocumentFormat, StudioMediaKind, StudioMediaStatus, StudioSurfaceStatus,
        editor_document_for_entry, run_studio_content_editor, run_studio_media_library,
        run_studio_publish_apply, run_studio_release_plan, run_studio_settings_inspect,
        run_studio_workflow_verify,
    };
    use crate::{
        AdapterBoundary, AdapterDescriptor, AdapterRuntimeProfile, CapabilityOperation,
        CapabilityRegistry, CapabilityStatus, OperationInterface, OperationPayload,
        OperationResult, OperationStatus, ProviderCapability, ProviderId,
    };

    fn fixture_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .join("tests/fixtures/rust-workspace")
    }

    fn workspace_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
    }

    fn temp_workspace(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("tpm-studio-{name}-{}", std::process::id()))
    }

    fn write_file(path: &Path, contents: &str) -> Result<(), Box<dyn Error>> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        fs::write(path, contents)?;
        Ok(())
    }

    fn write_required_workspace_roots(root: &Path, config: &str) -> Result<(), Box<dyn Error>> {
        write_file(&root.join("site/config/site.json"), config)?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        Ok(())
    }

    #[test]
    fn settings_operation_returns_schema_backed_fields() {
        let result = run_studio_settings_inspect(workspace_root(), OperationInterface::Test);

        assert_eq!(
            result.request().operation_id().as_str(),
            "studio.settings.inspect"
        );
        assert_eq!(result.status(), OperationStatus::Warning);
        assert!(
            result
                .summary()
                .details()
                .iter()
                .any(|detail| detail.contains("settings fields: 7"))
        );
        assert!(matches!(
            result.payload(),
            Some(OperationPayload::StudioAuthoring(_))
        ));
        assert!(result.render_human().contains("studio profile: tpm-like"));
    }

    #[test]
    fn content_operation_models_source_faithful_draft_plan() {
        let result = run_studio_content_editor(fixture_root(), OperationInterface::Test);
        let payload = studio_payload(&result);

        assert_eq!(result.status(), OperationStatus::RequiresApproval);
        assert_eq!(payload.content.entries.len(), 1);
        assert_eq!(
            payload.content.draft_plan.mode,
            super::StudioPlanMode::RequiresApproval
        );
        assert!(payload.content.editor_document.is_some());
    }

    #[test]
    fn media_operation_models_materialization_plan_even_when_empty() {
        let result = run_studio_media_library(fixture_root(), OperationInterface::Test);
        let payload = studio_payload(&result);

        assert_eq!(result.status(), OperationStatus::Partial);
        assert_eq!(
            payload.media.materialization_plan.mode,
            super::StudioPlanMode::DryRun
        );
    }

    #[test]
    fn release_and_publish_operations_expose_plan_apply_boundaries() {
        let release = run_studio_release_plan(workspace_root(), OperationInterface::Test);
        let publish = run_studio_publish_apply(workspace_root(), OperationInterface::Test);
        let release_payload = studio_payload(&release);
        let publish_payload = studio_payload(&publish);

        assert_eq!(release.status(), OperationStatus::RequiresCredentials);
        assert_eq!(publish.status(), OperationStatus::RequiresApproval);
        assert!(release_payload.publish.dry_run);
        assert_eq!(
            publish_payload.publish.status,
            StudioSurfaceStatus::RequiresCredentials
        );
        assert!(!publish_payload.publish.audit_events.is_empty());
    }

    #[test]
    fn workflow_verification_summarizes_all_authoring_surfaces() {
        let result = run_studio_workflow_verify(workspace_root(), OperationInterface::Test);
        let payload = studio_payload(&result);

        assert_eq!(payload.verification.len(), 5);
        assert_eq!(payload.surfaces.len(), 6);
        assert!(
            payload
                .verification
                .iter()
                .any(|item| item.id == "publish-gate")
        );
    }

    #[test]
    fn studio_payload_redacts_credential_secret_handles() {
        let result = run_studio_publish_apply(workspace_root(), OperationInterface::Test);
        let json = result
            .render_json_pretty()
            .expect("studio publish payload should serialize");

        assert!(json.contains("[redacted]"));
        assert!(!json.contains("runtime://"));
    }

    #[test]
    fn empty_workspace_reports_content_diagnostic_and_partial_source_verification()
    -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("empty-authoring");
        crate::test_support::remove_test_dir(&root);
        write_required_workspace_roots(
            &root,
            r#"{
              "identity": {
                "title": "Empty Studio Fixture",
                "description": "No content yet",
                "url": "https://example.test"
              },
              "features": { "search": false },
              "navigation": { "primary": [] },
              "support": {},
              "routes": {}
            }"#,
        )?;

        let result = run_studio_content_editor(&root, OperationInterface::Test);
        let payload = studio_payload(&result);

        assert_eq!(payload.content.entries.len(), 0);
        assert!(payload.content.editor_document.is_none());
        assert_eq!(
            payload.content.draft_plan.source_diffs[0]
                .source
                .display_path,
            "site/content"
        );
        assert!(payload.verification.iter().any(
            |item| item.id == "source-fidelity" && item.status == StudioSurfaceStatus::Partial
        ));
        assert!(result.diagnostics().diagnostics().iter().any(|diagnostic| {
            diagnostic.code().as_str() == "TPM-STUDIO-CONTENT-EMPTY"
                && diagnostic.remediation().is_some()
        }));

        crate::test_support::remove_test_dir(&root);
        Ok(())
    }

    #[test]
    fn discovered_workspace_with_missing_roots_returns_blocking_status()
    -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("missing-required-roots");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;

        let result = run_studio_workflow_verify(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(result.payload().is_some());
        assert!(
            result
                .diagnostics()
                .errors()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-WORKSPACE-CONTENT")
        );

        crate::test_support::remove_test_dir(&root);
        Ok(())
    }

    #[test]
    fn generated_output_ready_workspace_models_media_and_release_statuses()
    -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("release-ready");
        crate::test_support::remove_test_dir(&root);
        write_required_workspace_roots(
            &root,
            r#"{
              "identity": {
                "title": "Release Ready Fixture",
                "description": "A fixture with output",
                "url": "https://example.test"
              },
              "features": { "search": false },
              "navigation": { "primary": [{ "label": "About", "href": "/about/" }] },
              "support": { "ctaLabel": "Support" },
              "metadata": { "priority": 1, "deprecated": null },
              "routes": { "articles": "/articles/" }
            }"#,
        )?;
        write_file(
            &root.join("site/content/pages/about.md"),
            "---\n---\nAbout page body.\n",
        )?;
        write_file(
            &root.join("site/content/authors/alice.json"),
            r#"{ "name": "Alice" }"#,
        )?;
        write_file(
            &root.join("site/content/collections/start.json"),
            r#"{ "title": "Start Here" }"#,
        )?;
        write_file(&root.join("site/assets/cover.jpg"), "fake image bytes")?;
        write_file(&root.join("site/public/download.pdf"), "fake pdf bytes")?;
        write_file(&root.join("dist/index.html"), "<!doctype html>")?;

        let result = run_studio_workflow_verify(&root, OperationInterface::Test);
        let payload = studio_payload(&result);

        assert!(payload.release.health.warnings.is_empty());
        assert_eq!(payload.release.health.status, StudioSurfaceStatus::Ready);
        assert!(
            payload
                .preview
                .route_targets
                .contains(&String::from("/about/"))
        );
        assert!(
            payload
                .preview
                .route_targets
                .contains(&String::from("/authors/alice/"))
        );
        assert!(
            payload
                .preview
                .route_targets
                .contains(&String::from("/collections/start/"))
        );
        assert!(payload.media.entries.iter().any(|entry| {
            entry.media_kind == StudioMediaKind::Image
                && entry.status == StudioMediaStatus::Available
        }));
        assert!(payload.media.entries.iter().any(|entry| {
            entry.media_kind == StudioMediaKind::StaticFile
                && entry.status == StudioMediaStatus::MaterializationRequired
        }));
        assert!(payload.settings.iter().any(|field| {
            field.id == "navigation.primary" && field.value.as_deref() == Some("1 items")
        }));
        assert!(
            payload
                .settings
                .iter()
                .any(|field| field.id == "support" && field.value.as_deref() == Some("1 fields"))
        );
        assert!(
            payload
                .settings
                .iter()
                .all(|field| field.value.as_deref() != Some("null"))
        );

        crate::test_support::remove_test_dir(&root);
        Ok(())
    }

    #[test]
    fn studio_operations_report_workspace_discovery_failures() {
        let root = temp_workspace("missing-workspace");
        crate::test_support::remove_test_dir(&root);

        let result = run_studio_settings_inspect(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(result.payload().is_none());
        assert!(result.diagnostics().has_blocking());
        assert!(
            result
                .render_human()
                .contains("Studio authoring operation failed")
        );
    }

    #[test]
    fn source_and_media_classifiers_cover_studio_routing_policy() {
        assert_eq!(
            super::document_format(Path::new("draft.mdx")),
            StudioDocumentFormat::Mdx
        );
        assert_eq!(
            super::document_format(Path::new("draft.unknown")),
            StudioDocumentFormat::Unknown
        );
        assert_eq!(super::title_from_path(Path::new("")), "Untitled source");
        assert_eq!(
            super::content_domain("site/content/articles/example.md"),
            "article"
        );
        assert_eq!(
            super::content_domain("site/content/announcements/update.md"),
            "announcement"
        );
        assert_eq!(super::content_domain("site/content/pages/about.md"), "page");
        assert_eq!(
            super::content_domain("site/content/authors/alice.json"),
            "author"
        );
        assert_eq!(
            super::content_domain("site/content/collections/start.json"),
            "collection"
        );
        assert_eq!(
            super::content_domain("site/content/misc/source.txt"),
            "content"
        );
        assert_eq!(
            super::media_kind(Path::new("clip.mp4")),
            StudioMediaKind::StaticFile
        );
        assert_eq!(
            super::media_kind(Path::new("source.bin")),
            StudioMediaKind::Unknown
        );
    }

    #[test]
    fn local_only_editor_document_explains_unsupported_write_capabilities() {
        let provider_id = ProviderId::parse("blocked-source").expect("valid provider ID");
        let registry = CapabilityRegistry::new(
            AdapterRuntimeProfile::LocalOnly,
            vec![AdapterDescriptor::new(
                provider_id.clone(),
                "Blocked source",
                AdapterBoundary::Default,
                vec![ProviderCapability::new(
                    provider_id,
                    CapabilityOperation::SourceWriteDraft,
                    CapabilityStatus::Unsupported,
                )],
            )],
        );
        let entry = super::StudioContentEntry {
            id: String::from("article-example"),
            title: String::from("Example"),
            domain: String::from("article"),
            format: StudioDocumentFormat::Markdown,
            source: super::StudioSourceReference::new(
                "content",
                "site/content/articles/example.md",
            ),
            byte_count: 12,
            line_count: 1,
            status: super::StudioContentStatus::DraftPlanAvailable,
        };

        let document = editor_document_for_entry(&entry, &registry);

        assert!(document.diagnostics.iter().any(|diagnostic| {
            diagnostic.contains("source-write-draft")
                && diagnostic.contains("blocked-source")
                && diagnostic.contains("unsupported")
        }));
    }

    fn studio_payload(result: &OperationResult) -> &super::StudioAuthoringPayload {
        match result.payload() {
            Some(OperationPayload::StudioAuthoring(payload)) => payload.as_ref(),
            other => panic!("expected studio authoring payload, got {other:?}"),
        }
    }
}
