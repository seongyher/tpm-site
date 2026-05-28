use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use crate::frontmatter::Frontmatter;
use crate::tags::{
    is_url_safe_slug, normalize_author_alias, normalize_tag_list, replace_tags_block,
    tag_diagnostics,
};

use super::filesystem::{collect_files_with_extensions, relative_display};
use super::workspace::Workspace;

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct ContentVerification {
    pub(super) draft_count: usize,
    pub(super) issues: Vec<String>,
    pub(super) published_count: usize,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct TagNormalization {
    pub(super) changed_files: Vec<String>,
    pub(super) issues: Vec<String>,
    pub(super) scanned_files: usize,
}

pub(super) fn verify_content(workspace: &Workspace) -> io::Result<ContentVerification> {
    let articles =
        collect_files_with_extensions(&workspace.site.join("content/articles"), &["md", "mdx"])?;
    let authors = collect_files_with_extensions(&workspace.site.join("content/authors"), &["md"])?;
    let categories =
        collect_files_with_extensions(&workspace.site.join("content/categories"), &["json"])?;
    let mut issues = Vec::new();
    let mut seen_slugs = BTreeMap::<String, String>::new();
    let author_aliases = load_author_aliases(workspace, &authors, &mut issues)?;
    let mut draft_count = 0;

    for file in authors {
        if !is_url_safe_slug(
            file.file_stem()
                .and_then(|stem| stem.to_str())
                .unwrap_or_default(),
        ) {
            issues.push(format!(
                "{}: author metadata filename stem is not URL-safe",
                relative_display(&workspace.root, &file)
            ));
        }
    }

    for file in categories {
        if !is_url_safe_slug(
            file.file_stem()
                .and_then(|stem| stem.to_str())
                .unwrap_or_default(),
        ) {
            issues.push(format!(
                "{}: category metadata filename stem is not URL-safe",
                relative_display(&workspace.root, &file)
            ));
        }
    }

    for file in &articles {
        validate_article_path(workspace, file, &mut seen_slugs, &mut issues);
        let text = fs::read_to_string(file)?;
        let frontmatter = Frontmatter::parse(&text);
        if frontmatter
            .as_ref()
            .and_then(|data| data.bool_value("draft"))
            == Some(true)
        {
            draft_count += 1;
        }
        validate_article_author(
            workspace,
            file,
            frontmatter.as_ref(),
            &author_aliases,
            &mut issues,
        );
        validate_article_tags(workspace, file, frontmatter.as_ref(), &mut issues);
        validate_markdown_image_paragraphs(workspace, file, &text, &mut issues);
    }

    Ok(ContentVerification {
        draft_count,
        published_count: articles.len().saturating_sub(draft_count),
        issues,
    })
}

fn load_author_aliases(
    workspace: &Workspace,
    author_files: &[PathBuf],
    issues: &mut Vec<String>,
) -> io::Result<BTreeSet<String>> {
    let mut aliases = BTreeSet::new();
    for file in author_files {
        let text = fs::read_to_string(file)?;
        let frontmatter = Frontmatter::parse(&text);
        if let Some(display_name) = frontmatter
            .as_ref()
            .and_then(|data| data.scalar("displayName"))
        {
            aliases.insert(normalize_author_alias(&display_name));
        } else {
            issues.push(format!(
                "{}: author metadata needs a displayName",
                relative_display(&workspace.root, file)
            ));
        }
        if let Some(author_aliases) = frontmatter.as_ref().and_then(|data| data.list("aliases")) {
            for alias in author_aliases {
                aliases.insert(normalize_author_alias(&alias));
            }
        }
    }
    Ok(aliases)
}

fn validate_article_path(
    workspace: &Workspace,
    file: &Path,
    seen_slugs: &mut BTreeMap<String, String>,
    issues: &mut Vec<String>,
) {
    let relative = relative_display(&workspace.site.join("content/articles"), file);
    let slug = file
        .file_stem()
        .and_then(|stem| stem.to_str())
        .unwrap_or_default();
    let category = relative.split('/').next().unwrap_or_default();

    if !is_url_safe_slug(slug) {
        issues.push(format!("{relative}: filename stem is not URL-safe"));
    }
    if !is_url_safe_slug(category) {
        issues.push(format!("{relative}: category folder is not URL-safe"));
    }
    if let Some(previous) = seen_slugs.insert(slug.to_owned(), relative.clone()) {
        issues.push(format!(
            "{relative}: duplicate article slug also used by {previous}"
        ));
    }
}

fn validate_article_author(
    workspace: &Workspace,
    file: &Path,
    frontmatter: Option<&Frontmatter>,
    aliases: &BTreeSet<String>,
    issues: &mut Vec<String>,
) {
    let relative = relative_display(&workspace.root, file);
    let Some(author) = frontmatter.and_then(|data| data.scalar("author")) else {
        issues.push(format!("{relative}: article needs an author"));
        return;
    };
    let missing = author
        .split('&')
        .map(str::trim)
        .filter(|name| !name.is_empty())
        .filter(|name| !aliases.contains(&normalize_author_alias(name)))
        .collect::<Vec<_>>();

    if !missing.is_empty() {
        issues.push(format!(
            "{relative}: article author `{}` does not match an author profile alias",
            missing.join(" & ")
        ));
    }
}

fn validate_article_tags(
    workspace: &Workspace,
    file: &Path,
    frontmatter: Option<&Frontmatter>,
    issues: &mut Vec<String>,
) {
    let relative = relative_display(&workspace.root, file);
    let Some(frontmatter) = frontmatter else {
        return;
    };
    let Some(tags) = frontmatter.list("tags") else {
        return;
    };
    for diagnostic in tag_diagnostics(&tags) {
        issues.push(format!(
            "{relative}: article tag \"{}\" at index {} is invalid: {}",
            diagnostic.value, diagnostic.index, diagnostic.message
        ));
    }
}

fn validate_markdown_image_paragraphs(
    workspace: &Workspace,
    file: &Path,
    text: &str,
    issues: &mut Vec<String>,
) {
    for (index, line) in text.lines().enumerate() {
        let trimmed = line.trim();
        if trimmed.starts_with("![") && trimmed.contains("](") && !trimmed.ends_with(')') {
            issues.push(format!(
                "{}:{}: Markdown image paragraph has trailing content; wrap complex media manually",
                relative_display(&workspace.root, file),
                index + 1
            ));
        }
    }
}

pub(super) fn normalize_tags(workspace: &Workspace, write: bool) -> io::Result<TagNormalization> {
    let article_root = workspace.site.join("content/articles");
    let files = collect_files_with_extensions(&article_root, &["md", "mdx"])?;
    let mut changed_files = Vec::new();
    let mut issues = Vec::new();

    for file in &files {
        let text = fs::read_to_string(file)?;
        let Some(frontmatter) = Frontmatter::parse(&text) else {
            continue;
        };
        let Some(tags) = frontmatter.list("tags") else {
            continue;
        };
        let normalized = normalize_tag_list(&tags);
        for diagnostic in normalized.diagnostics {
            issues.push(format!(
                "{}: article tag \"{}\" at index {} is invalid: {}",
                relative_display(&workspace.root, file),
                diagnostic.value,
                diagnostic.index,
                diagnostic.message
            ));
        }
        if normalized.tags != tags {
            changed_files.push(relative_display(&workspace.root, file));
            if write
                && issues.is_empty()
                && let Some(next_text) = replace_tags_block(&text, &normalized.tags)
            {
                fs::write(file, next_text)?;
            }
        }
    }

    Ok(TagNormalization {
        changed_files,
        issues,
        scanned_files: files.len(),
    })
}
