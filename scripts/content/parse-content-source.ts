import { parseFrontmatter } from "@astrojs/markdown-remark";

/** Parsed source used by content maintenance and build-verification tools. */
export interface ContentSource {
  content: string;
  data: Record<string, unknown>;
}

/**
 * Uses the site's own parser while keeping the body at its original first line.
 * Astro retains the newline following the closing delimiter; tooling's body
 * offsets historically start immediately after that newline.
 */
export function parseContentSource(source: string): ContentSource {
  const normalized = source.replace(/^\uFEFF/u, "");
  const { content, frontmatter, rawFrontmatter } = parseFrontmatter(normalized);

  return {
    content: rawFrontmatter === "" ? content : content.replace(/^\r?\n/u, ""),
    data: Array.isArray(frontmatter) ? {} : frontmatter,
  };
}
