import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

import {
  assessStaticOutputSecurityHeaders,
  defaultStaticOutputSecurityPolicy,
} from "../../../../src/lib/release/static-output-security";

const acceptedHeaders = `
/*
  Content-Security-Policy: base-uri 'self'; connect-src 'self'; default-src 'self'; frame-ancestors 'none'; frame-src 'self' https://w.soundcloud.com https://www.youtube.com https://www.youtube-nocookie.com; img-src 'self' data: https:; media-src 'self' https:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'
  Permissions-Policy: camera=(), geolocation=(), microphone=()
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
`;

describe("static output security", () => {
  test("accepts the current global static security headers", async () => {
    const assessment = assessStaticOutputSecurityHeaders({
      headersText: await readFile("site/public/_headers", "utf8"),
    });

    expect(assessment.state).toBe("accepted");
    expect(assessment.diagnostics).toEqual([]);
  });

  test("warns when a site-owner override intentionally relaxes CSP", () => {
    const assessment = assessStaticOutputSecurityHeaders({
      headersText: acceptedHeaders.replace(
        "script-src 'self'",
        "script-src 'self' 'unsafe-inline'",
      ),
    });

    expect(assessment.state).toBe("warned");
    expect(
      assessment.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "security.csp-relaxed" &&
          diagnostic.severity === "warning",
      ),
    ).toBe(true);
  });

  test("rejects missing and incompatible security headers", () => {
    const assessment = assessStaticOutputSecurityHeaders({
      headersText: `
/*
  Content-Security-Policy: base-uri 'self'; default-src 'self'; object-src 'none'; script-src 'self'
  Referrer-Policy: origin
`,
    });

    expect(assessment.state).toBe("rejected");
    expect(assessment.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      [
        "security.header-missing",
        "security.header-incompatible",
        "security.header-missing",
        "security.csp-directive-missing",
        "security.csp-directive-missing",
        "security.csp-directive-missing",
        "security.csp-directive-missing",
        "security.csp-directive-missing",
        "security.csp-directive-missing",
      ],
    );
  });

  test("documents default trust-boundary dispositions", () => {
    expect(
      defaultStaticOutputSecurityPolicy.trustBoundaries.map(
        ({ disposition, kind }) => [kind, disposition],
      ),
    ).toEqual([
      ["analytics", "warn"],
      ["citation-url", "warn"],
      ["downloaded-asset", "warn"],
      ["embed", "warn"],
      ["external-cta", "warn"],
      ["json-ld", "allow"],
      ["markdown-html", "warn"],
      ["mdx-component", "warn"],
      ["raw-html", "reject"],
      ["share-link", "warn"],
      ["third-party-script", "reject"],
    ]);
  });
});
