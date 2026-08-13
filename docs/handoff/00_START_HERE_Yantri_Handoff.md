# YANTRI v3.0 — BUILD HANDOFF
### For: Stallone · From: Lavanya · Compiled: 04 Aug 2026
### Purpose: everything needed to build Yantri, with the reasoning inline so nothing gets re-derived wrong

---

## HOW TO READ THIS PACK

Read in this order. Each file is self-contained; the reasoning is written *into* each decision so you never have to ask "why is it like this?"

```
00 · START HERE            ← you are here. The non-negotiables.
01 · WHAT YANTRI IS        the one-paragraph truth + what it is NOT
02 · THE CORE THEORY       the "alive story" principle. Read before any code.
03 · THE ENGINE ARCHITECTURE   the dual/triple loop, five organs
04 · THE SCORING LAYERS    edge, evidence, meaning, four forces — how each scores
05 · THE PIPELINE          step by step, intake → choice → output
06 · THE API CONTRACT      what it ingests, what it emits (build to this)
07 · DAFTAR INTEGRATION    how the choice routes to Vritti/Chitra/Twitter/Relay
08 · BUILD ORDER           what to build first, and the cold-start trap
09 · EVIDENCE APPENDIX     the research findings, tagged, that set the weights
10 · GLOSSARY              every term defined once
```

**If you read only one thing before starting: read file 02 and file 08.** 02 stops you building the wrong engine. 08 stops you building it in the wrong order.

---

## THE NON-NEGOTIABLES

These are decisions already made, with reasons. Do not re-open them without talking to Lavanya — each one was a deliberate choice against an obvious-but-wrong alternative.

**N1 — Yantri decides; it does not execute.**
Yantri emits a *choice*. It never touches Vritti, Chitra, Twitter, or Relay directly. DAFTAR routes the choice to those tools.
*Why:* separation of concerns. Yantri stays a pure decision node so it can become an independent app later without dragging execution logic with it. If you wire Yantri directly to publishing tools, you've welded it to DAFTAR forever.

**N2 — The engine must LEARN, not just score.**
Every published choice's outcome flows back and retunes the scoring. A scorer that never sees its results is the exact thing we're replacing (that was v2.0, and it's why it isn't trusted).
*Why:* the whole point of v3.0 is that it gets less wrong over time. No feedback loop = no v3.0, just v2.0 with more boxes.

**N3 — The "alive" story beats the "worthy" story.**
The engine's job is not to pick the most technically-correct topic. It's to pick the one with a living angle. Worthy-but-dead topics get rejected. (Full reasoning in file 02.)
*Why:* the most worthy story is not the one that wins. This is the single most important insight in the whole project. An engine that optimizes worthiness will systematically lose.

**N4 — It is multi-tenant from day one.**
Nothing is hard-coded to one brand. Brand context (four-force weights, terminal motive, transgression ceiling, register, corpus, emotion library) is passed in or referenced per call. Stateless per call.
*Why:* one engine must serve The Squirrels, Breaking Tube, E-Sutra, and every future client. Baking in one brand's worldview means rebuilding for the next.

**N5 — It runs in ASSIST mode first, not AUTO.**
For the first ~8–12 weeks the engine does not choose autonomously. It proposes + shows reasoning; a human confirms. Its real early job is collecting outcome data. (Reasoning in file 08.)
*Why:* every scoring weight depends on outcome data we don't have yet. Auto mode before the memory has data is reckless and will destroy trust on day one.

**N6 — Every choice carries auditable reasoning.**
The engine never emits a bare score. It emits the score PLUS why — both loops' work, the confidence, what it rejected. (Schema in file 06.)
*Why:* an unauditable choice is an untrustable choice. Lavanya must be able to check the engine's reasoning against evidence. This is the mechanism that builds trust.

**N7 — The harm boundary is a hard refusal, never a tunable score.**
Content demeaning protected groups (incl. disability), obscenity-for-shock, incitement, or acute India IT-Rules/BNS legal exposure = the engine REFUSES. This is not a dial. It cannot be turned up. (Detail in file 04.)
*Why:* one incident is brand-ending and legally serious, especially with empanelment live. This must be code that cannot be configured away, not a parameter.

---

## THE ONE-LINE SUMMARY

> Yantri is a multi-tenant decision node that reads trend signals and ground input, scores candidate topics for whether they are ALIVE (not just worthy), computes how far each brand can push edge in this exact moment, emits an auditable CHOICE that DAFTAR routes to the right tools, and LEARNS from every outcome so its next choice is better.

If a design decision ever contradicts that sentence, the sentence wins.

---

## PROVENANCE NOTE

This pack is compiled from an extended design process. Two deep-research investigations back the evidence claims (file 09). Where a number or claim is research-derived, it is tagged with its confidence. Where something is Lavanya's judgment or theory, it is marked as such. **Nothing in here is invented to fill a gap — if something is unknown, it says "unknown, resolve during build."**
