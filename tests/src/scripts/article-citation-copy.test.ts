import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

import { installArticleCitationCopy } from "../../../src/scripts/article-citation-copy";

describe("article citation copy browser script", () => {
  test("copies the requested citation text and reports success", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const copiedText: string[] = [];
    const document = window.document;

    document.body.innerHTML = `
      <details data-article-citation-menu>
        <section data-article-citation-format="bibtex">
          <button
            data-article-citation-copy-button
            data-article-citation-copy-target="citation-bibtex"
          >Copy</button>
          <textarea id="citation-bibtex" data-article-citation-text>@online{source}</textarea>
          <p data-article-citation-copy-status></p>
        </section>
      </details>
    `;

    installArticleCitationCopy({
      document: browserDocument(document),
      navigator: browserNavigator({
        clipboard: {
          writeText: async (value: string) => {
            await Promise.resolve();
            copiedText.push(value);
          },
        },
      }),
    });

    document
      .querySelector("button")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await settledPromises();

    expect(copiedText).toEqual(["@online{source}"]);
    expect(
      document.querySelector("[data-article-citation-copy-status]")
        ?.textContent,
    ).toBe("Copied.");
    expect(
      document.querySelector("button")?.dataset["articleCitationCopyState"],
    ).toBe("copied");
  });

  test("reports a copy failure without hiding manual citation text", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const document = window.document;

    document.body.innerHTML = `
      <details data-article-citation-menu>
        <section data-article-citation-format="mla">
          <button
            data-article-citation-copy-button
            data-article-citation-copy-target="citation-mla"
          >Copy</button>
          <textarea id="citation-mla" data-article-citation-text>Visible citation.</textarea>
          <p data-article-citation-copy-status></p>
        </section>
      </details>
    `;

    installArticleCitationCopy({
      document: browserDocument(document),
      navigator: browserNavigator({
        clipboard: {
          writeText: async () => {
            await Promise.resolve();
            throw new Error("Permission denied.");
          },
        },
      }),
    });

    document
      .querySelector("button")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await settledPromises();

    expect(
      document.querySelector("[data-article-citation-text]")?.textContent,
    ).toBe("Visible citation.");
    expect(
      document.querySelector("[data-article-citation-copy-status]")
        ?.textContent,
    ).toBe("Copy failed. Select the citation text manually.");
    expect(
      document.querySelector("button")?.dataset["articleCitationCopyState"],
    ).toBe("error");
  });

  test("copies citation text from the collapsed popover code block", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const copiedText: string[] = [];
    const document = window.document;

    document.body.innerHTML = `
      <div data-article-citation-menu>
        <details data-article-citation-format="apa" open>
          <button
            data-article-citation-copy-button
            data-article-citation-copy-target="citation-apa"
          >Copy</button>
          <code
            id="citation-apa"
            data-article-citation-copy-text="&quot;Author. (2022). Article title.\\nSecond line.&quot;"
            data-article-citation-text
          >
            Author. (2022). Article title.
            <span>Second line.</span>
          </code>
          <p data-article-citation-copy-status></p>
        </details>
      </div>
    `;

    installArticleCitationCopy({
      document: browserDocument(document),
      navigator: browserNavigator({
        clipboard: {
          writeText: async (value: string) => {
            await Promise.resolve();
            copiedText.push(value);
          },
        },
      }),
    });

    document
      .querySelector("button")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await settledPromises();

    expect(copiedText).toEqual([
      "Author. (2022). Article title.\nSecond line.",
    ]);
    expect(
      document.querySelector("[data-article-citation-copy-status]")
        ?.textContent,
    ).toBe("Copied.");
  });

  test("switches citation styles in one selected citation text block", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const copiedText: string[] = [];
    const document = window.document;
    const bibtex = "@online{source,\n  title = {Source}\n}";

    document.body.innerHTML = `
      <div data-article-citation-menu>
        <button
          type="button"
          aria-pressed="true"
          data-article-citation-format-label="APA"
          data-article-citation-format-text="&quot;Author. (2022). Article title.&quot;"
          data-article-citation-style-button
        >APA</button>
        <button
          type="button"
          aria-pressed="false"
          data-article-citation-format-label="BibTeX"
          data-article-citation-format-text=""
          data-article-citation-style-button
        >BibTeX</button>
        <code
          id="citation-selected"
          data-article-citation-copy-text="&quot;Author. (2022). Article title.&quot;"
          data-article-citation-text
        >
          <span class="block">Author. (2022). Article title.</span>
        </code>
        <button
          aria-label="Copy APA citation"
          data-article-citation-copy-button
          data-article-citation-copy-target="citation-selected"
        >Copy</button>
        <p data-article-citation-copy-status>Copied.</p>
      </div>
    `;

    installArticleCitationCopy({
      document: browserDocument(document),
      navigator: browserNavigator({
        clipboard: {
          writeText: async (value: string) => {
            await Promise.resolve();
            copiedText.push(value);
          },
        },
      }),
    });

    const dom = browserDocument(document);
    const styleButtons = Array.from(
      dom.querySelectorAll<HTMLButtonElement>(
        "[data-article-citation-style-button]",
      ),
    );
    const citationText = dom.querySelector<HTMLElement>(
      "[data-article-citation-text]",
    );
    const copyButton = dom.querySelector<HTMLButtonElement>(
      "[data-article-citation-copy-button]",
    );
    const bibtexStyleButton = styleButtons.at(1);

    if (
      bibtexStyleButton === undefined ||
      citationText === null ||
      copyButton === null
    ) {
      throw new Error("Citation menu test fixture is missing expected nodes.");
    }

    bibtexStyleButton.dataset["articleCitationFormatText"] =
      JSON.stringify(bibtex);
    bibtexStyleButton.dispatchEvent(
      browserEvent(new window.MouseEvent("click", { bubbles: true })),
    );

    expect(
      styleButtons.map((button) => button.getAttribute("aria-pressed")),
    ).toEqual(["false", "true"]);
    expect(citationText.dataset["articleCitationCopyText"]).toBe(
      JSON.stringify(bibtex),
    );
    expect(citationText.textContent).toContain("@online{source,");
    expect(copyButton.getAttribute("aria-label")).toBe("Copy BibTeX citation");
    expect(
      document.querySelector("[data-article-citation-copy-status]")
        ?.textContent,
    ).toBe("");

    copyButton.dispatchEvent(
      browserEvent(new window.MouseEvent("click", { bubbles: true })),
    );
    await settledPromises();

    expect(copiedText).toEqual([bibtex]);
  });

  test("installs once and ignores unrelated or incomplete citation controls", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const copiedText: string[] = [];
    const document = window.document;

    document.body.innerHTML = `
      <button id="outside" type="button">Outside</button>
      <button id="orphan-style" data-article-citation-style-button>Style</button>
      <div data-article-citation-menu>
        <button id="incomplete-style" data-article-citation-style-button>Missing payload</button>
        <button
          id="missing-target"
          data-article-citation-copy-button
          data-article-citation-copy-target="missing"
        >Copy missing</button>
        <button
          id="plain-copy"
          data-article-citation-copy-button
          data-article-citation-copy-target="plain-citation"
        >Copy plain</button>
        <code id="plain-citation" data-article-citation-text>Plain citation.</code>
        <p data-article-citation-copy-status></p>
      </div>
    `;

    const runtime = {
      document: browserDocument(document),
      navigator: browserNavigator({
        clipboard: {
          writeText: async (value: string) => {
            await Promise.resolve();
            copiedText.push(value);
          },
        },
      }),
    };

    installArticleCitationCopy(runtime);
    installArticleCitationCopy(runtime);
    document.dispatchEvent(new window.Event("click"));
    document
      .querySelector("#outside")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    document
      .querySelector("#orphan-style")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    document
      .querySelector("#incomplete-style")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    document
      .querySelector("#missing-target")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    document
      .querySelector("#plain-copy")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await settledPromises();

    expect(copiedText).toEqual(["Plain citation."]);
    expect(
      document.querySelector("[data-article-citation-copy-status]")
        ?.textContent,
    ).toBe("Copied.");
  });
});

function browserDocument(document: unknown): Document {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements the browser Document shape used by the script.
  return document as Document;
}

function browserNavigator(navigator: unknown): Navigator {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Tests provide the clipboard subset required by the script.
  return navigator as Navigator;
}

function browserEvent(event: unknown): Event {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM events implement the browser event shape used by dispatchEvent.
  return event as Event;
}

async function settledPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
