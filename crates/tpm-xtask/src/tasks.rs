//! Internal repository maintenance task adapters used by `just` recipes.

mod assets;
mod build;
mod cloudflare;
mod content;
mod external;
mod filesystem;
mod operations;
mod qa;
mod site;
mod workspace;

use std::ffi::OsString;
use std::io::{self, Write};

use tpm_core::CommandExit;

use crate::cli::commands::XtaskCommand;
use crate::cli::{compatibility::handle_compatibility, error::write_clap_error, parse_command};

#[cfg(test)]
use self::assets::{
    AssetReference, collect_asset_references, duplicate_image_groups, image_files,
    quoted_or_parenthesized_values, remove_unreferenced_astro_rasters, resolve_asset_reference,
    shared_asset_violations,
};
use self::assets::{assets_duplicates, assets_locations, assets_shared, assets_unused};
#[cfg(test)]
use self::build::{CATALOG_OUTPUT_DIR, CATALOG_PLAYWRIGHT_SPEC};
use self::build::{build_optimize, build_raw, test_catalog, test_flake, validate_html};
use self::cloudflare::build_cloudflare;
#[cfg(test)]
use self::cloudflare::collect_redirects;
#[cfg(test)]
use self::content::{normalize_tags, verify_content};
use self::external::SystemCommandRunner;
#[cfg(test)]
use self::external::{
    ExternalCommand, ExternalCommandRunner, local_binary, local_binary_for_platform,
};
#[cfg(test)]
use self::filesystem::{
    collect_files_with_extensions, extension_in, extension_is, fnv64, glob_matches, ignored_dir,
    ignored_path, is_inside, load_ignore_list, normalize_path_components, path_has_extension,
    relative_display, require_dir, require_file, wildcard_matches,
};
use self::operations::{diagnostics_diff, migration_baseline, output_verify, qa_registry};
use self::qa::{coverage_verify, test_accountability};
use self::site::{
    catalog_check, content_check, docs_references, payload_report, platform_check, site_schema,
    starters_check, sync_astro_test_store, tags_check, verify_generated_output,
};
#[cfg(test)]
use self::workspace::{Workspace, absolutize, output_dir_arg};

/// Runs the internal xtask command dispatcher.
///
/// # Errors
///
/// Returns an [`io::Error`] when command output or filesystem access fails.
pub fn run<I, S, W>(args: I, mut output: W) -> io::Result<CommandExit>
where
    I: IntoIterator<Item = S>,
    S: Into<OsString>,
    W: Write,
{
    let args = args.into_iter().map(Into::into).collect::<Vec<_>>();

    if let Some(exit) = handle_compatibility(&args, &mut output)? {
        return Ok(exit);
    }

    match parse_command(args) {
        Ok(command) => run_active_task(command, &mut output),
        Err(error) => write_clap_error(&error, &mut output),
    }
}

fn run_active_task<W>(command: XtaskCommand, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let mut external_runner = SystemCommandRunner;

    match command {
        XtaskCommand::AssetsDuplicates(args) => assets_duplicates(&args, output),
        XtaskCommand::AssetsLocations(args) => assets_locations(&args, output),
        XtaskCommand::AssetsShared(args) => assets_shared(&args, output),
        XtaskCommand::AssetsUnused(args) => assets_unused(&args, output),
        XtaskCommand::BuildCloudflare(args) => build_cloudflare(&args, output),
        XtaskCommand::BuildOptimize(args) => build_optimize(&args, output),
        XtaskCommand::BuildRaw(args) => build_raw(&args, output, &mut external_runner),
        XtaskCommand::CatalogCheck(args) => catalog_check(&args, output),
        XtaskCommand::ContentCheck(args) => content_check(&args, output),
        XtaskCommand::CoverageVerify(args) => coverage_verify(&args, output),
        XtaskCommand::DiagnosticsDiff(args) => diagnostics_diff(args, output),
        XtaskCommand::DocsReferences(args) => docs_references(&args, false, output),
        XtaskCommand::DocsReferencesCheck(args) => docs_references(&args, true, output),
        XtaskCommand::MigrationBaseline(args) => migration_baseline(args, output),
        XtaskCommand::OutputVerify(args) => output_verify(args, output),
        XtaskCommand::PayloadCheck(args) => payload_report(&args, true, output),
        XtaskCommand::PayloadReport(args) => payload_report(&args, false, output),
        XtaskCommand::PlatformCheck(args) => platform_check(&args, output),
        XtaskCommand::QaRegistry(args) => qa_registry(args, output),
        XtaskCommand::SiteSchema(args) => site_schema(args, false, output),
        XtaskCommand::SiteSchemaCheck(args) => site_schema(args, true, output),
        XtaskCommand::StartersCheck(args) => starters_check(&args, output),
        XtaskCommand::SyncAstroTestStore(args) => sync_astro_test_store(args, output),
        XtaskCommand::TagsCheck(args) => tags_check(&args, false, output),
        XtaskCommand::TagsNormalize(args) => tags_check(&args, true, output),
        XtaskCommand::TestAccountability(args) => test_accountability(&args, false, output),
        XtaskCommand::TestAccountabilityRelease(args) => test_accountability(&args, true, output),
        XtaskCommand::TestCatalog(args) => test_catalog(args, output, &mut external_runner),
        XtaskCommand::TestFlake(args) => test_flake(&args, output, &mut external_runner),
        XtaskCommand::ValidateHtml(args) => validate_html(&args, output, &mut external_runner),
        XtaskCommand::Verify(args) => verify_generated_output(&args, output),
    }
}

#[cfg(test)]
mod tests;
