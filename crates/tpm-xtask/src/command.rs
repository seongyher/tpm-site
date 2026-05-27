#![expect(
    clippy::redundant_pub_crate,
    reason = "xtask keeps sibling modules internal while sharing focused implementation seams"
)]

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum InternalTask {
    AssetsDuplicates,
    AssetsLocations,
    AssetsShared,
    AssetsUnused,
    BuildCloudflare,
    BuildOptimize,
    BuildRaw,
    CatalogCheck,
    ContentCheck,
    CoverageVerify,
    DiagnosticsDiff,
    DocsReferences,
    DocsReferencesCheck,
    MigrationBaseline,
    OutputVerify,
    PayloadCheck,
    PayloadReport,
    PlatformCheck,
    QaRegistry,
    SiteSchema,
    SiteSchemaCheck,
    StartersCheck,
    SyncAstroTestStore,
    TagsCheck,
    TagsNormalize,
    TestAccountability,
    TestAccountabilityRelease,
    TestCatalog,
    TestFlake,
    ValidateHtml,
    Verify,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum RemovedTask {
    PayloadCriticalCssExperiment,
    PayloadMinifyHtmlExperiment,
    PayloadMinifyHtmlExperiments,
    PayloadPostbuildExperiments,
    PayloadViteExperiments,
    ReferencesAudit,
    ReferencesBibtexAudit,
    ReferencesCatalog,
    ReferencesMigrateMechanical,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) enum TaskParseResult<'a> {
    Active(InternalTask),
    Removed(RemovedTask),
    Unknown(&'a str),
}

impl InternalTask {
    pub(crate) fn parse(name: &str) -> TaskParseResult<'_> {
        match name {
            "assets-duplicates" => TaskParseResult::Active(Self::AssetsDuplicates),
            "assets-locations" => TaskParseResult::Active(Self::AssetsLocations),
            "assets-shared" => TaskParseResult::Active(Self::AssetsShared),
            "assets-unused" => TaskParseResult::Active(Self::AssetsUnused),
            "build-cloudflare" => TaskParseResult::Active(Self::BuildCloudflare),
            "build-optimize" => TaskParseResult::Active(Self::BuildOptimize),
            "build-raw" => TaskParseResult::Active(Self::BuildRaw),
            "catalog-check" => TaskParseResult::Active(Self::CatalogCheck),
            "content-check" => TaskParseResult::Active(Self::ContentCheck),
            "coverage-verify" => TaskParseResult::Active(Self::CoverageVerify),
            "diagnostics-diff" => TaskParseResult::Active(Self::DiagnosticsDiff),
            "docs-references" => TaskParseResult::Active(Self::DocsReferences),
            "docs-references-check" => TaskParseResult::Active(Self::DocsReferencesCheck),
            "migration-baseline" => TaskParseResult::Active(Self::MigrationBaseline),
            "output-verify" => TaskParseResult::Active(Self::OutputVerify),
            "payload-check" => TaskParseResult::Active(Self::PayloadCheck),
            "payload-report" => TaskParseResult::Active(Self::PayloadReport),
            "platform-check" => TaskParseResult::Active(Self::PlatformCheck),
            "qa-registry" => TaskParseResult::Active(Self::QaRegistry),
            "site-schema" => TaskParseResult::Active(Self::SiteSchema),
            "site-schema-check" => TaskParseResult::Active(Self::SiteSchemaCheck),
            "starters-check" => TaskParseResult::Active(Self::StartersCheck),
            "sync-astro-test-store" => TaskParseResult::Active(Self::SyncAstroTestStore),
            "tags-check" => TaskParseResult::Active(Self::TagsCheck),
            "tags-normalize" => TaskParseResult::Active(Self::TagsNormalize),
            "test-accountability" => TaskParseResult::Active(Self::TestAccountability),
            "test-accountability-release" => {
                TaskParseResult::Active(Self::TestAccountabilityRelease)
            }
            "test-catalog" => TaskParseResult::Active(Self::TestCatalog),
            "test-flake" => TaskParseResult::Active(Self::TestFlake),
            "validate-html" => TaskParseResult::Active(Self::ValidateHtml),
            "verify" => TaskParseResult::Active(Self::Verify),
            "payload-critical-css-experiment" => {
                TaskParseResult::Removed(RemovedTask::PayloadCriticalCssExperiment)
            }
            "payload-minify-html-experiment" => {
                TaskParseResult::Removed(RemovedTask::PayloadMinifyHtmlExperiment)
            }
            "payload-minify-html-experiments" => {
                TaskParseResult::Removed(RemovedTask::PayloadMinifyHtmlExperiments)
            }
            "payload-postbuild-experiments" => {
                TaskParseResult::Removed(RemovedTask::PayloadPostbuildExperiments)
            }
            "payload-vite-experiments" => {
                TaskParseResult::Removed(RemovedTask::PayloadViteExperiments)
            }
            "references-audit" => TaskParseResult::Removed(RemovedTask::ReferencesAudit),
            "references-bibtex-audit" => {
                TaskParseResult::Removed(RemovedTask::ReferencesBibtexAudit)
            }
            "references-catalog" => TaskParseResult::Removed(RemovedTask::ReferencesCatalog),
            "references-migrate-mechanical" => {
                TaskParseResult::Removed(RemovedTask::ReferencesMigrateMechanical)
            }
            _ => TaskParseResult::Unknown(name),
        }
    }
}

impl RemovedTask {
    pub(crate) const fn name(self) -> &'static str {
        match self {
            Self::PayloadCriticalCssExperiment => "payload-critical-css-experiment",
            Self::PayloadMinifyHtmlExperiment => "payload-minify-html-experiment",
            Self::PayloadMinifyHtmlExperiments => "payload-minify-html-experiments",
            Self::PayloadPostbuildExperiments => "payload-postbuild-experiments",
            Self::PayloadViteExperiments => "payload-vite-experiments",
            Self::ReferencesAudit => "references-audit",
            Self::ReferencesBibtexAudit => "references-bibtex-audit",
            Self::ReferencesCatalog => "references-catalog",
            Self::ReferencesMigrateMechanical => "references-migrate-mechanical",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{InternalTask, RemovedTask, TaskParseResult};

    #[test]
    fn parses_active_tasks_as_typed_values() {
        assert_eq!(
            InternalTask::parse("coverage-verify"),
            TaskParseResult::Active(InternalTask::CoverageVerify)
        );
    }

    #[test]
    fn classifies_removed_tasks_separately_from_unknown_names() {
        assert_eq!(
            InternalTask::parse("payload-postbuild-experiments"),
            TaskParseResult::Removed(RemovedTask::PayloadPostbuildExperiments)
        );
        assert_eq!(
            InternalTask::parse("missing-task"),
            TaskParseResult::Unknown("missing-task")
        );
    }
}
