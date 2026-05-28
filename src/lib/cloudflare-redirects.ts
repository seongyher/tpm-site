/** Static Cloudflare redirect rule. */
export interface CloudflareRedirectRule {
  readonly destination: string;
  readonly source: string;
}

const GENERATED_HEADER =
  "# Generated from site redirects and article legacyPermalink metadata. Do not edit by hand.";

/**
 * Formats redirect rules for Cloudflare Workers Static Assets.
 *
 * @param rules Redirect rules to emit in Cloudflare `_redirects` syntax.
 * @returns The generated redirect file contents.
 */
export function formatCloudflareRedirects(
  rules: readonly CloudflareRedirectRule[],
): string {
  return `${[
    GENERATED_HEADER,
    ...rules.map((rule) => `${rule.source} ${rule.destination} 301`),
  ].join("\n")}\n`;
}
