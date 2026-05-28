//! Typed command parser for internal TPM repository automation.

#![expect(
    clippy::redundant_pub_crate,
    reason = "xtask parser modules are private to the crate but shared by sibling modules"
)]

pub(crate) mod args;
pub(crate) mod commands;
pub(crate) mod compatibility;
pub(crate) mod error;

use std::ffi::OsString;

use clap::Parser as _;

pub(crate) use self::commands::XtaskCommand;

use self::commands::XtaskCli;

/// Parses a raw xtask argument list into a typed command.
pub(crate) fn parse_command(args: Vec<OsString>) -> Result<XtaskCommand, clap::Error> {
    let invocation_args = std::iter::once(OsString::from("tpm-xtask"))
        .chain(args)
        .collect::<Vec<_>>();

    XtaskCli::try_parse_from(invocation_args).map(|cli| cli.command)
}

#[cfg(test)]
mod tests {
    #![expect(
        clippy::expect_used,
        reason = "parser tests assert fixture command shapes parse or fail deterministically"
    )]

    use std::ffi::OsString;
    use std::path::PathBuf;

    use super::{XtaskCommand, parse_command};
    use crate::operation_adapter::OperationOutputFormat;

    fn args(values: &[&str]) -> Vec<OsString> {
        values.iter().map(OsString::from).collect()
    }

    fn parse_ok(values: &[&str]) -> XtaskCommand {
        parse_command(args(values)).expect("xtask command should parse")
    }

    fn parse_error(values: &[&str]) -> clap::Error {
        parse_command(args(values)).expect_err("xtask command should fail")
    }

    fn command_name(command: &XtaskCommand) -> &'static str {
        match command {
            XtaskCommand::AssetsDuplicates(_) => "assets-duplicates",
            XtaskCommand::AssetsLocations(_) => "assets-locations",
            XtaskCommand::AssetsShared(_) => "assets-shared",
            XtaskCommand::AssetsUnused(_) => "assets-unused",
            XtaskCommand::BuildCloudflare(_) => "build-cloudflare",
            XtaskCommand::BuildOptimize(_) => "build-optimize",
            XtaskCommand::BuildRaw(_) => "build-raw",
            XtaskCommand::CatalogCheck(_) => "catalog-check",
            XtaskCommand::ContentCheck(_) => "content-check",
            XtaskCommand::CoverageVerify(_) => "coverage-verify",
            XtaskCommand::DiagnosticsDiff(_) => "diagnostics-diff",
            XtaskCommand::DocsReferences(_) => "docs-references",
            XtaskCommand::DocsReferencesCheck(_) => "docs-references-check",
            XtaskCommand::MigrationBaseline(_) => "migration-baseline",
            XtaskCommand::OutputVerify(_) => "output-verify",
            XtaskCommand::PayloadCheck(_) => "payload-check",
            XtaskCommand::PayloadReport(_) => "payload-report",
            XtaskCommand::PlatformCheck(_) => "platform-check",
            XtaskCommand::QaRegistry(_) => "qa-registry",
            XtaskCommand::SiteSchema(_) => "site-schema",
            XtaskCommand::SiteSchemaCheck(_) => "site-schema-check",
            XtaskCommand::StartersCheck(_) => "starters-check",
            XtaskCommand::SyncAstroTestStore(_) => "sync-astro-test-store",
            XtaskCommand::TagsCheck(_) => "tags-check",
            XtaskCommand::TagsNormalize(_) => "tags-normalize",
            XtaskCommand::TestAccountability(_) => "test-accountability",
            XtaskCommand::TestAccountabilityRelease(_) => "test-accountability-release",
            XtaskCommand::TestCatalog(_) => "test-catalog",
            XtaskCommand::TestFlake(_) => "test-flake",
            XtaskCommand::ValidateHtml(_) => "validate-html",
            XtaskCommand::Verify(_) => "verify",
        }
    }

    #[test]
    fn parses_active_command_args_as_typed_values() {
        let command = parse_ok(&["build-raw", "--dir", "dist-test", "--quiet"]);

        let XtaskCommand::BuildRaw(args) = command else {
            panic!("expected build-raw command");
        };

        assert_eq!(args.dir, Some(PathBuf::from("dist-test")));
        assert!(args.quiet);
    }

    #[test]
    fn parses_documented_active_command_shapes() {
        for (expected_name, values) in [
            (
                "assets-duplicates",
                vec!["assets-duplicates", "--quiet", "--fail-on-duplicates"],
            ),
            ("assets-locations", vec!["assets-locations", "--quiet"]),
            ("assets-shared", vec!["assets-shared", "--quiet"]),
            (
                "assets-unused",
                vec!["assets-unused", "--quiet", "--fail-on-unused"],
            ),
            (
                "build-cloudflare",
                vec!["build-cloudflare", "--dir", "dist-test", "--quiet"],
            ),
            (
                "build-optimize",
                vec!["build-optimize", "--dir", "dist-test", "--quiet"],
            ),
            (
                "build-raw",
                vec!["build-raw", "--dir", "dist-test", "--quiet"],
            ),
            ("catalog-check", vec!["catalog-check", "--quiet"]),
            ("content-check", vec!["content-check", "--quiet"]),
            ("coverage-verify", vec!["coverage-verify", "--quiet"]),
            (
                "diagnostics-diff",
                vec![
                    "diagnostics-diff",
                    "expected.json",
                    "actual.json",
                    "--site",
                    "examples/docs-site",
                    "--format",
                    "ndjson",
                ],
            ),
            ("docs-references", vec!["docs-references", "--quiet"]),
            (
                "docs-references-check",
                vec!["docs-references-check", "--quiet"],
            ),
            (
                "migration-baseline",
                vec!["migration-baseline", "--format", "text"],
            ),
            ("output-verify", vec!["output-verify", "--format", "ndjson"]),
            (
                "payload-check",
                vec!["payload-check", "--dir", "dist-test", "--quiet"],
            ),
            (
                "payload-report",
                vec!["payload-report", "--dir", "dist-test", "--quiet"],
            ),
            ("platform-check", vec!["platform-check", "--quiet"]),
            ("qa-registry", vec!["qa-registry"]),
            (
                "site-schema",
                vec![
                    "site-schema",
                    "--output",
                    "site/config/schema.json",
                    "--quiet",
                ],
            ),
            (
                "site-schema-check",
                vec![
                    "site-schema-check",
                    "--output",
                    "site/config/schema.json",
                    "--quiet",
                ],
            ),
            ("starters-check", vec!["starters-check", "--quiet"]),
            ("sync-astro-test-store", vec!["sync-astro-test-store"]),
            ("tags-check", vec!["tags-check", "--quiet"]),
            ("tags-normalize", vec!["tags-normalize", "--quiet"]),
            (
                "test-accountability",
                vec!["test-accountability", "--quiet"],
            ),
            (
                "test-accountability-release",
                vec!["test-accountability-release", "--quiet"],
            ),
            ("test-catalog", vec!["test-catalog", "--grep", "navigation"]),
            (
                "test-flake",
                vec!["test-flake", "--runs", "2", "--seed", "fixed"],
            ),
            ("validate-html", vec!["validate-html", "--dir", "dist-test"]),
            ("verify", vec!["verify", "--dir", "dist-test", "--quiet"]),
        ] {
            let command = parse_ok(&values);

            assert_eq!(command_name(&command), expected_name);
        }
    }

    #[test]
    fn parses_operation_args_and_json_alias() {
        let command = parse_ok(&[
            "migration-baseline",
            "--site",
            "examples/docs-site",
            "--json",
            "--quiet",
            "--ci",
        ]);

        let XtaskCommand::MigrationBaseline(args) = command else {
            panic!("expected migration-baseline command");
        };
        let options = args.into_options();

        assert_eq!(options.site, PathBuf::from("examples/docs-site"));
        assert_eq!(options.format, OperationOutputFormat::Json);
    }

    #[test]
    fn rejects_conflicting_operation_format_flags() {
        let error = parse_error(&["migration-baseline", "--json", "--format", "text"]);

        assert_eq!(error.kind(), clap::error::ErrorKind::ArgumentConflict);
    }

    #[test]
    fn rejects_unknown_flags_before_dispatch() {
        let error = parse_error(&["content-check", "--wat"]);

        assert_eq!(error.kind(), clap::error::ErrorKind::UnknownArgument);
    }

    #[test]
    fn keeps_catalog_test_args_as_explicit_pass_through_values() {
        let command = parse_ok(&["test-catalog", "--grep", "navigation"]);

        let XtaskCommand::TestCatalog(args) = command else {
            panic!("expected test-catalog command");
        };

        assert_eq!(
            args.extra_args,
            vec![OsString::from("--grep"), OsString::from("navigation")]
        );
    }

    #[test]
    fn rejects_payload_dist_compatibility_alias() {
        let error = parse_error(&["payload-report", "--dist", "dist-test"]);

        assert_eq!(error.kind(), clap::error::ErrorKind::UnknownArgument);
    }

    #[test]
    fn rejects_zero_test_flake_runs() {
        let error = parse_error(&["test-flake", "--runs", "0"]);

        assert_eq!(error.kind(), clap::error::ErrorKind::ValueValidation);
    }
}
