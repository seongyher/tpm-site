//! Shared typed argument models for internal xtask commands.

#![expect(
    clippy::redundant_pub_crate,
    reason = "xtask parser structs are shared across internal parser and dispatch modules"
)]

use std::ffi::OsString;
use std::num::NonZeroUsize;
use std::path::PathBuf;

use clap::{Args, ValueEnum};

use crate::operation_adapter::{OperationOutputFormat, OperationTaskOptions};

#[derive(Clone, Copy, Debug, Eq, PartialEq, ValueEnum)]
pub(crate) enum OperationFormatArg {
    Json,
    Ndjson,
    Text,
}

impl From<OperationFormatArg> for OperationOutputFormat {
    fn from(format: OperationFormatArg) -> Self {
        match format {
            OperationFormatArg::Json => Self::Json,
            OperationFormatArg::Ndjson => Self::Ndjson,
            OperationFormatArg::Text => Self::Text,
        }
    }
}

#[derive(Clone, Debug, Args, Eq, PartialEq)]
#[expect(
    clippy::struct_excessive_bools,
    reason = "clap mirrors stable automation flags accepted by shared operation commands"
)]
pub(crate) struct OperationArgs {
    #[arg(long, default_value = ".")]
    pub(crate) site: PathBuf,

    #[arg(long, value_enum, conflicts_with = "json")]
    pub(crate) format: Option<OperationFormatArg>,

    #[arg(long, conflicts_with = "format")]
    pub(crate) json: bool,

    #[arg(long)]
    pub(crate) ci: bool,

    #[arg(long)]
    pub(crate) quiet: bool,

    #[arg(long)]
    pub(crate) verbose: bool,

    #[arg(long = "no-color")]
    pub(crate) no_color: bool,
}

impl OperationArgs {
    pub(crate) fn into_options(self) -> OperationTaskOptions {
        let Self {
            site, format, json, ..
        } = self;
        let format = if json {
            OperationOutputFormat::Json
        } else {
            format.map_or(OperationOutputFormat::Text, Into::into)
        };

        OperationTaskOptions { format, site }
    }
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::{OperationArgs, OperationFormatArg};
    use crate::operation_adapter::OperationOutputFormat;

    fn operation_args(format: Option<OperationFormatArg>, json: bool) -> OperationArgs {
        OperationArgs {
            site: PathBuf::from("site-root"),
            format,
            json,
            ci: true,
            quiet: true,
            verbose: true,
            no_color: true,
        }
    }

    #[test]
    fn operation_args_normalize_all_output_formats() {
        assert_eq!(
            operation_args(Some(OperationFormatArg::Text), false)
                .into_options()
                .format,
            OperationOutputFormat::Text
        );
        assert_eq!(
            operation_args(Some(OperationFormatArg::Json), false)
                .into_options()
                .format,
            OperationOutputFormat::Json
        );
        assert_eq!(
            operation_args(Some(OperationFormatArg::Ndjson), false)
                .into_options()
                .format,
            OperationOutputFormat::Ndjson
        );
        assert_eq!(
            operation_args(None, true).into_options().format,
            OperationOutputFormat::Json
        );
    }
}

#[derive(Clone, Debug, Args, Eq, PartialEq)]
pub(crate) struct QuietArgs {
    #[arg(long)]
    pub(crate) quiet: bool,
}

#[derive(Clone, Debug, Args, Eq, PartialEq)]
pub(crate) struct NoArgs;

#[derive(Clone, Debug, Args, Eq, PartialEq)]
pub(crate) struct OutputDirArgs {
    #[arg(long = "dir")]
    pub(crate) dir: Option<PathBuf>,

    #[arg(long)]
    pub(crate) quiet: bool,
}

#[derive(Clone, Debug, Args, Eq, PartialEq)]
pub(crate) struct HtmlDirArgs {
    #[arg(long = "dir")]
    pub(crate) dir: Option<PathBuf>,
}

#[derive(Clone, Debug, Args, Eq, PartialEq)]
pub(crate) struct SchemaArgs {
    #[arg(long)]
    pub(crate) output: Option<PathBuf>,

    #[arg(long)]
    pub(crate) quiet: bool,
}

#[derive(Clone, Debug, Args, Eq, PartialEq)]
pub(crate) struct DuplicateAssetsArgs {
    #[arg(long)]
    pub(crate) quiet: bool,

    #[arg(long = "fail-on-duplicates")]
    pub(crate) fail_on_duplicates: bool,
}

#[derive(Clone, Debug, Args, Eq, PartialEq)]
pub(crate) struct UnusedAssetsArgs {
    #[arg(long)]
    pub(crate) quiet: bool,

    #[arg(long = "fail-on-unused")]
    pub(crate) fail_on_unused: bool,
}

#[derive(Clone, Debug, Args, Eq, PartialEq)]
pub(crate) struct DiagnosticsDiffArgs {
    pub(crate) expected: PathBuf,

    pub(crate) actual: PathBuf,

    #[command(flatten)]
    pub(crate) operation: OperationArgs,
}

#[derive(Clone, Debug, Args, Eq, PartialEq)]
pub(crate) struct TestCatalogArgs {
    #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
    pub(crate) extra_args: Vec<OsString>,
}

#[derive(Clone, Debug, Args, Eq, PartialEq)]
pub(crate) struct TestFlakeArgs {
    #[arg(long, default_value = "3")]
    pub(crate) runs: NonZeroUsize,

    #[arg(long, default_value = "random")]
    pub(crate) seed: String,
}
