/**
 * LLM provider layer. One job: turn (tenant, topic, context) into a TopicRead.
 *
 * Three providers, selected via LLM_PROVIDER (default: gemini if a key is set,
 * else stub):
 * - gemini  — Google AI Studio. Flash models have a FREE TIER (rate-limited,
 *             no billing); Yantri's volume fits inside it.
 * - ollama  — a local model (http://127.0.0.1:11434), zero cost, offline.
 * - stub    — deterministic pseudo-scores for PLUMBING TESTS ONLY. Every stub
 *             result is loudly labeled; stub choices must never be treated as
 *             real judgments.
 *
 * Detection only — every gate that ACTS on a read lives in scorer.ts.
 */
import { createHash } from "node:crypto";
import { GoogleGenAI, Type } from "@google/genai";
import type { Tenant } from "../generated/prisma/client.js";

export type TopicRead = {
  angle: string;
  edge: { angle: number; nerve: number; dare: number; tension: number; revelation: number };
  meaning: { geo: number; culture: number; society: number; power: number };
  emotion: { primary: string; arousal: "high" | "low" };
  form: "single_tweet" | "thread" | "long_form" | "carousel" | "short_form";
  secondary_forms: ("single_tweet" | "thread" | "long_form" | "carousel" | "short_form")[];
  harm: {
    protected_groups: boolean;
    obscenity_for_shock: boolean;
    incitement: boolean;
    india_legal: boolean;
  };
  harm_reason: string;
  reangle_suggestion: string;
  why: string;
};

export type Provider = "gemini" | "ollama" | "stub";

export function provider(): Provider {
  const p = process.env.LLM_PROVIDER;
  if (p === "gemini" || p === "ollama" || p === "stub") return p;
  return process.env.GEMINI_API_KEY ? "gemini" : "stub";
}

/** Label stored in every choice's reasoning — data hygiene for the ledger. */
export function scoredBy(): string {
  switch (provider()) {
    case "gemini":
      return `gemini/${GEMINI_MODEL}`;
    case "ollama":
      return `ollama/${OLLAMA_MODEL}`;
    case "stub":
      return "stub";
  }
}

export function llmAvailable(): boolean {
  return provider() !== "gemini" || Boolean(process.env.GEMINI_API_KEY);
}

/* ─── Shared prompt ──────────────────────────────────────────────────── */

function prompt(tenant: Tenant, topic: string, context: string | undefined): string {
  const bc = tenant.brandContext as Record<string, unknown>;
  return `You score candidate topics for a media brand. You do NOT judge whether a topic is worthy or important — you judge whether it is ALIVE: does it have a telling that grips, touches a real nerve, shows something the sanitized version hides?

BRAND
- Name: ${tenant.name}
- Niche: ${bc.niche ?? "unknown"}
- Register: ${bc.register ?? "unspecified"}
- Terminal motive of its audience: ${bc.terminal_motive ?? "recognition"}

TOPIC
"${topic}"
${context ? `\nRESEARCH CONTEXT (signals, search results — may be partial):\n${context.slice(0, 6000)}` : ""}

SCORE 0–100 on each Edge dimension:
- angle: is there a telling nobody else is using?
- nerve: does it touch a real tension / taboo / the-thing-nobody-says?
- dare: is there cost/risk in the telling, and is that part of why it lands?
- tension: an unresolved pull (curiosity gap, violated expectation, stakes)?
- revelation: does it show what the sanitized version hides?

SCORE 0–100 on each Meaning force for THIS brand's audience:
- geo: whose material stake is touched (resources, boundaries, livelihoods)
- culture: identity/belief/memory resonance
- society: recognition/status/belonging available in engaging with it
- power: who gains/loses if this is said; the stakes and risk

Also read: the primary emotion + arousal (high-arousal spreads; low does not), the best-fit PRIMARY form, plus secondary_forms — every OTHER content type this topic would also carry well (a strong topic often works as thread AND short-form AND carousel; a thin one is single-format — return an empty list then). Do not pad: only forms the topic genuinely suits. And a survivable re-angle (how to keep the nerve but lose the danger — implication, satire, let-the-subject-speak, show-don't-say). If the topic is dead, say so in "why" and score edge low — do not invent an angle.

HARM FLAGS — set true ONLY when the telling inherently requires the harm, never because a topic is merely sensitive or critical:
- protected_groups: the content DEMEANS a protected group (incl. disability) — not merely mentions or concerns one.
- obscenity_for_shock: obscenity is the point of the content, not incidental.
- incitement: calls for or glorifies violence/hatred.
- india_legal: ACUTE exposure only — publishing unverified defamatory allegations against named private persons, communal incitement, or contempt of court. Critical reporting on public institutions, policies, official data, or systemic failures is normal journalism and is NOT legal exposure.
If you set any flag true, state exactly why in harm_reason; otherwise leave harm_reason empty.

Be blunt. Most topics are NOT alive. A worthy-but-dead topic scores under 35 on edge.`;
}

function clamp(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function normalize(parsed: TopicRead): TopicRead {
  for (const k of ["angle", "nerve", "dare", "tension", "revelation"] as const) parsed.edge[k] = clamp(parsed.edge[k]);
  for (const k of ["geo", "culture", "society", "power"] as const) parsed.meaning[k] = clamp(parsed.meaning[k]);
  for (const k of ["protected_groups", "obscenity_for_shock", "incitement", "india_legal"] as const)
    parsed.harm[k] = parsed.harm[k] === true;
  if (parsed.emotion.arousal !== "high" && parsed.emotion.arousal !== "low") parsed.emotion.arousal = "low";
  if (typeof parsed.harm_reason !== "string") parsed.harm_reason = "";
  const FORMS = ["single_tweet", "thread", "long_form", "carousel", "short_form"];
  parsed.secondary_forms = (Array.isArray(parsed.secondary_forms) ? parsed.secondary_forms : [])
    .filter((f) => FORMS.includes(f) && f !== parsed.form) as TopicRead["secondary_forms"];
  return parsed;
}

/* ─── Provider: Gemini ───────────────────────────────────────────────── */

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";

let _gemini: GoogleGenAI | null | undefined;
function gemini(): GoogleGenAI | null {
  if (_gemini !== undefined) return _gemini;
  const key = process.env.GEMINI_API_KEY;
  _gemini = key ? new GoogleGenAI({ apiKey: key, httpOptions: { timeout: 60_000 } }) : null;
  return _gemini;
}

const GEMINI_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    angle: { type: Type.STRING, description: "The single most ALIVE telling of this topic, one line. Empty string if there is none." },
    edge: {
      type: Type.OBJECT,
      properties: {
        angle: { type: Type.NUMBER }, nerve: { type: Type.NUMBER }, dare: { type: Type.NUMBER },
        tension: { type: Type.NUMBER }, revelation: { type: Type.NUMBER },
      },
      required: ["angle", "nerve", "dare", "tension", "revelation"],
    },
    meaning: {
      type: Type.OBJECT,
      properties: {
        geo: { type: Type.NUMBER }, culture: { type: Type.NUMBER },
        society: { type: Type.NUMBER }, power: { type: Type.NUMBER },
      },
      required: ["geo", "culture", "society", "power"],
    },
    emotion: {
      type: Type.OBJECT,
      properties: { primary: { type: Type.STRING }, arousal: { type: Type.STRING, enum: ["high", "low"] } },
      required: ["primary", "arousal"],
    },
    form: { type: Type.STRING, enum: ["single_tweet", "thread", "long_form", "carousel", "short_form"] },
    secondary_forms: {
      type: Type.ARRAY,
      items: { type: Type.STRING, enum: ["single_tweet", "thread", "long_form", "carousel", "short_form"] },
      description: "Other content types this topic would ALSO carry well. Empty if single-format.",
    },
    harm: {
      type: Type.OBJECT,
      properties: {
        protected_groups: { type: Type.BOOLEAN }, obscenity_for_shock: { type: Type.BOOLEAN },
        incitement: { type: Type.BOOLEAN }, india_legal: { type: Type.BOOLEAN },
      },
      required: ["protected_groups", "obscenity_for_shock", "incitement", "india_legal"],
    },
    harm_reason: { type: Type.STRING, description: "Required justification if any harm flag is true; empty otherwise." },
    reangle_suggestion: { type: Type.STRING },
    why: { type: Type.STRING, description: "Two sentences max: why this scores the way it does." },
  },
  required: ["angle", "edge", "meaning", "emotion", "form", "secondary_forms", "harm", "harm_reason", "reangle_suggestion", "why"],
} as const;

async function readViaGemini(tenant: Tenant, topic: string, context?: string): Promise<TopicRead> {
  const ai = gemini();
  if (!ai) throw new Error("GEMINI_API_KEY not configured");

  const call = () =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt(tenant, topic, context),
      config: { responseMimeType: "application/json", responseSchema: GEMINI_SCHEMA, temperature: 0.4 },
    });

  let res;
  try {
    res = await call();
  } catch (e) {
    // Free-tier keys are rate-limited (RPM) — one patient retry covers most 429s.
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("429") && !msg.toLowerCase().includes("resource_exhausted")) throw e;
    await new Promise((r) => setTimeout(r, 15_000));
    res = await call();
  }
  return normalize(JSON.parse(res.text ?? "{}") as TopicRead);
}

/* ─── Provider: Ollama (local, free, offline) ────────────────────────── */

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b";

/** Standard JSON schema (Ollama's `format` field) mirroring GEMINI_SCHEMA. */
const OLLAMA_SCHEMA = {
  type: "object",
  properties: {
    angle: { type: "string" },
    edge: {
      type: "object",
      properties: {
        angle: { type: "number" }, nerve: { type: "number" }, dare: { type: "number" },
        tension: { type: "number" }, revelation: { type: "number" },
      },
      required: ["angle", "nerve", "dare", "tension", "revelation"],
    },
    meaning: {
      type: "object",
      properties: { geo: { type: "number" }, culture: { type: "number" }, society: { type: "number" }, power: { type: "number" } },
      required: ["geo", "culture", "society", "power"],
    },
    emotion: {
      type: "object",
      properties: { primary: { type: "string" }, arousal: { type: "string", enum: ["high", "low"] } },
      required: ["primary", "arousal"],
    },
    form: { type: "string", enum: ["single_tweet", "thread", "long_form", "carousel", "short_form"] },
    secondary_forms: { type: "array", items: { type: "string", enum: ["single_tweet", "thread", "long_form", "carousel", "short_form"] } },
    harm: {
      type: "object",
      properties: {
        protected_groups: { type: "boolean" }, obscenity_for_shock: { type: "boolean" },
        incitement: { type: "boolean" }, india_legal: { type: "boolean" },
      },
      required: ["protected_groups", "obscenity_for_shock", "incitement", "india_legal"],
    },
    harm_reason: { type: "string" },
    reangle_suggestion: { type: "string" },
    why: { type: "string" },
  },
  required: ["angle", "edge", "meaning", "emotion", "form", "secondary_forms", "harm", "harm_reason", "reangle_suggestion", "why"],
};

async function readViaOllama(tenant: Tenant, topic: string, context?: string): Promise<TopicRead> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: "user", content: prompt(tenant, topic, context) }],
      format: OLLAMA_SCHEMA,
      stream: false,
      options: { temperature: 0.4 },
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { message?: { content?: string } };
  return normalize(JSON.parse(data.message?.content ?? "{}") as TopicRead);
}

/* ─── Provider: stub (plumbing tests ONLY — loudly labeled) ──────────── */

function readViaStub(topic: string): TopicRead {
  // Deterministic per topic so workflow tests are repeatable.
  const seed = createHash("sha256").update(topic).digest();
  const dim = (i: number) => 20 + (seed[i] % 71); // 20–90
  return {
    angle: `[STUB — NOT A REAL READ] deterministic test angle for: ${topic.slice(0, 80)}`,
    edge: { angle: dim(0), nerve: dim(1), dare: dim(2), tension: dim(3), revelation: dim(4) },
    meaning: { geo: dim(5), culture: dim(6), society: dim(7), power: dim(8) },
    emotion: { primary: "none (stub)", arousal: "low" },
    form: "single_tweet",
    secondary_forms: [],
    harm: { protected_groups: false, obscenity_for_shock: false, incitement: false, india_legal: false },
    harm_reason: "",
    reangle_suggestion: "[STUB] no real suggestion — plumbing test only",
    why: "[STUB SCORING] This is a deterministic pseudo-score for pipeline testing. It is not a judgment about the topic.",
  };
}

/* ─── Entry point ────────────────────────────────────────────────────── */

export async function readTopic(tenant: Tenant, topic: string, context?: string): Promise<TopicRead> {
  switch (provider()) {
    case "gemini":
      return readViaGemini(tenant, topic, context);
    case "ollama":
      return readViaOllama(tenant, topic, context);
    case "stub":
      return readViaStub(topic);
  }
}
