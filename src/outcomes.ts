/**
 * Outcome recording — shared by the /outcome route (Daftar reports metrics)
 * and the internal measurer (Yantri fetches metrics itself).
 * Outlier = beats the brand's OWN trailing baseline, never absolute numbers.
 */
import { db } from "./db.js";
import type { Prisma } from "./generated/prisma/client.js";

/** The metric a platform's baseline is computed on (first present wins). */
const PRIMARY_METRIC = ["views", "impressions", "plays", "reads", "likes"] as const;

export const BASELINE_WINDOW = 20;

export function primaryOf(metrics: Record<string, number>): { key: string; value: number } | null {
  for (const key of PRIMARY_METRIC) {
    if (typeof metrics[key] === "number") return { key, value: metrics[key] };
  }
  return null;
}

/** Trailing average of the primary metric over the tenant's recent outcomes on a platform. */
export async function trailingBaseline(tenantId: string, platform: string) {
  const recent = await db.outcome.findMany({
    where: { platform, choice: { tenantId } },
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

export async function recordOutcome(args: {
  tenantId: string;
  choiceId: string;
  platform: string;
  metrics: Record<string, number>;
}) {
  const baseline = await trailingBaseline(args.tenantId, args.platform);
  const primary = primaryOf(args.metrics);
  const outlierMultiple =
    primary && baseline.avg && baseline.avg > 0 ? Number((primary.value / baseline.avg).toFixed(2)) : null;

  const row = await db.outcome.create({
    data: {
      choiceId: args.choiceId,
      platform: args.platform,
      metrics: args.metrics as Prisma.InputJsonValue,
      outlierMultiple,
    },
  });

  return { row, baseline, outlierMultiple };
}
