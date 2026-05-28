//! Generated-output verification report for static build artifacts.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use tpm_core::Severity;
use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticReport};
use tpm_workspace::WorkspaceContext;

use crate::{
    OperationId, OperationInterface, OperationRequest, OperationResult, OperationSummary,
    OperationTiming,
};

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
struct OutputInventory {
    files: usize,
    html_files: usize,
    has_redirects: bool,
    has_sitemap_index: bool,
}

/// Runs the generated-output report.
#[must_use]
pub fn run_generated_output_bridge(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    let start = start.into();
    let request = OperationRequest::new(operation_id("output.verify"), interface)
        .with_workspace(display_path(&start));

    match WorkspaceContext::discover(&start) {
        Ok(context) => {
            let output = context.layout().output();
            let mut diagnostics = DiagnosticReport::new();
            let mut summary = OperationSummary::new("Generated-output report completed")
                .with_detail(format!("output root: {}", context.display_path(output)));

            if output.is_dir() {
                match inventory_output(output) {
                    Ok(inventory) => {
                        summary = summary
                            .with_detail(format!("output files: {}", inventory.files))
                            .with_detail(format!("html files: {}", inventory.html_files))
                            .with_detail(format!("has _redirects: {}", inventory.has_redirects))
                            .with_detail(format!(
                                "has sitemap-index.xml: {}",
                                inventory.has_sitemap_index
                            ));
                    }
                    // Coverage note: this branch depends on host filesystem
                    // permission/read errors while walking `dist/`. Unit tests
                    // cover successful inventory and missing-output behavior;
                    // permission failures are retained as defensive IO handling.
                    Err(error) => diagnostics.push(
                        Diagnostic::new(
                            diagnostic_code("TPM-OUTPUT-SCAN"),
                            Severity::Error,
                            format!("Could not scan generated output: {error}."),
                        )
                        .with_location(DiagnosticLocation::artifact(context.display_path(output)))
                        .with_remediation(
                            "Check filesystem permissions for the generated output directory.",
                        ),
                    ),
                }
            } else {
                diagnostics.push(
                    Diagnostic::new(
                        diagnostic_code("TPM-OUTPUT-MISSING"),
                        Severity::Warning,
                        format!(
                            "No generated output directory exists at `{}`.",
                            context.display_path(output)
                        ),
                    )
                    .with_location(DiagnosticLocation::artifact(context.display_path(output)))
                    .with_remediation(
                        "Run the release build before verifying generated output artifacts.",
                    ),
                );
            }

            OperationResult::new(request, summary, OperationTiming::default(), diagnostics)
        }
        Err(error) => OperationResult::new(
            request,
            OperationSummary::new("Generated-output report failed")
                .with_detail(format!("workspace discovery failed: {error}")),
            OperationTiming::default(),
            DiagnosticReport::from_diagnostics(vec![Diagnostic::new(
                diagnostic_code("TPM-OUTPUT-WORKSPACE"),
                Severity::Error,
                "Could not discover a workspace for generated-output reporting.",
            )
            .with_location(DiagnosticLocation::source(display_path(&start)))
            .with_remediation(
                "Run output verification from a repo with site/config/site.json or pass --site.",
            )]),
        ),
    }
}

fn inventory_output(root: &Path) -> io::Result<OutputInventory> {
    let mut inventory = OutputInventory::default();
    collect_output(root, &mut inventory)?;
    Ok(inventory)
}

fn collect_output(dir: &Path, inventory: &mut OutputInventory) -> io::Result<()> {
    let mut entries = fs::read_dir(dir)?.collect::<Result<Vec<_>, _>>()?;
    entries.sort_by_key(fs::DirEntry::path);

    for entry in entries {
        let path = entry.path();
        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            collect_output(&path, inventory)?;
        } else if file_type.is_file() {
            inventory.files += 1;
            if path.file_name().and_then(|name| name.to_str()) == Some("_redirects") {
                inventory.has_redirects = true;
            }
            if path.file_name().and_then(|name| name.to_str()) == Some("sitemap-index.xml") {
                inventory.has_sitemap_index = true;
            }
            if path.extension().and_then(|extension| extension.to_str()) == Some("html") {
                inventory.html_files += 1;
            }
        }
    }

    Ok(())
}

#[expect(
    clippy::expect_used,
    reason = "generated-output operation IDs are static repository invariants"
)]
fn operation_id(value: &'static str) -> OperationId {
    OperationId::parse(value).expect("generated-output operation ID should be valid")
}

#[expect(
    clippy::expect_used,
    reason = "generated-output diagnostic codes are static repository invariants"
)]
fn diagnostic_code(value: &'static str) -> DiagnosticCode {
    DiagnosticCode::parse(value).expect("generated-output diagnostic code should be valid")
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
    use std::error::Error;
    use std::fs;
    use std::path::{Path, PathBuf};

    #[cfg(unix)]
    use std::os::unix::fs::PermissionsExt;

    use super::{display_path, run_generated_output_bridge};
    use crate::{OperationInterface, OperationStatus};

    fn temp_workspace(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("tpm-output-{name}-{}", std::process::id()))
    }

    fn write_file(path: &Path, contents: &str) -> Result<(), Box<dyn Error>> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, contents)?;
        Ok(())
    }

    #[cfg(unix)]
    fn make_unreadable(path: &Path) -> Result<fs::Permissions, Box<dyn Error>> {
        let original = fs::metadata(path)?.permissions();
        fs::set_permissions(path, fs::Permissions::from_mode(0o000))?;
        Ok(original)
    }

    #[test]
    fn output_bridge_warns_when_dist_is_missing() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("missing");
        let _ = fs::remove_dir_all(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;

        let result = run_generated_output_bridge(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Warning);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-OUTPUT-MISSING")
        );

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn output_bridge_reports_dist_inventory() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("inventory");
        let _ = fs::remove_dir_all(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        write_file(&root.join("dist/index.html"), "<!doctype html>")?;
        write_file(
            &root.join("dist/articles/example/index.html"),
            "<!doctype html>",
        )?;
        write_file(&root.join("dist/assets/site.css"), "body{}")?;
        write_file(&root.join("dist/_redirects"), "/old/ /new/ 301")?;
        write_file(&root.join("dist/sitemap-index.xml"), "<sitemapindex />")?;

        let result = run_generated_output_bridge(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Success);
        assert!(
            result
                .summary()
                .details()
                .iter()
                .any(|detail| detail == "output files: 5")
        );
        assert!(
            result
                .summary()
                .details()
                .iter()
                .any(|detail| detail == "html files: 2")
        );
        assert!(
            result
                .summary()
                .details()
                .iter()
                .any(|detail| detail == "has _redirects: true")
        );

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[cfg(unix)]
    #[test]
    fn output_bridge_reports_dist_scan_failures() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("scan-failure");
        let _ = fs::remove_dir_all(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        fs::create_dir_all(root.join("dist/unreadable"))?;
        let original_permissions = make_unreadable(&root.join("dist/unreadable"))?;

        let result = run_generated_output_bridge(&root, OperationInterface::Test);

        fs::set_permissions(root.join("dist/unreadable"), original_permissions)?;
        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-OUTPUT-SCAN")
        );

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn output_bridge_reports_workspace_discovery_failure() {
        let root = PathBuf::from("/tmp/tpm-output-missing-workspace");

        let result = run_generated_output_bridge(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-OUTPUT-WORKSPACE")
        );
    }

    #[test]
    fn generated_output_display_path_handles_empty_paths() {
        assert_eq!(display_path(Path::new("")), ".");
    }
}
