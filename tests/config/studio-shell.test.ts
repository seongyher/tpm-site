import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { justRecipeBlock, parseJustRecipes } from "../helpers/justfile";

const workspace = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

async function readWorkspaceFile(filePath: string): Promise<string> {
  return await readFile(path.join(workspace, filePath), "utf8");
}

describe("studio shell configuration", () => {
  test("keeps the studio frontend as a static Astro app", async () => {
    const config = await readWorkspaceFile("apps/studio/astro.config.mjs");

    expect(config).toContain('@tailwindcss/vite"');
    expect(config).toContain("plugins: [tailwindcss()]");
    expect(config).toContain('output: "static"');
    expect(config).toContain('outDir: "../../dist/studio"');
    expect(config).toContain('trailingSlash: "always"');
  });

  test("exposes studio commands through just instead of package scripts", async () => {
    const justfile = await readWorkspaceFile("justfile");
    const packageJson = await readWorkspaceFile("package.json");
    const recipes = parseJustRecipes(justfile);

    expect(recipes).toEqual(
      expect.arrayContaining([
        "studio-build",
        "studio-check",
        "studio-dev",
        "studio-preview",
        "studio-preview-fresh",
        "studio-tauri-build",
        "studio-tauri-dev",
      ]),
    );
    expect(justRecipeBlock(justfile, "studio-build")).toContain(
      "astro build --root apps/studio",
    );
    expect(justRecipeBlock(justfile, "studio-check")).toContain(
      "astro check --root apps/studio",
    );
    expect(justRecipeBlock(justfile, "studio-dev")).toContain(
      "astro dev --root apps/studio",
    );
    expect(justRecipeBlock(justfile, "studio-tauri-build")).toContain(
      "tauri build",
    );
    expect(justRecipeBlock(justfile, "studio-tauri-dev")).toContain(
      "tauri dev",
    );
    expect(packageJson).toContain('"@tauri-apps/cli":');
    expect(packageJson).not.toContain('"scripts":');
  });

  test("keeps the Tauri shell minimal and workspace-owned", async () => {
    const gitignore = await readWorkspaceFile(".gitignore");
    const rootCargo = await readWorkspaceFile("Cargo.toml");
    const appCargo = await readWorkspaceFile(
      "apps/studio/src-tauri/Cargo.toml",
    );
    const commands = await readWorkspaceFile(
      "apps/studio/src-tauri/src/commands.rs",
    );
    const config = await readWorkspaceFile(
      "apps/studio/src-tauri/tauri.conf.json",
    );
    const lib = await readWorkspaceFile("apps/studio/src-tauri/src/lib.rs");

    expect(rootCargo).toContain('"apps/studio/src-tauri"');
    expect(appCargo).toContain('name = "tpm-studio"');
    expect(appCargo).toContain("tauri = ");
    expect(appCargo).toContain("tauri-build = ");
    expect(appCargo).toContain("tpm-operations.workspace = true");
    expect(appCargo).toContain("workspace = true");
    expect(lib).toContain("tauri::generate_handler!");
    expect(lib).toContain("commands::site_status");
    expect(lib).toContain("commands::check_site");
    expect(commands).toContain("OperationInterface::Gui");
    expect(commands).toContain("run_workspace_status");
    expect(commands).toContain("run_workspace_check");
    expect(config).toContain('"beforeBuildCommand": "just studio-build"');
    expect(config).toContain(
      '"beforeDevCommand": "just studio-dev --host 127.0.0.1 --port 4323"',
    );
    expect(config).toContain('"devUrl": "http://127.0.0.1:4323"');
    expect(config).toContain('"frontendDist": "../../../dist/studio"');
    expect(config).toContain('"active": false');
    expect(config).toContain('"icons/icon.png"');
    expect(gitignore).toContain("apps/studio/src-tauri/gen/");
  });

  test("keeps studio test accountability explicit", async () => {
    const accountabilityIgnore = await readWorkspaceFile(
      ".test-accountability-ignore",
    );

    expect(accountabilityIgnore).toContain("first static Studio shell");
    expect(accountabilityIgnore).toContain("covered as an app");
    expect(accountabilityIgnore).toContain("tests/config/studio-shell.test.ts");
    expect(accountabilityIgnore).toContain("apps/studio/**");
  });

  test("grants no Tauri frontend permissions in the static shell slice", async () => {
    const capability = await readWorkspaceFile(
      "apps/studio/src-tauri/capabilities/studio-read-only-shell.json",
    );
    const config = await readWorkspaceFile(
      "apps/studio/src-tauri/tauri.conf.json",
    );
    const design = await readWorkspaceFile("docs/STUDIO_TAURI_SHELL.md");

    expect(capability).toContain('"windows": ["main"]');
    expect(capability).toContain('"permissions": []');
    expect(config).not.toContain("fs:");
    expect(config).not.toContain("shell:");
    expect(design).toContain("IRK-185");
    expect(design).toContain("grants the frontend no invokable Tauri commands");
    expect(design).toContain("no broad filesystem, shell, network");
  });

  test("documents and verifies read-only Tauri command bindings", async () => {
    const commandDesign = await readWorkspaceFile(
      "docs/STUDIO_TAURI_READ_ONLY_COMMANDS.md",
    );
    const commands = await readWorkspaceFile(
      "apps/studio/src-tauri/src/commands.rs",
    );

    expect(commandDesign).toContain("IRK-187");
    expect(commandDesign).toContain("site_status");
    expect(commandDesign).toContain("check_site");
    expect(commandDesign).toContain("OperationInterface::Gui");
    expect(commandDesign).toContain("no broad");
    expect(commands).toContain("site_status_for_workspace");
    expect(commands).toContain("check_site_for_workspace");
    expect(commands).toContain("check_site_command_returns_diagnostic_failure");
  });

  test("uses Rust-shaped read-only operation fixture data", async () => {
    const fixtureModule = await readWorkspaceFile(
      "apps/studio/src/data/read-only-operation.ts",
    );
    const fixture = await readWorkspaceFile(
      "apps/studio/src/data/read-only-operation.json",
    );
    const appCargo = await readWorkspaceFile(
      "apps/studio/src-tauri/Cargo.toml",
    );
    const rustFixtureTest = await readWorkspaceFile(
      "apps/studio/src-tauri/tests/frontend_operation_fixture.rs",
    );

    expect(fixture).toContain('"schemaVersion": 1');
    expect(fixture).toContain('"operationId": "workspace.status"');
    expect(fixture).toContain('"interface": "gui"');
    expect(fixture).toContain('"workspace": "tests/fixtures/rust-workspace"');
    expect(fixture).toContain('"status": "warning"');
    expect(fixture).toContain('"severity": "warning"');
    expect(fixture).toContain('"operation source: shared parity fixture"');
    expect(fixtureModule).toContain("read-only-operation.json");
    expect(fixtureModule).not.toContain("interface StudioReadOnlyOperation");
    expect(fixtureModule).not.toContain("sourceRoots");
    expect(fixtureModule).not.toContain("artifacts");
    expect(fixtureModule).not.toContain("requestedBy");
    expect(fixtureModule).not.toContain("workspacePath");
    expect(appCargo).toContain("tpm-operations.workspace = true");
    expect(rustFixtureTest).toContain("OperationResult");
    expect(rustFixtureTest).toContain("serde_json::from_str");
    expect(rustFixtureTest).toContain("OperationStatus::from_report");
    expect(rustFixtureTest).toContain("workspace-status-warning.json");
    expect(rustFixtureTest).toContain('"interface"');
  });

  test("keeps the shell component-first and Tailwind-backed", async () => {
    const page = await readWorkspaceFile("apps/studio/src/pages/index.astro");
    const styles = await readWorkspaceFile("apps/studio/src/styles/studio.css");

    expect(styles).toContain('@import "tailwindcss"');
    expect(page).toContain("StudioAppBar");
    expect(page).toContain("StudioNavigation");
    expect(page).toContain("StudioSummaryPanel");
    expect(page).toContain("OperationDetailsPanel");
    expect(page).toContain("OperationRuntimePanel");
    expect(page).toContain("FutureSurfacesPanel");
    expect(page).not.toContain("SourceRootsPanel");
    expect(page).not.toContain("ArtifactsPanel");
  });

  test("keeps live operation rendering accessible and fixture-backed", async () => {
    const panel = await readWorkspaceFile(
      "apps/studio/src/components/OperationRuntimePanel.astro",
    );
    const controller = await readWorkspaceFile(
      "apps/studio/src/controllers/operation-runtime.ts",
    );
    const runtime = await readWorkspaceFile(
      "apps/studio/src/data/operation-runtime.ts",
    );
    const packageJson = await readWorkspaceFile("package.json");

    expect(panel).toContain('role="status"');
    expect(panel).toContain('aria-live="polite"');
    expect(panel).toContain('role="group"');
    expect(panel).toContain("data-studio-diagnostics-empty");
    expect(panel).toContain("data-studio-operation-error");
    expect(panel).toContain("No diagnostics.");
    expect(panel).toContain("disabled");
    expect(controller).toContain("@tauri-apps/api/core");
    expect(controller).toContain("isTauri");
    expect(controller).toContain("invoke<StudioOperationResult>");
    expect(runtime).toContain('kind: "loading"');
    expect(runtime).toContain('kind: "error"');
    expect(runtime).toContain('kind: "fallback"');
    expect(packageJson).toContain('"@tauri-apps/api":');
  });

  test("documents the shell boundary and later handoff", async () => {
    const design = await readWorkspaceFile("docs/STUDIO_FRONTEND_SHELL.md");
    const typeStrategy = await readWorkspaceFile(
      "docs/STUDIO_FRONTEND_OPERATION_TYPES.md",
    );
    const parity = await readWorkspaceFile("docs/STUDIO_CLI_GUI_PARITY.md");

    expect(design).toContain("IRK-184");
    expect(design).toContain("separate GUI diagnostic or source model");
    expect(design).toContain("component-first Astro/Tailwind standards");
    expect(design).toContain("IRK-185");
    expect(design).toContain("IRK-189");
    expect(typeStrategy).toContain("IRK-186");
    expect(typeStrategy).toContain(
      "Rust operation crate remains the source of truth",
    );
    expect(typeStrategy).toContain(
      "must not re-declare the operation envelope",
    );
    expect(typeStrategy).toContain("component-first Astro/Tailwind");
    expect(parity).toContain("IRK-189");
    expect(parity).toContain("workspace-status-warning.json");
    expect(parity).toContain("request.interface");
  });
});
