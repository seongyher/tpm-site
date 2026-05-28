# Studio Tauri Shell

This document defines the minimal Tauri package for Linear `IRK-185`. It wraps
the static Astro studio shell from `IRK-184` without adding editor behavior,
provider credentials, publishing workflows, broad host permissions, or a second
GUI operation model.

## Goal

Package the static `apps/studio` Astro app in a Tauri desktop shell so later
milestone 11 issues can bind read-only Rust operation commands into the GUI.
The first Tauri slice should prove the packaging and security boundary only.

## App Boundary

The native shell lives in:

```text
apps/studio/
  src-tauri/
    Cargo.toml
    build.rs
    capabilities/
    src/
    tauri.conf.json
```

`apps/studio/src-tauri` is a Rust workspace member so the same formatting,
lint, documentation, dependency, and supply-chain gates cover the desktop shell.
The crate remains a thin adapter around Tauri; product logic belongs in shared
operation crates.

The Tauri shell has local, reasoned Clippy exceptions for framework-owned
`generate_context!` startup code and Tauri's platform dependency graph. These
exceptions must not leak into shared operation crates. `deny.toml` also carries
documented Tauri-only supply-chain exceptions for duplicate transitive versions
and current informational unmaintained advisories in Tauri's Linux/urlpattern
dependency path.

## Command Surface

The repository command router owns the human-facing commands:

- `just studio-tauri-dev` runs the Tauri app in development mode.
- `just studio-tauri-build` builds the Tauri app with the static Astro shell.

The commands run from `apps/studio` so the Tauri CLI sees the expected
`src-tauri` directory. The repository still has no package scripts.

## Security Boundary

This slice grants the frontend no invokable Tauri commands.

The capability file uses an empty permission list because the static shell does
not call Tauri APIs yet. Later read-only commands should add narrowly named
permissions only for the operation results they expose.

The first shell must not grant:

1. filesystem plugin access;
2. shell plugin access;
3. network plugin access;
4. credential, keychain, or provider access;
5. source mutation, deploy, publish, rollback, or workflow transition access.

The CSP allows local app assets and inline styles needed by the current static
Astro/Tailwind output. If later frontend code introduces scripts, remote media,
or provider calls, the CSP must be revisited with the same narrow-permission
standard.

## Build Boundary

`tauri.conf.json` uses:

- `beforeDevCommand`: starts the Astro studio dev server through `just`;
- `devUrl`: points Tauri dev mode at that local Astro server;
- `beforeBuildCommand`: builds the static Astro shell through `just`;
- `frontendDist`: embeds the generated `dist/studio` output.

This keeps Astro as the frontend compiler and Tauri as the native package shell
instead of creating another build surface.

Linux CI compiles the full Rust workspace with Tauri included, so Rust jobs use
`.github/actions/setup-tauri-linux` to install the native GTK/WebKit packages
required by Tauri's Linux dependency graph before running Cargo checks.

The shell icon is copied from `site/public/apple-touch-icon.png` for the first
slice because Tauri requires an application icon at compile time. A later
branding pass can replace it with a studio-specific icon without changing the
app boundary.

## Handoff To Later Issues

- `IRK-186` should generate or validate frontend operation types against
  Rust-owned operation shapes. The current shell uses
  [STUDIO_FRONTEND_OPERATION_TYPES.md](./STUDIO_FRONTEND_OPERATION_TYPES.md)
  to validate the local frontend fixture against `tpm-operations`.
- `IRK-187` adds only the `site_status` and `check_site` read-only Tauri
  command bindings. The command boundary is documented in
  [STUDIO_TAURI_READ_ONLY_COMMANDS.md](./STUDIO_TAURI_READ_ONLY_COMMANDS.md).
- `IRK-188` should render live operation results from those bindings without a
  separate diagnostic model.
- `IRK-189` should prove CLI and GUI fixture parity over shared operation
  results.

## Verification

`IRK-185` is done when:

1. the Tauri package is a Rust workspace member;
2. the app config packages the static Astro shell;
3. the app has an explicit compile-time icon;
4. the capability file grants no broad filesystem, shell, network, credential,
   provider, or publish permissions;
5. `just studio-tauri-dev` and `just studio-tauri-build` are discoverable;
6. focused config tests cover the Tauri config, capability boundary, and
   command surface;
7. Rust and repo checks pass without weakening existing gates.
