# Vite Build Optimization Plan

## Objective

Find safe Astro/Vite build configuration improvements that reduce generated
payload without changing routes, article rendering, search behavior,
accessibility, or authoring workflow. Every experiment must be reproducible so
we can rerun it after Astro, Vite, Tailwind, or site-content changes.

## Current Toolchain

- Astro currently controls the production build and wraps Vite internally.
- The lockfile currently resolves Vite 7.3.2.
- Vite 7 exposes `build.minify` as `false`, `true`, `"esbuild"`, or
  `"terser"`.
- Current Vite 8 documentation exposes `"oxc"` minification and documents Oxc
  as the default client minifier, but that is not a safe current
  `astro.config.ts` flag while this project is still on Vite 7 through Astro.
- Astro's static build hardcodes some client build behavior, including `esnext`
  targeting and client minification. Experiments must verify whether a Vite
  option actually affects generated `dist/` output before we adopt it.

## Experiment Harness

Historical note: the old `just payload-vite-experiments` rerun command was
retired from the active command surface during the Rust/`just` migration. If
this experiment harness is reactivated, it should build temporary Astro config
files under `tmp/vite-build-experiments/`. Each scenario should:

- imports the real `astro.config.ts`;
- merges a small JSON-serializable Vite config fragment;
- builds to a scenario-specific output directory;
- runs Pagefind against that output;
- runs strict HTML validation;
- runs build verification against source content expectations;
- measures raw, gzip, and Brotli payload for all files, HTML, CSS, and JS.

The script writes a Markdown report so future developers can rerun the same
suite and compare results without relying on memory.

## Scenario Policy

Candidate scenarios may influence production config only if they pass every
gate and reduce compressed output without creating a UX or maintenance tradeoff.

Measurement-only scenarios are useful for understanding cost or confirming
Astro behavior, but they are not production candidates.

Unsupported scenarios document toolchain limits. They are useful because they
keep future work explicit; for example, Oxc minification should be revisited
after Astro/Vite expose it through the installed build stack.

## Production Adoption Rule

Do not change `astro.config.ts` for payload optimization unless a reproducible
scenario passes all gates and shows meaningful gzip/Brotli savings. If a
scenario only improves raw bytes or only changes an internal temporary bundle,
leave production config alone.

Any production adoption must then pass the normal release gates, especially
`just release-check`, browser invariants, accessibility checks, HTML
validation, and payload reporting.
