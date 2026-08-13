import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";
import { adminAuth, tenantAuth, generateApiKey, hashKey, type TenantEnv } from "../auth.js";

// Loose on purpose — the brand-context shape will evolve through Phase 1/2;
// the API contract stays stable while these fields grow.
const BrandContext = z
  .object({
    niche: z.enum(["news", "comedy", "devotional", "b2b", "human_interest"]).optional(),
    edge_weights: z.record(z.string(), z.number()).optional(),
    four_force_weights: z.record(z.string(), z.number()).optional(),
    terminal_motive: z.enum(["recognition", "belonging", "transcendence", "security"]).optional(),
    transgression_ceiling: z.number().min(0).max(1).optional(),
    register: z.string().optional(),
    risk_posture: z.enum(["low", "medium", "high"]).optional(),
    platform_fit_map: z.record(z.string(), z.unknown()).optional(),
  })
  .loose();

const CreateTenant = z.object({
  name: z.string().min(1).max(120),
  workspaceSlug: z.string().min(1).max(120),
  brandContext: BrandContext.default({}),
});

export const tenants = new Hono<TenantEnv>();

// Admin: register a brand. Returns the API key ONCE — only the hash is stored.
tenants.post("/", adminAuth, async (c) => {
  const parsed = CreateTenant.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: { code: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid body." } }, 400);
  }
  const { name, workspaceSlug, brandContext } = parsed.data;

  const existing = await db.tenant.findUnique({ where: { workspaceSlug } });
  if (existing) {
    return c.json({ error: { code: "conflict", message: `Tenant '${workspaceSlug}' already exists.` } }, 409);
  }

  const apiKey = generateApiKey();
  const tenant = await db.tenant.create({
    data: { name, workspaceSlug, brandContext: brandContext as Prisma.InputJsonValue, apiKeyHash: hashKey(apiKey) },
  });

  return c.json(
    {
      tenant: { id: tenant.id, name: tenant.name, workspaceSlug: tenant.workspaceSlug },
      apiKey, // shown once; store it in Daftar's credential for the HTTP node
    },
    201
  );
});

// Tenant: who am I + my brand context (also the auth smoke-test endpoint).
tenants.get("/me", tenantAuth, async (c) => {
  const t = c.get("tenant");
  return c.json({
    id: t.id,
    name: t.name,
    workspaceSlug: t.workspaceSlug,
    brandContext: t.brandContext,
    createdAt: t.createdAt,
  });
});

// Tenant: update own brand context (merge-replace, admin not required).
tenants.patch("/me", tenantAuth, async (c) => {
  const parsed = BrandContext.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: { code: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid body." } }, 400);
  }
  const t = c.get("tenant");
  const merged = { ...(t.brandContext as object), ...parsed.data };
  const updated = await db.tenant.update({
    where: { id: t.id },
    data: { brandContext: merged as Prisma.InputJsonValue },
  });
  return c.json({ id: updated.id, brandContext: updated.brandContext });
});
