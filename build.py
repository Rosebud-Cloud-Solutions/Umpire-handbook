#!/usr/bin/env python3
"""Build the self-contained Netball Umpiring Handbook.

Reads the rules knowledge base (data/rules.json) and injects it into the page
template (assets/app.template.html) to produce a single, dependency-free
index.html that can be opened directly in a browser or hosted as a static site
(e.g. Azure Static Web Apps).

Keeping the data in rules.json as the single source of truth means the same
knowledge base can later feed the conversational (LLM/RAG) backend and the
mobile apps.

Usage:  python3 build.py
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent
DATA = ROOT / "data" / "rules.json"
TEMPLATE = ROOT / "assets" / "app.template.html"
OUTPUT = ROOT / "index.html"
PLACEHOLDER = "/*__RULES_DATA__*/"


def main() -> int:
    raw = DATA.read_text(encoding="utf-8")
    # Validate the JSON so a malformed knowledge base fails the build loudly.
    data = json.loads(raw)
    n_rulings = len(data.get("rulings", []))
    n_signals = len(data.get("signals", []))

    template = TEMPLATE.read_text(encoding="utf-8")
    if PLACEHOLDER not in template:
        print("ERROR: placeholder not found in template", file=sys.stderr)
        return 1

    # Compact JSON, and neutralise any "</script>" that could break the tag.
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    payload = payload.replace("</", "<\\/")

    html = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\" />\n"
    html += template.replace(PLACEHOLDER, payload)
    html += "\n</html>\n"

    OUTPUT.write_text(html, encoding="utf-8")
    kb = OUTPUT.stat().st_size / 1024
    print(f"Built {OUTPUT.name}: {n_rulings} rulings, {n_signals} signals, {kb:.0f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
