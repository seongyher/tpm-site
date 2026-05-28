//! Structured diagnostics for the TPM publishing platform.

use std::fmt::{Display, Formatter, Result as FormatResult};

use serde::de::Error as DeserializeError;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use tpm_core::Severity;

/// Stable diagnostic identifier.
#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct DiagnosticCode(String);

impl DiagnosticCode {
    /// Builds a diagnostic code after validating its stable display form.
    ///
    /// Codes must be non-empty and may contain ASCII uppercase letters,
    /// numbers, hyphens, and underscores.
    ///
    /// # Errors
    ///
    /// Returns [`DiagnosticCodeError`] when the value is empty or contains an
    /// unsupported character.
    pub fn parse(value: impl Into<String>) -> Result<Self, DiagnosticCodeError> {
        let value = value.into();

        if value.is_empty() {
            return Err(DiagnosticCodeError::Empty);
        }

        if value.bytes().all(|byte| {
            byte.is_ascii_uppercase() || byte.is_ascii_digit() || byte == b'-' || byte == b'_'
        }) {
            Ok(Self(value))
        } else {
            Err(DiagnosticCodeError::InvalidCharacter)
        }
    }

    /// Returns the stable diagnostic identifier.
    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl Display for DiagnosticCode {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        formatter.write_str(self.as_str())
    }
}

impl Serialize for DiagnosticCode {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.as_str().serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for DiagnosticCode {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = String::deserialize(deserializer)?;
        Self::parse(value).map_err(DeserializeError::custom)
    }
}

/// Validation failures for diagnostic identifiers.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DiagnosticCodeError {
    /// The diagnostic code was empty.
    Empty,
    /// The diagnostic code contained an unsupported character.
    InvalidCharacter,
}

impl Display for DiagnosticCodeError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        let message = match self {
            Self::Empty => "diagnostic code must not be empty",
            Self::InvalidCharacter => {
                "diagnostic code may only contain ASCII uppercase letters, numbers, hyphens, and underscores"
            }
        };

        formatter.write_str(message)
    }
}

impl std::error::Error for DiagnosticCodeError {}

/// Diagnostic location category.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum DiagnosticLocationKind {
    /// A source file, directory, or authored input.
    Source,
    /// A generated output file, report, or release artifact.
    Artifact,
}

impl Display for DiagnosticLocationKind {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        let label = match self {
            Self::Source => "source",
            Self::Artifact => "artifact",
        };

        formatter.write_str(label)
    }
}

/// Stable source or generated-artifact reference attached to a diagnostic.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticLocation {
    kind: DiagnosticLocationKind,
    path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    line: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    column: Option<u32>,
}

impl DiagnosticLocation {
    /// Creates a location for an authored source path.
    #[must_use]
    pub fn source(path: impl Into<String>) -> Self {
        Self::new(DiagnosticLocationKind::Source, path)
    }

    /// Creates a location for a generated artifact path.
    #[must_use]
    pub fn artifact(path: impl Into<String>) -> Self {
        Self::new(DiagnosticLocationKind::Artifact, path)
    }

    /// Creates a location for the given kind.
    #[must_use]
    pub fn new(kind: DiagnosticLocationKind, path: impl Into<String>) -> Self {
        Self {
            kind,
            path: path.into(),
            line: None,
            column: None,
        }
    }

    /// Adds one-based line and column coordinates when available.
    #[must_use]
    pub const fn with_position(mut self, line: u32, column: u32) -> Self {
        self.line = Some(line);
        self.column = Some(column);
        self
    }

    /// Returns the location kind.
    #[must_use]
    pub const fn kind(&self) -> DiagnosticLocationKind {
        self.kind
    }

    /// Returns the source or artifact path in platform display form.
    #[must_use]
    pub fn path(&self) -> &str {
        &self.path
    }

    /// Returns the one-based line coordinate when available.
    #[must_use]
    pub const fn line(&self) -> Option<u32> {
        self.line
    }

    /// Returns the one-based column coordinate when available.
    #[must_use]
    pub const fn column(&self) -> Option<u32> {
        self.column
    }

    fn render(&self) -> String {
        let position = match (self.line, self.column) {
            (Some(line), Some(column)) => format!(":{line}:{column}"),
            (Some(line), None) => format!(":{line}"),
            _ => String::new(),
        };

        format!("{} {}{}", self.kind, self.path, position)
    }
}

/// A single actionable diagnostic emitted by a platform operation.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostic {
    code: DiagnosticCode,
    severity: Severity,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    remediation: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    developer_message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    location: Option<DiagnosticLocation>,
}

impl Diagnostic {
    /// Creates a diagnostic with the required stable fields.
    #[must_use]
    pub fn new(code: DiagnosticCode, severity: Severity, message: impl Into<String>) -> Self {
        Self {
            code,
            severity,
            message: message.into(),
            remediation: None,
            developer_message: None,
            location: None,
        }
    }

    /// Adds remediation guidance to the diagnostic.
    #[must_use]
    pub fn with_remediation(mut self, remediation: impl Into<String>) -> Self {
        self.remediation = Some(remediation.into());
        self
    }

    /// Adds remediation guidance to the diagnostic.
    ///
    /// This alias preserves the initial Rust workspace API while the newer
    /// operation model uses the clearer `remediation` term.
    #[must_use]
    pub fn with_help(self, help: impl Into<String>) -> Self {
        self.with_remediation(help)
    }

    /// Adds a developer-facing diagnostic note.
    #[must_use]
    pub fn with_developer_message(mut self, message: impl Into<String>) -> Self {
        self.developer_message = Some(message.into());
        self
    }

    /// Adds a source or artifact location.
    #[must_use]
    pub fn with_location(mut self, location: DiagnosticLocation) -> Self {
        self.location = Some(location);
        self
    }

    /// Returns the diagnostic code.
    #[must_use]
    pub const fn code(&self) -> &DiagnosticCode {
        &self.code
    }

    /// Returns the diagnostic severity.
    #[must_use]
    pub const fn severity(&self) -> Severity {
        self.severity
    }

    /// Returns the author-facing message.
    #[must_use]
    pub fn message(&self) -> &str {
        &self.message
    }

    /// Returns optional remediation guidance.
    #[must_use]
    pub fn remediation(&self) -> Option<&str> {
        self.remediation.as_deref()
    }

    /// Returns optional remediation guidance.
    #[must_use]
    pub fn help(&self) -> Option<&str> {
        self.remediation()
    }

    /// Returns optional developer-facing implementation context.
    #[must_use]
    pub fn developer_message(&self) -> Option<&str> {
        self.developer_message.as_deref()
    }

    /// Returns an optional source or artifact location.
    #[must_use]
    pub const fn location(&self) -> Option<&DiagnosticLocation> {
        self.location.as_ref()
    }
}

/// Severity counts for a diagnostic report.
#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticCounts {
    notes: usize,
    warnings: usize,
    errors: usize,
}

impl DiagnosticCounts {
    /// Returns the number of informational diagnostics.
    #[must_use]
    pub const fn notes(self) -> usize {
        self.notes
    }

    /// Returns the number of warning diagnostics.
    #[must_use]
    pub const fn warnings(self) -> usize {
        self.warnings
    }

    /// Returns the number of error diagnostics.
    #[must_use]
    pub const fn errors(self) -> usize {
        self.errors
    }
}

/// Aggregated diagnostics for a platform operation.
#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticReport {
    diagnostics: Vec<Diagnostic>,
}

impl DiagnosticReport {
    /// Creates an empty diagnostic report.
    #[must_use]
    pub const fn new() -> Self {
        Self {
            diagnostics: Vec::new(),
        }
    }

    /// Builds a report from diagnostics in emission order.
    #[must_use]
    pub const fn from_diagnostics(diagnostics: Vec<Diagnostic>) -> Self {
        Self { diagnostics }
    }

    /// Adds a diagnostic to the report.
    pub fn push(&mut self, diagnostic: Diagnostic) {
        self.diagnostics.push(diagnostic);
    }

    /// Returns all diagnostics in emission order.
    #[must_use]
    pub fn diagnostics(&self) -> &[Diagnostic] {
        &self.diagnostics
    }

    /// Returns whether the report contains no diagnostics.
    #[must_use]
    pub const fn is_empty(&self) -> bool {
        self.diagnostics.is_empty()
    }

    /// Returns whether the report contains a blocking diagnostic.
    #[must_use]
    pub fn has_blocking(&self) -> bool {
        self.diagnostics
            .iter()
            .any(|diagnostic| diagnostic.severity().is_blocking())
    }

    /// Returns all warning diagnostics in emission order.
    #[must_use]
    pub fn warnings(&self) -> Vec<&Diagnostic> {
        self.diagnostics
            .iter()
            .filter(|diagnostic| diagnostic.severity() == Severity::Warning)
            .collect()
    }

    /// Returns all error diagnostics in emission order.
    #[must_use]
    pub fn errors(&self) -> Vec<&Diagnostic> {
        self.diagnostics
            .iter()
            .filter(|diagnostic| diagnostic.severity() == Severity::Error)
            .collect()
    }

    /// Returns severity counts for this report.
    #[must_use]
    pub fn counts(&self) -> DiagnosticCounts {
        self.diagnostics
            .iter()
            .fold(DiagnosticCounts::default(), |mut counts, diagnostic| {
                match diagnostic.severity() {
                    Severity::Note => counts.notes += 1,
                    Severity::Warning => counts.warnings += 1,
                    Severity::Error => counts.errors += 1,
                }

                counts
            })
    }

    /// Renders the report as stable human-facing text.
    #[must_use]
    pub fn render_human(&self) -> String {
        if self.is_empty() {
            return String::from("No diagnostics.\n");
        }

        let mut rendered = self
            .diagnostics
            .iter()
            .map(render_diagnostic)
            .collect::<Vec<_>>()
            .join("\n");
        rendered.push('\n');
        rendered
    }

    /// Renders the report as stable pretty JSON.
    ///
    /// # Errors
    ///
    /// Returns the underlying [`serde_json::Error`] when serialization fails.
    pub fn render_json_pretty(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }
}

fn render_diagnostic(diagnostic: &Diagnostic) -> String {
    let mut output = format!(
        "{} {}: {}",
        diagnostic.severity(),
        diagnostic.code(),
        diagnostic.message()
    );

    if let Some(location) = diagnostic.location() {
        output.push_str("\n  at ");
        output.push_str(&location.render());
    }

    if let Some(remediation) = diagnostic.remediation() {
        output.push_str("\n  help: ");
        output.push_str(remediation);
    }

    if let Some(message) = diagnostic.developer_message() {
        output.push_str("\n  developer: ");
        output.push_str(message);
    }

    output
}

#[cfg(test)]
mod tests {
    #![expect(
        clippy::expect_used,
        reason = "test fixtures use static diagnostic codes whose validity is the test precondition"
    )]

    use super::{
        Diagnostic, DiagnosticCode, DiagnosticCodeError, DiagnosticLocation,
        DiagnosticLocationKind, DiagnosticReport,
    };
    use tpm_core::Severity;

    fn valid_code(value: &str) -> DiagnosticCode {
        DiagnosticCode::parse(value).expect("test diagnostic code should be valid")
    }

    #[test]
    fn diagnostic_codes_reject_empty_values() {
        assert_eq!(DiagnosticCode::parse(""), Err(DiagnosticCodeError::Empty));
        assert_eq!(
            DiagnosticCodeError::Empty.to_string(),
            "diagnostic code must not be empty"
        );
    }

    #[test]
    fn diagnostic_codes_reject_lowercase_values() {
        assert_eq!(
            DiagnosticCode::parse("tpm-0001"),
            Err(DiagnosticCodeError::InvalidCharacter)
        );
    }

    #[test]
    fn diagnostic_code_deserialization_rejects_invalid_values() {
        let result = serde_json::from_str::<DiagnosticCode>("\"tpm-0001\"");

        assert!(result.is_err());
    }

    #[test]
    fn diagnostic_report_tracks_counts_and_blocking_state() {
        let mut report = DiagnosticReport::new();
        assert!(report.is_empty());
        assert!(!report.has_blocking());

        report.push(Diagnostic::new(
            valid_code("TPM-0001"),
            Severity::Warning,
            "example warning",
        ));
        report.push(Diagnostic::new(
            valid_code("TPM-0000"),
            Severity::Note,
            "example note",
        ));
        report.push(Diagnostic::new(
            valid_code("TPM-0002"),
            Severity::Error,
            "example failure",
        ));

        let counts = report.counts();
        assert_eq!(counts.notes(), 1);
        assert_eq!(counts.warnings(), 1);
        assert_eq!(counts.errors(), 1);
        assert_eq!(report.warnings().len(), 1);
        assert_eq!(report.errors().len(), 1);
        assert!(report.has_blocking());
    }

    #[test]
    fn diagnostics_can_include_source_locations_and_remediation() {
        let diagnostic = Diagnostic::new(
            valid_code("TPM-0003"),
            Severity::Error,
            "Missing article title.",
        )
        .with_location(DiagnosticLocation::source(
            "site/content/articles/example.md",
        ))
        .with_remediation("Add a title field to the article frontmatter.")
        .with_developer_message("frontmatter.title was absent after parsing");

        assert_eq!(
            diagnostic.location().map(DiagnosticLocation::kind),
            Some(DiagnosticLocationKind::Source)
        );
        assert_eq!(
            diagnostic.location().map(DiagnosticLocation::path),
            Some("site/content/articles/example.md")
        );
        assert_eq!(
            diagnostic.location().and_then(DiagnosticLocation::line),
            None
        );
        assert_eq!(
            diagnostic.location().and_then(DiagnosticLocation::column),
            None
        );
        assert_eq!(diagnostic.code().as_str(), "TPM-0003");
        assert_eq!(diagnostic.severity(), Severity::Error);
        assert_eq!(diagnostic.message(), "Missing article title.");
        assert_eq!(
            diagnostic.remediation(),
            Some("Add a title field to the article frontmatter.")
        );
        assert_eq!(
            diagnostic.help(),
            Some("Add a title field to the article frontmatter.")
        );
        assert_eq!(
            diagnostic.developer_message(),
            Some("frontmatter.title was absent after parsing")
        );
    }

    #[test]
    fn diagnostic_report_renders_empty_human_output() {
        assert_eq!(DiagnosticReport::new().render_human(), "No diagnostics.\n");
    }

    #[test]
    fn diagnostic_report_renders_human_output() {
        let report = DiagnosticReport::from_diagnostics(vec![
            Diagnostic::new(
                valid_code("TPM-0004"),
                Severity::Error,
                "Missing site configuration.",
            )
            .with_location(DiagnosticLocation::source("site/config/site.json").with_position(1, 1))
            .with_remediation("Create site/config/site.json."),
        ]);

        let rendered = report.render_human();

        assert!(rendered.contains("error TPM-0004: Missing site configuration."));
        assert!(rendered.contains("at source site/config/site.json:1:1"));
        assert!(rendered.contains("help: Create site/config/site.json."));
    }

    #[test]
    fn diagnostic_locations_render_artifacts_and_line_only_positions() {
        let location = DiagnosticLocation {
            column: None,
            kind: DiagnosticLocationKind::Artifact,
            line: Some(12),
            path: String::from("dist/index.html"),
        };
        let diagnostic = Diagnostic::new(
            valid_code("TPM-0006"),
            Severity::Note,
            "Generated artifact note.",
        )
        .with_help("Review the generated file.")
        .with_location(location)
        .with_developer_message("artifact inventory branch");
        let report = DiagnosticReport::from_diagnostics(vec![diagnostic]);
        let rendered = report.render_human();

        assert!(rendered.contains("note TPM-0006: Generated artifact note."));
        assert!(rendered.contains("at artifact dist/index.html:12"));
        assert!(rendered.contains("help: Review the generated file."));
        assert!(rendered.contains("developer: artifact inventory branch"));
    }

    #[test]
    fn diagnostic_report_renders_json_output() -> Result<(), serde_json::Error> {
        let report = DiagnosticReport::from_diagnostics(vec![
            Diagnostic::new(
                valid_code("TPM-0005"),
                Severity::Warning,
                "Example warning.",
            )
            .with_location(DiagnosticLocation::artifact("dist/index.html")),
        ]);

        let rendered = report.render_json_pretty()?;

        assert!(rendered.contains("\"code\": \"TPM-0005\""));
        assert!(rendered.contains("\"severity\": \"warning\""));
        assert!(rendered.contains("\"kind\": \"artifact\""));

        Ok(())
    }
}
