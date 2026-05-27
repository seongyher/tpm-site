#![expect(
    clippy::redundant_pub_crate,
    reason = "xtask keeps sibling modules internal while sharing focused implementation seams"
)]

use std::collections::BTreeSet;
use std::fs;
use std::io;
use std::path::Path;
use std::process::Command;

const DEFAULT_IGNORE_FILE: &str = ".test-accountability-ignore";
const IGNORED_PATH_SEGMENTS: &[&str] =
    &[".git", "coverage", "dist", "dist-catalog", "node_modules"];

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct AccountabilityIgnoreRule {
    pub line: usize,
    pub pattern: String,
    pub reason: String,
    pub requested_permission: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct MissingMirror {
    pub expected: Vec<String>,
    pub file: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct TestAccountabilityResult {
    pub accountability_files: Vec<String>,
    pub files: Vec<String>,
    pub invalid_rules: Vec<String>,
    pub missing_mirrors: Vec<MissingMirror>,
    pub requested_permission_rules: Vec<AccountabilityIgnoreRule>,
    pub unaccounted_files: Vec<String>,
    pub unmatched_rules: Vec<AccountabilityIgnoreRule>,
}

impl TestAccountabilityResult {
    pub(crate) const fn has_blocking_problems(&self, release: bool) -> bool {
        !self.invalid_rules.is_empty()
            || !self.unmatched_rules.is_empty()
            || !self.missing_mirrors.is_empty()
            || !self.unaccounted_files.is_empty()
            || (release && !self.requested_permission_rules.is_empty())
    }
}

pub(crate) fn expected_mirror_tests(file: &str) -> Vec<String> {
    let path_without_extension = strip_code_extension(file);

    if extension_is(file, "astro") {
        return vec![
            format!("tests/{path_without_extension}.test.ts"),
            format!("tests/{path_without_extension}.vitest.ts"),
        ];
    }

    match file {
        "astro.config.ts" => return vec![String::from("tests/config/astro.config.test.ts")],
        "eslint.config.ts" => return vec![String::from("tests/config/eslint.config.test.ts")],
        "knip.ts" => return vec![String::from("tests/config/knip.test.ts")],
        "playwright.config.ts" => {
            return vec![String::from("tests/config/playwright.config.test.ts")];
        }
        "prettier.config.mjs" => {
            return vec![String::from("tests/config/prettier.config.test.ts")];
        }
        "eslint/tsconfig.json" | "scripts/tsconfig.json" | "tests/tsconfig.json" => {
            return vec![String::from("tests/config/tooling-tsconfigs.test.ts")];
        }
        "tsconfig.json" => return vec![String::from("tests/config/tsconfig.test.ts")],
        "tsconfig.tools.json" => {
            return vec![String::from("tests/config/tsconfig.tools.test.ts")];
        }
        "vitest.config.ts" => return vec![String::from("tests/config/vitest.config.test.ts")],
        "wrangler.toml" => return vec![String::from("tests/config/wrangler.config.test.ts")],
        "scripts/build/generate-article-pdfs.ts" => {
            return vec![String::from("tests/build/generate-article-pdfs.test.ts")];
        }
        "examples/platform-entrypoint-consumer/platform-consumer.ts" => {
            return vec![String::from("tests/src/platform/example-consumer.test.ts")];
        }
        _ => {}
    }

    if file.starts_with("src/platform/") && extension_is(file, "ts") {
        return vec![
            format!("tests/{path_without_extension}.test.ts"),
            format!("tests/{path_without_extension}-entrypoint.test.ts"),
            String::from("tests/src/platform/entrypoints.test.ts"),
        ];
    }

    vec![format!("tests/{path_without_extension}.test.ts")]
}

pub(crate) fn format_test_accountability_report(
    result: &TestAccountabilityResult,
    release: bool,
) -> String {
    let mut sections = Vec::new();

    if !result.invalid_rules.is_empty() {
        sections.push(String::from("Invalid accountability ignore rules:"));
        sections.extend(result.invalid_rules.iter().cloned());
    }

    if !result.unmatched_rules.is_empty() {
        sections.push(String::from(
            "Accountability ignore patterns that match no repository files:",
        ));
        sections.extend(
            result
                .unmatched_rules
                .iter()
                .map(|rule| format!("- {} (line {})", rule.pattern, rule.line)),
        );
    }

    if !result.missing_mirrors.is_empty() {
        sections.push(String::from("Code files missing mirrored tests:"));
        sections.extend(result.missing_mirrors.iter().map(|missing| {
            format!(
                "- {} (expected {})",
                missing.file,
                missing.expected.join(" or ")
            )
        }));
    }

    if !result.unaccounted_files.is_empty() {
        sections.push(String::from(
            "Repository files without test accountability:",
        ));
        sections.extend(
            result
                .unaccounted_files
                .iter()
                .map(|file| format!("- {file}")),
        );
    }

    if !result.requested_permission_rules.is_empty() {
        sections.push(if release {
            String::from(
                "Requested-permission accountability exceptions must be resolved before release:",
            )
        } else {
            String::from("Requested-permission accountability exceptions to report during handoff:")
        });
        sections.extend(
            result
                .requested_permission_rules
                .iter()
                .map(|rule| format!("- {} (line {}): {}", rule.pattern, rule.line, rule.reason)),
        );
    }

    if sections.is_empty() {
        format!(
            "Test accountability passed: {} repository files are covered by mirrored tests or documented accountability rules.",
            result.files.len()
        )
    } else {
        sections.join("\n")
    }
}

pub(crate) fn parse_accountability_ignore(
    text: &str,
    file_name: &str,
) -> (Vec<String>, Vec<AccountabilityIgnoreRule>) {
    let mut invalid_rules = Vec::new();
    let mut rules = Vec::new();
    let mut active_reason = String::new();
    let mut pending_comments = Vec::new();

    for (index, line) in text.lines().enumerate() {
        let line_number = index + 1;
        let trimmed = line.trim();

        if trimmed.is_empty() {
            active_reason.clear();
            pending_comments.clear();
            continue;
        }

        if let Some(comment) = trimmed.strip_prefix('#') {
            pending_comments.push(comment.trim().to_owned());
            continue;
        }

        let pending_reason = pending_comments.join(" ").trim().to_owned();
        let reason = if pending_reason.is_empty() {
            active_reason.clone()
        } else {
            pending_reason
        };
        if !is_meaningful_reason(&reason) {
            invalid_rules.push(format!(
                "{file_name}:{line_number} pattern \"{trimmed}\" needs an immediately preceding meaningful comment."
            ));
        }

        rules.push(AccountabilityIgnoreRule {
            line: line_number,
            pattern: trimmed.to_owned(),
            requested_permission: reason
                .to_ascii_lowercase()
                .starts_with("requested permission:"),
            reason: reason.clone(),
        });
        active_reason = reason;
        pending_comments.clear();
    }

    (invalid_rules, rules)
}

pub(crate) fn verify_test_accountability(root: &Path) -> io::Result<TestAccountabilityResult> {
    verify_test_accountability_with_files(root, None)
}

pub(crate) fn verify_test_accountability_with_files(
    root: &Path,
    files: Option<Vec<String>>,
) -> io::Result<TestAccountabilityResult> {
    let repository_files = files.map_or_else(|| list_repository_files(root), Ok)?;
    let repository_files = repository_files
        .into_iter()
        .map(|file| to_posix(&file))
        .filter(|file| !is_ignored_path(file))
        .filter(|file| root.join(file).exists())
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect::<Vec<_>>();
    let ignore_text = fs::read_to_string(root.join(DEFAULT_IGNORE_FILE))?;
    let (invalid_rules, rules) = parse_accountability_ignore(&ignore_text, DEFAULT_IGNORE_FILE);
    let accountability_files = repository_files
        .iter()
        .filter(|file| rules.iter().any(|rule| rule_matches(&rule.pattern, file)))
        .cloned()
        .collect::<Vec<_>>();
    let accountability_file_set = accountability_files.iter().collect::<BTreeSet<_>>();
    let repository_file_set = repository_files.iter().collect::<BTreeSet<_>>();
    let unmatched_rules = rules
        .iter()
        .filter(|rule| !rule.pattern.starts_with('!'))
        .filter(|rule| {
            !repository_files
                .iter()
                .any(|file| rule_matches(&rule.pattern, file))
        })
        .cloned()
        .collect::<Vec<_>>();
    let missing_mirrors = repository_files
        .iter()
        .filter(|file| requires_mirrored_test(file))
        .filter(|file| !accountability_file_set.contains(file))
        .filter_map(|file| {
            let expected = expected_mirror_tests(file);
            if expected
                .iter()
                .any(|test| repository_file_set.contains(test))
            {
                None
            } else {
                Some(MissingMirror {
                    expected,
                    file: file.clone(),
                })
            }
        })
        .collect::<Vec<_>>();
    let mirrored_files = repository_files
        .iter()
        .filter(|file| {
            expected_mirror_tests(file)
                .iter()
                .any(|test| repository_file_set.contains(test))
        })
        .collect::<BTreeSet<_>>();
    let unaccounted_files = repository_files
        .iter()
        .filter(|file| !accountability_file_set.contains(file))
        .filter(|file| !mirrored_files.contains(file))
        .filter(|file| !is_rust_workspace_accounted_file(file))
        .filter(|file| !is_test_file(file))
        .cloned()
        .collect::<Vec<_>>();

    Ok(TestAccountabilityResult {
        accountability_files,
        files: repository_files,
        invalid_rules,
        missing_mirrors,
        requested_permission_rules: rules
            .iter()
            .filter(|rule| rule.requested_permission)
            .cloned()
            .collect(),
        unmatched_rules,
        unaccounted_files,
    })
}

pub(crate) fn rule_matches(pattern: &str, file: &str) -> bool {
    if let Some(prefix) = pattern.strip_suffix("/**") {
        return file == prefix || file.starts_with(&format!("{prefix}/"));
    }

    if !pattern.contains('/') {
        return segment_glob_matches(pattern, file_name(file));
    }

    path_glob_matches(pattern, file)
}

fn file_name(file: &str) -> &str {
    file.rsplit('/').next().unwrap_or(file)
}

fn is_ignored_path(relative_path: &str) -> bool {
    relative_path
        .split('/')
        .any(|segment| IGNORED_PATH_SEGMENTS.contains(&segment))
}

fn is_meaningful_reason(reason: &str) -> bool {
    let trimmed = reason.trim();

    trimmed.len() >= 24 && !matches!(trimmed.to_ascii_lowercase().as_str(), "ignore" | "ignored")
}

fn is_rust_workspace_accounted_file(file: &str) -> bool {
    file == "Cargo.lock"
        || file == "Cargo.toml"
        || file == "deny.toml"
        || file == "justfile"
        || file == "rust-toolchain.toml"
        || file == "rustfmt.toml"
        || (file.starts_with("crates/")
            && (file.ends_with("/Cargo.toml") || extension_is(file, "rs")))
}

fn is_test_file(file: &str) -> bool {
    file.starts_with("tests/")
        && (file.ends_with(".test.ts")
            || file.ends_with(".test.tsx")
            || file.ends_with(".test.mts")
            || file.ends_with(".test.cts")
            || file.ends_with(".test.js")
            || file.ends_with(".test.jsx"))
}

fn list_repository_files(root: &Path) -> io::Result<Vec<String>> {
    let output = Command::new("git")
        .args(["ls-files", "--cached", "--others", "--exclude-standard"])
        .current_dir(root)
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_owned();
        return Err(io::Error::other(if stderr.is_empty() {
            String::from("Failed to list repository files.")
        } else {
            stderr
        }));
    }

    Ok(String::from_utf8_lossy(&output.stdout)
        .lines()
        .filter(|line| !line.is_empty())
        .map(ToOwned::to_owned)
        .collect())
}

fn path_glob_matches(pattern: &str, file: &str) -> bool {
    let pattern_segments = pattern.split('/').collect::<Vec<_>>();
    let file_segments = file.split('/').collect::<Vec<_>>();

    path_glob_segments_match(&pattern_segments, &file_segments)
}

fn path_glob_segments_match(pattern: &[&str], file: &[&str]) -> bool {
    match (pattern.split_first(), file.split_first()) {
        (None, None) => true,
        (Some((&"**", rest)), _) => {
            path_glob_segments_match(rest, file)
                || file
                    .split_first()
                    .is_some_and(|(_, remaining)| path_glob_segments_match(pattern, remaining))
        }
        (Some((segment, rest)), Some((file_segment, file_rest))) => {
            segment_glob_matches(segment, file_segment) && path_glob_segments_match(rest, file_rest)
        }
        (None, Some(_)) | (Some(_), None) => false,
    }
}

fn requires_mirrored_test(file: &str) -> bool {
    is_mirrored_extension(file) && !is_test_file(file)
}

fn segment_glob_matches(pattern: &str, text: &str) -> bool {
    let pattern = pattern.as_bytes();
    let text = text.as_bytes();
    let mut table = vec![vec![false; text.len() + 1]; pattern.len() + 1];
    table[0][0] = true;

    for pattern_index in 1..=pattern.len() {
        if pattern[pattern_index - 1] == b'*' {
            table[pattern_index][0] = table[pattern_index - 1][0];
        }
    }

    for pattern_index in 1..=pattern.len() {
        for text_index in 1..=text.len() {
            table[pattern_index][text_index] = match pattern[pattern_index - 1] {
                b'*' => {
                    table[pattern_index - 1][text_index] || table[pattern_index][text_index - 1]
                }
                b'?' => table[pattern_index - 1][text_index - 1],
                character => {
                    character == text[text_index - 1] && table[pattern_index - 1][text_index - 1]
                }
            };
        }
    }

    table[pattern.len()][text.len()]
}

fn strip_code_extension(file: &str) -> String {
    if let Some(stripped) = file.strip_suffix(".d.ts") {
        return stripped.to_owned();
    }

    for extension in [
        ".astro", ".cjs", ".cts", ".jsx", ".js", ".mjs", ".mts", ".tsx", ".ts",
    ] {
        if let Some(stripped) = file.strip_suffix(extension) {
            return stripped.to_owned();
        }
    }

    file.to_owned()
}

fn is_mirrored_extension(file: &str) -> bool {
    file.ends_with(".d.ts")
        || extension_is(file, "astro")
        || extension_is(file, "cjs")
        || extension_is(file, "cts")
        || extension_is(file, "jsx")
        || extension_is(file, "js")
        || extension_is(file, "mjs")
        || extension_is(file, "mts")
        || extension_is(file, "tsx")
        || extension_is(file, "ts")
}

fn extension_is(file: &str, expected: &str) -> bool {
    Path::new(file)
        .extension()
        .is_some_and(|extension| extension.eq_ignore_ascii_case(expected))
}

fn to_posix(file: &str) -> String {
    file.replace(std::path::MAIN_SEPARATOR, "/")
}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::path::PathBuf;
    use std::sync::atomic::{AtomicUsize, Ordering};

    use super::{
        expected_mirror_tests, format_test_accountability_report, parse_accountability_ignore,
        rule_matches, verify_test_accountability_with_files,
    };

    static NEXT_TEMP: AtomicUsize = AtomicUsize::new(0);

    fn temp_root(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!(
            "tpm-xtask-accountability-{name}-{}-{}",
            std::process::id(),
            NEXT_TEMP.fetch_add(1, Ordering::Relaxed)
        ))
    }

    #[test]
    fn parses_ignore_rules_with_required_reasons() {
        let text = "\
# Approved exception: Generated documentation is reviewed through docs checks.
docs/generated/**

ignored-pattern
";
        let (invalid, rules) = parse_accountability_ignore(text, ".test-accountability-ignore");

        assert_eq!(rules.len(), 2);
        assert_eq!(rules[0].pattern, "docs/generated/**");
        assert_eq!(invalid.len(), 1);
        assert!(invalid[0].contains("ignored-pattern"));
    }

    #[test]
    fn matches_gitignore_like_rules_needed_by_accountability() {
        assert!(rule_matches("tests/**", "tests/config/package.test.ts"));
        assert!(rule_matches("*.md", "docs/README.md"));
        assert!(rule_matches(
            "scripts/*-ignore.json",
            "scripts/foo-ignore.json"
        ));
        assert!(!rule_matches(
            "scripts/*-ignore.json",
            "scripts/a/b-ignore.json"
        ));
    }

    #[test]
    fn generates_mirrored_test_candidates_for_special_paths() {
        assert_eq!(
            expected_mirror_tests("src/platform/content.ts"),
            vec![
                "tests/src/platform/content.test.ts",
                "tests/src/platform/content-entrypoint.test.ts",
                "tests/src/platform/entrypoints.test.ts",
            ]
        );
        assert_eq!(
            expected_mirror_tests("src/components/Button.astro"),
            vec![
                "tests/src/components/Button.test.ts",
                "tests/src/components/Button.vitest.ts",
            ]
        );
    }

    #[test]
    fn reports_missing_mirrors_unaccounted_files_and_release_exceptions()
    -> Result<(), Box<dyn std::error::Error>> {
        let root = temp_root("missing");
        fs::create_dir_all(&root)?;
        fs::write(
            root.join(".test-accountability-ignore"),
            "\
# Approved exception: The accountability file is validated by this Rust test.
.test-accountability-ignore

# Approved exception: Markdown docs are reviewed by documentation checks.
*.md

# Requested permission: temporary generated docs exception awaiting review.
docs/generated/**
",
        )?;
        let files = vec![
            ".test-accountability-ignore",
            "src/lib/missing.ts",
            "README.md",
            "docs/generated/platform-reference.md",
        ]
        .into_iter()
        .map(String::from)
        .collect();
        for file in &files {
            if file == ".test-accountability-ignore" {
                continue;
            }
            let path = root.join(file);
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::write(path, "")?;
        }

        let result = verify_test_accountability_with_files(&root, Some(files))?;

        assert_eq!(result.missing_mirrors.len(), 1);
        assert_eq!(
            result.unaccounted_files,
            vec![String::from("src/lib/missing.ts")]
        );
        assert_eq!(result.requested_permission_rules.len(), 1);

        fs::remove_dir_all(root)?;
        Ok(())
    }

    #[test]
    fn formats_success_and_failure_reports() {
        let result = super::TestAccountabilityResult {
            accountability_files: Vec::new(),
            files: vec![String::from("src/lib/example.ts")],
            invalid_rules: Vec::new(),
            missing_mirrors: vec![super::MissingMirror {
                expected: vec![String::from("tests/src/lib/example.test.ts")],
                file: String::from("src/lib/example.ts"),
            }],
            requested_permission_rules: Vec::new(),
            unmatched_rules: Vec::new(),
            unaccounted_files: Vec::new(),
        };

        let report = format_test_accountability_report(&result, false);

        assert!(report.contains("Code files missing mirrored tests:"));
        assert!(result.has_blocking_problems(false));
    }
}
