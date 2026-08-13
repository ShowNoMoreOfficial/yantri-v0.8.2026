# 08 · BUILD ORDER — READ BEFORE ESTIMATING

This file is as important as file 02. It tells you what to build first and, more importantly, what NOT to build first. The obvious order is the wrong order.

---

## THE COLD-START TRAP (the thing that will waste your time if you miss it)

**Every scoring weight in this engine depends on outcome data that does not exist yet.**

- Edge weights per niche → tuned from what actually performed.
- Evidence scores → from the Ledger, which is empty on day one.
- Decay half-lives → from observed decay, not yet measured.
- Saturation penalties → from observed crowding effects.
- Confidence → from volume of relevant past cases (zero at start).

**Consequence:** if you build the fancy scoring engine first and switch it to `auto`, it is guessing with invented numbers. That is v2.0 with more boxes — the exact thing being replaced. It will produce confident garbage and destroy trust on day one.

**The engine cannot bootstrap itself. It has to be FED before it can be trusted.**

---

## THE CORRECT ORDER

### PHASE 0 — the two tables (days, not weeks)
Build the **Ledger** and the **Kill Log** first. Before any scorer.
- Ledger: every published choice + its outcome.
- Kill Log: every rejected topic + reason (+ later, whether it blew up elsewhere).

*Why first:* these two tables are the spine every organ plugs into. Nothing learns without them. They're small — a few days of work — and they unblock everything above. Building the scorer before the tables is building a brain with no memory.

### PHASE 1 — the output loop + assist mode
Build: the `/choose` endpoint (with placeholder/simple scoring), the `/outcome` endpoint, the DAFTAR router, the four execution tracks, and Relay's measurement return.
Run it in **assist mode only**. Topics can even be picked by hand at first. The scoring can be crude.

*Why before smart scoring:* the output loop is what FILLS the Ledger. Running crude-scoring-in-assist-mode for a few weeks generates the outcome data that every real weight needs. **You are building the data-collection machine before the decision machine.** This is the single most counterintuitive and most important sequencing call in the project.

### PHASE 2 — the real scoring layers
Now build Edge/Evidence/Meaning/Transgression properly, tuned against the Ledger data Phase 1 collected. Add decay, saturation, confidence. Start dialing specific brands from assist → auto as their Ledger proves the loops.

*Why now and not earlier:* now the weights are fitted to real outcomes instead of guesses. The engine's judgments can be checked against what actually happened.

### PHASE 3 — the slow loop + counterfactual
Winning Formula proposal/approval (`/formula`), formula-drift tracking, and the kill-check feedback (organ 4). These need the most accumulated data, so they come last.

---

## THE 8–12 WEEK RULE

For the first ~8–12 weeks, Yantri runs **assist only**. Its job in that window is not choosing — it's **collecting the outcome data that will let it choose later.** Do not let anyone (including Lavanya) flip it to auto before the memory core has real data. The feedback loop must FILL before the autonomy can turn on.

---

## KNOWN OPEN PROBLEMS (do not pretend these are solved)

These are genuinely unresolved. Flag them, don't fake them:

1. **The counterfactual organ is hard to feed.** Tracking "what happened to topics I killed" means monitoring things you did NOT publish, across competitors. Peep may not do this cheaply. **Start it MANUAL** — a weekly human note: "did anything I killed blow up elsewhere?" — before automating. Build the endpoint now; feed it by hand at first.

2. **Decay and saturation half-lives are unknown per niche.** They come from outcome data you don't have. **Start them as Lavanya's hand-set guesses**, corrected by the medium loop over time.

3. **Moment-permission can't be fully read by the engine.** Rooms change hourly. The engine computes brand × platform confidently and FLAGS moment for a human. Do not build a fake real-time culture-reader.

4. **Peep's demand-pull may not exist yet.** The demand/SEO gate (step 8) needs Peep to pull: search demand (Google/DataForSEO), cross-platform trends, social demand signal, SERP/AI-search check. **If Peep can't do these, the demand gate is blind — and blind demand-checking is worse than none.** Confirm Peep's capabilities early; this is a build dependency, not an assumption.

5. **Does "alive" fragment by niche?** The research strongly suggests yes (devotional edge ≠ comedy edge ≠ news edge). Build Edge as ONE framework with per-niche weights/ceilings, NOT one shared score. If during Phase 2 the data shows niches need genuinely different Edge *logic* (not just weights), Loop C may need per-niche variants — leave room for that.

---

## THE ONE-SENTENCE BUILD ORDER

> Tables first, output-loop-in-assist second, real scoring third, slow loop last — because the engine must be fed outcome data before its judgments can be trusted, and the output loop is what feeds it.

If you're tempted to build the clever scorer first because it's the interesting part: that instinct is the trap. The boring tables are what make the clever part work.
