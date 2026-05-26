//! Binary entrypoint for the additive TPM CLI shell.

use std::process::ExitCode;

use tpm_core::CommandExit;

fn main() -> ExitCode {
    let exit = match tpm_cli::run(std::env::args().skip(1), std::io::stdout().lock()) {
        Ok(exit) => exit,
        Err(_) => CommandExit::Failure,
    };

    ExitCode::from(exit.code())
}
