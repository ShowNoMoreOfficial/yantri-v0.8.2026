# YANTRI — BUILD PLAN

A simple REST API. Not an application. No front end, no publish layer, no orchestration.
Daftar's workflow canvas calls it through the existing **HTTP Request node**; everything
else (intake, execution, publishing, human approval) already exists in Daftar.

> Yantri scores topics for whether they are ALIVE, computes how far a brand can push
> edge right now, emits an auditable verdict, and learns from outcomes reported back.

Full reasoning behind the design: `docs/handoff/` (files 00–10).

---

## DECISIONS ALREADY MADE (do not re-open)

| # | Decision | Why |
|---|---|---|
| D1 | **API only.** One process, a handful of endpoints, JSON in/out. | Daftar is the app. Yantri is a brain behind an endpoint. |
| D2 | **No Relay.** Daftar workflows post directly (X, YouTube, Gather nodes exist and run). | Custom workflows made a separate publish app redundant. |
| D3 | **No big Ledger store.** Daftar workspace content IS the ledger. Yantri keeps only its own emitted choices + reported outcomes — a scoring index, not a content store. | Daftar stays the single source of truth. |
| D4 | **Tenant = Daftar workspace.** Brand context is registered once per tenant, not passed in full on every call. | The HTTP node templates a JSON body; a 40-field brand context per call is unusable from the canvas. |
| D5 | **Assist mode via status fields.** Yantri writes scores/verdicts onto entity rows; humans approve by flipping Status — the exact pattern already used 245+ times in Twitter (Generate). | The trust mechanism already exists. Don't invent a new one. |
| D6 | **Hard refusal is code, not config** (protected groups, obscenity-for-shock, incitement, IT-Rules/BNS exposure). No tenant setting can raise it. | Handoff N7. Non-negotiable. |

---

## STACK

- **TypeScript + Hono** (tiny router, native `fetch`-style handlers) on Node — one small service
- **Prisma + Postgres 16** — new `yantri` database on the existing VPS cluster
- **Gemini** (`gemini-3-flash-preview`, same as Daftar's nodes) for the LLM-scored parts; all gates/math deterministic in code
- **Deploy:** PM2 (`yantri`) behind Caddy on the ShowNoMore VPS, like every other app
- **Auth:** one bearer API key per tenant (`yantri_live_*`), stored hashed

---

## DATA MODEL (3 tables — that's the whole database)

```
Tenant     id · workspaceSlug · apiKeyHash · brandContext JSONB · createdAt
           brandContext = { niche, edge_weights, four_force_weights, terminal_motive,
                            transgression_ceiling, register, risk_posture, platform_fit_map }

Choice     id · tenantId · topic · scores JSONB · reasoning JSONB · verdict
           · confidence · killed BOOLEAN · killReason · daftarEntityId · createdAt
           (every emit — approved or killed. killed=true rows ARE the Kill Log.)

Outcome    id · choiceId · platform · metrics JSONB · outlierMultiple · reportedAt
           (what came back through /outcome. This is what the weights learn from.)
```

No Rasa table, no Formula table in v1 — Rasa rides on Daftar's existing pgvector
embeddings; the Winning Formula starts life as a Gather document (Phase 3).

---

## API CONTRACT (v1)

All endpoints under `/v08.2026`, bearer auth, JSON. **Responses must stay compact:**
Daftar's HTTP node truncates response bodies at **2000 chars** — the default response
is the short form; full reasoning is always retrievable by ID.

### `POST /v08.2026/score` — score ONE topic (the workhorse)
The manual-mode call. A workflow passes one topic (an entity row title + optional
research context); Yantri scores it and returns the verdict.

```json
// request
{ "topic": "{{entity.title}}",
  "context": "{{data.khabri-search-signals.summary}}",   // optional, anything helps
  "platform": "x" }

// response (compact, < 2000 chars, flat — easy for the code node)
{ "choiceId": "ch_...", "verdict": "approve | re_angle | escalate | refuse",
  "edge": 78, "evidence": 61, "meaning": 70, "headroom": 0.4, "confidence": 0.35,
  "angle": "the one-line living angle Yantri sees",
  "why": "two sentences max",
  "flags": ["moment_check"] }
```

### `POST /v08.2026/choose` — rank MANY candidates
Same scoring, run over a batch (e.g. Khabri top-trends output piped straight in).
Returns top N compactly; everything scored (including kills) is stored.

```json
// request
{ "candidates": [ { "topic": "...", "source": "khabri", "signal": {...} } ], "top": 5 }
// response
{ "runId": "...", "chosen": [ { "choiceId": "...", "topic": "...", "verdict": "...",
    "edge": 0, "angle": "...", "form": "thread", "platforms": ["x"] } ],
  "killed": 7 }
```

### `POST /v08.2026/outcome` — the feedback loop (as important as /score)
Called by a scheduled Daftar workflow after metrics are fetched (T+48h / T+7d).

```json
{ "choiceId": "ch_...", "platform": "x",
  "metrics": { "views": 0, "likes": 0, "reposts": 0 } }
// Yantri computes outlierMultiple vs the tenant's own trailing baseline and stores it.
```

### `GET /v08.2026/choices/:id` — full auditable reasoning (N6)
Everything: all five edge dimensions, four-force read, headroom terms, what was
killed and why. No size limit — this is for humans and logs, not the canvas.

### `GET /v08.2026/tenants/me/baseline` — the tenant's trailing performance baseline
(avg views/engagement last 20 outcomes per platform). Used by dashboards and sanity checks.

### `POST /v08.2026/tenants` (admin) — register a tenant + brand context. Adding a brand
is one API call, zero deploys.

Contract is date-versioned: the path prefix is `/v08.2026`. Internals change freely
behind it; a breaking schema change gets a new date prefix (e.g. `/v01.2027`) with
the old one kept alive during migration.

---

## SCORING — crude first, real later (the cold-start rule)

**v1 (Phase 1) — one honest Gemini call + hard code gates.**
One structured-output prompt scores the five Edge dimensions + a meaning read against
the tenant's `brandContext`. Evidence = neutral 50 (the ledger is empty — say so via
low `confidence`, don't fake it). Headroom = `ceiling × platform_appetite` from the
handoff's table values, moment always flagged for humans. Hard-refusal check runs in
code BEFORE and AFTER the LLM. Verdict logic per handoff file 04.

**v2 (Phase 2) — outcomes start bending the scores.**
Once ~15–20 outcomes per tenant exist: evidence scored vs own baseline
(outlier-multiple logic), per-niche edge weights tuned from what actually performed,
decay half-lives applied, saturation via similarity search against recent choices,
confidence = f(relevant outcome count, loop agreement).

**Never in any version:** predicting virality, auto mode before the outcome data
exists, a configurable harm boundary.

---

## HOW IT PLUGS INTO DAFTAR (no Daftar code changes needed)

Everything uses nodes that already exist: `schedule` / `entity.field-changed` /
`webhook` triggers, `khabri-top-trends`, `http-request`, `code` (parse Yantri's JSON),
`if-condition`, `create-entity`, `update-field`, `send-chat`.

### Workflow 1 — "Yantri Propose" (daily, per brand)

```
                 ┌─────────────────────────── DAFTAR WORKFLOW CANVAS ───────────────────────────┐
                 │                                                                              │
  ┌──────────┐   │  ┌──────────────────┐    ┌───────────────────┐    ┌──────────────────────┐   │
  │ Schedule │───┼─▶│ khabri-top-trends │──▶│ http-request      │──▶│ code                  │   │
  │ (daily)  │   │  │ (signals for the  │    │ POST yantri       │    │ parse JSON body,     │   │
  └──────────┘   │  │  brand's beats)   │    │ /v08.2026/choose  │    │ split chosen topics  │   │
                 │  └──────────────────┘    └───────────────────┘    └──────────┬───────────┘   │
                 │                                                              │               │
                 │                                       ┌──────────────────────▼────────────┐  │
                 │                                       │ create-entity  (one row per pick) │  │
                 │                                       │ Twitter DB · Status = "Proposed"  │  │
                 │                                       │ fields: angle, edge, verdict,     │  │
                 │                                       │         choiceId, why             │  │
                 │                                       └──────────────────────┬────────────┘  │
                 │                                                              │               │
                 │                                       ┌──────────────────────▼────────────┐  │
                 │                                       │ send-chat: "5 topics proposed,    │  │
                 │                                       │ 7 killed — review the board"      │  │
                 │                                       └───────────────────────────────────┘  │
                 └──────────────────────────────────────────────────────────────────────────────┘
                                                                 │
                                              HUMAN on the board │ flips Status → In Progress
                                                                 ▼
                                    ┌────────────────────────────────────────────┐
                                    │  EXISTING "Twitter (Generate)" workflow    │
                                    │  research → Gemini writes → images → Done  │
                                    │  human approves → "Twitter (Delivery)"     │
                                    │  posts the thread to X                     │
                                    └────────────────────────────────────────────┘
```

### Workflow 2 — "Yantri Measure" (the loop-closer; without this it's v2.0 again)

```
  ┌──────────┐    ┌────────────────────┐    ┌──────────────────────┐    ┌────────────────────┐
  │ Schedule │───▶│ find rows Posted    │───▶│ fetch platform       │───▶│ http-request       │
  │ (daily)  │    │ ≥48h ago, not yet   │    │ metrics (X API /     │    │ POST yantri        │
  └──────────┘    │ measured            │    │ YouTube API / GA)    │    │ /v08.2026/outcome  │
                  └────────────────────┘    └──────────┬───────────┘    └─────────┬──────────┘
                                                       │                          │
                                            ┌──────────▼───────────┐   ┌──────────▼──────────┐
                                            │ update-field: write  │   │ Yantri: computes    │
                                            │ views/likes onto the │   │ outlier multiple,   │
                                            │ entity row (ledger!) │   │ retunes weights     │
                                            └──────────────────────┘   │ (Phase 2)           │
                                                                       └─────────────────────┘
```

### Workflow 1 — SCOPED FOR LATER (design settled 2026-08-14, not yet built)

Findings from the Daftar engine that shape the build:
- `create-entity` creates ONE row per node execution; the engine does not loop
  nodes over item arrays. A single workflow run cannot cleanly fan out N chosen
  topics into N rows.
- **The clean fan-out is Daftar's per-workflow webhook**: `POST
  /api/webhooks/wf/{workflowId}` fires one run per call, payload lands in the
  run as `input.*` / webhookPayload, optional HMAC signing supported, no auth
  needed beyond the workflow id (+ hmacSecret in trigger config).

Settled design, two pieces:
1. **Yantri change (small):** `/choose` accepts an optional `callback_url`
   (+ optional `callback_secret` for HMAC). After scoring, Yantri POSTs each
   chosen topic (compact: topic, choiceId, verdict, edge, angle, why, flags,
   form, source) to the callback — one POST per chosen topic. This is the
   handoff's own shape: Yantri emits choices TO Daftar; Daftar routes.
2. **Daftar canvas (two workflows):**
   - "Yantri Propose (Daily)": schedule trigger → `khabri-top-trends` → code
     (build /choose payload from trends) → http-request → done.
     Khabri appears ONLY here — signals intake, never research.
   - "Yantri Receive Proposal": webhook trigger → `create-entity` into
     Yantri Proposals (values from the webhook payload, Status = Proposed).
     One webhook call = one proposal row.

### Workflow 3 — "Score On Demand" (manual mode, cheapest possible start)
`entity.field-changed (Status → "Score It")` → `http-request POST /v08.2026/score` →
`code` → `update-field` (verdict/edge/why onto the row). A human typed the topic;
Yantri only judges it. **This one workflow alone starts filling the Choice table.**

### Canvas constraints found in the Daftar code (build to these)
- `http-request` response = `{ status, body }`, body **text, max 2000 chars** → compact default responses, details behind `GET /choices/:id`.
- `code` node sandbox receives `data / trigger / fields / entity` → JSON.parse of Yantri's body happens there.
- `webhook` trigger exists → Yantri never needs to poll Daftar; anything async can fire a workflow.

---

## BUILD PHASES (handoff file 08 order, shrunk to fit reality)

**Phase 0 — skeleton + tables** *(days)* ✅ built & verified locally (2026-08-14)
Repo scaffold (yarn), Prisma schema (3 tables), auth middleware, `POST /v08.2026/tenants`,
`GET/PATCH /v08.2026/tenants/me`, health check. Local dev DB via Docker (port 5435).
VPS deploy (PM2, localhost-bound — Daftar calls same-box) happens after Phase 1
works locally. Register The Squirrels as tenant 1 at deploy time.

**Phase 1 — score + outcome, crude, assist only** ✅ API built & live-tested locally (2026-08-14); canvas workflows + VPS deploy pending
`/v08.2026/score`, `/v08.2026/choose` (v1 scoring: one Gemini call + code gates + hard refusal),
`/v08.2026/outcome` with baseline math, `GET /choices/:id`.
Build Workflows 1–3 on the canvas for The Squirrels. Run in assist. **Goal of this
phase is not good choices — it's outcome rows accumulating.**

**Phase 2 — the scoring gets real** *(after ~15–20 outcomes/tenant)*
Evidence vs own baseline, tuned edge weights, decay, saturation (via embeddings),
confidence. Add Breaking Tube (YouTube metrics are the richest — measure workflow
first). Weekly retune job.

**Phase 3 — slow loop**
Winning Formula proposal (`GET/POST /v08.2026/formula`) drafted from outcomes, Lavanya
edits; kill-check fed manually ("did anything we killed blow up elsewhere?" — a
weekly human note, an endpoint from day one, automation never assumed).

**Rule that survives every phase:** 8–12 weeks assist-only. No auto verdicts until a
tenant's outcome data proves the loops. (Verdict `approve` still lands as a
"Proposed" row a human flips — auto mode is a Phase 2+ per-tenant switch.)

---

## OPEN PROBLEMS (flagged, not faked)

1. **X metrics access** — API read tiers are limited/paid. Fallback: Peep scrapes the
   tweet's public page. Decide during Phase 1's measure workflow.
2. **Moment permission** — not machine-readable. Always emitted as a flag, never a score.
3. **Search-demand gate** — Peep has `/v08.2026/search` but no keyword-volume pull yet.
   The demand gate ships blind-off (skipped) until Peep grows the capability.
4. **Half-lives & saturation windows** — start as hand-set guesses in `brandContext`,
   corrected by outcomes.
