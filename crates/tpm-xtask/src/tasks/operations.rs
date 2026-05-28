use std::io::{self, Write};

use tpm_core::CommandExit;
use tpm_operations::{
    OperationInterface, run_generated_output_bridge, run_migration_baseline,
    run_qa_diagnostic_diff, run_qa_registry,
};

use crate::cli::args::{DiagnosticsDiffArgs, OperationArgs};
use crate::operation_adapter::write_operation_result;

pub(super) fn migration_baseline<W>(args: OperationArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let options = args.into_options();
    let result = run_migration_baseline(options.site, OperationInterface::Ci);
    write_operation_result(&result, options.format, output)
}

pub(super) fn qa_registry<W>(args: OperationArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let options = args.into_options();
    let result = run_qa_registry(options.site, OperationInterface::Ci);
    write_operation_result(&result, options.format, output)
}

pub(super) fn diagnostics_diff<W>(
    args: DiagnosticsDiffArgs,
    output: &mut W,
) -> io::Result<CommandExit>
where
    W: Write,
{
    let options = args.operation.into_options();
    let result = run_qa_diagnostic_diff(
        options.site,
        args.expected,
        args.actual,
        OperationInterface::Ci,
    );
    write_operation_result(&result, options.format, output)
}

pub(super) fn output_verify<W>(args: OperationArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let options = args.into_options();
    let result = run_generated_output_bridge(options.site, OperationInterface::Ci);
    write_operation_result(&result, options.format, output)
}
