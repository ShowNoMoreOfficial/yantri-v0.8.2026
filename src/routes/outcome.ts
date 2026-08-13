import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db.js";
import { tenantAuth, type TenantEnv } from "../auth.js";
import type { Prisma } from "../generated/prisma/client.js";

const OutcomeBody = z.object({
  choiceId: z.string().min(1),
  platform: z.string().min(1).max(40),
  metrics: z.record(z.string(), z.number()).refine((m) => Object.keys(m).length > 0, "metrics must not be empty"),
});

/** The metric a platform's baseline is computed on (first present wins). */
const PRIMARY_METRIC = ["views", "impressions", "plays", "reads"] as const;

function primaryOf(metrics: Record<string, number>): { key: string; value: number } | null {
  for (const key of PRIMARY_METRIC) {
    if (typeof metrics[key] === "number") return { key, value: metrics[key] };
  }
  return null;
}

const BASELINE_WINDOW = 20;

/** Trailing average of the primary metric over the tenant's recent outcomes on a platform. */
async function trailingBaseline(tenantId: string, platform: string, excludeOutcomeId?: string) {
  const recent = await db.outcome.findMany({
    where: { platform, choice: { tenantId }, ...(excludeOutcomeId ? { id: { not: excludeOutcomeId } } : {}) },
    orderBy: { reportedAt: "desc" },
    take: BASELINE_WINDOW,
  });
  const values = recent
    .map((o) => primaryOf(o.metrics as Record<string, number>))
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map((p) => p.value);
  if (values.length === 0) return { avg: null as number | null, count: 0 };
  return { avg: values.reduce((a, b) => a + b, 0) / values.length, count: values.length };
}

export const outcome = new Hono<TenantEnv>();
outcome.use("*", tenantAuth);

// The loop-closer. Without this endpoint being called, Yantri never learns.
outcome.post("/outcome", async (c) => {
  const parsed = OutcomeBody.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: { code: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid body." } }, 400);
  }
  const tenant = c.get("tenant");
  const { choiceId, platform, metrics } = parsed.data;

  const choice = await db.choice.findFirst({ where: { id: choiceId, tenantId: tenant.id } });
  if (!choice) {
    return c.json({ error: { code: "not_found", message: "No such choice for this tenant." } }, 404);
  }

  // Outlier = beats the brand's OWN baseline, never absolute numbers (handoff 04 Layer 2).
  const baseline = await trailingBaseline(tenant.id, platform);
  const primary = primaryOf(metrics);
  const outlierMultiple =
    primary && baseline.avg && baseline.avg > 0 ? Number((primary.value / baseline.avg).toFixed(2)) : null;

  const row = await db.outcome.create({
    data: {
      choiceId: choice.id,
      platform,
      metrics: metrics as Prisma.InputJsonValue,
      outlierMultiple,
    },
  });

  return c.json(
    {
      outcomeId: row.id,
      choiceId: choice.id,
      outlierMultiple,
      baseline: { platform, count: baseline.count, avg: baseline.avg },
      note: baseline.count === 0 ? "First outcome on this platform — no baseline yet." : undefined,
    },
    201
  );
});

// The tenant's trailing performance per platform — for dashboards and sanity checks.
outcome.get("/tenants/me/baseline", async (c) => {
  const tenant = c.get("tenant");
  const platforms = await db.outcome.findMany({
    where: { choice: { tenantId: tenant.id } },
    select: { platform: true },
    distinct: ["platform"],
  });
  const baselines = await Promise.all(
    platforms.map(async ({ platform }) => {
      const b = await trailingBaseline(tenant.id, platform);
      return { platform, count: b.count, avg: b.avg };
    })
  );
  return c.json({ tenantId: tenant.id, window: BASELINE_WINDOW, baselines });
});
