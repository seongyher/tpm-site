//! Small frontmatter parser used by internal source-level repository checks.

#![expect(
    clippy::redundant_pub_crate,
    reason = "crate-visible parser seams are shared with the task adapter while the crate denies unreachable public items"
)]

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct Frontmatter {
    text: String,
}

impl Frontmatter {
    pub(crate) fn parse(source: &str) -> Option<Self> {
        let source = source.strip_prefix("---\n")?;
        let (text, _) = source.split_once("\n---")?;
        Some(Self {
            text: text.to_owned(),
        })
    }

    pub(crate) fn scalar(&self, key: &str) -> Option<String> {
        let prefix = format!("{key}:");
        self.text.lines().find_map(|line| {
            let trimmed = line.trim();
            trimmed
                .strip_prefix(&prefix)
                .map(|value| strip_quotes(value.trim()).to_owned())
        })
    }

    pub(crate) fn bool_value(&self, key: &str) -> Option<bool> {
        let value = self.scalar(key)?;
        match value.as_str() {
            "true" => Some(true),
            "false" => Some(false),
            _ => None,
        }
    }

    pub(crate) fn list(&self, key: &str) -> Option<Vec<String>> {
        let lines = self.text.lines().collect::<Vec<_>>();
        let start = lines
            .iter()
            .position(|line| line.trim() == format!("{key}:"))?;
        let mut values = Vec::new();
        for line in &lines[start + 1..] {
            if line.trim().is_empty() || line.trim_start().starts_with('#') {
                continue;
            }
            if !line.starts_with(' ') && !line.starts_with('\t') {
                break;
            }
            let trimmed = line.trim();
            if let Some(value) = trimmed.strip_prefix("- ") {
                values.push(strip_quotes(value.trim()).to_owned());
            }
        }
        Some(values)
    }
}

fn strip_quotes(value: &str) -> &str {
    strip_wrapping_quote(value, '"')
        .or_else(|| strip_wrapping_quote(value, '\''))
        .unwrap_or(value)
}

fn strip_wrapping_quote(value: &str, quote: char) -> Option<&str> {
    let unquoted = value.strip_prefix(quote)?;
    unquoted.strip_suffix(quote)
}

#[cfg(test)]
mod tests {
    #![expect(
        clippy::expect_used,
        reason = "frontmatter tests assert a known-valid fixture parses"
    )]

    use super::{Frontmatter, strip_quotes};

    #[test]
    fn parses_scalars_booleans_and_lists() {
        let frontmatter = Frontmatter::parse(
            "---\ntitle: \"Example\"\ndraft: false\ntags:\n  - Philosophy\n\n  # comment\n  - memes\nsummary: End\n---\nBody",
        );
        let data = frontmatter.expect("frontmatter should parse");

        assert_eq!(data.scalar("title"), Some(String::from("Example")));
        assert_eq!(data.bool_value("draft"), Some(false));
        assert_eq!(data.bool_value("title"), None);
        assert_eq!(
            data.list("tags"),
            Some(vec![String::from("Philosophy"), String::from("memes")])
        );
    }

    #[test]
    fn rejects_missing_or_unclosed_frontmatter() {
        assert_eq!(Frontmatter::parse("title: Example"), None);
        assert_eq!(Frontmatter::parse("---\ntitle: Example\nBody"), None);
    }

    #[test]
    fn strips_matching_single_or_double_quotes_only() {
        assert_eq!(strip_quotes("\"quoted\""), "quoted");
        assert_eq!(strip_quotes("'quoted'"), "quoted");
        assert_eq!(strip_quotes("\"quoted'"), "\"quoted'");
    }
}
