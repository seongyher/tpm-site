//! QA registry and diagnostic-diff operations for parity-protected migration.

use std::collections::BTreeMap;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tpm_core::Severity;
use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticReport};
use tpm_workspace::WorkspaceContext;

use crate::{
    OperationId, OperationInterface, OperationRequest, OperationResult, OperationSummary,
    OperationTiming, migration_plan,
};

/// A normalized diagnostic emitted by a QA command or adapter.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticRecord {
    code: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    count: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    file: Option<String>,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    route: Option<String>,
    severity: String,
    tool: String,
}

impl DiagnosticRecord {
    /// Creates a normalized diagnostic record with required fields.
    #[must_use]
    pub fn new(
        tool: impl Into<String>,
        code: impl Into<String>,
        severity: impl Into<String>,
        message: impl Into<String>,
    ) -> Self {
        Self {
            code: code.into(),
            count: None,
            file: None,
            message: message.into(),
            route: None,
            severity: severity.into(),
            tool: tool.into(),
        }
    }

    /// Adds a positive aggregate count.
    #[must_use]
    pub const fn with_count(mut self, count: u64) -> Self {
        self.count = Some(count);
        self
    }

    /// Adds a source-file path.
    #[must_use]
    pub fn with_file(mut self, file: impl Into<String>) -> Self {
        self.file = Some(file.into());
        self
    }

    /// Adds a route path.
    #[must_use]
    pub fn with_route(mut self, route: impl Into<String>) -> Self {
        self.route = Some(route.into());
        self
    }

    fn key(&self) -> [String; 6] {
        [
            self.tool.clone(),
            self.code.clone(),
            self.severity.clone(),
            self.file.clone().unwrap_or_default(),
            self.route.clone().unwrap_or_default(),
            self.message.clone(),
        ]
    }

    const fn count(&self) -> u64 {
        match self.count {
            Some(count) => count,
            None => 1,
        }
    }

    fn location_label(&self) -> &str {
        self.file
            .as_deref()
            .or(self.route.as_deref())
            .unwrap_or("(global)")
    }

    fn validate(&self) -> Result<(), &'static str> {
        if self.tool.trim().is_empty() {
            return Err("tool must not be empty");
        }
        if self.code.trim().is_empty() {
            return Err("code must not be empty");
        }
        if self.severity.trim().is_empty() {
            return Err("severity must not be empty");
        }
        if self.message.trim().is_empty() {
            return Err("message must not be empty");
        }
        if self.count() == 0 {
            return Err("count must be positive");
        }

        Ok(())
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct DiagnosticBucket {
    count: u64,
    record: DiagnosticRecord,
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct DiagnosticDelta {
    actual_count: u64,
    expected_count: u64,
    record: DiagnosticRecord,
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
struct DiagnosticDiff {
    added: Vec<DiagnosticDelta>,
    count_changed: Vec<DiagnosticDelta>,
    missing: Vec<DiagnosticDelta>,
}

impl DiagnosticDiff {
    const fn is_empty(&self) -> bool {
        self.added.is_empty() && self.count_changed.is_empty() && self.missing.is_empty()
    }
}

/// Runs the Rust QA registry report.
#[must_use]
pub fn run_qa_registry(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    let start = start.into();
    let request = OperationRequest::new(operation_id("qa.registry"), interface)
        .with_workspace(display_path(&start));

    match WorkspaceContext::discover(&start) {
        Ok(context) => match package_scripts(&context.root().join("package.json")) {
            Ok(scripts) => {
                let rust_wrapper_debt =
                    ["rust:check", "rust:coverage", "rust:deny", "rust:nextest"]
                        .iter()
                        .filter(|script| scripts.contains_key(**script))
                        .count();
                let summary = OperationSummary::new("QA registry report completed")
                    .with_detail(format!("package scripts: {}", scripts.len()))
                    .with_detail(format!("migration domains: {}", migration_plan().len()))
                    .with_detail(format!("rust package-wrapper debt: {rust_wrapper_debt}"))
                    .with_detail("command owner target: just and Rust operations")
                    .with_detail("package-script surface: retired");
                let diagnostics = DiagnosticReport::from_diagnostics(vec![
                    Diagnostic::new(
                        diagnostic_code("TPM-QA-REGISTRY"),
                        Severity::Note,
                        "Rust QA registry reporting tracks just command ownership and remaining command-surface debt.",
                    )
                    .with_location(DiagnosticLocation::source(
                        context.display_path(&context.root().join("justfile")),
                    ))
                    .with_remediation(
                        "Keep CI/local parity evidence explicit when adding, renaming, or retiring repository commands.",
                    ),
                ]);

                OperationResult::new(request, summary, OperationTiming::default(), diagnostics)
            }
            Err(error) => OperationResult::new(
                request,
                OperationSummary::new("QA registry report failed"),
                OperationTiming::default(),
                DiagnosticReport::from_diagnostics(vec![
                    Diagnostic::new(
                        diagnostic_code("TPM-QA-PACKAGE-READ"),
                        Severity::Error,
                        format!(
                            "Could not read package scripts for QA registry reporting: {error}."
                        ),
                    )
                    .with_location(DiagnosticLocation::source(
                        context.display_path(&context.root().join("package.json")),
                    ))
                    .with_remediation("Check package.json exists and is valid JSON."),
                ]),
            ),
        },
        Err(error) => OperationResult::new(
            request,
            OperationSummary::new("QA registry report failed")
                .with_detail(format!("workspace discovery failed: {error}")),
            OperationTiming::default(),
            DiagnosticReport::from_diagnostics(vec![Diagnostic::new(
                diagnostic_code("TPM-QA-WORKSPACE"),
                Severity::Error,
                "Could not discover a workspace for QA registry reporting.",
            )
            .with_location(DiagnosticLocation::source(display_path(&start)))
            .with_remediation(
                "Run QA registry reporting from a repo with site/config/site.json or pass --site.",
            )]),
        ),
    }
}

/// Runs the Rust diagnostic-diff operation.
#[must_use]
pub fn run_qa_diagnostic_diff(
    start: impl Into<PathBuf>,
    expected_path: impl Into<PathBuf>,
    actual_path: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    let start = start.into();
    let expected_path = expected_path.into();
    let actual_path = actual_path.into();
    let request = OperationRequest::new(operation_id("qa.diagnostics-diff"), interface)
        .with_workspace(display_path(&start));

    let expected = read_diagnostic_records(&expected_path);
    let actual = read_diagnostic_records(&actual_path);
    match (expected, actual) {
        (Ok(expected), Ok(actual)) => {
            let diff = compare_diagnostics(&expected, &actual);
            let diagnostics = diff_diagnostics(&diff, &expected_path, &actual_path);
            let summary = OperationSummary::new("Diagnostic diff completed")
                .with_detail(format!("expected diagnostics: {}", expected.len()))
                .with_detail(format!("actual diagnostics: {}", actual.len()))
                .with_detail(format!("missing: {}", diff.missing.len()))
                .with_detail(format!("added: {}", diff.added.len()))
                .with_detail(format!("count changes: {}", diff.count_changed.len()));

            OperationResult::new(request, summary, OperationTiming::default(), diagnostics)
        }
        (Err(error), _) => diagnostic_diff_read_failure(request, &expected_path, &error),
        (_, Err(error)) => diagnostic_diff_read_failure(request, &actual_path, &error),
    }
}

fn package_scripts(path: &Path) -> io::Result<BTreeMap<String, String>> {
    let contents = fs::read_to_string(path)?;
    let parsed: serde_json::Value = serde_json::from_str(&contents).map_err(io::Error::other)?;
    let Some(scripts_value) = parsed.get("scripts") else {
        return Ok(BTreeMap::new());
    };

    let scripts = scripts_value.as_object().ok_or_else(|| {
        io::Error::new(io::ErrorKind::InvalidData, "scripts field is not an object")
    })?;

    scripts
        .iter()
        .map(|(key, value)| {
            value
                .as_str()
                .map(|script| (key.clone(), script.to_owned()))
                .ok_or_else(|| {
                    io::Error::new(
                        io::ErrorKind::InvalidData,
                        format!("script `{key}` is not a string"),
                    )
                })
        })
        .collect()
}

fn read_diagnostic_records(path: &Path) -> io::Result<Vec<DiagnosticRecord>> {
    let contents = fs::read_to_string(path)?;
    let records: Vec<DiagnosticRecord> =
        serde_json::from_str(&contents).map_err(io::Error::other)?;

    for (index, record) in records.iter().enumerate() {
        record.validate().map_err(|message| {
            io::Error::new(
                io::ErrorKind::InvalidData,
                format!("{}[{index}] is invalid: {message}", display_path(path)),
            )
        })?;
    }

    Ok(records)
}

fn compare_diagnostics(
    expected: &[DiagnosticRecord],
    actual: &[DiagnosticRecord],
) -> DiagnosticDiff {
    let expected = diagnostic_buckets(expected);
    let actual = diagnostic_buckets(actual);
    let mut added = Vec::new();
    let mut count_changed = Vec::new();
    let mut missing = Vec::new();
    let mut keys = expected
        .keys()
        .chain(actual.keys())
        .cloned()
        .collect::<Vec<_>>();
    keys.sort();
    keys.dedup();

    for key in keys {
        match (expected.get(&key), actual.get(&key)) {
            (None, Some(actual_bucket)) => {
                added.push(delta(&actual_bucket.record, 0, actual_bucket.count));
            }
            (Some(expected_bucket), None) => {
                missing.push(delta(&expected_bucket.record, expected_bucket.count, 0));
            }
            (Some(expected_bucket), Some(actual_bucket))
                if expected_bucket.count != actual_bucket.count =>
            {
                count_changed.push(delta(
                    &actual_bucket.record,
                    expected_bucket.count,
                    actual_bucket.count,
                ));
            }
            _ => {}
        }
    }

    DiagnosticDiff {
        added,
        count_changed,
        missing,
    }
}

fn diagnostic_buckets(records: &[DiagnosticRecord]) -> BTreeMap<[String; 6], DiagnosticBucket> {
    let mut buckets: BTreeMap<[String; 6], DiagnosticBucket> = BTreeMap::new();

    for record in records {
        let key = record.key();
        let existing = buckets.get(&key);
        buckets.insert(
            key,
            DiagnosticBucket {
                count: existing
                    .map_or_else(|| record.count(), |bucket| bucket.count + record.count()),
                record: existing.map_or_else(|| record.clone(), |bucket| bucket.record.clone()),
            },
        );
    }

    buckets
}

fn delta(record: &DiagnosticRecord, expected_count: u64, actual_count: u64) -> DiagnosticDelta {
    DiagnosticDelta {
        actual_count,
        expected_count,
        record: record.clone(),
    }
}

fn diff_diagnostics(
    diff: &DiagnosticDiff,
    expected_path: &Path,
    actual_path: &Path,
) -> DiagnosticReport {
    if diff.is_empty() {
        return DiagnosticReport::new();
    }

    let mut diagnostics = Vec::new();
    diagnostics.extend(diff.missing.iter().map(|delta| {
        diff_diagnostic(
            "TPM-QA-DIAGNOSTIC-MISSING",
            delta,
            expected_path,
            "Expected diagnostic is missing from the actual snapshot.",
        )
    }));
    diagnostics.extend(diff.added.iter().map(|delta| {
        diff_diagnostic(
            "TPM-QA-DIAGNOSTIC-ADDED",
            delta,
            actual_path,
            "Actual snapshot added a diagnostic not present in the expected snapshot.",
        )
    }));
    diagnostics.extend(diff.count_changed.iter().map(|delta| {
        diff_diagnostic(
            "TPM-QA-DIAGNOSTIC-COUNT",
            delta,
            actual_path,
            "Diagnostic count changed between snapshots.",
        )
    }));

    DiagnosticReport::from_diagnostics(diagnostics)
}

fn diff_diagnostic(
    code: &'static str,
    delta: &DiagnosticDelta,
    path: &Path,
    message: &'static str,
) -> Diagnostic {
    Diagnostic::new(
        diagnostic_code(code),
        Severity::Error,
        format!(
            "{message} {}:{} {} at {} expected {}, actual {}.",
            delta.record.tool,
            delta.record.code,
            delta.record.severity,
            delta.record.location_label(),
            delta.expected_count,
            delta.actual_count
        ),
    )
    .with_location(DiagnosticLocation::source(display_path(path)))
    .with_remediation("Review the diagnostic baseline or investigate the changed QA behavior.")
}

fn diagnostic_diff_read_failure(
    request: OperationRequest,
    path: &Path,
    error: &io::Error,
) -> OperationResult {
    OperationResult::new(
        request,
        OperationSummary::new("Diagnostic diff failed"),
        OperationTiming::default(),
        DiagnosticReport::from_diagnostics(vec![
            Diagnostic::new(
                diagnostic_code("TPM-QA-DIAGNOSTIC-DIFF-READ"),
                Severity::Error,
                format!(
                    "Could not read diagnostic snapshot `{}`: {error}.",
                    display_path(path)
                ),
            )
            .with_location(DiagnosticLocation::source(display_path(path)))
            .with_remediation(
                "Provide two JSON files containing arrays of normalized diagnostic records.",
            ),
        ]),
    )
}

#[expect(
    clippy::expect_used,
    reason = "QA operation IDs are static repository invariants"
)]
fn operation_id(value: &'static str) -> OperationId {
    OperationId::parse(value).expect("QA operation ID should be valid")
}

#[expect(
    clippy::expect_used,
    reason = "QA diagnostic codes are static repository invariants"
)]
fn diagnostic_code(value: &'static str) -> DiagnosticCode {
    DiagnosticCode::parse(value).expect("QA diagnostic code should be valid")
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
    #![expect(
        clippy::expect_used,
        reason = "QA tests use fixture lookups whose presence is the asserted precondition"
    )]

    use std::error::Error;
    use std::fs;
    use std::path::{Path, PathBuf};

    use super::{
        DiagnosticRecord, compare_diagnostics, diagnostic_buckets, package_scripts,
        run_qa_diagnostic_diff, run_qa_registry,
    };
    use crate::{OperationInterface, OperationStatus};

    fn repo_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
    }

    fn temp_workspace(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("tpm-qa-{name}-{}", std::process::id()))
    }

    fn write_file(path: &Path, contents: &str) -> Result<(), Box<dyn Error>> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, contents)?;
        Ok(())
    }

    #[test]
    fn qa_registry_reports_package_script_inventory() {
        let result = run_qa_registry(repo_root(), OperationInterface::Test);

        assert_ne!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .summary()
                .details()
                .iter()
                .any(|detail| detail.starts_with("package scripts: "))
        );
    }

    #[test]
    fn diagnostic_diff_detects_missing_added_and_count_changes() {
        let expected = vec![
            DiagnosticRecord::new("tool", "A", "warning", "same").with_count(2),
            DiagnosticRecord::new("tool", "B", "error", "missing").with_file("a.md"),
        ];
        let actual = vec![
            DiagnosticRecord::new("tool", "A", "warning", "same"),
            DiagnosticRecord::new("tool", "C", "warning", "added").with_route("/route/"),
        ];

        let diff = compare_diagnostics(&expected, &actual);

        assert_eq!(diff.missing.len(), 1);
        assert_eq!(diff.added.len(), 1);
        assert_eq!(diff.count_changed.len(), 1);
    }

    #[test]
    fn diagnostic_records_validate_required_fields_and_counts() {
        for record in [
            DiagnosticRecord::new("", "A", "warning", "message"),
            DiagnosticRecord::new("tool", "", "warning", "message"),
            DiagnosticRecord::new("tool", "A", "", "message"),
            DiagnosticRecord::new("tool", "A", "warning", ""),
            DiagnosticRecord::new("tool", "A", "warning", "message").with_count(0),
        ] {
            assert!(record.validate().is_err());
        }

        let record = DiagnosticRecord::new("tool", "A", "warning", "message")
            .with_file("article.md")
            .with_route("/article/");

        assert_eq!(record.count(), 1);
        assert_eq!(record.location_label(), "article.md");
        assert!(record.validate().is_ok());
    }

    #[test]
    fn diagnostic_buckets_aggregate_duplicate_records() {
        let records = vec![
            DiagnosticRecord::new("tool", "A", "warning", "same").with_count(2),
            DiagnosticRecord::new("tool", "A", "warning", "same").with_count(3),
        ];
        let buckets = diagnostic_buckets(&records);
        let bucket = buckets.values().next().expect("bucket should exist");

        assert_eq!(bucket.count, 5);
    }

    #[test]
    fn diagnostic_diff_operation_succeeds_for_matching_snapshots() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("same");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        let snapshot =
            r#"[{"tool":"tool","code":"A","severity":"warning","message":"same","count":2}]"#;
        write_file(&root.join("expected.json"), snapshot)?;
        write_file(&root.join("actual.json"), snapshot)?;

        let result = run_qa_diagnostic_diff(
            &root,
            root.join("expected.json"),
            root.join("actual.json"),
            OperationInterface::Test,
        );

        assert_eq!(result.status(), OperationStatus::Success);
        assert!(
            result
                .summary()
                .details()
                .iter()
                .any(|detail| detail == "missing: 0")
        );

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn diagnostic_diff_operation_fails_on_changed_snapshots() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("diff");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        write_file(
            &root.join("expected.json"),
            r#"[{"tool":"tool","code":"A","severity":"warning","message":"old"}]"#,
        )?;
        write_file(
            &root.join("actual.json"),
            r#"[{"tool":"tool","code":"B","severity":"warning","message":"new"}]"#,
        )?;

        let result = run_qa_diagnostic_diff(
            &root,
            root.join("expected.json"),
            root.join("actual.json"),
            OperationInterface::Test,
        );

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-QA-DIAGNOSTIC-MISSING")
        );

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn diagnostic_diff_operation_reports_count_changes() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("count-change");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        write_file(
            &root.join("expected.json"),
            r#"[
              {"tool":"tool","code":"A","severity":"warning","message":"same"},
              {"tool":"tool","code":"A","severity":"warning","message":"same"}
            ]"#,
        )?;
        write_file(
            &root.join("actual.json"),
            r#"[{"tool":"tool","code":"A","severity":"warning","message":"same"}]"#,
        )?;

        let result = run_qa_diagnostic_diff(
            &root,
            root.join("expected.json"),
            root.join("actual.json"),
            OperationInterface::Test,
        );

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-QA-DIAGNOSTIC-COUNT")
        );

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn diagnostic_diff_operation_reports_read_and_validation_failures() -> Result<(), Box<dyn Error>>
    {
        let root = temp_workspace("read-failure");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        write_file(
            &root.join("expected.json"),
            r#"[{"tool":"","code":"A","severity":"warning","message":"bad"}]"#,
        )?;

        let result = run_qa_diagnostic_diff(
            &root,
            root.join("expected.json"),
            root.join("actual.json"),
            OperationInterface::Test,
        );

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-QA-DIAGNOSTIC-DIFF-READ")
        );

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn diagnostic_diff_operation_reports_actual_read_failures() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("actual-read-failure");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        write_file(
            &root.join("expected.json"),
            r#"[{"tool":"tool","code":"A","severity":"warning","message":"ok"}]"#,
        )?;

        let result = run_qa_diagnostic_diff(
            &root,
            root.join("expected.json"),
            root.join("actual.json"),
            OperationInterface::Test,
        );

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-QA-DIAGNOSTIC-DIFF-READ")
        );

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn diagnostic_diff_operation_reports_actual_validation_failures() -> Result<(), Box<dyn Error>>
    {
        let root = temp_workspace("actual-validation-failure");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        write_file(
            &root.join("expected.json"),
            r#"[{"tool":"tool","code":"A","severity":"warning","message":"ok"}]"#,
        )?;
        write_file(
            &root.join("actual.json"),
            r#"[{"tool":"tool","code":"A","severity":"warning","message":"","route":"/"}]"#,
        )?;

        let result = run_qa_diagnostic_diff(
            &root,
            root.join("expected.json"),
            root.join("actual.json"),
            OperationInterface::Test,
        );

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(result.diagnostics().diagnostics().iter().any(|diagnostic| {
            diagnostic.code().as_str() == "TPM-QA-DIAGNOSTIC-DIFF-READ"
                && diagnostic.message().contains("message must not be empty")
        }));

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn qa_registry_reports_package_and_workspace_failures() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("invalid-package");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        write_file(&root.join("package.json"), "{\"scripts\":[]}")?;

        let result = run_qa_registry(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-QA-PACKAGE-READ")
        );

        let missing = run_qa_registry(
            PathBuf::from("/tmp/tpm-qa-missing-workspace"),
            OperationInterface::Test,
        );
        assert_eq!(missing.status(), OperationStatus::Failed);
        assert!(
            missing
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-QA-WORKSPACE")
        );

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn package_scripts_accepts_missing_scripts_and_rejects_non_string_scripts()
    -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("package-scripts");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("empty.json"), "{}")?;
        write_file(
            &root.join("invalid.json"),
            "{\"scripts\":{\"check\":false}}",
        )?;

        let empty = package_scripts(&root.join("empty.json"))?;
        assert!(empty.is_empty());
        let invalid = package_scripts(&root.join("invalid.json"));
        assert!(invalid.is_err());

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn qa_display_path_handles_empty_paths() {
        assert_eq!(super::display_path(Path::new("")), ".");
    }
}
