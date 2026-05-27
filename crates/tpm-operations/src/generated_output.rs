//! Generated-output verification report bridge for parity-protected migration.

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

/// Runs the Rust generated-output report bridge.
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
                .with_detail(format!("output root: {}", context.display_path(output)))
                .with_detail("dual-run parity target: verify, validate:html, build:cloudflare");

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

            diagnostics.push(
                Diagnostic::new(
                    diagnostic_code("TPM-OUTPUT-DUAL-RUN"),
                    Severity::Note,
                    "Rust generated-output verification is a report bridge; TypeScript verifiers remain source of truth until promotion.",
                )
                .with_location(DiagnosticLocation::artifact(context.display_path(output)))
                .with_remediation(
                    "Compare this report with verify, validate:html, and build:cloudflare output before promotion.",
                ),
            );

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

fn operation_id(value: &'static str) -> OperationId {
    OperationId::parse(value).unwrap_or_else(|error| {
        panic!("generated-output operation ID should be valid: {error}");
    })
}

fn diagnostic_code(value: &'static str) -> DiagnosticCode {
    DiagnosticCode::parse(value).unwrap_or_else(|error| {
        panic!("generated-output diagnostic code should be valid: {error}");
    })
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

    use super::run_generated_output_bridge;
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
        write_file(&root.join("dist/_redirects"), "/old/ /new/ 301")?;
        write_file(&root.join("dist/sitemap-index.xml"), "<sitemapindex />")?;

        let result = run_generated_output_bridge(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Warning);
        assert!(
            result
                .summary()
                .details()
                .iter()
                .any(|detail| detail == "html files: 1")
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
}
