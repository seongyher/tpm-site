/** Supported tag names for lightweight generated HTML inspection. */
export type HtmlTagName = "img" | "link";

/**
 * Extracts values from `name="<value>"` meta tags.
 *
 * @param html Rendered HTML text.
 * @param metaName Target meta name.
 * @returns Decoded content values.
 */
export function metaContentValues(html: string, metaName: string): string[] {
  return metaContentValuesByAttribute(html, "name", metaName);
}

/**
 * Extracts values from `property="<value>"` meta tags.
 *
 * @param html Rendered HTML text.
 * @param metaProperty Target meta property.
 * @returns Decoded content values.
 */
export function metaPropertyContentValues(
  html: string,
  metaProperty: string,
): string[] {
  return metaContentValuesByAttribute(html, "property", metaProperty);
}

/**
 * Extracts values from matching meta tag content attributes.
 *
 * @param html Rendered HTML text.
 * @param attributeName Meta selector attribute name.
 * @param attributeValue Meta selector attribute value.
 * @returns Decoded content values.
 */
export function metaContentValuesByAttribute(
  html: string,
  attributeName: "name" | "property",
  attributeValue: string,
): string[] {
  const values: string[] = [];
  const metaPattern = /<meta\b[^>]*>/giu;
  let match: null | RegExpExecArray;

  while ((match = metaPattern.exec(html)) !== null) {
    const tag = match[0];
    if (htmlAttributeValue(tag, attributeName) === attributeValue) {
      const content = htmlAttributeValue(tag, "content");
      if (content !== undefined) {
        values.push(decodeHtmlAttributeValue(content));
      }
    }
  }

  return values;
}

/**
 * Extracts BlogPosting JSON-LD image values from generated HTML.
 *
 * @param html Rendered HTML text.
 * @returns Image values from BlogPosting JSON-LD nodes.
 */
export function articleJsonLdImageValues(html: string): string[] {
  const values: string[] = [];

  for (const node of articleJsonLdNodes(html)) {
    const image = node["image"];
    if (typeof image === "string") {
      values.push(image);
    }
  }

  return values;
}

/**
 * Extracts BlogPosting JSON-LD nodes from generated HTML.
 *
 * @param html Rendered HTML text.
 * @returns Parsed BlogPosting JSON-LD objects.
 */
export function articleJsonLdNodes(
  html: string,
): Array<Record<string, unknown>> {
  return jsonLdNodesByType(html, "BlogPosting");
}

/**
 * Extracts JSON-LD nodes whose `@type` includes the requested type.
 *
 * @param html Rendered HTML text.
 * @param type Schema.org type to select.
 * @returns Matching parsed JSON-LD objects.
 */
export function jsonLdNodesByType(
  html: string,
  type: string,
): Array<Record<string, unknown>> {
  const nodes: Array<Record<string, unknown>> = [];

  for (const script of htmlScriptTextsByType(html, "application/ld+json")) {
    const text = script.trim();
    if (text === "") {
      continue;
    }

    try {
      const parsed = JSON.parse(text) as unknown;
      for (const node of jsonLdNodeCandidates(parsed)) {
        if (jsonLdTypeIncludes(node["@type"], type)) {
          nodes.push(node);
        }
      }
    } catch {
      // Invalid JSON-LD is reported by the metadata verifier.
    }
  }

  return nodes;
}

/**
 * Extracts script text values by MIME type.
 *
 * @param html Rendered HTML text.
 * @param type Script type attribute to match.
 * @returns Matching script body text values.
 */
export function htmlScriptTextsByType(html: string, type: string): string[] {
  const texts: string[] = [];
  const scriptPattern = /<script(?<attributes>[^>]*)>([\s\S]*?)<\/script>/giu;
  let match: null | RegExpExecArray;

  while ((match = scriptPattern.exec(html)) !== null) {
    const attributes = match.groups?.["attributes"];
    if (
      attributes !== undefined &&
      htmlAttributeValue(`<script${attributes}>`, "type") === type
    ) {
      texts.push(match[2] ?? "");
    }
  }

  return texts;
}

/**
 * Extracts generated HTML tags by name.
 *
 * @param html Rendered HTML text.
 * @param tagName Tag name to extract.
 * @returns Matched tag strings.
 */
export function htmlTags(html: string, tagName: HtmlTagName): string[] {
  const tagPattern = tagName === "img" ? /<img\b[^>]*>/giu : /<link\b[^>]*>/giu;

  return Array.from(html.matchAll(tagPattern), (match) => match[0]);
}

/**
 * Extracts the decoded document title text.
 *
 * @param html Rendered HTML text.
 * @returns Decoded title text, or an empty string.
 */
export function htmlTitleText(html: string): string {
  const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title>/iu.exec(html);

  return decodeHtmlAttributeValue(titleMatch?.[1]?.trim() ?? "");
}

/**
 * Extracts script `src` values from generated HTML.
 *
 * @param html Rendered HTML text.
 * @returns Script source paths.
 */
export function scriptSources(html: string): string[] {
  const sources: string[] = [];
  const scriptSourcePattern = /<script\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/giu;
  let match: null | RegExpExecArray;

  while ((match = scriptSourcePattern.exec(html)) !== null) {
    const source = match[1];
    if (source !== undefined) {
      sources.push(source);
    }
  }

  return sources;
}

/**
 * Extracts one attribute value from a rendered HTML tag.
 *
 * @param tag Rendered HTML tag text.
 * @param attributeName Attribute name to find.
 * @returns Raw attribute value, when present.
 */
export function htmlAttributeValue(
  tag: string,
  attributeName: string,
): string | undefined {
  const attributePattern = /\s([a-z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/giu;
  let match: null | RegExpExecArray;

  while ((match = attributePattern.exec(tag)) !== null) {
    if (match[1]?.toLowerCase() !== attributeName) {
      continue;
    }

    return match[2] ?? match[3];
  }

  return undefined;
}

/**
 * Decodes common HTML attribute entities used in generated metadata.
 *
 * @param value Encoded attribute value.
 * @returns Decoded attribute value.
 */
export function decodeHtmlAttributeValue(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function jsonLdNodeCandidates(value: unknown): Array<Record<string, unknown>> {
  if (!isRecord(value)) {
    return [];
  }

  const candidates = [value];
  const graph = value["@graph"];
  if (Array.isArray(graph)) {
    candidates.push(...graph.filter(isRecord));
  }

  return candidates;
}

function jsonLdTypeIncludes(value: unknown, type: string): boolean {
  return (
    value === type ||
    (Array.isArray(value) &&
      value.some((entry) => typeof entry === "string" && entry === type))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
