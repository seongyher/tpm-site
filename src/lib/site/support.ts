import type { SiteConfig } from "./site-config";

/** Display-ready third-party support action. */
interface SupportActionViewModel {
  ariaLabel: string;
  href: string;
  label: string;
}

/** Display-ready support actions shared by home and article CTA surfaces. */
export interface SupportActionsViewModel {
  discord: SupportActionViewModel;
  enabled: boolean;
  patreon: SupportActionViewModel;
}

/** Display-ready article/home support block copy and actions. */
export interface SupportBlockViewModel extends SupportActionsViewModel {
  body: string;
  title: string;
}

type SupportConfig = Pick<SiteConfig, "features" | "support">;

/**
 * Normalizes configured support actions for reusable UI components.
 *
 * @param config Site configuration with support links and feature flags.
 * @returns Support action props safe to pass to view components.
 */
export function supportActionsViewModel(
  config: SupportConfig,
): SupportActionsViewModel {
  return {
    discord: supportAction(config.support.discord),
    enabled: config.features.support,
    patreon: supportAction(config.support.patreon),
  };
}

/**
 * Normalizes configured support block copy and actions.
 *
 * @param config Site configuration with support copy, links, and feature flags.
 * @returns Support block props safe to pass to view components.
 */
export function supportBlockViewModel(
  config: SupportConfig,
): SupportBlockViewModel {
  return {
    ...supportActionsViewModel(config),
    body: config.support.block.body,
    title: config.support.block.title,
  };
}

function supportAction(action: {
  ariaLabel?: string | undefined;
  href: string;
  label: string;
}): SupportActionViewModel {
  return {
    ariaLabel: action.ariaLabel ?? action.label,
    href: action.href,
    label: action.label,
  };
}
