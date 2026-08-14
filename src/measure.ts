/**
 * The measurer — the half of the feedback loop Yantri runs itself.
 *
 * Daftar reports "this choice was published at this URL" (POST /published).
 * This module wakes on a timer and, for each published choice due for a
 * reading (default T+48h and T+7d), fetches public metrics and records an
 * Outcome against the tenant's own baseline.
 *
 * v1 measures X only, via the public syndication endpoint (no API tier
 * needed). Failures are logged and retried next tick — never fatal.
 */
import { db } from "./db.js";
import { recordOutcome } from "./outcomes.js";

const DELAYS_HOURS = (process.env.MEASURE_DELAYS_HOURS ?? "48,168")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n));

const TICK_MINUTES = Number(process.env.MEASURE_TICK_MINUTES ?? 60);

/* ─── X public metrics via the syndication endpoint ──────────────────── */

function tweetIdFromUrl(url: string): string | null {
  const m = url.match(/\/status(?:es)?\/(\d+)/);
  return m ? m[1] : null;
}

/** Token derivation the syndication CDN expects (public knowledge, no auth). */
function syndicationToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, "");
}

async function fetchXMetrics(url: string): Promise<Record<string, number> | null> {
  const id = tweetIdFromUrl(url);
  if (!id) return null;
  const res = await fetch(
    `https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=${syndicationToken(id)}&lang=en`,
    { headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)" } }
  );
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data || typeof data !== "object") return null;

  const metrics: Record<string, number> = {};
  if (typeof data.favorite_count === "number") metrics.likes = data.favorite_count;
  if (typeof data.conversation_count === "number") metrics.replies = data.conversation_count;
  const retweets = (data as { retweet_count?: unknown }).retweet_count;
  if (typeof retweets === "number") metrics.reposts = retweets;
  const views = (data as { views?: { count?: string } }).views?.count;
  if (views && !Number.isNaN(Number(views))) metrics.views = Number(views);
  return Object.keys(metrics).length > 0 ? metrics : null;
}

/* ─── The tick ───────────────────────────────────────────────────────── */

export async function measureTick(): Promise<{ measured: number; skipped: number; failed: number }> {
  const now = Date.now();
  const due = await db.choice.findMany({
    where: { publishedAt: { not: null }, measureCount: { lt: DELAYS_HOURS.length } },
    include: { tenant: { select: { id: true } } },
    take: 50,
  });

  let measured = 0,
    skipped = 0,
    failed = 0;

  for (const choice of due) {
    const delayMs = DELAYS_HOURS[choice.measureCount] * 3600_000;
    if (!choice.publishedAt || !choice.publishedUrl) continue;
    if (now - choice.publishedAt.getTime() < delayMs) {
      skipped++;
      continue;
    }

    try {
      const platform = choice.platform ?? "x";
      const metrics = platform === "x" ? await fetchXMetrics(choice.publishedUrl) : null;
      if (!metrics) {
        console.warn(`[measure] no metrics for ${choice.id} (${choice.publishedUrl}) — will retry next tick`);
        failed++;
        continue;
      }
      await recordOutcome({ tenantId: choice.tenantId, choiceId: choice.id, platform, metrics });
      await db.choice.update({
        where: { id: choice.id },
        data: { measureCount: { increment: 1 }, lastMeasuredAt: new Date() },
      });
      measured++;
      console.log(`[measure] ${choice.id} reading #${choice.measureCount + 1}:`, JSON.stringify(metrics));
    } catch (e) {
      failed++;
      console.error(`[measure] failed for ${choice.id}:`, e instanceof Error ? e.message : e);
    }
  }

  return { measured, skipped, failed };
}

export function startMeasurer(): void {
  const interval = Math.max(1, TICK_MINUTES) * 60_000;
  setInterval(() => {
    measureTick().catch((e) => console.error("[measure] tick crashed:", e));
  }, interval);
  console.log(`[measure] scheduler started — every ${TICK_MINUTES}m, readings at +${DELAYS_HOURS.join("h, +")}h`);
}
