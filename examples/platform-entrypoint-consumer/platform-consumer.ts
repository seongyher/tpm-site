import {
  createOutputDiagnostic,
  outputDiagnosticIdentity,
} from "../../src/platform/diagnostics";
import {
  anchoredPresetConfig,
  computeAnchoredPosition,
  interactionPolicyScriptPaths,
} from "../../src/platform/interactions";
import {
  classifyEmbedMediaSource,
  mediaAccessibilityPolicy,
} from "../../src/platform/media";
import {
  normalizedCitationSource,
  parseBibtexEntries,
} from "../../src/platform/references";
import { routeOutputPath } from "../../src/platform/routes";

/** Deterministic report produced by the platform-entrypoint example. */
export interface PlatformEntrypointConsumerReport {
  readonly citationIdentity: string;
  readonly diagnosticIdentity: string;
  readonly embedProvider: string;
  readonly interactionScripts: readonly string[];
  readonly mediaAlt: string;
  readonly placement: string;
  readonly routeOutputPath: string;
}

/**
 * Exercises platform entrypoints without importing a live site instance.
 *
 * @returns Stable facts from site-neutral platform domains.
 */
export function createPlatformEntrypointConsumerReport(): PlatformEntrypointConsumerReport {
  const diagnostic = createOutputDiagnostic({
    category: "metadata",
    code: "metadata.example",
    location: { route: "/example/" },
    message: "Example metadata diagnostic.",
    moduleId: "example-consumer",
    severity: "warning",
  });
  const mediaPolicy = mediaAccessibilityPolicy({
    alt: "  Example diagram.  ",
    role: "article-image",
    surface: "article-html",
  });
  const source = exampleCitationIdentity();
  const preset = anchoredPresetConfig("article-action-menu");
  const placement = computeAnchoredPosition({
    blockAnchorRect: { height: 32, width: 80, x: 500, y: 96 },
    boundaryRect: { height: 600, width: 800, x: 0, y: 0 },
    fallback: preset.fallback,
    floatingSize: { height: 160, width: 240 },
    inlineAnchorRect: { height: 32, width: 80, x: 500, y: 96 },
    offset: preset.offset,
    placement: preset.placement,
    safeGutter: preset.safeGutter,
  });

  return {
    citationIdentity: source.identity.key,
    diagnosticIdentity: outputDiagnosticIdentity(diagnostic),
    embedProvider: classifyEmbedMediaSource(
      "https://www.youtube.com/embed/example",
    ).provider,
    interactionScripts: interactionPolicyScriptPaths(),
    mediaAlt:
      mediaPolicy.policy?.kind === "descriptive" ? mediaPolicy.policy.alt : "",
    placement: placement.placement,
    routeOutputPath: routeOutputPath("/articles/example/"),
  };
}

function exampleCitationIdentity() {
  const result = parseBibtexEntries(`
    @article{example-1978,
      title = {A Matter of Individuality},
      author = {Hull, David L.},
      journal = {Philosophy of Science},
      year = {1978},
      doi = {10.1086/288811}
    }
  `);

  if (!result.ok || result.entries[0] === undefined) {
    throw new Error("Expected example BibTeX to parse.");
  }

  return normalizedCitationSource(result.entries[0]);
}
