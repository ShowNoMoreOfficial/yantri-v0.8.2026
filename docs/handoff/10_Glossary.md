# 10 · GLOSSARY

Every term used in this pack, defined once. If a term appears anywhere in files 00–09 and you're unsure, it's here.

---

## THE ENGINE & ITS PARTS

**Yantri** — the topic-choice engine. A multi-tenant decision node with a public API, called by DAFTAR. Decides *what* to make; never makes or publishes it.

**Node-first, app-later** — Yantri is built now as a headless API node. An independent front end and standalone features come later, explicitly out of scope for v1.

**Multi-tenant** — one deployment serves all brands; each brand's context is passed in per call. Stateless per call. No brand is hard-coded.

**Choice Object** — Yantri's output. The chosen topic + form + platforms + emotion, PLUS the reasoning, kills, confidence, and verdict. Schema in file 06.

**The three loops** — Fast (per-topic: choose + publish), Medium (weekly: measure + retune weights), Slow (quarterly: Winning Formula drift, human-owned). The medium loop is what makes Yantri learn; it's the thing v2.0 lacks.

**Memory core** — the shared store the loops read/write: Ledger + Rasa + Winning Formula. Makes scoring dynamic instead of a fixed formula.

**The five organs** — the dynamic parts v2.0 lacks: Feedback, Decay, Confidence, Counterfactual, Saturation. Each is a place a consequence flows back into a score. (File 03.)

---

## THE SCORING LAYERS

**Edge (Loop C)** — "is it ALIVE?" The center of gravity. Five dimensions: Angle, Nerve, Dare, Tension, Revelation. Run first.
- **Angle** — a telling nobody else is using.
- **Nerve** — touches a real tension/taboo/unsaid thing.
- **Dare** — there's a cost/risk in the telling, and that's part of why it lands.
- **Tension** — an unresolved pull (curiosity gap, violated expectation, stakes).
- **Revelation** — shows what the sanitized version hides (ground reality, backstage).

**Evidence (Loop A)** — "will it WORK?" A constraint. Scored from research + the brand's own Ledger (Ledger overrides research once it has data).

**Meaning (Loop B)** — "what does it MEAN?" The four-force read, a constraint.

**The four forces** — Geography (resources/boundaries/trade/demographics → stake proximity), Culture (belief/value/memory/identity → identity resonance), Society (recognition/status/belonging → social currency), Power (who gains/loses, rules, risk → stakes + risk). Built as a **cycle**, not a strict hierarchy.

**Terminal motive** — the per-brand terminal human driver: recognition | belonging | transcendence | security. Recognition for news/B2B; inverts to belonging/transcendence for devotional. Weights the four forces per brand.

**Transgression headroom** — how far a telling can go, this time. `brand_ceiling × platform_appetite × moment_permission` — a product, so any zero kills it. Never stored; computed per candidate.
- **Brand ceiling** — how much edge this brand can bear (empanelment, advertiser dependence, niche). The BRAND term.
- **Platform appetite** — how much edge this platform rewards vs punishes. The PLATFORM term.
- **Moment permission** — what the cultural moment allows right now. The MOMENT term — the one Yantri can't fully read; it flags this for a human.

**Hard refusal** — the boundary the engine refuses to cross and cannot be configured to cross: demeaning protected groups (incl. disability), obscenity-for-shock, incitement, acute IT-Rules/BNS exposure. Code, not a dial.

**Decay** — a topic's value drops over time; the score carries a clock, keyed to per-niche half-life.

**Saturation** — the Nth telling of a story is worth less; the score knows how crowded the story is (across the market AND our own brands).

**Confidence** — how sure a score is, from volume of relevant Ledger evidence + loop agreement. Drives auto/assist/manual routing.

---

## THE VERDICTS & MODES

**Dare Gate** — where the verdict is produced.

**Verdicts:**
- **Auto-approve** — high edge, within headroom, loops agree, high confidence, no harm flags.
- **Re-angle** — strong topic but weak angle, OR edge exceeds headroom but a survivable reframe exists. The craft branch. Keeps the story, finds a survivable telling.
- **Escalate** — near the headroom limit, unclear moment, protected-group adjacency, devotional edge attempt, loops disagree, or low confidence. Goes to a human.
- **Hard refuse** — crosses the boundary. Never re-angled, never escalated-to-maybe-allow.

**Modes:**
- **auto** — emits straight to DAFTAR, no human. Only after the Ledger proves the brand's loops.
- **assist** — emits choice + reasoning, waits for human confirm. Default while trust builds.
- **manual** — human proposes the topic; Yantri only validates (scores/forms it).

---

## THE MEMORY & LEARNING PARTS

**Ledger** — every published choice + its outcome (returning-viewer rate, retention shape, list growth, conversions). The spine of learning.

**Kill Log** — every rejected topic + reason (+ later, whether it blew up elsewhere). Training data (organ 4), not a dead end.

**Rasa** — the per-brand corpus of judged exemplars + misses. Taste memory. Per-tenant, never shared across brands.

**Winning Formula** — the per-brand living document of what wins (signature angle, nerve owned, transgression ceiling, platform map, dead zones, proof). Yantri proposes from the Ledger; Lavanya approves/edits.

**Formula drift** — how far Lavanya's edits move from Yantri's proposals. Shrinking = the engine is learning her taste = trust building.

**The two paths to reach** — Calculated (learnable: retention, satisfaction, format-fit) and Random (unpredictable: a specific human/nerve/timing). Yantri maximizes the calculated path and stays positioned for the random one; it never claims to predict the random path.

---

## THE OTHER TOOLS

**Khabri** — trend-signal scraper. Feeds Yantri (intake). A lagging/leading signal source, not the decider.

**Manual intake** — ground-input queue Khabri can't see (comments, community, client, competitor, hunch, calendar). The higher-value input. Has an EXPIRY field; auto-archives; 3× logging auto-promotes.

**Peep** — finds images/video + (upstream) pulls demand/search data. Shared service under all output tracks. Its demand-pull capability is a build dependency to confirm (file 08).

**Gemini node** — in DAFTAR; does deeper research on thin topics + writes copy (article/slides/tweets). Shared service.

**DAFTAR** — the orchestrator. Receives the Choice Object, routes it to tools. Yantri's only downstream contact.

**Router** — DAFTAR-side; reads `content_types` + `platforms` and splits the choice into parallel tracks. Doesn't re-decide the topic.

**Vritti** — CMS; receives long-form blogs.

**Chitra** — renders carousels (12 templates) + reels (7 templates, Remotion), against seeded brand kits.

**Twitter workflow** — in DAFTAR; posts tweets/threads.

**Relay** — the single publish layer. Nothing self-publishes. Owns timing/cadence; measurement returns through it.

---

## THE PRINCIPLES (shorthand for the non-negotiables in file 00)

**N1** decide-not-execute · **N2** learn-not-just-score · **N3** alive-beats-worthy · **N4** multi-tenant-from-day-one · **N5** assist-before-auto · **N6** auditable-reasoning-always · **N7** harm-boundary-is-hard.

**Cold-start trap** — every weight needs outcome data that doesn't exist yet; build the tables + output loop first to FEED the engine before trusting its judgments. (File 08.)

**The one-line truth** — Yantri reads signals + ground input, scores topics for whether they're ALIVE, computes how far a brand can push edge this moment, emits an auditable CHOICE that DAFTAR routes to tools, and LEARNS from every outcome.
