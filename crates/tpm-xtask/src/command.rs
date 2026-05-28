#![expect(
    clippy::redundant_pub_crate,
    reason = "xtask keeps sibling modules internal while sharing focused implementation seams"
)]

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

impl RemovedTask {
    pub(crate) fn parse(name: &str) -> Option<Self> {
        match name {
            "payload-critical-css-experiment" => Some(Self::PayloadCriticalCssExperiment),
            "payload-minify-html-experiment" => Some(Self::PayloadMinifyHtmlExperiment),
            "payload-minify-html-experiments" => Some(Self::PayloadMinifyHtmlExperiments),
            "payload-postbuild-experiments" => Some(Self::PayloadPostbuildExperiments),
            "payload-vite-experiments" => Some(Self::PayloadViteExperiments),
            "references-audit" => Some(Self::ReferencesAudit),
            "references-bibtex-audit" => Some(Self::ReferencesBibtexAudit),
            "references-catalog" => Some(Self::ReferencesCatalog),
            "references-migrate-mechanical" => Some(Self::ReferencesMigrateMechanical),
            _ => None,
        }
    }

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
    use super::RemovedTask;

    #[test]
    fn parses_removed_tasks_separately_from_unknown_names() {
        assert_eq!(
            RemovedTask::parse("payload-postbuild-experiments"),
            Some(RemovedTask::PayloadPostbuildExperiments)
        );
        assert_eq!(RemovedTask::parse("missing-task"), None);
    }

    #[test]
    fn removed_task_names_roundtrip() {
        for (name, task) in [
            (
                "payload-critical-css-experiment",
                RemovedTask::PayloadCriticalCssExperiment,
            ),
            (
                "payload-minify-html-experiment",
                RemovedTask::PayloadMinifyHtmlExperiment,
            ),
            (
                "payload-minify-html-experiments",
                RemovedTask::PayloadMinifyHtmlExperiments,
            ),
            (
                "payload-postbuild-experiments",
                RemovedTask::PayloadPostbuildExperiments,
            ),
            (
                "payload-vite-experiments",
                RemovedTask::PayloadViteExperiments,
            ),
            ("references-audit", RemovedTask::ReferencesAudit),
            (
                "references-bibtex-audit",
                RemovedTask::ReferencesBibtexAudit,
            ),
            ("references-catalog", RemovedTask::ReferencesCatalog),
            (
                "references-migrate-mechanical",
                RemovedTask::ReferencesMigrateMechanical,
            ),
        ] {
            assert_eq!(RemovedTask::parse(name), Some(task));
            assert_eq!(task.name(), name);
        }
    }
}
