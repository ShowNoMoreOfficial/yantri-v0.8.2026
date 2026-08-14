import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db.js";
import { tenantAuth, type TenantEnv } from "../auth.js";
import { scoreTopic, type ScoredTopic } from "../scoring/scorer.js";
import { llmAvailable } from "../scoring/llm.js";
import type { Prisma, Tenant } from "../generated/prisma/client.js";

const ScoreBody = z.object({
  topic: z.string().min(3).max(500),
  context: z.string().max(20_000).optional(),
  platform: z.string().max(40).optional(),
  source: z.string().max(40).optional(),
  daftarEntityId: z.string().max(80).optional(),
});

const ChooseBody = z.object({
  candidates: z
    .array(
      z.object({
        topic: z.string().min(3).max(500),
        context: z.string().max(20_000).optional(),
        source: z.string().max(40).optional(),
      })
    )
    .min(1)
    .max(25),
  platform: z.string().max(40).optional(),
  top: z.number().int().min(1).max(10).default(5),
});

async function persistChoice(
  tenant: Tenant,
  input: { topic: string; source?: string; platform?: string; daftarEntityId?: string; runId?: string },
  s: ScoredTopic
) {
  return db.choice.create({
    data: {
      tenantId: tenant.id,
      topic: input.topic,
      source: input.source ?? null,
      platform: input.platform ?? null,
      scores: s.scores as unknown as Prisma.InputJsonValue,
      reasoning: s.reasoning as unknown as Prisma.InputJsonValue,
      verdict: s.verdict,
      confidence: s.confidence,
      killed: s.killed,
      killReason: s.killReason,
      runId: input.runId ?? null,
      daftarEntityId: input.daftarEntityId ?? null,
    },
  });
}

/** Compact response — Daftar's HTTP node truncates bodies at 2000 chars.
 *  The full reasoning always lives behind GET /v1/choices/:id. */
function compact(choiceId: string, s: ScoredTopic) {
  return {
    choiceId,
    verdict: s.verdict,
    edge: s.scores.edge,
    evidence: s.scores.evidence,
    meaning: s.scores.meaning,
    headroom: s.scores.headroom,
    confidence: s.confidence,
    angle: s.reasoning.angle.slice(0, 200),
    form: s.reasoning.form,
    why: s.reasoning.why.slice(0, 300),
    flags: s.flags,
  };
}

// Scope auth to this router's own paths — a bare use("*") would swallow every
// /v08.2026/* request mounted after this router (it shadowed /admin/measure).
export const score = new Hono<TenantEnv>();
score.use("/score", tenantAuth);
score.use("/choose", tenantAuth);
score.use("/choices/*", tenantAuth);

score.post("/score", async (c) => {
  if (!llmAvailable()) {
    return c.json({ error: { code: "scoring_unavailable", message: "GEMINI_API_KEY is not configured." } }, 503);
  }
  const parsed = ScoreBody.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: { code: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid body." } }, 400);
  }
  const tenant = c.get("tenant");
  const s = await scoreTopic(tenant, parsed.data);
  const row = await persistChoice(tenant, parsed.data, s);
  return c.json(compact(row.id, s));
});

score.post("/choose", async (c) => {
  if (!llmAvailable()) {
    return c.json({ error: { code: "scoring_unavailable", message: "GEMINI_API_KEY is not configured." } }, 503);
  }
  const parsed = ChooseBody.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: { code: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid body." } }, 400);
  }
  const tenant = c.get("tenant");
  const { candidates, platform, top } = parsed.data;
  const runId = crypto.randomUUID();

  // Score with bounded concurrency; a single candidate failing doesn't sink the run.
  const CONCURRENCY = 4;
  const results: ({ topic: string; source?: string; s: ScoredTopic } | null)[] = [];
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = await Promise.all(
      candidates.slice(i, i + CONCURRENCY).map(async (cand) => {
        try {
          const s = await scoreTopic(tenant, { topic: cand.topic, context: cand.context, platform });
          return { topic: cand.topic, source: cand.source, s };
        } catch (e) {
          console.error(`choose: scoring failed for "${cand.topic}":`, e);
          return null;
        }
      })
    );
    results.push(...batch);
  }

  const scored = results.filter((r): r is NonNullable<typeof r> => r !== null);
  const rows = await Promise.all(
    scored.map((r) => persistChoice(tenant, { topic: r.topic, source: r.source, platform, runId }, r.s))
  );

  const ranked = scored
    .map((r, i) => ({ ...compact(rows[i].id, r.s), topic: r.topic }))
    .sort((a, b) => b.edge - a.edge);
  const chosen = ranked.filter((r) => !["refuse", "kill"].includes(r.verdict)).slice(0, top);

  return c.json({
    runId,
    scored: scored.length,
    failed: candidates.length - scored.length,
    killed: ranked.length - ranked.filter((r) => !["refuse", "kill"].includes(r.verdict)).length,
    chosen: chosen.map((r) => ({
      choiceId: r.choiceId,
      topic: r.topic,
      verdict: r.verdict,
      edge: r.edge,
      angle: r.angle,
      form: r.form,
      flags: r.flags,
    })),
  });
});

// Full auditable record (handoff N6) — for humans and logs, no size limit.
score.get("/choices/:id", async (c) => {
  const tenant = c.get("tenant");
  const choice = await db.choice.findFirst({
    where: { id: c.req.param("id"), tenantId: tenant.id },
    include: { outcomes: true },
  });
  if (!choice) {
    return c.json({ error: { code: "not_found", message: "No such choice for this tenant." } }, 404);
  }
  return c.json(choice);
});
