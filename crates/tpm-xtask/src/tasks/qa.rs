use std::io::{self, Write};

use tpm_core::CommandExit;

use crate::accountability::{format_test_accountability_report, verify_test_accountability};
use crate::cli::args::QuietArgs;
use crate::coverage::{format_coverage_inventory_report, verify_coverage_inventory};

use super::workspace::Workspace;

pub(super) fn test_accountability<W>(
    args: &QuietArgs,
    release: bool,
    output: &mut W,
) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let result = verify_test_accountability(&workspace.root)?;
    let report = format_test_accountability_report(&result, release);

    if result.has_blocking_problems(release) {
        writeln!(output, "{report}")?;
        return Ok(CommandExit::Failure);
    }

    if !args.quiet {
        writeln!(output, "{report}")?;
    }

    Ok(CommandExit::Success)
}

pub(super) fn coverage_verify<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let result = verify_coverage_inventory(&workspace.root)?;
    let report = format_coverage_inventory_report(&result);

    if !result.missing.is_empty() {
        writeln!(output, "{report}")?;
        return Ok(CommandExit::Failure);
    }

    if !args.quiet {
        writeln!(output, "{report}")?;
    }

    Ok(CommandExit::Success)
}
