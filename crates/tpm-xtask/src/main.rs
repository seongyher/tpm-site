//! Binary entrypoint for internal TPM repository automation.

use std::process::ExitCode;

use tpm_core::CommandExit;

fn main() -> ExitCode {
    let exit = tpm_xtask::tasks::run(std::env::args().skip(1), std::io::stdout().lock())
        .unwrap_or(CommandExit::Failure);

    ExitCode::from(exit.code())
}
