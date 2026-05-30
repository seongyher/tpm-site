use std::fs;
use std::io::{self, Write};
use std::path::Path;

use tpm_core::CommandExit;

use crate::cli::args::QuietArgs;

use super::filesystem::relative_display;
use super::workspace::Workspace;

const GENERATED_CLI_REFERENCE: &str = "docs/generated/tpm-cli-reference.md";

const REQUIRED_DISTRIBUTION_DOCS: &[&str] = &[
    "docs/platform/PACKAGE_BOUNDARIES_AND_EXTRACTION_CRITERIA.md",
    "docs/governance/PUBLIC_API_COMPATIBILITY.md",
    "docs/cli/CLI_DISTRIBUTION.md",
    "docs/studio/STUDIO_TAURI_DISTRIBUTION.md",
    "docs/rust/RUST_ADVANCED_QA_POLICY.md",
    "docs/governance/PUBLIC_DISTRIBUTION_READINESS.md",
    "docs/governance/RELEASE_GOVERNANCE.md",
    "docs/governance/SUPPLY_CHAIN_AND_SECRET_POLICY.md",
    GENERATED_CLI_REFERENCE,
];

const RUST_PACKAGE_MANIFESTS: &[&str] = &[
    "crates/tpm-core/Cargo.toml",
    "crates/tpm-diagnostics/Cargo.toml",
    "crates/tpm-workspace/Cargo.toml",
    "crates/tpm-operations/Cargo.toml",
    "crates/tpm-cli/Cargo.toml",
    "crates/tpm-mcp/Cargo.toml",
    "crates/tpm-xtask/Cargo.toml",
    "apps/studio/src-tauri/Cargo.toml",
];

const REQUIRED_DISTRIBUTION_RECIPES: &[&str] = &[
    "cli-reference",
    "cli-reference-check",
    "cli-release-smoke",
    "studio-package-check",
    "rust-public-api-check",
    "distribution-check",
];

pub(super) fn cli_reference<W>(
    args: &QuietArgs,
    check: bool,
    output: &mut W,
) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let path = workspace.root.join(GENERATED_CLI_REFERENCE);
    let reference = tpm_cli::render_command_reference_markdown();

    if check {
        let issues = cli_reference_issues(&workspace)?;
        return render_issues(
            output,
            &issues,
            "CLI reference check passed.",
            "CLI reference check failed.",
            args.quiet,
        );
    }

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(&path, reference)?;
    if !args.quiet {
        writeln!(
            output,
            "Generated CLI reference at {}.",
            relative_display(&workspace.root, &path)
        )?;
    }
    Ok(CommandExit::Success)
}

pub(super) fn public_api_check<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let issues = public_api_issues(&workspace.root)?;

    render_issues(
        output,
        &issues,
        "Public API compatibility policy passed.",
        "Public API compatibility policy failed.",
        args.quiet,
    )
}

pub(super) fn distribution_check<W>(args: &QuietArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let issues = distribution_readiness_issues(&workspace)?;

    render_issues(
        output,
        &issues,
        "Public distribution readiness check passed.",
        "Public distribution readiness check failed.",
        args.quiet,
    )
}

pub(super) fn cli_reference_issues(workspace: &Workspace) -> io::Result<Vec<String>> {
    let path = workspace.root.join(GENERATED_CLI_REFERENCE);
    if !path.is_file() {
        return Ok(vec![format!(
            "{}: generated CLI reference is missing",
            relative_display(&workspace.root, &path)
        )]);
    }

    let current = fs::read_to_string(&path)?;
    let expected = tpm_cli::render_command_reference_markdown();
    if current == expected {
        Ok(Vec::new())
    } else {
        Ok(vec![format!(
            "{}: generated CLI reference is stale; run `just cli-reference`",
            relative_display(&workspace.root, &path)
        )])
    }
}

pub(super) fn public_api_issues(root: &Path) -> io::Result<Vec<String>> {
    let mut issues = Vec::new();
    let root_cargo = root.join("Cargo.toml");
    let root_text = fs::read_to_string(&root_cargo)?;
    if !root_text.contains("publish = false") {
        issues.push(format!(
            "{}: workspace package policy must keep publish = false until an explicit public release decision",
            relative_display(root, &root_cargo)
        ));
    }

    for manifest in RUST_PACKAGE_MANIFESTS {
        let path = root.join(manifest);
        let text = fs::read_to_string(&path)?;
        if text.contains("publish = true") {
            issues.push(format!(
                "{manifest}: Rust package is directly publishable without a Milestone 14 release decision"
            ));
        }
        if !text.contains("publish.workspace = true") {
            issues.push(format!(
                "{manifest}: Rust package should inherit the workspace publish policy"
            ));
        }
        if !text.contains("description = ") {
            issues.push(format!(
                "{manifest}: Rust package should have a package description for docs and release review"
            ));
        }
        if !text.contains("[lints]") || !text.contains("workspace = true") {
            issues.push(format!(
                "{manifest}: Rust package should inherit workspace lint policy"
            ));
        }
    }

    Ok(issues)
}

pub(super) fn distribution_readiness_issues(workspace: &Workspace) -> io::Result<Vec<String>> {
    let mut issues = Vec::new();

    for doc in REQUIRED_DISTRIBUTION_DOCS {
        let path = workspace.root.join(doc);
        if !path.is_file() {
            issues.push(format!("{doc}: required distribution document is missing"));
        }
    }

    issues.extend(cli_reference_issues(workspace)?);
    issues.extend(public_api_issues(&workspace.root)?);

    let justfile = workspace.root.join("justfile");
    if justfile.is_file() {
        let text = fs::read_to_string(&justfile)?;
        for recipe in REQUIRED_DISTRIBUTION_RECIPES {
            if !text.contains(&format!("\n{recipe}")) {
                issues.push(format!(
                    "{}: required distribution recipe `{recipe}` is missing",
                    relative_display(&workspace.root, &justfile)
                ));
            }
        }
    } else {
        issues.push(String::from("justfile: command router is missing"));
    }

    let consumer = workspace
        .root
        .join("examples/platform-entrypoint-consumer/platform-consumer.ts");
    if consumer.is_file() {
        let text = fs::read_to_string(&consumer)?;
        for banned in ["thephilosophersmeme.com", "../../site/", "site/content"] {
            if text.contains(banned) {
                issues.push(format!(
                    "{}: external consumer example contains TPM-only boundary `{banned}`",
                    relative_display(&workspace.root, &consumer)
                ));
            }
        }
    } else {
        issues.push(String::from(
            "examples/platform-entrypoint-consumer/platform-consumer.ts: external consumer example is missing",
        ));
    }

    let tauri_distribution = workspace
        .root
        .join("docs/studio/STUDIO_TAURI_DISTRIBUTION.md");
    if tauri_distribution.is_file() {
        let text = fs::read_to_string(&tauri_distribution)?;
        for expected in ["signing", "notarization", "update", "secret"] {
            if !text.contains(expected) {
                issues.push(format!(
                    "{}: Tauri distribution plan should document {expected}",
                    relative_display(&workspace.root, &tauri_distribution)
                ));
            }
        }
    }

    Ok(issues)
}

fn render_issues<W>(
    output: &mut W,
    issues: &[String],
    success_message: &str,
    failure_message: &str,
    quiet: bool,
) -> io::Result<CommandExit>
where
    W: Write,
{
    if issues.is_empty() {
        if !quiet {
            writeln!(output, "{success_message}")?;
        }
        return Ok(CommandExit::Success);
    }

    writeln!(output, "{failure_message}")?;
    for issue in issues {
        writeln!(output, "- {issue}")?;
    }
    Ok(CommandExit::Failure)
}
