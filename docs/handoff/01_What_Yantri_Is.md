# 01 · WHAT YANTRI IS (AND IS NOT)

---

## WHAT IT IS

Yantri is the **topic-choice engine** for a multi-brand media operation. Given the state of the world (trend signals + ground input) and a brand's identity, it decides: **this topic, this brand, this platform, this form, this emotion** — and it does so in a way that improves every time it sees an outcome.

It is being built **node-first, app-later**:
- **Now:** a headless node with a public API, called by DAFTAR.
- **Later:** an independent application with its own front end and additional features. (Front end is explicitly NOT in scope now.)

It is **multi-tenant**: one deployment serves all brands, each with its own passed-in context.

---

## WHAT IT IS NOT

- **It is not a content generator.** It does not write blogs or tweets or make videos. It decides *what* to make. Gemini/Peep/Chitra/Vritti make it.
- **It is not a publisher.** Relay publishes. Yantri never posts anything.
- **It is not a virality predictor.** No engine can predict the random path to virality (see file 02 §4). Yantri maximizes the *calculated* path and stays positioned for the random one. Anything claiming to predict viral hits is dishonest.
- **It is not a trend scraper.** Khabri does the scraping. Yantri *consumes* Khabri's signals and decides among them.
- **It is not v2.0 with more features.** v2.0 scores signals with no feedback and no independent understanding. v3.0 is a learning loop with a second opinion. If what you build doesn't learn, it's not this.

---

## THE RELATIONSHIP TO OTHER TOOLS (one line each)

- **Khabri** → feeds Yantri trend signals (intake).
- **Manual intake** → feeds Yantri ground input Khabri can't see (intake).
- **Peep** → pulls demand/search data + finds images/video (called during scoring + execution).
- **Gemini node (in DAFTAR)** → does deeper research on thin topics + writes copy (called during scoring + execution).
- **DAFTAR** → receives Yantri's choice and orchestrates everything downstream.
- **Vritti** → CMS; receives long-form blogs.
- **Chitra** → renders carousels (12 templates) + reels (7 templates).
- **Twitter workflow (in DAFTAR)** → posts tweets/threads.
- **Relay** → the single publish layer for everything.

Yantri talks to **Khabri, manual intake, Peep, and Gemini** on the way IN. It talks to **DAFTAR** on the way OUT. Everything else is downstream of DAFTAR, not of Yantri.
