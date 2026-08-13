import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Context, Next } from "hono";
import type { Tenant } from "./generated/prisma/client.js";
import { db } from "./db.js";

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): string {
  return `yantri_live_${randomBytes(24).toString("hex")}`;
}

function bearerToken(c: Context): string | null {
  const header = c.req.header("Authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Admin-only routes (tenant management). Key comes from ADMIN_API_KEY env. */
export async function adminAuth(c: Context, next: Next) {
  const adminKey = process.env.ADMIN_API_KEY;
  const token = bearerToken(c);
  if (!adminKey || !token || !safeEqual(token, adminKey)) {
    return c.json({ error: { code: "unauthorized", message: "Valid admin bearer key required." } }, 401);
  }
  await next();
}

/** Tenant routes. Resolves the bearer key to a Tenant and stashes it on context. */
export async function tenantAuth(c: Context, next: Next) {
  const token = bearerToken(c);
  if (!token || !token.startsWith("yantri_live_")) {
    return c.json({ error: { code: "unauthorized", message: "Tenant bearer key required." } }, 401);
  }
  const tenant = await db.tenant.findUnique({ where: { apiKeyHash: hashKey(token) } });
  if (!tenant) {
    return c.json({ error: { code: "unauthorized", message: "Unknown API key." } }, 401);
  }
  c.set("tenant", tenant);
  await next();
}

export type TenantEnv = { Variables: { tenant: Tenant } };
