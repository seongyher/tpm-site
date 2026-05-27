//! Workspace discovery and source-root modeling for the TPM publishing platform.

use std::fmt::{Display, Formatter, Result as FormatResult};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tpm_core::Severity;
use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticReport};

/// Conventional site-instance layout used by the current platform.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WorkspaceLayout {
    root: PathBuf,
    site: PathBuf,
    site_config: PathBuf,
    content: PathBuf,
    assets: PathBuf,
    public: PathBuf,
    output: PathBuf,
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
            output: root.join("dist"),
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

    /// Returns the default generated-output root.
    #[must_use]
    pub fn output(&self) -> &Path {
        &self.output
    }

    /// Emits diagnostics for missing required workspace paths.
    #[must_use]
    pub fn validate_required_paths(&self) -> DiagnosticReport {
        WorkspaceContext::from_layout(self.clone()).validate_required_paths()
    }
}

/// Discovered workspace context for source-aware platform operations.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WorkspaceContext {
    layout: WorkspaceLayout,
}

impl WorkspaceContext {
    /// Builds a workspace context from a repository or fixture root.
    #[must_use]
    pub fn from_root(root: impl Into<PathBuf>) -> Self {
        Self::from_layout(WorkspaceLayout::from_root(root))
    }

    /// Builds a workspace context from a precomputed layout.
    #[must_use]
    pub const fn from_layout(layout: WorkspaceLayout) -> Self {
        Self { layout }
    }

    /// Discovers the nearest ancestor with the conventional site config path.
    pub fn discover(start: impl AsRef<Path>) -> Result<Self, WorkspaceDiscoveryError> {
        let start = start.as_ref();
        let first_directory = if start.is_file() {
            start.parent().unwrap_or(start)
        } else {
            start
        };

        for candidate in first_directory.ancestors() {
            let layout = WorkspaceLayout::from_root(candidate.to_path_buf());
            if layout.site_config().is_file() {
                return Ok(Self::from_layout(layout));
            }
        }

        Err(WorkspaceDiscoveryError::NotFound {
            start: start.to_path_buf(),
        })
    }

    /// Returns the conventional workspace layout.
    #[must_use]
    pub const fn layout(&self) -> &WorkspaceLayout {
        &self.layout
    }

    /// Returns the workspace root.
    #[must_use]
    pub fn root(&self) -> &Path {
        self.layout.root()
    }

    /// Returns the active site root.
    #[must_use]
    pub fn site(&self) -> &Path {
        self.layout.site()
    }

    /// Returns a deterministic path relative to the workspace root when possible.
    #[must_use]
    pub fn display_path(&self, path: &Path) -> String {
        display_path_from(self.root(), path)
    }

    /// Returns known source and generated-output roots.
    #[must_use]
    pub fn source_roots(&self) -> Vec<WorkspaceSourceRoot> {
        vec![
            WorkspaceSourceRoot::new(
                WorkspaceSourceRootKind::SiteConfig,
                self.layout.site_config(),
                self.display_path(self.layout.site_config()),
                true,
            ),
            WorkspaceSourceRoot::new(
                WorkspaceSourceRootKind::Content,
                self.layout.content(),
                self.display_path(self.layout.content()),
                true,
            ),
            WorkspaceSourceRoot::new(
                WorkspaceSourceRootKind::Assets,
                self.layout.assets(),
                self.display_path(self.layout.assets()),
                true,
            ),
            WorkspaceSourceRoot::new(
                WorkspaceSourceRootKind::Public,
                self.layout.public(),
                self.display_path(self.layout.public()),
                true,
            ),
            WorkspaceSourceRoot::new(
                WorkspaceSourceRootKind::Output,
                self.layout.output(),
                self.display_path(self.layout.output()),
                false,
            ),
        ]
    }

    /// Emits diagnostics for missing required workspace paths.
    #[must_use]
    pub fn validate_required_paths(&self) -> DiagnosticReport {
        let mut report = DiagnosticReport::new();
        self.require_directory(&mut report, "TPM-WORKSPACE-SITE", self.site(), "site root");
        self.require_file(
            &mut report,
            "TPM-WORKSPACE-CONFIG",
            self.layout.site_config(),
            "site configuration",
        );
        self.require_directory(
            &mut report,
            "TPM-WORKSPACE-CONTENT",
            self.layout.content(),
            "content root",
        );
        self.require_directory(
            &mut report,
            "TPM-WORKSPACE-ASSETS",
            self.layout.assets(),
            "asset root",
        );
        self.require_directory(
            &mut report,
            "TPM-WORKSPACE-PUBLIC",
            self.layout.public(),
            "public-file root",
        );
        report
    }

    /// Inventories source artifacts under the active site instance.
    pub fn inventory_source_artifacts(&self) -> io::Result<SourceInventory> {
        let policy = IgnoredPathPolicy::default();
        let mut artifacts = Vec::new();

        if self.layout.site_config().is_file() {
            artifacts
                .push(self.artifact_for(SourceArtifactKind::SiteConfig, self.layout.site_config()));
        }

        self.collect_directory_artifacts(
            self.layout.content(),
            SourceArtifactKind::Content,
            &policy,
            &mut artifacts,
        )?;
        self.collect_directory_artifacts(
            self.layout.assets(),
            SourceArtifactKind::Asset,
            &policy,
            &mut artifacts,
        )?;
        self.collect_directory_artifacts(
            self.layout.public(),
            SourceArtifactKind::PublicFile,
            &policy,
            &mut artifacts,
        )?;

        artifacts.sort_by(|left, right| left.display_path().cmp(right.display_path()));

        Ok(SourceInventory::new(artifacts))
    }

    fn require_directory(
        &self,
        report: &mut DiagnosticReport,
        code: &'static str,
        path: &Path,
        label: &str,
    ) {
        if !path.is_dir() {
            report.push(self.missing_path_diagnostic(code, path, label));
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
            report.push(self.missing_path_diagnostic(code, path, label));
        }
    }

    fn missing_path_diagnostic(&self, code: &'static str, path: &Path, label: &str) -> Diagnostic {
        let code = diagnostic_code(code);
        let display_path = self.display_path(path);

        Diagnostic::new(
            code,
            Severity::Error,
            format!("Missing {label} at `{display_path}`."),
        )
        .with_location(DiagnosticLocation::source(display_path))
        .with_remediation(
            "Create the expected path or point the workspace loader at a valid site instance.",
        )
    }

    fn collect_directory_artifacts(
        &self,
        root: &Path,
        kind: SourceArtifactKind,
        policy: &IgnoredPathPolicy,
        artifacts: &mut Vec<SourceArtifact>,
    ) -> io::Result<()> {
        if !root.exists() {
            return Ok(());
        }

        let mut entries = fs::read_dir(root)?.collect::<Result<Vec<_>, _>>()?;
        entries.sort_by_key(|entry| entry.path());

        for entry in entries {
            let path = entry.path();
            if policy.is_ignored(&path) {
                continue;
            }

            let file_type = entry.file_type()?;
            if file_type.is_dir() {
                self.collect_directory_artifacts(&path, kind, policy, artifacts)?;
            } else if file_type.is_file() {
                artifacts.push(self.artifact_for(kind, &path));
            }
        }

        Ok(())
    }

    fn artifact_for(&self, kind: SourceArtifactKind, path: &Path) -> SourceArtifact {
        SourceArtifact::new(kind, path.to_path_buf(), self.display_path(path))
    }
}

/// Workspace discovery failure.
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum WorkspaceDiscoveryError {
    /// No conventional site config path was found in the starting directory or
    /// its ancestors.
    NotFound {
        /// The path where discovery started.
        start: PathBuf,
    },
}

impl Display for WorkspaceDiscoveryError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        match self {
            Self::NotFound { start } => {
                write!(
                    formatter,
                    "could not find site/config/site.json from {}",
                    start.display()
                )
            }
        }
    }
}

impl std::error::Error for WorkspaceDiscoveryError {}

/// Known workspace source root category.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum WorkspaceSourceRootKind {
    /// Site configuration source.
    SiteConfig,
    /// Authored content collections.
    Content,
    /// Processed site assets.
    Assets,
    /// Public files copied to generated output.
    Public,
    /// Generated output root.
    Output,
}

/// Known workspace source or generated-output root.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceSourceRoot {
    kind: WorkspaceSourceRootKind,
    #[serde(skip)]
    path: PathBuf,
    display_path: String,
    required: bool,
}

impl WorkspaceSourceRoot {
    /// Creates a source-root model.
    #[must_use]
    pub fn new(
        kind: WorkspaceSourceRootKind,
        path: impl Into<PathBuf>,
        display_path: impl Into<String>,
        required: bool,
    ) -> Self {
        Self {
            kind,
            path: path.into(),
            display_path: display_path.into(),
            required,
        }
    }

    /// Returns the source-root kind.
    #[must_use]
    pub const fn kind(&self) -> WorkspaceSourceRootKind {
        self.kind
    }

    /// Returns the filesystem path.
    #[must_use]
    pub fn path(&self) -> &Path {
        &self.path
    }

    /// Returns the deterministic display path.
    #[must_use]
    pub fn display_path(&self) -> &str {
        &self.display_path
    }

    /// Returns whether this root is required for a valid workspace.
    #[must_use]
    pub const fn required(&self) -> bool {
        self.required
    }
}

/// Source artifact category.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum SourceArtifactKind {
    /// Site configuration file.
    SiteConfig,
    /// Authored content source.
    Content,
    /// Processed source asset.
    Asset,
    /// Public static file.
    PublicFile,
}

/// Source artifact discovered under the active site instance.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceArtifact {
    kind: SourceArtifactKind,
    #[serde(skip)]
    path: PathBuf,
    display_path: String,
}

impl SourceArtifact {
    /// Creates a source artifact model.
    #[must_use]
    pub fn new(
        kind: SourceArtifactKind,
        path: impl Into<PathBuf>,
        display_path: impl Into<String>,
    ) -> Self {
        Self {
            kind,
            path: path.into(),
            display_path: display_path.into(),
        }
    }

    /// Returns the artifact kind.
    #[must_use]
    pub const fn kind(&self) -> SourceArtifactKind {
        self.kind
    }

    /// Returns the filesystem path.
    #[must_use]
    pub fn path(&self) -> &Path {
        &self.path
    }

    /// Returns the deterministic display path.
    #[must_use]
    pub fn display_path(&self) -> &str {
        &self.display_path
    }
}

/// Source artifact inventory.
#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceInventory {
    artifacts: Vec<SourceArtifact>,
}

impl SourceInventory {
    /// Creates a source inventory from artifacts in deterministic order.
    #[must_use]
    pub const fn new(artifacts: Vec<SourceArtifact>) -> Self {
        Self { artifacts }
    }

    /// Returns source artifacts.
    #[must_use]
    pub fn artifacts(&self) -> &[SourceArtifact] {
        &self.artifacts
    }
}

/// Policy for source paths that should not count as authored artifacts.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct IgnoredPathPolicy {
    ignored_file_names: Vec<String>,
}

impl IgnoredPathPolicy {
    /// Returns whether the path should be skipped during source inventory.
    #[must_use]
    pub fn is_ignored(&self, path: &Path) -> bool {
        path.file_name()
            .and_then(|name| name.to_str())
            .is_some_and(|name| {
                self.ignored_file_names
                    .iter()
                    .any(|ignored| ignored == name)
            })
    }
}

impl Default for IgnoredPathPolicy {
    fn default() -> Self {
        Self {
            ignored_file_names: vec![
                String::from(".DS_Store"),
                String::from(".gitkeep"),
                String::from("Thumbs.db"),
            ],
        }
    }
}

fn diagnostic_code(code: &'static str) -> DiagnosticCode {
    DiagnosticCode::parse(code).unwrap_or_else(|error| {
        panic!("workspace diagnostic code should be valid: {error}");
    })
}

fn display_path_from(root: &Path, path: &Path) -> String {
    let display_path = path
        .strip_prefix(root)
        .map_or(path, |relative_path| relative_path);

    if display_path.as_os_str().is_empty() {
        String::from(".")
    } else {
        path_to_slash_string(display_path)
    }
}

fn path_to_slash_string(path: &Path) -> String {
    path.to_string_lossy()
        .replace([std::path::MAIN_SEPARATOR, '\\'], "/")
}

#[cfg(test)]
mod tests {
    use std::error::Error;
    use std::fs;
    use std::path::{Path, PathBuf};

    use super::{
        SourceArtifactKind, WorkspaceContext, WorkspaceDiscoveryError, WorkspaceLayout,
        WorkspaceSourceRootKind,
    };

    fn fixture_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .join("tests/fixtures/rust-workspace")
    }

    fn temp_workspace(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("tpm-workspace-{name}-{}", std::process::id()))
    }

    fn write_file(path: &Path, contents: &str) -> Result<(), Box<dyn Error>> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, contents)?;
        Ok(())
    }

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
        assert_eq!(layout.output(), PathBuf::from("example-workspace/dist"));
    }

    #[test]
    fn neutral_fixture_satisfies_required_workspace_paths() {
        let layout = WorkspaceLayout::from_root(fixture_root());
        let report = layout.validate_required_paths();

        assert!(
            report.is_empty(),
            "fixture should not emit missing-path diagnostics"
        );
    }

    #[test]
    fn neutral_fixture_uses_generic_publication_copy() {
        let layout = WorkspaceLayout::from_root(fixture_root());
        let config = fs::read_to_string(layout.site_config());

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

    #[test]
    fn discover_finds_workspace_from_nested_source_path() -> Result<(), Box<dyn Error>> {
        let nested_article = fixture_root()
            .join("site")
            .join("content")
            .join("articles")
            .join("hello-fixture.md");
        let context = WorkspaceContext::discover(nested_article)?;

        assert_eq!(
            context.display_path(context.layout().site_config()),
            "site/config/site.json"
        );
        assert_eq!(context.root(), fixture_root());

        Ok(())
    }

    #[test]
    fn discover_reports_missing_workspace() {
        let missing = PathBuf::from("/tmp/tpm-missing-workspace-start");
        let result = WorkspaceContext::discover(&missing);

        assert_eq!(
            result,
            Err(WorkspaceDiscoveryError::NotFound { start: missing })
        );
    }

    #[test]
    fn source_roots_include_required_inputs_and_optional_output() {
        let context = WorkspaceContext::from_root(fixture_root());
        let roots = context.source_roots();

        assert_eq!(roots.len(), 5);
        assert_eq!(roots[0].kind(), WorkspaceSourceRootKind::SiteConfig);
        assert_eq!(roots[0].display_path(), "site/config/site.json");
        assert!(roots[0].required());
        assert_eq!(roots[4].kind(), WorkspaceSourceRootKind::Output);
        assert_eq!(roots[4].display_path(), "dist");
        assert!(!roots[4].required());
    }

    #[test]
    fn inventory_source_artifacts_is_deterministic_and_ignores_parking_files()
    -> Result<(), Box<dyn Error>> {
        let context = WorkspaceContext::from_root(fixture_root());
        let inventory = context.inventory_source_artifacts()?;
        let artifacts = inventory.artifacts();
        let display_paths = artifacts
            .iter()
            .map(|artifact| artifact.display_path())
            .collect::<Vec<_>>();

        assert_eq!(
            display_paths,
            vec![
                "site/config/site.json",
                "site/content/articles/hello-fixture.md",
                "site/public/robots.txt",
            ]
        );
        assert_eq!(artifacts[0].kind(), SourceArtifactKind::SiteConfig);
        assert_eq!(artifacts[1].kind(), SourceArtifactKind::Content);
        assert_eq!(artifacts[2].kind(), SourceArtifactKind::PublicFile);

        Ok(())
    }

    #[test]
    fn missing_paths_emit_source_mapped_diagnostics() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("missing-paths");
        let _ = fs::remove_dir_all(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;

        let context = WorkspaceContext::from_root(&root);
        let report = context.validate_required_paths();
        let codes = report
            .diagnostics()
            .iter()
            .map(|diagnostic| diagnostic.code().as_str())
            .collect::<Vec<_>>();

        assert_eq!(
            codes,
            vec![
                "TPM-WORKSPACE-CONTENT",
                "TPM-WORKSPACE-ASSETS",
                "TPM-WORKSPACE-PUBLIC",
            ]
        );
        assert!(report.render_human().contains("at source site/content"));

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn starter_like_workspace_inventory_uses_the_same_contract() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("starter-like");
        let _ = fs::remove_dir_all(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        write_file(&root.join("site/content/pages/about.md"), "# About")?;
        write_file(&root.join("site/assets/photo.webp"), "")?;
        write_file(&root.join("site/public/.well-known/traffic-advice"), "{}")?;

        let context = WorkspaceContext::from_root(&root);
        let report = context.validate_required_paths();
        let inventory = context.inventory_source_artifacts()?;
        let display_paths = inventory
            .artifacts()
            .iter()
            .map(|artifact| artifact.display_path())
            .collect::<Vec<_>>();

        assert!(report.is_empty());
        assert_eq!(
            display_paths,
            vec![
                "site/assets/photo.webp",
                "site/config/site.json",
                "site/content/pages/about.md",
                "site/public/.well-known/traffic-advice",
            ]
        );

        let _ = fs::remove_dir_all(root);
        Ok(())
    }
}
