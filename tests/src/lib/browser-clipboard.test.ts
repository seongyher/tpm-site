import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

import {
  type ClipboardStatusButton,
  copyTextWithStatus,
  parseJsonStringPayload,
  reportClipboardStatus,
} from "../../../src/lib/browser-clipboard";

describe("browser clipboard helpers", () => {
  test("parses JSON string payloads defensively", () => {
    expect(parseJsonStringPayload('"copy me"')).toBe("copy me");
    expect(parseJsonStringPayload("")).toBeUndefined();
    expect(parseJsonStringPayload("123")).toBeUndefined();
    expect(parseJsonStringPayload(undefined)).toBeUndefined();
  });

  test("writes clipboard text and reports status", async () => {
    const { button, copied, status, statusTarget } = clipboardFixture();

    await copyTextWithStatus(
      {
        clipboard: {
          writeText: async (text) => {
            await Promise.resolve();
            copied.push(text);
          },
        },
      },
      "https://example.com",
      statusTarget,
      {
        empty: "Missing.",
        failure: "Failed.",
        success: "Copied.",
      },
    );

    expect(copied).toEqual(["https://example.com"]);
    expect(button.dataset["copyState"]).toBe("copied");
    expect(status.textContent).toBe("Copied.");
  });

  test("reports empty and failed writes without throwing", async () => {
    const { button, copied, status, statusTarget } = clipboardFixture();

    await copyTextWithStatus(
      {
        clipboard: {
          writeText: async (text) => {
            await Promise.resolve();
            copied.push(text);
            throw new Error("blocked");
          },
        },
      },
      "",
      statusTarget,
      {
        empty: "Missing.",
        failure: "Failed.",
        success: "Copied.",
      },
    );

    expect(copied).toEqual([]);
    expect(button.dataset["copyState"]).toBe("error");
    expect(status.textContent).toBe("Missing.");

    await copyTextWithStatus(
      {
        clipboard: {
          writeText: async (text) => {
            await Promise.resolve();
            copied.push(text);
            throw new Error("blocked");
          },
        },
      },
      "copy me",
      statusTarget,
      {
        empty: "Missing.",
        failure: "Failed.",
        success: "Copied.",
      },
    );

    expect(copied).toEqual(["copy me"]);
    expect(button.dataset["copyState"]).toBe("error");
    expect(status.textContent).toBe("Failed.");
  });

  test("can report status directly", () => {
    const { button, status, statusTarget } = clipboardFixture();

    reportClipboardStatus(statusTarget, "Ready.", "copied");

    expect(button.dataset["copyState"]).toBe("copied");
    expect(status.textContent).toBe("Ready.");
  });
});

function clipboardFixture(): {
  button: ClipboardStatusButton;
  copied: string[];
  status: { textContent: null | string };
  statusTarget: {
    button: ClipboardStatusButton;
    rootSelector: string;
    stateDatasetKey: string;
    statusSelector: string;
  };
} {
  const window = new Window();
  Reflect.set(window, "SyntaxError", SyntaxError);
  window.document.body.innerHTML = `
    <div data-copy-root>
      <button type="button">Copy</button>
      <p data-copy-status></p>
    </div>
  `;
  const button = window.document.querySelector("button");
  const status = window.document.querySelector("p");

  if (
    !(button instanceof window.HTMLButtonElement) ||
    !(status instanceof window.HTMLElement)
  ) {
    throw new Error("Expected clipboard fixture nodes.");
  }

  return {
    button,
    copied: [],
    status,
    statusTarget: {
      button,
      rootSelector: "[data-copy-root]",
      stateDatasetKey: "copyState",
      statusSelector: "[data-copy-status]",
    },
  };
}
