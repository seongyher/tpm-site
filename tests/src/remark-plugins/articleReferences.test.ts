import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";
import type { Root } from "mdast";
import rehypeStringify from "rehype-stringify";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";

import type { ArticleReferenceData } from "../../../src/lib/article-references/model";
import {
  articleReferencesFromFrontmatter,
  remarkArticleReferences,
  type RemarkArticleReferencesOptions,
} from "../../../src/remark-plugins/articleReferences";

describe("remarkArticleReferences", () => {
  test("normalizes a valid explanatory note and suppresses default footnotes", () => {
    const result = processMarkdown(`
Claim with context.[^note-context]

[^note-context]: This note preserves \`inline code\`.
`);

    expect(result.references.notes).toHaveLength(1);
    expect(result.references.citations).toHaveLength(0);
    expect(result.references.notes[0]?.label).toBe("note-context");
    expect(result.html).toContain("data-article-reference-marker");
    expect(result.html).toContain('data-reference-entry-id="note-context"');
    expect(result.html).toContain('data-reference-kind="note"');
    expect(result.html).toContain('data-reference-label="note-context"');
    expect(result.html).toContain('data-reference-order="1"');
    expect(result.html).toContain('aria-label="Note 1"');
    expect(result.html).toContain(">1</a>");
    expect(result.html).not.toContain("[1]</a>");
    expect(result.html).not.toContain('data-footnotes="true"');
  });

  test("serializes rich note definitions for previews and downstream outputs", () => {
    const result = processMarkdown(`
Claim with a rich note.[^note-rich]

[^note-rich]: See [linked **source**](https://example.com "Source title") with \`code\`, *emphasis*, and **strong**.

    \`\`\`js
    const value = 1;
    \`\`\`
`);

    const blocks = result.references.notes[0]?.definition.children ?? [];
    const paragraph = blocks.find((block) => block.kind === "paragraph");
    const code = blocks.find((block) => block.kind === "code");

    if (paragraph?.kind !== "paragraph") {
      throw new Error("Expected rich note paragraph block.");
    }

    expect(result.references.notes[0]?.label).toBe("note-rich");
    expect(paragraph).toMatchObject({
      kind: "paragraph",
      text: "See linked source with code, emphasis, and strong.",
    });
    expect(paragraph.children.find((child) => child.kind === "link")).toEqual({
      children: [
        { kind: "text", text: "linked " },
        {
          children: [{ kind: "text", text: "source" }],
          kind: "strong",
          text: "source",
        },
      ],
      kind: "link",
      text: "linked source",
      title: "Source title",
      url: "https://example.com",
    });
    expect(
      paragraph.children.find((child) => child.kind === "inlineCode"),
    ).toEqual({
      kind: "inlineCode",
      text: "code",
    });
    expect(
      paragraph.children.find((child) => child.kind === "emphasis"),
    ).toEqual({
      children: [{ kind: "text", text: "emphasis" }],
      kind: "emphasis",
      text: "emphasis",
    });
    expect(paragraph.children.find((child) => child.kind === "strong")).toEqual(
      {
        children: [{ kind: "text", text: "strong" }],
        kind: "strong",
        text: "strong",
      },
    );
    expect(code).toMatchObject({
      kind: "code",
      lang: "js",
      text: "const value = 1;",
    });
  });

  test("preserves line breaks and unknown AST nodes in serialized definitions", () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The plugin intentionally preserves unknown MDX/remark node shapes that the mdast Root type cannot enumerate.
    const references = transformTreeWithPluginAndReadReferences({
      children: [
        {
          children: [
            { type: "text", value: "Claim with custom note." },
            {
              identifier: "note-custom",
              label: "note-custom",
              type: "footnoteReference",
            },
          ],
          type: "paragraph",
        },
        {
          children: [
            {
              children: [
                { type: "text", value: "First line" },
                { type: "break" },
                { type: "text", value: "Second line" },
                {
                  children: [{ type: "text", value: "custom inline" }],
                  type: "customInline",
                },
              ],
              type: "paragraph",
            },
            {
              type: "customBlock",
              value: "custom block",
            },
          ],
          identifier: "note-custom",
          label: "note-custom",
          type: "footnoteDefinition",
        },
      ],
      type: "root",
    } as unknown as Root);

    const [paragraph, customBlock] =
      references.notes[0]?.definition.children ?? [];

    if (paragraph?.kind !== "paragraph") {
      throw new Error("Expected custom note paragraph.");
    }

    expect(paragraph.children).toContainEqual({ kind: "break", text: "" });
    expect(paragraph.children).toContainEqual({
      children: [{ kind: "text", text: "custom inline" }],
      kind: "unknown",
      nodeType: "customInline",
      text: "custom inline",
    });
    expect(customBlock).toEqual({
      kind: "unknown",
      nodeType: "customBlock",
      text: "custom block",
    });
  });

  test("normalizes repeated citations from hidden BibTeX data", () => {
    const result = processMarkdown(`
First claim.[^cite-baudrillard-1981] Later claim.[^cite-baudrillard-1981]

\`\`\`tpm-bibtex
@book{baudrillard-1981,
  author = {Baudrillard, Jean},
  title = {Simulacra and Simulation},
  year = {1981},
  url = {https://example.com/source}
}
\`\`\`
`);

    const citation = result.references.citations[0];

    expect(citation?.label).toBe("cite-baudrillard-1981");
    expect(citation?.displayLabel).toBe("Baudrillard 1981");
    expect(citation?.bibtex.key).toBe("baudrillard-1981");
    expect(citation?.references).toHaveLength(2);
    expect(
      citation?.references.map((reference) => reference.displayText),
    ).toEqual(["1", "1"]);
    expect(citation?.definition.children).toHaveLength(1);
    const firstDefinitionBlock = citation?.definition.children[0];

    if (firstDefinitionBlock?.kind !== "paragraph") {
      throw new Error("Expected paragraph citation definition.");
    }

    expect(firstDefinitionBlock.text).toContain("Baudrillard, Jean.");
    expect(
      firstDefinitionBlock.children.some((child) => child.kind === "emphasis"),
    ).toBe(true);
    expect(
      firstDefinitionBlock.children.some((child) => child.kind === "link"),
    ).toBe(true);
    expect(result.html).toContain(">[1]</a>");
    expect(result.html).toContain(
      'data-reference-entry-id="cite-baudrillard-1981"',
    );
    expect(result.html).toContain('data-reference-kind="citation"');
    expect(result.html).not.toContain("tpm-bibtex");
    expect(result.html).not.toContain("@book");
  });

  test("normalizes mixed notes and citations into separate sections", () => {
    const result = processMarkdown(`
Claim.[^cite-source] Context.[^note-context]

[^note-context]: Explanatory note.

\`\`\`tpm-bibtex
@article{source,
  author = {Writer, A.},
  title = {Bibliography entry},
  year = {2024}
}
\`\`\`
`);

    expect(result.references.notes.map((entry) => entry.label)).toEqual([
      "note-context",
    ]);
    expect(result.references.citations.map((entry) => entry.label)).toEqual([
      "cite-source",
    ]);
  });

  test("keeps noncanonical legacy footnotes untouched until strict validation is enabled", () => {
    const result = processMarkdown(`
Legacy claim.[^old-source]

[^old-source]: Legacy source.
`);

    expect(result.references.notes).toHaveLength(0);
    expect(result.references.citations).toHaveLength(0);
    expect(result.html).toContain("data-footnotes");
  });

  test("fails repeated notes", () => {
    expect(() =>
      processMarkdown(`
First note.[^note-repeat] Second note.[^note-repeat]

[^note-repeat]: Repeated note.
`),
    ).toThrow("referenced more than once");
  });

  test("fails obsolete citation definitions", () => {
    expect(() =>
      processMarkdown(`
Bad citation.[^cite-bad-definition]

[^cite-bad-definition]: Obsolete citation prose.
`),
    ).toThrow("obsolete Markdown footnote definition");
  });

  test("fails invalid labels when strict validation is enabled", () => {
    expect(() =>
      processMarkdown(
        `
Legacy claim.[^Old-Source]

[^Old-Source]: Legacy source.
`,
        { validateLegacyFootnotes: true },
      ),
    ).toThrow("Invalid article reference label");
  });

  test("fails missing definitions when the parsed AST exposes a reference", () => {
    expect(() => transformTreeWithPlugin(missingDefinitionTree())).toThrow(
      "has no matching definition",
    );
  });

  test("fails unreferenced and duplicate definitions", () => {
    expect(() => processMarkdown("[^note-unused]: Unused note.")).toThrow(
      "is never used",
    );
    expect(() =>
      processMarkdown(`
Claim.[^note-duplicate]

[^note-duplicate]: First.
[^note-duplicate]: Second.
`),
    ).toThrow("Duplicate article reference definition");
  });

  test("keeps BibTeX entries without inline markers as bibliography-only citations", () => {
    const result = processMarkdown(`
\`\`\`tpm-bibtex
@article{source-list,
  author = {Researcher, B.},
  title = {Source List Entry},
  year = {2020}
}
\`\`\`
`);

    expect(result.references.citations).toHaveLength(1);
    expect(result.references.citations[0]?.label).toBe("cite-source-list");
    expect(result.references.citations[0]?.references).toEqual([]);
    expect(result.references.citations[0]?.displayLabel).toBe(
      "Researcher 2020",
    );
    expect(result.html).not.toContain("tpm-bibtex");
    expect(result.html).not.toContain("@article");
  });

  test("fails missing, duplicate, and malformed BibTeX entries", () => {
    expect(() => processMarkdown("Claim.[^cite-missing]")).toThrow(
      "has no matching BibTeX entry",
    );

    expect(() =>
      processMarkdown(`
Claim.[^cite-source]

\`\`\`tpm-bibtex
@article{source, title = {First}}
@book{source, title = {Second}}
\`\`\`
`),
    ).toThrow("Duplicate BibTeX key");

    expect(() =>
      processMarkdown(`
Claim.[^cite-broken]

\`\`\`tpm-bibtex
@article{broken title = {Broken}}
\`\`\`
`),
    ).toThrow("Malformed BibTeX");
  });

  test("fails the invalid repeated-note fixture before it can become published content", async () => {
    const markdown = await readFile(
      "tests/fixtures/article-references-invalid/repeated-note.md",
      "utf8",
    );

    expect(() => processMarkdown(markdown)).toThrow(
      "referenced more than once",
    );
  });
});

function transformTreeWithPlugin(tree: Root): void {
  remarkArticleReferences()(tree, {
    data: { astro: { frontmatter: {} } },
    fail: (message: string): never => {
      throw new Error(message);
    },
    message: () => undefined,
  });
}

function transformTreeWithPluginAndReadReferences(
  tree: Root,
): ArticleReferenceData {
  const data: Record<string, unknown> = { astro: { frontmatter: {} } };
  remarkArticleReferences()(tree, {
    data,
    fail: (message: string): never => {
      throw new Error(message);
    },
    message: () => undefined,
  });

  return (
    articleReferencesFromFrontmatter(frontmatterFromData(data)) ?? {
      citations: [],
      notes: [],
    }
  );
}

function missingDefinitionTree(): Root {
  return {
    children: [
      {
        children: [
          { type: "text", value: "Missing." },
          {
            identifier: "note-missing",
            label: "note-missing",
            type: "footnoteReference",
          },
        ],
        type: "paragraph",
      },
    ],
    type: "root",
  };
}

function processMarkdown(
  markdown: string,
  options: RemarkArticleReferencesOptions = {},
): {
  html: string;
  references: ArticleReferenceData;
} {
  const file = remark()
    .use(remarkGfm)
    .use(remarkArticleReferences, options)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(markdown);
  const references = articleReferencesFromFrontmatter(
    frontmatterFromData(file.data),
  ) ?? {
    citations: [],
    notes: [],
  };

  return {
    html: String(file),
    references,
  };
}

function frontmatterFromData(data: Record<string, unknown>): unknown {
  const astro = data["astro"];

  if (!isRecord(astro)) {
    return undefined;
  }

  return astro["frontmatter"];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
