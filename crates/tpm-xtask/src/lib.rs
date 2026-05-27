//! Internal repository automation library for TPM development.

pub(crate) mod accountability;
pub(crate) mod args;
pub(crate) mod command;
pub(crate) mod coverage;
pub(crate) mod frontmatter;
pub(crate) mod operation_adapter;
pub(crate) mod redirects;
pub(crate) mod routes;
pub(crate) mod tags;

/// Internal task dispatcher and task implementations.
pub mod tasks;
