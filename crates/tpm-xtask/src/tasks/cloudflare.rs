use std::collections::BTreeMap;
use std::fs;
use std::io::{self, Write};
use std::path::Path;

use tpm_core::CommandExit;

use crate::cli::args::OutputDirArgs;
use crate::frontmatter::Frontmatter;
use crate::redirects::{RedirectRule, normalize_redirect_path, with_trailing_slash};

use super::filesystem::{collect_files_with_extensions, relative_display};
use super::workspace::{Workspace, output_dir_arg};

pub(super) fn collect_redirects(workspace: &Workspace) -> io::Result<Vec<RedirectRule>> {
    let mut rules = BTreeMap::<String, RedirectRule>::new();
    let configured = workspace.site.join("config/redirects.json");
    if configured.is_file() {
        let text = fs::read_to_string(configured)?;
        let parsed: BTreeMap<String, String> =
            serde_json::from_str(&text).map_err(io::Error::other)?;
        for (source, destination) in parsed {
            insert_redirect(
                &mut rules,
                normalize_redirect_path(&source),
                destination.trim().to_owned(),
            )?;
        }
    }
    collect_legacy_redirects(
        &workspace.root,
        &workspace.site.join("content/articles"),
        "/articles/",
        &mut rules,
    )?;
    collect_legacy_redirects(
        &workspace.root,
        &workspace.site.join("content/announcements"),
        "/announcements/",
        &mut rules,
    )?;
    Ok(rules.into_values().collect())
}

pub(super) fn build_cloudflare<W>(args: &OutputDirArgs, output: &mut W) -> io::Result<CommandExit>
where
    W: Write,
{
    let workspace = Workspace::discover()?;
    let output_dir = output_dir_arg(args.dir.as_deref(), &workspace);
    let redirects = collect_redirects(&workspace)?;
    let text = crate::redirects::format_redirects(&redirects);
    fs::create_dir_all(&output_dir)?;
    let output_path = output_dir.join("_redirects");
    fs::write(&output_path, text)?;

    if !args.quiet {
        writeln!(
            output,
            "Wrote {} Cloudflare redirects to {}.",
            redirects.len(),
            output_path.display()
        )?;
    }

    Ok(CommandExit::Success)
}

fn collect_legacy_redirects(
    root: &Path,
    dir: &Path,
    route_prefix: &str,
    rules: &mut BTreeMap<String, RedirectRule>,
) -> io::Result<()> {
    if !dir.is_dir() {
        return Ok(());
    }

    for file in collect_files_with_extensions(dir, &["md", "mdx"])? {
        let text = fs::read_to_string(&file)?;
        let Some(frontmatter) = Frontmatter::parse(&text) else {
            continue;
        };
        let Some(legacy) = frontmatter.scalar("legacyPermalink") else {
            continue;
        };
        let source = normalize_redirect_path(&legacy);
        let destination = with_trailing_slash(&format!(
            "{route_prefix}{}",
            file.file_stem()
                .and_then(|stem| stem.to_str())
                .unwrap_or_default()
        ));
        insert_redirect(rules, source, destination).map_err(|error| {
            io::Error::new(
                io::ErrorKind::InvalidData,
                format!("{}: {error}", relative_display(root, &file)),
            )
        })?;
    }

    Ok(())
}

fn insert_redirect(
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
