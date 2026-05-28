//! Tag normalization and validation rules for source content checks.

#![expect(
    clippy::redundant_pub_crate,
    reason = "crate-visible tag seams are shared with the task adapter while the crate denies unreachable public items"
)]

use std::collections::{BTreeMap, BTreeSet};

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct TagDiagnostic {
    pub(crate) index: usize,
    pub(crate) message: &'static str,
    pub(crate) value: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct TagListNormalization {
    pub(crate) diagnostics: Vec<TagDiagnostic>,
    pub(crate) tags: Vec<String>,
}

pub(crate) fn tag_diagnostics(tags: &[String]) -> Vec<TagDiagnostic> {
    let mut seen = BTreeMap::<String, usize>::new();
    let mut diagnostics = Vec::new();
    for (index, tag) in tags.iter().enumerate() {
        let normalized = normalize_tag(tag);
        if normalized.is_empty() {
            diagnostics.push(TagDiagnostic {
                index,
                message: "tag must not be empty",
                value: tag.clone(),
            });
            continue;
        }
        if tag.contains('/') {
            diagnostics.push(TagDiagnostic {
                index,
                message: "tag must not contain \"/\"",
                value: tag.clone(),
            });
        }
        if *tag != normalized {
            diagnostics.push(TagDiagnostic {
                index,
                message: "tag must be canonical",
                value: tag.clone(),
            });
        }
        if seen.insert(normalized, index).is_some() {
            diagnostics.push(TagDiagnostic {
                index,
                message: "duplicate canonical tag",
                value: tag.clone(),
            });
        }
    }
    diagnostics
}

pub(crate) fn normalize_tag_list(tags: &[String]) -> TagListNormalization {
    let mut diagnostics = Vec::new();
    let mut seen = BTreeSet::<String>::new();
    let mut normalized_tags = Vec::new();
    for (index, tag) in tags.iter().enumerate() {
        let normalized = normalize_tag(tag);
        if normalized.is_empty() {
            diagnostics.push(TagDiagnostic {
                index,
                message: "tag must not be empty",
                value: tag.clone(),
            });
            continue;
        }
        if tag.contains('/') {
            diagnostics.push(TagDiagnostic {
                index,
                message: "tag must not contain \"/\"",
                value: tag.clone(),
            });
        }
        if seen.insert(normalized.clone()) {
            normalized_tags.push(normalized);
        }
    }
    TagListNormalization {
        diagnostics,
        tags: normalized_tags,
    }
}

fn normalize_tag(value: &str) -> String {
    value
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .to_lowercase()
}

pub(crate) fn replace_tags_block(text: &str, tags: &[String]) -> Option<String> {
    let (frontmatter, suffix) = frontmatter_and_suffix(text)?;
    let mut lines = frontmatter.lines().map(str::to_owned).collect::<Vec<_>>();
    let tags_line = lines.iter().position(|line| line.trim() == "tags:")?;
    let end = tags_block_end(&lines, tags_line);
    let mut next_block = vec![String::from("tags:")];
    next_block.extend(tags.iter().map(|tag| format!("  - {tag:?}")));
    lines.splice(tags_line..end, next_block);
    Some(format!("---\n{}\n---{suffix}", lines.join("\n")))
}

fn frontmatter_and_suffix(text: &str) -> Option<(&str, &str)> {
    let text = text.strip_prefix("---\n")?;
    text.split_once("\n---")
}

fn tags_block_end(lines: &[String], tags_line: usize) -> usize {
    lines[tags_line + 1..]
        .iter()
        .position(|line| {
            let trimmed = line.trim();
            !trimmed.is_empty() && !line.starts_with(' ') && !line.starts_with('\t')
        })
        .map_or(lines.len(), |index| tags_line + 1 + index)
}

pub(crate) fn normalize_author_alias(value: &str) -> String {
    value.trim().to_lowercase()
}

pub(crate) fn is_url_safe_slug(value: &str) -> bool {
    !value.is_empty()
        && value.split('-').all(|segment| {
            !segment.is_empty()
                && segment
                    .bytes()
                    .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit())
        })
}

#[cfg(test)]
mod tests {
    #![expect(
        clippy::expect_used,
        reason = "tag tests assert a known-valid frontmatter fixture is replaced"
    )]

    use super::{
        is_url_safe_slug, normalize_author_alias, normalize_tag_list, replace_tags_block,
        tag_diagnostics,
    };

    #[test]
    fn normalization_matches_authoring_policy() {
        let result = normalize_tag_list(&[
            String::from("  Meme   Culture "),
            String::from("meme/culture"),
            String::from("   "),
            String::from("Meme Culture"),
        ]);

        assert_eq!(
            result.tags,
            vec![String::from("meme culture"), String::from("meme/culture")]
        );
        let messages = result
            .diagnostics
            .iter()
            .map(|diagnostic| diagnostic.message)
            .collect::<Vec<_>>();
        assert!(messages.contains(&"tag must not contain \"/\""));
        assert!(messages.contains(&"tag must not be empty"));
    }

    #[test]
    fn diagnostics_catch_noncanonical_empty_slash_and_duplicates() {
        let diagnostics = tag_diagnostics(&[
            String::from("Meme Culture"),
            String::new(),
            String::from("meme/culture"),
            String::from("meme culture"),
        ]);
        let messages = diagnostics
            .iter()
            .map(|diagnostic| diagnostic.message)
            .collect::<Vec<_>>();

        assert!(messages.contains(&"tag must be canonical"));
        assert!(messages.contains(&"tag must not be empty"));
        assert!(messages.contains(&"tag must not contain \"/\""));
        assert!(messages.contains(&"duplicate canonical tag"));
    }

    #[test]
    fn replaces_only_the_frontmatter_tags_block() {
        let source = "---\ntitle: Example\ntags:\n  - Old\nsummary: Kept\n---\nBody";
        let output = replace_tags_block(source, &[String::from("new tag")])
            .expect("tags block should be replaced");

        assert!(output.contains("tags:\n  - \"new tag\"\nsummary: Kept"));
        assert!(output.ends_with("---\nBody"));
        assert_eq!(replace_tags_block("No frontmatter", &[]), None);
        assert_eq!(
            replace_tags_block("---\ntitle: Example\n---\nBody", &[]),
            None
        );
    }

    #[test]
    fn validates_slugs_and_author_aliases() {
        assert!(is_url_safe_slug("meme-culture-2026"));
        assert!(!is_url_safe_slug("Meme Culture"));
        assert!(!is_url_safe_slug("meme--culture"));
        assert_eq!(
            normalize_author_alias("  Seong Young Her "),
            "seong young her"
        );
    }
}
