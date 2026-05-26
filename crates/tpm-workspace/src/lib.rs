//! Workspace discovery and source-root modeling for the TPM publishing platform.

use std::path::{Path, PathBuf};

use tpm_core::Severity;
use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticReport};

/// Conventional site-instance layout used by the current platform.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WorkspaceLayout {
    root: PathBuf,
    site: PathBuf,
    site_config: PathBuf,
    content: PathBuf,
    assets: PathBuf,
    public: PathBuf,
}

impl WorkspaceLayout {
    /// Builds a workspace layout from a repository or fixture root.
    #[must_use]
    pub fn from_root(root: impl Into<PathBuf>) -> Self {
        let root = root.into();
        let site = root.join("site");

        Self {
            site_config: site.join("config").join("site.json"),
            content: site.join("content"),
            assets: site.join("assets"),
            public: site.join("public"),
            site,
            root,
        }
    }

    /// Returns the workspace root.
    #[must_use]
    pub fn root(&self) -> &Path {
        &self.root
    }

    /// Returns the site-instance root.
    #[must_use]
    pub fn site(&self) -> &Path {
        &self.site
    }

    /// Returns the site configuration path.
    #[must_use]
    pub fn site_config(&self) -> &Path {
        &self.site_config
    }

    /// Returns the site content root.
    #[must_use]
    pub fn content(&self) -> &Path {
        &self.content
    }

    /// Returns the site asset root.
    #[must_use]
    pub fn assets(&self) -> &Path {
        &self.assets
    }

    /// Returns the site public-file root.
    #[must_use]
    pub fn public(&self) -> &Path {
        &self.public
    }

    /// Emits diagnostics for missing required workspace paths.
    #[must_use]
    pub fn validate_required_paths(&self) -> DiagnosticReport {
        let mut report = DiagnosticReport::new();
        self.require_directory(&mut report, "TPM-WORKSPACE-SITE", self.site(), "site root");
        self.require_file(
            &mut report,
            "TPM-WORKSPACE-CONFIG",
            self.site_config(),
            "site configuration",
        );
        self.require_directory(
            &mut report,
            "TPM-WORKSPACE-CONTENT",
            self.content(),
            "content root",
        );
        self.require_directory(
            &mut report,
            "TPM-WORKSPACE-ASSETS",
            self.assets(),
            "asset root",
        );
        self.require_directory(
            &mut report,
            "TPM-WORKSPACE-PUBLIC",
            self.public(),
            "public-file root",
        );
        report
    }

    fn require_directory(
        &self,
        report: &mut DiagnosticReport,
        code: &'static str,
        path: &Path,
        label: &str,
    ) {
        if !path.is_dir() {
            report.push(missing_path_diagnostic(code, path, label));
        }
    }

    fn require_file(
        &self,
        report: &mut DiagnosticReport,
        code: &'static str,
        path: &Path,
        label: &str,
    ) {
        if !path.is_file() {
            report.push(missing_path_diagnostic(code, path, label));
        }
    }
}

fn missing_path_diagnostic(code: &'static str, path: &Path, label: &str) -> Diagnostic {
    let Ok(code) = DiagnosticCode::parse(code) else {
        unreachable!("workspace diagnostic code should be valid");
    };

    Diagnostic::new(
        code,
        Severity::Error,
        format!("Missing {label} at `{}`.", path.display()),
    )
    .with_help("Create the expected path or point the workspace loader at a valid site instance.")
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::WorkspaceLayout;

    #[test]
    fn workspace_layout_derives_conventional_site_paths() {
        let layout = WorkspaceLayout::from_root(PathBuf::from("example-workspace"));

        assert_eq!(layout.site(), PathBuf::from("example-workspace/site"));
        assert_eq!(
            layout.site_config(),
            PathBuf::from("example-workspace/site/config/site.json")
        );
        assert_eq!(
            layout.content(),
            PathBuf::from("example-workspace/site/content")
        );
        assert_eq!(
            layout.assets(),
            PathBuf::from("example-workspace/site/assets")
        );
        assert_eq!(
            layout.public(),
            PathBuf::from("example-workspace/site/public")
        );
    }

    #[test]
    fn neutral_fixture_satisfies_required_workspace_paths() {
        let fixture = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .join("tests/fixtures/rust-workspace");
        let layout = WorkspaceLayout::from_root(fixture);
        let report = layout.validate_required_paths();

        assert!(
            report.is_empty(),
            "fixture should not emit missing-path diagnostics"
        );
    }

    #[test]
    fn neutral_fixture_uses_generic_publication_copy() {
        let fixture = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .join("tests/fixtures/rust-workspace");
        let layout = WorkspaceLayout::from_root(fixture);
        let config = std::fs::read_to_string(layout.site_config());

        assert!(
            config
                .as_ref()
                .is_ok_and(|content| content.contains("\"name\": \"Example Journal\""))
        );
        assert!(
            config
                .as_ref()
                .is_ok_and(|content| !content.contains("The Philosopher's Meme"))
        );
    }
}
