import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, spyOn, test } from "bun:test";
import { Window as HappyWindow } from "happy-dom";
import { PDFDocument } from "pdf-lib";

import {
  articlePdfContentType,
  type ArticlePdfImagePreparationElement,
  type ArticlePdfImagePreparationPage,
  articlePdfLocalUrl,
  articlePdfPathnameFromAbsoluteUrl,
  articlePdfPreferredSrcsetUrl,
  articlePdfRenderStatsFromImageSnapshots,
  articlePdfRenderStatsIssues,
  articlePdfSmallestSrcsetUrl,
  articlePdfSrcsetCandidates,
  articlePdfStaticFilePath,
  articlePdfStaticRouteResponse,
  articlePdfTargets,
  generateArticlePdfs,
  prepareArticlePdfImages,
  runGenerateArticlePdfsCli,
  validateGeneratedArticlePdf,
} from "../../scripts/build/generate-article-pdfs";

async function withTempRoot<T>(callback: (root: string) => Promise<T> | T) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-pdf-test-"));

  try {
    return await callback(root);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

async function writeText(root: string, relativePath: string, text: string) {
  const fullPath = path.join(root, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, text);
}

async function blankPdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.addPage([200, 200]);

  return pdf.save();
}

class TestArticlePdfImageHandle implements ArticlePdfImagePreparationElement {
  public scrollCount = 0;

  public constructor(
    private readonly window: InstanceType<typeof HappyWindow>,
    private readonly element: Element,
  ) {}

  public async evaluate<Result>(
    callback: (element: Element) => Promise<Result> | Result,
  ): Promise<Result> {
    return await withBrowserGlobals(this.window, async () =>
      callback(this.element),
    );
  }

  public async scrollIntoViewIfNeeded(): Promise<void> {
    await Promise.resolve();
    this.scrollCount += 1;
  }
}

class TestArticlePdfImagePage implements ArticlePdfImagePreparationPage {
  public readonly handles: TestArticlePdfImageHandle[];

  public constructor(
    private readonly window: InstanceType<typeof HappyWindow>,
    selector: string,
  ) {
    this.handles = Array.from(
      browserDocument(window).querySelectorAll(selector),
      (element) => new TestArticlePdfImageHandle(window, element),
    );
  }

  public async evaluate<Result>(
    callback: () => Promise<Result> | Result,
  ): Promise<Result> {
    return await withBrowserGlobals(this.window, callback);
  }

  public locator(): {
    elementHandles: () => Promise<TestArticlePdfImageHandle[]>;
  } {
    return {
      elementHandles: async () => Promise.resolve(this.handles),
    };
  }
}

async function withBrowserGlobals<Result>(
  window: InstanceType<typeof HappyWindow>,
  callback: () => Promise<Result> | Result,
): Promise<Result> {
  const previousGlobals = {
    Element: globalThis.Element,
    HTMLImageElement: globalThis.HTMLImageElement,
    document: globalThis.document,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    window: globalThis.window,
  };

  try {
    Reflect.set(globalThis, "Element", window.Element);
    Reflect.set(globalThis, "HTMLImageElement", window.HTMLImageElement);
    Reflect.set(globalThis, "document", window.document);
    Reflect.set(globalThis, "window", window);
    Reflect.set(
      globalThis,
      "requestAnimationFrame",
      (frame: FrameRequestCallback) => {
        frame(0);
        return 1;
      },
    );

    return await callback();
  } finally {
    Reflect.set(globalThis, "Element", previousGlobals.Element);
    Reflect.set(
      globalThis,
      "HTMLImageElement",
      previousGlobals.HTMLImageElement,
    );
    Reflect.set(globalThis, "document", previousGlobals.document);
    Reflect.set(
      globalThis,
      "requestAnimationFrame",
      previousGlobals.requestAnimationFrame,
    );
    Reflect.set(globalThis, "window", previousGlobals.window);
  }
}

function browserDocument(window: InstanceType<typeof HappyWindow>): Document {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements the browser Document contract needed by these browser callbacks.
  return window.document as unknown as Document;
}

describe("article PDF generator", () => {
  test("maps generated PDF route URLs to local render URLs and pathnames", () => {
    expect(articlePdfLocalUrl("/articles/live/")).toBe(
      "http://article-pdf.local/articles/live/",
    );
    expect(articlePdfLocalUrl("articles/live/")).toBe(
      "http://article-pdf.local/articles/live/",
    );
    expect(
      articlePdfPathnameFromAbsoluteUrl(
        "https://example.com/articles/live/?print=true#figure",
      ),
    ).toBe("/articles/live/");
    expect(articlePdfPathnameFromAbsoluteUrl("https://example.com")).toBe("/");
    expect(articlePdfPathnameFromAbsoluteUrl("/assets/app.js?hash#chunk")).toBe(
      "/assets/app.js",
    );
  });

  test("serves only generated static files under the PDF dist directory", async () =>
    withTempRoot(async (root) => {
      const distDir = path.join(root, "dist");
      await writeText(distDir, "index.html", "<main>Home</main>");
      await writeText(distDir, "articles/live/index.html", "<main>Live</main>");

      expect(articlePdfStaticFilePath(distDir, "/")).toBe(
        path.join(distDir, "index.html"),
      );
      expect(articlePdfStaticFilePath(distDir, "/articles/live/")).toBe(
        path.join(distDir, "articles/live/index.html"),
      );
      expect(
        articlePdfStaticFilePath(distDir, "/../secret.txt"),
      ).toBeUndefined();
      expect(
        articlePdfStaticFilePath(distDir, "/%2E%2E/secret.txt"),
      ).toBeUndefined();

      const home = await articlePdfStaticRouteResponse(distDir, "/");
      const article = await articlePdfStaticRouteResponse(
        distDir,
        "/articles/live/",
      );
      const missing = await articlePdfStaticRouteResponse(distDir, "/missing/");
      const escaped = await articlePdfStaticRouteResponse(
        distDir,
        "/../secret.txt",
      );

      expect(home).toMatchObject({
        contentType: "text/html; charset=utf-8",
        status: 200,
      });
      expect(
        home.body instanceof Buffer
          ? home.body.toString("utf8")
          : String(home.body),
      ).toContain("Home");
      expect(article.status).toBe(200);
      expect(missing).toEqual({
        body: "Not found",
        contentType: "text/plain",
        status: 404,
      });
      expect(escaped).toEqual({
        body: "Not found",
        contentType: "text/plain",
        status: 404,
      });
    }));

  test("uses deterministic content types for PDF render static files", () => {
    expect(
      [
        ".avif",
        ".css",
        ".gif",
        ".html",
        ".jpg",
        ".js",
        ".json",
        ".pdf",
        ".png",
        ".svg",
        ".webp",
        ".xml",
        ".unknown",
      ].map((extension) => articlePdfContentType(`asset${extension}`)),
    ).toEqual([
      "image/avif",
      "text/css; charset=utf-8",
      "image/gif",
      "text/html; charset=utf-8",
      "image/jpeg",
      "text/javascript; charset=utf-8",
      "application/json; charset=utf-8",
      "application/pdf",
      "image/png",
      "image/svg+xml",
      "image/webp",
      "application/xml; charset=utf-8",
      "application/octet-stream",
    ]);
  });

  test("derives sorted targets and skips draft or PDF-disabled articles", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "src/content/articles/history/live.md",
        [
          "---",
          "title: Live Article",
          "author: First Author & Second Author",
          "description: Article description.",
          "date: 2022-04-06",
          "tags:",
          "  - meme research",
          "---",
        ].join("\n"),
      );
      await writeText(
        root,
        "src/content/articles/history/draft.md",
        "---\ntitle: Draft\nauthor: Author\ndraft: true\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/web-only.md",
        "---\ntitle: Web Only\nauthor: Author\npdf: false\n---\n",
      );

      const targets = await articlePdfTargets({
        articleDir: path.join(root, "src/content/articles"),
        distDir: path.join(root, "dist"),
      });

      expect(targets).toHaveLength(1);
      expect(targets[0]?.slug).toBe("live");
      expect(targets[0]?.pdfHref).toBe("/articles/live/live.pdf");
      expect(targets[0]?.metadata).toMatchObject({
        authors: ["First Author", "Second Author"],
        keywords: ["history", "meme research"],
        subject: "Article description.",
        title: "Live Article",
      });
    }));

  test("derives metadata fallbacks from sparse article frontmatter", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "src/content/articles/notes/fallback-title.md",
        "---\ndate: invalid-date\ntags:\n  - useful\n  - 42\n---\n",
      );

      const targets = await articlePdfTargets({
        articleDir: path.join(root, "src/content/articles"),
        distDir: path.join(root, "dist"),
      });

      expect(targets).toHaveLength(1);
      expect(targets[0]?.metadata).toEqual({
        authors: [],
        keywords: ["notes", "useful"],
        publicationDate: undefined,
        subject: undefined,
        title: "fallback-title",
      });
    }));

  test("renders PDFs through a test renderer and applies document metadata", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "src/content/articles/history/live.md",
        [
          "---",
          "title: Live Article",
          "author: Author",
          "description: Article description.",
          "date: 2022-04-06",
          "---",
        ].join("\n"),
      );

      const result = await generateArticlePdfs(
        {
          articleDir: path.join(root, "src/content/articles"),
          distDir: path.join(root, "dist"),
        },
        {
          createRenderer: async () => {
            await Promise.resolve();
            return {
              close: async () => {
                await Promise.resolve();
              },
              render: async (target) => {
                await writeFile(target.outputPath, await blankPdf());
                return {
                  articleImageCount: 2,
                  optimizedArticleImageCount: 2,
                  unoptimizedArticleImageSources: [],
                  unloadedArticleImages: [],
                };
              },
            };
          },
        },
      );
      const pdf = await PDFDocument.load(
        await Bun.file(path.join(root, "dist/articles/live/live.pdf")).bytes(),
      );

      expect(result).toEqual({
        generatedCount: 1,
        imageCount: 2,
        issues: [],
        optimizedImageCount: 2,
      });
      expect(pdf.getTitle()).toBe("Live Article");
      expect(pdf.getAuthor()).toBe("Author");
      expect(pdf.getSubject()).toBe("Article description.");
      expect(pdf.getKeywords()).toContain("history");
    }));

  test("closes the renderer and reports per-target render failures", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "src/content/articles/history/first.md",
        "---\ntitle: First\nauthor: Author\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/second.md",
        "---\ntitle: Second\nauthor: Author\n---\n",
      );
      let closeCount = 0;

      const result = await generateArticlePdfs(
        {
          articleDir: path.join(root, "src/content/articles"),
          distDir: path.join(root, "dist"),
        },
        {
          createRenderer: async () => {
            await Promise.resolve();
            return {
              close: async () => {
                await Promise.resolve();
                closeCount += 1;
              },
              render: async (target) => {
                await Promise.resolve();
                if (target.slug === "first") {
                  return {
                    articleImageCount: 1,
                    optimizedArticleImageCount: 0,
                    unoptimizedArticleImageSources: ["/images/raw.png"],
                    unloadedArticleImages: [],
                  };
                }

                throw new Error("renderer exploded");
              },
            };
          },
        },
      );

      expect(closeCount).toBe(1);
      expect(result).toEqual({
        generatedCount: 0,
        imageCount: 0,
        issues: [
          "articles/first/first.pdf: article images bypassed Astro optimization: /images/raw.png",
          "articles/second/second.pdf: renderer exploded",
        ],
        optimizedImageCount: 0,
      });
    }));

  test("reports generated PDFs that fail validation after rendering", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "src/content/articles/history/live.md",
        "---\ntitle: Live Article\nauthor: Author\n---\n",
      );

      const result = await generateArticlePdfs(
        {
          articleDir: path.join(root, "src/content/articles"),
          distDir: path.join(root, "dist"),
          maxPdfBytes: 1,
        },
        {
          createRenderer: async () => {
            await Promise.resolve();
            return {
              close: async () => {
                await Promise.resolve();
              },
              render: async (target) => {
                await writeFile(target.outputPath, await blankPdf());
                return {
                  articleImageCount: 0,
                  optimizedArticleImageCount: 0,
                  unoptimizedArticleImageSources: [],
                  unloadedArticleImages: [],
                };
              },
            };
          },
        },
      );

      expect(result.generatedCount).toBe(0);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toStartWith(
        "articles/live/live.pdf: generated PDF is",
      );
    }));

  test("reports article images that fail to load before PDF rendering", async () => {
    await withTempRoot((root) => {
      const issueTarget = {
        articleHref: "/articles/live/",
        metadata: {
          authors: ["Author"],
          keywords: [],
          title: "Live Article",
        },
        outputPath: path.join(root, "dist/articles/live/live.pdf"),
        pdfHref: "/articles/live/live.pdf",
        relativeOutputPath: "articles/live/live.pdf",
        slug: "live",
        sourcePath: path.join(root, "src/content/articles/history/live.md"),
      };

      expect(
        articlePdfRenderStatsIssues(issueTarget, {
          articleImageCount: 2,
          optimizedArticleImageCount: 1,
          unoptimizedArticleImageSources: [],
          unloadedArticleImages: ["Figure 7"],
        }),
      ).toEqual([
        "articles/live/live.pdf: article images failed to load before PDF rendering: Figure 7",
      ]);
      expect(
        articlePdfRenderStatsIssues(issueTarget, {
          articleImageCount: 2,
          optimizedArticleImageCount: 1,
          unoptimizedArticleImageSources: ["/images/raw.png"],
          unloadedArticleImages: [],
        }),
      ).toEqual([
        "articles/live/live.pdf: article images bypassed Astro optimization: /images/raw.png",
      ]);
    });
  });

  test("summarizes browser image snapshots for PDF diagnostics", () => {
    const stats = articlePdfRenderStatsFromImageSnapshots(
      [
        {
          alt: "Loaded optimized image",
          complete: true,
          currentSrc: "http://article-pdf.local/_astro/loaded.webp",
          naturalHeight: 200,
          naturalWidth: 320,
          src: "/_astro/loaded.webp",
        },
        {
          alt: "Figure alt fallback",
          complete: false,
          currentSrc: "",
          naturalHeight: 0,
          naturalWidth: 0,
          src: "/images/raw.png",
        },
        {
          alt: "",
          complete: false,
          currentSrc: "https://cdn.example.com/fallback.jpg",
          naturalHeight: 0,
          naturalWidth: 0,
          src: "/images/fallback.jpg",
        },
        {
          alt: "",
          complete: false,
          currentSrc: "",
          naturalHeight: 0,
          naturalWidth: 0,
          src: null,
        },
        {
          alt: "",
          complete: false,
          currentSrc: "",
          naturalHeight: 0,
          naturalWidth: 0,
          src: "/images/source-only.jpg",
        },
      ],
      "http://article-pdf.local",
    );

    expect(stats).toEqual({
      articleImageCount: 5,
      optimizedArticleImageCount: 1,
      unloadedArticleImages: [
        "Figure alt fallback",
        "https://cdn.example.com/fallback.jpg",
        "image 4",
        "/images/source-only.jpg",
      ],
      unoptimizedArticleImageSources: [
        "/images/raw.png",
        "https://cdn.example.com/fallback.jpg",
        "",
        "/images/source-only.jpg",
      ],
    });
  });

  test("prepares printable article images for deterministic PDF rendering", async () => {
    const window = new HappyWindow({
      url: "http://article-pdf.local/articles/live/",
    });
    Reflect.set(window, "SyntaxError", SyntaxError);
    const document = browserDocument(window);
    const printableImage = document.createElement("img");
    printableImage.dataset["articleImage"] = "true";
    printableImage.alt = "Pixel";
    printableImage.src = "/_astro/pixel-large.svg";
    printableImage.srcset =
      "/_astro/pixel-large.svg 800w, /_astro/pixel-small.svg 384w";
    printableImage.sizes = "100vw";
    const excludedWrap = document.createElement("div");
    excludedWrap.dataset["pdfExclude"] = "true";
    const excludedImage = document.createElement("img");
    excludedImage.dataset["articleImage"] = "true";
    excludedImage.alt = "Excluded";
    excludedImage.src = "/_astro/excluded.svg";
    excludedWrap.append(excludedImage);
    document.body.append(printableImage, excludedWrap);

    Object.defineProperty(printableImage, "complete", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(printableImage, "naturalHeight", {
      configurable: true,
      value: 1,
    });
    Object.defineProperty(printableImage, "naturalWidth", {
      configurable: true,
      value: 1,
    });
    Object.defineProperty(printableImage, "currentSrc", {
      configurable: true,
      get: () => printableImage.src,
    });
    Reflect.set(printableImage, "decode", async () =>
      Promise.reject(
        new Error("Decode failures are reported through image state"),
      ),
    );
    const page = new TestArticlePdfImagePage(window, "img[data-article-image]");

    const stats = await prepareArticlePdfImages(page);

    expect(stats).toEqual({
      articleImageCount: 1,
      optimizedArticleImageCount: 1,
      unloadedArticleImages: [],
      unoptimizedArticleImageSources: [],
    });
    expect(printableImage.getAttribute("srcset")).toBeNull();
    expect(printableImage.getAttribute("sizes")).toBeNull();
    expect(printableImage.getAttribute("loading")).toBe("eager");
    expect(page.handles[0]?.scrollCount).toBe(1);
    expect(page.handles[1]?.scrollCount).toBe(0);
  });

  test("chooses the smallest Astro srcset candidate for compact PDF images", () => {
    const srcset = [
      "/_astro/image.large.webp 1280w",
      "/_astro/image.small.webp 640w",
      "/_astro/image.medium.webp 828w",
      "/_astro/image.density.webp 2x",
      "/_astro/image.pdf.webp 384w",
      "bad-candidate",
    ].join(", ");

    expect(articlePdfSrcsetCandidates(srcset)).toEqual([
      { url: "/_astro/image.pdf.webp", width: 384 },
      { url: "/_astro/image.small.webp", width: 640 },
      { url: "/_astro/image.medium.webp", width: 828 },
      { url: "/_astro/image.large.webp", width: 1280 },
    ]);
    expect(articlePdfSmallestSrcsetUrl(srcset)).toBe("/_astro/image.pdf.webp");
    expect(articlePdfPreferredSrcsetUrl(srcset)).toBe("/_astro/image.pdf.webp");
    expect(articlePdfPreferredSrcsetUrl(srcset, 800)).toBe(
      "/_astro/image.medium.webp",
    );
    expect(articlePdfPreferredSrcsetUrl("/_astro/tiny.webp 320w")).toBe(
      "/_astro/tiny.webp",
    );
    expect(articlePdfSmallestSrcsetUrl("")).toBeUndefined();
    expect(articlePdfPreferredSrcsetUrl("")).toBeUndefined();
  });

  test("reports invalid PDF files and oversized output", async () =>
    withTempRoot(async (root) => {
      const outputPath = path.join(root, "dist/articles/live/live.pdf");
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, "not a pdf");

      const invalidIssues = await validateGeneratedArticlePdf({
        articleHref: "/articles/live/",
        metadata: {
          authors: ["Author"],
          keywords: [],
          title: "Live Article",
        },
        outputPath,
        pdfHref: "/articles/live/live.pdf",
        relativeOutputPath: "articles/live/live.pdf",
        slug: "live",
        sourcePath: path.join(root, "src/content/articles/history/live.md"),
      });

      expect(invalidIssues).toEqual([
        "articles/live/live.pdf: generated file is not a PDF",
      ]);

      await writeFile(outputPath, await blankPdf());
      const oversizedIssues = await validateGeneratedArticlePdf(
        {
          articleHref: "/articles/live/",
          metadata: {
            authors: ["Author"],
            keywords: [],
            title: "Live Article",
          },
          outputPath,
          pdfHref: "/articles/live/live.pdf",
          relativeOutputPath: "articles/live/live.pdf",
          slug: "live",
          sourcePath: path.join(root, "src/content/articles/history/live.md"),
        },
        { maxPdfBytes: 1 },
      );
      expect(
        oversizedIssues.some((issue) =>
          issue.startsWith("articles/live/live.pdf: generated PDF is"),
        ),
      ).toBe(true);
    }));

  test.serial("prints command usage without generating PDFs", async () => {
    const log = spyOn(console, "log").mockImplementation(() => undefined);

    try {
      const exitCode = await runGenerateArticlePdfsCli(["--help"]);

      expect(exitCode).toBe(0);
      expect(String(log.mock.calls[0]?.[0])).toContain("Usage: just build-pdf");
    } finally {
      log.mockRestore();
    }
  });

  test.serial(
    "runs the quiet CLI path through injected renderer dependencies",
    async () =>
      withTempRoot(async (root) => {
        await writeText(
          root,
          "src/content/articles/history/live.md",
          "---\ntitle: Live Article\nauthor: Author\n---\n",
        );
        const log = spyOn(console, "log").mockImplementation(() => undefined);
        const error = spyOn(console, "error").mockImplementation(
          () => undefined,
        );

        try {
          const exitCode = await runGenerateArticlePdfsCli(
            ["--articles", "src/content/articles", "--dir", "dist", "--quiet"],
            root,
            {
              createRenderer: async () => {
                await Promise.resolve();
                return {
                  close: async () => {
                    await Promise.resolve();
                  },
                  render: async (target) => {
                    await writeFile(target.outputPath, await blankPdf());
                    return {
                      articleImageCount: 0,
                      optimizedArticleImageCount: 0,
                      unoptimizedArticleImageSources: [],
                      unloadedArticleImages: [],
                    };
                  },
                };
              },
            },
          );

          expect(exitCode).toBe(0);
          expect(log).not.toHaveBeenCalled();
          expect(error).not.toHaveBeenCalled();
        } finally {
          log.mockRestore();
          error.mockRestore();
        }
      }),
  );

  test.serial("prints the non-quiet CLI success report", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "src/content/articles/history/live.md",
        "---\ntitle: Live Article\nauthor: Author\n---\n",
      );
      const log = spyOn(console, "log").mockImplementation(() => undefined);
      const error = spyOn(console, "error").mockImplementation(() => undefined);

      try {
        const exitCode = await runGenerateArticlePdfsCli(
          ["--articles", "src/content/articles", "--dir", "dist"],
          root,
          {
            createRenderer: async () => {
              await Promise.resolve();
              return {
                close: async () => {
                  await Promise.resolve();
                },
                render: async (target) => {
                  await writeFile(target.outputPath, await blankPdf());
                  return {
                    articleImageCount: 1,
                    optimizedArticleImageCount: 1,
                    unoptimizedArticleImageSources: [],
                    unloadedArticleImages: [],
                  };
                },
              };
            },
          },
        );

        expect(exitCode).toBe(0);
        expect(String(log.mock.calls.at(-1)?.[0])).toBe(
          "Generated 1 article PDFs with 1/1 optimized article images.",
        );
        expect(error).not.toHaveBeenCalled();
      } finally {
        log.mockRestore();
        error.mockRestore();
      }
    }),
  );

  test.serial(
    "prints the CLI issue report when generation finds diagnostics",
    async () =>
      withTempRoot(async (root) => {
        await writeText(
          root,
          "src/content/articles/history/live.md",
          "---\ntitle: Live Article\nauthor: Author\n---\n",
        );
        const log = spyOn(console, "log").mockImplementation(() => undefined);
        const error = spyOn(console, "error").mockImplementation(
          () => undefined,
        );

        try {
          const exitCode = await runGenerateArticlePdfsCli(
            ["--articles", "src/content/articles", "--dir", "dist"],
            root,
            {
              createRenderer: async () => {
                await Promise.resolve();
                return {
                  close: async () => {
                    await Promise.resolve();
                  },
                  render: async () => {
                    await Promise.resolve();
                    return {
                      articleImageCount: 1,
                      optimizedArticleImageCount: 0,
                      unoptimizedArticleImageSources: ["/raw.png"],
                      unloadedArticleImages: [],
                    };
                  },
                };
              },
            },
          );

          expect(exitCode).toBe(1);
          expect(log).not.toHaveBeenCalled();
          expect(String(error.mock.calls.at(-1)?.[0])).toContain(
            "Article PDF generation failed.\n- articles/live/live.pdf: article images bypassed Astro optimization: /raw.png",
          );
        } finally {
          log.mockRestore();
          error.mockRestore();
        }
      }),
  );

  test.serial("reports CLI argument and generation failures", async () =>
    withTempRoot(async (root) => {
      const error = spyOn(console, "error").mockImplementation(() => undefined);

      try {
        expect(await runGenerateArticlePdfsCli(["--dir"], root)).toBe(1);
        expect(String(error.mock.calls.at(-1)?.[0])).toContain(
          "Missing value for --dir.",
        );

        expect(
          await runGenerateArticlePdfsCli(["--articles", "missing"], root),
        ).toBe(1);
        expect(String(error.mock.calls.at(-1)?.[0])).toContain("missing");
      } finally {
        error.mockRestore();
      }
    }),
  );
});
