//! Error rendering adapters for the internal xtask parser.

#![expect(
    clippy::redundant_pub_crate,
    reason = "xtask error adapters are private to the crate but used by sibling modules"
)]

use std::io::{self, Write};

use clap::CommandFactory;
use tpm_core::CommandExit;

use crate::cli::commands::XtaskCli;

pub(crate) fn write_top_level_help<W>(output: &mut W) -> io::Result<()>
where
    W: Write,
{
    let mut command = XtaskCli::command();
    command.write_long_help(output)?;
    writeln!(output)
}

pub(crate) fn write_missing_command_help<W>(output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    write_top_level_help(output)?;
    Ok(CommandExit::UsageError)
}

pub(crate) fn write_clap_error<W>(error: &clap::Error, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    match error.kind() {
        clap::error::ErrorKind::DisplayHelp | clap::error::ErrorKind::DisplayVersion => {
            write!(output, "{error}")?;
            Ok(CommandExit::Success)
        }
        clap::error::ErrorKind::DisplayHelpOnMissingArgumentOrSubcommand
        | clap::error::ErrorKind::MissingSubcommand => write_missing_command_help(output),
        _ => {
            write!(output, "{error}")?;
            Ok(CommandExit::UsageError)
        }
    }
}

#[cfg(test)]
mod tests {
    #![expect(
        clippy::expect_used,
        reason = "error-rendering tests assert parser fixture outcomes and UTF-8 output"
    )]

    use tpm_core::CommandExit;

    use super::write_clap_error;
    use crate::cli::parse_command;

    fn render_error(values: &[&str]) -> (CommandExit, String) {
        let error = parse_command(values.iter().map(std::ffi::OsString::from).collect())
            .expect_err("parser should reject command shape");
        let mut output = Vec::new();
        let exit = write_clap_error(&error, &mut output).expect("error rendering should not fail");
        let output = String::from_utf8(output).expect("error output should be UTF-8");

        (exit, output)
    }

    #[test]
    fn missing_command_renders_top_level_help_as_usage_error() {
        let (exit, output) = render_error(&[]);

        assert_eq!(exit, CommandExit::UsageError);
        assert!(output.contains("Internal repository automation"));
        assert!(output.contains("Usage:"));
    }

    #[test]
    fn parser_failures_render_usage_errors() {
        let (exit, output) = render_error(&["missing-task"]);

        assert_eq!(exit, CommandExit::UsageError);
        assert!(output.contains("unrecognized subcommand 'missing-task'"));
    }

    #[test]
    fn display_help_errors_render_as_success() {
        let (exit, output) = render_error(&["--help"]);

        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("Internal repository automation"));
    }
}
