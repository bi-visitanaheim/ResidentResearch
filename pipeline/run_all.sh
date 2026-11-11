#!/bin/bash
# Rebuild the Resident Sentiment repository end to end. Copy the vendor files into /home/claude/src first
# (decks: ana_2025_apr.pptx ana_w2.pptx ana_w3.pptx ana_w4.pptx gg_w1.pptx gg_w2.pptx; workbooks: ana_w4_data/xtab.xlsx, gg_w2_data/xtab.xlsx).
set -e; cd "$(dirname "$0")"; mkdir -p out
python3 dump_workbooks.py && python3 extract_decks.py && python3 extract_xtabs.py && python3 relationships.py && python3 build_repository.py && python3 build_page_facts.py
echo "Done: out/resident_sentiment.db, out/facts.csv, out/ask_facts.csv"
