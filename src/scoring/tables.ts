/**
 * Hand-set starting values from the handoff pack (docs/handoff/04, 09).
 * Every number here is a GUESS to be corrected by outcome data (Phase 2) —
 * except nothing in hard-refusal.ts, which is not tunable at all.
 */

export type Niche = "news" | "comedy" | "devotional" | "b2b" | "human_interest";

export type EdgeDimensions = {
  angle: number;
  nerve: number;
  dare: number;
  tension: number;
  revelation: number;
};

/** Per-niche Edge weights — "alive" means different things per niche (handoff 02). */
export const EDGE_WEIGHTS: Record<Niche, EdgeDimensions> = {
  news: { angle: 0.2, nerve: 0.3, dare: 0.05, tension: 0.15, revelation: 0.3 },
  comedy: { angle: 0.15, nerve: 0.3, dare: 0.35, tension: 0.15, revelation: 0.05 },
  devotional: { angle: 0.4, nerve: 0.1, dare: 0.0, tension: 0.25, revelation: 0.25 },
  b2b: { angle: 0.35, nerve: 0.2, dare: 0.05, tension: 0.3, revelation: 0.1 },
  human_interest: { angle: 0.2, nerve: 0.1, dare: 0.05, tension: 0.3, revelation: 0.35 },
};

export const DEFAULT_EDGE_WEIGHTS: EdgeDimensions = {
  angle: 0.2,
  nerve: 0.2,
  dare: 0.2,
  tension: 0.2,
  revelation: 0.2,
};

/** Per-niche transgression ceiling defaults (handoff 04 Layer 4). */
export const NICHE_CEILING: Record<Niche, number> = {
  news: 0.5,
  comedy: 0.8,
  devotional: 0.05,
  b2b: 0.2,
  human_interest: 0.5,
};

/** How much edge each platform rewards vs punishes (handoff 09 §F). */
export const PLATFORM_APPETITE: Record<string, number> = {
  x: 0.8,
  youtube: 0.5,
  youtube_monetized: 0.3,
  instagram: 0.2,
  linkedin: 0.3,
  blog: 0.5,
  whatsapp: 0.4,
};
export const DEFAULT_APPETITE = 0.4;

export function edgeWeights(niche: string | undefined): EdgeDimensions {
  return EDGE_WEIGHTS[niche as Niche] ?? DEFAULT_EDGE_WEIGHTS;
}

export function brandCeiling(niche: string | undefined, override: number | undefined): number {
  if (typeof override === "number") return Math.max(0, Math.min(1, override));
  return NICHE_CEILING[niche as Niche] ?? 0.4;
}

export function platformAppetite(platform: string | undefined): number {
  if (!platform) return DEFAULT_APPETITE;
  return PLATFORM_APPETITE[platform.toLowerCase()] ?? DEFAULT_APPETITE;
}
