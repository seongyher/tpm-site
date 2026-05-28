#![expect(
    clippy::redundant_pub_crate,
    reason = "xtask keeps sibling modules internal while sharing focused operation adapter seams"
)]

use std::io::{self, Write};
use std::path::PathBuf;

use tpm_core::CommandExit;
use tpm_operations::OperationResult;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum OperationOutputFormat {
    Json,
    Ndjson,
    Text,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct OperationTaskOptions {
    pub(crate) format: OperationOutputFormat,
    pub(crate) site: PathBuf,
}

impl Default for OperationTaskOptions {
    fn default() -> Self {
        Self {
            format: OperationOutputFormat::Text,
            site: PathBuf::from("."),
        }
    }
}

pub(crate) fn write_operation_result<W>(
    result: &OperationResult,
    format: OperationOutputFormat,
    mut output: W,
) -> io::Result<CommandExit>
where
    W: Write,
{
    match format {
        OperationOutputFormat::Text => write!(output, "{}", result.render_human())?,
        OperationOutputFormat::Json => {
            writeln!(
                output,
                "{}",
                result.render_json_pretty().map_err(io::Error::other)?
            )?;
        }
        OperationOutputFormat::Ndjson => {
            writeln!(
                output,
                "{}",
                serde_json::to_string(result).map_err(io::Error::other)?
            )?;
        }
    }

    if result.diagnostics().has_blocking() {
        Ok(CommandExit::Failure)
    } else {
        Ok(CommandExit::Success)
    }
}

#[cfg(test)]
mod tests {
    #![expect(
        clippy::expect_used,
        reason = "operation adapter tests assert fixture outputs and static IDs are valid"
    )]

    use super::{OperationOutputFormat, OperationTaskOptions, write_operation_result};
    use tpm_core::{CommandExit, Severity};
    use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticReport};
    use tpm_operations::{
        OperationId, OperationInterface, OperationRequest, OperationResult, OperationSummary,
        OperationTiming,
    };

    fn write_ok(result: &OperationResult, format: OperationOutputFormat) -> (CommandExit, String) {
        let mut output = Vec::new();
        let exit = write_operation_result(result, format, &mut output)
            .expect("operation output should write");
        let text = String::from_utf8(output).expect("operation output should be UTF-8");

        (exit, text)
    }

    #[test]
    fn writes_operation_results_in_text_json_and_ndjson() {
        let result = operation_result(DiagnosticReport::new());
        let defaults = OperationTaskOptions::default();
        assert_eq!(defaults.format, OperationOutputFormat::Text);
        assert_eq!(defaults.site, std::path::PathBuf::from("."));

        let (text_exit, text) = write_ok(&result, OperationOutputFormat::Text);
        assert_eq!(text_exit, CommandExit::Success);
        assert!(text.contains("xtask.test"));

        let (json_exit, json) = write_ok(&result, OperationOutputFormat::Json);
        assert_eq!(json_exit, CommandExit::Success);
        assert!(json.contains("\"operationId\": \"xtask.test\""));

        let (ndjson_exit, ndjson_text) = write_ok(&result, OperationOutputFormat::Ndjson);
        assert_eq!(ndjson_exit, CommandExit::Success);
        assert!(ndjson_text.contains("\"operationId\":\"xtask.test\""));
        assert!(ndjson_text.ends_with('\n'));
    }

    #[test]
    fn returns_failure_for_blocking_operation_results() {
        let code = DiagnosticCode::parse("XTEST_BLOCKING").expect("test code should be valid");
        let result = operation_result(DiagnosticReport::from_diagnostics(vec![Diagnostic::new(
            code,
            Severity::Error,
            "blocking diagnostic",
        )]));
        let (exit, output) = write_ok(&result, OperationOutputFormat::Text);

        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("blocking diagnostic"));
    }

    fn operation_result(diagnostics: DiagnosticReport) -> OperationResult {
        let operation_id =
            OperationId::parse("xtask.test").expect("test operation ID should be valid");

        OperationResult::new(
            OperationRequest::new(operation_id, OperationInterface::Test),
            OperationSummary::new("Xtask test operation"),
            OperationTiming::completed(1),
            diagnostics,
        )
    }
}
