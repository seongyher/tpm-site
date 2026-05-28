use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use tpm_core::CommandExit;

use crate::cli::args::{DuplicateAssetsArgs, QuietArgs, UnusedAssetsArgs};

use super::filesystem::{
    collect_files_with_extensions, extension_in, fnv64, ignored_dir, ignored_path, is_inside,
    normalize_path_components, path_has_extension, relative_display, sorted_entries,
};
use super::workspace::Workspace;

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

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct AssetReference {
    pub(super) asset: String,
    pub(super) source: String,
}

pub(super) fn collect_asset_references(workspace: &Workspace) -> io::Result<Vec<AssetReference>> {
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

pub(super) fn quoted_or_parenthesized_values(line: &str) -> Vec<String> {
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

pub(super) fn resolve_asset_reference(
    workspace: &Workspace,
    file: &Path,
    value: &str,
) -> Option<String> {
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

pub(super) fn shared_asset_violations(
    references: &[AssetReference],
) -> BTreeMap<String, BTreeSet<String>> {
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

pub(super) fn image_files(root: &Path, dir: &Path, ignores: &[String]) -> io::Result<Vec<String>> {
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

pub(super) fn duplicate_image_groups(
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

pub(super) fn remove_unreferenced_astro_rasters(output_dir: &Path) -> io::Result<usize> {
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

pub(super) fn assets_locations<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let images = image_files(
        &workspace.root,
        &workspace.root,
        &super::filesystem::load_ignore_list(
            &workspace.root,
            "scripts/image-asset-location-ignore.json",
        )?,
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

pub(super) fn assets_duplicates<W>(
    args: &DuplicateAssetsArgs,
    output: &mut W,
) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let scan_roots = [
        workspace.site.join("assets"),
        workspace.site.join("public"),
        workspace.site.join("unused-assets"),
    ];
    let ignores = super::filesystem::load_ignore_list(
        &workspace.root,
        "scripts/duplicate-image-ignore.json",
    )?;
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

pub(super) fn assets_shared<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
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

pub(super) fn assets_unused<W>(args: &UnusedAssetsArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let ignores =
        super::filesystem::load_ignore_list(&workspace.root, "scripts/unused-image-ignore.json")?;
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
