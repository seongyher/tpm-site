//! Redirect rule formatting helpers for generated Cloudflare redirect files.

#![expect(
    clippy::redundant_pub_crate,
    reason = "crate-visible redirect seams are shared with the task adapter while the crate denies unreachable public items"
)]

const GENERATED_REDIRECT_HEADER: &str =
    "# Generated from site redirects and article legacyPermalink metadata. Do not edit by hand.";

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub(crate) struct RedirectRule {
    pub(crate) destination: String,
    pub(crate) source: String,
}

pub(crate) fn format_redirects(rules: &[RedirectRule]) -> String {
    let mut lines = vec![String::from(GENERATED_REDIRECT_HEADER)];
    lines.extend(
        rules
            .iter()
            .map(|rule| format!("{} {} 301", rule.source, rule.destination)),
    );
    lines.push(String::new());
    lines.join("\n")
}

pub(crate) fn normalize_redirect_path(value: &str) -> String {
    let trimmed = value.trim();
    let with_leading = if trimmed.starts_with('/') {
        trimmed.to_owned()
    } else {
        format!("/{trimmed}")
    };
    with_trailing_slash(&collapse_slashes(&with_leading))
}

pub(crate) fn collapse_slashes(value: &str) -> String {
    let mut collapsed = String::new();
    let mut previous_slash = false;
    for character in value.chars() {
        if character == '/' {
            if !previous_slash {
                collapsed.push(character);
            }
            previous_slash = true;
        } else {
            collapsed.push(character);
            previous_slash = false;
        }
    }
    collapsed
}

pub(crate) fn with_trailing_slash(value: &str) -> String {
    if value.ends_with('/') {
        value.to_owned()
    } else {
        format!("{value}/")
    }
}

#[cfg(test)]
mod tests {
    use super::{RedirectRule, collapse_slashes, format_redirects, normalize_redirect_path};

    #[test]
    fn formats_cloudflare_compatible_rules() {
        let output = format_redirects(&[RedirectRule {
            destination: String::from("/articles/example/"),
            source: String::from("/2015/example/"),
        }]);

        assert_eq!(normalize_redirect_path("2015//example"), "/2015/example/");
        assert_eq!(collapse_slashes("//a///b"), "/a/b");
        assert!(output.contains("/2015/example/ /articles/example/ 301"));
    }
}
