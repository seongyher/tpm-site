//! Internal repository maintenance task adapters used by `just` recipes.

use std::collections::{BTreeMap, BTreeSet};
use std::env;
use std::ffi::{OsStr, OsString};
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
use crate::cli::args::{
    DiagnosticsDiffArgs, DuplicateAssetsArgs, HtmlDirArgs, NoArgs, OperationArgs, OutputDirArgs,
    QuietArgs, SchemaArgs, TestCatalogArgs, TestFlakeArgs, UnusedAssetsArgs,
};
use crate::cli::commands::XtaskCommand;
use crate::cli::{compatibility::handle_compatibility, error::write_clap_error, parse_command};
use crate::coverage::{format_coverage_inventory_report, verify_coverage_inventory};
use crate::frontmatter::Frontmatter;
use crate::operation_adapter::write_operation_result;
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

fn migration_baseline<W>(args: OperationArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let options = args.into_options();
    let result = run_migration_baseline(options.site, OperationInterface::Ci);
    write_operation_result(&result, options.format, output)
}

fn qa_registry<W>(args: OperationArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let options = args.into_options();
    let result = run_qa_registry(options.site, OperationInterface::Ci);
    write_operation_result(&result, options.format, output)
}

fn diagnostics_diff<W>(args: DiagnosticsDiffArgs, output: &mut W) -> io::Result<CommandExit>
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

fn output_verify<W>(args: OperationArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let options = args.into_options();
    let result = run_generated_output_bridge(options.site, OperationInterface::Ci);
    write_operation_result(&result, options.format, output)
}

fn build_raw<W, R>(
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

fn build_optimize<W>(args: &OutputDirArgs, output: &mut W) -> io::Result<CommandExit>
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

fn build_cloudflare<W>(args: &OutputDirArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let output_dir = output_dir_arg(args.dir.as_deref(), &workspace);
    let redirects = collect_redirects(&workspace)?;
    let text = format_redirects(&redirects);
    fs::create_dir_all(&output_dir)?;
    let output_path = output_dir.join("_redirects");
    fs::write(&output_path, text)?;

    if !args.quiet {
        writeln!(
            output,
            "Wrote {} Cloudflare redirects to {}.",
            redirects.len(),
            output_path.display()
        )?;
    }

    Ok(CommandExit::Success)
}

fn validate_html<W, R>(
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

fn content_check<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let result = verify_content(&workspace)?;
    if result.issues.is_empty() {
        if !args.quiet {
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

fn tags_check<W>(args: &QuietArgs, write: bool, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
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

    if !args.quiet {
        writeln!(
            output,
            "Article tag normalization passed: {} article files scanned.",
            result.scanned_files
        )?;
    }

    Ok(CommandExit::Success)
}

fn site_schema<W>(args: SchemaArgs, check: bool, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let schema_path = args
        .output
        .unwrap_or_else(|| workspace.site.join("config/site.schema.json"));
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

    if !args.quiet {
        let verb = if check { "current" } else { "written" };
        writeln!(
            output,
            "Site config schema is {verb} at {}.",
            relative_display(&workspace.root, &schema_path)
        )?;
    }

    Ok(CommandExit::Success)
}

fn starters_check<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
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
        if !args.quiet {
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

fn assets_locations<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
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
        if !args.quiet {
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

fn assets_duplicates<W>(args: &DuplicateAssetsArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let scan_roots = [
        workspace.site.join("assets"),
        workspace.site.join("public"),
        workspace.site.join("unused-assets"),
    ];
    let ignores = load_ignore_list(&workspace.root, "scripts/duplicate-image-ignore.json")?;
    let groups = duplicate_image_groups(&workspace.root, &scan_roots, &ignores)?;
    if groups.is_empty() {
        if !args.quiet {
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

    if args.fail_on_duplicates {
        Ok(CommandExit::Failure)
    } else {
        Ok(CommandExit::Success)
    }
}

fn assets_shared<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let references = collect_asset_references(&workspace)?;
    let violations = shared_asset_violations(&references);
    if violations.is_empty() {
        if !args.quiet {
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

fn assets_unused<W>(args: &UnusedAssetsArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
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
        if !args.quiet {
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

    if args.fail_on_unused {
        Ok(CommandExit::Failure)
    } else {
        Ok(CommandExit::Success)
    }
}

fn verify_generated_output<W>(args: &OutputDirArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let output_dir = output_dir_arg(args.dir.as_deref(), &workspace);
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
        if !args.quiet {
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

fn docs_references<W>(args: &QuietArgs, check: bool, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
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
    if !args.quiet {
        writeln!(
            output,
            "Generated platform reference is current at {}.",
            relative_display(&workspace.root, &reference)
        )?;
    }
    Ok(CommandExit::Success)
}

fn catalog_check<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
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
    if !args.quiet {
        writeln!(
            output,
            "Component catalog verification passed: {} components, {} docs.",
            components.len(),
            docs.len()
        )?;
    }
    Ok(CommandExit::Success)
}

fn platform_check<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
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
        if !args.quiet {
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

fn sync_astro_test_store<W>(_args: NoArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    writeln!(
        output,
        "Astro content store sync is handled by `astro sync --force`."
    )?;
    Ok(CommandExit::Success)
}

fn test_accountability<W>(
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

fn test_flake<W, R>(
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

fn test_catalog<W, R>(
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

fn coverage_verify<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
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

fn payload_report<W>(args: &OutputDirArgs, check: bool, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let dist = output_dir_arg(args.dir.as_deref(), &workspace);
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

#[derive(Clone, Debug, Eq, PartialEq)]
struct ExternalCommand {
    args: Vec<OsString>,
    envs: Vec<(OsString, OsString)>,
    program: PathBuf,
}

trait ExternalCommandRunner {
    fn run(&mut self, command: ExternalCommand) -> io::Result<CommandExit>;
}

struct SystemCommandRunner;

impl ExternalCommandRunner for SystemCommandRunner {
    fn run(&mut self, command: ExternalCommand) -> io::Result<CommandExit> {
        run_external_owned(&command.program, &command.args, &command.envs)
    }
}

fn external_command<P, A, S>(program: P, args: A, envs: &[(OsString, OsString)]) -> ExternalCommand
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

fn absolutize(root: &Path, path: &Path) -> PathBuf {
    if path.is_absolute() {
        path.to_path_buf()
    } else {
        root.join(path)
    }
}

fn output_dir_arg(path: Option<&Path>, workspace: &Workspace) -> PathBuf {
    path.map_or_else(
        || workspace.output.clone(),
        |value| absolutize(&workspace.root, value),
    )
}

fn run_external<I, S>(
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

fn run_external_owned<S>(
    program: &Path,
    args: &[S],
    envs: &[(OsString, OsString)],
) -> io::Result<CommandExit>
where
    S: AsRef<OsStr>,
{
    run_external(program, args, envs)
}

fn local_binary(root: &Path, binary: &str) -> PathBuf {
    local_binary_for_platform(root, binary, cfg!(windows))
}

fn local_binary_for_platform(root: &Path, binary: &str, windows: bool) -> PathBuf {
    let executable = if windows {
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
    #![expect(
        clippy::expect_used,
        reason = "task tests assert fixture commands, locks, and output contracts"
    )]

    use std::collections::{BTreeMap, BTreeSet, VecDeque};
    use std::error::Error;
    use std::ffi::OsString;
    use std::fs;
    use std::io;
    use std::num::NonZeroUsize;
    use std::path::{Path, PathBuf};
    use std::sync::Mutex;

    use super::{
        AssetReference, CATALOG_OUTPUT_DIR, CATALOG_PLAYWRIGHT_SPEC, ExternalCommand,
        ExternalCommandRunner, Workspace, absolutize, build_raw, collect_asset_references,
        collect_files_with_extensions, collect_redirects, duplicate_image_groups, extension_in,
        extension_is, fnv64, glob_matches, ignored_dir, ignored_path, image_files, is_inside,
        load_ignore_list, local_binary, local_binary_for_platform, normalize_path_components,
        normalize_tags, output_dir_arg, path_has_extension, quoted_or_parenthesized_values,
        relative_display, remove_unreferenced_astro_rasters, require_dir, require_file,
        resolve_asset_reference, run, shared_asset_violations, test_catalog, test_flake,
        validate_html, verify_content, wildcard_matches,
    };
    use crate::cli::args::{HtmlDirArgs, OutputDirArgs, TestCatalogArgs, TestFlakeArgs};
    use tpm_core::CommandExit;

    static PROCESS_STATE_LOCK: Mutex<()> = Mutex::new(());

    fn lock_process_state() -> std::sync::MutexGuard<'static, ()> {
        PROCESS_STATE_LOCK
            .lock()
            .expect("process state lock should not be poisoned")
    }

    fn run_text(args: Vec<&str>) -> (CommandExit, String) {
        let mut output = Vec::new();
        let exit = run(args, &mut output).expect("xtask test should not emit io errors");
        let text = String::from_utf8(output).expect("xtask output should be valid UTF-8");

        (exit, text)
    }

    fn repo_root() -> String {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .to_string_lossy()
            .into_owned()
    }

    fn temp_workspace(name: &str) -> PathBuf {
        let temp = std::env::temp_dir()
            .canonicalize()
            .unwrap_or_else(|_| std::env::temp_dir());
        temp.join(format!("tpm-xtask-{name}-{}", std::process::id()))
    }

    fn write_text(path: &Path, contents: &str) -> Result<(), Box<dyn Error>> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, contents)?;
        Ok(())
    }

    fn write_bytes(path: &Path, contents: &[u8]) -> Result<(), Box<dyn Error>> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, contents)?;
        Ok(())
    }

    #[cfg(unix)]
    fn write_executable(path: &Path, contents: &str) -> Result<(), Box<dyn Error>> {
        use std::os::unix::fs::PermissionsExt;

        write_text(path, contents)?;
        let mut permissions = fs::metadata(path)?.permissions();
        permissions.set_mode(0o755);
        fs::set_permissions(path, permissions)?;
        Ok(())
    }

    #[cfg(not(unix))]
    fn write_executable(path: &Path, contents: &str) -> Result<(), Box<dyn Error>> {
        write_text(path, contents)
    }

    fn workspace(root: &Path) -> Workspace {
        Workspace {
            output: root.join("dist"),
            root: root.to_path_buf(),
            site: root.join("site"),
        }
    }

    struct CurrentDirGuard {
        previous: PathBuf,
    }

    impl CurrentDirGuard {
        fn enter(path: &Path) -> Result<Self, Box<dyn Error>> {
            let previous = std::env::current_dir()?;
            std::env::set_current_dir(path)?;
            Ok(Self { previous })
        }
    }

    impl Drop for CurrentDirGuard {
        fn drop(&mut self) {
            let _ = std::env::set_current_dir(&self.previous);
        }
    }

    #[derive(Default)]
    struct RecordingExternalRunner {
        commands: Vec<ExternalCommand>,
        exits: VecDeque<CommandExit>,
    }

    impl RecordingExternalRunner {
        fn with_exits(exits: impl IntoIterator<Item = CommandExit>) -> Self {
            Self {
                commands: Vec::new(),
                exits: exits.into_iter().collect(),
            }
        }
    }

    impl ExternalCommandRunner for RecordingExternalRunner {
        fn run(&mut self, command: ExternalCommand) -> io::Result<CommandExit> {
            self.commands.push(command);
            Ok(self.exits.pop_front().unwrap_or(CommandExit::Success))
        }
    }

    fn os_args(args: &[OsString]) -> Vec<String> {
        args.iter()
            .map(|arg| arg.to_string_lossy().into_owned())
            .collect()
    }

    fn os_envs(envs: &[(OsString, OsString)]) -> BTreeMap<String, String> {
        envs.iter()
            .map(|(key, value)| {
                (
                    key.to_string_lossy().into_owned(),
                    value.to_string_lossy().into_owned(),
                )
            })
            .collect()
    }

    #[test]
    fn xtask_help_is_explicitly_internal() {
        let (exit, output) = run_text(vec!["--help"]);

        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("Internal repository automation"));
        assert!(output.contains("not the\nuser-facing `tpm` product CLI"));
    }

    #[test]
    fn xtask_unknown_task_returns_usage_error() {
        let (exit, output) = run_text(vec!["missing-task"]);

        assert_eq!(exit, CommandExit::UsageError);
        assert!(output.contains("unrecognized subcommand 'missing-task'"));
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
    fn build_raw_plans_astro_and_pagefind_without_spawning_tools() -> Result<(), Box<dyn Error>> {
        let _lock = lock_process_state();
        let root = temp_workspace("build-raw-plan");
        let _ = fs::remove_dir_all(&root);
        write_text(
            &root.join("site/config/site.json"),
            r#"{"features":{"search":true,"tags":true}}"#,
        )?;
        let _cwd = CurrentDirGuard::enter(&root)?;
        let mut output = Vec::new();
        let mut runner = RecordingExternalRunner::default();

        let exit = build_raw(
            &OutputDirArgs {
                dir: Some(PathBuf::from("custom-dist")),
                quiet: true,
            },
            &mut output,
            &mut runner,
        )?;

        assert_eq!(exit, CommandExit::Success);
        assert_eq!(runner.commands.len(), 2);
        assert_eq!(runner.commands[0].program, local_binary(&root, "astro"));
        assert_eq!(os_args(&runner.commands[0].args), vec!["build", "--force"]);
        assert_eq!(
            os_envs(&runner.commands[0].envs).get("SITE_OUTPUT_DIR"),
            Some(&String::from("custom-dist"))
        );
        assert_eq!(runner.commands[1].program, local_binary(&root, "pagefind"));
        let pagefind_args = os_args(&runner.commands[1].args);
        assert_eq!(pagefind_args[0], "--site");
        assert_eq!(pagefind_args[1], root.join("custom-dist").to_string_lossy());
        assert!(pagefind_args.contains(&String::from("--quiet")));
        assert!(
            pagefind_args
                .iter()
                .any(|arg| arg.contains("articles/**/*.html") && arg.contains("tags/**/*.html")),
            "pagefind args: {pagefind_args:?}"
        );

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn build_raw_skips_pagefind_when_astro_build_fails() -> Result<(), Box<dyn Error>> {
        let _lock = lock_process_state();
        let root = temp_workspace("build-raw-build-fails");
        let _ = fs::remove_dir_all(&root);
        write_text(
            &root.join("site/config/site.json"),
            r#"{"features":{"search":true}}"#,
        )?;
        let _cwd = CurrentDirGuard::enter(&root)?;
        let mut output = Vec::new();
        let mut runner = RecordingExternalRunner::with_exits([CommandExit::Failure]);

        let exit = build_raw(
            &OutputDirArgs {
                dir: None,
                quiet: false,
            },
            &mut output,
            &mut runner,
        )?;

        assert_eq!(exit, CommandExit::Failure);
        assert_eq!(runner.commands.len(), 1);

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn validate_html_plans_targets_and_reports_external_failures() -> Result<(), Box<dyn Error>> {
        let _lock = lock_process_state();
        let root = temp_workspace("validate-html-plan");
        let _ = fs::remove_dir_all(&root);
        write_text(
            &root.join("site/config/site.json"),
            r#"{"features":{"search":true},"routes":{"articles":"/writing/","search":"/find/"}}"#,
        )?;
        let _cwd = CurrentDirGuard::enter(&root)?;
        let mut output = Vec::new();
        let mut runner = RecordingExternalRunner::with_exits([CommandExit::Failure]);

        let exit = validate_html(
            &HtmlDirArgs {
                dir: Some(PathBuf::from("public")),
            },
            &mut output,
            &mut runner,
        )?;

        assert_eq!(exit, CommandExit::Failure);
        assert_eq!(runner.commands.len(), 1);
        assert_eq!(
            runner.commands[0].program,
            local_binary(&root, "html-validate")
        );
        let args = os_args(&runner.commands[0].args);
        assert_eq!(args[0], "--max-warnings=0");
        assert!(
            args.iter()
                .any(|arg| arg.ends_with("public/writing/index.html")),
            "html-validate args: {args:?}"
        );
        assert!(
            args.iter()
                .any(|arg| arg.ends_with("public/find/**/*.html")),
            "html-validate args: {args:?}"
        );
        assert_eq!(
            String::from_utf8(output)?,
            String::from("HTML validation failed.\n")
        );

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn test_catalog_plans_build_then_playwright_and_reports_failures() -> Result<(), Box<dyn Error>>
    {
        let _lock = lock_process_state();
        let root = temp_workspace("catalog-plan");
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(&root)?;
        let _cwd = CurrentDirGuard::enter(&root)?;
        let mut output = Vec::new();
        let mut runner =
            RecordingExternalRunner::with_exits([CommandExit::Success, CommandExit::Failure]);

        let exit = test_catalog(
            TestCatalogArgs {
                extra_args: vec![OsString::from("--project=chromium")],
            },
            &mut output,
            &mut runner,
        )?;

        assert_eq!(exit, CommandExit::Failure);
        assert_eq!(runner.commands.len(), 2);
        assert_eq!(runner.commands[0].program, PathBuf::from("just"));
        assert_eq!(os_args(&runner.commands[0].args), vec!["catalog-build"]);
        assert_eq!(
            os_envs(&runner.commands[0].envs).get("PWD"),
            Some(&root.to_string_lossy().into_owned())
        );
        assert_eq!(
            runner.commands[1].program,
            local_binary(&root, "playwright")
        );
        assert_eq!(
            os_args(&runner.commands[1].args),
            vec![
                String::from("test"),
                String::from(CATALOG_PLAYWRIGHT_SPEC),
                String::from("--project=chromium"),
            ]
        );
        let playwright_env = os_envs(&runner.commands[1].envs);
        assert_eq!(
            playwright_env.get("PLATFORM_COMPONENT_CATALOG"),
            Some(&String::from("true"))
        );
        assert_eq!(
            playwright_env.get("SITE_OUTPUT_DIR"),
            Some(&String::from(CATALOG_OUTPUT_DIR))
        );
        assert_eq!(String::from_utf8(output)?, "Catalog tests failed.\n");

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn test_catalog_stops_when_catalog_build_fails() -> Result<(), Box<dyn Error>> {
        let _lock = lock_process_state();
        let root = temp_workspace("catalog-build-fails");
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(&root)?;
        let _cwd = CurrentDirGuard::enter(&root)?;
        let mut output = Vec::new();
        let mut runner = RecordingExternalRunner::with_exits([CommandExit::Failure]);

        let exit = test_catalog(
            TestCatalogArgs {
                extra_args: Vec::new(),
            },
            &mut output,
            &mut runner,
        )?;

        assert_eq!(exit, CommandExit::Failure);
        assert_eq!(runner.commands.len(), 1);
        assert!(output.is_empty());

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn test_flake_plans_randomized_bun_test_pass() -> Result<(), Box<dyn Error>> {
        let _lock = lock_process_state();
        let root = temp_workspace("flake-plan");
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(&root)?;
        let _cwd = CurrentDirGuard::enter(&root)?;
        let mut output = Vec::new();
        let mut runner = RecordingExternalRunner::default();

        let exit = test_flake(
            &TestFlakeArgs {
                runs: NonZeroUsize::new(5).unwrap_or(NonZeroUsize::MIN),
                seed: String::from("seed-1"),
            },
            &mut output,
            &mut runner,
        )?;

        assert_eq!(exit, CommandExit::Success);
        assert_eq!(
            String::from_utf8(output)?,
            "Running randomized Bun test pass (5 runs, seed seed-1).\n"
        );
        assert_eq!(runner.commands.len(), 1);
        assert_eq!(runner.commands[0].program, PathBuf::from("bun"));
        let args = os_args(&runner.commands[0].args);
        assert!(args.contains(&String::from("test")));
        assert!(args.contains(&String::from("--randomize")));
        assert!(args.contains(&String::from("tests/components")));
        assert_eq!(
            os_envs(&runner.commands[0].envs).get("PWD"),
            Some(&root.to_string_lossy().into_owned())
        );

        let _ = fs::remove_dir_all(root);
        Ok(())
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

    #[test]
    fn workspace_path_and_filesystem_helpers_cover_policy_edges() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("workspace-helpers");
        let _ = fs::remove_dir_all(&root);
        let ws = workspace(&root);
        write_text(&root.join("src/b.md"), "b")?;
        write_text(&root.join("src/a.TS"), "a")?;
        write_text(&root.join("src/nested/c.txt"), "c")?;
        write_text(&root.join("src/target/ignored.ts"), "ignored")?;
        write_text(
            &root.join("scripts/ignore.json"),
            r#"["src/nested/**", "src/*.tmp"]"#,
        )?;

        assert_eq!(absolutize(&root, Path::new("site")), root.join("site"));
        assert_eq!(absolutize(&root, &root.join("site")), root.join("site"));
        assert_eq!(output_dir_arg(None, &ws), root.join("dist"));
        assert_eq!(
            output_dir_arg(Some(Path::new("custom-dist")), &ws),
            root.join("custom-dist")
        );
        assert!(
            local_binary(&root, "astro")
                .to_string_lossy()
                .contains("node_modules/.bin/astro")
        );
        assert_eq!(
            local_binary_for_platform(&root, "astro", false),
            root.join("node_modules/.bin/astro")
        );
        assert_eq!(
            local_binary_for_platform(&root, "astro", true),
            root.join("node_modules/.bin/astro.cmd")
        );
        assert_eq!(relative_display(&root, &root.join("src/a.TS")), "src/a.TS");

        let files = collect_files_with_extensions(&root.join("src"), &["ts", "md"])?;
        let display = files
            .iter()
            .map(|file| relative_display(&root, file))
            .collect::<Vec<_>>();
        assert_eq!(
            display,
            vec![String::from("src/a.TS"), String::from("src/b.md")]
        );
        assert!(collect_files_with_extensions(&root.join("missing"), &["ts"])?.is_empty());
        assert!(extension_in(Path::new("photo.JPG"), &["jpg"]));
        assert!(extension_is(Path::new("index.HTML"), "html"));
        assert!(path_has_extension("site/assets/hero.WebP", &["webp"]));
        assert!(ignored_dir(Path::new("node_modules")));
        assert!(ignored_path("src/.secret/file.txt", &[]));
        assert!(ignored_path(
            "src/nested/c.txt",
            &[String::from("src/nested/**")]
        ));
        assert_eq!(
            load_ignore_list(&root, "scripts/ignore.json")?,
            vec![String::from("src/nested/**"), String::from("src/*.tmp")]
        );
        assert!(load_ignore_list(&root, "scripts/missing.json")?.is_empty());

        let mut issues = Vec::new();
        require_file(&root, &root.join("missing.txt"), &mut issues);
        require_dir(&root, &root.join("missing-dir"), &mut issues);
        assert_eq!(issues.len(), 2);

        assert!(is_inside(
            &root.join("site/assets/hero.png"),
            &root.join("site")
        ));
        assert_eq!(
            normalize_path_components(Path::new("/root/site/../site/assets/./hero.png")),
            PathBuf::from("/root/site/assets/hero.png")
        );
        assert_eq!(fnv64(b"same"), fnv64(b"same"));
        assert_ne!(fnv64(b"same"), fnv64(b"different"));

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn redirect_collection_merges_configured_and_legacy_rules() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("redirects");
        let _ = fs::remove_dir_all(&root);
        let ws = workspace(&root);
        write_text(
            &root.join("site/config/redirects.json"),
            r#"{"/memeculture": "/categories/culture/"}"#,
        )?;
        write_text(
            &root.join("site/content/articles/culture/essay.md"),
            "---\nlegacyPermalink: /2015/11/03/essay\n---\nBody",
        )?;
        write_text(
            &root.join("site/content/announcements/update.mdx"),
            "---\nlegacyPermalink: /updates/old\n---\nBody",
        )?;

        let rules = collect_redirects(&ws)?;
        let by_source = rules
            .into_iter()
            .map(|rule| (rule.source, rule.destination))
            .collect::<BTreeMap<_, _>>();

        assert_eq!(
            by_source.get("/memeculture/"),
            Some(&String::from("/categories/culture/"))
        );
        assert_eq!(
            by_source.get("/2015/11/03/essay/"),
            Some(&String::from("/articles/essay/"))
        );
        assert_eq!(
            by_source.get("/updates/old/"),
            Some(&String::from("/announcements/update/"))
        );

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn content_verification_reports_author_tag_path_and_media_issues() -> Result<(), Box<dyn Error>>
    {
        let root = temp_workspace("content");
        let _ = fs::remove_dir_all(&root);
        let ws = workspace(&root);
        write_text(
            &root.join("site/content/authors/seong.md"),
            "---\ndisplayName: Seong Young Her\naliases:\n  - Seong\n---\n",
        )?;
        write_text(
            &root.join("site/content/authors/missing-name.md"),
            "---\n---\n",
        )?;
        write_text(&root.join("site/content/categories/culture.json"), "{}")?;
        write_text(
            &root.join("site/content/categories/Bad Category.json"),
            "{}",
        )?;
        write_text(
            &root.join("site/content/articles/culture/essay.md"),
            "---\nauthor: Seong\ndraft: true\ntags:\n  - meme culture\n---\nBody",
        )?;
        write_text(
            &root.join("site/content/articles/history/essay.md"),
            "---\nauthor: Missing Person\ntags:\n  - Meme Culture\n  - meme/culture\n---\n![alt](image.png) trailing",
        )?;
        write_text(
            &root.join("site/content/articles/Bad Category/Bad Slug!.md"),
            "---\ntags:\n  - meme culture\n---\nBody",
        )?;

        let result = verify_content(&ws)?;
        let issues = result.issues.join("\n");

        assert_eq!(result.draft_count, 1);
        assert_eq!(result.published_count, 2);
        assert!(issues.contains("author metadata needs a displayName"));
        assert!(issues.contains("category metadata filename stem is not URL-safe"));
        assert!(issues.contains("duplicate article slug"));
        assert!(issues.contains("article author `Missing Person` does not match"));
        assert!(issues.contains("article needs an author"));
        assert!(issues.contains("tag must be canonical"));
        assert!(issues.contains("tag must not contain"));
        assert!(issues.contains("Markdown image paragraph has trailing content"));
        assert!(issues.contains("filename stem is not URL-safe"));
        assert!(issues.contains("category folder is not URL-safe"));

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn tag_normalization_handles_dry_run_write_and_invalid_tags() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("tags");
        let _ = fs::remove_dir_all(&root);
        let ws = workspace(&root);
        let article = root.join("site/content/articles/culture/essay.md");
        write_text(
            &article,
            "---\ntitle: Example\ntags:\n  - Meme Culture\n  - meme culture\nsummary: Kept\n---\nBody",
        )?;

        let dry_run = normalize_tags(&ws, false)?;
        assert_eq!(dry_run.scanned_files, 1);
        assert_eq!(
            dry_run.changed_files,
            vec![String::from("site/content/articles/culture/essay.md")]
        );
        assert!(dry_run.issues.is_empty());
        assert!(fs::read_to_string(&article)?.contains("- Meme Culture"));

        let written = normalize_tags(&ws, true)?;
        assert_eq!(written.changed_files.len(), 1);
        let text = fs::read_to_string(&article)?;
        assert!(text.contains("tags:\n  - \"meme culture\"\nsummary: Kept"));

        write_text(&article, "---\ntags:\n  - meme/culture\n---\nBody")?;
        let invalid = normalize_tags(&ws, true)?;
        assert_eq!(invalid.issues.len(), 1);
        assert!(invalid.issues[0].contains("tag must not contain"));

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn asset_reference_helpers_resolve_shared_unused_and_ignored_images()
    -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("assets");
        let _ = fs::remove_dir_all(&root);
        let ws = workspace(&root);
        write_bytes(&root.join("site/assets/hero.png"), b"hero")?;
        write_bytes(&root.join("site/assets/shared/logo.png"), b"logo")?;
        write_bytes(&root.join("site/assets/ignored.png"), b"ignored")?;
        write_text(
            &root.join("src/components/Hero.astro"),
            r#"const hero = "/site/assets/hero.png";
const logo = "@site/assets/shared/logo.png";"#,
        )?;
        write_text(
            &root.join("site/content/articles/culture/essay.md"),
            r"![Hero](../../../assets/hero.png)",
        )?;
        write_text(
            &root.join("scripts/unused-image-ignore.json"),
            r#"["site/assets/ignored.png"]"#,
        )?;

        let references = collect_asset_references(&ws)?;
        assert!(
            references.iter().any(|reference| {
                reference.asset == "site/assets/hero.png"
                    && reference.source == "site/content/articles/culture/essay.md"
            }),
            "references: {references:?}"
        );
        assert!(
            references.iter().any(|reference| {
                reference.asset == "site/assets/shared/logo.png"
                    && reference.source == "src/components/Hero.astro"
            }),
            "references: {references:?}"
        );
        assert_eq!(
            resolve_asset_reference(
                &ws,
                &root.join("src/components/Hero.astro"),
                "https://example.com/remote.png"
            ),
            None
        );
        assert_eq!(
            resolve_asset_reference(
                &ws,
                &root.join("src/components/Hero.astro"),
                "${dynamic}.png"
            ),
            None
        );
        assert_eq!(
            shared_asset_violations(&[
                AssetReference {
                    asset: String::from("site/assets/hero.png"),
                    source: String::from("a.md"),
                },
                AssetReference {
                    asset: String::from("site/assets/hero.png"),
                    source: String::from("b.md"),
                },
                AssetReference {
                    asset: String::from("site/assets/shared/logo.png"),
                    source: String::from("a.md"),
                },
                AssetReference {
                    asset: String::from("site/assets/shared/logo.png"),
                    source: String::from("b.md"),
                },
            ])
            .keys()
            .cloned()
            .collect::<BTreeSet<_>>(),
            BTreeSet::from([String::from("site/assets/hero.png")])
        );

        let ignored = load_ignore_list(&root, "scripts/unused-image-ignore.json")?;
        assert_eq!(
            image_files(&root, &root.join("site/assets"), &ignored)?,
            vec![
                String::from("site/assets/hero.png"),
                String::from("site/assets/shared/logo.png")
            ]
        );

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn image_duplicate_and_optimizer_helpers_cover_review_paths() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("images");
        let _ = fs::remove_dir_all(&root);
        write_bytes(&root.join("site/assets/a.png"), b"same")?;
        write_bytes(&root.join("site/assets/b.png"), b"same")?;
        write_bytes(&root.join("site/assets/c.png"), b"different")?;
        write_bytes(&root.join("site/unused-assets/parked.png"), b"same")?;
        write_text(
            &root.join("scripts/duplicate-image-ignore.json"),
            r#"["site/unused-assets/**"]"#,
        )?;

        let groups = duplicate_image_groups(
            &root,
            &[root.join("site/assets"), root.join("site/unused-assets")],
            &load_ignore_list(&root, "scripts/duplicate-image-ignore.json")?,
        )?;
        assert_eq!(
            groups,
            vec![vec![
                String::from("site/assets/a.png"),
                String::from("site/assets/b.png")
            ]]
        );

        write_bytes(&root.join("dist/_astro/used.png"), b"used")?;
        write_bytes(&root.join("dist/_astro/unused.png"), b"unused")?;
        write_bytes(&root.join("dist/_astro/vector.svg"), b"<svg />")?;
        write_text(
            &root.join("dist/index.html"),
            "<img src=\"/_astro/used.png\">",
        )?;
        write_text(&root.join("dist/_astro/app.js"), "console.log('used.png');")?;
        let removed = remove_unreferenced_astro_rasters(&root.join("dist"))?;
        assert_eq!(removed, 1);
        assert!(root.join("dist/_astro/used.png").is_file());
        assert!(!root.join("dist/_astro/unused.png").is_file());
        assert!(root.join("dist/_astro/vector.svg").is_file());

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    #[expect(
        clippy::too_many_lines,
        reason = "broad repository command fixture covers the remaining process-planning paths until this legacy module is split further"
    )]
    fn repository_task_commands_cover_local_success_and_review_paths() -> Result<(), Box<dyn Error>>
    {
        let _lock = PROCESS_STATE_LOCK
            .lock()
            .expect("process state lock should not be poisoned");
        let root = temp_workspace("commands");
        let _ = fs::remove_dir_all(&root);

        write_text(
            &root.join("site/config/site.json"),
            r#"{"features":{"search":false}}"#,
        )?;
        write_text(
            &root.join("site/config/site.schema.json"),
            r#"{"title":"Site Config","properties":{}}"#,
        )?;
        write_text(
            &root.join("site/config/redirects.json"),
            r#"{"/old-category": "/categories/new-category/"}"#,
        )?;
        write_text(
            &root.join("site/content/authors/seong.md"),
            "---\ndisplayName: Seong Young Her\naliases:\n  - Seong\n---\n",
        )?;
        write_text(&root.join("site/content/categories/culture.json"), "{}")?;
        write_text(
            &root.join("site/content/articles/culture/essay.md"),
            "---\nauthor: Seong\ntags:\n  - meme culture\nlegacyPermalink: /2015/essay\n---\n![Hero](../../../assets/hero.png)",
        )?;
        write_bytes(&root.join("site/assets/hero.png"), b"hero")?;
        write_bytes(&root.join("site/assets/duplicate-a.png"), b"same")?;
        write_bytes(&root.join("site/assets/duplicate-b.png"), b"same")?;
        write_text(
            &root.join("src/components/Hero.astro"),
            r#"const hero = "/site/assets/hero.png";"#,
        )?;
        write_text(
            &root.join("src/platform/index.ts"),
            "export const ok = true;\n",
        )?;
        write_text(
            &root.join("docs/generated/platform-reference.md"),
            "# Platform\n",
        )?;
        write_text(&root.join("docs/components/button.md"), "# Button\n")?;
        write_text(
            &root.join("src/components/Button.astro"),
            "<button><slot /></button>",
        )?;
        write_text(&root.join("package.json"), r#"{"scripts":{}}"#)?;
        write_text(&root.join("astro.config.ts"), "export default {};\n")?;
        fs::create_dir_all(root.join("eslint"))?;
        write_text(&root.join("eslint.config.ts"), "export default [];\n")?;
        write_text(&root.join("knip.ts"), "export default {};\n")?;
        write_text(&root.join("playwright.config.ts"), "export default {};\n")?;
        write_text(&root.join("prettier.config.mjs"), "export default {};\n")?;
        fs::create_dir_all(root.join("types"))?;
        write_text(&root.join("scripts/coverage-exceptions.json"), "[]")?;
        write_text(
            &root.join("coverage/lcov.info"),
            [
                "SF:astro.config.ts",
                "SF:eslint.config.ts",
                "SF:knip.ts",
                "SF:playwright.config.ts",
                "SF:prettier.config.mjs",
                "SF:src/components/Button.astro",
                "SF:src/components/Hero.astro",
                "SF:src/platform/index.ts",
                "",
            ]
            .join("\n")
            .as_str(),
        )?;
        write_text(&root.join("examples/starters/basic/config/site.json"), "{}")?;
        fs::create_dir_all(root.join("examples/starters/basic/content"))?;
        fs::create_dir_all(root.join("examples/starters/basic/assets"))?;
        fs::create_dir_all(root.join("examples/starters/basic/public"))?;
        write_text(
            &root.join("dist/index.html"),
            "<!doctype html><title>Home</title>",
        )?;
        write_text(
            &root.join("dist/404.html"),
            "<!doctype html><title>Missing</title>",
        )?;
        write_text(&root.join("dist/articles/index.html"), "<!doctype html>")?;
        write_text(&root.join("dist/sitemap-index.xml"), "<sitemapindex />")?;
        write_text(&root.join("dist/feed.xml"), "<rss />")?;
        write_text(&root.join("dist/_redirects"), "/old /new 301\n")?;
        write_bytes(&root.join("dist/_astro/unused.png"), b"unused")?;
        let snapshot =
            r#"[{"tool":"tool","code":"A","severity":"warning","message":"same","count":2}]"#;
        write_text(&root.join("expected-diagnostics.json"), snapshot)?;
        write_text(&root.join("actual-diagnostics.json"), snapshot)?;
        write_text(&root.join("node_modules/.bin/astro"), "#!/bin/sh\nexit 0\n")?;
        write_executable(&root.join("node_modules/.bin/astro"), "#!/bin/sh\nexit 0\n")?;
        write_executable(
            &root.join("node_modules/.bin/pagefind"),
            "#!/bin/sh\nexit 0\n",
        )?;
        write_executable(
            &root.join("node_modules/.bin/html-validate"),
            "#!/bin/sh\nexit 0\n",
        )?;

        let _cwd = CurrentDirGuard::enter(&root)?;
        for (command, expected) in [
            (
                vec!["migration-baseline", "--format", "json"],
                CommandExit::Success,
            ),
            (
                vec!["qa-registry", "--format", "json"],
                CommandExit::Success,
            ),
            (
                vec!["output-verify", "--format", "json"],
                CommandExit::Success,
            ),
            (
                vec![
                    "diagnostics-diff",
                    "expected-diagnostics.json",
                    "actual-diagnostics.json",
                    "--format",
                    "json",
                ],
                CommandExit::Success,
            ),
            (vec!["content-check"], CommandExit::Success),
            (vec!["tags-check"], CommandExit::Success),
            (vec!["tags-normalize"], CommandExit::Success),
            (vec!["site-schema-check"], CommandExit::Success),
            (vec!["site-schema"], CommandExit::Success),
            (vec!["starters-check"], CommandExit::Success),
            (vec!["assets-locations"], CommandExit::Success),
            (vec!["assets-shared"], CommandExit::Failure),
            (vec!["assets-duplicates"], CommandExit::Success),
            (
                vec!["assets-duplicates", "--fail-on-duplicates"],
                CommandExit::Failure,
            ),
            (vec!["assets-unused"], CommandExit::Success),
            (
                vec!["assets-unused", "--fail-on-unused"],
                CommandExit::Failure,
            ),
            (vec!["verify", "--dir", "dist"], CommandExit::Success),
            (vec!["docs-references-check"], CommandExit::Success),
            (vec!["docs-references"], CommandExit::Success),
            (vec!["catalog-check"], CommandExit::Success),
            (vec!["platform-check"], CommandExit::Success),
            (vec!["sync-astro-test-store"], CommandExit::Success),
            (vec!["coverage-verify"], CommandExit::Success),
            (
                vec!["payload-report", "--dir", "dist"],
                CommandExit::Success,
            ),
            (vec!["payload-check", "--dir", "dist"], CommandExit::Success),
            (
                vec!["build-cloudflare", "--dir", "dist"],
                CommandExit::Success,
            ),
            (
                vec!["build-optimize", "--dir", "dist"],
                CommandExit::Success,
            ),
            (vec!["build-raw", "--dir", "dist"], CommandExit::Success),
            (vec!["validate-html", "--dir", "dist"], CommandExit::Success),
        ] {
            let (exit, output) = run_text(command.clone());
            assert_eq!(exit, expected, "{command:?} output: {output}");
        }

        write_text(
            &root.join("site/config/site.json"),
            r#"{"features":{"search":true}}"#,
        )?;
        let (exit, _output) = run_text(vec!["build-raw", "--dir", "dist", "--quiet"]);
        assert_eq!(exit, CommandExit::Success);

        write_text(
            &root.join("site/content/articles/culture/essay.md"),
            "---\nauthor: Seong\ntags:\n  - Meme Culture\nlegacyPermalink: /2015/essay\n---\n![Hero](../../../assets/hero.png)",
        )?;
        let (exit, output) = run_text(vec!["tags-check"]);
        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("Would update 1 article tag blocks"));
        let (exit, output) = run_text(vec!["tags-normalize"]);
        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("Updated 1 article tag blocks"));

        write_text(
            &root.join("src/components/Hero.astro"),
            "export const noAsset = true;\n",
        )?;
        let (exit, output) = run_text(vec!["assets-shared"]);
        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("No shared site assets found"));

        write_text(
            &root.join("scripts/duplicate-image-ignore.json"),
            r#"["site/assets/duplicate-*.png"]"#,
        )?;
        let (exit, output) = run_text(vec!["assets-duplicates"]);
        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("No duplicate images found"));

        write_text(
            &root.join("scripts/unused-image-ignore.json"),
            r#"["site/assets/duplicate-*.png"]"#,
        )?;
        let (exit, output) = run_text(vec!["assets-unused"]);
        assert_eq!(exit, CommandExit::Success);
        assert!(output.contains("No unused site images found"));

        write_bytes(&root.join("loose.png"), b"loose")?;
        let (exit, output) = run_text(vec!["assets-locations"]);
        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("outside site/assets"));

        write_text(
            &root.join("dist/index.html"),
            r#"<a href="http://thephilosophersmeme.com/legacy/">legacy</a>"#,
        )?;
        let (exit, output) = run_text(vec!["verify", "--dir", "dist"]);
        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("generated HTML is missing a doctype"));
        assert!(output.contains("insecure same-site URL"));

        let (exit, output) = run_text(vec!["verify", "--dir", "missing"]);
        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("required file is missing"));

        write_text(
            &root.join("site/config/site.schema.json"),
            r#"{"title":"Wrong","properties":{}}"#,
        )?;
        let (exit, output) = run_text(vec!["site-schema-check"]);
        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("Site config schema is invalid"));

        write_text(
            &root.join("site/content/articles/culture/essay.md"),
            "---\nauthor: Missing\ntags:\n  - Meme/Culture\n---\nBody",
        )?;
        let (exit, output) = run_text(vec!["content-check"]);
        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("Content verification failed"));

        let (exit, output) = run_text(vec!["tags-check"]);
        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("Article tag normalization failed"));

        write_text(
            &root.join("src/platform/bad.ts"),
            "export { Button } from \"../components/Button.astro\";\n",
        )?;
        let (exit, output) = run_text(vec!["platform-check"]);
        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("Platform boundary verification failed"));

        let (exit, output) = run_text(vec!["coverage-verify"]);
        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("unapproved coverage gap"));

        fs::remove_file(root.join("docs/generated/platform-reference.md"))?;
        let (exit, output) = run_text(vec!["docs-references-check"]);
        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("Generated platform reference is missing"));

        let (exit, output) = run_text(vec!["build-optimize", "--dir", "missing"]);
        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("Build output directory does not exist"));

        let (exit, output) = run_text(vec!["payload-check", "--dir", "missing"]);
        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("Build output directory not found"));

        write_executable(&root.join("node_modules/.bin/astro"), "#!/bin/sh\nexit 1\n")?;
        let (exit, _output) = run_text(vec!["build-raw", "--dir", "dist"]);
        assert_eq!(exit, CommandExit::Failure);

        write_executable(
            &root.join("node_modules/.bin/html-validate"),
            "#!/bin/sh\nexit 1\n",
        )?;
        let (exit, output) = run_text(vec!["validate-html", "--dir", "dist"]);
        assert_eq!(exit, CommandExit::Failure);
        assert!(output.contains("HTML validation failed"));

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn repository_accountability_tasks_cover_quiet_success_paths() -> Result<(), Box<dyn Error>> {
        let _lock = PROCESS_STATE_LOCK
            .lock()
            .expect("process state lock should not be poisoned");
        let root = PathBuf::from(repo_root());
        let _cwd = CurrentDirGuard::enter(&root)?;

        for command in [
            vec!["test-accountability", "--quiet"],
            vec!["test-accountability-release", "--quiet"],
        ] {
            let (exit, output) = run_text(command.clone());

            assert_eq!(exit, CommandExit::Success, "{command:?} output: {output}");
            assert!(output.is_empty());
        }

        Ok(())
    }
}
