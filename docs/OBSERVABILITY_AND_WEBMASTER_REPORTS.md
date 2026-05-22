# Observability And Webmaster Reports

## Purpose

Observability imports turn external scanner, crawler, analytics, performance,
security, and webmaster exports into structured platform findings.

The goal is not to mirror every provider. The goal is to normalize external
signals into one source-aware model that can support:

- route-linked webmaster reports;
- source-side author diagnostics when a fix belongs in `site/`;
- release-health comparisons;
- future GUI issue panels;
- future CLI and MCP workflows;
- noise classification for bot traffic, stale crawler state, and provider
  quirks.

## Boundary

Observability imports are after-the-fact signals. They should not become the
source of truth for platform contracts.

Source contracts, schemas, route registry entries, generated-output verifiers,
and site doctor diagnostics own what the platform expects. Observability
imports report what external systems observed.

## Supported Import Families

The normalized model should support these source families:

- Lighthouse and Lighthouse CI JSON;
- Unlighthouse route reports;
- Cloudflare analytics and 4xx/5xx route summaries;
- Google Search Console crawl, indexing, and page experience exports;
- Bing Webmaster Tools scan exports;
- local link scanner output;
- accessibility scan exports;
- uptime check output;
- dependency/security report summaries;
- manual webmaster findings.

Provider parsers should be thin. They should translate provider-specific field
names into normalized findings, then leave route/source mapping and reporting
to shared platform helpers.

## Normalized Finding Model

Each normalized observability finding should contain:

- stable source family such as `lighthouse`, `cloudflare`, `search-console`,
  `bing`, `link-scanner`, `accessibility`, `uptime`, `security`, or `manual`;
- optional provider name and raw provider issue code;
- normalized `category`;
- normalized `severity`;
- normalized `status`;
- `summary`;
- optional `detail`;
- normalized route path when a URL can be mapped to the site;
- optional URL when the finding is external or route mapping is not possible;
- optional source artifact key or source path when known;
- optional output path when the finding points at generated output;
- owner domain: `author`, `site-owner`, `developer`, `platform`, `external`, or
  `unknown`;
- fixability: `source-edit`, `regenerate`, `code-change`, `external-action`, or
  `investigate`;
- confidence: `high`, `medium`, or `low`;
- noise classification: `actionable`, `expected`, `bot-noise`, `stale-crawler`,
  `provider-noise`, or `unclear`;
- optional trend facts such as current count, previous count, delta, first seen,
  last seen, sample size, or affected route count;
- optional evidence strings;
- optional related docs;
- optional remediation text.

These fields intentionally mirror the author-diagnostic vocabulary without
forcing every observability finding to become an author diagnostic.

## Categories

Initial categories:

- `accessibility`;
- `assets`;
- `cache`;
- `crawlability`;
- `deployment`;
- `links`;
- `metadata`;
- `performance`;
- `redirects`;
- `routes`;
- `search`;
- `security`;
- `uptime`;
- `unknown`.

Categories should be specific enough for reports and ownership routing, but not
provider-specific.

## Severity And Status

Severity:

- `error`: currently harmful or blocking;
- `warning`: likely actionable but not always blocking;
- `info`: useful context or trend signal.

Status:

- `open`: still active in the latest import;
- `improved`: current value is better than baseline but not necessarily fixed;
- `resolved`: no longer present or below threshold;
- `regressed`: worse than baseline;
- `unknown`: import lacks enough trend data.

## Noise Classification

Noise classification is mandatory because webmaster data often includes bot
traffic, stale external caches, and provider scanner quirks.

- `actionable`: fix likely belongs in source, config, platform, or deploy
  setup.
- `expected`: known and intentionally accepted behavior.
- `bot-noise`: requests likely came from scanners, attackers, or unrelated bot
  probes.
- `stale-crawler`: old URLs, image previews, social cards, or crawler caches
  that may age out.
- `provider-noise`: scanner limitation or provider-injected behavior.
- `unclear`: needs human triage.

The report should separate actionable items from accepted noise so authors and
site owners are not trained to ignore warnings.

## Privacy Boundary

Imports should avoid retaining sensitive data by default.

Allowed by default:

- route paths;
- issue codes;
- counts and aggregate metrics;
- timestamps;
- score buckets;
- public URLs;
- provider names;
- redacted user-agent classes;
- public referrer domains when needed for citation/link maintenance.

Excluded or redacted by default:

- IP addresses;
- full user-agent strings unless explicitly needed and redacted;
- cookies;
- request headers;
- query strings containing identifiers;
- email addresses;
- access tokens;
- private logs;
- precise visitor/session identifiers.

If a future parser needs sensitive data for a high-value workflow, that parser
must declare the field, redaction behavior, storage lifetime, and user-facing
reason before it is accepted.

## Route Mapping

Route mapping should use the route registry and normalized site URL.

Mapping rules:

- strip configured site origin;
- strip hashes;
- preserve query strings only when the provider issue is explicitly
  query-specific;
- normalize trailing slashes according to route policy;
- match configured route roots, entry route children, file routes, and known
  redirect sources;
- keep external URLs as external findings;
- mark unrecognized internal paths as `routes` or `redirects` findings when
  they look like missing historical URLs.

Route-linked findings should include enough data for the report to point to:

- canonical route;
- route family;
- source artifact owner when known;
- generated output path when known;
- possible remediation docs.

## Report Output

Static webmaster reports should be deterministic Markdown and JSON artifacts
under a generated reports directory.

Reports should include:

- import source metadata;
- summary counts by severity, category, owner, fixability, and noise
  classification;
- actionable findings first;
- route-linked table with canonical route, source/output facts, severity,
  confidence, owner, likely root cause, remediation, and docs;
- noise section explaining ignored or accepted findings;
- unresolved/unclear section for human triage;
- trend comparison when a baseline is provided.

Generated reports are tooling artifacts, not site content. They should not be
published by default unless a future configuration explicitly exposes them.

## Route-Linked Report Contract

Route-linked reports are built from normalized observability findings plus the
route registry and, when available, the source/artifact manifest.

The report contract deliberately keeps provider import, route matching, and
Markdown/JSON formatting separate:

1. Provider parsers produce `ObservabilityFinding` objects.
2. Route-linking attaches registry/source facts and classifies each finding as
   `actionable`, `needs-triage`, or `noise`.
3. Report formatters emit deterministic Markdown or JSON from the linked model.

Route matching must prefer the most specific registered route. The root route
matches only `/`; it must not accidentally claim every unknown path. File-like
paths such as `/rss.xml`, `/favicon.ico`, `/.env`, and
`/assets/example.jpg` keep their file path shape instead of gaining a trailing
slash.

Each linked finding records:

- the original normalized finding;
- report disposition;
- route-match kind: `registered-route`, `unknown-internal-route`, `external`,
  or `unmapped`;
- route registry fields when a registered route owns the path;
- safe source/artifact facts when a source/artifact manifest entry is known.

Generated report Markdown should use stable section order:

1. summary;
2. actionable findings;
3. needs triage;
4. noise and accepted findings.

Within each section, findings should sort deterministically by severity, route,
source, and summary so report diffs remain useful.

## Author Diagnostics Bridge

Observability findings may become author diagnostics only when:

- the issue has an actionable source-side fix;
- source or config ownership is known;
- the remediation can be phrased in author/site-owner language;
- emitting the diagnostic will not duplicate a stronger local verifier failure.

The bridge should be intentionally narrow. Current source-repairable findings
must meet all of these criteria:

1. report disposition is `actionable`;
2. fixability is `source-edit`;
3. owner is `author` or `site-owner`;
4. route match is `registered-route` or `unknown-internal-route`.

Everything else stays in the observability report until a human or a future
provider adapter can prove the source-side repair path.

Examples:

- broken internal link found by Bing and mapped to a Markdown source file:
  author diagnostic;
- stale crawler request for an old image path with no current source owner:
  report noise, not author diagnostic;
- Cloudflare 404 for `/favicon.ico` when `site/public/favicon.ico` is missing:
  site-owner diagnostic;
- Lighthouse cache warning for provider-injected analytics script:
  provider-noise report item, not author diagnostic.

## Release-Health And Incident Reports

Release-health reports compare a baseline observability report to a candidate
report. They are not a replacement for local verification; they show whether
external scanner and webmaster signals improved, regressed, or stayed the same
after a change.

The report should classify findings as:

- `added`: present in the candidate report but absent from baseline;
- `resolved`: present in baseline but absent from candidate;
- `changed`: same finding identity, but imported count changed;
- `persistent`: same finding identity and count.

Finding identity should be stable enough for diffing without depending on
provider row order. Use source, provider code, category, route or URL, and
summary. Counts come from imported trend facts such as Cloudflare request
counts or scanner occurrence counts.

Release-health Markdown should include:

1. summary counts;
2. route-class changes;
3. added findings;
4. resolved findings;
5. changed counts.

Incident and noise triage should follow this order:

1. Fix `actionable` author or site-owner items with clear source edits.
2. Escalate `actionable` developer/platform items to implementation work.
3. Leave `bot-noise`, `stale-crawler`, `provider-noise`, and `expected`
   findings in the noise section unless counts or affected routes change in a
   way that makes them operationally important.
4. Keep `unclear` findings in triage until source ownership, provider noise, or
   external responsibility is established.
5. Record the classification reason in the report or related issue before
   suppressing anything long term.

## Fixture Strategy

Fixture tests should cover:

- one Lighthouse/Unlighthouse performance issue;
- one Cloudflare 404 trend row;
- one Search Console indexing issue;
- one Bing scan issue;
- one link scanner broken link;
- one accessibility issue;
- one uptime incident;
- one dependency/security summary;
- one manual finding;
- redaction of query strings or sensitive fields;
- route mapping for canonical routes, redirect sources, unknown internal paths,
  and external URLs;
- golden Markdown/JSON report output.

## Completion Criteria

Observability Milestone 4 work is complete when:

- normalized finding types exist;
- provider import helpers exist for supported fixture shapes;
- privacy/redaction rules are tested;
- report generation creates deterministic JSON and Markdown;
- route-linked findings use route registry/source artifact vocabulary;
- author diagnostics are emitted only for source-repairable findings;
- docs explain action/noise/unclear triage.
