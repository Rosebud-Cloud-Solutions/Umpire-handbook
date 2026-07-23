# Roadmap

The goal is an **iPhone and Android app** that lets an umpire feed in a netball
scenario and get back the correct procedure to follow. Accuracy and traceability
to the Rules of Netball are the non-negotiable requirements at every phase.

## Phase 1 — Grounded prototype *(this repo, now)*

- Self-contained static web app (`index.html`) built from a verified knowledge
  base (`data/rules.json`) covering the full 2024 rulebook.
- On-device scenario matcher — every answer cites a specific rule clause.
- Hosted in the RCS Azure environment for review (see
  [DEPLOY-AZURE.md](DEPLOY-AZURE.md)).

**Why on-device matching first?** It guarantees every answer is traceable to a
rule and cannot "hallucinate". It establishes the verified knowledge base that
everything downstream reuses.

## Phase 2 — Conversational assistant

Add a natural-language chatbot for nuanced, multi-part scenarios, while keeping
answers constrained to the rulebook.

- **Pattern:** retrieval-augmented generation (RAG). The rulebook + `rules.json`
  are the retrieval corpus; the model answers *only* from retrieved clauses and
  must cite them. This keeps detail and accuracy central rather than relying on
  the model's memory.
- **Suggested Azure architecture:**
  - Azure Static Web Apps (front end) + Azure Functions (API), or Azure
    Container Apps for the backend.
  - Azure AI Search for retrieval over the rulebook chunks.
  - A hosted LLM (Azure OpenAI, or Claude via API) with a strict
    "answer only from provided rules and cite the clause" system prompt.
  - Guardrails: refuse/soft-fail when confidence is low; always surface the
    underlying rule so the umpire can verify.
- **Open decision:** which model/provider and whether answers are generated or
  retrieved-and-templated. See "Questions for the client" below.

## Phase 3 — Mobile apps (iPhone & Android)

- Shared rules engine and API from Phase 2.
- **Offline-first** for court-side use (the on-device knowledge base from Phase 1
  is ideal for this — the app works with no signal, syncs when online).
- Options: React Native / .NET MAUI / Flutter (a hybrid stack lets us reuse the
  web front end and the shared `rules.json`).

## Cross-cutting

- **Content governance:** `data/rules.json` is the single source of truth. Any
  rulebook update (new edition, interpretation bulletins) is a data change +
  test update, propagating to web and mobile.
- **Testing:** every ruling has at least one scenario regression test.
- **Branch policy:** feature branches + PR review; merges to `main` require
  explicit sign-off.

## Questions for the client

1. **Chatbot backend (Phase 2):** preferred model/provider — Azure OpenAI,
   Claude (Anthropic) API, or evaluate both?
2. **Branding:** should this adopt RCS brand colours/typography, or a
   netball/umpire identity? (Currently a neutral court-teal theme, easily
   re-skinned.)
3. **Audience & levels:** international rules only, or also the Rule 21
   variations for junior/lower levels?
4. **Mobile stack preference** (React Native / MAUI / Flutter / native)?
