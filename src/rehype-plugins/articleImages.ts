/* eslint-disable security/detect-object-injection -- Markdown and HAST plugins normalize dynamic property bags from parsed article nodes. */
import type { Html, Image, Link, Nodes, Root, Text } from "mdast";

import { articleImagePresentation } from "../lib/articles/article-image-policy";
import {
  classifyEmbedMedia,
  embedFrameClassName,
  embedIframeClassName,
} from "../lib/articles/embed-media";

interface HastParent {
  children: HastNode[];
  type: "element" | "root";
}

interface HastElement extends HastParent {
  properties?: Record<string, unknown>;
  tagName: string;
  type: "element";
}

interface HastText {
  type: "text";
  value: string;
}

interface HastRaw {
  type: "raw";
  value: string;
}

type HastNode = HastElement | HastRaw | HastText | { type: string };

interface VFileLike {
  data?: {
    astro?: {
      frontmatter?: Record<string, unknown>;
    };
  };
}

type MdastParentNode = Nodes & { children: Nodes[] };

interface RehypeArticleImagesOptions {
  /**
   * Cache-busting policy version passed from Astro config. Astro's content
   * cache does not reliably notice imported helper-only policy changes in
   * plugin function bodies, so config carries a serializable policy key.
   */
  policyCacheKey?: string;
}

interface RemarkArticleImageMarkersOptions {
  /**
   * Cache-busting policy version passed from Astro config. Astro's content
   * cache does not reliably notice imported helper-only policy changes in
   * plugin function bodies, so config carries a serializable policy key.
   */
  policyCacheKey?: string;
}

/** Serializable render metadata emitted by the article-image rehype plugin. */
interface ArticleImageRenderData {
  hasInspectableImages: boolean;
}

interface ArticleImagesFrontmatter {
  articleImages?: unknown;
}

interface ArticleImageTransformContext {
  renderedImageCount: number;
}

const frontmatterKey = "articleImages";
const standaloneImageProperty = "data-article-image-standalone-source";
const standaloneImagePropertyAliases = [
  standaloneImageProperty,
  "dataArticleImageStandaloneSource",
] as const;

/**
 * Reads article image render metadata from Astro remark plugin frontmatter.
 *
 * @param frontmatter Unknown `render(entry).remarkPluginFrontmatter` value.
 * @returns Serializable article image render flags for layout composition.
 */
export function articleImagesFromFrontmatter(
  frontmatter: unknown,
): ArticleImageRenderData {
  if (!hasArticleImagesFrontmatter(frontmatter)) {
    return { hasInspectableImages: false };
  }

  const data = frontmatter.articleImages;

  if (!isArticleImageRenderData(data)) {
    return { hasInspectableImages: false };
  }

  return data;
}

/**
 * Remark plugin that marks only standalone Markdown images for figure output.
 *
 * @param options Serializable build policy options passed through Astro config.
 * @returns A Markdown AST transformer used before Astro converts images to HTML.
 */
export function remarkArticleImageMarkers(
  options: RemarkArticleImageMarkersOptions = {},
): (tree: Root) => void {
  void options.policyCacheKey;

  return function markArticleImages(tree: Root) {
    transformRawIframeHtml(tree);
    markStandaloneImages(tree);
  };
}

/**
 * Rehype plugin that gives plain Markdown article images editorial anatomy.
 *
 * @param options Serializable build policy options passed through Astro config.
 * @returns An HTML AST transformer that wraps standalone images in figures.
 */
export function rehypeArticleImages(
  options: RehypeArticleImagesOptions = {},
): (tree: HastParent, file: VFileLike) => void {
  void options.policyCacheKey;

  return function transformArticleImages(tree: HastParent, file: VFileLike) {
    transformChildren(tree, [], file, { renderedImageCount: 0 });
  };
}

function transformChildren(
  parent: HastParent,
  ancestors: readonly HastElement[],
  file: VFileLike,
  context: ArticleImageTransformContext,
): void {
  parent.children = parent.children.map((child) => {
    if (!isElement(child) || isInsideFigure(ancestors)) {
      const rawIframe = rawIframeElement(child);
      if (rawIframe !== undefined && !isInsideFigure(ancestors)) {
        return articleEmbed(rawIframe);
      }

      return child;
    }

    if (child.tagName === "iframe") {
      return articleEmbed(child);
    }

    const standaloneImage = standaloneImageFromParagraph(child);

    if (standaloneImage !== undefined) {
      return articleFigure(
        standaloneImage.image,
        file,
        context,
        standaloneImage.link,
      );
    }

    if (child.tagName === "p") {
      return child;
    }

    const linkedImage = linkedImageFromAnchor(child);

    if (
      linkedImage !== undefined &&
      isMarkedStandaloneImage(linkedImage.image)
    ) {
      return articleFigure(linkedImage.image, file, context, child);
    }

    if (child.tagName === "img" && isMarkedStandaloneImage(child)) {
      return articleFigure(child, file, context);
    }

    transformChildren(child, [...ancestors, child], file, context);
    return child;
  });
}

function rawIframeElement(node: HastNode): HastElement | undefined {
  if (!isRaw(node)) {
    return undefined;
  }

  const raw = node.value.trim();
  if (!/^<iframe\b/i.test(raw)) {
    return undefined;
  }

  return {
    children: [],
    properties: rawHtmlAttributes(raw),
    tagName: "iframe",
    type: "element",
  };
}

function rawHtmlAttributes(raw: string): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const tagBody = raw.slice(raw.indexOf("<iframe") + "<iframe".length);
  let index = 0;

  while (index < tagBody.length) {
    index = skipWhitespace(tagBody, index);
    const nameStart = index;

    while (index < tagBody.length && isHtmlAttributeNameChar(tagBody[index])) {
      index += 1;
    }

    const name = tagBody.slice(nameStart, index).toLowerCase();
    if (name.length === 0 || name.includes("/")) {
      index += 1;
      continue;
    }

    index = skipWhitespace(tagBody, index);
    if (tagBody[index] !== "=") {
      properties[name] = true;
      continue;
    }

    index = skipWhitespace(tagBody, index + 1);
    const parsedValue = readHtmlAttributeValue(tagBody, index);
    properties[name] = parsedValue.value;
    index = parsedValue.nextIndex;
  }

  return properties;
}

function skipWhitespace(value: string, index: number): number {
  let cursor = index;

  while (cursor < value.length && isWhitespaceChar(value[cursor])) {
    cursor += 1;
  }

  return cursor;
}

function readHtmlAttributeValue(
  value: string,
  index: number,
): { nextIndex: number; value: string } {
  const quote = value[index];
  if (quote === '"' || quote === "'") {
    const closingIndex = value.indexOf(quote, index + 1);
    const nextIndex = closingIndex === -1 ? value.length : closingIndex + 1;

    return {
      nextIndex,
      value: value.slice(
        index + 1,
        closingIndex === -1 ? value.length : closingIndex,
      ),
    };
  }

  let cursor = index;
  while (
    cursor < value.length &&
    !isWhitespaceChar(value[cursor]) &&
    value[cursor] !== ">"
  ) {
    cursor += 1;
  }

  return {
    nextIndex: cursor,
    value: value.slice(index, cursor),
  };
}

function isWhitespaceChar(char: string | undefined): boolean {
  return char === " " || char === "\n" || char === "\r" || char === "\t";
}

function isHtmlAttributeNameChar(char: string | undefined): boolean {
  if (char === undefined) {
    return false;
  }

  const code = char.codePointAt(0);
  return (
    code !== undefined &&
    ((code >= 48 && code <= 57) ||
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122) ||
      char === ":" ||
      char === "-")
  );
}

function articleEmbed(iframe: HastElement): HastElement {
  const src = stringProperty(iframe, "src");
  const title = stringProperty(iframe, "title") ?? "Embedded media";
  const classification = classifyEmbedMedia(src);
  const fallbackChildren: HastNode[] =
    src === undefined || src.trim() === ""
      ? [{ type: "text", value: "Embedded media is unavailable in PDF." }]
      : [
          { type: "text", value: "Embedded media: " },
          {
            children: [
              {
                type: "text",
                value: title.trim() !== "" ? title.trim() : src,
              },
            ],
            properties: { href: src },
            tagName: "a",
            type: "element",
          },
        ];

  iframe.properties = {
    ...iframe.properties,
    className: mergeClassName(
      iframe.properties?.["className"],
      embedIframeClassName(classification.layout),
    ),
    "data-pdf-exclude": "true",
  };

  return {
    children: [
      {
        children: [iframe],
        properties: {
          className: mergeClassName(
            embedFrameClassName(classification.layout),
            "overflow-hidden rounded-sm",
          ),
          "data-article-embed-frame": "true",
          "data-article-embed-provider": classification.provider,
          "data-pdf-exclude": "true",
        },
        tagName: "div",
        type: "element",
      },
      {
        children: fallbackChildren,
        properties: {
          className: "hidden text-sm text-muted-foreground print:block",
          "data-article-embed-fallback": "true",
        },
        tagName: "figcaption",
        type: "element",
      },
    ],
    properties: {
      className: "my-8 grid gap-2",
      "data-article-embed": "true",
    },
    tagName: "figure",
    type: "element",
  };
}

function standaloneImageFromParagraph(
  paragraph: HastElement,
): undefined | { image: HastElement; link?: HastElement } {
  if (paragraph.tagName !== "p") {
    return undefined;
  }

  const meaningfulChildren = paragraph.children.filter(
    (child) => !isWhitespaceText(child),
  );

  if (meaningfulChildren.length !== 1) {
    return undefined;
  }

  const [onlyChild] = meaningfulChildren;

  if (onlyChild === undefined || !isElement(onlyChild)) {
    return undefined;
  }

  if (onlyChild.tagName === "img" && isMarkedStandaloneImage(onlyChild)) {
    return { image: onlyChild };
  }

  const linkedImage = linkedImageFromAnchor(onlyChild);

  if (
    linkedImage === undefined ||
    !isMarkedStandaloneImage(linkedImage.image)
  ) {
    return undefined;
  }

  return { image: linkedImage.image, link: onlyChild };
}

function articleFigure(
  image: HastElement,
  file: VFileLike,
  context: ArticleImageTransformContext,
  link?: HastElement,
): HastElement {
  const title = stringProperty(image, "title");
  const alt = stringProperty(image, "alt") ?? "article image";
  const src = stringProperty(image, "src");
  const remoteImageSource = remoteArticleImageSource(src);
  const isRemoteImage = remoteImageSource !== undefined;
  const presentation = articleImagePresentation();
  const isInspectable = link === undefined && presentation.isInspectable;
  const loadingAttributes = nextImageLoadingAttributes(context);

  if (isInspectable) {
    setArticleImageRenderData(file, { hasInspectableImages: true });
  }

  image.properties = {
    ...image.properties,
    className: mergeClassName(
      image.properties?.["className"],
      presentation.imageClass,
    ),
    "data-article-image": "true",
    ...loadingAttributes,
    sizes: presentation.previewSizes,
  };

  standaloneImagePropertyAliases.forEach((propertyName) => {
    delete image.properties?.[propertyName];
  });
  delete image.properties["title"];

  const children: HastNode[] = [
    isInspectable
      ? inspectableFrame(
          image,
          alt,
          presentation.frameClass,
          presentation.inspectionClass,
          { excludeFromPdf: isRemoteImage },
        )
      : frameNode(image, presentation.frameClass, link, {
          excludeFromPdf: isRemoteImage,
        }),
  ];

  if (title !== undefined && title.trim().length > 0) {
    children.push({
      children: [{ type: "text", value: title }],
      properties: { className: presentation.captionClass },
      tagName: "figcaption",
      type: "element",
    });
  }

  if (remoteImageSource !== undefined) {
    children.push(remoteImageFallback(remoteImageSource, alt));
  }

  return {
    children,
    properties: {
      className: presentation.figureClass,
      ...(isRemoteImage ? { "data-article-image-remote": "true" } : {}),
      "data-article-image-figure": "true",
      "data-article-image-inspectable": isInspectable ? "true" : "false",
      "data-article-image-policy": presentation.policy,
    },
    tagName: "figure",
    type: "element",
  };
}

function nextImageLoadingAttributes(
  context: ArticleImageTransformContext,
): Record<string, string> {
  const isFirstRenderedImage = context.renderedImageCount === 0;
  context.renderedImageCount += 1;

  if (isFirstRenderedImage) {
    return {
      fetchpriority: "high",
      loading: "eager",
    };
  }

  return { loading: "lazy" };
}

function frameNode(
  image: HastElement,
  frameClass: string,
  link: HastElement | undefined,
  options: { excludeFromPdf?: boolean } = {},
): HastElement {
  if (link === undefined) {
    return {
      children: [image],
      properties: {
        className: frameClass,
        ...(options.excludeFromPdf === true
          ? { "data-pdf-exclude": "true" }
          : {}),
      },
      tagName: "div",
      type: "element",
    };
  }

  link.properties = {
    ...link.properties,
    className: mergeClassName(
      link.properties?.["className"],
      "inline-flex max-w-full items-center justify-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    ),
  };

  return {
    children: [link],
    properties: {
      className: frameClass,
      ...(options.excludeFromPdf === true
        ? { "data-pdf-exclude": "true" }
        : {}),
    },
    tagName: "div",
    type: "element",
  };
}

function inspectableFrame(
  image: HastElement,
  alt: string,
  frameClass: string,
  inspectionClass: string,
  options: { excludeFromPdf?: boolean } = {},
): HastElement {
  return {
    children: [image, inspectAffordance(inspectionClass)],
    properties: {
      "aria-haspopup": "dialog",
      "aria-label": inspectLabel(alt),
      className: frameClass,
      "data-article-image-inspect-trigger": "true",
      ...(options.excludeFromPdf === true
        ? { "data-pdf-exclude": "true" }
        : {}),
      type: "button",
    },
    tagName: "button",
    type: "element",
  };
}

function remoteImageFallback(src: string, alt: string): HastElement {
  const fallbackLabel = alt.trim() !== "" ? alt.trim() : src;

  return {
    children: [
      { type: "text", value: "External image: " },
      {
        children: [{ type: "text", value: fallbackLabel }],
        properties: { href: src },
        tagName: "a",
        type: "element",
      },
    ],
    properties: {
      className: "hidden text-sm text-muted-foreground print:block",
      "data-article-image-fallback": "true",
    },
    tagName: "figcaption",
    type: "element",
  };
}

function remoteArticleImageSource(src: string | undefined): string | undefined {
  if (src === undefined) {
    return undefined;
  }

  const trimmed = src.trim();
  return /^https?:\/\//iu.test(trimmed) || trimmed.startsWith("//")
    ? src
    : undefined;
}

function inspectAffordance(className: string): HastElement {
  return {
    children: [expandIcon()],
    properties: {
      "aria-hidden": "true",
      className,
      "data-article-image-inspect-affordance": "true",
    },
    tagName: "span",
    type: "element",
  };
}

function expandIcon(): HastElement {
  return {
    children: [
      {
        properties: { points: "15 3 21 3 21 9" },
        tagName: "polyline",
        type: "element",
      },
      {
        properties: { points: "9 21 3 21 3 15" },
        tagName: "polyline",
        type: "element",
      },
      {
        properties: { x1: "21", x2: "14", y1: "3", y2: "10" },
        tagName: "line",
        type: "element",
      },
      {
        properties: { x1: "3", x2: "10", y1: "21", y2: "14" },
        tagName: "line",
        type: "element",
      },
    ],
    properties: {
      "aria-hidden": "true",
      className: "size-3",
      fill: "none",
      height: "24",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": "2",
      viewBox: "0 0 24 24",
      width: "24",
      xmlns: "http://www.w3.org/2000/svg",
    },
    tagName: "svg",
    type: "element",
  };
}

function linkedImageFromAnchor(
  anchor: HastElement,
): undefined | { image: HastElement } {
  if (anchor.tagName !== "a" || anchor.children.length !== 1) {
    return undefined;
  }

  const [onlyChild] = anchor.children;

  if (
    onlyChild === undefined ||
    !isElement(onlyChild) ||
    onlyChild.tagName !== "img"
  ) {
    return undefined;
  }

  return { image: onlyChild };
}

function isMarkedStandaloneImage(image: HastElement): boolean {
  return standaloneImagePropertyAliases.some(
    (propertyName) => image.properties?.[propertyName] === "true",
  );
}

function isInsideFigure(ancestors: readonly HastElement[]): boolean {
  return ancestors.some((ancestor) => ancestor.tagName === "figure");
}

function isElement(node: HastNode): node is HastElement {
  return node.type === "element" && "tagName" in node && "children" in node;
}

function isRaw(node: HastNode): node is HastRaw {
  return node.type === "raw" && "value" in node;
}

function isWhitespaceText(node: HastNode): node is HastText {
  return node.type === "text" && "value" in node && node.value.trim() === "";
}

function stringProperty(
  element: HastElement,
  propertyName: string,
): string | undefined {
  const value = element.properties?.[propertyName];
  return typeof value === "string" ? value : undefined;
}

function mergeClassName(existing: unknown, extraClassName: string): string {
  const existingClassName = existingClassNameValue(existing);

  return [existingClassName, extraClassName].filter(Boolean).join(" ");
}

function existingClassNameValue(existing: unknown): string {
  if (Array.isArray(existing)) {
    return existing.join(" ");
  }

  if (typeof existing === "string") {
    return existing;
  }

  return "";
}

function inspectLabel(alt: string): string {
  return alt.trim().length > 0 ? `View full image: ${alt}` : "View full image";
}

function setArticleImageRenderData(
  file: VFileLike,
  data: ArticleImageRenderData,
): void {
  const fileData = file.data ?? {};
  const astro = fileData.astro ?? {};
  const frontmatter = astro.frontmatter ?? {};

  file.data = {
    ...fileData,
    astro: {
      ...astro,
      frontmatter: {
        ...frontmatter,
        [frontmatterKey]: data,
      },
    },
  };
}

function hasArticleImagesFrontmatter(
  value: unknown,
): value is ArticleImagesFrontmatter {
  return isRecord(value) && frontmatterKey in value;
}

function isArticleImageRenderData(
  value: unknown,
): value is ArticleImageRenderData {
  return isRecord(value) && typeof value["hasInspectableImages"] === "boolean";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function markStandaloneImages(parent: { children: Nodes[] }): void {
  parent.children.forEach((child) => {
    if (isMdastParagraph(child)) {
      const image = standaloneMdastImage(child);

      if (image !== undefined) {
        markMdastImage(image);
      }
    }

    if (isMdastParent(child)) {
      markStandaloneImages(child);
    }
  });
}

function transformRawIframeHtml(parent: { children: Nodes[] }): void {
  parent.children = parent.children.map((child) => {
    if (isMdastHtml(child)) {
      return articleEmbedHtml(child) ?? child;
    }

    if (isMdastParent(child)) {
      transformRawIframeHtml(child);
    }

    return child;
  });
}

function articleEmbedHtml(html: Html): Html | undefined {
  const raw = html.value.trim();
  if (!/^<iframe\b/i.test(raw)) {
    return undefined;
  }

  const attributes = rawHtmlAttributes(raw);
  const src = typeof attributes["src"] === "string" ? attributes["src"] : "";
  const classification = classifyEmbedMedia(src);
  const title =
    typeof attributes["title"] === "string" && attributes["title"].trim() !== ""
      ? attributes["title"].trim()
      : "Embedded media";
  const fallback =
    src.trim() === ""
      ? "Embedded media is unavailable in PDF."
      : `Embedded media: <a href="${escapeHtmlAttribute(src)}">${escapeHtmlText(title)}</a>`;

  return {
    type: "html",
    value: `<figure class="my-8 grid gap-2" data-article-embed="true"><div class="${embedFrameClassName(classification.layout)} overflow-hidden rounded-sm" data-article-embed-frame="true" data-article-embed-provider="${classification.provider}" data-pdf-exclude="true">${raw}</div><figcaption class="hidden text-sm text-muted-foreground print:block" data-article-embed-fallback="true">${fallback}</figcaption></figure>`,
  };
}

function escapeHtmlAttribute(value: string): string {
  return escapeHtmlText(value).replaceAll('"', "&quot;");
}

function escapeHtmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function standaloneMdastImage(parent: {
  children: Nodes[];
}): Image | undefined {
  const meaningfulChildren = parent.children.filter(
    (child) => !isMdastWhitespaceText(child),
  );

  if (meaningfulChildren.length !== 1) {
    return undefined;
  }

  const [onlyChild] = meaningfulChildren;

  if (onlyChild === undefined) {
    return undefined;
  }

  if (isMdastImage(onlyChild)) {
    return onlyChild;
  }

  if (!isMdastLink(onlyChild)) {
    return undefined;
  }

  const linkChildren = onlyChild.children.filter(
    (child) => !isMdastWhitespaceText(child),
  );
  const [onlyLinkChild] = linkChildren;

  if (
    linkChildren.length !== 1 ||
    onlyLinkChild === undefined ||
    !isMdastImage(onlyLinkChild)
  ) {
    return undefined;
  }

  return onlyLinkChild;
}

function markMdastImage(image: Image): void {
  const hProperties =
    typeof image.data?.hProperties === "object" &&
    !Array.isArray(image.data.hProperties)
      ? image.data.hProperties
      : {};

  image.data = {
    ...image.data,
    hProperties: {
      ...hProperties,
      [standaloneImageProperty]: "true",
    },
  };
}

function isMdastParent(node: Nodes): node is MdastParentNode {
  return "children" in node && Array.isArray(node.children);
}

function isMdastParagraph(node: Nodes): node is MdastParentNode {
  return node.type === "paragraph" && isMdastParent(node);
}

function isMdastHtml(node: Nodes): node is Html {
  return node.type === "html" && "value" in node;
}

function isMdastImage(node: Nodes): node is Image {
  return node.type === "image";
}

function isMdastLink(node: Nodes): node is Link {
  return node.type === "link" && isMdastParent(node);
}

function isMdastWhitespaceText(node: Nodes): node is Text {
  return node.type === "text" && "value" in node && node.value.trim() === "";
}

/* eslint-enable security/detect-object-injection */
