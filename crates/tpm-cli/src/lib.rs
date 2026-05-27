//! Command-line interface shell for the TPM publishing platform.

use std::io::{self, Write};
use std::path::PathBuf;

use tpm_core::{CommandExit, PLATFORM_NAME};
use tpm_operations::{
    OperationInterface, OperationResult, run_release_inspect, run_workspace_check,
    run_workspace_doctor, run_workspace_status,
};

/// Current top-level help text for the additive CLI shell.
pub const HELP: &str = "\
tpm - static publishing operations for TPM sites

Usage:
  tpm <command> [options]

Commands:
  site status        Show workspace source roots, config, and source inventory
  check              Run the first Rust workspace diagnostic check
  doctor             Explain current workspace diagnostics and remediation
  release inspect    Inspect generated output/release readiness
  help <command>     Show command help
  version            Show version information

Global options:
  --site <path>              Site workspace to operate on
  --format <text|json|ndjson>
                             Output format
  --json                     Alias for --format json
  --ci                       Disable prompts; accepted for automation parity
  --quiet                    Accepted for future concise output
  --verbose                  Accepted for future detailed output
  --no-color                 Disable ANSI color; output is currently plain text

Examples:
  tpm site status --format json
  tpm check --format json
  tpm doctor
  tpm release inspect

This Rust CLI is additive and does not replace existing Bun/Astro release
checks yet.
";

const SITE_HELP: &str = "\
tpm site - create and manage site workspaces

Usage:
  tpm site status [options]

Commands:
  status        Show site config, source roots, source artifacts, and health

Examples:
  tpm site status
  tpm site status --site tests/fixtures/rust-workspace --format json
";

const CHECK_HELP: &str = "\
tpm check - validate the current workspace with first-slice Rust diagnostics

Usage:
  tpm check [all|workspace] [options]

Examples:
  tpm check
  tpm check --format json

This first slice checks workspace structure only. Existing Bun/Astro release
checks remain the source of truth for full site validation.
";

const DOCTOR_HELP: &str = "\
tpm doctor - explain current workspace diagnostics and remediation

Usage:
  tpm doctor [workspace] [options]

Examples:
  tpm doctor
  tpm doctor --site tests/fixtures/rust-workspace
";

const RELEASE_HELP: &str = "\
tpm release - inspect generated output and release readiness

Usage:
  tpm release inspect [latest] [options]

Examples:
  tpm release inspect
  tpm release inspect latest --format json
";

/// Runs the CLI shell against an argument sequence and output sink.
///
/// # Errors
///
/// Returns an [`io::Error`] when writing command output fails.
pub fn run<I, S, W>(args: I, mut output: W) -> io::Result<CommandExit>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
    W: Write,
{
    let args = args
        .into_iter()
        .map(|argument| argument.as_ref().to_owned())
        .collect::<Vec<_>>();

    match parse_invocation(&args) {
        Ok(invocation) => run_invocation(invocation, output),
        Err(error) => {
            writeln!(output, "{error}")?;
            writeln!(output, "Run `tpm --help`.")?;
            Ok(CommandExit::UsageError)
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct CliInvocation {
    command: CliCommand,
    options: CliOptions,
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct CliOptions {
    format: OutputFormat,
    site: PathBuf,
}

impl Default for CliOptions {
    fn default() -> Self {
        Self {
            format: OutputFormat::Text,
            site: PathBuf::from("."),
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum OutputFormat {
    Json,
    Ndjson,
    Text,
}

#[derive(Clone, Debug, Eq, PartialEq)]
enum CliCommand {
    Check,
    Doctor,
    Help(HelpTopic),
    ReleaseInspect,
    SiteStatus,
    Version,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum HelpTopic {
    Check,
    Doctor,
    Release,
    Site,
    Top,
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct CliError {
    message: String,
}

impl CliError {
    fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

impl std::fmt::Display for CliError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(&self.message)
    }
}

fn parse_invocation(args: &[String]) -> Result<CliInvocation, CliError> {
    let mut options = CliOptions::default();
    let mut positionals = Vec::new();
    let mut help_requested = false;
    let mut version_requested = false;
    let mut index = 0;

    while index < args.len() {
        let argument = &args[index];

        if argument == "--help" || argument == "-h" {
            help_requested = true;
        } else if argument == "--version" || argument == "-V" {
            version_requested = true;
        } else if argument == "--json" {
            options.format = OutputFormat::Json;
        } else if matches!(
            argument.as_str(),
            "--ci" | "--quiet" | "--verbose" | "--no-color"
        ) {
            // Accepted as stable shared flags before every mode uses them.
        } else if let Some(value) = argument.strip_prefix("--site=") {
            options.site = PathBuf::from(value);
        } else if argument == "--site" {
            index += 1;
            let value = args
                .get(index)
                .ok_or_else(|| CliError::new("Missing value for --site."))?;
            options.site = PathBuf::from(value);
        } else if let Some(value) = argument.strip_prefix("--format=") {
            options.format = parse_output_format(value)?;
        } else if argument == "--format" {
            index += 1;
            let value = args
                .get(index)
                .ok_or_else(|| CliError::new("Missing value for --format."))?;
            options.format = parse_output_format(value)?;
        } else if argument.starts_with('-') {
            return Err(CliError::new(format!("Unknown option `{argument}`.")));
        } else {
            positionals.push(argument.clone());
        }

        index += 1;
    }

    let command = if version_requested {
        CliCommand::Version
    } else if help_requested {
        CliCommand::Help(help_topic(positionals.first().map(String::as_str))?)
    } else {
        parse_command(&positionals)?
    };

    Ok(CliInvocation { command, options })
}

fn parse_output_format(value: &str) -> Result<OutputFormat, CliError> {
    match value {
        "json" => Ok(OutputFormat::Json),
        "ndjson" => Ok(OutputFormat::Ndjson),
        "text" => Ok(OutputFormat::Text),
        _ => Err(CliError::new(format!(
            "Unsupported output format `{value}`. Use text, json, or ndjson."
        ))),
    }
}

fn help_topic(topic: Option<&str>) -> Result<HelpTopic, CliError> {
    match topic {
        None => Ok(HelpTopic::Top),
        Some("check") => Ok(HelpTopic::Check),
        Some("doctor") => Ok(HelpTopic::Doctor),
        Some("release") => Ok(HelpTopic::Release),
        Some("site") => Ok(HelpTopic::Site),
        Some(other) => Err(CliError::new(format!("Unknown help topic `{other}`."))),
    }
}

fn parse_command(positionals: &[String]) -> Result<CliCommand, CliError> {
    match positionals {
        [] => Ok(CliCommand::Help(HelpTopic::Top)),
        [command] if command == "version" => Ok(CliCommand::Version),
        [command] if command == "help" => Ok(CliCommand::Help(HelpTopic::Top)),
        [command, topic] if command == "help" => {
            Ok(CliCommand::Help(help_topic(Some(topic.as_str()))?))
        }
        [command, subcommand] if command == "site" && subcommand == "status" => {
            Ok(CliCommand::SiteStatus)
        }
        [command] if command == "check" => Ok(CliCommand::Check),
        [command, scope] if command == "check" && matches!(scope.as_str(), "all" | "workspace") => {
            Ok(CliCommand::Check)
        }
        [command] if command == "doctor" => Ok(CliCommand::Doctor),
        [command, scope] if command == "doctor" && scope == "workspace" => Ok(CliCommand::Doctor),
        [command, subcommand] if command == "release" && subcommand == "inspect" => {
            Ok(CliCommand::ReleaseInspect)
        }
        [command, subcommand, target]
            if command == "release" && subcommand == "inspect" && target == "latest" =>
        {
            Ok(CliCommand::ReleaseInspect)
        }
        [command, ..] => Err(CliError::new(format!("Unknown command `{command}`."))),
    }
}

fn run_invocation<W>(invocation: CliInvocation, mut output: W) -> io::Result<CommandExit>
where
    W: Write,
{
    match invocation.command {
        CliCommand::Check => {
            let result = run_workspace_check(invocation.options.site, OperationInterface::Cli);
            write_operation(&result, invocation.options.format, output)
        }
        CliCommand::Doctor => {
            let result = run_workspace_doctor(invocation.options.site, OperationInterface::Cli);
            write_operation(&result, invocation.options.format, output)
        }
        CliCommand::Help(topic) => {
            write!(output, "{}", help_text(topic))?;
            Ok(CommandExit::Success)
        }
        CliCommand::ReleaseInspect => {
            let result = run_release_inspect(invocation.options.site, OperationInterface::Cli);
            write_operation(&result, invocation.options.format, output)
        }
        CliCommand::SiteStatus => {
            let result = run_workspace_status(invocation.options.site, OperationInterface::Cli);
            write_operation(&result, invocation.options.format, output)
        }
        CliCommand::Version => {
            writeln!(output, "{PLATFORM_NAME} {}", env!("CARGO_PKG_VERSION"))?;
            Ok(CommandExit::Success)
        }
    }
}

fn write_operation<W>(
    result: &OperationResult,
    format: OutputFormat,
    mut output: W,
) -> io::Result<CommandExit>
where
    W: Write,
{
    match format {
        OutputFormat::Text => write!(output, "{}", result.render_human())?,
        OutputFormat::Json => {
            writeln!(
                output,
                "{}",
                result.render_json_pretty().map_err(io::Error::other)?
            )?;
        }
        OutputFormat::Ndjson => {
            writeln!(
                output,
                "{}",
                serde_json::to_string(&result).map_err(io::Error::other)?
            )?;
        }
    }

    Ok(operation_exit(result))
}

fn operation_exit(result: &OperationResult) -> CommandExit {
    if result.diagnostics().has_blocking() {
        CommandExit::Failure
    } else {
        CommandExit::Success
    }
}

const fn help_text(topic: HelpTopic) -> &'static str {
    match topic {
        HelpTopic::Check => CHECK_HELP,
        HelpTopic::Doctor => DOCTOR_HELP,
        HelpTopic::Release => RELEASE_HELP,
        HelpTopic::Site => SITE_HELP,
        HelpTopic::Top => HELP,
    }
}

#[cfg(test)]
mod tests {
    use std::path::{Path, PathBuf};

    use super::run;
    use tpm_core::CommandExit;

    fn fixture_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .join("tests/fixtures/rust-workspace")
    }

    fn missing_workspace() -> PathBuf {
        PathBuf::from("/tmp/tpm-cli-missing-workspace")
    }

    fn run_text(args: Vec<String>) -> (CommandExit, String) {
        let mut output = Vec::new();
        let result = run(args, &mut output);
        let exit = match result {
            Ok(exit) => exit,
            Err(error) => panic!("CLI test should not emit io errors: {error}"),
        };
        let text = match String::from_utf8(output) {
            Ok(text) => text,
            Err(error) => panic!("CLI output should be valid UTF-8: {error}"),
        };

        (exit, text)
    }

    fn command_with_site(command: &[&str], site: &Path) -> Vec<String> {
        let mut args = command
            .iter()
            .map(|argument| String::from(*argument))
            .collect::<Vec<_>>();
        args.push(String::from("--site"));
        args.push(site.to_string_lossy().into_owned());
        args
    }

    #[test]
    fn help_command_prints_first_slice_usage() {
        let (exit, output) = run_text(vec![String::from("--help")]);

        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("tpm site status --format json"));
        assert!(output.contains("release inspect"));
    }

    #[test]
    fn command_help_prints_topic_usage() {
        let (exit, output) = run_text(vec![String::from("help"), String::from("check")]);

        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("tpm check - validate"));
        assert!(output.contains("workspace structure only"));
    }

    #[test]
    fn version_command_prints_platform_name() {
        let (exit, output) = run_text(vec![String::from("--version")]);

        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("TPM Platform"));
    }

    #[test]
    fn unknown_command_returns_usage_error() {
        let (exit, output) = run_text(vec![String::from("unknown")]);

        assert_eq!(exit, CommandExit::UsageError);
        assert!(output.contains("Unknown command `unknown`."));
    }

    #[test]
    fn site_status_renders_json_operation_output() {
        let mut args = command_with_site(&["site", "status"], &fixture_root());
        args.push(String::from("--format"));
        args.push(String::from("json"));

        let (exit, output) = run_text(args);

        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("\"operationId\": \"workspace.status\""));
        assert!(output.contains("\"status\": \"success\""));
        assert!(output.contains("\"source artifacts: 3\""));
    }

    #[test]
    fn check_reports_missing_workspace_as_failure() {
        let mut args = command_with_site(&["check"], &missing_workspace());
        args.push(String::from("--json"));

        let (exit, output) = run_text(args);

        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("\"operationId\": \"workspace.check\""));
        assert!(output.contains("\"code\": \"TPM-WORKSPACE-NOT-FOUND\""));
    }

    #[test]
    fn doctor_renders_remediation_focused_human_output() {
        let args = command_with_site(&["doctor"], &missing_workspace());

        let (exit, output) = run_text(args);

        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("workspace.doctor"));
        assert!(output.contains("help: Run the command from a site workspace"));
    }

    #[test]
    fn release_inspect_warns_when_generated_output_is_missing() {
        let args = command_with_site(&["release", "inspect"], &fixture_root());

        let (exit, output) = run_text(args);

        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("release.inspect"));
        assert!(output.contains("TPM-RELEASE-OUTPUT-MISSING"));
    }
}
