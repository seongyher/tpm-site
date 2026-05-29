# Studio Tauri Distribution

This document records the Milestone 14 packaging, signing, and update plan for
the Tauri/Astro Studio app. It supports `IRK-208`.

## Current State

The Studio app is a Tauri shell over a static Astro frontend and shared Rust
operation contracts. The implemented app can render read-only and authoring
operation data, but public desktop distribution still needs packaging policy,
signing decisions, update-channel design, and smoke tests.

Current local packaging command:

```sh
just studio-tauri-build
```

Current distribution smoke command:

```sh
just studio-package-check
```

The local smoke check is intentionally unsigned. It proves the app can be
packaged locally without requiring private signing credentials.

## Platform Targets

Initial target platforms:

| Platform | Artifact expectation                   | Signing requirement before public release                    |
| -------- | -------------------------------------- | ------------------------------------------------------------ |
| macOS    | `.app` bundle plus `.dmg` or installer | Apple Developer ID signing and notarization.                 |
| Windows  | installer or portable bundle           | Code-signing certificate before public non-warning releases. |
| Linux    | AppImage/deb/rpm or documented archive | Signing/checksum policy; distro-specific signing later.      |

Milestone 14 may validate local packaging on the current development platform.
Cross-platform CI and real signing should be added only when credentials and
release channels are available.

## Signing And Secrets

Signing credentials must never be committed to the repository. The release
pipeline should load them from the provider secret store or operator-local
keychain and expose only credential references in logs and operation payloads.

Required future credential classes:

- Apple signing certificate and notarization credentials;
- Windows code-signing certificate;
- update signing key if Tauri updater is enabled;
- release artifact upload token if publishing to a provider.

## Update Strategy

Default recommendation:

1. ship manual downloads first with checksums and release notes;
2. add signed update manifests after artifact signing is reliable;
3. keep stable, beta, and internal channels separate;
4. require rollback guidance for any update that changes workspace, provider,
   or credential behavior.

The app should not silently update if the update changes source-writing,
publish, credential, or provider permissions without release-governance notes.

## Packaged App Smoke Tests

Public distribution should eventually verify:

- app starts and loads the static Astro frontend;
- read-only status and diagnostics commands work through Tauri;
- authoring operation panels render shared operation payloads;
- unavailable provider capabilities are visible and not treated as failures;
- no broad filesystem, shell, or network permissions are introduced;
- secret-like values are redacted in logs and operation payloads.

Current Milestone 14 verification should stay focused on packageability and
policy. Signed update verification waits for real signing credentials and
release infrastructure.
