import { describe, expect, test } from "bun:test";

import { parseContentSource } from "../../../scripts/content/parse-content-source";

describe("content source parsing", () => {
  test.each(["\n", "\r\n"])(
    "preserves body and line offsets with %j newlines",
    (newline) => {
      const body = `${newline}# Heading${newline}${newline}Body --- text${newline}`;
      const source = ["---", "title: Test", "---", body].join(newline);

      expect(parseContentSource(source)).toEqual({
        content: body,
        data: { title: "Test" },
      });
      expect(source.indexOf(parseContentSource(source).content)).toBe(
        source.indexOf(body),
      );
    },
  );

  test("preserves dates, quoted descriptions, aliases, and merge keys", () => {
    const source =
      "---\ndate: 2017-12-15 15:06:00 +13:00\ndescription: 'First line\n\n  '\ndefaults: &defaults\n  draft: false\n<<: *defaults\n---\nBody\n";
    const { data, content } = parseContentSource(source);

    expect(data["date"]).toEqual(new Date("2017-12-15T02:06:00.000Z"));
    expect(data["description"]).toBe("First line\n");
    expect(data["draft"]).toBe(false);
    expect(content).toBe("Body\n");
  });

  test.each(["", "\n# Heading\n", "Text\n---\nBody", "\uFEFFPlain text"])(
    "keeps content without frontmatter: %j",
    (source) => {
      expect(parseContentSource(source)).toEqual({
        content: source.replace(/^\uFEFF/u, ""),
        data: {},
      });
    },
  );

  test("handles a BOM, empty metadata, and an empty body", () => {
    expect(parseContentSource("\uFEFF---\n---\nBody")).toEqual({
      content: "Body",
      data: {},
    });
    expect(parseContentSource("---\ntitle: Test\n---")).toEqual({
      content: "",
      data: { title: "Test" },
    });
  });

  test("does not expose sequence frontmatter as a record", () => {
    expect(
      parseContentSource("---\n- first\n- second\n---\nBody").data,
    ).toEqual({});
  });

  test("rejects invalid YAML with the same parser used by the site", () => {
    expect(() =>
      parseContentSource("---\ntitle: [unterminated\n---\nBody"),
    ).toThrow();
  });
});
