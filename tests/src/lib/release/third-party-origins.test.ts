import { describe, expect, test } from "bun:test";

import {
  assessThirdPartyOrigins,
  defaultThirdPartyOriginPolicy,
  type ThirdPartyOriginPolicy,
} from "../../../../src/lib/release/third-party-origins";

const csp =
  "default-src 'self'; frame-src 'self' https://w.soundcloud.com; img-src 'self' https:; script-src 'self'";

const policy = {
  ...defaultThirdPartyOriginPolicy,
  allowedOrigins: [
    ...defaultThirdPartyOriginPolicy.allowedOrigins,
    {
      origin: "https://archive.example",
      privacyNote: "Known citation archive.",
      surfaces: ["citation"],
    },
  ],
  disallowedOrigins: [
    {
      origin: "https://tracker.example",
      privacyNote: "Tracking provider is not approved.",
    },
  ],
  firstPartyOrigins: ["https://example.com"],
} satisfies ThirdPartyOriginPolicy;

describe("third-party origin diagnostics", () => {
  test("classifies known, unknown, disallowed, and first-party origins", () => {
    const report = assessThirdPartyOrigins({
      contentSecurityPolicy: csp,
      policy,
      references: [
        {
          sourceLine: 12,
          sourcePath: "site/content/articles/example.md",
          surface: "embed",
          url: "https://w.soundcloud.com/player/?url=track",
        },
        {
          sourceLine: 22,
          sourcePath: "site/content/articles/example.md",
          surface: "citation",
          url: "https://unknown.example/source",
        },
        {
          sourceLine: 32,
          sourcePath: "site/content/articles/example.md",
          surface: "analytics",
          url: "https://tracker.example/pixel",
        },
        {
          sourcePath: "site/content/articles/example.md",
          surface: "asset",
          url: "https://example.com/image.webp",
        },
      ],
    });

    expect(
      report.findings.map(({ cspState, origin, policyState, reference }) => ({
        cspState,
        origin,
        policyState,
        surface: reference.surface,
      })),
    ).toEqual([
      {
        cspState: "allowed",
        origin: "https://w.soundcloud.com",
        policyState: "allowed",
        surface: "embed",
      },
      {
        cspState: "not-applicable",
        origin: "https://unknown.example",
        policyState: "unknown",
        surface: "citation",
      },
      {
        cspState: "blocked",
        origin: "https://tracker.example",
        policyState: "disallowed",
        surface: "analytics",
      },
      {
        cspState: "allowed",
        origin: "https://example.com",
        policyState: "first-party",
        surface: "asset",
      },
    ]);
    expect(report.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "security.third-party-origin-passive",
      "security.third-party-origin-unknown",
      "security.third-party-origin-disallowed",
      "security.third-party-origin-passive",
      "security.third-party-origin-csp-mismatch",
    ]);
    expect(report.diagnostics[1]?.location).toMatchObject({
      line: 22,
      sourcePath: "site/content/articles/example.md",
    });
  });

  test("flags raw HTML, external scripts, and missing downloaded-asset provenance", () => {
    const report = assessThirdPartyOrigins({
      contentSecurityPolicy: csp,
      policy,
      references: [
        {
          sourceLine: 5,
          sourcePath: "site/content/articles/raw.mdx",
          surface: "raw-html",
          url: "https://widgets.example/embed",
        },
        {
          sourceLine: 6,
          sourcePath: "site/content/articles/raw.mdx",
          surface: "script",
          url: "https://cdn.example/widget.js",
        },
        {
          sourceLine: 7,
          sourcePath: "site/assets/migrated/source.json",
          surface: "downloaded-asset",
          url: "https://images.example/original.jpg",
        },
      ],
    });

    expect(report.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "security.third-party-origin-unknown",
      "security.third-party-origin-passive",
      "security.raw-html-origin",
      "security.third-party-origin-unknown",
      "security.third-party-origin-passive",
      "security.third-party-origin-csp-mismatch",
      "security.third-party-script",
      "security.third-party-origin-unknown",
      "security.asset-provenance-missing",
    ]);
    expect(
      report.findings.map(
        ({ interaction, privacySensitive, provenance, requirement }) => ({
          interaction,
          privacySensitive,
          provenance,
          requirement,
        }),
      ),
    ).toEqual([
      {
        interaction: "passive",
        privacySensitive: true,
        provenance: "unknown",
        requirement: "unknown",
      },
      {
        interaction: "passive",
        privacySensitive: true,
        provenance: "unknown",
        requirement: "unknown",
      },
      {
        interaction: "build-time",
        privacySensitive: false,
        provenance: "unknown",
        requirement: "unknown",
      },
    ]);
  });

  test("accepts declared citation origins without passive-origin warnings", () => {
    const report = assessThirdPartyOrigins({
      policy,
      references: [
        {
          interaction: "user-triggered",
          requirement: "optional",
          sourcePath: "site/content/articles/citation.md",
          surface: "citation",
          url: "https://archive.example/item",
        },
      ],
    });

    expect(
      report.findings.some(
        (finding) =>
          finding.cspState === "not-applicable" &&
          finding.interaction === "user-triggered" &&
          finding.policyState === "allowed" &&
          finding.requirement === "optional",
      ),
    ).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });
});
