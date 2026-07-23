# Netball Umpiring Handbook

A scenario-driven umpiring aid. Describe a match situation in plain language and
get the correct **ruling, sanction, umpire terminology, hand signal and
step-by-step procedure** — grounded verbatim in the **World Netball Rules of
Netball, 2024 Edition**.

This is the first working prototype: a single, dependency-free `index.html` you
can open in any browser or host as a static site (e.g. **Azure Static Web
Apps**). The eventual product is an iPhone and Android app; see
[docs/ROADMAP.md](docs/ROADMAP.md).

> ⚖️ **Point of truth.** Every ruling is traceable to a specific rule clause,
> shown in square brackets (e.g. `[13.1]`). Where translated wording diverges,
> the English text is authoritative. This is a decision-support aid, not a
> substitute for the full rulebook or formal umpire accreditation. Umpire
> judgement always applies, and player safety is the paramount consideration.

## What's in it

| Tool | What it does |
|------|--------------|
| **Scenario Assistant** | Type a situation → matched ruling with sanction (colour-coded by severity), exact terminology, where it's taken, hand signal, and procedure. Runs entirely on-device. |
| **Rulings Library** | Browse and search all 39 infringements by category. |
| **Hand Signals** | The 23 official umpire hand signals (Rules of Netball, pp. 70–77). |

## Project structure

```
data/rules.json           <- the knowledge base (SINGLE SOURCE OF TRUTH)
assets/app.template.html   <- page template (HTML/CSS/JS), data injected at build
build.py                   <- injects rules.json into the template -> index.html
index.html                 <- the built, self-contained app (open this)
tests/scenarios.test.mjs   <- scenario-matching regression tests (headless Chromium)
tests/screenshots.mjs      <- regenerates light/dark screenshots
docs/                      <- roadmap and Azure deployment notes
```

The knowledge base lives in **`data/rules.json`** so the same, verified data can
later feed the conversational (LLM/RAG) backend and the mobile apps. **Do not
hand-edit `index.html`** — edit `rules.json` (for rulings) or
`assets/app.template.html` (for UI), then rebuild.

## Build & run

```bash
python3 build.py        # rebuild index.html from rules.json + template
# then open index.html in a browser
```

No build tools or network access are required to *run* it — `index.html` is
fully self-contained.

## Tests

The scenario matcher has a regression test (18 real-world scenarios -> expected
ruling) that runs in headless Chromium:

```bash
npm install             # dev-only: playwright-core, for the test harness
node tests/scenarios.test.mjs
```

## Contributing / editing rulings

Each entry in `data/rules.json` carries the rule reference, category, exact
umpire terminology, sanction type, where the sanction is taken, the hand-signal
number, "what to look for" indicators, an ordered procedure, notes, and the
keyword set used for scenario matching. When adding or changing a ruling, keep
every field traceable to the rulebook and add a matching test scenario.

### Branching & merges

All changes are made on feature branches and reviewed via pull request.
**Merges to `main` are only done after explicit sign-off** — please review the PR
and approve before it is merged.

---

*"Rules of Netball" (c) World Netball. This prototype is produced by Rosebud
Cloud Solutions for umpire education and reference.*
