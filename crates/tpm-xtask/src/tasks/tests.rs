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
    ExternalCommandRunner, Workspace, absolutize, build_raw, cli_reference_issues,
    collect_asset_references, collect_files_with_extensions, collect_redirects,
    distribution_readiness_issues, duplicate_image_groups, extension_in, extension_is, fnv64,
    glob_matches, ignored_dir, ignored_path, image_files, is_inside, load_ignore_list,
    local_binary, local_binary_for_platform, normalize_path_components, normalize_tags,
    output_dir_arg, path_has_extension, public_api_issues, quoted_or_parenthesized_values,
    relative_display, remove_unreferenced_astro_rasters, require_dir, require_file,
    resolve_asset_reference, run, shared_asset_violations, test_catalog, test_flake, validate_html,
    verify_content, wildcard_matches,
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

fn remove_test_dir(path: impl AsRef<Path>) {
    match fs::remove_dir_all(path.as_ref()) {
        Ok(()) => {}
        Err(error) if error.kind() == io::ErrorKind::NotFound => {}
        Err(error) => panic!("failed to remove test directory: {error}"),
    }
}

#[cfg(unix)]
fn write_executable(path: &Path, contents: &str) -> Result<(), Box<dyn Error>> {
    use std::os::unix::fs::PermissionsExt as _;

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
        match std::env::set_current_dir(&self.previous) {
            Ok(()) => {}
            Err(error) => panic!("failed to restore current directory: {error}"),
        }
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
        "cli-reference",
        "cli-reference-check",
        "content-check",
        "coverage-verify",
        "diagnostics-diff",
        "distribution-check",
        "docs-references",
        "docs-references-check",
        "migration-baseline",
        "output-verify",
        "payload-check",
        "payload-report",
        "platform-check",
        "public-api-check",
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

fn write_distribution_manifest_set(root: &Path) -> Result<(), Box<dyn Error>> {
    write_text(
        &root.join("Cargo.toml"),
        "[workspace.package]\npublish = false\n",
    )?;

    for manifest in [
        "crates/tpm-core/Cargo.toml",
        "crates/tpm-diagnostics/Cargo.toml",
        "crates/tpm-workspace/Cargo.toml",
        "crates/tpm-operations/Cargo.toml",
        "crates/tpm-cli/Cargo.toml",
        "crates/tpm-mcp/Cargo.toml",
        "crates/tpm-xtask/Cargo.toml",
        "apps/studio/src-tauri/Cargo.toml",
    ] {
        write_text(
            &root.join(manifest),
            "[package]\nname = \"fixture\"\ndescription = \"Fixture package.\"\npublish.workspace = true\n\n[lints]\nworkspace = true\n",
        )?;
    }

    Ok(())
}

fn write_distribution_docs(root: &Path) -> Result<(), Box<dyn Error>> {
    for doc in [
        "docs/PACKAGE_BOUNDARIES_AND_EXTRACTION_CRITERIA.md",
        "docs/PUBLIC_API_COMPATIBILITY.md",
        "docs/CLI_DISTRIBUTION.md",
        "docs/RUST_ADVANCED_QA_POLICY.md",
        "docs/PUBLIC_DISTRIBUTION_READINESS.md",
        "docs/RELEASE_GOVERNANCE.md",
        "docs/SUPPLY_CHAIN_AND_SECRET_POLICY.md",
    ] {
        write_text(&root.join(doc), "# Fixture\n")?;
    }

    write_text(
        &root.join("docs/STUDIO_TAURI_DISTRIBUTION.md"),
        "# Fixture\n\nsigning\nnotarization\nupdate\nsecret\n",
    )?;
    write_text(
        &root.join("docs/generated/tpm-cli-reference.md"),
        tpm_cli::render_command_reference_markdown().as_str(),
    )?;
    write_text(
        &root.join("examples/platform-entrypoint-consumer/platform-consumer.ts"),
        "export const fixture = true;\n",
    )?;
    write_text(
        &root.join("justfile"),
        "\ncli-reference:\ncli-reference-check:\ncli-release-smoke:\nstudio-package-check:\nrust-public-api-check:\ndistribution-check:\n",
    )?;

    Ok(())
}

#[test]
fn generated_cli_reference_check_reports_missing_and_stale_docs() -> Result<(), Box<dyn Error>> {
    let root = temp_workspace("cli-reference");
    remove_test_dir(&root);
    let ws = workspace(&root);

    assert_eq!(
        cli_reference_issues(&ws)?,
        vec![String::from(
            "docs/generated/tpm-cli-reference.md: generated CLI reference is missing"
        )]
    );

    write_text(
        &root.join("docs/generated/tpm-cli-reference.md"),
        "# stale\n",
    )?;
    assert_eq!(
        cli_reference_issues(&ws)?,
        vec![String::from(
            "docs/generated/tpm-cli-reference.md: generated CLI reference is stale; run `just cli-reference`"
        )]
    );

    write_text(
        &root.join("docs/generated/tpm-cli-reference.md"),
        tpm_cli::render_command_reference_markdown().as_str(),
    )?;
    assert!(cli_reference_issues(&ws)?.is_empty());

    remove_test_dir(root);
    Ok(())
}

#[test]
fn public_api_policy_reports_manifest_drift() -> Result<(), Box<dyn Error>> {
    let root = temp_workspace("public-api");
    remove_test_dir(&root);
    write_distribution_manifest_set(&root)?;

    assert!(public_api_issues(&root)?.is_empty());

    write_text(&root.join("Cargo.toml"), "[workspace.package]\n")?;
    write_text(
        &root.join("crates/tpm-cli/Cargo.toml"),
        "[package]\nname = \"tpm-cli\"\npublish = true\n",
    )?;

    let issues = public_api_issues(&root)?;
    let text = issues.join("\n");
    assert!(text.contains("workspace package policy"));
    assert!(text.contains("directly publishable"));
    assert!(text.contains("inherit the workspace publish policy"));
    assert!(text.contains("package description"));
    assert!(text.contains("inherit workspace lint policy"));

    remove_test_dir(root);
    Ok(())
}

#[test]
fn distribution_readiness_policy_checks_public_release_artifacts() -> Result<(), Box<dyn Error>> {
    let root = temp_workspace("distribution-readiness");
    remove_test_dir(&root);
    let ws = workspace(&root);
    write_distribution_manifest_set(&root)?;
    write_distribution_docs(&root)?;

    assert!(distribution_readiness_issues(&ws)?.is_empty());

    write_text(
        &root.join("examples/platform-entrypoint-consumer/platform-consumer.ts"),
        "export const bad = 'thephilosophersmeme.com';\n",
    )?;
    let issues = distribution_readiness_issues(&ws)?;
    assert!(issues.join("\n").contains("TPM-only boundary"));

    remove_test_dir(root);
    Ok(())
}

#[test]
fn distribution_readiness_reports_artifact_and_recipe_drift() -> Result<(), Box<dyn Error>> {
    let root = temp_workspace("distribution-drift");
    remove_test_dir(&root);
    let ws = workspace(&root);
    write_distribution_manifest_set(&root)?;
    write_distribution_docs(&root)?;

    fs::remove_file(root.join("docs/CLI_DISTRIBUTION.md"))?;
    fs::remove_file(root.join("examples/platform-entrypoint-consumer/platform-consumer.ts"))?;
    write_text(
        &root.join("docs/generated/tpm-cli-reference.md"),
        "# stale\n",
    )?;
    write_text(
        &root.join("docs/STUDIO_TAURI_DISTRIBUTION.md"),
        "# Fixture\n\nsigning\nnotarization\nupdate\n",
    )?;
    write_text(
        &root.join("justfile"),
        "\ncli-reference:\ncli-reference-check:\ncli-release-smoke:\nstudio-package-check:\nrust-public-api-check:\n",
    )?;

    let issues = distribution_readiness_issues(&ws)?;
    let text = issues.join("\n");
    assert!(text.contains("docs/CLI_DISTRIBUTION.md: required distribution document is missing"));
    assert!(text.contains("generated CLI reference is stale"));
    assert!(text.contains("required distribution recipe `distribution-check` is missing"));
    assert!(text.contains("external consumer example is missing"));
    assert!(text.contains("Tauri distribution plan should document secret"));

    fs::remove_file(root.join("justfile"))?;
    let text = distribution_readiness_issues(&ws)?.join("\n");
    assert!(text.contains("justfile: command router is missing"));

    remove_test_dir(root);
    Ok(())
}

#[test]
fn distribution_task_commands_render_success_failure_and_quiet_paths() -> Result<(), Box<dyn Error>>
{
    let _lock = lock_process_state();
    let root = temp_workspace("distribution-commands");
    remove_test_dir(&root);
    write_distribution_manifest_set(&root)?;
    write_distribution_docs(&root)?;
    fs::remove_file(root.join("docs/generated/tpm-cli-reference.md"))?;

    let cwd = CurrentDirGuard::enter(&root)?;

    let (exit, output) = run_text(vec!["cli-reference"]);
    assert_eq!(exit, CommandExit::Success);
    assert!(output.contains("Generated CLI reference at docs/generated/tpm-cli-reference.md"));
    assert_eq!(
        fs::read_to_string(root.join("docs/generated/tpm-cli-reference.md"))?,
        tpm_cli::render_command_reference_markdown()
    );

    let (exit, output) = run_text(vec!["cli-reference-check"]);
    assert_eq!(exit, CommandExit::Success);
    assert!(output.contains("CLI reference check passed."));

    let (exit, output) = run_text(vec!["cli-reference-check", "--quiet"]);
    assert_eq!(exit, CommandExit::Success);
    assert!(output.is_empty());

    let (exit, output) = run_text(vec!["public-api-check"]);
    assert_eq!(exit, CommandExit::Success);
    assert!(output.contains("Public API compatibility policy passed."));

    let (exit, output) = run_text(vec!["distribution-check"]);
    assert_eq!(exit, CommandExit::Success);
    assert!(output.contains("Public distribution readiness check passed."));

    write_text(&root.join("Cargo.toml"), "[workspace.package]\n")?;
    let (exit, output) = run_text(vec!["public-api-check"]);
    assert_eq!(exit, CommandExit::Failure);
    assert!(output.contains("Public API compatibility policy failed."));
    assert!(output.contains("publish = false"));

    fs::remove_file(root.join("justfile"))?;
    let (exit, output) = run_text(vec!["distribution-check"]);
    assert_eq!(exit, CommandExit::Failure);
    assert!(output.contains("Public distribution readiness check failed."));
    assert!(output.contains("justfile: command router is missing"));

    drop(cwd);

    remove_test_dir(root);
    Ok(())
}

#[test]
fn build_raw_plans_astro_and_pagefind_without_spawning_tools() -> Result<(), Box<dyn Error>> {
    let _lock = lock_process_state();
    let root = temp_workspace("build-raw-plan");
    remove_test_dir(&root);
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

    remove_test_dir(root);
    Ok(())
}

#[test]
fn build_raw_skips_pagefind_when_astro_build_fails() -> Result<(), Box<dyn Error>> {
    let _lock = lock_process_state();
    let root = temp_workspace("build-raw-build-fails");
    remove_test_dir(&root);
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

    remove_test_dir(root);
    Ok(())
}

#[test]
fn validate_html_plans_targets_and_reports_external_failures() -> Result<(), Box<dyn Error>> {
    let _lock = lock_process_state();
    let root = temp_workspace("validate-html-plan");
    remove_test_dir(&root);
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

    remove_test_dir(root);
    Ok(())
}

#[test]
fn test_catalog_plans_build_then_playwright_and_reports_failures() -> Result<(), Box<dyn Error>> {
    let _lock = lock_process_state();
    let root = temp_workspace("catalog-plan");
    remove_test_dir(&root);
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

    remove_test_dir(root);
    Ok(())
}

#[test]
fn test_catalog_stops_when_catalog_build_fails() -> Result<(), Box<dyn Error>> {
    let _lock = lock_process_state();
    let root = temp_workspace("catalog-build-fails");
    remove_test_dir(&root);
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

    remove_test_dir(root);
    Ok(())
}

#[test]
fn test_flake_plans_randomized_bun_test_pass() -> Result<(), Box<dyn Error>> {
    let _lock = lock_process_state();
    let root = temp_workspace("flake-plan");
    remove_test_dir(&root);
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

    remove_test_dir(root);
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
    remove_test_dir(&root);
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

    remove_test_dir(root);
    Ok(())
}

#[test]
fn redirect_collection_merges_configured_and_legacy_rules() -> Result<(), Box<dyn Error>> {
    let root = temp_workspace("redirects");
    remove_test_dir(&root);
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

    remove_test_dir(root);
    Ok(())
}

#[test]
fn content_verification_reports_author_tag_path_and_media_issues() -> Result<(), Box<dyn Error>> {
    let root = temp_workspace("content");
    remove_test_dir(&root);
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

    remove_test_dir(root);
    Ok(())
}

#[test]
fn tag_normalization_handles_dry_run_write_and_invalid_tags() -> Result<(), Box<dyn Error>> {
    let root = temp_workspace("tags");
    remove_test_dir(&root);
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

    remove_test_dir(root);
    Ok(())
}

#[test]
fn asset_reference_helpers_resolve_shared_unused_and_ignored_images() -> Result<(), Box<dyn Error>>
{
    let root = temp_workspace("assets");
    remove_test_dir(&root);
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

    remove_test_dir(root);
    Ok(())
}

#[test]
fn image_duplicate_and_optimizer_helpers_cover_review_paths() -> Result<(), Box<dyn Error>> {
    let root = temp_workspace("images");
    remove_test_dir(&root);
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

    remove_test_dir(root);
    Ok(())
}

#[test]
#[expect(
    clippy::too_many_lines,
    reason = "broad repository command fixture covers the remaining process-planning paths until this legacy module is split further"
)]
fn repository_task_commands_cover_local_success_and_review_paths() -> Result<(), Box<dyn Error>> {
    let _lock = PROCESS_STATE_LOCK
        .lock()
        .expect("process state lock should not be poisoned");
    let root = temp_workspace("commands");
    remove_test_dir(&root);

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
    write_text(
        &root.join("node_modules/.astro/data-store.json"),
        r#"{"collections":true}"#,
    )?;
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
    assert_eq!(
        fs::read_to_string(root.join(".astro/data-store.json"))?,
        r#"{"collections":true}"#
    );

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

    remove_test_dir(root);
    Ok(())
}

#[test]
fn sync_astro_test_store_reports_missing_production_store() -> Result<(), Box<dyn Error>> {
    let _lock = lock_process_state();
    let root = temp_workspace("sync-astro-test-store-missing");
    remove_test_dir(&root);
    fs::create_dir_all(&root)?;

    let _cwd = CurrentDirGuard::enter(&root)?;
    let (exit, output) = run_text(vec!["sync-astro-test-store"]);

    assert_eq!(exit, CommandExit::Failure);
    assert!(output.contains("node_modules/.astro/data-store.json"));
    assert!(output.contains("astro sync --force"));

    remove_test_dir(root);
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
