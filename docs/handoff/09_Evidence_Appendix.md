# 09 · EVIDENCE APPENDIX

The research findings that set the engine's weights and rules. Every claim is tagged so you know how much to trust it and which scoring layer it informs. **Where evidence is weak, the weight it sets is a starting guess to be corrected by the Ledger — not a fact.**

Two deep-research investigations back this file. Confidence tags: `established` (peer-reviewed or strong convergence), `emerging` (directional, some sourcing), `anecdotal` (single-case or vendor), `contested` (disputed).

---

## A · WHAT CARRIES A BREAKOUT (sets EDGE + EVIDENCE weights)

**A1. Angle/framing matters more than topic.** The same subject wins or dies on the telling. `established` (framing theory + agenda-setting are foundational). → Sets: EDGE is the center of gravity; ANGLE is the highest-weight dimension.

**A2. High-arousal emotion drives sharing.** Berger & Milkman (2012, ~7,000 NYT articles): awe, anger, anxiety spread; low-arousal (sadness) does not. `established`. → Sets: EVIDENCE scores arousal; the emotion library tags each entry high/low arousal.

**A3. "Boring" subjects break out via story, character, stakes — not by swapping the subject.** Dhruv Rathee turned electoral bonds into 15M views; "dictatorship" explainer 23M. `established` (well-documented cases). → Sets: FORM assignment is mandatory; character-entry required for institutional topics.

**A4. The authenticity premium is real but niche-specific.** Raw/unfiltered field content outperforms polished in news/human-interest/B2B (Samdish, Ravish, Ajit Anjum). Not universal. `established` for the cases, `emerging` for the size of the effect. → Sets: REVELATION dimension; per-niche Edge weighting.

**A5. Outlier = beats the channel's OWN baseline, not absolute views.** vidIQ multiplier logic. `established`. → Sets: EVIDENCE scores relative to the brand's own Ledger history, always.

---

## B · EDGE FRAGMENTS BY NICHE (sets per-niche EDGE weights — critical for multi-tenancy)

`established` across cases. Do NOT use one shared "alive" score.

| Niche | "Alive" = | Transgression ceiling |
|---|---|---|
| News / current-affairs | revelation + nerve | medium (~0.5) |
| Comedy / roast | dare + nerve | high (~0.8) |
| Devotional / spiritual | angle + sincerity + depth (NOT transgression) | near zero (~0.05) |
| B2B / builder | contrarian angle + tension | low; intellectual edge only (~0.2) |
| Human-interest | revelation + tension | medium |

→ Sets: the per-niche Edge weight table (file 04 Layer 1) and BRAND_CEILING defaults (file 04 Layer 4).

---

## C · CRAFT-TRANSGRESSION — SURVIVABLE EDGE (sets RE-ANGLE branch logic)

**C1. Survivable-edge techniques exist and are learnable.** Implication over statement, satire as cover, letting the subject say it, show-don't-say, raw authenticity. `established`. → Sets: the RE-ANGLE branch's reframing options.

**C2. The harm boundary is where craft ends.** Demeaning protected groups (incl. disability), obscenity-for-shock, incitement → platform + legal consequences (India IT Rules 2026, BNS 2023). The IGL/Allahbadia collapse (Feb 2025) is the canonical case: multiple FIRs, SC scrutiny, brand pullouts. `established`. → Sets: the HARD REFUSAL gate (Layer 5). This is a hard boundary, not a score.

**C3. Risk is asymmetric — same technique, opposite outcome by brand.** The identical joke rode controversy for a comedy brand (Samay Raina → MSG, most-viewed special) and damaged an empaneled/advertiser-dependent brand (Allahbadia). `established`. → Sets: BRAND_CEILING as a per-brand term; "when empaneled, drop ceiling near zero."

---

## D · HOW FLAGGED CONTENT STILL OUTPERFORMS (sets EVIDENCE + monetization context)

Ranked by mechanism:

**D1. REACH survives flagging (strongest).** Demonetization ≠ deranking — YouTube treats ad-suitability and discovery separately. Controversy adds distribution (Streisand effect, re-uploads, cross-platform). 4PM News blocked twice, grew through it. `established`. → Sets: EVIDENCE should not treat "edgy" as low-reach.

**D2. TRUST/loyalty deepens with edge/censorship** via "censored because they tell the truth" in-group narrative. `established`. → **This is the outcome to steer YOUR brands toward** — nerve that builds a loyal core without the cruelty that costs elsewhere.

**D3. MONETIZATION is where edge bites.** Edge vs advertiser-safety are in tension. Cornell/EPFL (71M videos): 61% of fringe channels use alternative monetization vs 18% overall. `established`. → Sets: the strategic note that edge-heavy brands must monetize via membership/direct-support, not ads.

**D4. Controversy is a reach accelerant, not a durable base.** Decays if it's the only engine. `emerging` (inference from decay patterns, not a proven law). → Sets: use edge to acquire+bond, then monetize the core directly.

---

## E · ORGANIC-FIRST (sets platform_fit defaults + strategic posture)

**E1. Organic-first is viable in 2026 — but only on YouTube + owned channels.** `established` (benchmarks converge).
- YouTube: still meritocratic, small channels can outlier. **Best organic bet.**
- Instagram: organic reach collapsed (~3.5% avg, declining). Repackaging surface only.
- Facebook: ~1.4–5.2% page reach. Groups are the exception.
- LinkedIn: rewards *personal* (not company-page) organic; contrarian professional edge wins; external links in-body cut reach ~60%.
- X: ephemeral (~15–30 min half-life), low durable reach.
- Owned (email/WhatsApp): only algorithm-proof channels. WhatsApp Communities ~90% open rates (India-specific superpower).

→ Sets: platform_fit_map defaults; the strategic posture that a capital-constrained studio should lean ~90% organic on YouTube + owned, treat Meta/X as repackaging.

**E2. Owned audience makes organic-first survivable.** Email/WhatsApp are the floor when the algorithm throttles. `established`. → Sets: the whole loyalty-infrastructure priority (relevant to DAFTAR/Relay, not Yantri's scoring directly, but informs slot-grid design).

---

## F · PLATFORM APPETITE FOR EDGE (sets PLATFORM_APPETITE term values)

`established`. → Sets file 04 Layer 4 platform_appetite values:
X ≈ 0.8 · YouTube-body ≈ 0.5 · YouTube-monetized ≈ 0.3 · Instagram ≈ 0.2 · LinkedIn-transgression ≈ 0.1 / LinkedIn-contrarian ≈ 0.6 · devotional platforms ≈ 0.05.

---

## G · THE FOUR-FORCE MODEL — evidence test (sets MEANING layer)

**G1. The chain (geography → culture/society → power) is defensible as an analytical frame but is a CYCLE, not a strict hierarchy.** Power reshapes culture (propaganda, patronage); geography's meaning shifts with power. `emerging`/`contested` on the strict "society is king" claim. → Sets: build the four forces as a cycle; make terminal_motive per-brand; do NOT hard-code society as always-dominant.

**G2. "Recognition is the terminal motive" is culture-specific, not universal.** Holds for status-driven audiences (news, B2B). Inverts to belonging/transcendence for devotional/collectivist audiences (WEIRD-psychology critique). `emerging`. → Sets: the `terminal_motive` per-brand field (recognition | belonging | transcendence | security).

**G3. Complementary frameworks exist** — Moral Foundations Theory, framing/agenda-setting, Hofstede — that map onto or enrich the four forces. `established`. → Optional: could inform future scoring refinements; not required for v1.

---

## H · THE LEARNABLE / UNPREDICTABLE LINE (sets what auto-runs vs escalates)

**Learnable/scorable:** hook strength, title/thumbnail click-contract, angle novelty + emotional charge, narrative-structure presence, format-outlier fit, platform-appetite constant, niche-permission constant, brand-ceiling constant, moment-detection (is there a live topic).

**Unpredictable/human:** whether an angle *ignites*, whether a specific transgression bonds or repels, the absolute virality ceiling, whether a live moment catches fire.

`established`. → Sets: the verdict logic. The engine auto-approves the learnable-and-safe; it ESCALATES the unpredictable rather than pretending to decide it.

---

## PROVENANCE & HONESTY

- Numbers are current as of mid-2026 and will drift (subscriber counts, engagement benchmarks).
- Vendor/agency sources are directional; peer-reviewed anchors are Berger & Milkman (virality/emotion), Cornell/EPFL (alternative monetization), framing/agenda-setting theory.
- The two full research reports sit alongside this pack (the "evidence layer" and "media architecture" artifacts) — read them for the full citations behind these tagged summaries.
- **Nothing here is invented to fill a gap.** Where something is unknown it is marked unknown in file 08.
