#![expect(
    clippy::redundant_pub_crate,
    reason = "xtask keeps sibling modules internal while sharing focused implementation seams"
)]

use std::collections::BTreeSet;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use serde_json::Value;

use crate::accountability::{expected_mirror_tests, rule_matches};

const DEFAULT_COVERAGE_FILE: &str = "coverage/lcov.info";
const DEFAULT_EXCEPTION_FILE: &str = "scripts/coverage-exceptions.json";
const DEFAULT_ROOTS: &[&str] = &[
    "astro.config.ts",
    "eslint",
    "eslint.config.ts",
    "knip.ts",
    "playwright.config.ts",
    "prettier.config.mjs",
    "scripts",
    "src",
    "types",
];
const IGNORED_PATH_SEGMENTS: &[&str] = &[
    ".astro",
    ".git",
    ".lighthouseci",
    "coverage",
    "dist",
    "dist-catalog",
    "node_modules",
    "playwright-report",
    "test-results",
    "tmp",
];

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct CoverageInventoryResult {
    pub approved_exceptions: Vec<String>,
    pub covered: Vec<String>,
    pub missing: Vec<String>,
    pub subjects: Vec<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct CoverageException {
    pattern: String,
    reason: String,
}

pub(crate) fn format_coverage_inventory_report(result: &CoverageInventoryResult) -> String {
    if result.missing.is_empty() {
        return format!(
            "Coverage inventory passed: {} code-like source files are represented in LCOV or covered by approved exceptions.",
            result.subjects.len()
        );
    }

    [
        format!(
            "Coverage inventory found {} unapproved coverage gap{}.",
            result.missing.len(),
            if result.missing.len() == 1 {
                ""
            } else {
                "s"
            }
        ),
        String::new(),
        String::from(
            "Add meaningful tests, extract testable logic into a covered module, add a mirrored accountability test, or add an explicitly approved exception with rationale to scripts/coverage-exceptions.json.",
        ),
        String::new(),
        result
            .missing
            .iter()
            .map(|file| format!("- {file}"))
            .collect::<Vec<_>>()
            .join("\n"),
    ]
    .join("\n")
}

pub(crate) fn verify_coverage_inventory(root: &Path) -> io::Result<CoverageInventoryResult> {
    verify_coverage_inventory_with_roots(root, DEFAULT_ROOTS)
}

pub(crate) fn verify_coverage_inventory_with_roots(
    root: &Path,
    roots: &[&str],
) -> io::Result<CoverageInventoryResult> {
    let covered_files =
        parse_covered_files(&fs::read_to_string(root.join(DEFAULT_COVERAGE_FILE))?, root);
    let covered_file_set = covered_files.iter().collect::<BTreeSet<_>>();
    let exceptions = load_coverage_exceptions(root)?;
    let mut subject_files = Vec::new();

    for source_root in roots {
        subject_files.extend(list_coverage_subject_files(root, &root.join(source_root))?);
    }

    subject_files.sort();
    subject_files.dedup();

    let approved_exception_files = subject_files
        .iter()
        .filter(|file| matches_approved_exception(file, &exceptions))
        .cloned()
        .collect::<Vec<_>>();
    let approved_exception_set = approved_exception_files.iter().collect::<BTreeSet<_>>();
    let missing_files = subject_files
        .iter()
        .filter(|file| !covered_file_set.contains(file))
        .filter(|file| !approved_exception_set.contains(file))
        .filter(|file| !has_mirrored_accountability_test(root, file))
        .cloned()
        .collect::<Vec<_>>();

    Ok(CoverageInventoryResult {
        approved_exceptions: approved_exception_files,
        covered: covered_files,
        missing: missing_files,
        subjects: subject_files,
    })
}

fn has_mirrored_accountability_test(root: &Path, file: &str) -> bool {
    expected_mirror_tests(file)
        .iter()
        .any(|test_file| root.join(test_file).exists())
}

fn is_coverage_exception(value: &Value) -> bool {
    value
        .get("pattern")
        .and_then(Value::as_str)
        .is_some_and(|pattern| !pattern.trim().is_empty())
        && value
            .get("reason")
            .and_then(Value::as_str)
            .is_some_and(|reason| !reason.trim().is_empty())
}

fn is_coverage_subject_file(relative_path: &str) -> bool {
    extension_is(relative_path, "astro")
        || extension_is(relative_path, "css")
        || extension_is(relative_path, "cjs")
        || extension_is(relative_path, "cts")
        || extension_is(relative_path, "jsx")
        || extension_is(relative_path, "js")
        || extension_is(relative_path, "mjs")
        || extension_is(relative_path, "mts")
        || extension_is(relative_path, "tsx")
        || extension_is(relative_path, "ts")
}

fn is_ignored_path(relative_path: &str) -> bool {
    relative_path
        .split('/')
        .any(|segment| IGNORED_PATH_SEGMENTS.contains(&segment))
}

fn list_coverage_subject_files(root: &Path, target: &Path) -> io::Result<Vec<String>> {
    let metadata = fs::metadata(target)?;
    let relative_path = to_posix(&path_relative_to(root, target));

    if is_ignored_path(&relative_path) {
        return Ok(Vec::new());
    }

    if metadata.is_file() {
        return Ok(if is_coverage_subject_file(&relative_path) {
            vec![relative_path]
        } else {
            Vec::new()
        });
    }

    if !metadata.is_dir() {
        return Ok(Vec::new());
    }

    let mut files = Vec::new();
    for entry in fs::read_dir(target)? {
        let entry = entry?;
        let path = entry.path();
        let child_relative_path = to_posix(&path_relative_to(root, &path));

        if entry.file_type()?.is_dir() {
            if !is_ignored_path(&child_relative_path) {
                files.extend(list_coverage_subject_files(root, &path)?);
            }
        } else if is_coverage_subject_file(&child_relative_path)
            && !is_ignored_path(&child_relative_path)
        {
            files.push(child_relative_path);
        }
    }

    Ok(files)
}

fn load_coverage_exceptions(root: &Path) -> io::Result<Vec<CoverageException>> {
    let exception_file = root.join(DEFAULT_EXCEPTION_FILE);
    let parsed: Value =
        serde_json::from_str(&fs::read_to_string(&exception_file)?).map_err(io::Error::other)?;
    let Value::Array(values) = parsed else {
        return Err(io::Error::other(format!(
            "{DEFAULT_EXCEPTION_FILE} must contain an array."
        )));
    };

    values
        .iter()
        .enumerate()
        .map(|(index, value)| {
            if !is_coverage_exception(value) {
                return Err(io::Error::other(format!(
                    "{DEFAULT_EXCEPTION_FILE}[{index}] must include string pattern and reason fields."
                )));
            }

            let pattern = value
                .get("pattern")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_owned();
            let reason = value
                .get("reason")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_owned();

            Ok(CoverageException { pattern, reason })
        })
        .collect()
}

fn matches_approved_exception(file: &str, exceptions: &[CoverageException]) -> bool {
    exceptions
        .iter()
        .any(|exception| rule_matches(&exception.pattern, file))
}

fn parse_covered_files(lcov: &str, root: &Path) -> Vec<String> {
    lcov.lines()
        .filter_map(|line| line.strip_prefix("SF:"))
        .map(|file| {
            let path = PathBuf::from(file);
            if path.is_absolute() {
                to_posix(&path_relative_to(root, &path))
            } else {
                to_posix(file)
            }
        })
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect()
}

fn path_relative_to(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .map_or(path, |relative| relative)
        .to_string_lossy()
        .into_owned()
}

fn to_posix(file: &str) -> String {
    file.replace(std::path::MAIN_SEPARATOR, "/")
}

fn extension_is(file: &str, expected: &str) -> bool {
    Path::new(file)
        .extension()
        .is_some_and(|extension| extension.eq_ignore_ascii_case(expected))
}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::path::PathBuf;
    use std::sync::atomic::{AtomicUsize, Ordering};

    use super::{format_coverage_inventory_report, verify_coverage_inventory_with_roots};

    static NEXT_TEMP: AtomicUsize = AtomicUsize::new(0);

    fn temp_root(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!(
            "tpm-xtask-coverage-{name}-{}-{}",
            std::process::id(),
            NEXT_TEMP.fetch_add(1, Ordering::Relaxed)
        ))
    }

    #[test]
    fn finds_unapproved_coverage_gaps_and_accepts_mirrored_tests()
    -> Result<(), Box<dyn std::error::Error>> {
        let root = temp_root("missing");
        fs::create_dir_all(root.join("coverage"))?;
        fs::create_dir_all(root.join("scripts"))?;
        fs::create_dir_all(root.join("src/lib"))?;
        fs::create_dir_all(root.join("tests/src/lib"))?;
        fs::write(
            root.join("coverage/lcov.info"),
            "SF:src/lib/covered.ts\nDA:1,1\n",
        )?;
        fs::write(root.join("scripts/coverage-exceptions.json"), "[]")?;
        fs::write(
            root.join("src/lib/covered.ts"),
            "export const covered = true;\n",
        )?;
        fs::write(
            root.join("src/lib/mirrored.ts"),
            "export const mirrored = true;\n",
        )?;
        fs::write(
            root.join("tests/src/lib/mirrored.test.ts"),
            "test('x', () => {});\n",
        )?;
        fs::write(
            root.join("src/lib/missing.ts"),
            "export const missing = true;\n",
        )?;

        let result = verify_coverage_inventory_with_roots(&root, &["src"])?;

        assert_eq!(result.missing, vec![String::from("src/lib/missing.ts")]);
        assert!(format_coverage_inventory_report(&result).contains("unapproved coverage gap"));

        fs::remove_dir_all(root)?;
        Ok(())
    }

    #[test]
    fn honors_approved_coverage_exceptions() -> Result<(), Box<dyn std::error::Error>> {
        let root = temp_root("exception");
        fs::create_dir_all(root.join("coverage"))?;
        fs::create_dir_all(root.join("scripts"))?;
        fs::create_dir_all(root.join("src/styles"))?;
        fs::write(
            root.join("coverage/lcov.info"),
            "SF:src/lib/covered.ts\nDA:1,1\n",
        )?;
        fs::write(
            root.join("scripts/coverage-exceptions.json"),
            r#"[{"pattern":"src/styles/**/*.css","reason":"CSS is browser-tested."}]"#,
        )?;
        fs::write(
            root.join("src/styles/global.css"),
            "body { color: black; }\n",
        )?;

        let result = verify_coverage_inventory_with_roots(&root, &["src"])?;

        assert!(result.missing.is_empty());
        assert_eq!(
            result.approved_exceptions,
            vec![String::from("src/styles/global.css")]
        );

        fs::remove_dir_all(root)?;
        Ok(())
    }
}
