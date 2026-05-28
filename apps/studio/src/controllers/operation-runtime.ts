import { invoke, isTauri } from "@tauri-apps/api/core";

import {
  diagnosticBorderClass,
  isStudioOperationCommand,
  operationErrorMessage,
  operationStateMessage,
  type StudioOperationCommand,
  type StudioOperationLoadState,
  type StudioRuntimeDiagnostic,
  type StudioRuntimeOperationResult,
} from "../data/operation-runtime";
import {
  badgeClassForTone,
  diagnosticSeverityTone,
  operationStatusLabel,
  operationStatusTone,
  readOnlyOperation,
} from "../data/read-only-operation";

const rootSelector = "[data-studio-operation-runtime]";
const commandSelector = "[data-studio-operation-command]";
const emptySelector = "[data-studio-diagnostics-empty]";
const diagnosticsSelector = "[data-studio-operation-diagnostics]";
const errorSelector = "[data-studio-operation-error]";
const operationIdSelector = "[data-studio-operation-id]";
const stateSelector = "[data-studio-operation-state]";
const statusBadgeSelector = "[data-studio-operation-status-badge]";
const summaryDetailsSelector = "[data-studio-operation-details]";
const summaryTitleSelector = "[data-studio-operation-title]";
const workspaceSelector = "[data-studio-operation-workspace]";

function initializeOperationRuntime(): void {
  document.querySelectorAll(rootSelector).forEach((root) => {
    if (!(root instanceof HTMLElement)) {
      return;
    }

    initializeRoot(root);
  });
}

function initializeRoot(root: HTMLElement): void {
  const fallbackState = {
    kind: "fallback",
    result: readOnlyOperation,
  } satisfies StudioOperationLoadState;

  renderState(root, fallbackState);

  const buttons = Array.from(root.querySelectorAll(commandSelector)).filter(
    (element): element is HTMLButtonElement =>
      element instanceof HTMLButtonElement,
  );

  buttons.forEach((button) => {
    const command = button.dataset["studioOperationCommand"];
    if (!isStudioOperationCommand(command)) {
      return;
    }

    button.disabled = !isTauri();
    button.addEventListener("click", () => {
      runCommand(root, command).catch((error: unknown) => {
        renderState(root, {
          command,
          kind: "error",
          message: operationErrorMessage(error),
          result: readOnlyOperation,
        });
      });
    });
  });
}

async function runCommand(
  root: HTMLElement,
  command: StudioOperationCommand,
): Promise<void> {
  renderState(root, {
    command,
    kind: "loading",
    result: readOnlyOperation,
  });

  const result = await invoke<StudioRuntimeOperationResult>(command);

  renderState(root, {
    command,
    kind: "ready",
    result,
  });
}

function renderState(root: HTMLElement, state: StudioOperationLoadState): void {
  root.dataset["studioOperationState"] = state.kind;
  setText(root, stateSelector, operationStateMessage(state));
  setText(root, operationIdSelector, state.result.request.operationId);
  setText(root, summaryTitleSelector, state.result.summary.title);
  setText(root, workspaceSelector, state.result.request.workspace);
  renderStatusBadge(root, state.result);
  renderDetails(root, state.result.summary.details);
  renderDiagnostics(root, state.result.diagnostics.diagnostics);
  renderError(root, state);
}

function renderStatusBadge(
  root: HTMLElement,
  result: StudioRuntimeOperationResult,
): void {
  const badge = queryElement(root, statusBadgeSelector);
  if (badge === null) {
    return;
  }

  const tone = operationStatusTone(result.status);
  badge.textContent = operationStatusLabel(result.status);
  badge.className = [
    "inline-flex min-h-7 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
    badgeClassForTone(tone),
  ].join(" ");
}

function renderDetails(root: HTMLElement, details: readonly string[]): void {
  const list = queryElement(root, summaryDetailsSelector);
  if (list === null) {
    return;
  }

  list.replaceChildren(
    ...details.map((detail) => {
      const item = document.createElement("li");
      item.className =
        "border-border bg-panel-muted rounded-md border p-3 leading-6 [overflow-wrap:anywhere]";
      item.textContent = detail;
      return item;
    }),
  );
}

function renderDiagnostics(
  root: HTMLElement,
  diagnostics: readonly StudioRuntimeDiagnostic[],
): void {
  const list = queryElement(root, diagnosticsSelector);
  const empty = queryElement(root, emptySelector);
  if (list === null || empty === null) {
    return;
  }

  empty.hidden = diagnostics.length > 0;
  list.replaceChildren(...diagnostics.map(createDiagnosticCard));
}

function createDiagnosticCard(
  diagnostic: StudioRuntimeDiagnostic,
): HTMLElement {
  const article = document.createElement("article");
  article.className = [
    "border-border bg-panel-muted flex items-start justify-between gap-4 rounded-md border border-l-4 p-3 max-sm:grid",
    diagnosticBorderClass(diagnostic.severity),
  ].join(" ");

  const content = document.createElement("div");
  content.className = "min-w-0";
  content.append(
    diagnosticCode(diagnostic),
    diagnosticMessage(diagnostic),
    diagnosticLocation(diagnostic),
    diagnosticRemediation(diagnostic),
  );

  const badge = document.createElement("span");
  const tone = diagnosticSeverityTone(diagnostic.severity);
  badge.className = [
    "inline-flex min-h-7 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
    badgeClassForTone(tone),
  ].join(" ");
  badge.textContent = diagnostic.severity;

  article.append(content, badge);
  return article;
}

function diagnosticCode(diagnostic: StudioRuntimeDiagnostic): HTMLElement {
  const code = document.createElement("p");
  code.className = "text-muted-foreground text-xs font-bold uppercase";
  code.textContent = diagnostic.code;
  return code;
}

function diagnosticMessage(diagnostic: StudioRuntimeDiagnostic): HTMLElement {
  const message = document.createElement("h3");
  message.className = "mt-1 text-base leading-snug font-bold tracking-normal";
  message.textContent = diagnostic.message;
  return message;
}

function diagnosticLocation(diagnostic: StudioRuntimeDiagnostic): HTMLElement {
  const location = document.createElement("p");
  location.className =
    "text-muted-foreground mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm";

  const locationValue = Reflect.get(diagnostic, "location");
  if (!isDiagnosticLocation(locationValue)) {
    location.hidden = true;
    return location;
  }

  const kind = document.createElement("span");
  kind.className = "font-bold uppercase";
  kind.textContent = locationValue.kind;

  const path = document.createElement("code");
  path.className = "[overflow-wrap:anywhere]";
  path.textContent = locationValue.path;

  location.append(kind, path);
  return location;
}

function diagnosticRemediation(
  diagnostic: StudioRuntimeDiagnostic,
): HTMLElement {
  const remediation = document.createElement("p");
  remediation.className = "text-muted-foreground mt-2 leading-6";

  const remediationText = optionalString(
    Reflect.get(diagnostic, "remediation"),
  );
  if (remediationText === null) {
    remediation.hidden = true;
    return remediation;
  }

  remediation.textContent = remediationText;
  return remediation;
}

function renderError(root: HTMLElement, state: StudioOperationLoadState): void {
  const error = queryElement(root, errorSelector);
  if (error === null) {
    return;
  }

  if (state.kind === "error") {
    error.hidden = false;
    error.textContent = state.message;
  } else {
    error.hidden = true;
    error.textContent = "";
  }
}

function setText(root: HTMLElement, selector: string, value: string): void {
  const element = queryElement(root, selector);
  if (element !== null) {
    element.textContent = value;
  }
}

function queryElement(root: HTMLElement, selector: string): HTMLElement | null {
  const element = root.querySelector(selector);
  return element instanceof HTMLElement ? element : null;
}

function isDiagnosticLocation(
  value: unknown,
): value is { kind: string; path: string } {
  return (
    isRecord(value) &&
    typeof Reflect.get(value, "kind") === "string" &&
    typeof Reflect.get(value, "path") === "string"
  );
}

function optionalString(value: unknown): null | string {
  return typeof value === "string" ? value : null;
}

function isRecord(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

initializeOperationRuntime();
