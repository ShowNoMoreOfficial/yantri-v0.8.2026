# 03 · THE ENGINE ARCHITECTURE

This file is the mechanical shape of Yantri. File 02 was *why*; this is *what*.

---

## THE CORE SHAPE: THREE LOOPS AT THREE SPEEDS

The single biggest failure of v2.0 is that it is a **straight line** — signal in, score, choose, publish, done. It never finds out if it was right, so it makes the same mistake forever. v3.0 is not a line. It is **three nested loops running at three different speeds.**

```
FAST LOOP   (per topic)     intake → score → gate → emit choice → publish
MEDIUM LOOP (weekly)        measure outcome + kill log → memory → RETUNE the scoring weights
SLOW LOOP   (quarterly)     winning formula + four-force weights drift ← Lavanya holds the pen
```

- **Fast loop** produces a choice. This is the part people think of as "the engine."
- **Medium loop** is what makes it *learn*. Outcomes rewrite the weights the fast loop uses. **This is the loop that was entirely missing in v2.0 and is the reason to build v3.0 at all.**
- **Slow loop** is human-owned. The engine proposes changes to a brand's Winning Formula and force-weights; Lavanya approves/edits. Taste stays human; pattern-detection is the machine's.

**If you build the fast loop without the medium loop, you have rebuilt v2.0. Do not do this.**

---

## THE MEMORY CORE

All three loops write to and read from one shared store. It is not new infrastructure — it is three things wired together:

- **The Ledger** — every published choice + what happened (returning-viewer rate, retention shape, list growth, conversions).
- **Rasa** — the per-brand corpus of judged exemplars + misses (taste memory).
- **The Winning Formula** — the per-brand living document of what works (see file 04 §5).

The memory core is what makes the engine's scoring *dynamic* instead of a fixed formula. A topic is not scored by a static function — it is scored by a function that **last week's outcomes already edited.**

---

## THE FIVE ORGANS (the dynamic parts v2.0 lacks)

Every gap that makes an engine feel "straight-line and not dynamic" is one of these five missing organs. Each is a place where a consequence must flow back into a score.

### Organ 1 — FEEDBACK
Outcomes rewrite the weights. Without it the engine repeats its mistakes forever.
*Build:* the medium loop. Ledger → weight adjustment.

### Organ 2 — DECAY
A topic scored 90 this morning is worth 40 tonight, 10 tomorrow. The score must contain a **clock**. Half-life is *per-niche*: hours for breaking news, near-permanent for devotional/evergreen.
*Build:* every score carries a decay function keyed to the topic's half-life class and the brand's niche. Re-scored on read, not frozen at write.

### Organ 3 — CONFIDENCE
Every score must state how *sure* it is. "78, but I've seen only 3 similar cases" is different from "78, seen 400 cases." Confidence drives the auto/assist/manual routing.
*Build:* confidence = f(amount of relevant ledger evidence, agreement between loops). Low confidence → escalate to human. High + loops agree → eligible for auto.

### Organ 4 — COUNTERFACTUAL
The engine must learn from what it KILLED, not just what it published. If a killed topic goes viral for a competitor, that is the highest-value training signal available.
*Build:* the Kill Log stores every rejected topic + reason. A periodic check (manual at first — see file 08) asks "did anything I killed blow up elsewhere?" and feeds that back.

### Organ 5 — SATURATION
A topic scored alone is scored wrong. The 6th telling of a story is worth near zero. The score must know how crowded the story already is — including how many of *our own other brands* already ran it.
*Build:* saturation penalty = f(count of existing tellings across the market + across our brands). Applied at scoring time.

**All five share one shape:** the engine must have memory of consequences. That is the difference between v2.0 and v3.0 in one sentence.

---

## HOW THE PIECES SIT TOGETHER (reference)

```
INTAKE ──► SCORING CORE ──► DECAY + SATURATION wrap ──► DARE GATE (+confidence)
             (edge/evidence/meaning)                          │
                                                    ┌──────────┴──────────┐
                                                 CHOICE                  KILL
                                                    │                      │
                                              publish → measure       kill log
                                                    │                      │
                                                    └──────► MEMORY CORE ◄──┘
                                                              │
                                                    retunes the scoring core
```

File 04 details each scoring layer. File 05 details each pipeline step. File 06 is the API this all lives behind.
