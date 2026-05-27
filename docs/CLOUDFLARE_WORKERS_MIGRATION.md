# Cloudflare Workers Static Hosting Migration

## Goal

Move production hosting from GitHub Pages to Cloudflare Workers Static Assets
without changing the Astro site into SSR, without adding Worker code to the
normal request path, and without making authors maintain Cloudflare-specific
files by hand.

The current site is a static Astro build, so the target deployment should be:

```text
just build
just verify
just validate-html
wrangler deploy
```

The deployed Worker should serve `dist/` as static assets. Matching static
asset requests should not invoke Worker code.

## Research Summary

Cloudflare Workers Static Assets is the right target for this repository.
Cloudflare's Astro Workers guide says static Astro sites do not need the Astro
Cloudflare adapter; Astro prerenders pages by default, and the build output can
be uploaded as static assets. The same guide notes that a static-only Worker
assets config does not need a `main` field because no Worker code is needed for
SSR.

Cloudflare's Static Assets docs say that, by default, matching static asset
requests are served without invoking Worker code. This matters for cost and
reliability: Workers billing says static asset requests are free and unlimited,
while Worker-script requests are billed according to Workers pricing. The docs
also warn that `run_worker_first` forces matching requests through Worker code
and can produce 429s for free-tier users who exceed Worker request limits.

Redirect support exists through a `_redirects` file in the static asset
directory. Workers parses that file and applies the rules to static asset
responses. Redirect rules run before matching static assets, so this is a good
fit for historical permalink redirects.

Canonical host redirects are not a `_redirects` responsibility. Cloudflare's
Workers Static Assets redirect docs list domain-level redirects as unsupported
in `_redirects`, and the Workers custom-domain docs recommend handling `www` to
apex, or apex to `www`, with a Cloudflare redirect rule plus a proxied DNS
record for the redirected hostname. Keep that operational canonicalization in
Cloudflare rather than generating rules such as
`https://www.example.com/* https://example.com/:splat 301` into
`dist/_redirects`.

Relevant docs:

- Cloudflare Workers Static Assets:
  <https://developers.cloudflare.com/workers/static-assets/>
- Static Assets billing and limitations:
  <https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/>
- Cloudflare Astro guide:
  <https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/>
- Workers Static Assets redirects:
  <https://developers.cloudflare.com/workers/static-assets/redirects/>
- Workers custom domains and `www` redirects:
  <https://developers.cloudflare.com/workers/configuration/routing/custom-domains/#redirect-between-www-and-root-domain>
- Workers GitHub Actions:
  <https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/>

## Dependency Decision

Add `wrangler` as a dev dependency.

Do not add `@astrojs/cloudflare` for this migration. That adapter is for
on-demand rendering/SSR and sets Astro's output toward server rendering. This
site should stay static-first.

Do not add the Cloudflare Vite plugin for the first migration. The current
deployment need is simpler: upload an already verified `dist/` directory.

Recommended `just` recipes:

```just
deploy-cloudflare:
    wrangler deploy

preview-cloudflare:
    wrangler dev
```

`preview-cloudflare` is optional. It is useful for testing Worker asset
routing, `_redirects`, and custom 404 behavior locally, but `just preview`
remains the normal Astro preview command.

## Wrangler Configuration

Use a static-assets-only `wrangler.toml`.

```toml
name = "tpm-site"
compatibility_date = "2026-05-08"

[assets]
directory = "./dist"
not_found_handling = "404-page"
```

Notes:

- Do not set `main` unless we intentionally add Worker code.
- Do not set `run_worker_first` for the static site.
- `not_found_handling = "404-page"` should make Cloudflare serve the generated
  `404.html` for unknown routes.
- Custom domain wiring can be done after the Worker deploy exists. Keep that
  operational step separate from the code migration.

## Redirects

Current state:

- Site-owned redirects live in `site/config/redirects.json`.
- Astro consumes that file through `src/lib/site-redirects.ts`.
- Tests, `just build-cloudflare`, and `just verify` verify the legacy redirect
  map and generated deploy artifacts.
- `site/public` is already the site instance public directory, so files there
  are copied into `dist/`.

Cloudflare target:

- Keep content `legacyPermalink` metadata as the source of truth for
  article/announcement permalink redirects.
- Keep hand-written compatibility redirects in `site/config/redirects.json`.
- Generate a Cloudflare-compatible `_redirects` file into the deployed static
  assets from both sources.
- Do not ask authors to edit `_redirects` manually.

Recommended generated format:

```text
# Generated from site redirects and article legacyPermalink metadata. Do not edit by hand.
/2021/11/30/what-is-a-meme/ /articles/what-is-a-meme/ 301
```

Why generate instead of hand-authoring:

- Avoids drift between article metadata, Astro config, local verification, and
  Cloudflare deploys.
- Keeps the site-instance authoring surface JSON-based and GUI-friendly.
- Lets tests assert redirect parity while still allowing explicit
  hand-written compatibility redirects.

Implementation options:

1. Generate `dist/_redirects` after `just build`.
   This is lowest risk because it avoids writing generated files into
   `site/public`.

2. Generate `site/public/_redirects` during a prebuild step.
   This makes the file visible in source-like public assets, but it creates
   generated-file churn in the site instance.

Prefer option 1.

Implemented command:

```text
just build-cloudflare
```

Inputs:

- `siteInstance.content.announcements`
- `siteInstance.content.articles`
- `siteInstance.output.dist`

Output:

- `dist/_redirects`

Validation:

- Each source begins with `/`.
- Each destination begins with `/` or is an absolute URL.
- Each line is `[source] [destination] 301`.
- The file stays below Cloudflare's `_redirects` limits. Current legacy
  redirects are comfortably below the 2,000 static redirect limit.
- Domain canonicalization stays outside this generator because Cloudflare does
  not support domain-level `_redirects` for Workers Static Assets.

Open question:

- Whether every historical redirect should be `301`. That is the correct
  default for durable legacy permalink moves, but the current
  `site/config/redirects.json` schema has no status code field. If we ever need
  `302`, extend the redirect config schema before generating `_redirects`.

## Headers

Cloudflare Static Assets supports `_headers` in the asset directory. The active
site uses `_headers` for extensionless compatibility endpoints that need a
specific MIME type and for long-lived caching of Astro fingerprinted assets.

Current headers:

```text
/_astro/*
  Cache-Control: public, max-age=31556952, immutable

/.well-known/traffic-advice
  Content-Type: application/trafficadvice+json; charset=utf-8
  X-Content-Type-Options: nosniff
```

`/_astro/*` is intentionally the only immutable cache rule. Astro emits source
assets such as optimized images, CSS, and JavaScript into `_astro` with
fingerprinted filenames, so a changed asset receives a changed URL. HTML, RSS,
sitemaps, PDFs, Pagefind files, root icons, and other non-fingerprinted static
files should keep Cloudflare's default revalidation behavior or receive a
separate, shorter policy after measurement.

Lighthouse cache warnings for `/cdn-cgi/zaraz/*`,
`static.cloudflareinsights.com/*`, or other Cloudflare/dashboard-injected
analytics scripts are not first-party Astro asset regressions. Treat those as
analytics policy findings: either accept them as production telemetry overhead
or change the Cloudflare dashboard/analytics configuration intentionally. Do
not add app-code workarounds for those warnings.

If a Content Security Policy is added later, version it in repository-owned
deployment configuration or in a documented Cloudflare setting. The policy must
explicitly name intended analytics/RUM origins so scanner findings are not
confused with accidental app-code behavior.

`/.well-known/traffic-advice` is served from
`site/public/.well-known/traffic-advice` and currently allows private prefetch
proxy traffic:

```json
[{ "user_agent": "prefetch-proxy", "fraction": 1 }]
```

This is intentional for TPM because the site is static, public, and safe to
prefetch. If future analytics, traffic-cost, or abuse concerns appear, reduce
the fraction or switch the endpoint to `disallow`.

## CI Changes

GitHub Actions deploys the verified `dist/` artifact to Cloudflare Workers
Static Assets after the build job generates Cloudflare deploy files into
`dist/`.

Recommended deploy job shape:

```yaml
deploy:
  name: Deploy to Cloudflare Workers
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  needs:
    - quality
    - build
    - browser
    - catalog
    - audit
  runs-on: ubuntu-latest
  timeout-minutes: 15
  permissions:
    contents: read

  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 22.12.0
    - uses: actions/download-artifact@v4
      with:
        name: verified-dist
        path: dist
    - uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        command: deploy --cwd ../..
        packageManager: npm
        workingDirectory: .github/cloudflare-deploy
        wranglerVersion: "4"
```

The Cloudflare deploy job consumes the already-built artifact, so it does not
need Bun. It uses Node 22 and asks `wrangler-action` to install/run Wrangler
with npm because Wrangler 4 requires Node 22 or newer. The npm install is
intentionally isolated in `.github/cloudflare-deploy` so npm installs only
Wrangler instead of resolving the Bun-managed site toolchain.

Required GitHub secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Cloudflare recommends a scoped API token with Workers edit permissions. Do not
store this token in the repository.

Completed cutover sequence:

1. Keep GitHub Pages deploy until Cloudflare preview deploy is verified.
2. Add a Cloudflare deploy job gated to `main` that uses repository secrets and
   the official `cloudflare/wrangler-action@v3` action.
3. Verify canonical routes, legacy redirects, 404s, PDFs, feeds, sitemap, and
   social images on the workers.dev/custom-domain preview.
4. Cut DNS/custom domain over after the deployed Worker passes smoke checks.
5. Remove the GitHub Pages deploy job and Pages-specific permissions.

## Build And Verification Changes

Use the release build script before manual deploys or release verification:

```text
just build-release
just verify
just validate-html
```

`just build-release` runs the optimized production build and then runs
`just build-cloudflare`. `just build-cloudflare` should initially only generate
`dist/_redirects`. If future headers are added, the same script can write
`dist/_headers`.

Focused tests:

- Config/command-surface test: `just deploy-cloudflare` uses Wrangler.
- Wrangler config test:
  - has `[assets] directory = "./dist"`;
  - has `not_found_handling = "404-page"`;
  - does not contain `main`;
  - does not contain `run_worker_first`.
- Redirect generator unit tests:
  - emits stable sorted lines;
  - appends status code `301`;
  - rejects malformed metadata and duplicate sources;
  - writes into the configured output directory.
- Legacy redirect parity tests:
  - Cloudflare redirects include content-derived legacy permalink redirects;
  - Cloudflare redirects include site-owned compatibility redirects;
  - duplicate matching redirects collapse to one output line;
  - conflicting redirect destinations fail generation.
- CI workflow test:
  - deploy job uses `cloudflare/wrangler-action@v3`;
  - deploy job sets up Node 22 and forces `packageManager: npm`;
  - deploy job runs from `.github/cloudflare-deploy` and passes
    `--cwd ../..` so Wrangler uses the repository-root config and `dist`;
  - deploy job consumes `verified-dist`;
  - deploy job no longer uses `actions/deploy-pages` after cutover.

Manual smoke tests after deploy:

- `/`
- `/404-ish-route/` returns Cloudflare custom 404 with 404 status.
- A representative legacy permalink redirects to its `/articles/.../` URL.
- `/feed.xml`
- `/sitemap-index.xml`
- `/articles/what-is-a-meme/`
- `/articles/what-is-a-meme/what-is-a-meme.pdf`

## GitHub Pages Cleanup After Cutover

Cloudflare is now the production host. The cleanup state is:

- GitHub Pages deploy steps are removed from `.github/workflows/ci.yml`.
- Pages permissions `id-token: write` and `pages: write` are removed.
- `actions/configure-pages`, `actions/upload-pages-artifact`, and
  `actions/deploy-pages` are removed.
- `site/public/CNAME` is intentionally retained as a harmless static file.
- Docs and command descriptions point deployment work at Cloudflare
  Workers.

## Recommended Migration Milestones

1. **Design and config**
   Add `wrangler.toml`, `just` recipes, and tests that encode static-only
   Workers hosting.

2. **Redirect generation**
   Add `just build-cloudflare` to generate `dist/_redirects` from content
   `legacyPermalink` metadata and `site/config/redirects.json`, then verify it
   in tests and build checks.

3. **CI preview deploy**
   Add a Cloudflare deploy job that consumes `verified-dist` and deploys only
   from `main`.

4. **Smoke and DNS cutover**
   Deploy, smoke test Workers routes/redirects/404s, then point the custom
   domain at the Worker.

5. **GitHub Pages removal**
   Remove Pages deploy configuration after Cloudflare has served production
   successfully.

## Risks And Guardrails

- **Accidentally invoking Worker code for every request.**
  Avoid `main` and `run_worker_first` unless we intentionally add dynamic
  behavior.

- **Redirect drift.**
  Generate `_redirects` from content `legacyPermalink` metadata plus
  site-owned redirects, deduplicate matching entries, fail conflicting entries,
  and test the output.

- **Different 404 behavior from GitHub Pages.**
  Use `not_found_handling = "404-page"` and smoke test the status code.

- **Caching surprises.**
  Start with Cloudflare defaults. Add `_headers` only after measuring.

- **Secret handling.**
  Use GitHub secrets for Cloudflare credentials. Do not add tokens to `.env`,
  `wrangler.toml`, or docs examples beyond variable names.

## Recommendation

Proceed with Workers Static Assets, Wrangler, generated `_redirects`, and
static-only configuration. Do not add the Astro Cloudflare adapter for this
migration. Keep CI's verified artifact reuse model: build once, verify once,
deploy that exact `dist/`.
