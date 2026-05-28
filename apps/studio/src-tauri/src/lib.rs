//! Tauri desktop shell for TPM Studio.
//!
//! This crate is intentionally thin. Product behavior belongs in shared
//! operation crates so the GUI, CLI, MCP server, and CI can consume the same
//! contracts.

#![expect(
    clippy::multiple_crate_versions,
    reason = "Tauri's platform dependency graph currently contains unavoidable duplicate transitive versions; cargo-deny remains the supply-chain review gate."
)]

pub(crate) mod commands;

/// Run the TPM Studio desktop shell.
///
/// # Errors
///
/// Returns a Tauri error when the native application shell cannot initialize
/// or run.
///
/// Coverage note: this is the native Tauri process boundary. Command behavior
/// is tested through `commands`; launching the desktop event loop from unit
/// tests would be brittle and environment-dependent.
#[expect(
    clippy::exit,
    reason = "tauri::generate_context! expands to framework-owned process-exit handling before application startup."
)]
pub fn run() -> tauri::Result<()> {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::site_status,
            commands::check_site
        ])
        .run(tauri::generate_context!())
}
