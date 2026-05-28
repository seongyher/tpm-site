use std::ffi::OsString;
use std::io::{self, Write};
use std::path::Path;

use serde_json::Value;
use tpm_core::CommandExit;

use crate::cli::args::{HtmlDirArgs, OutputDirArgs, TestCatalogArgs, TestFlakeArgs};
use crate::routes::{html_validation_targets, pagefind_globs};

use super::assets::remove_unreferenced_astro_rasters;
use super::external::{ExternalCommandRunner, external_command, local_binary};
use super::filesystem::relative_display;
use super::workspace::{Workspace, output_dir_arg};

pub(super) const CATALOG_OUTPUT_DIR: &str = "dist-catalog";
pub(super) const CATALOG_PLAYWRIGHT_SPEC: &str = "tests/e2e/catalog-invariants.pw.ts";

pub(super) fn build_raw<W, R>(
    args: &OutputDirArgs,
    _output: &mut W,
    external_runner: &mut R,
) -> io::Result<CommandExit>
where
    W: Write,
    R: ExternalCommandRunner,
{
    let workspace = Workspace::discover()?;
    let output_dir = output_dir_arg(args.dir.as_deref(), &workspace);
    let output_relative = relative_display(&workspace.root, &output_dir);
    let astro = local_binary(&workspace.root, "astro");
    let pagefind = local_binary(&workspace.root, "pagefind");

    let build_exit = external_runner.run(external_command(
        &astro,
        ["build", "--force"],
        &[(
            OsString::from("SITE_OUTPUT_DIR"),
            OsString::from(&output_relative),
        )],
    ))?;

    if build_exit != CommandExit::Success {
        return Ok(build_exit);
    }

    let config = workspace.site_config_json().unwrap_or(Value::Null);
    let globs = pagefind_globs(&config);
    if globs.is_empty() {
        return Ok(CommandExit::Success);
    }

    let glob_arg = format!("{{{}}}", globs.join(","));
    let mut pagefind_args = vec![
        String::from("--site"),
        output_dir.to_string_lossy().into_owned(),
        String::from("--glob"),
        glob_arg,
    ];
    if args.quiet {
        pagefind_args.insert(2, String::from("--quiet"));
    }

    external_runner.run(external_command(&pagefind, &pagefind_args, &[]))
}

pub(super) fn build_optimize<W>(args: &OutputDirArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let output_dir = output_dir_arg(args.dir.as_deref(), &workspace);
    if !output_dir.is_dir() {
        writeln!(
            output,
            "Build output directory does not exist: {}",
            output_dir.display()
        )?;
        return Ok(CommandExit::Failure);
    }

    let removed = remove_unreferenced_astro_rasters(&output_dir)?;
    if !args.quiet {
        writeln!(
            output,
            "Optimized generated output: {removed} unreferenced Astro raster assets removed."
        )?;
    }

    Ok(CommandExit::Success)
}

pub(super) fn validate_html<W, R>(
    args: &HtmlDirArgs,
    output: &mut W,
    external_runner: &mut R,
) -> io::Result<CommandExit>
where
    W: Write,
    R: ExternalCommandRunner,
{
    let workspace = Workspace::discover()?;
    let output_dir = output_dir_arg(args.dir.as_deref(), &workspace);
    let config = workspace.site_config_json().unwrap_or(Value::Null);
    let targets = html_validation_targets(&config, &output_dir);
    let html_validate = local_binary(&workspace.root, "html-validate");
    let mut command_args = vec![String::from("--max-warnings=0")];
    command_args.extend(
        targets
            .into_iter()
            .map(|target| target.to_string_lossy().into_owned()),
    );

    let exit = external_runner.run(external_command(&html_validate, &command_args, &[]))?;
    if exit == CommandExit::Failure {
        writeln!(output, "HTML validation failed.")?;
    }

    Ok(exit)
}

pub(super) fn test_flake<W, R>(
    args: &TestFlakeArgs,
    output: &mut W,
    external_runner: &mut R,
) -> io::Result<CommandExit>
where
    W: Write,
    R: ExternalCommandRunner,
{
    let workspace = Workspace::discover()?;
    writeln!(
        output,
        "Running randomized Bun test pass ({} runs, seed {}).",
        args.runs, args.seed
    )?;
    external_runner.run(external_command(
        Path::new("bun"),
        &[
            String::from("test"),
            String::from("tests/config"),
            String::from("tests/eslint"),
            String::from("tests/src"),
            String::from("tests/types"),
            String::from("tests/lib"),
            String::from("tests/components"),
            String::from("tests/pages"),
            String::from("--reporter=dots"),
            String::from("--randomize"),
        ],
        &[(OsString::from("PWD"), workspace.root.into_os_string())],
    ))
}

pub(super) fn test_catalog<W, R>(
    args: TestCatalogArgs,
    output: &mut W,
    external_runner: &mut R,
) -> io::Result<CommandExit>
where
    W: Write,
    R: ExternalCommandRunner,
{
    let workspace = Workspace::discover()?;
    let build = external_runner.run(external_command(
        Path::new("just"),
        &[String::from("catalog-build")],
        &[(
            OsString::from("PWD"),
            workspace.root.clone().into_os_string(),
        )],
    ))?;
    if build != CommandExit::Success {
        return Ok(build);
    }
    let mut playwright_args = vec![
        OsString::from("test"),
        OsString::from(CATALOG_PLAYWRIGHT_SPEC),
    ];
    playwright_args.extend(args.extra_args);
    let playwright = local_binary(&workspace.root, "playwright");
    let exit = external_runner.run(external_command(
        &playwright,
        &playwright_args,
        &[
            (
                OsString::from("PLATFORM_COMPONENT_CATALOG"),
                OsString::from("true"),
            ),
            (
                OsString::from("SITE_OUTPUT_DIR"),
                OsString::from(CATALOG_OUTPUT_DIR),
            ),
        ],
    ))?;
    if exit != CommandExit::Success {
        writeln!(output, "Catalog tests failed.")?;
    }
    Ok(exit)
}
