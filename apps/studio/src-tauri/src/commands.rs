//! Read-only Tauri command adapters for the Studio shell.

use std::path::PathBuf;

use tpm_operations::{
    OperationInterface, OperationResult, run_studio_content_editor, run_studio_media_library,
    run_studio_preview_plan, run_studio_publish_apply, run_studio_release_plan,
    run_studio_settings_inspect, run_studio_workflow_verify, run_workspace_check,
    run_workspace_status,
};

const DEFAULT_WORKSPACE_START: &str = ".";

/// Returns read-only site status as a shared Rust operation envelope.
#[must_use]
#[tauri::command]
#[expect(
    clippy::redundant_pub_crate,
    reason = "Tauri generate_handler accesses command functions through the parent module while rustc unreachable_pub requires crate-limited visibility."
)]
pub(crate) fn site_status() -> OperationResult {
    site_status_for_workspace(DEFAULT_WORKSPACE_START)
}

/// Returns read-only workspace diagnostics as a shared Rust operation envelope.
#[must_use]
#[tauri::command]
#[expect(
    clippy::redundant_pub_crate,
    reason = "Tauri generate_handler accesses command functions through the parent module while rustc unreachable_pub requires crate-limited visibility."
)]
pub(crate) fn check_site() -> OperationResult {
    check_site_for_workspace(DEFAULT_WORKSPACE_START)
}

/// Returns schema-driven Studio settings surfaces as a shared operation envelope.
#[must_use]
#[tauri::command]
#[expect(
    clippy::redundant_pub_crate,
    reason = "Tauri generate_handler accesses command functions through the parent module while rustc unreachable_pub requires crate-limited visibility."
)]
pub(crate) fn studio_settings() -> OperationResult {
    studio_settings_for_workspace(DEFAULT_WORKSPACE_START)
}

/// Returns Studio content list and editor surfaces as a shared operation envelope.
#[must_use]
#[tauri::command]
#[expect(
    clippy::redundant_pub_crate,
    reason = "Tauri generate_handler accesses command functions through the parent module while rustc unreachable_pub requires crate-limited visibility."
)]
pub(crate) fn studio_content() -> OperationResult {
    studio_content_for_workspace(DEFAULT_WORKSPACE_START)
}

/// Returns Studio media library and picker surfaces as a shared operation envelope.
#[must_use]
#[tauri::command]
#[expect(
    clippy::redundant_pub_crate,
    reason = "Tauri generate_handler accesses command functions through the parent module while rustc unreachable_pub requires crate-limited visibility."
)]
pub(crate) fn studio_media() -> OperationResult {
    studio_media_for_workspace(DEFAULT_WORKSPACE_START)
}

/// Returns Studio preview orchestration surfaces as a shared operation envelope.
#[must_use]
#[tauri::command]
#[expect(
    clippy::redundant_pub_crate,
    reason = "Tauri generate_handler accesses command functions through the parent module while rustc unreachable_pub requires crate-limited visibility."
)]
pub(crate) fn studio_preview() -> OperationResult {
    studio_preview_for_workspace(DEFAULT_WORKSPACE_START)
}

/// Returns Studio release and publish-plan surfaces as a shared operation envelope.
#[must_use]
#[tauri::command]
#[expect(
    clippy::redundant_pub_crate,
    reason = "Tauri generate_handler accesses command functions through the parent module while rustc unreachable_pub requires crate-limited visibility."
)]
pub(crate) fn studio_release() -> OperationResult {
    studio_release_for_workspace(DEFAULT_WORKSPACE_START)
}

/// Returns Studio publish-apply gate surfaces as a shared operation envelope.
#[must_use]
#[tauri::command]
#[expect(
    clippy::redundant_pub_crate,
    reason = "Tauri generate_handler accesses command functions through the parent module while rustc unreachable_pub requires crate-limited visibility."
)]
pub(crate) fn studio_publish_apply() -> OperationResult {
    studio_publish_apply_for_workspace(DEFAULT_WORKSPACE_START)
}

/// Returns Studio product workflow verification as a shared operation envelope.
#[must_use]
#[tauri::command]
#[expect(
    clippy::redundant_pub_crate,
    reason = "Tauri generate_handler accesses command functions through the parent module while rustc unreachable_pub requires crate-limited visibility."
)]
pub(crate) fn studio_workflow_verify() -> OperationResult {
    studio_workflow_verify_for_workspace(DEFAULT_WORKSPACE_START)
}

/// Runs the site status operation for a specific workspace start path.
#[must_use]
fn site_status_for_workspace(start: impl Into<PathBuf>) -> OperationResult {
    run_workspace_status(start, OperationInterface::Gui)
}

/// Runs the site check operation for a specific workspace start path.
#[must_use]
fn check_site_for_workspace(start: impl Into<PathBuf>) -> OperationResult {
    run_workspace_check(start, OperationInterface::Gui)
}

/// Runs the Studio settings operation for a specific workspace start path.
#[must_use]
fn studio_settings_for_workspace(start: impl Into<PathBuf>) -> OperationResult {
    run_studio_settings_inspect(start, OperationInterface::Gui)
}

/// Runs the Studio content operation for a specific workspace start path.
#[must_use]
fn studio_content_for_workspace(start: impl Into<PathBuf>) -> OperationResult {
    run_studio_content_editor(start, OperationInterface::Gui)
}

/// Runs the Studio media operation for a specific workspace start path.
#[must_use]
fn studio_media_for_workspace(start: impl Into<PathBuf>) -> OperationResult {
    run_studio_media_library(start, OperationInterface::Gui)
}

/// Runs the Studio preview operation for a specific workspace start path.
#[must_use]
fn studio_preview_for_workspace(start: impl Into<PathBuf>) -> OperationResult {
    run_studio_preview_plan(start, OperationInterface::Gui)
}

/// Runs the Studio release operation for a specific workspace start path.
#[must_use]
fn studio_release_for_workspace(start: impl Into<PathBuf>) -> OperationResult {
    run_studio_release_plan(start, OperationInterface::Gui)
}

/// Runs the Studio publish-apply operation for a specific workspace start path.
#[must_use]
fn studio_publish_apply_for_workspace(start: impl Into<PathBuf>) -> OperationResult {
    run_studio_publish_apply(start, OperationInterface::Gui)
}

/// Runs the Studio workflow verification operation for a specific workspace start path.
#[must_use]
fn studio_workflow_verify_for_workspace(start: impl Into<PathBuf>) -> OperationResult {
    run_studio_workflow_verify(start, OperationInterface::Gui)
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::{
        check_site, check_site_for_workspace, site_status, site_status_for_workspace,
        studio_content, studio_content_for_workspace, studio_media, studio_media_for_workspace,
        studio_preview, studio_preview_for_workspace, studio_publish_apply,
        studio_publish_apply_for_workspace, studio_release, studio_release_for_workspace,
        studio_settings, studio_settings_for_workspace, studio_workflow_verify,
        studio_workflow_verify_for_workspace,
    };
    use tpm_operations::{OperationInterface, OperationPayload, OperationStatus};

    fn fixture_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../..")
            .join("tests/fixtures/rust-workspace")
    }

    fn missing_workspace() -> PathBuf {
        std::env::temp_dir().join(format!(
            "tpm-studio-missing-workspace-{}",
            std::process::id()
        ))
    }

    #[test]
    fn site_status_command_returns_gui_operation_success() {
        let result = site_status_for_workspace(fixture_root());

        assert_eq!(result.request().operation_id().as_str(), "workspace.status");
        assert_eq!(result.request().interface(), OperationInterface::Gui);
        assert_eq!(result.status(), OperationStatus::Success);
    }

    #[test]
    fn site_status_tauri_command_uses_default_workspace() {
        let result = site_status();

        assert_eq!(result.request().operation_id().as_str(), "workspace.status");
        assert_eq!(result.request().interface(), OperationInterface::Gui);
    }

    #[test]
    fn check_site_command_returns_gui_operation_success() {
        let result = check_site_for_workspace(fixture_root());

        assert_eq!(result.request().operation_id().as_str(), "workspace.check");
        assert_eq!(result.request().interface(), OperationInterface::Gui);
        assert_eq!(result.status(), OperationStatus::Success);
    }

    #[test]
    fn check_site_tauri_command_uses_default_workspace() {
        let result = check_site();

        assert_eq!(result.request().operation_id().as_str(), "workspace.check");
        assert_eq!(result.request().interface(), OperationInterface::Gui);
    }

    #[test]
    fn check_site_command_returns_diagnostic_failure() {
        let result = check_site_for_workspace(missing_workspace());

        assert_eq!(result.request().operation_id().as_str(), "workspace.check");
        assert_eq!(result.request().interface(), OperationInterface::Gui);
        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(result.diagnostics().has_blocking());
    }

    #[test]
    fn studio_authoring_commands_return_gui_operation_payloads() {
        for (result, operation_id, status) in [
            (
                studio_settings_for_workspace(fixture_root()),
                "studio.settings.inspect",
                OperationStatus::Warning,
            ),
            (
                studio_content_for_workspace(fixture_root()),
                "studio.content.editor",
                OperationStatus::RequiresApproval,
            ),
            (
                studio_media_for_workspace(fixture_root()),
                "studio.media.library",
                OperationStatus::Partial,
            ),
            (
                studio_preview_for_workspace(fixture_root()),
                "studio.preview.plan",
                OperationStatus::Partial,
            ),
            (
                studio_release_for_workspace(fixture_root()),
                "studio.release.plan",
                OperationStatus::RequiresCredentials,
            ),
            (
                studio_publish_apply_for_workspace(fixture_root()),
                "studio.publish.apply",
                OperationStatus::RequiresApproval,
            ),
            (
                studio_workflow_verify_for_workspace(fixture_root()),
                "studio.workflow.verify",
                OperationStatus::Partial,
            ),
        ] {
            assert_eq!(result.request().operation_id().as_str(), operation_id);
            assert_eq!(result.request().interface(), OperationInterface::Gui);
            assert_eq!(result.status(), status);
            assert!(matches!(
                result.payload(),
                Some(OperationPayload::StudioAuthoring(_))
            ));
        }
    }

    #[test]
    fn studio_authoring_tauri_commands_use_default_workspace() {
        for (result, operation_id) in [
            (studio_settings(), "studio.settings.inspect"),
            (studio_content(), "studio.content.editor"),
            (studio_media(), "studio.media.library"),
            (studio_preview(), "studio.preview.plan"),
            (studio_release(), "studio.release.plan"),
            (studio_publish_apply(), "studio.publish.apply"),
            (studio_workflow_verify(), "studio.workflow.verify"),
        ] {
            assert_eq!(result.request().operation_id().as_str(), operation_id);
            assert_eq!(result.request().interface(), OperationInterface::Gui);
        }
    }
}
