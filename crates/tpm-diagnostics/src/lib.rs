//! Structured diagnostics for the TPM publishing platform.

use std::fmt::{Display, Formatter, Result as FormatResult};

use tpm_core::Severity;

/// Stable diagnostic identifier.
#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct DiagnosticCode(String);

impl DiagnosticCode {
    /// Builds a diagnostic code after validating its stable display form.
    ///
    /// Codes must be non-empty and may contain ASCII uppercase letters,
    /// numbers, hyphens, and underscores.
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

/// A single actionable diagnostic emitted by a platform operation.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Diagnostic {
    code: DiagnosticCode,
    severity: Severity,
    message: String,
    help: Option<String>,
}

impl Diagnostic {
    /// Creates a diagnostic with the required stable fields.
    #[must_use]
    pub fn new(code: DiagnosticCode, severity: Severity, message: impl Into<String>) -> Self {
        Self {
            code,
            severity,
            message: message.into(),
            help: None,
        }
    }

    /// Adds remediation guidance to the diagnostic.
    #[must_use]
    pub fn with_help(mut self, help: impl Into<String>) -> Self {
        self.help = Some(help.into());
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

    /// Returns the human-facing message.
    #[must_use]
    pub fn message(&self) -> &str {
        &self.message
    }

    /// Returns optional remediation guidance.
    #[must_use]
    pub fn help(&self) -> Option<&str> {
        self.help.as_deref()
    }
}

/// Aggregated diagnostics for a platform operation.
#[derive(Clone, Debug, Default, Eq, PartialEq)]
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
    pub fn is_empty(&self) -> bool {
        self.diagnostics.is_empty()
    }

    /// Returns whether the report contains a blocking diagnostic.
    #[must_use]
    pub fn has_blocking(&self) -> bool {
        self.diagnostics
            .iter()
            .any(|diagnostic| diagnostic.severity().is_blocking())
    }
}

#[cfg(test)]
mod tests {
    use super::{Diagnostic, DiagnosticCode, DiagnosticCodeError, DiagnosticReport};
    use tpm_core::Severity;

    #[test]
    fn diagnostic_codes_reject_empty_values() {
        assert_eq!(DiagnosticCode::parse(""), Err(DiagnosticCodeError::Empty));
    }

    #[test]
    fn diagnostic_codes_reject_lowercase_values() {
        assert_eq!(
            DiagnosticCode::parse("tpm-0001"),
            Err(DiagnosticCodeError::InvalidCharacter)
        );
    }

    #[test]
    fn diagnostic_report_tracks_blocking_state() {
        let Ok(code) = DiagnosticCode::parse("TPM-0001") else {
            unreachable!("test diagnostic code should be valid");
        };

        let mut report = DiagnosticReport::new();
        assert!(report.is_empty());
        assert!(!report.has_blocking());

        report.push(Diagnostic::new(code, Severity::Error, "example failure"));

        assert!(!report.is_empty());
        assert!(report.has_blocking());
    }
}
