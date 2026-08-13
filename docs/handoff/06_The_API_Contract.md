# 06 · THE API CONTRACT

Build to this. Yantri is a headless node behind a public API that DAFTAR calls. This file is the interface boundary — get it right and the internals can change freely behind it.

**Note on schemas below:** these are the *shape* and the required fields with their reasoning. Exact field names, types, and validation are yours to finalize during build — but do not drop a field without understanding why it's here (the "why" is inline).

---

## MULTI-TENANCY RULES (non-negotiable — this is N4)

1. **Stateless per call.** All brand context is passed in or referenced by ID. Nothing about a brand is hard-coded in Yantri.
2. **Per-tenant refs, not global.** Rasa corpus and emotion library are per-tenant references. Taste is NOT shared across brands — E-Sutra's exemplars must never influence The Squirrels' scoring.
3. **Per-tenant weights.** four_force_weights, terminal_motive, transgression ceiling, register — all per tenant. One engine, N worldviews.
4. **One deployment serves all brands.** Adding a client = adding a tenant context, not redeploying.

---

## ENDPOINT 1 — `POST /choose` (the main call)

### INGESTS
```json
{
  "tenant_id": "brand-uuid",
  "brand_context": {
    "authority_domain": "string — what this brand has earned the right to speak on",
    "four_force_weights": { "geo": 0.0, "culture": 0.0, "society": 0.0, "power": 0.0 },
    "terminal_motive": "recognition | belonging | transcendence | security",
    "transgression_ceiling": "never | rare | situational | frequent | core",
    "register": "string — the language/tone this brand wins in",
    "niche": "news | comedy | devotional | b2b | human_interest | ...",
    "risk_posture": "low | medium | high",
    "slot_grid": [ /* named recurring slots this brand commits to */ ],
    "rasa_corpus_ref": "ref — per-tenant taste memory",
    "emotion_library_ref": "ref — per-tenant emotion/situation library",
    "winning_formula_ref": "ref — per-tenant living formula",
    "platform_fit_map": { /* per-platform default + brand override, overridable */ }
  },
  "signals": [ /* Khabri output for this run */ ],
  "manual_intake": [ /* ground-input entries */ ],
  "mode": "auto | assist | manual",
  "proposed_topic": "string — only when mode=manual (human proposes, Yantri validates)",
  "hooks": {
    "research_hook": "gemini_node_endpoint — for step 3.5 deepening",
    "asset_hook": "peep_endpoint — for demand pull + assets"
  }
}
```

**Why each non-obvious field exists:**
- `four_force_weights` + `terminal_motive` — the Meaning layer is brand-specific; recognition-is-king inverts for devotional. Without these the four-force read mis-serves half the brands.
- `transgression_ceiling` — the BRAND_CEILING term in the headroom product. Without it the engine can't compute how far a brand may go.
- `niche` — selects the per-niche Edge weights. "Alive" means different things per niche (file 02).
- `mode` — dials autonomy. Default assist.
- `hooks` — Yantri calls out to Gemini/Peep only when needed; passing endpoints keeps Yantri decoupled from where those services live.

### EMITS — the Choice Object
```json
{
  "choice": {
    "topic": "string",
    "brand": "tenant_id",
    "platforms": ["youtube", "x", "blog", "meta", "linkedin"],
    "content_types": ["long_form", "carousel", "short_form", "tweet_thread"],
    "form": {
      "structure": "kishotenketsu | three_act | investigation | list",
      "dramatic_question": "string — the one unanswered question holding it",
      "character_entry": "string — the named person carrying the abstraction (mandatory for institutional topics)",
      "turn": "string — where the assumption breaks",
      "withhold": "string — what's disclosed late, if anything"
    },
    "emotion": { "primary": "string", "arousal": "high | low", "register": "string" },
    "archetype_id": "string",
    "slot": "which slot-grid slot this fills",
    "seo_brief": { /* for long_form: keywords, search-demand data from Peep */ }
  },
  "reasoning": {
    "edge": { "score": 0.0, "dimensions": {"angle":0,"nerve":0,"dare":0,"tension":0,"revelation":0}, "why": "string" },
    "evidence": { "score": 0.0, "why": "string" },
    "meaning": { "four_force": {"geo":0,"culture":0,"society":0,"power":0}, "why": "string" },
    "decay": { "half_life_class": "string", "current_value": 0.0 },
    "saturation": { "existing_tellings": 0, "penalty": 0.0 },
    "transgression": { "brand_ceiling": 0.0, "platform_appetite": 0.0, "moment_permission": 0.0, "headroom": 0.0, "moment_flag": true },
    "loop_agreement": "agree | cross",
    "confidence": 0.0
  },
  "verdict": "auto_approve | re_angle | escalate | hard_refuse",
  "kills": [ { "topic": "string", "reason": "string" } ],
  "human_review_required": true
}
```

**The `reasoning` block is mandatory on every emit (N6).** Never emit a bare score. `kills` is not decoration — it is training data (organ 4). `verdict` tells DAFTAR whether to auto-run, hold for human, re-angle, or drop.

---

## ENDPOINT 2 — `POST /outcome` (closes the loop — this is what makes it learn)

DAFTAR/Relay calls this after publishing to report what happened.
```json
{
  "tenant_id": "brand-uuid",
  "choice_id": "ref to the emitted choice",
  "outcome": {
    "returning_viewer_rate": 0.0,
    "retention_curve_shape": "flat | cliff | ...",
    "list_growth_attributed": 0,
    "member_conversions": 0,
    "raw_views": 0,
    "outlier_multiple": 0.0
  }
}
```
**Why this endpoint is as important as `/choose`:** without `/outcome`, there is no medium loop, no learning, and you've built v2.0. This is not optional. Build it at the same time as `/choose`.

---

## ENDPOINT 3 — `POST /kill-check` (organ 4, counterfactual)

Reports whether a previously-killed topic performed elsewhere.
```json
{ "tenant_id": "...", "killed_topic_ref": "...", "blew_up_elsewhere": true, "where": "string" }
```
May be fed manually at first (file 08). Still build the endpoint so the data has a home from day one.

---

## ENDPOINT 4 — `GET/POST /formula` (the slow loop, human-owned)

- `GET` → Yantri's current *proposed* Winning Formula for a tenant (drafted from Ledger).
- `POST` → Lavanya's approved/edited version (versioned).

This is where the slow loop lives. Yantri proposes; a human commits. Track formula drift (file 04 §Winning Formula).

---

## VERSIONING

Version the contract from v1.0.0. The internals (weights, models) will change constantly; the *contract* should be stable so DAFTAR doesn't break every time scoring is tuned. Breaking changes to the schema get a major-version bump and a migration note.
