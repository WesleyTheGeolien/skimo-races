"""Build src/data/races.json from scripts/raw.tsv.

Run from the project root:  python3 scripts/build_data.py
"""
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "scripts" / "raw.tsv"
OUT_JSON = ROOT / "src" / "data" / "races.json"

MONTHS = {"Dec": 12, "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5}

# Hand-checked values the text can't give reliably.
OVERRIDES = {
    "Pierra Menta": {"end_date": "2027-03-13", "level": "Classic"},
    "Trofeo Mezzalama": {"level": "Classic"},
    "L'Étape de la Pierre": {"level": "Open"},
}


def slugify(text: str) -> str:
    text = text.lower()
    for a, b in {"é": "e", "è": "e", "ê": "e", "à": "a", "â": "a", "î": "i", "ô": "o",
                 "û": "u", "ç": "c", "í": "i", "ü": "u", "ș": "s"}.items():
        text = text.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def year_for(month: int) -> int:
    return 2026 if month >= 9 else 2027


def end_date(details: str, start: str):
    m = re.search(r"(\d{1,2}) ([A-Z][a-z]{2}) – (\d{1,2}) ([A-Z][a-z]{2})", details)
    if m and m.group(4) in MONTHS:
        mo = MONTHS[m.group(4)]
        return f"{year_for(mo)}-{mo:02d}-{int(m.group(3)):02d}"
    m = re.search(r"(\d{1,2})–(\d{1,2}) ([A-Z][a-z]{2})", details)
    if m and m.group(3) in MONTHS:
        mo = MONTHS[m.group(3)]
        return f"{year_for(mo)}-{mo:02d}-{int(m.group(2)):02d}"
    return start or None


def level(details: str) -> str:
    d = details
    if "World Cup" in d or "World Championships" in d or "International games" in d:
        return "International"
    if "Championship" in d:
        return "French Championship"
    if "Coupe de France" in d:
        return "Coupe de France"
    if "Regional (LR)" in d:
        return "Regional"
    if d.startswith("Promo"):
        return "Promo"
    return "Open"


def disciplines(details: str):
    d = details.lower()
    out = []
    for key, label in [("sprint", "Sprint"), ("vertical", "Vertical"), ("individual", "Individual"),
                       ("team", "Team"), ("relay", "Relay"), ("relais", "Relay")]:
        if key in d and label not in out:
            out.append(label)
    return out


def country_region(where: str):
    if "," in where:
        tail = where.split(",")[-1].strip()
        if tail in {"Italy", "Spain", "Switzerland", "Germany", "Norway", "Andorra", "Romania", "Azerbaijan"}:
            return tail, None
    if where == "Chungcheong":
        return "Other", None
    m = re.search(r"\(([^)]+)\)\s*$", where)
    return "France", (m.group(1) if m else None)


def clean_location(where: str) -> str:
    return re.sub(r"\s*\([^)]*\)\s*$", "", where).strip()


def main():
    rows = list(csv.DictReader(RAW.open(encoding="utf-8"), delimiter="\t"))
    races, seen = [], {}
    for r in rows:
        start = r["date"] or None
        country, region = country_region(r["where"])
        base = slugify(r["name"]) + (f"-{start}" if start else "")
        seen[base] = seen.get(base, 0) + 1
        rid = base if seen[base] == 1 else f"{base}-{seen[base]}"
        race = {
            "id": rid,
            "name": r["name"],
            "start_date": start,
            "end_date": end_date(r["details"], start),
            "status": r["status"],
            "location": clean_location(r["where"]),
            "region": region,
            "country": country,
            "details": r["details"],
            "url": r["url"],
            "lat": float(r["lat"]) if r["lat"] else None,
            "lon": float(r["lon"]) if r["lon"] else None,
            "level": level(r["details"]),
            "disciplines": disciplines(r["details"]),
            "is_night": bool(re.search(r"night|nocturne", r["details"], re.I)),
        }
        race.update(OVERRIDES.get(r["name"], {}))
        races.append(race)

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(races, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"{len(races)} races -> {OUT_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
