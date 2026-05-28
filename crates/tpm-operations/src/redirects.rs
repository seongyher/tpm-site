//! Redirect rule reporting for static deploy targets.

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

const CLOUDFLARE_STATIC_REDIRECT_LIMIT: usize = 2_000;
const CLOUDFLARE_REDIRECT_LINE_LIMIT: usize = 1_000;
const GENERATED_HEADER: &str =
    "# Generated from site redirects and article legacyPermalink metadata. Do not edit by hand.";

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
struct RedirectRule {
    destination: String,
    source: String,
}

/// Runs the Rust redirect report operation.
#[must_use]
pub fn run_redirect_report(
    start: impl Into<PathBuf>,
    interface: OperationInterface,
) -> OperationResult {
    let start = start.into();
    let request = OperationRequest::new(operation_id("routes.redirects"), interface)
        .with_workspace(display_path(&start));

    match WorkspaceContext::discover(&start) {
        Ok(context) => match collect_redirect_rules(&context) {
            Ok(rules) => {
                let output = format_redirects(&rules);
                let diagnostics = redirect_diagnostics(&context, &rules);
                let summary = OperationSummary::new("Redirect report completed")
                    .with_detail(format!("redirect rules: {}", rules.len()))
                    .with_detail(format!("cloudflare output bytes: {}", output.len()));

                OperationResult::new(request, summary, OperationTiming::default(), diagnostics)
            }
            Err(error) => OperationResult::new(
                request,
                OperationSummary::new("Redirect report failed"),
                OperationTiming::default(),
                DiagnosticReport::from_diagnostics(vec![Diagnostic::new(
                    diagnostic_code("TPM-REDIRECTS-COLLECT"),
                    Severity::Error,
                    format!("Could not collect redirect rules: {error}."),
                )
                .with_location(DiagnosticLocation::source(context.display_path(context.site())))
                .with_remediation("Fix redirect config, duplicate legacy permalinks, or unreadable content files.")]),
            ),
        },
        Err(error) => OperationResult::new(
            request,
            OperationSummary::new("Redirect report failed")
                .with_detail(format!("workspace discovery failed: {error}")),
            OperationTiming::default(),
            DiagnosticReport::from_diagnostics(vec![Diagnostic::new(
                diagnostic_code("TPM-REDIRECTS-WORKSPACE"),
                Severity::Error,
                "Could not discover a workspace for redirect reporting.",
            )
            .with_location(DiagnosticLocation::source(display_path(&start)))
            .with_remediation(
                "Run redirect reporting from a repo with site/config/site.json or pass --site.",
            )]),
        ),
    }
}

fn collect_redirect_rules(context: &WorkspaceContext) -> io::Result<Vec<RedirectRule>> {
    let mut rules = BTreeMap::<String, RedirectRule>::new();

    for (source, destination) in configured_redirects(context)? {
        insert_rule(&mut rules, source, destination)?;
    }

    collect_legacy_rules(
        context,
        &context.site().join("content/articles"),
        "/articles/",
        &mut rules,
    )?;
    collect_legacy_rules(
        context,
        &context.site().join("content/announcements"),
        "/announcements/",
        &mut rules,
    )?;

    Ok(rules.into_values().collect())
}

fn configured_redirects(context: &WorkspaceContext) -> io::Result<Vec<(String, String)>> {
    let path = context.site().join("config/redirects.json");
    let contents = fs::read_to_string(path)?;
    let parsed: BTreeMap<String, String> =
        serde_json::from_str(&contents).map_err(io::Error::other)?;

    Ok(parsed
        .into_iter()
        .map(|(source, destination)| (normalize_path(&source), destination.trim().to_owned()))
        .collect())
}

fn collect_legacy_rules(
    context: &WorkspaceContext,
    dir: &Path,
    route_prefix: &'static str,
    rules: &mut BTreeMap<String, RedirectRule>,
) -> io::Result<()> {
    if !dir.exists() {
        return Ok(());
    }

    let mut files = Vec::new();
    collect_markdown_files(dir, &mut files)?;
    files.sort();

    for file in files {
        let contents = fs::read_to_string(&file)?;
        if let Some(legacy) = legacy_permalink(&contents) {
            let destination = with_trailing_slash(&format!(
                "{route_prefix}{}",
                file.file_stem()
                    .and_then(|stem| stem.to_str())
                    .unwrap_or_default()
            ));
            insert_rule(rules, normalize_path(&legacy), destination).map_err(|error| {
                io::Error::new(
                    io::ErrorKind::InvalidData,
                    format!("{}: {error}", context.display_path(&file)),
                )
            })?;
        }
    }

    Ok(())
}

fn collect_markdown_files(dir: &Path, files: &mut Vec<PathBuf>) -> io::Result<()> {
    let mut entries = fs::read_dir(dir)?.collect::<Result<Vec<_>, _>>()?;
    entries.sort_by_key(fs::DirEntry::path);

    for entry in entries {
        let path = entry.path();
        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            collect_markdown_files(&path, files)?;
        } else if markdown_path(&path) {
            files.push(path);
        }
    }

    Ok(())
}

fn insert_rule(
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

fn redirect_diagnostics(context: &WorkspaceContext, rules: &[RedirectRule]) -> DiagnosticReport {
    let mut diagnostics = Vec::new();

    if rules.len() > CLOUDFLARE_STATIC_REDIRECT_LIMIT {
        diagnostics.push(
            Diagnostic::new(
                diagnostic_code("TPM-REDIRECTS-CLOUDFLARE-COUNT"),
                Severity::Error,
                format!(
                    "Generated {} redirects, above Cloudflare's static redirect limit of {CLOUDFLARE_STATIC_REDIRECT_LIMIT}.",
                    rules.len()
                ),
            )
            .with_location(DiagnosticLocation::source(
                context.display_path(&context.site().join("config/redirects.json")),
            ))
            .with_remediation("Move provider-specific redirect behavior into a deploy adapter or reduce static redirects."),
        );
    }

    for rule in rules {
        let line = format!("{} {} 301", rule.source, rule.destination);
        if line.len() > CLOUDFLARE_REDIRECT_LINE_LIMIT {
            diagnostics.push(
                Diagnostic::new(
                    diagnostic_code("TPM-REDIRECTS-CLOUDFLARE-LINE"),
                    Severity::Error,
                    format!(
                        "Redirect line for `{}` exceeds Cloudflare's {CLOUDFLARE_REDIRECT_LINE_LIMIT}-character line limit.",
                        rule.source
                    ),
                )
                .with_location(DiagnosticLocation::source(
                    context.display_path(&context.site().join("config/redirects.json")),
                ))
                .with_remediation("Shorten the redirect source or destination."),
            );
        }
    }

    DiagnosticReport::from_diagnostics(diagnostics)
}

fn format_redirects(rules: &[RedirectRule]) -> String {
    let mut lines = vec![String::from(GENERATED_HEADER)];
    lines.extend(
        rules
            .iter()
            .map(|rule| format!("{} {} 301", rule.source, rule.destination)),
    );
    lines.push(String::new());
    lines.join("\n")
}

fn legacy_permalink(markdown: &str) -> Option<String> {
    let mut lines = markdown.lines();
    if lines.next()? != "---" {
        return None;
    }

    for line in lines {
        if line == "---" {
            return None;
        }

        let trimmed = line.trim();
        if let Some(value) = trimmed.strip_prefix("legacyPermalink:") {
            return Some(strip_quotes(value.trim()));
        }
    }

    None
}

fn strip_quotes(value: &str) -> String {
    strip_wrapping_quote(value, '"')
        .or_else(|| strip_wrapping_quote(value, '\''))
        .unwrap_or(value)
        .to_owned()
}

fn strip_wrapping_quote(value: &str, quote: char) -> Option<&str> {
    let unquoted = value.strip_prefix(quote)?;
    unquoted.strip_suffix(quote)
}

fn markdown_path(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| matches!(extension, "md" | "mdx"))
}

fn normalize_path(value: &str) -> String {
    let trimmed = value.trim();
    let with_leading = if trimmed.starts_with('/') {
        trimmed.to_owned()
    } else {
        format!("/{trimmed}")
    };
    with_trailing_slash(&collapse_slashes(&with_leading))
}

fn collapse_slashes(value: &str) -> String {
    let mut collapsed = String::new();
    let mut previous_slash = false;

    for character in value.chars() {
        if character == '/' {
            if !previous_slash {
                collapsed.push(character);
            }
            previous_slash = true;
        } else {
            collapsed.push(character);
            previous_slash = false;
        }
    }

    collapsed
}

fn with_trailing_slash(value: &str) -> String {
    if value.ends_with('/') {
        value.to_owned()
    } else {
        format!("{value}/")
    }
}

#[expect(
    clippy::expect_used,
    reason = "redirect operation IDs are static repository invariants"
)]
fn operation_id(value: &'static str) -> OperationId {
    OperationId::parse(value).expect("redirect operation ID should be valid")
}

#[expect(
    clippy::expect_used,
    reason = "redirect diagnostic codes are static repository invariants"
)]
fn diagnostic_code(value: &'static str) -> DiagnosticCode {
    DiagnosticCode::parse(value).expect("redirect diagnostic code should be valid")
}

fn display_path(path: &Path) -> String {
    if path.as_os_str().is_empty() {
        return String::from(".");
    }

    path.to_string_lossy()
        .replace([std::path::MAIN_SEPARATOR, '\\'], "/")
}

#[cfg(test)]
mod tests {
    #![expect(
        clippy::expect_used,
        reason = "redirect tests use fixture lookups and expected failures as asserted preconditions"
    )]

    use std::error::Error;
    use std::fs;
    use std::path::{Path, PathBuf};

    use std::collections::BTreeMap;

    use super::{
        RedirectRule, collect_legacy_rules, configured_redirects, display_path, format_redirects,
        insert_rule, legacy_permalink, markdown_path, normalize_path, redirect_diagnostics,
        run_redirect_report, with_trailing_slash,
    };
    use crate::{OperationInterface, OperationStatus};
    use tpm_workspace::WorkspaceContext;

    fn temp_workspace(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("tpm-redirects-{name}-{}", std::process::id()))
    }

    fn write_file(path: &Path, contents: &str) -> Result<(), Box<dyn Error>> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, contents)?;
        Ok(())
    }

    #[test]
    fn normalizes_redirect_paths_like_current_generator() {
        assert_eq!(normalize_path("2015/example"), "/2015/example/");
        assert_eq!(normalize_path("//2015//example"), "/2015/example/");
        assert_eq!(normalize_path("/already/"), "/already/");
        assert_eq!(normalize_path(""), "/");
        assert_eq!(with_trailing_slash("/already/"), "/already/");
        assert_eq!(with_trailing_slash("/needs"), "/needs/");
    }

    #[test]
    fn parses_legacy_permalink_frontmatter() {
        let markdown = "---\ntitle: Example\nlegacyPermalink: /2015/example/\n---\n# Body";

        assert_eq!(
            legacy_permalink(markdown),
            Some(String::from("/2015/example/"))
        );
        assert_eq!(
            legacy_permalink("---\nlegacyPermalink: '/quoted/example/'\n---"),
            Some(String::from("/quoted/example/"))
        );
        assert_eq!(legacy_permalink("# No frontmatter"), None);
        assert_eq!(legacy_permalink("---\ntitle: Missing\n---"), None);
        assert_eq!(
            legacy_permalink("---\ntitle: Missing closing marker\n"),
            None
        );
    }

    #[test]
    fn detects_markdown_paths() {
        assert!(markdown_path(Path::new("article.md")));
        assert!(markdown_path(Path::new("article.mdx")));
        assert!(!markdown_path(Path::new("article.txt")));
    }

    #[test]
    fn formats_cloudflare_redirect_output() {
        let output = format_redirects(&[RedirectRule {
            destination: String::from("/articles/example/"),
            source: String::from("/2015/example/"),
        }]);

        assert!(output.starts_with(super::GENERATED_HEADER));
        assert!(output.contains("/2015/example/ /articles/example/ 301"));
    }

    #[test]
    fn redirect_report_collects_config_and_legacy_rules() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("collect");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        write_file(
            &root.join("site/config/redirects.json"),
            "{\"/old/\":\"/new/\"}",
        )?;
        write_file(
            &root.join("site/content/articles/example.md"),
            "---\nlegacyPermalink: /2015/example/\n---\n# Example",
        )?;
        fs::create_dir_all(root.join("site/content/announcements"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;

        let result = run_redirect_report(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Success);
        assert!(
            result
                .summary()
                .details()
                .iter()
                .any(|detail| detail == "redirect rules: 2")
        );

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn redirect_report_collects_announcement_legacy_rules() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("announcement-collect");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        write_file(&root.join("site/config/redirects.json"), "{}")?;
        fs::create_dir_all(root.join("site/content/articles"))?;
        fs::create_dir_all(root.join("site/assets"))?;
        fs::create_dir_all(root.join("site/public"))?;
        write_file(
            &root.join("site/content/announcements/update.md"),
            "---\nlegacyPermalink: /legacy/update/\n---\n# Update",
        )?;

        let result = run_redirect_report(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Success);
        assert!(
            result
                .summary()
                .details()
                .iter()
                .any(|detail| detail == "redirect rules: 1")
        );

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn configured_redirects_trim_and_normalize_sources() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("configured");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        write_file(
            &root.join("site/config/redirects.json"),
            "{\" old/path \":\" /new/path/ \"}",
        )?;
        let context = WorkspaceContext::from_root(&root);

        let redirects = configured_redirects(&context)?;

        assert_eq!(
            redirects,
            vec![(String::from("/old/path/"), String::from("/new/path/"))]
        );

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn collect_legacy_rules_handles_nested_announcements_and_missing_dirs()
    -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("legacy");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        write_file(
            &root.join("site/content/announcements/nested/update.mdx"),
            "---\nlegacyPermalink: /legacy/update/\n---\n# Update",
        )?;
        let context = WorkspaceContext::from_root(&root);
        let mut rules = BTreeMap::new();

        collect_legacy_rules(
            &context,
            &root.join("site/content/articles"),
            "/articles/",
            &mut rules,
        )?;
        collect_legacy_rules(
            &context,
            &root.join("site/content/announcements"),
            "/announcements/",
            &mut rules,
        )?;

        assert_eq!(rules.len(), 1);
        assert_eq!(
            rules
                .get("/legacy/update/")
                .expect("legacy update redirect should exist")
                .destination,
            "/announcements/update/"
        );

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn conflicting_redirects_are_rejected() {
        let mut rules = BTreeMap::new();

        let first = insert_rule(
            &mut rules,
            String::from("/old/"),
            String::from("/articles/one/"),
        );
        let second = insert_rule(
            &mut rules,
            String::from("/old/"),
            String::from("/articles/two/"),
        );

        assert!(first.is_ok());
        assert!(second.is_err());
    }

    #[test]
    fn legacy_redirect_conflicts_include_source_file_context() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("legacy-conflict");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        write_file(
            &root.join("site/content/articles/one.md"),
            "---\nlegacyPermalink: /legacy/conflict/\n---\n# One",
        )?;
        write_file(
            &root.join("site/content/articles/two.md"),
            "---\nlegacyPermalink: /legacy/conflict/\n---\n# Two",
        )?;
        let context = WorkspaceContext::from_root(&root);
        let mut rules = BTreeMap::new();

        let error = collect_legacy_rules(
            &context,
            &root.join("site/content/articles"),
            "/articles/",
            &mut rules,
        )
        .expect_err("conflicting legacy redirects should fail");

        assert!(error.to_string().contains("site/content/articles/two.md"));
        assert!(error.to_string().contains("conflicting redirect"));

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn redirect_report_surfaces_collect_and_workspace_failures() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("collect-failure");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        write_file(&root.join("site/config/redirects.json"), "not-json")?;

        let result = run_redirect_report(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(
            result
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-REDIRECTS-COLLECT")
        );

        let missing = run_redirect_report(
            PathBuf::from("/tmp/tpm-redirects-missing-workspace"),
            OperationInterface::Test,
        );
        assert_eq!(missing.status(), OperationStatus::Failed);
        assert!(
            missing
                .diagnostics()
                .diagnostics()
                .iter()
                .any(|diagnostic| diagnostic.code().as_str() == "TPM-REDIRECTS-WORKSPACE")
        );

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn redirect_report_surfaces_legacy_conflicts() -> Result<(), Box<dyn Error>> {
        let root = temp_workspace("report-legacy-conflict");
        crate::test_support::remove_test_dir(&root);
        write_file(&root.join("site/config/site.json"), "{}")?;
        write_file(&root.join("site/config/redirects.json"), "{}")?;
        write_file(
            &root.join("site/content/articles/one.md"),
            "---\nlegacyPermalink: /legacy/conflict/\n---\n# One",
        )?;
        write_file(
            &root.join("site/content/articles/two.md"),
            "---\nlegacyPermalink: /legacy/conflict/\n---\n# Two",
        )?;

        let result = run_redirect_report(&root, OperationInterface::Test);

        assert_eq!(result.status(), OperationStatus::Failed);
        assert!(result.diagnostics().diagnostics().iter().any(|diagnostic| {
            diagnostic.code().as_str() == "TPM-REDIRECTS-COLLECT"
                && diagnostic
                    .message()
                    .contains("conflicting redirect destinations")
        }));

        crate::test_support::remove_test_dir(root);
        Ok(())
    }

    #[test]
    fn redirect_diagnostics_report_cloudflare_limits() {
        let root = temp_workspace("limits");
        let context = WorkspaceContext::from_root(&root);
        let mut rules = (0..=super::CLOUDFLARE_STATIC_REDIRECT_LIMIT)
            .map(|index| RedirectRule {
                destination: String::from("/new/"),
                source: format!("/old-{index}/"),
            })
            .collect::<Vec<_>>();
        rules.push(RedirectRule {
            destination: format!("/{}", "a".repeat(super::CLOUDFLARE_REDIRECT_LINE_LIMIT)),
            source: String::from("/too-long/"),
        });

        let diagnostics = redirect_diagnostics(&context, &rules);
        let codes = diagnostics
            .diagnostics()
            .iter()
            .map(|diagnostic| diagnostic.code().as_str())
            .collect::<Vec<_>>();

        assert!(codes.contains(&"TPM-REDIRECTS-CLOUDFLARE-COUNT"));
        assert!(codes.contains(&"TPM-REDIRECTS-CLOUDFLARE-LINE"));
        assert_eq!(display_path(Path::new("")), ".");
    }
}
