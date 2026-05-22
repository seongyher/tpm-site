import { describe, expect, test } from "vitest";

import ArticleShareActionRow from "../../../../../src/components/articles/actions/ArticleShareActionRow.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("ArticleShareActionRow", () => {
  test("renders copy, email, and external share actions with stable semantics", async () => {
    const container = await createAstroTestContainer();
    const copyRow = await container.renderToString(ArticleShareActionRow, {
      props: {
        action: {
          copyText: "https://example.com/articles/post/",
          icon: "copy-link",
          id: "copy-link",
          kind: "copy",
          label: "Copy link",
        },
        copyText: JSON.stringify("https://example.com/articles/post/"),
        statusId: "share-status",
      },
    });
    const emailRow = await container.renderToString(ArticleShareActionRow, {
      props: {
        action: {
          href: "mailto:?subject=Post",
          icon: "email",
          id: "email",
          kind: "email",
          label: "Email",
        },
        copyText: JSON.stringify("https://example.com/articles/post/"),
        statusId: "share-status",
      },
    });
    const externalRow = await container.renderToString(ArticleShareActionRow, {
      props: {
        action: {
          href: "https://twitter.com/intent/tweet?url=https%3A%2F%2Fexample.com",
          icon: "x",
          id: "x",
          kind: "external",
          label: "X",
        },
        copyText: JSON.stringify("https://example.com/articles/post/"),
        statusId: "share-status",
      },
    });

    expect(copyRow).toContain("data-article-share-copy-button");
    expect(copyRow).toContain('aria-describedby="share-status"');
    expect(copyRow).toContain("Copy link");
    expect(emailRow).toContain('href="mailto:?subject=Post"');
    expect(emailRow).toContain('data-article-share-action="email"');
    expect(externalRow).toContain('type="button"');
    expect(externalRow).toContain('data-article-share-action="x"');
    expect(externalRow).toContain("data-article-share-open-button");
    expect(externalRow).toContain("data-article-share-open-url");
    expect(externalRow).not.toContain('href="https://twitter.com');
  });
});
