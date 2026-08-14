import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db.js";
import { tenantAuth, adminAuth, type TenantEnv } from "../auth.js";
import { recordOutcome, trailingBaseline, BASELINE_WINDOW } from "../outcomes.js";
import { measureTick } from "../measure.js";

const OutcomeBody = z.object({
  choiceId: z.string().min(1),
  platform: z.string().min(1).max(40),
  metrics: z.record(z.string(), z.number()).refine((m) => Object.keys(m).length > 0, "metrics must not be empty"),
});

const PublishedBody = z.object({
  choiceId: z.string().min(1),
  url: z.string().url().max(500),
  platform: z.string().max(40).optional(),
});

export const outcome = new Hono<TenantEnv>();

// Admin: force a measurement tick now (testing + manual reruns).
outcome.post("/admin/measure", adminAuth, async (c) => {
  const result = await measureTick();
  return c.json(result);
});

outcome.use("/outcome", tenantAuth);
outcome.use("/published", tenantAuth);
outcome.use("/tenants/me/baseline", tenantAuth);

// Daftar reports a publication. The measurer takes it from here.
outcome.post("/published", async (c) => {
  const parsed = PublishedBody.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: { code: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid body." } }, 400);
  }
  const tenant = c.get("tenant");
  const { choiceId, url, platform } = parsed.data;

  const choice = await db.choice.findFirst({ where: { id: choiceId, tenantId: tenant.id } });
  if (!choice) {
    return c.json({ error: { code: "not_found", message: "No such choice for this tenant." } }, 404);
  }

  const updated = await db.choice.update({
    where: { id: choice.id },
    data: {
      publishedUrl: url,
      publishedAt: new Date(),
      ...(platform ? { platform } : {}),
      measureCount: 0,
    },
  });

  return c.json({ choiceId: updated.id, publishedUrl: updated.publishedUrl, publishedAt: updated.publishedAt });
});

// Manual/external metrics report (still supported — e.g. YouTube via Daftar later).
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

  const { row, baseline, outlierMultiple } = await recordOutcome({
    tenantId: tenant.id,
    choiceId: choice.id,
    platform,
    metrics,
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
