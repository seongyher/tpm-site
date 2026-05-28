use std::env;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use serde_json::Value;

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct Workspace {
    pub(super) output: PathBuf,
    pub(super) root: PathBuf,
    pub(super) site: PathBuf,
}

impl Workspace {
    pub(super) fn discover() -> io::Result<Self> {
        let root = env::current_dir()?;
        let site =
            env::var_os("SITE_INSTANCE_ROOT").map_or_else(|| root.join("site"), PathBuf::from);
        let output =
            env::var_os("SITE_OUTPUT_DIR").map_or_else(|| root.join("dist"), PathBuf::from);

        Ok(Self {
            output: absolutize(&root, &output),
            root: root.clone(),
            site: absolutize(&root, &site),
        })
    }

    pub(super) fn site_config_json(&self) -> io::Result<Value> {
        let path = self.site.join("config/site.json");
        let text = fs::read_to_string(path)?;
        serde_json::from_str(&text).map_err(io::Error::other)
    }
}

pub(super) fn absolutize(root: &Path, path: &Path) -> PathBuf {
    if path.is_absolute() {
        path.to_path_buf()
    } else {
        root.join(path)
    }
}

pub(super) fn output_dir_arg(path: Option<&Path>, workspace: &Workspace) -> PathBuf {
    path.map_or_else(
        || workspace.output.clone(),
        |value| absolutize(&workspace.root, value),
    )
}
