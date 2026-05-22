import {
  articleMdxPdfCompatibilityPolicies,
  isMediaMdxComponentImport,
  mdxImportPdfCompatibilityPolicy,
} from "../media/media-policy";

/** Supported article MDX component imports and their PDF fallback contracts. */
export const articleMdxPdfCompatibility = articleMdxPdfCompatibilityPolicies;

/**
 * Reports whether an MDX import can affect PDF rendering.
 *
 * @param importSource Import source string as written in an article MDX file.
 * @returns True when the import points at a reusable component.
 */
export function isArticleMdxComponentImport(importSource: string): boolean {
  return isMediaMdxComponentImport(importSource);
}

/**
 * Checks whether an article MDX import has a declared PDF fallback.
 *
 * Asset imports are not component imports and are therefore compatible here.
 *
 * @param importSource Import source string as written in an article MDX file.
 * @returns True when the import is safe for generated article PDFs.
 */
export function isArticleMdxPdfCompatibleImport(importSource: string): boolean {
  return mdxImportPdfCompatibilityPolicy(importSource).isCompatible;
}
