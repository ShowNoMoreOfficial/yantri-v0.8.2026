# 07 · DAFTAR INTEGRATION

How the Choice Object becomes published content. This is DAFTAR-side work — Yantri's job ends at emitting the choice. But you're building both, so here's how they meet.

**Core model:** Yantri decides · DAFTAR orchestrates · the tools execute · Relay publishes · outcomes return to Yantri.

---

## THE ROUTER (DAFTAR-side, step 12)

DAFTAR receives the Choice Object and reads two fields: `content_types` and `platforms`. It splits the single topic into parallel tracks — one per content type the brand's workflow enables. Which tracks fire is **configured per brand** in the DAFTAR workflow, not decided by Yantri. A news brand may run all four; E-Sutra may run only blog + carousel.

The router does NOT re-decide the topic. Yantri already decided. The router only dispatches.

---

## THE FOUR TRACKS

### Track A — LONG FORM → Vritti
```
choice + seo_brief
   → Gemini node writes the article against the SEO brief
   → Peep supplies images
   → lands in Vritti as a CMS draft
   → Relay publishes to the website on schedule
```
The `seo_brief` on the choice (populated by Peep at pipeline step 8) carries the keywords and search-demand data. This is the blog pipeline end to end. Long-form is also where SEO lives — short-form/social don't carry SEO briefs.

### Track B — CAROUSEL → Chitra
```
choice
   → Chitra carousel node (your 12 templates + seeded brand kits)
   → Gemini writes slide copy
   → Peep finds imagery
   → Chitra renders against the brand kit
   → Relay → Meta + LinkedIn
```

### Track C — SHORT FORM → Chitra
```
choice.form (dramatic_question + turn)
   → Chitra reel node (your 7 reel templates, Remotion)
   → renders vertical
   → Relay → Shorts + Reels
```
Same tool as carousels, different node. The form block's single "turn" is the reel's spine.

### Track D — TWEET + THREAD → Twitter workflow
```
choice + angle
   → Gemini drafts the tweet/thread
   → Peep attaches images if the workflow calls for them
   → Twitter workflow (in DAFTAR) posts
```

---

## THE SHARED SERVICE LAYER (build once)

**Peep and Gemini sit UNDER all four tracks, not beside one.** Every track calls the same two capabilities:
- **Gemini node** → writes the words (article, slide copy, tweet, thread).
- **Peep** → finds the pictures/video + (upstream, during scoring) pulls demand/search data.

Build this integration ONCE as a shared service both the pipeline (steps 3.5, 8) and the execution tracks (13) call. Do not implement Gemini/Peep four times.

---

## RELAY — THE SINGLE PUBLISH LAYER

Nothing self-publishes. All four tracks converge on Relay. Relay owns platform + timing + cadence. This matters for two reasons:
1. Publishing timing/cadence is controlled in one place (not scattered across four tools).
2. **Measurement comes back through one door** → into Yantri's `/outcome` endpoint. One topic → four forms → one publish layer → one feedback signal. That single feedback signal is what closes the learning loop.

---

## THE MEASUREMENT RETURN (the loop-closer)

After Relay publishes, outcomes flow back:
```
Relay measures (returning-viewer, retention shape, list growth, conversions)
   → DAFTAR calls Yantri POST /outcome
   → Yantri Ledger records it
   → medium loop retunes scoring weights
```
**This is the most important integration in the whole system and the easiest to skip.** If you build the four output tracks but not this return path, the engine never learns. Build the return path in the same sprint as the tracks.

---

## MANUAL INTAKE (DAFTAR-side form, feeds Yantri step 1)

A 60-second form, low friction, anyone on the team can submit:
```
WHAT              one line, plain language
SOURCE TYPE       comment | community | client | ground | off-platform | competitor | hunch | calendar
BRAND             which brand(s) this could serve
EVIDENCE          what was actually seen ("3 people asked X" beats "feels big")
HEAT              rising | steady | fading | unknown
EXPIRY            date after which this is dead   ← auto-archives past this
WHY NOT OBVIOUS   what makes this un-scrapeable
LOGGED BY / DATE
```
Rules: continuous submission; weekly triage against the slot grid; anything logged 3× by different people auto-promotes; anything past EXPIRY auto-archives. This queue is passed into Yantri's `/choose` call as `manual_intake`.

**Why it matters (repeat from file 05):** manual intake is the higher-value input, not a fallback. Khabri is blind to ground reality, client asks, and community chatter. The engine that only eats Khabri is half-blind.

---

## WORKFLOW CONFIGURATION (per brand)

Each brand's DAFTAR workflow sets:
- which tracks fire (blog/carousel/short/tweet)
- the mode (auto/assist/manual) — default assist
- the slot grid (named recurring slots)
- Relay timing/cadence per platform
- whether Peep attaches images per track

This is what makes one engine + one orchestrator serve many brands differently without code changes.
