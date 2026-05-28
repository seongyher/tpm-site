//! Native desktop entry point for TPM Studio.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![expect(
    clippy::multiple_crate_versions,
    reason = "Tauri's platform dependency graph currently contains unavoidable duplicate transitive versions; cargo-deny remains the supply-chain review gate."
)]
// Coverage note: the binary entry point delegates directly to the library
// Tauri runner. The runner is a native app process boundary; command behavior
// is covered in library tests.
fn main() -> tauri::Result<()> {
    tpm_studio::run()
}
