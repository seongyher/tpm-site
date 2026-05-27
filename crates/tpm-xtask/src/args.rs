#![expect(
    clippy::redundant_pub_crate,
    reason = "xtask keeps sibling modules internal while sharing focused parser seams"
)]

/// Returns whether the given raw task arguments request help output.
pub(crate) fn wants_help(args: &[String]) -> bool {
    args.iter()
        .any(|argument| matches!(argument.as_str(), "--help" | "-h" | "help"))
}

/// Returns the value for a `--flag value` or `--flag=value` argument.
pub(crate) fn value_arg(args: &[String], flag: &str) -> Option<String> {
    args.iter().enumerate().find_map(|(index, argument)| {
        if argument == flag {
            args.get(index + 1)
                .filter(|value| !value.starts_with('-'))
                .cloned()
        } else {
            argument
                .strip_prefix(&format!("{flag}="))
                .map(ToOwned::to_owned)
        }
    })
}

#[cfg(test)]
mod tests {
    use super::{value_arg, wants_help};

    fn args(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| String::from(*value)).collect()
    }

    #[test]
    fn detects_help_requests() {
        assert!(wants_help(&args(&["--help"])));
        assert!(wants_help(&args(&["-h"])));
        assert!(wants_help(&args(&["help"])));
        assert!(!wants_help(&args(&["--quiet"])));
    }

    #[test]
    fn parses_space_and_equals_value_forms() {
        assert_eq!(
            value_arg(&args(&["--dir", "dist-test"]), "--dir"),
            Some(String::from("dist-test"))
        );
        assert_eq!(
            value_arg(&args(&["--dir=dist-test"]), "--dir"),
            Some(String::from("dist-test"))
        );
        assert_eq!(value_arg(&args(&["--quiet"]), "--dir"), None);
        assert_eq!(value_arg(&args(&["--dir", "--quiet"]), "--dir"), None);
    }
}
