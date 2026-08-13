# 04 · THE SCORING LAYERS

How each layer actually produces a number. These are the placeholders you'll tune with real data (file 08 explains why they start as guesses).

---

## LAYER 1 · EDGE — "is it alive?" (run FIRST, center of gravity)

Five scorable dimensions. Each 0–1. Weighted per-niche (see file 02 niche table).

```
ANGLE        Is there a telling nobody else is using?
             (Samdish: "I'm standing in the village showing you" — not "here's data")
NERVE        Does it touch a real tension / taboo / the-thing-nobody-says?
DARE         Is there a cost/risk in this telling, and is that part of why it lands?
             (feeds the transgression headroom, below)
TENSION      Is there an unresolved pull? (curiosity gap, violated expectation, stakes)
REVELATION   Does it show something the sanitized version hides? (ground reality, backstage)
```

**Edge score = weighted sum, weights per-niche.** Devotional weights ANGLE + sincerity high, DARE ~0. Comedy weights DARE + NERVE high. News weights REVELATION + NERVE.

**Learnable vs not:** the dimensions are scorable. Whether a chosen angle *ignites* is NOT — that stays human. The engine scores the presence of edge; it does not promise the edge will catch.

---

## LAYER 2 · EVIDENCE — "will it work?" (constraint)

Scores whether content of this shape/emotion, on this platform, in this niche, tends to perform — from (a) the research (file 09) and (b) the brand's own Ledger. The Ledger *overrides* the research once it has data (your own results beat general findings).

Inputs it scores: hook potential, emotional arousal (high-arousal drives sharing), format-outlier fit vs the channel's own baseline, platform-fit.

**Note the outlier definition:** an outlier is a video beating its OWN channel's baseline (vidIQ multiplier: 2x = double channel average), NOT absolute view count. A 50k-view video can be a big outlier for a small channel. Score relative to the brand's own history, always.

---

## LAYER 3 · MEANING — the four-force read (constraint)

Lavanya's theory, operationalized as four lenses. **Built as a CYCLE, not a strict hierarchy** — the "society is king" claim is held loosely pending evidence, because power demonstrably reshapes culture too (propaganda, patronage). Do not hard-code society as always-dominant.

```
GEOGRAPHY   resources / boundaries / trade / demographics touched
            → STAKE PROXIMITY score (whose material stake is real here)
CULTURE     shared belief / value / memory / identity engaged
            → IDENTITY RESONANCE score
SOCIETY     recognition / status / belonging available in engaging this
            → SOCIAL CURRENCY score
POWER       who gains/loses if this is said; rules of engagement; risk
            → STAKES + RISK score
```

**TERMINAL_MOTIVE is per-brand, not universal.** Recognition is terminal for news/B2B. It INVERTS to belonging/transcendence for devotional/community. The engine carries a per-brand `terminal_motive` field (recognition | belonging | transcendence | security) and weights the four forces accordingly. This is how one engine serves E-Sutra and The Squirrels without flattening them.

---

## LAYER 4 · TRANSGRESSION HEADROOM (computed per candidate, never stored)

How far THIS telling can go, THIS time. **A product, not a sum** — any term at zero kills it.

```
HEADROOM = BRAND_CEILING × PLATFORM_APPETITE × MOMENT_PERMISSION
```

- **BRAND_CEILING (0–1):** empanelment status, advertiser dependence, institutional partnerships, niche. Devotional ≈ 0.05, B2B ≈ 0.2, news ≈ 0.5, comedy ≈ 0.8. **When a brand becomes empaneled or gains institutional partners, drop this near zero regardless of platform.**
- **PLATFORM_APPETITE (0–1):** X ≈ 0.8, YouTube-body ≈ 0.5, YouTube-monetized ≈ 0.3, Instagram ≈ 0.2, LinkedIn-transgression ≈ 0.1 (but LinkedIn-contrarian ≈ 0.6), devotional platforms ≈ 0.05.
- **MOMENT_PERMISSION (0–1):** is there live cultural cover for this take right now, or an active backlash/sensitivity? **This is the term Yantri canNOT fully know** — rooms change hourly. Compute brand × platform confidently; flag moment for human review. Be honest about this blind spot rather than faking real-time culture-reading.

Why multiplication: a forbidding moment (a tragedy, a live controversy) must zero the headroom no matter how edgy the brand or hungry the platform. The product does that automatically.

---

## LAYER 5 · THE HARD REFUSAL (not a score — a gate)

Before anything ships, a boundary check that CANNOT be tuned:
- demeaning protected groups (incl. disability) · obscenity-for-shock · incitement · acute IT-Rules 2026 / BNS 2023 exposure → **REFUSE.**

This is code, not config. See file 02 §hard boundary and N7.

---

## THE VERDICT LOGIC (what the gate does with all of it)

```
AUTO-APPROVE   high edge + within headroom + loops agree + high confidence + zero harm flags
RE-ANGLE       strong topic, weak/derivative angle OR edge exceeds headroom but a survivable
               reframe exists (satire / implication / let-the-subject-speak / show-don't-say)
ESCALATE       near headroom limit · unclear moment permission · protected-group adjacency ·
               any devotional edge attempt · loops disagree · low confidence
HARD REFUSE    crosses the boundary in Layer 5 (never re-angled, never escalated-to-maybe-allow)
```

**The RE-ANGLE branch is the craft engine.** A fatal telling of a live story doesn't kill the story — it triggers a search for the telling that keeps the nerve and loses the fatality. (Samdish tells an inflammatory truth by *being there* rather than editorializing.) Build this as a real branch, not a rejection.

---

## THE WINNING FORMULA (per-brand, living, Lavanya holds the pen)

Yantri's per-brand memory of what wins. Yantri PROPOSES from the Ledger; Lavanya approves/edits.

```
SIGNATURE ANGLE       the telling this brand does that others won't
NERVE IT OWNS         the tension this brand is trusted to touch
TRANSGRESSION CEILING never · rare · situational · frequent · core  (= BRAND_CEILING term)
PLATFORM MAP          per platform: does this brand win here, and how (overridable)
DEAD ZONES            "worthy" angles this brand should never run
PROOF                 3–5 own pieces that defined the formula + why
LAST EDITED           who, when (versioned)
```

**Bootstrap:** after ~15–20 Ledger entries per brand, Yantri clusters winners and drafts the Signature Angle + Nerve + Platform Map. Lavanya edits. It re-proposes as the Ledger grows. **Formula drift** (how far Lavanya's edits move from Yantri's proposals) is a trust metric — shrinking edits = the engine is learning her taste.
