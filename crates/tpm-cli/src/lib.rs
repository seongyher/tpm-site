//! Command-line interface shell for the TPM publishing platform.

use std::io::{self, Write};
use std::path::PathBuf;

use tpm_core::{CommandExit, PLATFORM_NAME};
use tpm_operations::{
    OperationInterface, OperationResult, run_adapter_inspect, run_image_asset_verification,
    run_redirect_report, run_release_inspect, run_site_doctor, run_workspace_check,
    run_workspace_doctor, run_workspace_status,
};

/// Current top-level help text for the additive CLI shell.
pub const HELP: &str = "\
tpm - static publishing operations for TPM sites

Usage:
  tpm <command> [options]

Commands:
  adapters inspect   Inspect adapter capabilities and provider boundaries
  site status        Show workspace source roots, config, and source inventory
  site doctor        Run site workspace diagnostics
  check              Run the first Rust workspace diagnostic check
  doctor             Explain current workspace diagnostics and remediation
  media images       Inspect image asset policy
  routes redirects   Inspect route and redirect policy
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
  tpm adapters inspect --format json
  tpm site status --format json
  tpm media images
  tpm check --format json
  tpm doctor
  tpm release inspect
";

const ADAPTERS_HELP: &str = "\
tpm adapters - inspect provider adapter capabilities

Usage:
  tpm adapters inspect [options]
  tpm adapter inspect [options]

Commands:
  inspect       List configured adapters, capability states, credentials,
                dry-run support, unsupported operations, and boundaries

Examples:
  tpm adapters inspect
  tpm adapters inspect --format json
";

const SITE_HELP: &str = "\
tpm site - create and manage site workspaces

Usage:
  tpm site status [options]
  tpm site doctor [options]

Commands:
  status        Show site config, source roots, source artifacts, and health
  doctor        Run site workspace diagnostics

Examples:
  tpm site status
  tpm site doctor
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

const MEDIA_HELP: &str = "\
tpm media - inspect and validate media assets

Usage:
  tpm media images [options]

Examples:
  tpm media images
  tpm media images --format json
";

const ROUTES_HELP: &str = "\
tpm routes - inspect route and redirect policy

Usage:
  tpm routes redirects [options]

Examples:
  tpm routes redirects
  tpm routes redirects --format json
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
    AdaptersInspect,
    Check,
    Doctor,
    Help(HelpTopic),
    MediaImages,
    ReleaseInspect,
    RoutesRedirects,
    SiteDoctor,
    SiteStatus,
    Version,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum HelpTopic {
    Adapters,
    Check,
    Doctor,
    Media,
    Release,
    Routes,
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
        Some("adapter" | "adapters") => Ok(HelpTopic::Adapters),
        Some("check") => Ok(HelpTopic::Check),
        Some("doctor") => Ok(HelpTopic::Doctor),
        Some("media") => Ok(HelpTopic::Media),
        Some("release") => Ok(HelpTopic::Release),
        Some("routes") => Ok(HelpTopic::Routes),
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
        [command, subcommand]
            if matches!(command.as_str(), "adapter" | "adapters") && subcommand == "inspect" =>
        {
            Ok(CliCommand::AdaptersInspect)
        }
        [command, subcommand] if command == "site" && subcommand == "status" => {
            Ok(CliCommand::SiteStatus)
        }
        [command, subcommand] if command == "site" && subcommand == "doctor" => {
            Ok(CliCommand::SiteDoctor)
        }
        [command, subcommand] if command == "media" && subcommand == "images" => {
            Ok(CliCommand::MediaImages)
        }
        [command, subcommand] if command == "routes" && subcommand == "redirects" => {
            Ok(CliCommand::RoutesRedirects)
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
        CliCommand::AdaptersInspect => {
            let result = run_adapter_inspect(invocation.options.site, OperationInterface::Cli);
            write_operation(&result, invocation.options.format, output)
        }
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
        CliCommand::MediaImages => {
            let result =
                run_image_asset_verification(invocation.options.site, OperationInterface::Cli);
            write_operation(&result, invocation.options.format, output)
        }
        CliCommand::ReleaseInspect => {
            let result = run_release_inspect(invocation.options.site, OperationInterface::Cli);
            write_operation(&result, invocation.options.format, output)
        }
        CliCommand::RoutesRedirects => {
            let result = run_redirect_report(invocation.options.site, OperationInterface::Cli);
            write_operation(&result, invocation.options.format, output)
        }
        CliCommand::SiteDoctor => {
            let result = run_site_doctor(invocation.options.site, OperationInterface::Cli);
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
        HelpTopic::Adapters => ADAPTERS_HELP,
        HelpTopic::Check => CHECK_HELP,
        HelpTopic::Doctor => DOCTOR_HELP,
        HelpTopic::Media => MEDIA_HELP,
        HelpTopic::Release => RELEASE_HELP,
        HelpTopic::Routes => ROUTES_HELP,
        HelpTopic::Site => SITE_HELP,
        HelpTopic::Top => HELP,
    }
}

#[cfg(test)]
mod tests {
    #![expect(
        clippy::expect_used,
        reason = "CLI tests assert fixture commands emit valid output without IO errors"
    )]

    use std::path::{Path, PathBuf};

    use super::{OperationResult, OutputFormat, run, write_operation};
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
        let exit = run(args, &mut output).expect("CLI test should not emit io errors");
        let text = String::from_utf8(output).expect("CLI output should be valid UTF-8");

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
        assert!(output.contains("tpm adapters inspect --format json"));
        assert!(output.contains("tpm site status --format json"));
        assert!(!output.contains("migration baseline"));
        assert!(!output.contains("qa registry"));
        assert!(!output.contains("output verify"));
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
    fn command_help_covers_all_topics_and_unknown_topics() {
        for topic in ["adapters", "doctor", "media", "release", "routes", "site"] {
            let (exit, output) = run_text(vec![String::from("help"), String::from(topic)]);

            assert_eq!(exit, CommandExit::Success);
            assert!(output.contains(&format!("tpm {topic}")));
        }

        let (exit, output) = run_text(vec![String::from("--help"), String::from("unknown")]);

        assert_eq!(exit, CommandExit::UsageError);
        assert!(output.contains("Unknown help topic `unknown`."));
    }

    #[test]
    fn version_command_prints_platform_name() {
        let (exit, output) = run_text(vec![String::from("--version")]);

        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("TPM Platform"));
    }

    #[test]
    fn short_version_command_prints_platform_name() {
        let (exit, output) = run_text(vec![String::from("-V")]);

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
    fn internal_repo_tasks_are_not_exposed_by_product_cli() {
        for command in [
            vec![String::from("task"), String::from("verify")],
            vec![String::from("qa"), String::from("registry")],
            vec![String::from("output"), String::from("verify")],
            vec![String::from("migration"), String::from("baseline")],
        ] {
            let (exit, output) = run_text(command);

            assert_eq!(exit, CommandExit::UsageError);
            assert!(output.contains("Unknown command"));
        }
    }

    #[test]
    fn invalid_options_return_usage_errors() {
        for (args, expected) in [
            (vec!["--bogus"], "Unknown option `--bogus`."),
            (vec!["--site"], "Missing value for --site."),
            (vec!["--format"], "Missing value for --format."),
            (
                vec!["--format", "xml"],
                "Unsupported output format `xml`. Use text, json, or ndjson.",
            ),
        ] {
            let (exit, output) = run_text(args.into_iter().map(String::from).collect());

            assert_eq!(exit, CommandExit::UsageError);
            assert!(output.contains(expected));
        }
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
    fn cli_json_renderer_emits_shared_workspace_status_fixture() {
        let fixture =
            include_str!("../../../tests/fixtures/rust-operations/workspace-status-warning.json");
        let result: OperationResult =
            serde_json::from_str(fixture).expect("shared operation fixture should deserialize");
        let mut output = Vec::new();

        let exit = write_operation(&result, OutputFormat::Json, &mut output)
            .expect("CLI JSON renderer should write fixture output");
        let output = String::from_utf8(output).expect("CLI output should be UTF-8");

        assert_eq!(exit, CommandExit::Success);
        assert_eq!(output.trim_end(), fixture.trim_end());
    }

    #[test]
    fn site_status_accepts_equals_site_format_and_automation_flags() {
        let (exit, output) = run_text(vec![
            String::from("site"),
            String::from("status"),
            format!("--site={}", fixture_root().to_string_lossy()),
            String::from("--format=ndjson"),
            String::from("--ci"),
            String::from("--quiet"),
            String::from("--verbose"),
            String::from("--no-color"),
        ]);

        assert_eq!(exit, CommandExit::Success);
        assert!(output.starts_with("{\"schemaVersion\":"));
        assert!(output.contains("\"operationId\":\"workspace.status\""));
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

    #[test]
    fn command_aliases_route_to_expected_operations() {
        for (command, operation) in [
            (&["check", "all"][..], "workspace.check"),
            (&["check", "workspace"], "workspace.check"),
            (&["doctor", "workspace"], "workspace.doctor"),
            (&["release", "inspect", "latest"], "release.inspect"),
            (&["routes", "redirects"], "routes.redirects"),
        ] {
            let args = command_with_site(command, &fixture_root());
            let (exit, output) = run_text(args);

            assert_ne!(exit, CommandExit::UsageError);
            assert!(output.contains(operation));
        }
    }

    #[test]
    fn site_doctor_command_uses_product_operation() {
        let args = command_with_site(&["site", "doctor"], &fixture_root());

        let (exit, output) = run_text(args);

        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("site.doctor"));
    }

    #[test]
    fn media_images_command_uses_product_operation() {
        let args = command_with_site(&["media", "images"], &fixture_root());

        let (exit, output) = run_text(args);

        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("media.images"));
    }

    #[test]
    fn adapters_inspect_command_renders_versioned_capability_json() {
        let mut args = command_with_site(&["adapters", "inspect"], &fixture_root());
        args.push(String::from("--format"));
        args.push(String::from("json"));

        let (exit, output) = run_text(args);
        let value =
            serde_json::from_str::<serde_json::Value>(&output).expect("adapter JSON should parse");
        let capabilities = value["payload"]["data"]["adapters"]
            .as_array()
            .expect("adapter payload should include adapters")
            .iter()
            .flat_map(|adapter| {
                adapter["capabilities"]
                    .as_array()
                    .expect("adapter should include capabilities")
            })
            .collect::<Vec<_>>();

        assert_eq!(exit, CommandExit::Success);
        assert_eq!(value["schemaVersion"], 1);
        assert_eq!(value["request"]["operationId"], "adapters.inspect");
        assert_eq!(value["payload"]["kind"], "adapter-inspection");
        assert_eq!(value["payload"]["data"]["profile"], "tpm-like");
        assert!(
            value["payload"]["data"]["adapters"]
                .as_array()
                .expect("adapter payload should include adapters")
                .iter()
                .any(|adapter| adapter["providerId"] == "cloudflare-deploy"
                    && adapter["boundary"] == "bundled")
        );
        assert!(
            capabilities
                .iter()
                .any(|capability| capability["operation"] == "deploy-publish"
                    && capability["credentialRequirement"] == "required"
                    && capability["dryRun"] == "supported")
        );
        assert!(
            capabilities
                .iter()
                .any(|capability| capability["status"] == "unsupported")
        );
        assert!(
            value["diagnostics"]["diagnostics"]
                .as_array()
                .expect("adapter report should include capability diagnostics")
                .iter()
                .any(|diagnostic| diagnostic["code"] == "TPM-ADAPTER-CAPABILITY-UNAVAILABLE")
        );
    }

    #[test]
    fn adapter_singular_alias_routes_to_inspection_operation() {
        let args = command_with_site(&["adapter", "inspect"], &fixture_root());
        let (exit, output) = run_text(args);

        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("adapters.inspect"));
        assert!(output.contains("adapter profile: tpm-like"));
    }
}
