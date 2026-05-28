import { describe, expect, test } from "bun:test";

import {
  assessStaticOutputSecurityHeaders,
  assessSupplyChainPolicy,
  assessThirdPartyOrigins,
  defaultStaticOutputSecurityPolicy,
  defaultSupplyChainPolicy,
  defaultThirdPartyOriginPolicy,
} from "../../../src/platform/security";

describe("platform security entrypoint", () => {
  test("exposes static-output security policy and header assessment helpers", () => {
    const assessment = assessStaticOutputSecurityHeaders({
      headersText: `
/*
  Content-Security-Policy: base-uri 'self'; connect-src 'self'; default-src 'self'; frame-ancestors 'none'; frame-src 'self' https://w.soundcloud.com https://www.youtube.com https://www.youtube-nocookie.com; img-src 'self' data: https:; media-src 'self' https:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'
  Permissions-Policy: camera=(), geolocation=(), microphone=()
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
`,
    });

    expect(defaultStaticOutputSecurityPolicy.trustBoundaries).toHaveLength(11);
    expect(assessment.state).toBe("accepted");
  });

  test("exposes third-party origin diagnostics through the platform seam", () => {
    const report = assessThirdPartyOrigins({
      policy: defaultThirdPartyOriginPolicy,
      references: [
        {
          surface: "embed",
          url: "https://w.soundcloud.com/player/?url=track",
        },
      ],
    });

    expect(
      report.findings.some(
        (finding) =>
          finding.origin === "https://w.soundcloud.com" &&
          finding.policyState === "allowed",
      ),
    ).toBe(true);
  });

  test("exposes supply-chain policy through the platform seam", () => {
    const assessment = assessSupplyChainPolicy({
      availableCommands: new Set(["audit", "release-check", "secrets"]),
      gitignoreText: ".env.local\n.env.*.local\n",
      lockfilePresent: true,
    });

    expect(
      defaultSupplyChainPolicy.checks.some(
        (check) => check.id === "secret-scan",
      ),
    ).toBe(true);
    expect(assessment.diagnostics).toEqual([]);
  });
});
