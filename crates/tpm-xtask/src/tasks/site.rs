use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use serde_json::Value;
use tpm_core::CommandExit;

use crate::cli::args::{NoArgs, OutputDirArgs, QuietArgs, SchemaArgs};

use super::content::{normalize_tags, verify_content};
use super::filesystem::{
    collect_files_with_extensions, extension_is, relative_display, require_dir, require_file,
    sorted_entries,
};
use super::workspace::{Workspace, output_dir_arg};

pub(super) fn content_check<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
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

pub(super) fn tags_check<W>(
    args: &QuietArgs,
    write: bool,
    output: &mut W,
) -> io::Result<CommandExit>
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

pub(super) fn site_schema<W>(
    args: SchemaArgs,
    check: bool,
    output: &mut W,
) -> io::Result<CommandExit>
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

pub(super) fn starters_check<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
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

pub(super) fn verify_generated_output<W>(
    args: &OutputDirArgs,
    output: &mut W,
) -> io::Result<CommandExit>
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

pub(super) fn docs_references<W>(
    args: &QuietArgs,
    check: bool,
    output: &mut W,
) -> io::Result<CommandExit>
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

pub(super) fn catalog_check<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
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

pub(super) fn platform_check<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
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

struct AstroTestStoreSyncReport {
    bytes: u64,
    destination: PathBuf,
    source: PathBuf,
}

enum AstroTestStoreSync {
    MissingSource { source: PathBuf },
    Synced(AstroTestStoreSyncReport),
}

fn astro_test_store_paths(root: &Path) -> (PathBuf, PathBuf) {
    (
        root.join("node_modules/.astro/data-store.json"),
        root.join(".astro/data-store.json"),
    )
}

fn sync_astro_test_store_file(workspace: &Workspace) -> io::Result<AstroTestStoreSync> {
    let (source, destination) = astro_test_store_paths(&workspace.root);
    if !source.is_file() {
        return Ok(AstroTestStoreSync::MissingSource { source });
    }

    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent)?;
    }
    let bytes = fs::copy(&source, &destination)?;

    Ok(AstroTestStoreSync::Synced(AstroTestStoreSyncReport {
        bytes,
        destination,
        source,
    }))
}

pub(super) fn sync_astro_test_store<W>(_args: NoArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    match sync_astro_test_store_file(&workspace)? {
        AstroTestStoreSync::Synced(report) => {
            writeln!(
                output,
                "Synced Astro test content store: {} -> {} ({} bytes).",
                relative_display(&workspace.root, &report.source),
                relative_display(&workspace.root, &report.destination),
                report.bytes
            )?;
            Ok(CommandExit::Success)
        }
        AstroTestStoreSync::MissingSource { source } => {
            writeln!(
                output,
                "Astro production content store is missing at {}. Run `astro sync --force` before syncing the test store.",
                relative_display(&workspace.root, &source)
            )?;
            Ok(CommandExit::Failure)
        }
    }
}

pub(super) fn payload_report<W>(
    args: &OutputDirArgs,
    check: bool,
    output: &mut W,
) -> io::Result<CommandExit>
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
