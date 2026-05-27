//! Integration tests for the compiled TPM CLI binary entrypoint.

use std::error::Error;
use std::process::Command;

#[test]
fn binary_entrypoint_maps_success_exit_code() -> Result<(), Box<dyn Error>> {
    let output = Command::new(env!("CARGO_BIN_EXE_tpm"))
        .arg("--version")
        .output()?;

    assert!(output.status.success());
    assert!(String::from_utf8_lossy(&output.stdout).contains("TPM Platform"));

    Ok(())
}

#[test]
fn binary_entrypoint_maps_usage_exit_code() -> Result<(), Box<dyn Error>> {
    let output = Command::new(env!("CARGO_BIN_EXE_tpm"))
        .arg("--bogus")
        .output()?;

    assert_eq!(output.status.code(), Some(64));
    assert!(String::from_utf8_lossy(&output.stdout).contains("Unknown option `--bogus`."));

    Ok(())
}
