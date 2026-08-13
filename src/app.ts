import { Hono } from "hono";
import { logger } from "hono/logger";
import { db } from "./db.js";
import { tenants } from "./routes/tenants.js";
import { score } from "./routes/score.js";
import { outcome } from "./routes/outcome.js";

export const CONTRACT_VERSION = "08.2026";

export const app = new Hono();

app.use("*", logger());

app.get("/health", async (c) => {
  let dbOk = true;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }
  return c.json({ ok: dbOk, service: "yantri", contract: CONTRACT_VERSION }, dbOk ? 200 : 503);
});

app.route("/v08.2026/tenants", tenants);
app.route("/v08.2026", score);
app.route("/v08.2026", outcome);

app.notFound((c) => c.json({ error: { code: "not_found", message: "No such endpoint." } }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: { code: "internal", message: "Internal error." } }, 500);
});
