# Data Quality Audit — Resident Sentiment (Anaheim Baseline–W4, Garden Grove W1–W2)

**Status:** Final · **Audit date / pull date:** 2026-11-10 · **Requested by:** John Picou · **Skill:** data-quality-audit
**Scope:** 6 vendor report decks, plus the respondent data and crosstabs for Anaheim W4 (n=197) and Garden Grove W2 (n=100). For Anaheim Baseline–W3 and GG W1, the decks are the only source; no respondent data was provided.

## Summary

The two newest waves are usable. The W4 and GG W2 respondent files are clean on identity, eligibility, and core skip logic, and the KPI values tie to the vendor crosstabs and decks within 1 point. Five issues change how results should be read or published:

1. **CRITICAL — Anaheim W4 "Visit Anaheim channels used" (E3) is invalid.** The question went to the wrong respondents. See finding 1. Suppressed.
2. **CRITICAL — The Garden Grove W2 Key Findings slide mislabels three KPIs.** The vendor's KPI chart, crosstabs, and data all agree; the slide 3 narrative doesn't. See finding 2.
3. **HIGH — Garden Grove's large W1→W2 swings coincide with changes in vendor, mode, language, and sample composition.** The data is unweighted, so these effects can't be separated from real change.
4. **HIGH — Common Good's W4 significance flags are more lenient than a standard test.** Five of nine W4 Anaheim flags are not confirmed by a two-proportion test at 95%.
5. **HIGH — Documentation gaps.** No questionnaires, codebooks, or weighting/method notes for any wave. W2/W3 field dates, mode, and languages are unknown.

## Scorecard

| Dimension | Anaheim W4 data | GG W2 data | Deck-only waves (ANA BL–W3, GG W1) |
|---|---|---|---|
| Uniqueness (IDs, duplicate rows) | Pass | Pass | Not testable |
| Validity (eligibility, codes in range) | Pass | Pass | Not testable |
| Completeness (KPI items answered) | Pass | Pass | Partial: subgroup bases for W2/W3 not reported |
| Consistency (skip logic) | **Fail on E3** | Pass | Not testable |
| Accuracy (data ↔ crosstab ↔ deck) | Pass within 1 pt | Pass (exact) | Pass: deck values match the W4 / GG W2 trend charts |
| Timeliness (field dates) | Pass | Mismatch (deck vs data) | W2/W3 not stated |
| Documentation | Partial (datamap only) | Partial (datamap only) | Missing |

## Findings

| # | Severity | Wave | Finding | Evidence | Effect on conclusions / action |
|---|---|---|---|---|---|
| 1 | CRITICAL | ANA W4 | E3 (which Visit Anaheim channels were used) was routed to non-users. 124 respondents who answered No/Unsure at E2 got E3; the 73 E2=Yes respondents (74 in the crosstab) did not. | Data: E3 answered by E2=No (103) and Unsure (21). Crosstab E3 base = 123. Deck slide 11 labels the base "n=74" but shows the n=123 percentages (website 33%, Facebook 24%, Instagram 15%). | The W4 channel results and the deck's statement that channel engagement "declined from baseline" are not supported. **Suppressed** from the dashboard. Ask Common Good to confirm and re-field or withdraw. E2 (overall use, 38%) is unaffected. |
| 2 | CRITICAL | GG W2 | The Key Findings slide (3) mislabels three KPIs. It says non-resident recommendations rose 49%→74% (that is impact of tourism), overall impact slipped 66%→60% (that is non-resident recommendations), and resident recommendations rose 66%→79% (that is tourism sentiment; resident recommendations went 76%→79%). | KPI chart positions on slide 5 match the crosstabs (C1 79%, C2 74%, B4 79%, B6 60%) and the respondent file exactly. | The gaps (6–25 pts) exceed the 1-point stop rule, so they're reported here. The values agree across the three vendor data sources, so the dashboard uses them, flagged "vendor narrative conflict – confirmation requested." None of Sue O'Shea's Nov 9 checkpoints are affected. |
| 3 | HIGH | GG W1→W2 | Unweighted sample composition shifted sharply: Asian 51%→31%, White non-Hispanic 24%→51%, Hispanic 25%→14%, homeowners 35%→63%, married 57%→79%. The vendor (Olinger→Common Good), mode (adds CATI), and languages (Spanish dropped) also changed. | GG W2 deck slides 12 (W2) and 13 (W1) demographics; wave register. | GG swings of 13–48 pts are statistically significant, but method and composition changes could contribute. Cause is not assigned. Every GG trend view carries this caveat. |
| 4 | HIGH | GG W2 | Narrow respondent profile: 73% male, 85% employed full-time, 48% household income $75–99K, ages 20–66 (median 40), no Boomers. | GG W2 data P1, P5, P7, S1. | Representativeness can't be assessed (no population targets or weights provided). Ask the vendor for quota targets and sample source. |
| 5 | HIGH | ANA W4 | Five of nine vendor significance flags are not confirmed by a two-tailed pooled two-proportion test at 95%: VA awareness +7 (p≈0.13), impact +7, educated +7, stay +7, used communications +9 (p≈0.07). W3's −8 on used communications is also not confirmed (p≈0.08). | BI tests in cumulative-kpi-table.csv. | Dashboard labels significance as "vendor-reported" and "BI test" separately. Headlines should not call these changes significant without qualification. Ask the vendor for its test method. |
| 6 | HIGH | All | No questionnaires, codebooks, weighting notes, or methodology notes in the SharePoint folder. W2/W3 field dates, mode, and languages are not stated. No respondent data for ANA Baseline–W3 or GG W1. | SharePoint RESEARCH RESULTS listing (7 files). | Earlier-wave values come from vendor decks only and can't be recomputed. W2/W3 subgroup bases (familiarity, VA sentiment) are unknown, so BI tests for those comparisons can't be run. |
| 7 | MEDIUM | ANA W4 | The respondent data file (10/28) and crosstabs (10/29) differ by one respondent on several items (e.g., awareness 70.6% vs 71.1%; E2 37.1% vs 37.6%; values residents 41.1% vs 41.6%; familiarity base 139 vs 140). | Data vs crosstab totals. | All gaps ≤1.0 pt. The cumulative table uses the crosstab and deck values. Ask the vendor for the final data file. |
| 8 | MEDIUM | ANA W4 | The crosstabs omit C2 (impact of tourism). | Crosstab TOC. | The deck shows 64%; the data file gives 63.5% (125/197). Within tolerance. |
| 9 | MEDIUM | GG W2 | Field dates differ: deck Oct 20 – Nov 2, data Oct 26 – 30. No mode variable to confirm the CATI completes. Language: 94 English, 6 Vietnamese. | Data timestamps; QLang. | Register shows both. Confirm with vendor. |
| 10 | MEDIUM | GG W1 | Internal inconsistency: the executive summary says 51% feel tourism positively impacts daily life, but the C2 slide shows 49%. 51% is the personal-benefit statement. | GG W1 deck slides 4, 24, 27. | Trend uses 49%, which matches the GG W2 deck's W1 value. |
| 11 | MEDIUM | GG W1 | Multi-select endorsement in W1 is unusually high compared with W2 (offerings awareness: retail 98%, fine dining 92%; preferred channels: flyers 75%, mobile apps 68%; VA communications use 71%). | GG W1 and W2 decks. | Without W1 respondent data, W1 response quality can't be tested. This may contribute to W1→W2 swings, especially the −48 pt change in VA communications use. |
| 12 | MEDIUM | ANA W4 | Straightlining: 29 of 197 (15%) gave the same answer to all eight C6 statements (13 all "strongly agree"). GG W2: 3 of 100. | Data C6r1–8 / C8r1–7. | Respondents retained; no exclusions without approval. Could slightly inflate W4 agreement scores. |
| 13 | MEDIUM | GG W2 | Some open-ends read as polished or templated. The honeypot check flagged 0 of 100. | B9, A2–A4 verbatims. | Ask the vendor to describe its fraud and quality controls. |
| 14 | LOW | GG W2 | E3 base n=23 (<30). | Crosstab E3. | Suppressed under project rules. |
| 15 | LOW | ANA BL | The deck reports two impact figures (63% "has impact" either way; 54% positive). Recommendation items use base n=267. | Baseline deck slides 18, 19, 22, 23. | Trend uses 54% positive top-2-box, matching the vendor trend; n=267 used for recommendations. |
| 16 | LOW | ANA W3 | Chart category labels list two waves for three values on the awareness chart. | W3 deck slide 3. | Values match the W4 trend; cosmetic only. |

**Checks passed (W4 and GG W2 data):** unique record IDs and no duplicate rows; all records "qualified"; all ages 18+ (19–80 and 20–66); all California / Orange County; ZIPs within accepted lists; 0 advertising or market-research households; awareness → familiarity → sentiment skip logic correct in both files; GG E3 routing correct; honeypot 0 flagged; GG W2 crosstab equals the data file on every KPI.

## Reconciliation to Sue O'Shea's Nov 9, 2026 checkpoints

| Checkpoint (reported) | Verified value | Source | Result |
|---|---|---|---|
| Anaheim awareness of Visit Anaheim 63% → 71% | 63% (BL, n=269) → 71% (W4, 71.1%, n=197) | Baseline deck slide 10; W4 crosstab A2 | Confirmed. Note: +8 vs Baseline is not significant at 95% (p≈0.07). |
| Anaheim tourism sentiment improved | 68% → 78% (78.2%) | Baseline deck slide 22; W4 crosstab C1 | Confirmed. Significant vs W3 and vs Baseline. |
| Anaheim perceived personal impact ~59%, flat | 61 / 60 / 60 / 59% (59.4%) | W4 deck slide 7; crosstab C6r7 | Confirmed |
| Anaheim values residents over visitors 42%, down from 52% | 52% → 42% (41.6%) | Baseline deck slide 28; crosstab C6r3 | Confirmed. −10 vs Baseline is significant. |
| GG positive sentiment held at 83% | 84% → 83% | GG W1 deck slide 8; GG W2 crosstab A1 | Confirmed. This is sentiment toward Garden Grove, not toward tourism. |
| GG personal benefit from tourism 51% → 76% | 51% → 76% | GG W1 deck slide 27; crosstab C8r6 | Confirmed (significant) |
| GG awareness of Visit Anaheim 85% → 68% | 85% → 68% | GG W1 deck slide 11; crosstab A5 | Confirmed (significant) |
| GG favorability 86% → 72% | 86% (n=73) → 72% (72.3%, n=65) | GG W1 deck slide 12; crosstab A7 | Confirmed (significant). Base is residents familiar with Visit Anaheim. |
| Both cities want relevant info and resident value / discounts | Discounts 83% (ANA W4), 91% (GG W2); Disneyland updates 70% / 69% | Crosstabs C6r8, C8r7, C6r6, C8r5 | Confirmed |

**Computed vs vendor figures:** every W4 and GG W2 KPI ties to the vendor figure within 1.0 pt. The only discrepancies over 1 pt are finding 1 (W4 E3 base) and finding 2 (GG W2 narrative). Both are vendor reporting issues, not computation differences.
