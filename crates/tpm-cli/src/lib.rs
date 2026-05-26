//! Command-line interface shell for the TPM publishing platform.

use std::io::{self, Write};

use tpm_core::{CommandExit, PLATFORM_NAME};

/// Current top-level help text for the additive CLI shell.
pub const HELP: &str = "\
tpm

Usage:
  tpm --help
  tpm --version

This Rust CLI shell is additive. It exists to verify the workspace, QA gates,
and future command boundary before any Bun or Astro behavior is replaced.
";

/// Runs the CLI shell against an argument sequence and output sink.
pub fn run<I, S, W>(args: I, mut output: W) -> io::Result<CommandExit>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
    W: Write,
{
    let command = args
        .into_iter()
        .next()
        .map(|argument| argument.as_ref().to_owned());

    match command.as_deref() {
        None | Some("-h" | "--help" | "help") => {
            write!(output, "{HELP}")?;
            Ok(CommandExit::Success)
        }
        Some("--version" | "version") => {
            writeln!(output, "{PLATFORM_NAME} {}", env!("CARGO_PKG_VERSION"))?;
            Ok(CommandExit::Success)
        }
        Some(_) => {
            writeln!(output, "Unknown command. Run `tpm --help`.")?;
            Ok(CommandExit::UsageError)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::run;
    use tpm_core::CommandExit;

    #[test]
    fn help_command_prints_usage() {
        let mut output = Vec::new();
        let result = run(["--help"], &mut output);

        assert!(matches!(result, Ok(CommandExit::Success)));
        assert!(String::from_utf8(output).is_ok_and(|text| text.contains("Usage:")));
    }

    #[test]
    fn version_command_prints_platform_name() {
        let mut output = Vec::new();
        let result = run(["--version"], &mut output);

        assert!(matches!(result, Ok(CommandExit::Success)));
        assert!(String::from_utf8(output).is_ok_and(|text| text.contains("TPM Platform")));
    }

    #[test]
    fn unknown_command_returns_usage_error() {
        let mut output = Vec::new();
        let result = run(["unknown"], &mut output);

        assert!(matches!(result, Ok(CommandExit::UsageError)));
        assert!(String::from_utf8(output).is_ok_and(|text| text.contains("Unknown command")));
    }
}
