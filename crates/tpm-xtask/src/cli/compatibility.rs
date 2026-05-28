//! Compatibility handling for retired or legacy xtask invocation shapes.

#![expect(
    clippy::redundant_pub_crate,
    reason = "xtask compatibility adapters are private to the crate but used by sibling modules"
)]

use std::ffi::OsString;
use std::io::{self, Write};

use tpm_core::CommandExit;

use crate::command::RemovedTask;

pub(crate) fn handle_compatibility<W>(
    args: &[OsString],
    output: &mut W,
) -> io::Result<Option<CommandExit>>
where
    W: Write,
{
    if args.len() == 1 && args[0] == "help" {
        super::error::write_top_level_help(output)?;
        return Ok(Some(CommandExit::Success));
    }

    let Some(first) = args.first().and_then(|arg| arg.to_str()) else {
        return Ok(None);
    };

    let Some(task) = RemovedTask::parse(first) else {
        return Ok(None);
    };

    writeln!(
        output,
        "Task `{}` was retired during the Rust/just migration and is no longer part of the active command surface.",
        task.name()
    )?;
    writeln!(
        output,
        "Use `just --list` for current commands, or restore this workflow explicitly before relying on it."
    )?;
    Ok(Some(CommandExit::UsageError))
}

#[cfg(test)]
mod tests {
    #![expect(
        clippy::expect_used,
        reason = "compatibility tests assert fixture invocations are handled by the adapter"
    )]

    use std::ffi::OsString;

    use tpm_core::CommandExit;

    use super::handle_compatibility;

    #[cfg(unix)]
    use std::os::unix::ffi::OsStringExt;

    fn run(values: &[&str]) -> Option<(CommandExit, String)> {
        let args = values.iter().map(OsString::from).collect::<Vec<_>>();
        let mut output = Vec::new();
        let exit = handle_compatibility(&args, &mut output)
            .expect("compatibility handling should not fail")?;
        let output = String::from_utf8(output).expect("compatibility output should be UTF-8");
        Some((exit, output))
    }

    #[test]
    fn handles_legacy_top_level_help_alias() {
        let (exit, output) = run(&["help"]).expect("help should be handled");

        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("Usage:"));
        assert!(output.contains("tpm-xtask"));
    }

    #[test]
    fn handles_retired_task_names_before_clap_parsing() {
        let (exit, output) =
            run(&["payload-postbuild-experiments"]).expect("retired task should be handled");

        assert_eq!(exit, CommandExit::UsageError);
        assert!(output.contains("was retired during the Rust/just migration"));
    }

    #[test]
    fn leaves_active_and_unknown_commands_for_clap() {
        assert!(run(&[]).is_none());
        assert!(run(&["coverage-verify"]).is_none());
        assert!(run(&["missing-task"]).is_none());
    }

    #[cfg(unix)]
    #[test]
    fn leaves_non_utf8_invocations_for_clap() {
        let args = vec![OsString::from_vec(vec![0xff])];
        let mut output = Vec::new();
        let result = handle_compatibility(&args, &mut output);

        assert!(matches!(result, Ok(None)));
        assert!(output.is_empty());
    }
}
