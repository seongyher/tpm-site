//! Clap command tree for internal TPM repository automation.

#![expect(
    clippy::redundant_pub_crate,
    reason = "xtask command variants are shared across internal parser and dispatch modules"
)]

use clap::{Parser, Subcommand};

use crate::cli::args::{
    DiagnosticsDiffArgs, DuplicateAssetsArgs, HtmlDirArgs, NoArgs, OperationArgs, OutputDirArgs,
    QuietArgs, SchemaArgs, TestCatalogArgs, TestFlakeArgs, UnusedAssetsArgs,
};

const LONG_ABOUT: &str = "\
Internal repository automation for TPM development.

This binary is internal plumbing for repository `just` recipes. It is not the
user-facing `tpm` product CLI.

Run `just --list` for supported developer workflows.";

#[derive(Clone, Debug, Eq, Parser, PartialEq)]
#[command(
    name = "tpm-xtask",
    about = "Internal repository automation for TPM development",
    long_about = LONG_ABOUT,
    color = clap::ColorChoice::Never
)]
pub(crate) struct XtaskCli {
    #[command(subcommand)]
    pub(crate) command: XtaskCommand,
}

#[derive(Clone, Debug, Eq, PartialEq, Subcommand)]
pub(crate) enum XtaskCommand {
    #[command(name = "assets-duplicates")]
    AssetsDuplicates(DuplicateAssetsArgs),
    #[command(name = "assets-locations")]
    AssetsLocations(QuietArgs),
    #[command(name = "assets-shared")]
    AssetsShared(QuietArgs),
    #[command(name = "assets-unused")]
    AssetsUnused(UnusedAssetsArgs),
    #[command(name = "build-cloudflare")]
    BuildCloudflare(OutputDirArgs),
    #[command(name = "build-optimize")]
    BuildOptimize(OutputDirArgs),
    #[command(name = "build-raw")]
    BuildRaw(OutputDirArgs),
    #[command(name = "catalog-check")]
    CatalogCheck(QuietArgs),
    #[command(name = "content-check")]
    ContentCheck(QuietArgs),
    #[command(name = "coverage-verify")]
    CoverageVerify(QuietArgs),
    #[command(name = "diagnostics-diff")]
    DiagnosticsDiff(DiagnosticsDiffArgs),
    #[command(name = "docs-references")]
    DocsReferences(QuietArgs),
    #[command(name = "docs-references-check")]
    DocsReferencesCheck(QuietArgs),
    #[command(name = "migration-baseline")]
    MigrationBaseline(OperationArgs),
    #[command(name = "output-verify")]
    OutputVerify(OperationArgs),
    #[command(name = "payload-check")]
    PayloadCheck(OutputDirArgs),
    #[command(name = "payload-report")]
    PayloadReport(OutputDirArgs),
    #[command(name = "platform-check")]
    PlatformCheck(QuietArgs),
    #[command(name = "qa-registry")]
    QaRegistry(OperationArgs),
    #[command(name = "site-schema")]
    SiteSchema(SchemaArgs),
    #[command(name = "site-schema-check")]
    SiteSchemaCheck(SchemaArgs),
    #[command(name = "starters-check")]
    StartersCheck(QuietArgs),
    #[command(name = "sync-astro-test-store")]
    SyncAstroTestStore(NoArgs),
    #[command(name = "tags-check")]
    TagsCheck(QuietArgs),
    #[command(name = "tags-normalize")]
    TagsNormalize(QuietArgs),
    #[command(name = "test-accountability")]
    TestAccountability(QuietArgs),
    #[command(name = "test-accountability-release")]
    TestAccountabilityRelease(QuietArgs),
    #[command(name = "test-catalog")]
    TestCatalog(TestCatalogArgs),
    #[command(name = "test-flake")]
    TestFlake(TestFlakeArgs),
    #[command(name = "validate-html")]
    ValidateHtml(HtmlDirArgs),
    #[command(name = "verify")]
    Verify(OutputDirArgs),
}
