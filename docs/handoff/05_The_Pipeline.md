# 05 · THE PIPELINE — STEP BY STEP

The full flow, in order. Each step names its inputs, its output, and which external tool (if any) it calls. Build the pipeline as discrete, testable steps — not one monolith.

---

## THE INTAKE HALF (deciding the topic)

### [0] BRAND CONTEXT LOAD
Load the tenant's context: four-force weights, terminal_motive, transgression ceiling, register, risk posture, slot grid, Rasa corpus ref, emotion library ref, Winning Formula.
- **Input:** tenant_id
- **Output:** brand context object
- **Tool:** none (from DAFTAR's tenant store)
- **Why first:** every downstream score depends on whose brand this is. Nothing is brand-agnostic below this line.

### [1] SIGNAL + MANUAL INTAKE
Pull Khabri's trend signals AND the manual ground-input queue.
- **Input:** Khabri feed, manual intake entries
- **Output:** raw candidate pool
- **Tool:** Khabri (signals). Manual intake is a DAFTAR form (see file 07).
- **Why both:** Khabri sees scraped news. It is blind to what comments keep asking, what people forward on WhatsApp, what a client said, what's happening on the ground. Manual intake is the *higher-value* input, not a fallback. It also has an EXPIRY field so stale entries auto-archive.

### [2] MERGE · DEDUPE · CLUSTER
Collapse duplicate signals into distinct stories. (30 signals is often ~12 stories.)
- **Input:** raw candidate pool
- **Output:** clustered distinct topics
- **Tool:** none
- **Why:** staffing/scoring against signal-count instead of story-count is wasted effort. Five headlines about one event are one decision.

### [3] EDGE READ — is it alive? (LOOP C, FIRST)
Score each clustered topic on the five Edge dimensions, weighted for this niche.
- **Output:** edge score + which dimensions carry it
- **Tool:** none (may trigger step 3.5 if thin)
- **Why first:** the alive story leads. Worthy-but-dead topics score near zero here and are cheap to drop before spending on research.

### [3.5] DEEPEN — optional, only if thin
If a topic is promising but under-substantiated, enrich it.
- **Input:** the thin topic
- **Output:** enriched topic
- **Tool:** **Gemini node (research)** + **Peep (demand/search pull)**
- **Why gated:** research costs API money. Most topics score on what Khabri already gives. Only promising-but-thin ones get enriched. Do not call Gemini/Peep on every candidate.

### [4] EVIDENCE + MEANING — will it work / what does it mean (LOOPS A + B)
Score the constraints. Evidence from research + own Ledger. Meaning from the four-force read.
- **Output:** evidence score, meaning score, loop-agreement flag
- **Tool:** none (reads memory core + Peep data from 3.5)

### [5] DECAY + SATURATION WRAP
Apply the clock and the crowding penalty to the scores.
- **Output:** time-adjusted, saturation-adjusted scores
- **Tool:** none (reads market/own-brand telling counts)
- **Why here:** a topic's raw score means nothing without knowing how fresh and how crowded it is.

### [6] TRANSGRESSION HEADROOM
Compute brand_ceiling × platform_appetite × moment_permission per candidate.
- **Output:** headroom value + moment-flag if uncertain
- **Tool:** none

### [7] DARE GATE (+ confidence + hard-refusal)
Produce the verdict: auto-approve / re-angle / escalate / hard-refuse. Attach confidence.
- **Output:** verdict per topic; survivors become choices; rejects go to Kill Log
- **Tool:** none
- **Why:** this is where the engine decides AND where it records what it rejected and why (organ 4).

### [8] DEMAND + SEO VALIDATION (present-time life check)
For surviving choices, confirm the topic still has live demand right now.
- **Input:** the choice
- **Output:** demand verdict; SEO brief for long-form
- **Tool:** **Peep** (search demand, cross-platform trend, SERP/AI-search check)
- **Why a gate not a generator:** a topic can pass edge + evidence + meaning and still be dead in present-time search. This kills stale topics. **If Peep can't pull these signals yet, this gate is blind — see file 08.**

### [9] FORM + EMOTION ASSIGN
Attach the telling: dramatic question, structure (kishotenketsu for non-antagonist/devotional/culture; three-act for investigations), character-entry (mandatory for institutional topics), primary emotion + register.
- **Output:** the form block on the choice
- **Tool:** none (reads emotion library)

### [10] PLATFORM FAN-OUT + CONTENT-TYPE ROUTING
Decide which platforms and which content types (blog / carousel / short / tweet-thread), using the brand's overridable platform-fit map.
- **Output:** the platforms + content-types on the choice
- **Tool:** none

### [11] EMIT CHOICE OBJECT
Serialize the full choice + reasoning + kills + confidence + human_review flag.
- **Output:** the Choice Object (schema in file 06) → DAFTAR
- **Tool:** none

---

## THE OUTPUT HALF (executing the choice — DAFTAR-side, file 07 details)

### [12] DAFTAR ROUTER
Read the Choice Object's `platforms` + `content_types`. Split into parallel tracks.

### [13] PER-TRACK EXECUTION (parallel)
- **Long-form** → Gemini writes against the SEO brief → Peep images → **Vritti** (CMS draft).
- **Carousel** → **Chitra** carousel node (12 templates, brand kits) ← Gemini slide copy + Peep imagery.
- **Short-form** → **Chitra** reel node (7 templates) ← the form block's dramatic question/turn.
- **Tweet/thread** → **Twitter workflow** ← Gemini drafts + Peep images.
- **Shared service layer:** Peep + Gemini sit UNDER all four tracks. Build that integration once, not per-track.

### [14] RELAY — single publish layer
Everything converges on **Relay** for platform + timing + cadence. Nothing self-publishes. One door out.

### [15] MEASURE → MEMORY
Outcomes (returning-viewer, retention shape, list growth, conversions) return through Relay's measurement to Yantri's Ledger. This closes the loop and feeds organ 1.

---

## THE THREE MODES (how autonomy is dialed)

Same pipeline, three levels — set per brand, per workflow:
- **auto** — loops agree + high confidence → emit straight to DAFTAR, no human.
- **assist** — emit choice + reasoning, wait for human confirm. **Default while trust is being built.**
- **manual** — human proposes the topic; Yantri only runs scoring/form/emotion on it (validation, not generation).

Dial from assist → auto per brand as the Ledger proves the loops.
