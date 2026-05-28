use std::ffi::{OsStr, OsString};
use std::io;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use tpm_core::CommandExit;

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct ExternalCommand {
    pub(super) args: Vec<OsString>,
    pub(super) envs: Vec<(OsString, OsString)>,
    pub(super) program: PathBuf,
}

pub(super) trait ExternalCommandRunner {
    fn run(&mut self, command: ExternalCommand) -> io::Result<CommandExit>;
}

pub(super) struct SystemCommandRunner;

impl ExternalCommandRunner for SystemCommandRunner {
    fn run(&mut self, command: ExternalCommand) -> io::Result<CommandExit> {
        run_external_owned(&command.program, &command.args, &command.envs)
    }
}

pub(super) fn external_command<P, A, S>(
    program: P,
    args: A,
    envs: &[(OsString, OsString)],
) -> ExternalCommand
where
    P: AsRef<Path>,
    A: IntoIterator<Item = S>,
    S: AsRef<OsStr>,
{
    ExternalCommand {
        args: args
            .into_iter()
            .map(|arg| arg.as_ref().to_os_string())
            .collect(),
        envs: envs.to_vec(),
        program: program.as_ref().to_path_buf(),
    }
}

pub(super) fn run_external<I, S>(
    program: &Path,
    args: I,
    envs: &[(OsString, OsString)],
) -> io::Result<CommandExit>
where
    I: IntoIterator<Item = S>,
    S: AsRef<OsStr>,
{
    // Coverage note: this is the intentionally thin process-spawn boundary for
    // repository tooling. Tests cover command planning and fake local binaries
    // where practical; host command execution, inherited stdio, and OS process
    // status failures are left to integration/release gates.
    let mut command = Command::new(program);
    command.args(args);
    for (key, value) in envs {
        command.env(key, value);
    }
    let status = command
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()?;
    Ok(if status.success() {
        CommandExit::Success
    } else {
        CommandExit::Failure
    })
}

pub(super) fn run_external_owned<S>(
    program: &Path,
    args: &[S],
    envs: &[(OsString, OsString)],
) -> io::Result<CommandExit>
where
    S: AsRef<OsStr>,
{
    run_external(program, args, envs)
}

pub(super) fn local_binary(root: &Path, binary: &str) -> PathBuf {
    local_binary_for_platform(root, binary, cfg!(windows))
}

pub(super) fn local_binary_for_platform(root: &Path, binary: &str, windows: bool) -> PathBuf {
    let executable = if windows {
        format!("{binary}.cmd")
    } else {
        binary.to_owned()
    };
    root.join("node_modules/.bin").join(executable)
}
