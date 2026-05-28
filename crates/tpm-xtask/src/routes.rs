//! Route-derived build target planners for internal repository tasks.

#![expect(
    clippy::redundant_pub_crate,
    reason = "crate-visible planner seams are shared with the task adapter while the crate denies unreachable public items"
)]

use std::path::{Path, PathBuf};

use serde_json::Value;

pub(crate) fn pagefind_globs(config: &Value) -> Vec<String> {
    if !feature_enabled(config, "search") {
        return Vec::new();
    }

    let mut globs = vec![
        String::from("index.html"),
        String::from("about/**/*.html"),
        route_tree_html_glob(route(config, "articles", "/articles/")),
        route_tree_html_glob(route(config, "search", "/search/")),
    ];
    for (feature, route_key, fallback) in [
        ("announcements", "announcements", "/announcements/"),
        ("authors", "authors", "/authors/"),
        ("bibliography", "bibliography", "/bibliography/"),
        ("categories", "categories", "/categories/"),
        ("collections", "collections", "/collections/"),
        ("tags", "tags", "/tags/"),
    ] {
        if feature_enabled(config, feature) {
            globs.push(route_tree_html_glob(route(config, route_key, fallback)));
        }
    }
    globs
}

pub(crate) fn html_validation_targets(config: &Value, output_dir: &Path) -> Vec<PathBuf> {
    let mut targets = vec![
        output_dir.join("index.html"),
        output_dir.join("404.html"),
        output_dir.join("about/**/*.html"),
        route_index_html_target(output_dir, route(config, "articles", "/articles/")),
    ];
    for (feature, route_key, fallback) in [
        ("announcements", "announcements", "/announcements/"),
        ("authors", "authors", "/authors/"),
        ("bibliography", "bibliography", "/bibliography/"),
        ("categories", "categories", "/categories/"),
        ("collections", "collections", "/collections/"),
        ("search", "search", "/search/"),
        ("tags", "tags", "/tags/"),
    ] {
        if feature_enabled(config, feature) {
            targets.push(route_tree_html_target(
                output_dir,
                route(config, route_key, fallback),
            ));
        }
    }
    targets
}

fn feature_enabled(config: &Value, key: &str) -> bool {
    config
        .get("features")
        .and_then(|features| features.get(key))
        .and_then(Value::as_bool)
        .unwrap_or(false)
}

fn route<'a>(config: &'a Value, key: &str, fallback: &'a str) -> &'a str {
    config
        .get("routes")
        .and_then(|routes| routes.get(key))
        .and_then(Value::as_str)
        .unwrap_or(fallback)
}

pub(crate) fn route_tree_html_glob(route: &str) -> String {
    let route_path = trim_route(route);
    if route_path.is_empty() {
        String::from("index.html")
    } else {
        format!("{route_path}/**/*.html")
    }
}

fn route_index_html_target(output_dir: &Path, route: &str) -> PathBuf {
    let route_path = trim_route(route);
    if route_path.is_empty() {
        output_dir.join("index.html")
    } else {
        output_dir.join(route_path).join("index.html")
    }
}

fn route_tree_html_target(output_dir: &Path, route: &str) -> PathBuf {
    let route_path = trim_route(route);
    if route_path.is_empty() {
        output_dir.join("index.html")
    } else {
        output_dir.join(route_path).join("**/*.html")
    }
}

fn trim_route(route: &str) -> &str {
    route.trim_matches('/')
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::{html_validation_targets, pagefind_globs, route_tree_html_glob};

    #[test]
    fn planners_use_site_config_features() {
        let config = json!({
            "features": {
                "announcements": true,
                "authors": false,
                "bibliography": true,
                "categories": true,
                "collections": true,
                "search": true,
                "tags": true
            },
            "routes": {
                "articles": "/articles/",
                "bibliography": "/bibliography/"
            }
        });

        assert!(pagefind_globs(&config).contains(&String::from("articles/**/*.html")));
        assert!(pagefind_globs(&config).contains(&String::from("bibliography/**/*.html")));
        assert!(!pagefind_globs(&config).contains(&String::from("authors/**/*.html")));
        assert_eq!(route_tree_html_glob("/"), "index.html");
        assert!(
            html_validation_targets(&config, std::path::Path::new("dist"))
                .iter()
                .any(|target| target.to_string_lossy().contains("articles/index.html"))
        );

        let root_route_config = json!({
            "features": {
                "search": true
            },
            "routes": {
                "articles": "/",
                "search": "/"
            }
        });
        let targets = html_validation_targets(&root_route_config, std::path::Path::new("dist"));
        assert!(
            targets
                .iter()
                .any(|target| target == std::path::Path::new("dist/index.html"))
        );
        assert!(pagefind_globs(&root_route_config).contains(&String::from("index.html")));
    }

    #[test]
    fn search_disabled_emits_no_pagefind_globs() {
        let config = json!({
            "features": {
                "search": false
            }
        });

        assert_eq!(pagefind_globs(&config), Vec::<String>::new());
    }
}
