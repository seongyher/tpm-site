import { pathToFileURL } from "node:url";

import { describe, expect, test } from "bun:test";
import rehypeStringify from "rehype-stringify";
import { remark } from "remark";
import remarkRehype from "remark-rehype";

import {
  articleImagesFromFrontmatter,
  rehypeArticleImages,
  remarkArticleImageMarkers,
} from "../../../src/rehype-plugins/articleImages";

const standaloneMarkerForTests = "data-article-image-standalone-source";
const markdownPath = "/repo/src/content/articles/example/post.md";

describe("rehypeArticleImages", () => {
  test("ignores missing or malformed image frontmatter", () => {
    expect(articleImagesFromFrontmatter(undefined)).toEqual({
      hasInspectableImages: false,
    });
    expect(
      articleImagesFromFrontmatter({
        articleImages: {
          hasInspectableImages: "yes",
        },
      }),
    ).toEqual({
      hasInspectableImages: false,
    });
  });

  test("wraps standalone Markdown images in bounded inspectable figure markup", async () => {
    const result = await processMarkdownImage(
      `![Long thread screenshot](../assets/thread.png "Thread caption")`,
    );
    const { html } = result;

    expect(html).toContain("data-article-image-figure");
    expect(html).toContain('data-article-image-policy="bounded"');
    expect(html).toContain('data-article-image-inspectable="true"');
    expect(html).toContain("data-article-image-inspect-trigger");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain(
      'aria-label="View full image: Long thread screenshot"',
    );
    expect(html).toContain(
      'sizes="(min-width: 48rem) 48rem, calc(100vw - 2rem)"',
    );
    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchpriority="high"');
    expect(html).toContain("max-h-[min(70svh,34rem)]");
    expect(html).toContain("Thread caption");
    expect(html).toContain('alt="Long thread screenshot"');
    expect(html).not.toContain(">View full image<");
    expect(html).not.toContain("<p><figure");
    expect(
      articleImagesFromFrontmatter(result.frontmatter).hasInspectableImages,
    ).toBe(true);
  });

  test("preserves linked-image intent without adding an inspector trigger", async () => {
    const result = await processMarkdownImage(
      `[![Linked source image](../assets/source.png)](https://example.com/source)`,
    );
    const { html } = result;

    expect(html).toContain('<a href="https://example.com/source"');
    expect(html).toContain('data-article-image-inspectable="false"');
    expect(html).toContain('data-article-image-policy="bounded"');
    expect(html).not.toContain("data-article-image-inspect-trigger");
    expect(html).not.toMatch(/<a\b(?:(?!<\/a>).)*<button/su);
    expect(
      articleImagesFromFrontmatter(result.frontmatter).hasInspectableImages,
    ).toBe(false);
  });

  test("applies the same default policy to remote standalone images", async () => {
    const html = await renderMarkdownImage(
      `![Remote image](https://example.com/image.png)`,
    );

    expect(html).toContain('data-article-image-policy="bounded"');
    expect(html).toContain('data-article-image-remote="true"');
    expect(html).toContain('data-article-image-inspectable="true"');
    expect(html).toContain("data-article-image-inspect-trigger");
    expect(html).toContain("data-pdf-exclude");
    expect(html).toContain("data-article-image-fallback");
    expect(html).toContain('href="https://example.com/image.png"');
    expect(html).toContain(
      'sizes="(min-width: 48rem) 48rem, calc(100vw - 2rem)"',
    );
  });

  test("does not transform inline prose images into block figures", async () => {
    const html = await renderMarkdownImage(
      `Inline emoji ![Laughing emoji](https://example.com/emoji.png) inside prose.`,
    );

    expect(html).toContain("<p>Inline emoji");
    expect(html).toContain("<img");
    expect(html).not.toContain("data-article-image-figure");
  });

  test("accepts Astro MDX camel-cased standalone image markers", () => {
    const image = {
      children: [],
      properties: {
        alt: "MDX image",
        dataArticleImageStandaloneSource: "true",
        src: "../assets/square.png",
      },
      tagName: "img",
      type: "element" as const,
    };
    const tree = {
      children: [
        {
          children: [image],
          properties: {},
          tagName: "p",
          type: "element" as const,
        },
      ],
      type: "root" as const,
    };

    rehypeArticleImages()(tree, { data: {} });

    const [figure] = tree.children as Array<{
      properties?: Record<string, unknown>;
      tagName?: string;
    }>;
    const figureProperties = figure?.properties;

    expect(figure?.tagName).toBe("figure");
    expect(figureProperties?.["data-article-image-policy"]).toBe("bounded");
    expect(figureProperties?.["data-article-image-inspectable"]).toBe("true");
    expect(image.properties).not.toHaveProperty(
      "dataArticleImageStandaloneSource",
    );
  });

  test("wraps direct linked image nodes that arrive outside paragraphs", () => {
    const image = {
      children: [],
      properties: {
        alt: "Direct linked image",
        [standaloneMarkerForTests]: "true",
        src: "../assets/direct.png",
      },
      tagName: "img",
      type: "element" as const,
    };
    const link = {
      children: [image],
      properties: {
        className: ["legacy-link"],
        href: "https://example.com/direct",
      },
      tagName: "a",
      type: "element" as const,
    };
    const tree = {
      children: [link],
      type: "root" as const,
    };

    rehypeArticleImages()(tree, { data: {} });

    const [figure] = tree.children as Array<{
      properties?: Record<string, unknown>;
      tagName?: string;
    }>;
    const rendered = JSON.stringify(figure);

    expect(figure?.tagName).toBe("figure");
    expect(figure?.properties?.["data-article-image-inspectable"]).toBe(
      "false",
    );
    expect(rendered).toContain("legacy-link inline-flex");
    expect(rendered).toContain("https://example.com/direct");
    expect(image.properties).not.toHaveProperty(standaloneMarkerForTests);
  });

  test("ignores width and height properties instead of changing image anatomy", () => {
    const imageProperties: Record<string, unknown> = {
      alt: "Remote 4:3 image",
      height: "900",
      src: "https://example.com/four-three.png",
      [standaloneMarkerForTests]: "true",
      width: "1200",
    };
    const image = {
      children: [],
      properties: imageProperties,
      tagName: "img",
      type: "element" as const,
    };
    const tree = {
      children: [
        {
          children: [image],
          properties: {},
          tagName: "p",
          type: "element" as const,
        },
      ],
      type: "root" as const,
    };

    rehypeArticleImages()(tree, {});

    const [figure] = tree.children as Array<{
      properties?: Record<string, unknown>;
      tagName?: string;
    }>;
    const figureProperties = figure?.properties;

    expect(figureProperties?.["data-article-image-policy"]).toBe("bounded");
    expect(image.properties["sizes"]).toBe(
      "(min-width: 48rem) 48rem, calc(100vw - 2rem)",
    );
  });

  test("prioritizes only the first rendered Markdown article image", async () => {
    const html = await renderMarkdownImage(`
![First article image](../assets/first.png)

Introductory paragraph.

![Second article image](../assets/second.png)
`);

    const imageTags = Array.from(
      html.matchAll(/<img\b[^>]*>/gu),
      ([tag]) => tag,
    );

    expect(imageTags).toHaveLength(2);
    expect(imageTags[0]).toContain('loading="eager"');
    expect(imageTags[0]).toContain('fetchpriority="high"');
    expect(imageTags[1]).toContain('loading="lazy"');
    expect(imageTags[1]).not.toContain("fetchpriority");
  });

  test("wraps article iframes with a print-only PDF fallback link", () => {
    const iframe = {
      children: [],
      properties: {
        src: "https://www.youtube.com/embed/example",
        title: "Video title",
      },
      tagName: "iframe",
      type: "element" as const,
    };
    const tree = {
      children: [iframe],
      type: "root" as const,
    };

    rehypeArticleImages()(tree, { data: {} });

    const [figure] = tree.children as Array<{
      properties?: Record<string, unknown>;
      tagName?: string;
    }>;
    const figureProperties = figure?.properties;
    const iframeProperties = iframe.properties as Record<string, unknown>;

    expect(figure?.tagName).toBe("figure");
    expect(figureProperties?.["data-article-embed"]).toBe("true");
    expect(iframeProperties["data-pdf-exclude"]).toBe("true");
    expect(JSON.stringify(figure)).toContain(
      'data-article-embed-provider":"youtube"',
    );
    expect(JSON.stringify(figure)).toContain("aspect-video");
    expect(JSON.stringify(figure)).toContain("data-article-embed-fallback");
    expect(JSON.stringify(figure)).toContain(
      "https://www.youtube.com/embed/example",
    );
    expect(JSON.stringify(figure)).toContain("Video title");
  });

  test("wraps raw article iframe HTML with the same PDF fallback", () => {
    const tree: {
      children: Array<{
        properties?: Record<string, unknown>;
        tagName?: string;
        type: string;
        value?: string;
      }>;
      type: "root";
    } = {
      children: [
        {
          type: "raw" as const,
          value:
            '<iframe src="https://www.youtube.com/embed/raw" title="Raw video" allowfullscreen></iframe>',
        },
      ],
      type: "root" as const,
    };

    rehypeArticleImages()(tree, { data: {} });

    const [figure] = tree.children;
    const figureProperties = figure?.properties;

    expect(figure?.tagName).toBe("figure");
    expect(figureProperties?.["data-article-embed"]).toBe("true");
    expect(JSON.stringify(figure)).toContain(
      'data-article-embed-provider":"youtube"',
    );
    expect(JSON.stringify(figure)).toContain("data-article-embed-fallback");
    expect(JSON.stringify(figure)).toContain(
      "https://www.youtube.com/embed/raw",
    );
    expect(JSON.stringify(figure)).toContain("Raw video");
  });

  test("leaves non-iframe raw HTML untouched in rehype output", () => {
    const tree = {
      children: [
        {
          type: "raw" as const,
          value: "<div>Legacy raw block</div>",
        },
      ],
      type: "root" as const,
    };

    rehypeArticleImages()(tree, { data: {} });

    expect(tree.children).toEqual([
      {
        type: "raw",
        value: "<div>Legacy raw block</div>",
      },
    ]);
  });

  test("rewrites Markdown raw iframe HTML before Astro preserves it", () => {
    const tree = {
      children: [
        {
          type: "html" as const,
          value:
            '<iframe src="https://www.youtube.com/embed/markdown" title="Markdown video"></iframe>',
        },
      ],
      type: "root" as const,
    };

    remarkArticleImageMarkers()(tree);

    const [html] = tree.children;
    expect(html?.type).toBe("html");
    expect(html?.value).toContain("data-article-embed");
    expect(html?.value).toContain("data-article-embed-fallback");
    expect(html?.value).toContain('data-article-embed-provider="youtube"');
    expect(html?.value).toContain("https://www.youtube.com/embed/markdown");
    expect(html?.value).toContain("Markdown video");
  });

  test("leaves non-iframe Markdown HTML untouched before Astro preserves it", () => {
    const tree = remark().parse("<div>Legacy block</div>");

    remarkArticleImageMarkers()(tree);

    const [html] = tree.children;
    expect(html).toMatchObject({
      type: "html",
      value: "<div>Legacy block</div>",
    });
  });

  test("wraps SoundCloud iframes with compact audio embed layout", () => {
    const iframe = {
      children: [],
      properties: {
        height: "110",
        src: "https://w.soundcloud.com/player/?url=https://soundcloud.com/example/track",
        title: "SoundCloud preview",
      },
      tagName: "iframe",
      type: "element" as const,
    };
    const tree = {
      children: [iframe],
      type: "root" as const,
    };

    rehypeArticleImages()(tree, { data: {} });

    const [figure] = tree.children as Array<{
      properties?: Record<string, unknown>;
      tagName?: string;
    }>;
    const frame = JSON.stringify(figure);

    expect(figure?.tagName).toBe("figure");
    expect(frame).toContain('"data-article-embed-provider":"soundcloud"');
    expect(frame).toContain("h-[110px]");
    expect(frame).not.toContain("aspect-video");
  });

  test("rewrites multiline Markdown raw iframe HTML before Astro preserves it", () => {
    const tree = remark().parse(`<iframe
  width="560"
  height="315"
  src="https://www.youtube.com/embed/multiline"
  title="Multiline video"
  loading="lazy"
  allowfullscreen
></iframe>`);

    remarkArticleImageMarkers()(tree);

    const [html] = tree.children;
    if (html?.type !== "html") {
      throw new Error("Expected multiline iframe to remain raw HTML");
    }

    expect(html.value).toContain("data-article-embed");
    expect(html.value).toContain("data-article-embed-fallback");
    expect(html.value).toContain("data-pdf-exclude");
    expect(html.value).toContain("https://www.youtube.com/embed/multiline");
    expect(html.value).toContain("Multiline video");
  });

  test("rewrites unquoted Markdown iframe attributes and empty titles safely", () => {
    const tree = remark().parse(
      `<iframe src=https://www.youtube.com/embed/unquoted title=""></iframe>`,
    );

    remarkArticleImageMarkers()(tree);

    const [html] = tree.children;
    if (html?.type !== "html") {
      throw new Error("Expected unquoted iframe to remain raw HTML");
    }

    expect(html.value).toContain(
      'href="https://www.youtube.com/embed/unquoted"',
    );
    expect(html.value).toContain(">Embedded media</a>");
    expect(html.value).toContain(
      '<iframe src=https://www.youtube.com/embed/unquoted title=""></iframe>',
    );
  });

  test("rewrites Markdown SoundCloud iframe HTML to compact audio layout", () => {
    const tree = remark().parse(`<iframe
  width="100%"
  height="110"
  src="https://w.soundcloud.com/player/?url=https://soundcloud.com/example/track"
  title="SoundCloud preview"
></iframe>`);

    remarkArticleImageMarkers()(tree);

    const [html] = tree.children;
    if (html?.type !== "html") {
      throw new Error("Expected SoundCloud iframe to remain raw HTML");
    }

    expect(html.value).toContain('data-article-embed-provider="soundcloud"');
    expect(html.value).toContain("h-[110px]");
    expect(html.value).not.toContain("aspect-video");
  });
});

async function renderMarkdownImage(markdown: string): Promise<string> {
  return (await processMarkdownImage(markdown)).html;
}

async function processMarkdownImage(
  markdown: string,
): Promise<{ frontmatter: unknown; html: string }> {
  const file = await remark()
    .use(remarkArticleImageMarkers)
    .use(remarkRehype)
    .use(rehypeArticleImages)
    .use(rehypeStringify)
    .process({
      path: pathToFileURL(markdownPath).href,
      value: markdown,
    });

  return {
    frontmatter: frontmatterFromData(file.data),
    html: String(file),
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
