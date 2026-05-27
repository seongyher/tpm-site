//! Image-asset verification operation for parity-protected migration.

use std::collections::BTreeMap;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use tpm_core::Severity;
use tpm_diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticReport};
use tpm_workspace::WorkspaceContext;

use crate::{
    OperationId, OperationInterface, OperationRequest, OperationResult, OperationSummary,
    OperationTiming,
};

const IMAGE_EXTENSIONS: &[&str] = &[
    "avif", "bmp", "gif", "ico", "jpeg", "jpg", "png", "svg", "tif", "tiff", "webp",
];

/// Runs the Rust image-asset verification report.
#[must_use]
pub fn run_image_asset_verification(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    let start = start.into();
    let request = OperationRequest::new(operation_id("media.images"), interface)
        .with_workspace(display_path(&start));

    match WorkspaceContext::discover(&start) {
        Ok(context) => match image_inventory(&context) {
            Ok(inventory) => {
                let diagnostics = image_diagnostics(&context, &inventory);
                let summary = OperationSummary::new("Image asset verification completed")
                    .with_detail(format!("image files scanned: {}", inventory.images.len()))
                    .with_detail(format!(
                        "location violations: {}",
                        inventory.location_violations.len()
                    ))
                    .with_detail(format!(
                        "duplicate groups: {}",
                        inventory.duplicate_groups.len()
                    ))
                    .with_detail(
                        "dual-run parity target: assets:locations, assets:shared, assets:duplicates, assets:unused",
                    );

                OperationResult::new(request, summary, OperationTiming::default(), diagnostics)
            }
            Err(error) => OperationResult::new(
                request,
                OperationSummary::new("Image asset verification failed"),
                OperationTiming::default(),
                DiagnosticReport::from_diagnostics(vec![
                    Diagnostic::new(
                        diagnostic_code("TPM-MEDIA-IMAGE-SCAN"),
                        Severity::Error,
                        format!("Could not scan image assets: {error}."),
                    )
                    .with_location(DiagnosticLocation::source(
                        context.display_path(context.root()),
                    ))
                    .with_remediation("Check filesystem permissions for the active workspace."),
                ]),
            ),
        },
        Err(error) => {
            OperationResult::new(
                request,
                OperationSummary::new("Image asset verification failed")
                    .with_detail(format!("workspace discovery failed: {error}")),
                OperationTiming::default(),
                DiagnosticReport::from_diagnostics(vec![Diagnostic::new(
                diagnostic_code("TPM-MEDIA-WORKSPACE"),
                Severity::Error,
                "Could not discover a workspace for image verification.",
            )
            .with_location(DiagnosticLocation::source(display_path(&start)))
            .with_remediation(
                "Run image verification from a repo with site/config/site.json or pass --site.",
            )]),
            )
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct ImageInventory {
    duplicate_groups: Vec<Vec<String>>,
    images: Vec<String>,
    location_violations: Vec<String>,
}

fn image_inventory(context: &WorkspaceContext) -> io::Result<ImageInventory> {
    let ignored = load_ignore_patterns(context.root(), "scripts/image-asset-location-ignore.json");
    let mut images = Vec::new();
    collect_images(context.root(), context.root(), &ignored, &mut images)?;
    images.sort();

    let assets_root = context.display_path(context.layout().assets());
    let location_violations = images
        .iter()
        .filter(|image| !image_is_under(image, &assets_root))
        .cloned()
        .collect::<Vec<_>>();
    let duplicate_groups = duplicate_groups(context, &load_duplicate_scan_roots(context))?;

    Ok(ImageInventory {
        duplicate_groups,
        images,
        location_violations,
    })
}

fn image_diagnostics(context: &WorkspaceContext, inventory: &ImageInventory) -> DiagnosticReport {
    let mut diagnostics = Vec::new();

    for violation in &inventory.location_violations {
        diagnostics.push(
            Diagnostic::new(
                diagnostic_code("TPM-MEDIA-IMAGE-LOCATION"),
                Severity::Error,
                format!("Image file `{violation}` is outside site/assets."),
            )
            .with_location(DiagnosticLocation::source(violation.clone()))
            .with_remediation(
                "Move source images under site/assets/ or add a narrow ignore entry.",
            ),
        );
    }

    for group in &inventory.duplicate_groups {
        if let Some(first) = group.first() {
            diagnostics.push(
                Diagnostic::new(
                    diagnostic_code("TPM-MEDIA-DUPLICATE-IMAGE"),
                    Severity::Note,
                    format!(
                        "Duplicate image group contains {} files; first file is `{first}`.",
                        group.len()
                    ),
                )
                .with_location(DiagnosticLocation::source(first.clone()))
                .with_remediation(
                    "Review duplicates before promotion; current duplicate script remains review-only source of truth.",
                ),
            );
        }
    }

    diagnostics.push(
        Diagnostic::new(
            diagnostic_code("TPM-MEDIA-DUAL-RUN"),
            Severity::Note,
            "Rust image verification is in dual-run mode; TypeScript asset scripts remain source of truth until promotion.",
        )
        .with_location(DiagnosticLocation::source(context.display_path(context.layout().assets())))
        .with_remediation(
            "Compare Rust image evidence with the current asset scripts before promotion.",
        ),
    );

    DiagnosticReport::from_diagnostics(diagnostics)
}

fn collect_images(
    root: &Path,
    dir: &Path,
    ignored_patterns: &[String],
    images: &mut Vec<String>,
) -> io::Result<()> {
    if ignored_dir_name(dir) {
        return Ok(());
    }

    let mut entries = fs::read_dir(dir)?.collect::<Result<Vec<_>, _>>()?;
    entries.sort_by_key(fs::DirEntry::path);

    for entry in entries {
        let path = entry.path();
        let relative = relative_path(root, &path);
        if ignored_path(&relative, ignored_patterns) {
            continue;
        }

        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            collect_images(root, &path, ignored_patterns, images)?;
        } else if file_type.is_file() && is_image_path(&path) {
            images.push(relative);
        }
    }

    Ok(())
}

fn duplicate_groups(context: &WorkspaceContext, roots: &[PathBuf]) -> io::Result<Vec<Vec<String>>> {
    let ignored = load_ignore_patterns(context.root(), "scripts/duplicate-image-ignore.json");
    let mut by_fingerprint: BTreeMap<(u64, u64), Vec<String>> = BTreeMap::new();

    for root in roots {
        let mut images = Vec::new();
        collect_images(context.root(), root, &ignored, &mut images)?;
        for image in images {
            let path = context.root().join(&image);
            let bytes = fs::read(&path)?;
            let fingerprint = (
                u64::try_from(bytes.len()).unwrap_or(u64::MAX),
                fnv64(&bytes),
            );
            by_fingerprint.entry(fingerprint).or_default().push(image);
        }
    }

    let mut groups = by_fingerprint
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

fn load_duplicate_scan_roots(context: &WorkspaceContext) -> Vec<PathBuf> {
    let candidates = [
        context.layout().assets().to_path_buf(),
        context.layout().public().to_path_buf(),
        context.site().join("unused-assets"),
    ];
    let mut roots = Vec::new();

    for candidate in candidates {
        if candidate.exists() {
            roots.push(candidate);
        }
    }

    roots
}

fn fnv64(bytes: &[u8]) -> u64 {
    let mut hash = 0xcbf2_9ce4_8422_2325_u64;
    for byte in bytes {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    hash
}

fn ignored_dir_name(path: &Path) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .is_some_and(|name| {
            matches!(
                name,
                ".git" | "dist" | "dist-catalog" | "node_modules" | "target"
            )
        })
}

fn ignored_path(relative: &str, patterns: &[String]) -> bool {
    has_dot_segment(relative)
        || patterns
            .iter()
            .any(|pattern| glob_matches(pattern, relative))
}

fn has_dot_segment(relative: &str) -> bool {
    relative
        .split('/')
        .any(|segment| segment.starts_with('.') && segment != ".")
}

fn image_is_under(image: &str, assets_root: &str) -> bool {
    image == assets_root || image.starts_with(&format!("{assets_root}/"))
}

fn is_image_path(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| {
            IMAGE_EXTENSIONS
                .iter()
                .any(|allowed| extension.eq_ignore_ascii_case(allowed))
        })
}

fn load_ignore_patterns(root: &Path, relative_file: &str) -> Vec<String> {
    let path = root.join(relative_file);
    let Ok(contents) = fs::read_to_string(path) else {
        return Vec::new();
    };
    let parsed: Result<Vec<String>, _> = serde_json::from_str(&contents);
    parsed.unwrap_or_default()
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

fn operation_id(value: &'static str) -> OperationId {
    OperationId::parse(value).unwrap_or_else(|error| {
        panic!("media operation ID should be valid: {error}");
    })
}

fn diagnostic_code(value: &'static str) -> DiagnosticCode {
    DiagnosticCode::parse(value).unwrap_or_else(|error| {
        panic!("media diagnostic code should be valid: {error}");
    })
}

fn display_path(path: &Path) -> String {
    if path.as_os_str().is_empty() {
        return String::from(".");
    }

    path.to_string_lossy()
        .replace([std::path::MAIN_SEPARATOR, '\\'], "/")
}

fn relative_path(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .map_or(path, |relative| relative)
        .to_string_lossy()
        .replace([std::path::MAIN_SEPARATOR, '\\'], "/")
}

#[cfg(test)]
mod tests {
    use std::error::Error;
    use std::fs;
    use std::path::{Path, PathBuf};

    use super::run_image_asset_verification;
    use crate::{OperationInterface, OperationStatus};

    fn temp_workspace(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("tpm-media-{name}-{}", std::process::id()))
    }

    fn write_file(path: &Path, contents: &[u8]) -> Result<(), Box<dyn Error>> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, contents)?;
        Ok(())
    }

    #[test]
    fn image_operation_reports_location_violations() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("violation");
        let _ = fs::remove_dir_all(&root);
        write_file(&root.join("site/config/site.json"), b"{}")?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        write_file(&root.join("loose.png"), b"image")?;

        let result = run_image_asset_verification(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-MEDIA-IMAGE-LOCATION")
        );

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn image_operation_reports_duplicate_notes() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("duplicates");
        let _ = fs::remove_dir_all(&root);
        write_file(&root.join("site/config/site.json"), b"{}")?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/public"))?;
        write_file(&root.join("site/assets/a.png"), b"same")?;
        write_file(&root.join("site/assets/b.png"), b"same")?;

        let result = run_image_asset_verification(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Warning);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-MEDIA-DUPLICATE-IMAGE")
        );

        let _ = fs::remove_dir_all(root);
        Ok(())
    }

    #[test]
    fn image_operation_respects_source_ignores_and_generated_dirs() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("ignored");
        let _ = fs::remove_dir_all(&root);
        write_file(&root.join("site/config/site.json"), b"{}")?;
        fs::create_dir_all(root.join("site/content"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        write_file(
            &root.join("scripts/image-asset-location-ignore.json"),
            br#"["examples/starters/**/assets/**"]"#,
        )?;
        write_file(
            &root.join("examples/starters/demo/assets/hero.svg"),
            b"<svg />",
        )?;
        write_file(&root.join("dist/_astro/generated.webp"), b"generated")?;
        write_file(
            &root.join("target/doc/static.files/rust-logo.svg"),
            b"generated",
        )?;

        let result = run_image_asset_verification(&root, OperationInterface::Test);

        assert_ne!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .all(|diagnostic| diagnostic.code().as_str() != "TPM-MEDIA-IMAGE-LOCATION")
        );

        let _ = fs::remove_dir_all(root);
        Ok(())
    }
}
