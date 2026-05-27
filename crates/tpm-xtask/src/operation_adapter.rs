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
    pub(crate) positionals: Vec<String>,
    pub(crate) site: PathBuf,
}

impl Default for OperationTaskOptions {
    fn default() -> Self {
        Self {
            format: OperationOutputFormat::Text,
            positionals: Vec::new(),
            site: PathBuf::from("."),
        }
    }
}

pub(crate) fn parse_operation_task_options(
    args: &[String],
) -> Result<OperationTaskOptions, String> {
    let mut options = OperationTaskOptions::default();
    let mut index = 0;

    while index < args.len() {
        let argument = &args[index];

        if argument == "--json" {
            options.format = OperationOutputFormat::Json;
        } else if matches!(
            argument.as_str(),
            "--ci" | "--quiet" | "--verbose" | "--no-color"
        ) {
            // Accepted by internal operation tasks so shared just recipes can
            // pass stable automation flags without surfacing them publicly.
        } else if let Some(value) = argument.strip_prefix("--site=") {
            options.site = PathBuf::from(value);
        } else if argument == "--site" {
            index += 1;
            let value = args
                .get(index)
                .ok_or_else(|| String::from("Missing value for --site."))?;
            options.site = PathBuf::from(value);
        } else if let Some(value) = argument.strip_prefix("--format=") {
            options.format = parse_operation_output_format(value)?;
        } else if argument == "--format" {
            index += 1;
            let value = args
                .get(index)
                .ok_or_else(|| String::from("Missing value for --format."))?;
            options.format = parse_operation_output_format(value)?;
        } else if argument.starts_with('-') {
            return Err(format!("Unknown option `{argument}`."));
        } else {
            options.positionals.push(argument.clone());
        }

        index += 1;
    }

    Ok(options)
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

fn parse_operation_output_format(value: &str) -> Result<OperationOutputFormat, String> {
    match value {
        "json" => Ok(OperationOutputFormat::Json),
        "ndjson" => Ok(OperationOutputFormat::Ndjson),
        "text" => Ok(OperationOutputFormat::Text),
        _ => Err(format!(
            "Unsupported output format `{value}`. Use text, json, or ndjson."
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::{
        OperationOutputFormat, OperationTaskOptions, parse_operation_task_options,
        write_operation_result,
    };
    use tpm_core::{CommandExit, Severity};
    use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticReport};
    use tpm_operations::{
        OperationId, OperationInterface, OperationRequest, OperationResult, OperationSummary,
        OperationTiming,
    };

    fn args(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| String::from(*value)).collect()
    }

    fn parse_ok(values: &[&str]) -> OperationTaskOptions {
        match parse_operation_task_options(&args(values)) {
            Ok(options) => options,
            Err(error) => panic!("operation options should parse: {error}"),
        }
    }

    fn parse_error(values: &[&str]) -> String {
        match parse_operation_task_options(&args(values)) {
            Ok(options) => panic!("operation options should fail, got {options:?}"),
            Err(error) => error,
        }
    }

    fn write_ok(result: &OperationResult, format: OperationOutputFormat) -> (CommandExit, String) {
        let mut output = Vec::new();
        let exit = match write_operation_result(result, format, &mut output) {
            Ok(exit) => exit,
            Err(error) => panic!("operation output should write: {error}"),
        };
        let text = match String::from_utf8(output) {
            Ok(text) => text,
            Err(error) => panic!("operation output should be UTF-8: {error}"),
        };

        (exit, text)
    }

    #[test]
    fn parses_operation_site_format_and_positionals() {
        let options = parse_ok(&[
            "--site",
            "examples/docs-site",
            "--format",
            "ndjson",
            "expected.json",
            "actual.json",
        ]);

        assert_eq!(options.site, std::path::PathBuf::from("examples/docs-site"));
        assert_eq!(options.format, OperationOutputFormat::Ndjson);
        assert_eq!(
            options.positionals,
            vec![String::from("expected.json"), String::from("actual.json")]
        );
    }

    #[test]
    fn supports_equals_form_and_json_shortcut() {
        let options = parse_ok(&["--site=site-fixture", "--json", "--quiet", "--ci"]);

        assert_eq!(options.site, std::path::PathBuf::from("site-fixture"));
        assert_eq!(options.format, OperationOutputFormat::Json);
        assert!(options.positionals.is_empty());
    }

    #[test]
    fn rejects_missing_values_unknown_options_and_formats() {
        assert_eq!(parse_error(&["--site"]), "Missing value for --site.");
        assert_eq!(
            parse_error(&["--format=xml"]),
            "Unsupported output format `xml`. Use text, json, or ndjson."
        );
        assert_eq!(parse_error(&["--unknown"]), "Unknown option `--unknown`.");
    }

    #[test]
    fn writes_operation_results_in_text_json_and_ndjson() {
        let result = operation_result(DiagnosticReport::new());

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
        let code = match DiagnosticCode::parse("XTEST_BLOCKING") {
            Ok(code) => code,
            Err(error) => panic!("test code should be valid: {error}"),
        };
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
        let operation_id = match OperationId::parse("xtask.test") {
            Ok(operation_id) => operation_id,
            Err(error) => panic!("test operation ID should be valid: {error}"),
        };

        OperationResult::new(
            OperationRequest::new(operation_id, OperationInterface::Test),
            OperationSummary::new("Xtask test operation"),
            OperationTiming::completed(1),
            diagnostics,
        )
    }
}
