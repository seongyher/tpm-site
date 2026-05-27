//! Integration tests for the internal TPM xtask binary entrypoint.

use std::error::Error;
use std::process::Command;

#[test]
fn xtask_binary_help_identifies_internal_surface() -> Result<(), Box<dyn Error>> {
    let output = Command::new(env!("CARGO_BIN_EXE_tpm-xtask"))
        .arg("--help")
        .output()?;

    assert!(output.status.success());
    assert!(String::from_utf8_lossy(&output.stdout).contains("internal repository automation"));

    Ok(())
}

#[test]
fn xtask_binary_maps_unknown_task_to_usage_exit_code() -> Result<(), Box<dyn Error>> {
    let output = Command::new(env!("CARGO_BIN_EXE_tpm-xtask"))
        .arg("missing-task")
        .output()?;

    assert_eq!(output.status.code(), Some(64));
    assert!(String::from_utf8_lossy(&output.stdout).contains("Unknown task `missing-task`."));

    Ok(())
}
