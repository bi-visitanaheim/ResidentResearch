# Resident Sentiment Tracker (Visit Anaheim BI)

Cumulative resident sentiment results for Anaheim (Baseline Apr 2025 to Wave 4 Oct 2026) and Garden Grove (Wave 1 May 2026 to Wave 2 Oct 2026).

- `dashboard/` — the standalone dashboard (static site). Vercel serves this folder (see `vercel.json`). Open `dashboard/index.html` locally to preview.
- `pipeline/` — scripts that rebuild every number from the vendor files. Run `pipeline/run_all.sh`.
- `docs/` — insights report, data dictionary and document list.

Only aggregate results are included. Respondent-level files and vendor decks are not in this repository.

## Updating when a new wave arrives

1. Put the new vendor files (report deck, crosstabs, survey data) next to the existing ones and add them to the file lists at the top of `dump_workbooks.py`, `extract_decks.py`, `extract_xtabs.py` and `relationships.py`.
2. Run `pipeline/run_all.sh`. It rebuilds `resident_sentiment.db`, `facts.csv` and `ask_facts.csv` from scratch.
3. Run the data quality audit on the new wave.
4. Rebuild `dashboard/data.js` from the new CSVs and commit. Vercel redeploys automatically.

Powered by Visit Anaheim Business Intelligence Team.
