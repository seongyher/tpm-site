//! Read-only Tauri command adapters for the Studio shell.

use std::path::PathBuf;

use tpm_operations::{
    OperationInterface, OperationResult, run_workspace_check, run_workspace_status,
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

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::{check_site, check_site_for_workspace, site_status, site_status_for_workspace};
    use tpm_operations::{OperationInterface, OperationStatus};

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
}
