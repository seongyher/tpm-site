//! Shared Rust domain primitives for the TPM publishing platform.

use std::fmt::{Display, Formatter, Result as FormatResult};

/// Human-facing name for the platform layer.
pub const PLATFORM_NAME: &str = "TPM Platform";

/// Severity for diagnostics emitted by platform operations.
#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub enum Severity {
    /// Informational output that does not require action.
    Note,
    /// A non-blocking issue that should be reviewed.
    Warning,
    /// A blocking issue that should fail the current operation.
    Error,
}

impl Severity {
    /// Returns whether this severity should block an operation.
    #[must_use]
    pub const fn is_blocking(self) -> bool {
        matches!(self, Self::Error)
    }
}

impl Display for Severity {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> FormatResult {
        let label = match self {
            Self::Note => "note",
            Self::Warning => "warning",
            Self::Error => "error",
        };

        formatter.write_str(label)
    }
}

/// Process exit categories shared by command-oriented interfaces.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CommandExit {
    /// The command completed successfully.
    Success,
    /// User input was not valid for the requested command.
    UsageError,
    /// The command failed after accepting valid input.
    Failure,
}

impl CommandExit {
    /// Returns the process exit code associated with this category.
    #[must_use]
    pub const fn code(self) -> u8 {
        match self {
            Self::Success => 0,
            Self::UsageError => 64,
            Self::Failure => 1,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{CommandExit, Severity};

    #[test]
    fn only_errors_are_blocking() {
        assert!(!Severity::Note.is_blocking());
        assert!(!Severity::Warning.is_blocking());
        assert!(Severity::Error.is_blocking());
    }

    #[test]
    fn command_exit_codes_are_stable() {
        assert_eq!(CommandExit::Success.code(), 0);
        assert_eq!(CommandExit::UsageError.code(), 64);
        assert_eq!(CommandExit::Failure.code(), 1);
    }
}
