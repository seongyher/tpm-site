# Static Output Security

Static output security defines the default browser-facing trust boundaries for
generated HTML, assets, redirects, feeds, search data, PDFs, and public static
files. The goal is to give site owners secure defaults without hiding the
places where a site intentionally talks to third-party services.

The implementation lives in `src/lib/static-output-security.ts` and is exposed
through `src/platform/security.ts` for future CLI, MCP, studio, CI, and release
report consumers.

## Default Header Target

The current Cloudflare `_headers` target applies these global headers to `/*`:

- `Content-Security-Policy`;
- `Permissions-Policy`;
- `Referrer-Policy`;
- `X-Content-Type-Options`.

The default CSP is intentionally compatible with the current static site:

```text
base-uri 'self';
connect-src 'self';
default-src 'self';
frame-ancestors 'none';
frame-src 'self' https://w.soundcloud.com https://www.youtube.com https://www.youtube-nocookie.com;
img-src 'self' data: https:;
media-src 'self' https:;
object-src 'none';
script-src 'self';
style-src 'self' 'unsafe-inline'
```

`script-src` does not allow inline JavaScript or third-party scripts by default.
`style-src` allows inline styles because generated article and interaction
components currently use safe inline style attributes for positioning and
layout variables. Removing that allowance is a future hardening task only after
those style attributes have an equivalent nonce/hash/token strategy.

## Trust Boundaries

The policy names every currently known generated-output trust boundary:

| Boundary             | Default | Reason                                                                       |
| -------------------- | ------- | ---------------------------------------------------------------------------- |
| `analytics`          | warn    | Analytics can contact third-party origins and should be site-owner approved. |
| `citation-url`       | warn    | Citation links are reader-triggered external navigation.                     |
| `downloaded-asset`   | warn    | Migrated remote assets need provenance.                                      |
| `embed`              | warn    | Embedded providers can contact external origins.                             |
| `external-cta`       | warn    | Support, social, newsletter, and payment links leave the site.               |
| `json-ld`            | allow   | Static structured data is safe when generated through escaped serializers.   |
| `markdown-html`      | warn    | Markdown HTML can bypass normal component constraints.                       |
| `mdx-component`      | warn    | MDX components can introduce embeds, scripts, or remote behavior.            |
| `raw-html`           | reject  | Unreviewed raw HTML can introduce unsafe scripts or broken semantics.        |
| `share-link`         | warn    | Share links can include titles, canonical URLs, and publication handles.     |
| `third-party-script` | reject  | Remote scripts execute in the reader's browser.                              |

`warn` does not mean forbidden. It means the platform should keep provenance and
make the boundary visible to release checks, docs, and future studio UI.
`reject` means the default platform path should block the behavior unless an
explicit, reviewed escape hatch is added.

## Assessment States

`assessStaticOutputSecurityHeaders()` returns one of three states:

- `accepted`: required headers and CSP directives match the policy;
- `warned`: required headers are present, but a site-owner policy is more
  relaxed than the default target;
- `rejected`: required headers or CSP directives are missing or incompatible.

Diagnostics use stable `security.*` codes and include author/operator-facing
remediation text. This keeps the same policy usable from release scripts,
provider adapters, a future CLI, MCP tools, and a studio security panel.

## Site-Owner Overrides

Site owners may need to relax policy for analytics, embeds, or custom
extensions. Those changes should be explicit and reviewed:

- keep the override in site-owned configuration or public header files;
- document the provider origin and reader privacy impact;
- prefer provider-specific origins over wildcards;
- avoid inline JavaScript and `unsafe-eval`;
- treat third-party scripts as an extension or deployment-policy decision, not
  incidental page markup.

When a policy is intentionally relaxed, the generated-output verifier should
report a warning rather than silently accepting the change. The warning can then
be acknowledged in release governance or shown in future site-owner tooling.

## Third-Party Origin Diagnostics

`assessThirdPartyOrigins()` classifies generated-output references that contact
or link to an absolute external origin. Each reference carries:

- surface: analytics, asset, citation, CTA, downloaded asset, embed, raw HTML,
  script, or share link;
- interaction: build-time, passive, user-triggered, or unknown;
- requirement: required, optional, or unknown;
- provenance: declared, downloaded, or unknown;
- source path and line when the caller can provide them;
- CSP coverage state when a content-security policy is supplied.

The report distinguishes first-party, allowed, unknown, and disallowed origins.
It also reports whether an origin is blocked by the CSP target and whether the
behavior is privacy-sensitive because the browser may contact the origin before
the reader explicitly leaves the site.

Current diagnostic codes:

- `security.third-party-origin-unknown`;
- `security.third-party-origin-disallowed`;
- `security.third-party-origin-passive`;
- `security.third-party-origin-csp-mismatch`;
- `security.raw-html-origin`;
- `security.third-party-script`;
- `security.asset-provenance-missing`.

These diagnostics are intentionally phrased for authors and site owners. A
citation URL warning should tell the author to declare or replace the source. A
passive embed warning should tell the site owner that the provider can be
contacted before click-through. A downloaded-asset provenance warning should
tell a migration operator to record the source URL or migration evidence.
