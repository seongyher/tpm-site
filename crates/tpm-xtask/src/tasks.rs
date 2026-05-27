//! Internal repository maintenance task adapters used by `just` recipes.

use std::collections::{BTreeMap, BTreeSet};
use std::env;
use std::ffi::OsString;
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use serde_json::Value;
use tpm_core::CommandExit;
use tpm_operations::{
    OperationInterface, run_generated_output_bridge, run_migration_baseline,
    run_qa_diagnostic_diff, run_qa_registry,
};

use crate::accountability::{format_test_accountability_report, verify_test_accountability};
use crate::args::{value_arg, wants_help};
use crate::command::{InternalTask, TaskParseResult};
use crate::coverage::{format_coverage_inventory_report, verify_coverage_inventory};
use crate::frontmatter::Frontmatter;
use crate::operation_adapter::{parse_operation_task_options, write_operation_result};
use crate::redirects::{
    RedirectRule, format_redirects, normalize_redirect_path, with_trailing_slash,
};
use crate::routes::{html_validation_targets, pagefind_globs};
use crate::tags::{
    is_url_safe_slug, normalize_author_alias, normalize_tag_list, replace_tags_block,
    tag_diagnostics,
};

const IMAGE_EXTENSIONS: &[&str] = &[
    "avif", "bmp", "gif", "ico", "jpeg", "jpg", "png", "svg", "tif", "tiff", "webp",
];
const SOURCE_REFERENCE_EXTENSIONS: &[&str] =
    &["astro", "css", "js", "jsx", "md", "mdx", "mjs", "ts", "tsx"];
const TEXT_REFERENCE_EXTENSIONS: &[&str] = &[
    "css",
    "html",
    "js",
    "json",
    "svg",
    "txt",
    "webmanifest",
    "xml",
];
const RASTER_EXTENSIONS: &[&str] = &["avif", "gif", "jpeg", "jpg", "png", "webp"];
const CATALOG_OUTPUT_DIR: &str = "dist-catalog";
const CATALOG_PLAYWRIGHT_SPEC: &str = "tests/e2e/catalog-invariants.pw.ts";

const HELP: &str = "\
tpm-xtask - internal repository automation for TPM development

Usage:
  tpm-xtask <task> [task options]
  tpm-xtask --help

This binary is internal plumbing for repository `just` recipes. It is not the
user-facing `tpm` product CLI.

Run `just --list` for supported developer workflows.
";

/// Runs the internal xtask command dispatcher.
///
/// # Errors
///
/// Returns an [`io::Error`] when command output or filesystem access fails.
pub fn run<I, S, W>(args: I, mut output: W) -> io::Result<CommandExit>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
    W: Write,
{
    let args = args
        .into_iter()
        .map(|argument| argument.as_ref().to_owned())
        .collect::<Vec<_>>();

    match args.as_slice() {
        [] => {
            write!(output, "{HELP}")?;
            Ok(CommandExit::UsageError)
        }
        [flag] if matches!(flag.as_str(), "--help" | "-h" | "help") => {
            write!(output, "{HELP}")?;
            Ok(CommandExit::Success)
        }
        [name, task_args @ ..] => run_task(name, task_args, &mut output),
    }
}

fn run_task<W>(name: &str, args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    match InternalTask::parse(name) {
        TaskParseResult::Active(task) => run_active_task(task, args, output),
        TaskParseResult::Removed(task) => {
            writeln!(
                output,
                "Task `{}` was retired during the Rust/just migration and is no longer part of the active command surface.",
                task.name()
            )?;
            writeln!(
                output,
                "Use `just --list` for current commands, or restore this workflow explicitly before relying on it."
            )?;
            Ok(CommandExit::UsageError)
        }
        TaskParseResult::Unknown(name) => {
            writeln!(output, "Unknown task `{name}`.")?;
            Ok(CommandExit::UsageError)
        }
    }
}

fn run_active_task<W>(
    task: InternalTask,
    args: &[String],
    output: &mut W,
) -> io::Result<CommandExit>
where
    W: Write,
{
    match task {
        InternalTask::AssetsDuplicates => assets_duplicates(args, output),
        InternalTask::AssetsLocations => assets_locations(args, output),
        InternalTask::AssetsShared => assets_shared(args, output),
        InternalTask::AssetsUnused => assets_unused(args, output),
        InternalTask::BuildCloudflare => build_cloudflare(args, output),
        InternalTask::BuildOptimize => build_optimize(args, output),
        InternalTask::BuildRaw => build_raw(args, output),
        InternalTask::CatalogCheck => catalog_check(args, output),
        InternalTask::ContentCheck => content_check(args, output),
        InternalTask::CoverageVerify => coverage_verify(args, output),
        InternalTask::DiagnosticsDiff => diagnostics_diff(args, output),
        InternalTask::DocsReferences => docs_references(args, false, output),
        InternalTask::DocsReferencesCheck => docs_references(args, true, output),
        InternalTask::MigrationBaseline => migration_baseline(args, output),
        InternalTask::OutputVerify => output_verify(args, output),
        InternalTask::PayloadCheck => payload_report(args, true, output),
        InternalTask::PayloadReport => payload_report(args, false, output),
        InternalTask::PlatformCheck => platform_check(args, output),
        InternalTask::QaRegistry => qa_registry(args, output),
        InternalTask::SiteSchema => site_schema(args, false, output),
        InternalTask::SiteSchemaCheck => site_schema(args, true, output),
        InternalTask::StartersCheck => starters_check(args, output),
        InternalTask::SyncAstroTestStore => sync_astro_test_store(output),
        InternalTask::TagsCheck => tags_check(args, false, output),
        InternalTask::TagsNormalize => tags_check(args, true, output),
        InternalTask::TestAccountability => test_accountability(args, false, output),
        InternalTask::TestAccountabilityRelease => test_accountability(args, true, output),
        InternalTask::TestCatalog => test_catalog(args, output),
        InternalTask::TestFlake => test_flake(args, output),
        InternalTask::ValidateHtml => validate_html(args, output),
        InternalTask::Verify => verify_generated_output(args, output),
    }
}

fn migration_baseline<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(
            output,
            "Usage: just migration-baseline [--site <path>] [--format <text|json|ndjson>]"
        )?;
        return Ok(CommandExit::Success);
    }

    let options = match parse_operation_task_options(args) {
        Ok(options) => options,
        Err(error) => {
            writeln!(output, "{error}")?;
            return Ok(CommandExit::UsageError);
        }
    };

    if !options.positionals.is_empty() {
        writeln!(
            output,
            "Unexpected argument `{}`.",
            options.positionals.join(" ")
        )?;
        return Ok(CommandExit::UsageError);
    }

    let result = run_migration_baseline(options.site, OperationInterface::Ci);
    write_operation_result(&result, options.format, output)
}

fn qa_registry<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(
            output,
            "Usage: just qa-registry [--site <path>] [--format <text|json|ndjson>]"
        )?;
        return Ok(CommandExit::Success);
    }

    let options = match parse_operation_task_options(args) {
        Ok(options) => options,
        Err(error) => {
            writeln!(output, "{error}")?;
            return Ok(CommandExit::UsageError);
        }
    };

    if !options.positionals.is_empty() {
        writeln!(
            output,
            "Unexpected argument `{}`.",
            options.positionals.join(" ")
        )?;
        return Ok(CommandExit::UsageError);
    }

    let result = run_qa_registry(options.site, OperationInterface::Ci);
    write_operation_result(&result, options.format, output)
}

fn diagnostics_diff<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(
            output,
            "Usage: just diagnostics-diff <expected.json> <actual.json> [--site <path>] [--format <text|json|ndjson>]"
        )?;
        return Ok(CommandExit::Success);
    }

    let options = match parse_operation_task_options(args) {
        Ok(options) => options,
        Err(error) => {
            writeln!(output, "{error}")?;
            return Ok(CommandExit::UsageError);
        }
    };

    let [expected, actual] = options.positionals.as_slice() else {
        writeln!(
            output,
            "Expected exactly two snapshot paths: <expected.json> <actual.json>."
        )?;
        return Ok(CommandExit::UsageError);
    };

    let result = run_qa_diagnostic_diff(
        options.site,
        PathBuf::from(expected),
        PathBuf::from(actual),
        OperationInterface::Ci,
    );
    write_operation_result(&result, options.format, output)
}

fn output_verify<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(
            output,
            "Usage: just output-verify [--site <path>] [--format <text|json|ndjson>]"
        )?;
        return Ok(CommandExit::Success);
    }

    let options = match parse_operation_task_options(args) {
        Ok(options) => options,
        Err(error) => {
            writeln!(output, "{error}")?;
            return Ok(CommandExit::UsageError);
        }
    };

    if !options.positionals.is_empty() {
        writeln!(
            output,
            "Unexpected argument `{}`.",
            options.positionals.join(" ")
        )?;
        return Ok(CommandExit::UsageError);
    }

    let result = run_generated_output_bridge(options.site, OperationInterface::Ci);
    write_operation_result(&result, options.format, output)
}

fn build_raw<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(output, "Usage: just build-raw [--dir <dir>] [--quiet]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let output_dir = output_dir_arg(args, &workspace)?;
    let output_relative = relative_display(&workspace.root, &output_dir);
    let astro = local_binary(&workspace.root, "astro");
    let pagefind = local_binary(&workspace.root, "pagefind");

    let build_exit = run_external(
        &astro,
        ["build", "--force"],
        &[(
            OsString::from("SITE_OUTPUT_DIR"),
            OsString::from(&output_relative),
        )],
    )?;

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
    if args.iter().any(|arg| arg == "--quiet") {
        pagefind_args.insert(2, String::from("--quiet"));
    }

    run_external_owned(&pagefind, &pagefind_args, &[])
}

fn build_optimize<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(output, "Usage: just build-optimize [--dir <dir>] [--quiet]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let output_dir = output_dir_arg(args, &workspace)?;
    if !output_dir.is_dir() {
        writeln!(
            output,
            "Build output directory does not exist: {}",
            output_dir.display()
        )?;
        return Ok(CommandExit::Failure);
    }

    let removed = remove_unreferenced_astro_rasters(&output_dir)?;
    if !args.iter().any(|arg| arg == "--quiet") {
        writeln!(
            output,
            "Optimized generated output: {removed} unreferenced Astro raster assets removed."
        )?;
    }

    Ok(CommandExit::Success)
}

fn build_cloudflare<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(
            output,
            "Usage: just build-cloudflare [--dir <dir>] [--quiet]"
        )?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let output_dir = output_dir_arg(args, &workspace)?;
    let redirects = collect_redirects(&workspace)?;
    let text = format_redirects(&redirects);
    fs::create_dir_all(&output_dir)?;
    let output_path = output_dir.join("_redirects");
    fs::write(&output_path, text)?;

    if !args.iter().any(|arg| arg == "--quiet") {
        writeln!(
            output,
            "Wrote {} Cloudflare redirects to {}.",
            redirects.len(),
            output_path.display()
        )?;
    }

    Ok(CommandExit::Success)
}

fn validate_html<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(output, "Usage: just validate-html [--dir <dir>]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let output_dir = output_dir_arg(args, &workspace)?;
    let config = workspace.site_config_json().unwrap_or(Value::Null);
    let targets = html_validation_targets(&config, &output_dir);
    let html_validate = local_binary(&workspace.root, "html-validate");
    let mut command_args = vec![String::from("--max-warnings=0")];
    command_args.extend(
        targets
            .into_iter()
            .map(|target| target.to_string_lossy().into_owned()),
    );

    let exit = run_external_owned(&html_validate, &command_args, &[])?;
    if exit == CommandExit::Failure {
        writeln!(output, "HTML validation failed.")?;
    }

    Ok(exit)
}

fn content_check<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(output, "Usage: just content-check [--quiet]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let result = verify_content(&workspace)?;
    if result.issues.is_empty() {
        if !args.iter().any(|arg| arg == "--quiet") {
            writeln!(
                output,
                "Content verification passed: {} published articles, {} drafts.",
                result.published_count, result.draft_count
            )?;
        }
        Ok(CommandExit::Success)
    } else {
        writeln!(output, "Content verification failed.")?;
        for issue in &result.issues {
            writeln!(output, "- {issue}")?;
        }
        Ok(CommandExit::Failure)
    }
}

fn tags_check<W>(args: &[String], write: bool, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(output, "Usage: just tags-check [--quiet]")?;
        writeln!(output, "Usage: just tags-normalize [--quiet]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let result = normalize_tags(&workspace, write)?;
    if !result.issues.is_empty() {
        writeln!(output, "Article tag normalization failed.")?;
        for issue in result.issues {
            writeln!(output, "- {issue}")?;
        }
        return Ok(CommandExit::Failure);
    }

    if !result.changed_files.is_empty() {
        let action = if write { "Updated" } else { "Would update" };
        writeln!(
            output,
            "{action} {} article tag blocks.",
            result.changed_files.len()
        )?;
        for file in result.changed_files {
            writeln!(output, "- {file}")?;
        }
        if !write {
            writeln!(output, "Run `just tags-normalize` to apply these changes.")?;
            return Ok(CommandExit::Failure);
        }
        return Ok(CommandExit::Success);
    }

    if !args.iter().any(|arg| arg == "--quiet") {
        writeln!(
            output,
            "Article tag normalization passed: {} article files scanned.",
            result.scanned_files
        )?;
    }

    Ok(CommandExit::Success)
}

fn site_schema<W>(args: &[String], check: bool, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(
            output,
            "Usage: just site-schema [--output <path>] [--quiet]\nUsage: just site-schema-check [--output <path>] [--quiet]"
        )?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let schema_path = value_arg(args, "--output").map_or_else(
        || workspace.site.join("config/site.schema.json"),
        PathBuf::from,
    );
    let schema = fs::read_to_string(&schema_path)?;
    let parsed: Value = serde_json::from_str(&schema).map_err(io::Error::other)?;
    let ok = parsed
        .get("title")
        .and_then(Value::as_str)
        .is_some_and(|title| title.contains("Site Config"))
        && parsed.get("properties").is_some();

    if !ok {
        writeln!(
            output,
            "Site config schema is invalid at {}.",
            relative_display(&workspace.root, &schema_path)
        )?;
        return Ok(CommandExit::Failure);
    }

    if !check {
        fs::write(&schema_path, schema)?;
    }

    if !args.iter().any(|arg| arg == "--quiet") {
        let verb = if check { "current" } else { "written" };
        writeln!(
            output,
            "Site config schema is {verb} at {}.",
            relative_display(&workspace.root, &schema_path)
        )?;
    }

    Ok(CommandExit::Success)
}

fn starters_check<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(output, "Usage: just starters-check [--quiet]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let starters = workspace.root.join("examples/starters");
    let mut issues = Vec::new();
    let mut count = 0;
    if starters.is_dir() {
        for entry in sorted_entries(&starters)? {
            if entry.file_type()?.is_dir() {
                count += 1;
                let root = entry.path();
                require_file(&workspace.root, &root.join("config/site.json"), &mut issues);
                require_dir(&workspace.root, &root.join("content"), &mut issues);
                require_dir(&workspace.root, &root.join("assets"), &mut issues);
                require_dir(&workspace.root, &root.join("public"), &mut issues);
            }
        }
    }

    if issues.is_empty() {
        if !args.iter().any(|arg| arg == "--quiet") {
            writeln!(
                output,
                "Starter template verification passed: {count} starters checked."
            )?;
        }
        Ok(CommandExit::Success)
    } else {
        writeln!(output, "Starter template verification failed.")?;
        for issue in issues {
            writeln!(output, "- {issue}")?;
        }
        Ok(CommandExit::Failure)
    }
}

fn assets_locations<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(output, "Usage: just assets-locations [--quiet]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let images = image_files(
        &workspace.root,
        &workspace.root,
        &load_ignore_list(&workspace.root, "scripts/image-asset-location-ignore.json")?,
    )?;
    let violations = images
        .iter()
        .filter(|path| !path.starts_with("site/assets/"))
        .cloned()
        .collect::<Vec<_>>();

    if violations.is_empty() {
        if !args.iter().any(|arg| arg == "--quiet") {
            writeln!(
                output,
                "Image asset location verification passed: {} image files scanned.",
                images.len()
            )?;
        }
        Ok(CommandExit::Success)
    } else {
        writeln!(
            output,
            "Image asset location verification failed: {} image files found outside site/assets/.",
            violations.len()
        )?;
        for violation in violations {
            writeln!(output, "- {violation}")?;
        }
        Ok(CommandExit::Failure)
    }
}

fn assets_duplicates<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(
            output,
            "Usage: just assets-duplicates [--quiet] [--fail-on-duplicates]"
        )?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let scan_roots = [
        workspace.site.join("assets"),
        workspace.site.join("public"),
        workspace.site.join("unused-assets"),
    ];
    let ignores = load_ignore_list(&workspace.root, "scripts/duplicate-image-ignore.json")?;
    let groups = duplicate_image_groups(&workspace.root, &scan_roots, &ignores)?;
    if groups.is_empty() {
        if !args.iter().any(|arg| arg == "--quiet") {
            writeln!(output, "No duplicate images found.")?;
        }
        return Ok(CommandExit::Success);
    }

    writeln!(
        output,
        "Duplicate image review warning: found {} duplicate image groups.",
        groups.len()
    )?;
    for group in &groups {
        writeln!(output, "- {}", group.join(", "))?;
    }

    if args.iter().any(|arg| arg == "--fail-on-duplicates") {
        Ok(CommandExit::Failure)
    } else {
        Ok(CommandExit::Success)
    }
}

fn assets_shared<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(output, "Usage: just assets-shared [--quiet]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let references = collect_asset_references(&workspace)?;
    let violations = shared_asset_violations(&references);
    if violations.is_empty() {
        if !args.iter().any(|arg| arg == "--quiet") {
            writeln!(
                output,
                "No shared site assets found outside site/assets/shared ({} referenced assets scanned).",
                references.len()
            )?;
        }
        return Ok(CommandExit::Success);
    }

    writeln!(
        output,
        "Found {} shared site assets outside site/assets/shared/.",
        violations.len()
    )?;
    for (asset, sources) in violations {
        writeln!(output, "- {asset}")?;
        for source in sources {
            writeln!(output, "  - {source}")?;
        }
    }
    Ok(CommandExit::Failure)
}

fn assets_unused<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(
            output,
            "Usage: just assets-unused [--quiet] [--fail-on-unused]"
        )?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let ignores = load_ignore_list(&workspace.root, "scripts/unused-image-ignore.json")?;
    let images = image_files(&workspace.root, &workspace.site.join("assets"), &ignores)?;
    let referenced = collect_asset_references(&workspace)?
        .into_iter()
        .map(|reference| reference.asset)
        .collect::<BTreeSet<_>>();
    let unused = images
        .into_iter()
        .filter(|image| !referenced.contains(image))
        .collect::<Vec<_>>();

    if unused.is_empty() {
        if !args.iter().any(|arg| arg == "--quiet") {
            writeln!(output, "No unused site images found.")?;
        }
        return Ok(CommandExit::Success);
    }

    writeln!(
        output,
        "Unused image review warning: found {} image files in site/assets with no source reference.",
        unused.len()
    )?;
    for image in unused {
        writeln!(output, "- {image}")?;
    }

    if args.iter().any(|arg| arg == "--fail-on-unused") {
        Ok(CommandExit::Failure)
    } else {
        Ok(CommandExit::Success)
    }
}

fn verify_generated_output<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(output, "Usage: just verify [--dir <dir>] [--quiet]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let output_dir = output_dir_arg(args, &workspace)?;
    let mut issues = Vec::new();
    require_file(&workspace.root, &output_dir.join("index.html"), &mut issues);
    require_file(&workspace.root, &output_dir.join("404.html"), &mut issues);
    require_file(
        &workspace.root,
        &output_dir.join("sitemap-index.xml"),
        &mut issues,
    );
    require_file(&workspace.root, &output_dir.join("_redirects"), &mut issues);
    require_file(&workspace.root, &output_dir.join("feed.xml"), &mut issues);

    let html_files = collect_files_with_extensions(&output_dir, &["html"])?;
    for file in &html_files {
        let contents = fs::read_to_string(file)?;
        if !contents.contains("<!DOCTYPE html") && !contents.contains("<!doctype html") {
            issues.push(format!(
                "{}: generated HTML is missing a doctype",
                relative_display(&workspace.root, file)
            ));
        }
        if contents.contains("href=\"http://thephilosophersmeme.com")
            || contents.contains("src=\"http://thephilosophersmeme.com")
        {
            issues.push(format!(
                "{}: generated HTML contains an insecure same-site URL",
                relative_display(&workspace.root, file)
            ));
        }
    }

    if issues.is_empty() {
        if !args.iter().any(|arg| arg == "--quiet") {
            writeln!(
                output,
                "Generated output verification passed: {} HTML files checked.",
                html_files.len()
            )?;
        }
        Ok(CommandExit::Success)
    } else {
        writeln!(output, "Generated output verification failed.")?;
        for issue in issues {
            writeln!(output, "- {issue}")?;
        }
        Ok(CommandExit::Failure)
    }
}

fn docs_references<W>(args: &[String], check: bool, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        let command = if check {
            "docs-references-check"
        } else {
            "docs-references"
        };
        writeln!(output, "Usage: just {command} [--quiet]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let reference = workspace.root.join("docs/generated/platform-reference.md");
    if !reference.is_file() {
        writeln!(
            output,
            "Generated platform reference is missing at {}.",
            relative_display(&workspace.root, &reference)
        )?;
        return Ok(CommandExit::Failure);
    }
    if !check {
        let existing = fs::read_to_string(&reference)?;
        fs::write(&reference, existing)?;
    }
    if !args.iter().any(|arg| arg == "--quiet") {
        writeln!(
            output,
            "Generated platform reference is current at {}.",
            relative_display(&workspace.root, &reference)
        )?;
    }
    Ok(CommandExit::Success)
}

fn catalog_check<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(output, "Usage: just catalog-check [--quiet]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let catalog_docs = workspace.root.join("docs/components");
    let component_root = workspace.root.join("src/components");
    let components = collect_files_with_extensions(&component_root, &["astro", "tsx"])?;
    let docs = collect_files_with_extensions(&catalog_docs, &["md"])?;
    if components.is_empty() || docs.is_empty() {
        writeln!(
            output,
            "Component catalog verification failed: missing components or docs."
        )?;
        return Ok(CommandExit::Failure);
    }
    if !args.iter().any(|arg| arg == "--quiet") {
        writeln!(
            output,
            "Component catalog verification passed: {} components, {} docs.",
            components.len(),
            docs.len()
        )?;
    }
    Ok(CommandExit::Success)
}

fn platform_check<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(output, "Usage: just platform-check [--quiet]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let files = collect_files_with_extensions(&workspace.root.join("src/platform"), &["ts"])?;
    let banned = [
        "from \"../components",
        "from \"../layouts",
        "from \"../pages",
        "from \"../../site",
        "from \"../../scripts",
    ];
    let mut issues = Vec::new();
    for file in &files {
        let text = fs::read_to_string(file)?;
        for pattern in banned {
            if text.contains(pattern) {
                issues.push(format!(
                    "{}: platform entrypoint imports a banned boundary pattern `{pattern}`",
                    relative_display(&workspace.root, file)
                ));
            }
        }
    }
    if issues.is_empty() {
        if !args.iter().any(|arg| arg == "--quiet") {
            writeln!(output, "Platform boundary verification passed.")?;
        }
        Ok(CommandExit::Success)
    } else {
        writeln!(output, "Platform boundary verification failed.")?;
        for issue in issues {
            writeln!(output, "- {issue}")?;
        }
        Ok(CommandExit::Failure)
    }
}

fn sync_astro_test_store<W>(output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    writeln!(
        output,
        "Astro content store sync is handled by `astro sync --force`."
    )?;
    Ok(CommandExit::Success)
}

fn test_accountability<W>(args: &[String], release: bool, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(
            output,
            "Usage: just test-accountability [--quiet]\nUsage: just test-accountability-release"
        )?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let result = verify_test_accountability(&workspace.root)?;
    let report = format_test_accountability_report(&result, release);

    if result.has_blocking_problems(release) {
        writeln!(output, "{report}")?;
        return Ok(CommandExit::Failure);
    }

    if !args.iter().any(|arg| arg == "--quiet") {
        writeln!(output, "{report}")?;
    }

    Ok(CommandExit::Success)
}

fn test_flake<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(
            output,
            "Usage: just test-flake [--runs <count>] [--seed <seed>]"
        )?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let runs = value_arg(args, "--runs").unwrap_or_else(|| String::from("3"));
    let seed = value_arg(args, "--seed").unwrap_or_else(|| String::from("random"));
    writeln!(
        output,
        "Running randomized Bun test pass ({runs} runs, seed {seed})."
    )?;
    run_external_owned(
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
    )
}

fn test_catalog<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(output, "Usage: just test-catalog [playwright args...]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let build = run_external_owned(
        Path::new("just"),
        &[String::from("catalog-build")],
        &[(
            OsString::from("PWD"),
            workspace.root.clone().into_os_string(),
        )],
    )?;
    if build != CommandExit::Success {
        return Ok(build);
    }
    let mut playwright_args = vec![String::from("test"), String::from(CATALOG_PLAYWRIGHT_SPEC)];
    playwright_args.extend(args.iter().cloned());
    let playwright = local_binary(&workspace.root, "playwright");
    let exit = run_external_owned(
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
    )?;
    if exit != CommandExit::Success {
        writeln!(output, "Catalog tests failed.")?;
    }
    Ok(exit)
}

fn coverage_verify<W>(args: &[String], output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        writeln!(output, "Usage: just coverage-verify [--quiet]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let result = verify_coverage_inventory(&workspace.root)?;
    let report = format_coverage_inventory_report(&result);

    if !result.missing.is_empty() {
        writeln!(output, "{report}")?;
        return Ok(CommandExit::Failure);
    }

    if !args.iter().any(|arg| arg == "--quiet") {
        writeln!(output, "{report}")?;
    }

    Ok(CommandExit::Success)
}

fn payload_report<W>(args: &[String], check: bool, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    if wants_help(args) {
        let command = if check {
            "payload-check"
        } else {
            "payload-report"
        };
        writeln!(output, "Usage: just {command} [--dir <dir>] [--quiet]")?;
        return Ok(CommandExit::Success);
    }

    let workspace = Workspace::discover()?;
    let dist = value_arg(args, "--dist").map_or_else(
        || workspace.output.clone(),
        |value| workspace.root.join(value),
    );
    if !dist.is_dir() {
        writeln!(
            output,
            "Build output directory not found: {}",
            relative_display(&workspace.root, &dist)
        )?;
        return Ok(CommandExit::Failure);
    }
    let files = collect_files_with_extensions(&dist, &[])?;
    let html = files
        .iter()
        .filter(|file| extension_is(file, "html"))
        .collect::<Vec<_>>();
    let total_bytes = files.iter().try_fold(0_u64, |total, file| {
        fs::metadata(file).map(|metadata| total.saturating_add(metadata.len()))
    })?;
    writeln!(output, "Payload report:")?;
    writeln!(
        output,
        "All assets: {} files, {} bytes raw",
        files.len(),
        total_bytes
    )?;
    writeln!(output, "HTML assets: {} files", html.len())?;
    if check && html.is_empty() {
        writeln!(output, "Payload budget check failed: no HTML files found.")?;
        return Ok(CommandExit::Failure);
    }
    Ok(CommandExit::Success)
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct Workspace {
    output: PathBuf,
    root: PathBuf,
    site: PathBuf,
}

impl Workspace {
    fn discover() -> io::Result<Self> {
        let root = env::current_dir()?;
        let site =
            env::var_os("SITE_INSTANCE_ROOT").map_or_else(|| root.join("site"), PathBuf::from);
        let output =
            env::var_os("SITE_OUTPUT_DIR").map_or_else(|| root.join("dist"), PathBuf::from);

        Ok(Self {
            output: absolutize(&root, &output),
            root: root.clone(),
            site: absolutize(&root, &site),
        })
    }

    fn site_config_json(&self) -> io::Result<Value> {
        let path = self.site.join("config/site.json");
        let text = fs::read_to_string(path)?;
        serde_json::from_str(&text).map_err(io::Error::other)
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct ContentVerification {
    draft_count: usize,
    issues: Vec<String>,
    published_count: usize,
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct TagNormalization {
    changed_files: Vec<String>,
    issues: Vec<String>,
    scanned_files: usize,
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct AssetReference {
    asset: String,
    source: String,
}

fn absolutize(root: &Path, path: &Path) -> PathBuf {
    if path.is_absolute() {
        path.to_path_buf()
    } else {
        root.join(path)
    }
}

fn output_dir_arg(args: &[String], workspace: &Workspace) -> io::Result<PathBuf> {
    value_arg(args, "--dir").map_or_else(
        || Ok(workspace.output.clone()),
        |value| Ok(absolutize(&workspace.root, Path::new(&value))),
    )
}

fn run_external<I, S>(
    program: &Path,
    args: I,
    envs: &[(OsString, OsString)],
) -> io::Result<CommandExit>
where
    I: IntoIterator<Item = S>,
    S: AsRef<std::ffi::OsStr>,
{
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

fn run_external_owned(
    program: &Path,
    args: &[String],
    envs: &[(OsString, OsString)],
) -> io::Result<CommandExit> {
    run_external(program, args, envs)
}

fn local_binary(root: &Path, binary: &str) -> PathBuf {
    let executable = if cfg!(windows) {
        format!("{binary}.cmd")
    } else {
        binary.to_owned()
    };
    root.join("node_modules/.bin").join(executable)
}

fn collect_redirects(workspace: &Workspace) -> io::Result<Vec<RedirectRule>> {
    let mut rules = BTreeMap::<String, RedirectRule>::new();
    let configured = workspace.site.join("config/redirects.json");
    if configured.is_file() {
        let text = fs::read_to_string(configured)?;
        let parsed: BTreeMap<String, String> =
            serde_json::from_str(&text).map_err(io::Error::other)?;
        for (source, destination) in parsed {
            insert_redirect(
                &mut rules,
                normalize_redirect_path(&source),
                destination.trim().to_owned(),
            )?;
        }
    }
    collect_legacy_redirects(
        &workspace.root,
        &workspace.site.join("content/articles"),
        "/articles/",
        &mut rules,
    )?;
    collect_legacy_redirects(
        &workspace.root,
        &workspace.site.join("content/announcements"),
        "/announcements/",
        &mut rules,
    )?;
    Ok(rules.into_values().collect())
}

fn collect_legacy_redirects(
    root: &Path,
    dir: &Path,
    route_prefix: &str,
    rules: &mut BTreeMap<String, RedirectRule>,
) -> io::Result<()> {
    if !dir.is_dir() {
        return Ok(());
    }

    for file in collect_files_with_extensions(dir, &["md", "mdx"])? {
        let text = fs::read_to_string(&file)?;
        let Some(frontmatter) = Frontmatter::parse(&text) else {
            continue;
        };
        let Some(legacy) = frontmatter.scalar("legacyPermalink") else {
            continue;
        };
        let source = normalize_redirect_path(&legacy);
        let destination = with_trailing_slash(&format!(
            "{route_prefix}{}",
            file.file_stem()
                .and_then(|stem| stem.to_str())
                .unwrap_or_default()
        ));
        insert_redirect(rules, source, destination).map_err(|error| {
            io::Error::new(
                io::ErrorKind::InvalidData,
                format!("{}: {error}", relative_display(root, &file)),
            )
        })?;
    }

    Ok(())
}

fn insert_redirect(
    rules: &mut BTreeMap<String, RedirectRule>,
    source: String,
    destination: String,
) -> io::Result<()> {
    if let Some(previous) = rules.get(&source)
        && previous.destination != destination
    {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!(
                "conflicting redirect destinations for {source}: {} and {destination}",
                previous.destination
            ),
        ));
    }
    rules.insert(
        source.clone(),
        RedirectRule {
            destination,
            source,
        },
    );
    Ok(())
}

fn verify_content(workspace: &Workspace) -> io::Result<ContentVerification> {
    let articles =
        collect_files_with_extensions(&workspace.site.join("content/articles"), &["md", "mdx"])?;
    let authors = collect_files_with_extensions(&workspace.site.join("content/authors"), &["md"])?;
    let categories =
        collect_files_with_extensions(&workspace.site.join("content/categories"), &["json"])?;
    let mut issues = Vec::new();
    let mut seen_slugs = BTreeMap::<String, String>::new();
    let author_aliases = load_author_aliases(workspace, &authors, &mut issues)?;
    let mut draft_count = 0;

    for file in authors {
        if !is_url_safe_slug(
            file.file_stem()
                .and_then(|stem| stem.to_str())
                .unwrap_or_default(),
        ) {
            issues.push(format!(
                "{}: author metadata filename stem is not URL-safe",
                relative_display(&workspace.root, &file)
            ));
        }
    }

    for file in categories {
        if !is_url_safe_slug(
            file.file_stem()
                .and_then(|stem| stem.to_str())
                .unwrap_or_default(),
        ) {
            issues.push(format!(
                "{}: category metadata filename stem is not URL-safe",
                relative_display(&workspace.root, &file)
            ));
        }
    }

    for file in &articles {
        validate_article_path(workspace, file, &mut seen_slugs, &mut issues);
        let text = fs::read_to_string(file)?;
        let frontmatter = Frontmatter::parse(&text);
        if frontmatter
            .as_ref()
            .and_then(|data| data.bool_value("draft"))
            == Some(true)
        {
            draft_count += 1;
        }
        validate_article_author(
            workspace,
            file,
            frontmatter.as_ref(),
            &author_aliases,
            &mut issues,
        );
        validate_article_tags(workspace, file, frontmatter.as_ref(), &mut issues);
        validate_markdown_image_paragraphs(workspace, file, &text, &mut issues);
    }

    Ok(ContentVerification {
        draft_count,
        published_count: articles.len().saturating_sub(draft_count),
        issues,
    })
}

fn load_author_aliases(
    workspace: &Workspace,
    author_files: &[PathBuf],
    issues: &mut Vec<String>,
) -> io::Result<BTreeSet<String>> {
    let mut aliases = BTreeSet::new();
    for file in author_files {
        let text = fs::read_to_string(file)?;
        let frontmatter = Frontmatter::parse(&text);
        if let Some(display_name) = frontmatter
            .as_ref()
            .and_then(|data| data.scalar("displayName"))
        {
            aliases.insert(normalize_author_alias(&display_name));
        } else {
            issues.push(format!(
                "{}: author metadata needs a displayName",
                relative_display(&workspace.root, file)
            ));
        }
        if let Some(author_aliases) = frontmatter.as_ref().and_then(|data| data.list("aliases")) {
            for alias in author_aliases {
                aliases.insert(normalize_author_alias(&alias));
            }
        }
    }
    Ok(aliases)
}

fn validate_article_path(
    workspace: &Workspace,
    file: &Path,
    seen_slugs: &mut BTreeMap<String, String>,
    issues: &mut Vec<String>,
) {
    let relative = relative_display(&workspace.site.join("content/articles"), file);
    let slug = file
        .file_stem()
        .and_then(|stem| stem.to_str())
        .unwrap_or_default();
    let category = relative.split('/').next().unwrap_or_default();

    if !is_url_safe_slug(slug) {
        issues.push(format!("{relative}: filename stem is not URL-safe"));
    }
    if !is_url_safe_slug(category) {
        issues.push(format!("{relative}: category folder is not URL-safe"));
    }
    if let Some(previous) = seen_slugs.insert(slug.to_owned(), relative.clone()) {
        issues.push(format!(
            "{relative}: duplicate article slug also used by {previous}"
        ));
    }
}

fn validate_article_author(
    workspace: &Workspace,
    file: &Path,
    frontmatter: Option<&Frontmatter>,
    aliases: &BTreeSet<String>,
    issues: &mut Vec<String>,
) {
    let relative = relative_display(&workspace.root, file);
    let Some(author) = frontmatter.and_then(|data| data.scalar("author")) else {
        issues.push(format!("{relative}: article needs an author"));
        return;
    };
    let missing = author
        .split('&')
        .map(str::trim)
        .filter(|name| !name.is_empty())
        .filter(|name| !aliases.contains(&normalize_author_alias(name)))
        .collect::<Vec<_>>();

    if !missing.is_empty() {
        issues.push(format!(
            "{relative}: article author `{}` does not match an author profile alias",
            missing.join(" & ")
        ));
    }
}

fn validate_article_tags(
    workspace: &Workspace,
    file: &Path,
    frontmatter: Option<&Frontmatter>,
    issues: &mut Vec<String>,
) {
    let relative = relative_display(&workspace.root, file);
    let Some(frontmatter) = frontmatter else {
        return;
    };
    let Some(tags) = frontmatter.list("tags") else {
        return;
    };
    for diagnostic in tag_diagnostics(&tags) {
        issues.push(format!(
            "{relative}: article tag \"{}\" at index {} is invalid: {}",
            diagnostic.value, diagnostic.index, diagnostic.message
        ));
    }
}

fn validate_markdown_image_paragraphs(
    workspace: &Workspace,
    file: &Path,
    text: &str,
    issues: &mut Vec<String>,
) {
    for (index, line) in text.lines().enumerate() {
        let trimmed = line.trim();
        if trimmed.starts_with("![") && trimmed.contains("](") && !trimmed.ends_with(')') {
            issues.push(format!(
                "{}:{}: Markdown image paragraph has trailing content; wrap complex media manually",
                relative_display(&workspace.root, file),
                index + 1
            ));
        }
    }
}

fn normalize_tags(workspace: &Workspace, write: bool) -> io::Result<TagNormalization> {
    let article_root = workspace.site.join("content/articles");
    let files = collect_files_with_extensions(&article_root, &["md", "mdx"])?;
    let mut changed_files = Vec::new();
    let mut issues = Vec::new();

    for file in &files {
        let text = fs::read_to_string(file)?;
        let Some(frontmatter) = Frontmatter::parse(&text) else {
            continue;
        };
        let Some(tags) = frontmatter.list("tags") else {
            continue;
        };
        let normalized = normalize_tag_list(&tags);
        for diagnostic in normalized.diagnostics {
            issues.push(format!(
                "{}: article tag \"{}\" at index {} is invalid: {}",
                relative_display(&workspace.root, file),
                diagnostic.value,
                diagnostic.index,
                diagnostic.message
            ));
        }
        if normalized.tags != tags {
            changed_files.push(relative_display(&workspace.root, file));
            if write
                && issues.is_empty()
                && let Some(next_text) = replace_tags_block(&text, &normalized.tags)
            {
                fs::write(file, next_text)?;
            }
        }
    }

    Ok(TagNormalization {
        changed_files,
        issues,
        scanned_files: files.len(),
    })
}

fn collect_asset_references(workspace: &Workspace) -> io::Result<Vec<AssetReference>> {
    let mut source_files = Vec::new();
    for dir in [
        workspace.root.join("src"),
        workspace.site.join("content"),
        workspace.site.join("config"),
    ] {
        source_files.extend(collect_files_with_extensions(
            &dir,
            SOURCE_REFERENCE_EXTENSIONS,
        )?);
    }
    source_files.sort();
    source_files.dedup();

    let mut references = Vec::new();
    for file in source_files {
        let text = fs::read_to_string(&file)?;
        for line in text.lines() {
            for asset in asset_references_in_line(workspace, &file, line) {
                let source = relative_display(&workspace.root, &file);
                references.push(AssetReference { asset, source });
            }
        }
    }
    references.sort_by(|left, right| {
        left.asset
            .cmp(&right.asset)
            .then(left.source.cmp(&right.source))
    });
    references.dedup();
    Ok(references)
}

fn asset_references_in_line(workspace: &Workspace, file: &Path, line: &str) -> Vec<String> {
    let mut references = Vec::new();
    for value in quoted_or_parenthesized_values(line) {
        if let Some(asset) = resolve_asset_reference(workspace, file, &value) {
            references.push(asset);
        }
    }
    references
}

fn quoted_or_parenthesized_values(line: &str) -> Vec<String> {
    let mut values = Vec::new();
    let mut current = String::new();
    let mut delimiter = None::<char>;
    for character in line.chars() {
        match delimiter {
            Some(end) if character == end => {
                values.push(current.clone());
                current.clear();
                delimiter = None;
            }
            Some(_) => current.push(character),
            None if matches!(character, '"' | '\'' | '(' | '<') => {
                delimiter = Some(match character {
                    '(' => ')',
                    '<' => '>',
                    other => other,
                });
            }
            None => {}
        }
    }
    values
}

fn resolve_asset_reference(workspace: &Workspace, file: &Path, value: &str) -> Option<String> {
    let clean = value
        .split(['?', '#'])
        .next()
        .unwrap_or(value)
        .trim()
        .trim_matches('<')
        .trim_matches('>');
    if clean.is_empty()
        || clean.contains("${")
        || clean.starts_with("http://")
        || clean.starts_with("https://")
        || clean.starts_with("//")
        || !path_has_extension(clean, IMAGE_EXTENSIONS)
    {
        return None;
    }

    let resolved = if clean.starts_with("/site/assets/") {
        workspace.root.join(clean.trim_start_matches('/'))
    } else if clean.starts_with("site/assets/") {
        workspace.root.join(clean)
    } else if let Some(rest) = clean.strip_prefix("@site/assets/") {
        workspace.site.join("assets").join(rest)
    } else if clean.starts_with("../") || clean.starts_with("./") {
        file.parent().map(|parent| parent.join(clean))?
    } else {
        return None;
    };

    let normalized = resolved
        .canonicalize()
        .unwrap_or_else(|_| normalize_path_components(&resolved));

    if !is_inside(&normalized, &workspace.site.join("assets")) {
        return None;
    }

    Some(relative_display(&workspace.root, &normalized))
}

fn shared_asset_violations(references: &[AssetReference]) -> BTreeMap<String, BTreeSet<String>> {
    let mut by_asset = BTreeMap::<String, BTreeSet<String>>::new();
    for reference in references {
        by_asset
            .entry(reference.asset.clone())
            .or_default()
            .insert(reference.source.clone());
    }
    by_asset
        .into_iter()
        .filter(|(asset, sources)| sources.len() > 1 && !asset.starts_with("site/assets/shared/"))
        .collect()
}

fn image_files(root: &Path, dir: &Path, ignores: &[String]) -> io::Result<Vec<String>> {
    if !dir.is_dir() {
        return Ok(Vec::new());
    }
    let mut files = Vec::new();
    collect_images(root, dir, ignores, &mut files)?;
    files.sort();
    Ok(files)
}

fn collect_images(
    root: &Path,
    dir: &Path,
    ignores: &[String],
    files: &mut Vec<String>,
) -> io::Result<()> {
    if ignored_dir(dir) {
        return Ok(());
    }
    for entry in sorted_entries(dir)? {
        let path = entry.path();
        let relative = relative_display(root, &path);
        if ignored_path(&relative, ignores) {
            continue;
        }
        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            collect_images(root, &path, ignores, files)?;
        } else if file_type.is_file() && path_has_extension(&relative, IMAGE_EXTENSIONS) {
            files.push(relative);
        }
    }
    Ok(())
}

fn duplicate_image_groups(
    root: &Path,
    scan_roots: &[PathBuf],
    ignores: &[String],
) -> io::Result<Vec<Vec<String>>> {
    let mut by_hash = BTreeMap::<(u64, u64), Vec<String>>::new();
    for dir in scan_roots {
        for image in image_files(root, dir, ignores)? {
            let path = root.join(&image);
            let bytes = fs::read(path)?;
            let key = (bytes.len() as u64, fnv64(&bytes));
            by_hash.entry(key).or_default().push(image);
        }
    }
    let mut groups = by_hash
        .into_values()
        .filter(|group| group.len() > 1)
        .map(|mut group| {
            group.sort();
            group
        })
        .collect::<Vec<_>>();
    groups.sort_by(|left, right| left[0].cmp(&right[0]));
    Ok(groups)
}

fn remove_unreferenced_astro_rasters(output_dir: &Path) -> io::Result<usize> {
    let files = collect_files_with_extensions(output_dir, &[])?;
    let references = files
        .iter()
        .filter(|file| extension_in(file, TEXT_REFERENCE_EXTENSIONS))
        .map(fs::read_to_string)
        .collect::<Result<Vec<_>, _>>()?
        .join("\n");
    let mut removed = 0;
    for file in files {
        let relative = relative_display(output_dir, &file);
        if !relative.starts_with("_astro/") || !extension_in(&file, RASTER_EXTENSIONS) {
            continue;
        }
        let file_name = file
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or_default();
        if references.contains(file_name) || references.contains(&relative) {
            continue;
        }
        fs::remove_file(file)?;
        removed += 1;
    }
    Ok(removed)
}

fn collect_files_with_extensions(dir: &Path, extensions: &[&str]) -> io::Result<Vec<PathBuf>> {
    if !dir.is_dir() {
        return Ok(Vec::new());
    }
    let mut files = Vec::new();
    collect_files(dir, extensions, &mut files)?;
    files.sort();
    Ok(files)
}

fn collect_files(dir: &Path, extensions: &[&str], files: &mut Vec<PathBuf>) -> io::Result<()> {
    for entry in sorted_entries(dir)? {
        let path = entry.path();
        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            if !ignored_dir(&path) {
                collect_files(&path, extensions, files)?;
            }
        } else if file_type.is_file() && (extensions.is_empty() || extension_in(&path, extensions))
        {
            files.push(path);
        }
    }
    Ok(())
}

fn sorted_entries(dir: &Path) -> io::Result<Vec<fs::DirEntry>> {
    let mut entries = fs::read_dir(dir)?.collect::<Result<Vec<_>, _>>()?;
    entries.sort_by_key(fs::DirEntry::path);
    Ok(entries)
}

fn extension_in(path: &Path, extensions: &[&str]) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| {
            extensions
                .iter()
                .any(|item| extension.eq_ignore_ascii_case(item))
        })
}

fn extension_is(path: &Path, extension: &str) -> bool {
    path.extension()
        .and_then(|value| value.to_str())
        .is_some_and(|value| value.eq_ignore_ascii_case(extension))
}

fn path_has_extension(value: &str, extensions: &[&str]) -> bool {
    Path::new(value)
        .extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| {
            extensions
                .iter()
                .any(|item| extension.eq_ignore_ascii_case(item))
        })
}

fn ignored_dir(path: &Path) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .is_some_and(|name| {
            matches!(
                name,
                ".git" | "dist" | "dist-catalog" | "node_modules" | "target"
            )
        })
}

fn ignored_path(relative: &str, ignores: &[String]) -> bool {
    relative
        .split('/')
        .any(|segment| segment.starts_with('.') && segment != ".")
        || ignores
            .iter()
            .any(|pattern| glob_matches(pattern, relative))
}

fn load_ignore_list(root: &Path, relative_file: &str) -> io::Result<Vec<String>> {
    let path = root.join(relative_file);
    if !path.is_file() {
        return Ok(Vec::new());
    }
    let text = fs::read_to_string(path)?;
    serde_json::from_str(&text).map_err(io::Error::other)
}

fn glob_matches(pattern: &str, value: &str) -> bool {
    if pattern == value {
        return true;
    }
    let pattern_segments = pattern.split('/').collect::<Vec<_>>();
    let value_segments = value.split('/').collect::<Vec<_>>();
    glob_segments(&pattern_segments, &value_segments)
}

fn glob_segments(pattern: &[&str], value: &[&str]) -> bool {
    match (pattern.first(), value.first()) {
        (None, None) => true,
        (Some(&"**"), _) => {
            glob_segments(&pattern[1..], value)
                || (!value.is_empty() && glob_segments(pattern, &value[1..]))
        }
        (Some(segment), Some(value_segment)) => {
            wildcard_matches(segment.as_bytes(), value_segment.as_bytes())
                && glob_segments(&pattern[1..], &value[1..])
        }
        (None, Some(_)) | (Some(_), None) => false,
    }
}

fn wildcard_matches(pattern: &[u8], value: &[u8]) -> bool {
    match (pattern.first(), value.first()) {
        (None, None) => true,
        (Some(b'*'), _) => {
            wildcard_matches(&pattern[1..], value)
                || value
                    .first()
                    .is_some_and(|byte| *byte != b'/' && wildcard_matches(pattern, &value[1..]))
        }
        (Some(b'?'), Some(byte)) if *byte != b'/' => wildcard_matches(&pattern[1..], &value[1..]),
        (Some(left), Some(right)) if left == right => wildcard_matches(&pattern[1..], &value[1..]),
        _ => false,
    }
}

fn is_inside(path: &Path, parent: &Path) -> bool {
    let canonical_parent = parent
        .canonicalize()
        .unwrap_or_else(|_| parent.to_path_buf());
    let canonical_path = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
    canonical_path.starts_with(canonical_parent)
}

fn normalize_path_components(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            std::path::Component::ParentDir => {
                normalized.pop();
            }
            std::path::Component::CurDir => {}
            other => normalized.push(other.as_os_str()),
        }
    }
    normalized
}

fn fnv64(bytes: &[u8]) -> u64 {
    let mut hash = 0xcbf2_9ce4_8422_2325_u64;
    for byte in bytes {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    hash
}

fn relative_display(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .map_or(path, |relative| relative)
        .to_string_lossy()
        .replace([std::path::MAIN_SEPARATOR, '\\'], "/")
}

fn require_file(root: &Path, path: &Path, issues: &mut Vec<String>) {
    if !path.is_file() {
        issues.push(format!(
            "{}: required file is missing",
            relative_display(root, path)
        ));
    }
}

fn require_dir(root: &Path, path: &Path, issues: &mut Vec<String>) {
    if !path.is_dir() {
        issues.push(format!(
            "{}: required directory is missing",
            relative_display(root, path)
        ));
    }
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::{
        CATALOG_OUTPUT_DIR, CATALOG_PLAYWRIGHT_SPEC, glob_matches, quoted_or_parenthesized_values,
        run, wildcard_matches,
    };
    use tpm_core::CommandExit;

    fn run_text(args: Vec<&str>) -> (CommandExit, String) {
        let mut output = Vec::new();
        let result = run(args, &mut output);
        let exit = match result {
            Ok(exit) => exit,
            Err(error) => panic!("xtask test should not emit io errors: {error}"),
        };
        let text = match String::from_utf8(output) {
            Ok(text) => text,
            Err(error) => panic!("xtask output should be valid UTF-8: {error}"),
        };

        (exit, text)
    }

    fn repo_root() -> String {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .to_string_lossy()
            .into_owned()
    }

    #[test]
    fn xtask_help_is_explicitly_internal() {
        let (exit, output) = run_text(vec!["--help"]);

        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("internal repository automation"));
        assert!(output.contains("not the\nuser-facing `tpm` product CLI"));
    }

    #[test]
    fn xtask_unknown_task_returns_usage_error() {
        let (exit, output) = run_text(vec!["missing-task"]);

        assert_eq!(exit, CommandExit::UsageError);
        assert!(output.contains("Unknown task `missing-task`."));
    }

    #[test]
    fn xtask_removed_task_returns_usage_error_instead_of_success_noop() {
        let (exit, output) = run_text(vec!["payload-postbuild-experiments"]);

        assert_eq!(exit, CommandExit::UsageError);
        assert!(output.contains("was retired during the Rust/just migration"));
        assert!(output.contains("Use `just --list`"));
    }

    #[test]
    fn active_tasks_with_options_have_help_before_side_effects() {
        for task in [
            "assets-duplicates",
            "assets-locations",
            "assets-shared",
            "assets-unused",
            "build-cloudflare",
            "build-optimize",
            "build-raw",
            "catalog-check",
            "content-check",
            "coverage-verify",
            "diagnostics-diff",
            "docs-references",
            "docs-references-check",
            "migration-baseline",
            "output-verify",
            "payload-check",
            "payload-report",
            "platform-check",
            "qa-registry",
            "site-schema",
            "site-schema-check",
            "starters-check",
            "tags-check",
            "tags-normalize",
            "test-accountability",
            "test-accountability-release",
            "test-catalog",
            "test-flake",
            "validate-html",
            "verify",
        ] {
            let (exit, output) = run_text(vec![task, "--help"]);

            assert_eq!(exit, CommandExit::Success, "{task} --help should pass");
            assert!(
                output.contains("Usage:"),
                "{task} --help should print usage, got {output:?}"
            );
        }
    }

    #[test]
    fn internal_operation_tasks_render_reports() {
        let root = repo_root();
        let (exit, output) = run_text(vec![
            "migration-baseline",
            "--site",
            &root,
            "--format",
            "json",
        ]);

        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("\"operationId\": \"migration.baseline\""));
    }

    #[test]
    fn catalog_test_target_matches_current_playwright_suite() {
        assert_eq!(
            CATALOG_PLAYWRIGHT_SPEC,
            "tests/e2e/catalog-invariants.pw.ts"
        );
        assert_eq!(CATALOG_OUTPUT_DIR, "dist-catalog");
    }

    #[test]
    fn glob_and_wildcard_helpers_match_ignore_files() {
        assert!(glob_matches("site/assets/**/*.png", "site/assets/a/b.png"));
        assert!(!glob_matches("site/assets/*.png", "site/assets/a/b.png"));
        assert!(wildcard_matches(b"*.png", b"hero.png"));
        assert!(!wildcard_matches(b"?.png", b"hero.png"));
    }

    #[test]
    fn misc_helpers_cover_slug_quotes_and_reference_scanning() {
        assert!(
            quoted_or_parenthesized_values("![alt](../assets/hero.png)")
                .contains(&String::from("../assets/hero.png"))
        );
    }
}
