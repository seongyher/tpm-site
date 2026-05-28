//! Validates the studio frontend operation fixture against Rust operation types.

use std::error::Error;
use std::fs;
use std::io;
use std::path::PathBuf;

use tpm_operations::{
    OPERATION_SCHEMA_VERSION, OperationInterface, OperationPayload, OperationResult,
    OperationStatus,
};

fn frontend_fixture_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("src")
        .join("data")
        .join("read-only-operation.json")
}

fn authoring_fixture_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("src")
        .join("data")
        .join("authoring-operation.json")
}

fn core_workspace_status_fixture_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .join("tests")
        .join("fixtures")
        .join("rust-operations")
        .join("workspace-status-warning.json")
}

#[test]
fn frontend_operation_fixture_matches_rust_operation_contract() -> Result<(), Box<dyn Error>> {
    let fixture = fs::read_to_string(frontend_fixture_path())?;
    let fixture_value: serde_json::Value = serde_json::from_str(&fixture)?;
    let result: OperationResult = serde_json::from_str(&fixture)?;
    let round_tripped = serde_json::to_value(&result)?;

    assert_eq!(round_tripped, fixture_value);
    assert_eq!(result.schema_version(), OPERATION_SCHEMA_VERSION);
    assert_eq!(result.request().operation_id().as_str(), "workspace.status");
    assert_eq!(result.request().interface(), OperationInterface::Gui);
    assert_eq!(
        result.status(),
        OperationStatus::from_report(result.diagnostics())
    );

    Ok(())
}

#[test]
fn frontend_fixture_is_gui_projection_of_shared_operation_fixture() -> Result<(), Box<dyn Error>> {
    let frontend_fixture = fs::read_to_string(frontend_fixture_path())?;
    let core_fixture = fs::read_to_string(core_workspace_status_fixture_path())?;
    let frontend_value: serde_json::Value = serde_json::from_str(&frontend_fixture)?;
    let mut expected_value: serde_json::Value = serde_json::from_str(&core_fixture)?;

    let request = expected_value
        .get_mut("request")
        .and_then(serde_json::Value::as_object_mut)
        .ok_or_else(|| io::Error::other("shared operation fixture is missing request"))?;
    request.insert(
        String::from("interface"),
        serde_json::Value::String(String::from("gui")),
    );

    assert_eq!(frontend_value, expected_value);

    Ok(())
}

#[test]
fn frontend_authoring_fixture_matches_rust_operation_contract() -> Result<(), Box<dyn Error>> {
    let fixture = fs::read_to_string(authoring_fixture_path())?;
    let fixture_value: serde_json::Value = serde_json::from_str(&fixture)?;
    let result: OperationResult = serde_json::from_str(&fixture)?;
    let round_tripped = serde_json::to_value(&result)?;

    assert_eq!(round_tripped, fixture_value);
    assert_eq!(result.schema_version(), OPERATION_SCHEMA_VERSION);
    assert_eq!(
        result.request().operation_id().as_str(),
        "studio.workflow.verify"
    );
    assert_eq!(result.request().interface(), OperationInterface::Gui);
    assert_eq!(result.status(), OperationStatus::Partial);
    assert!(matches!(
        result.payload(),
        Some(OperationPayload::StudioAuthoring(_))
    ));
    assert!(!round_tripped.to_string().contains("secret-value"));
    assert!(round_tripped.to_string().contains("[redacted]"));

    Ok(())
}
