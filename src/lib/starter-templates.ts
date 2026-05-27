/** Starter template IDs maintained as distribution assets. */
export const starterTemplateIds = [
  "minimal-blog",
  "editorial-magazine",
  "scholarly-publication",
  "docs-site",
  "kitchen-sink",
] as const;

/** Capability support level for one starter template. */
export type StarterTemplateCapabilityLevel =
  | "intentionally-absent"
  | "optional"
  | "required";

/** Stable starter template ID. */
export type StarterTemplateId = (typeof starterTemplateIds)[number];

/** One feature or output surface covered by a starter template. */
export interface StarterTemplateCapability {
  readonly level: StarterTemplateCapabilityLevel;
  readonly name: string;
  readonly notes: string;
}

/** Acceptance checks declared by a starter template. */
export interface StarterTemplateChecks {
  readonly build: readonly string[];
  readonly release: readonly string[];
  readonly source: readonly string[];
}

/** Maintained starter template descriptor. */
export interface StarterTemplate {
  readonly acceptanceChecks: StarterTemplateChecks;
  readonly capabilities: readonly StarterTemplateCapability[];
  readonly description: string;
  readonly id: StarterTemplateId;
  readonly label: string;
  readonly persona: string;
  readonly root: string;
}

/** Maintained starter template matrix. */
export const starterTemplates = [
  {
    acceptanceChecks: {
      build: ["SITE_INSTANCE_ROOT=examples/starters/minimal-blog just build"],
      release: ["just starters-check"],
      source: ["just starters-check", "just site-doctor"],
    },
    capabilities: [
      capability(
        "articles",
        "required",
        "One author, one category, one article.",
      ),
      capability("homepage", "required", "Small homepage and about page."),
      capability(
        "support",
        "intentionally-absent",
        "No public CTA by default.",
      ),
      capability("citations", "intentionally-absent", "Plain writing first."),
      capability("pdfs", "optional", "Platform default remains available."),
    ],
    description:
      "The smallest credible personal blog: writing, archive, author, category, RSS, and search with very little configuration.",
    id: "minimal-blog",
    label: "Minimal Blog",
    persona:
      "A solo writer who wants to publish quickly with low cognitive load.",
    root: "examples/starters/minimal-blog",
  },
  {
    acceptanceChecks: {
      build: [
        "SITE_INSTANCE_ROOT=examples/starters/editorial-magazine just build",
      ],
      release: ["just starters-check"],
      source: ["just starters-check", "just site-doctor"],
    },
    capabilities: [
      capability("articles", "required", "Multiple categories and authors."),
      capability("announcements", "required", "Editorial updates enabled."),
      capability(
        "collections",
        "required",
        "Featured and start-here curation.",
      ),
      capability("support", "optional", "CTA copy is configured but modest."),
      capability("citations", "optional", "Editorial prose may cite sources."),
    ],
    description:
      "A small publication starter for multiple sections, curated homepage surfaces, announcements, and light support CTAs.",
    id: "editorial-magazine",
    label: "Editorial Magazine",
    persona:
      "A small editorial team publishing recurring essays, announcements, and curated sections.",
    root: "examples/starters/editorial-magazine",
  },
  {
    acceptanceChecks: {
      build: [
        "SITE_INSTANCE_ROOT=examples/starters/scholarly-publication just build",
      ],
      release: ["just starters-check"],
      source: ["just starters-check", "just site-doctor"],
    },
    capabilities: [
      capability(
        "citations",
        "required",
        "Includes a citation and bibliography.",
      ),
      capability(
        "pdfs",
        "required",
        "PDF and scholarly metadata remain enabled.",
      ),
      capability(
        "bibliography",
        "required",
        "Site bibliography route enabled.",
      ),
      capability("semanticMetadata", "required", "Scholarly source surfaces."),
      capability("support", "intentionally-absent", "Research output first."),
    ],
    description:
      "A research-oriented starter proving citations, bibliography, PDF eligibility, and scholarly metadata defaults.",
    id: "scholarly-publication",
    label: "Scholarly Publication",
    persona:
      "A researcher, lab, or small journal that needs durable citations and PDFs.",
    root: "examples/starters/scholarly-publication",
  },
  {
    acceptanceChecks: {
      build: ["just test-docs-site"],
      release: ["just docs-check", "just starters-check"],
      source: ["just starters-check", "just test-docs-site"],
    },
    capabilities: [
      capability(
        "docs",
        "required",
        "Existing docs-site example is the starter.",
      ),
      capability(
        "navigation",
        "required",
        "Configuration-heavy section model.",
      ),
      capability("announcements", "required", "Release-note style updates."),
      capability(
        "support",
        "intentionally-absent",
        "Product docs do not need CTAs.",
      ),
      capability("citations", "optional", "Reference pages may link sources."),
    ],
    description:
      "The maintained platform documentation site used as a richer non-TPM example.",
    id: "docs-site",
    label: "Documentation Site",
    persona:
      "A project maintainer documenting configuration, authoring, and operations.",
    root: "examples/docs-site",
  },
  {
    acceptanceChecks: {
      build: ["SITE_INSTANCE_ROOT=examples/starters/kitchen-sink just build"],
      release: ["just starters-check"],
      source: ["just starters-check", "just site-doctor"],
    },
    capabilities: [
      capability(
        "articles",
        "required",
        "Multiple content shapes in one site.",
      ),
      capability("announcements", "required", "Homepage and feed coverage."),
      capability("citations", "required", "Reference-heavy example content."),
      capability("support", "required", "CTA and social config coverage."),
      capability("extensions", "optional", "Future extension demo target."),
    ],
    description:
      "A broad demo starter that intentionally exercises as many platform surfaces as a small example can maintain.",
    id: "kitchen-sink",
    label: "Kitchen Sink Demo",
    persona:
      "A platform evaluator who wants to see the widest feature surface quickly.",
    root: "examples/starters/kitchen-sink",
  },
] as const satisfies readonly StarterTemplate[];

/**
 * Returns the maintained starter template matrix.
 *
 * @returns Starter templates in product display order.
 */
export function starterTemplateMatrix(): StarterTemplate[] {
  return starterTemplates.map((template) => ({
    ...template,
    acceptanceChecks: { ...template.acceptanceChecks },
    capabilities: template.capabilities.map((capabilityEntry) => ({
      ...capabilityEntry,
    })),
  }));
}

/**
 * Looks up one starter template by stable ID.
 *
 * @param id Starter template ID.
 * @returns Matching starter template.
 */
export function starterTemplateById(id: StarterTemplateId): StarterTemplate {
  const template = starterTemplates.find((candidate) => candidate.id === id);

  if (template === undefined) {
    throw new Error(`Unknown starter template "${id}".`);
  }

  return template;
}

function capability(
  name: string,
  level: StarterTemplateCapabilityLevel,
  notes: string,
): StarterTemplateCapability {
  return { level, name, notes };
}
