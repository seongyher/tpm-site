use std::fs;
use std::io;
use std::path::{Path, PathBuf};

pub(super) fn collect_files_with_extensions(
    dir: &Path,
    extensions: &[&str],
) -> io::Result<Vec<PathBuf>> {
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

pub(super) fn sorted_entries(dir: &Path) -> io::Result<Vec<fs::DirEntry>> {
    let mut entries = fs::read_dir(dir)?.collect::<Result<Vec<_>, _>>()?;
    entries.sort_by_key(fs::DirEntry::path);
    Ok(entries)
}

pub(super) fn extension_in(path: &Path, extensions: &[&str]) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| {
            extensions
                .iter()
                .any(|item| extension.eq_ignore_ascii_case(item))
        })
}

pub(super) fn extension_is(path: &Path, extension: &str) -> bool {
    path.extension()
        .and_then(|value| value.to_str())
        .is_some_and(|value| value.eq_ignore_ascii_case(extension))
}

pub(super) fn path_has_extension(value: &str, extensions: &[&str]) -> bool {
    Path::new(value)
        .extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| {
            extensions
                .iter()
                .any(|item| extension.eq_ignore_ascii_case(item))
        })
}

pub(super) fn ignored_dir(path: &Path) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .is_some_and(|name| {
            matches!(
                name,
                ".git" | "dist" | "dist-catalog" | "node_modules" | "target"
            )
        })
}

pub(super) fn ignored_path(relative: &str, ignores: &[String]) -> bool {
    relative
        .split('/')
        .any(|segment| segment.starts_with('.') && segment != ".")
        || ignores
            .iter()
            .any(|pattern| glob_matches(pattern, relative))
}

pub(super) fn load_ignore_list(root: &Path, relative_file: &str) -> io::Result<Vec<String>> {
    let path = root.join(relative_file);
    if !path.is_file() {
        return Ok(Vec::new());
    }
    let text = fs::read_to_string(path)?;
    serde_json::from_str(&text).map_err(io::Error::other)
}

pub(super) fn glob_matches(pattern: &str, value: &str) -> bool {
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

pub(super) fn wildcard_matches(pattern: &[u8], value: &[u8]) -> bool {
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

pub(super) fn is_inside(path: &Path, parent: &Path) -> bool {
    let canonical_parent = parent
        .canonicalize()
        .unwrap_or_else(|_| parent.to_path_buf());
    let canonical_path = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
    canonical_path.starts_with(canonical_parent)
}

pub(super) fn normalize_path_components(path: &Path) -> PathBuf {
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

pub(super) fn fnv64(bytes: &[u8]) -> u64 {
    let mut hash = 0xcbf2_9ce4_8422_2325_u64;
    for byte in bytes {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    hash
}

pub(super) fn relative_display(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .map_or(path, |relative| relative)
        .to_string_lossy()
        .replace([std::path::MAIN_SEPARATOR, '\\'], "/")
}

pub(super) fn require_file(root: &Path, path: &Path, issues: &mut Vec<String>) {
    if !path.is_file() {
        issues.push(format!(
            "{}: required file is missing",
            relative_display(root, path)
        ));
    }
}

pub(super) fn require_dir(root: &Path, path: &Path, issues: &mut Vec<String>) {
    if !path.is_dir() {
        issues.push(format!(
            "{}: required directory is missing",
            relative_display(root, path)
        ));
    }
}
