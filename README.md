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
5. **Refresh the Overview GIF** (`dashboard/resident-sentiment-2026.gif`). It is a static snapshot (data pulled Nov 10, 2026) and does not update with `data.js`. Update the 20-second clip with the new figures (vendor-reported significant changes only), re-export the GIF, replace the file, and update its alt text, caption and `data-snapshot` date in `dashboard/index.html` (look for "BI REFRESH FLAG").

Powered by Visit Anaheim Business Intelligence Team.

## Update: Nov 11, 2026

- Dashboard: side menu, click any chart for the selected value in words, new "In residents' own words" section (theme analysis of 786 written answers and a word meaning chart), summaries of views that go together and opportunities (both cities, Anaheim, Garden Grove), and an interactive "Respond and decide" page in the Decision guide.
- Only vendor-reported significance is shown. Margins of error were removed (they were not in any vendor report). Formulas behind every worked-out number are in Methodology and notes > Formulas.
- `records/`: wave register, question crosswalk, cumulative KPI table, data quality audit, written-answer themes, quotes, word data and insights (aggregate only).
- `data/`: reference database (`resident_sentiment.db`) and searchable facts.
- `pipeline/voices/`: coding rules and scripts for the written answers; `pipeline/build_dashboard_datasets.py` builds the summary and comparison tables.
- No respondent-level records or vendor source files are included.

## Update: Nov 11, 2026 (GIF)

- Overview: added the 20-second animated summary GIF (`dashboard/resident-sentiment-2026.gif`) under the headline, with alt text and source caption; excluded from PDF export. Flagged for refresh on every new data pull (README step 5). No data values changed.
- Moved the GIF to its own Overview page, "Animated summary" (after Summary), shown larger; the Summary page is text and numbers only again.
