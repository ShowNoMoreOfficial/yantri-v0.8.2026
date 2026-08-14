/**
 * The v1 scorer: one LLM read + deterministic gates in code.
 *
 * Non-negotiables enforced HERE, not in the prompt (handoff N6/N7):
 * - Harm flags from the LLM force a REFUSE verdict. No tenant setting,
 *   brand context field, or request parameter can weaken this path.
 * - Every result carries full reasoning; nothing emits a bare score.
 * - Evidence is a stated-neutral 50 while the outcome ledger is empty —
 *   reflected honestly as low confidence, never faked.
 */
import type { Tenant } from "../generated/prisma/client.js";
import { db } from "../db.js";
import { readTopic, scoredBy, provider, type TopicRead } from "./llm.js";
import { edgeWeights, brandCeiling, platformAppetite } from "./tables.js";

export type Verdict = "approve" | "re_angle" | "escalate" | "refuse" | "kill";

export type ScoredTopic = {
  verdict: Verdict;
  killed: boolean;
  killReason: string | null;
  confidence: number;
  flags: string[];
  /** The platform this was scored for — Yantri's pick unless the caller constrained it. */
  platform: string;
  /** Ranked platform recommendations (form-fit, headroom-fitting first). */
  platforms: string[];
  /** The fan-out (handoff 07): every content type this topic carries, primary first. */
  content_types: string[];
  scores: {
    edge: number;
    evidence: number;
    meaning: number;
    headroom: number;
    transgression_load: number;
  };
  reasoning: {
    angle: string;
    edge_dimensions: TopicRead["edge"];
    edge_weights_used: Record<string, number>;
    four_force: TopicRead["meaning"];
    emotion: TopicRead["emotion"];
    form: TopicRead["form"];
    headroom: { brand_ceiling: number; platform_appetite: number; moment: "flagged_for_human" };
    harm: TopicRead["harm"];
    harm_reason: string;
    reangle_suggestion: string;
    why: string;
    evidence_note: string;
    scored_by: string;
  };
};

const HARM_LABELS: Record<keyof TopicRead["harm"], string> = {
  protected_groups: "demeans a protected group",
  obscenity_for_shock: "obscenity for shock",
  incitement: "incitement",
  india_legal: "acute India IT-Rules/BNS exposure",
};

export async function scoreTopic(
  tenant: Tenant,
  input: { topic: string; context?: string; platform?: string }
): Promise<ScoredTopic> {
  const bc = tenant.brandContext as Record<string, unknown>;
  const niche = typeof bc.niche === "string" ? bc.niche : undefined;

  const read = await readTopic(tenant, input.topic, input.context);

  // ── Edge: weighted sum, weights per niche ──────────────────────────
  const weights = edgeWeights(niche);
  const edge = Math.round(
    read.edge.angle * weights.angle +
      read.edge.nerve * weights.nerve +
      read.edge.dare * weights.dare +
      read.edge.tension * weights.tension +
      read.edge.revelation * weights.revelation
  );

  // ── Meaning: four-force average (per-motive weighting is Phase 2) ──
  const m = read.meaning;
  const meaning = Math.round((m.geo + m.culture + m.society + m.power) / 4);

  // ── Evidence: honest neutral until the ledger has data ─────────────
  const outcomeCount = await db.outcome.count({ where: { choice: { tenantId: tenant.id } } });
  const evidence = 50;
  const evidenceNote =
    outcomeCount === 0
      ? "Ledger empty — evidence is a stated-neutral 50, not a judgment."
      : `Ledger has ${outcomeCount} outcomes — still neutral in v1; Phase 2 scores against baseline.`;

  // ── Transgression headroom: ceiling × appetite; moment is human ────
  const ceiling = brandCeiling(niche, typeof bc.transgression_ceiling === "number" ? bc.transgression_ceiling : undefined);
  // How much this telling leans on transgression to work:
  const load = Number(((read.edge.dare * 0.6 + read.edge.nerve * 0.4) / 100).toFixed(3));

  // ── Platform: Yantri's job (handoff step 10) unless the caller constrains it.
  // Natural platforms for the form, then prefer those whose appetite can carry
  // this telling's transgression load.
  const FORM_PLATFORMS: Record<TopicRead["form"], string[]> = {
    single_tweet: ["x"],
    thread: ["x", "linkedin"],
    long_form: ["blog", "linkedin"],
    carousel: ["instagram", "linkedin"],
    short_form: ["youtube", "instagram"],
  };
  let platform: string;
  let platforms: string[];
  if (input.platform) {
    platform = input.platform;
    platforms = [platform];
  } else {
    const natural = FORM_PLATFORMS[read.form] ?? ["x"];
    const fitting = natural.filter((p) => load <= ceiling * platformAppetite(p));
    platforms = [...fitting, ...natural.filter((p) => !fitting.includes(p))];
    platform = platforms[0]; // best fit; if none fits, re_angle handles the excess
  }

  const appetite = platformAppetite(platform);
  const headroom = Number((ceiling * appetite).toFixed(3));

  // ── Confidence: low by design while the ledger is thin ─────────────
  const loopGap = Math.abs(edge - meaning);
  const agreement = loopGap <= 25;
  let confidence = 0.2 + Math.min(0.2, outcomeCount * 0.01) + (agreement ? 0.1 : 0);
  confidence = Number(confidence.toFixed(2));

  // ── Verdict gates, in order. Hard refusal first and absolute. ──────
  const flags: string[] = [];
  const harmHits = (Object.keys(read.harm) as (keyof TopicRead["harm"])[]).filter((k) => read.harm[k]);

  let verdict: Verdict;
  let killed = false;
  let killReason: string | null = null;

  if (harmHits.length > 0) {
    verdict = "refuse";
    killed = true;
    killReason = `hard refusal: ${harmHits.map((k) => HARM_LABELS[k]).join(", ")}`;
  } else if (edge < 35) {
    verdict = "kill";
    killed = true;
    killReason = "dead topic — no living angle found";
  } else if (niche === "devotional" && read.edge.dare > 20) {
    verdict = "escalate"; // any devotional edge attempt goes to a human (handoff 04)
    flags.push("devotional_edge_attempt");
  } else if (load > headroom) {
    verdict = "re_angle"; // edge exceeds what brand × platform can carry; keep the nerve, lose the danger
    flags.push("exceeds_headroom");
  } else if (!agreement) {
    verdict = "escalate"; // loops disagree — the most valuable signal, never resolved downward (handoff 02)
    flags.push("loops_disagree");
  } else if (edge >= 60) {
    verdict = "approve";
  } else {
    verdict = "re_angle"; // alive-ish but the telling is weak — the craft branch
  }

  if (load > 0.3 && !killed) flags.push("moment_check"); // moment permission is never machine-read
  if (confidence < 0.3) flags.push("low_confidence");
  if (provider() === "stub") flags.push("stub_scoring"); // plumbing test — not a real judgment

  return {
    verdict,
    killed,
    killReason,
    confidence,
    flags,
    platform,
    platforms,
    content_types: [read.form, ...read.secondary_forms],
    scores: { edge, evidence, meaning, headroom, transgression_load: load },
    reasoning: {
      angle: read.angle,
      edge_dimensions: read.edge,
      edge_weights_used: weights as unknown as Record<string, number>,
      four_force: read.meaning,
      emotion: read.emotion,
      form: read.form,
      headroom: { brand_ceiling: ceiling, platform_appetite: appetite, moment: "flagged_for_human" },
      harm: read.harm,
      harm_reason: read.harm_reason,
      reangle_suggestion: read.reangle_suggestion,
      why: read.why,
      evidence_note: evidenceNote,
      scored_by: scoredBy(),
    },
  };
}
