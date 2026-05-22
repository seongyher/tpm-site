import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { PDFDocument } from "pdf-lib";

import {
  articlePdfHref,
  articlePdfOutputPath,
  scholarPublicationDate,
} from "../../../src/lib/articles/article-pdf";
import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "../../../src/lib/diagnostics/output-verification";
import {
  articlePdfFileSizeMediaDiagnostics,
  type MediaDiagnostic,
} from "../../../src/lib/media/media-policy";
import { decodeHtmlAttributeValue, metaContentValues } from "./html-inspection";
import { linkTargets } from "./link-verifier";

const pdfHeader = "%PDF-";
const maxArticlePdfBytes = 5 * 1024 * 1024;

/** Article facts needed to verify generated article PDF surfaces. */
export interface ArticlePdfVerificationFacts {
  authors: readonly string[];
  pdfEnabled: boolean;
  publicationDate?: Date | undefined;
  slug: string;
  title: string;
}

/** Inputs used to verify article PDF metadata rendered into HTML. */
export interface ArticlePdfHtmlVerificationInput {
  article: ArticlePdfVerificationFacts;
  html: string;
  relativeHtmlPath: string;
}

/** Inputs used to verify generated article PDF files. */
export interface ArticlePdfFileVerificationInput {
  articles: readonly ArticlePdfVerificationFacts[];
  distDir: string;
}

/**
 * Verifies one article page's PDF link and Scholar metadata.
 *
 * @param input Rendered HTML, output path, and source article facts.
 * @param input.article Source article facts.
 * @param input.html Rendered HTML text.
 * @param input.relativeHtmlPath Relative article output path.
 * @returns PDF diagnostics for HTML link or metadata regressions.
 */
export function verifyArticlePdfHtml({
  article,
  html,
  relativeHtmlPath,
}: ArticlePdfHtmlVerificationInput): OutputDiagnostic[] {
  const diagnostics: OutputDiagnostic[] = [];
  const pdfHref = articlePdfHref(article.slug);
  const pdfMetaValues = metaContentValues(html, "citation_pdf_url");
  const titleMetaValues = metaContentValues(html, "citation_title");
  const authorMetaValues = metaContentValues(html, "citation_author").map(
    decodeHtmlAttributeValue,
  );
  const publicationDateValues = metaContentValues(
    html,
    "citation_publication_date",
  );

  if (!article.pdfEnabled) {
    if (linkTargets(html).includes(pdfHref)) {
      diagnostics.push(
        articlePdfInvalidDiagnostic(
          relativeHtmlPath,
          `PDF disabled but Save PDF link is present for ${pdfHref}`,
        ),
      );
    }

    if (pdfMetaValues.length > 0) {
      diagnostics.push(
        articlePdfInvalidDiagnostic(
          relativeHtmlPath,
          "PDF disabled but citation_pdf_url metadata is present",
        ),
      );
    }
  } else if (!linkTargets(html).includes(pdfHref)) {
    diagnostics.push(
      articlePdfInvalidDiagnostic(
        relativeHtmlPath,
        `missing Save PDF link to ${pdfHref}`,
      ),
    );
  }

  if (!article.pdfEnabled) {
    // Base Scholar metadata is still verified below for PDF-disabled articles.
  } else if (pdfMetaValues.length === 0) {
    diagnostics.push(
      articlePdfInvalidDiagnostic(
        relativeHtmlPath,
        "missing citation_pdf_url metadata",
      ),
    );
  } else if (
    !pdfMetaValues.some((value) => scholarPdfMetaMatches(value, pdfHref))
  ) {
    diagnostics.push(
      articlePdfInvalidDiagnostic(
        relativeHtmlPath,
        `citation_pdf_url does not point to ${pdfHref}`,
      ),
    );
  }

  if (titleMetaValues.length === 0 || titleMetaValues[0]?.trim() === "") {
    diagnostics.push(
      articlePdfInvalidDiagnostic(
        relativeHtmlPath,
        "missing citation_title metadata",
      ),
    );
  }

  for (const author of article.authors) {
    if (!authorMetaValues.includes(author)) {
      diagnostics.push(
        articlePdfInvalidDiagnostic(
          relativeHtmlPath,
          `missing citation_author metadata for ${author}`,
        ),
      );
    }
  }

  if (
    article.publicationDate !== undefined &&
    !publicationDateValues.includes(
      scholarPublicationDate(article.publicationDate),
    )
  ) {
    diagnostics.push(
      articlePdfInvalidDiagnostic(
        relativeHtmlPath,
        "missing citation_publication_date metadata",
      ),
    );
  }

  return diagnostics;
}

/**
 * Verifies generated article PDF files and PDF document metadata.
 *
 * @param input Build output root and source article facts.
 * @param input.articles Source article facts.
 * @param input.distDir Generated build output root.
 * @returns PDF diagnostics for generated files.
 */
export async function verifyArticlePdfs({
  articles,
  distDir,
}: ArticlePdfFileVerificationInput): Promise<OutputDiagnostic[]> {
  const diagnostics: OutputDiagnostic[] = [];

  for (const article of articles) {
    const relativePdfPath = articlePdfOutputPath(article.slug);
    const pdfExists = await outputPathExists(distDir, relativePdfPath);

    if (!article.pdfEnabled) {
      if (pdfExists) {
        diagnostics.push(
          articlePdfInvalidDiagnostic(
            relativePdfPath,
            "PDF disabled but generated PDF exists",
          ),
        );
      }
      continue;
    }

    if (!pdfExists) {
      continue;
    }

    const data = await readFile(path.join(distDir, relativePdfPath));
    const header = new TextDecoder().decode(data.subarray(0, pdfHeader.length));

    if (header !== pdfHeader) {
      diagnostics.push(
        articlePdfInvalidDiagnostic(
          relativePdfPath,
          "generated file is not a PDF",
        ),
      );
      continue;
    }

    if (data.byteLength > maxArticlePdfBytes) {
      diagnostics.push(
        ...articlePdfFileSizeMediaDiagnostics({
          byteLength: data.byteLength,
          maxBytes: maxArticlePdfBytes,
          relativeOutputPath: relativePdfPath,
        }).map((diagnostic) =>
          articlePdfMediaInvalidDiagnostic(relativePdfPath, diagnostic),
        ),
      );
    }

    diagnostics.push(
      ...(await verifyArticlePdfDocumentMetadata(
        relativePdfPath,
        data,
        article,
      )),
    );
  }

  return diagnostics;
}

/**
 * Builds the canonical article PDF diagnostic.
 *
 * @param outputPath Relative article HTML or PDF output path.
 * @param reason Human-readable PDF issue.
 * @returns PDF diagnostic.
 */
export function articlePdfInvalidDiagnostic(
  outputPath: string,
  reason: string,
): OutputDiagnostic {
  const message = `${outputPath}: ${reason}`;

  return createOutputDiagnostic({
    category: "pdf",
    code: "pdf.article-output-invalid",
    evidence: [`articlePdfIssues: ${message}`],
    location: { outputPath },
    message,
    moduleId: "build.article-pdf",
    owner: "generated-output",
    remediation:
      "Inspect the article PDF link, Scholar metadata, generated PDF file, and PDF document metadata.",
    severity: "error",
  });
}

/**
 * Builds a generated-output diagnostic from a media-policy PDF diagnostic.
 *
 * @param outputPath Relative article PDF output path.
 * @param diagnostic Media-policy diagnostic.
 * @returns Generated-output PDF diagnostic.
 */
export function articlePdfMediaInvalidDiagnostic(
  outputPath: string,
  diagnostic: MediaDiagnostic,
): OutputDiagnostic {
  return createOutputDiagnostic({
    category: "pdf",
    code: "pdf.article-media-invalid",
    evidence: [
      `articlePdfIssues: ${diagnostic.message}`,
      `mediaDiagnostic: ${diagnostic.code}`,
    ],
    location: { outputPath },
    message: diagnostic.message,
    moduleId: "build.article-pdf",
    owner: "generated-output",
    remediation:
      diagnostic.remediation ??
      "Inspect article media policy, generated PDF assets, and PDF document output.",
    severity: diagnostic.severity,
  });
}

async function verifyArticlePdfDocumentMetadata(
  relativePdfPath: string,
  data: Uint8Array,
  article: ArticlePdfVerificationFacts,
): Promise<OutputDiagnostic[]> {
  try {
    const diagnostics: OutputDiagnostic[] = [];
    const pdf = await PDFDocument.load(data);
    const expectedAuthor = article.authors.join(", ");

    if (pdf.getTitle() !== article.title) {
      diagnostics.push(
        articlePdfInvalidDiagnostic(
          relativePdfPath,
          "missing PDF title metadata",
        ),
      );
    }

    if (expectedAuthor !== "" && pdf.getAuthor() !== expectedAuthor) {
      diagnostics.push(
        articlePdfInvalidDiagnostic(
          relativePdfPath,
          "missing PDF author metadata",
        ),
      );
    }

    return diagnostics;
  } catch (error) {
    return [
      articlePdfInvalidDiagnostic(
        relativePdfPath,
        error instanceof Error ? error.message : String(error),
      ),
    ];
  }
}

function scholarPdfMetaMatches(value: string, pdfHref: string): boolean {
  let withoutProtocol: string | undefined;
  if (value.startsWith("https://")) {
    withoutProtocol = value.slice("https://".length);
  } else if (value.startsWith("http://")) {
    withoutProtocol = value.slice("http://".length);
  }

  if (withoutProtocol === undefined) {
    return false;
  }

  const pathStart = withoutProtocol.indexOf("/");
  if (pathStart === -1) {
    return false;
  }

  const pathAndQuery = withoutProtocol.slice(pathStart);
  const pathname = pathAndQuery.split("?")[0]?.split("#")[0] ?? "";

  return pathname === pdfHref;
}

async function outputPathExists(
  distDir: string,
  relativePath: string,
): Promise<boolean> {
  try {
    await stat(path.join(distDir, relativePath));
    return true;
  } catch {
    return false;
  }
}
