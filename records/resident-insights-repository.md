# Resident Sentiment: Deep-Dive Insights and Reference Repository

**Status:** Final · **Built:** Nov 11, 2026 by John Picou (BI) with Claude · **Data pulled:** Nov 10, 2026
**For:** Scott Oklin (CMO) and Sue O'Shea (VP Marketing)
**Covers:** Anaheim Baseline (Apr 2025), Wave 2 (Sep 2025), Wave 3 (May 2026), Wave 4 (Oct 2026); Garden Grove Wave 1 (May 2026), Wave 2 (Oct 2026)

## Executive summary

Residents who feel **informed** about tourism are the ones who feel **valued, benefit personally, and want to stay**. That pattern holds in both cities.

- **Anaheim, Wave 4:**
  - Among residents who feel well-informed, 72% say the city values residents over visitors (n=81). Among those who don't feel informed, 20% say so (n=116).
  - Among residents who understand tourism's tax benefits, 84% say tourism benefits them or their family (n=106). Among those who don't, 30% say so (n=91).
- **Garden Grove, Wave 2:**
  - Among residents who feel informed, 87% want to stay in the city for life (n=60). Among those who don't, 45% do (n=40).

These are two views that go together. They do not prove that informing residents causes the other views. Still, they point to one marketing lever: clear, resident-focused information about what tourism gives back.

## What the deep dive added

| What | Where it came from | What it lets us answer |
|---|---|---|
| Every chart value in all six vendor reports (2,036 values) | Vendor report slides, every wave | Questions that were reported but never put on the dashboard, such as offering value, barriers, career interest, Live Well personas and demographics for the earlier waves |
| Every crosstab cell by resident group (21,030 values) | Anaheim W4 and Garden Grove W2 crosstabs | Results by generation, gender, ZIP code, area of Anaheim, and tourism-worker household |
| Linked attitudes and group results (396 values) | BI tabulation of the two survey data files (aggregate only) | Which views tend to go together; results for homeowners vs renters, length of residence, and survey language |
| All report text (1,418 text blocks) | Vendor report slides | Searchable vendor commentary |

Everything lives in one reference database (resident_sentiment.db), with one searchable table of 23,927 values. The dashboard now has an **Ask the data** page that searches the 10,147 values that are reliable enough to show. Groups under 30 residents are kept in the database but not shown.

## Insight 1: Feeling informed goes with feeling valued

**Facts**
- **Anaheim W4.** Residents who say the city values residents over visitors:
  - 72% among those who feel well-informed (n=81), vs 20% among those who don't (n=116)
  - 61% among those who understand the tax benefits (n=106), vs 18% among those who don't (n=91)
- **Garden Grove W2.** Same measure: 72% among those who feel informed (n=60), vs 35% among those who don't (n=40).
- **Overall level in Anaheim.** The share who feel the city values residents over visitors fell from 52% at Baseline (n=269) to 42% in W4 (n=197). Source: Baseline report slide 28; W4 crosstabs C6r3.

**Marketing analysis**
- **Who:** All adult residents. The biggest group to reach is the 59% of Anaheim residents who do not yet feel well-informed (116 of 197).
- **What:** Residents connect "being told what tourism does for us" with "the city cares about us."
- **When:** W4 (Oct 2026). Seeing this again in the next wave would confirm it is a stable pattern.
- **Where:** Citywide in both cities.
- **Why (unconfirmed):** Residents who see the return from tourism, such as taxes, jobs and amenities, may read it as the city putting residents first.
- **How:** Resident-facing content that makes the return visible, for example "your tourism dollars at work," park and road improvements, and resident offers.

**Value**
- **For the city:** A path to rebuild the 10-point drop in residents feeling valued.
- **For residents:** Clearer knowledge of what they get back.
- **For Visit Anaheim:** A measurable message test, with "feel informed" as the leading indicator.

## Insight 2: Personal benefit follows understanding, and discounts are the bridge

**Facts**
- **Anaheim W4.** Residents who say tourism benefits them or their family:
  - 84% among those who understand the tax benefits, vs 30% among those who don't
  - 80% among those who feel educated about tourism (n=115), vs 29% among those who don't (n=82)
- **Discount interest is near-universal:** 83% in Anaheim (n=197) and 91% in Garden Grove (n=100).
- **Homeowners lean more positive than renters in Anaheim:**

| Measure | Homeowners (n=85) | Renters (n=80) |
|---|---|---|
| Tourism benefits me or my family | 69% | 53% |
| Want to stay for life | 67% | 45% |
| Feel the city values residents | 47% | 38% |

**Marketing analysis**
- **Who:** Renters and newer residents are the softest group.
- **What:** A tangible offer, such as discounts, matters to almost everyone. Understanding the benefit is what links tourism to "me."
- **When:** Now, building on W4.
- **Where:** Anaheim renters. In Garden Grove, the renter group is too small to report: homeowners are 63 of 100 residents surveyed.
- **Why (unconfirmed):** Renters may see more of tourism's costs, such as cost of living and traffic, and less of its return.
- **How:** A resident discount program paired with a one-line "why this exists" message.

**Value**
- **For the city:** Broader resident support.
- **For residents:** Real savings.
- **For Visit Anaheim:** A trackable program with sign-ups as a measure between waves.

## Insight 3: In Garden Grove, attachment to the city travels with everything else

**Facts**
- **Garden Grove W2.** Among residents who want to stay for life (n=70), compared with those who don't (n=30):

| Measure | Want to stay for life | Don't |
|---|---|---|
| Feel the city values residents | 71% | 23% |
| Tourism benefits me or my family | 89% | 47% |
| Aware of Visit Anaheim | 77% | 47% |

- Want Disneyland information: 69% (n=100).

**Marketing analysis**
- **Who:** Long-term Garden Grove residents.
- **What:** Committed residents are the most receptive audience for Visit Anaheim.
- **When:** Wave 2 (Oct 2026).
- **Where:** Garden Grove, mostly ZIP codes 92840 to 92845.
- **Why (unconfirmed):** Pride in place may make residents more open to tourism messages.
- **How:** Lead with Disneyland and local updates, the most-wanted content.

**Value**
- **For the city:** Stronger civic pride.
- **For residents:** Relevant updates.
- **For Visit Anaheim:** A ready audience to rebuild awareness, which dropped from 85% to 68%.

## Insight 4: What we cannot answer yet, and what is needed

- **Gen Z in both cities and Boomers in Garden Grove:** too few residents to report (Anaheim Gen Z n=27, Garden Grove Gen Z n=13). Needed: a larger sample or a quota for these groups in the next wave.
- **Tourism-worker households:** too few to report (Anaheim n=3, Garden Grove n=7). Needed: the same as above.
- **Results by group for Anaheim Baseline–W3 and Garden Grove W1:** only the vendor reports exist for these waves. Needed: the respondent data files from the vendor (request through Sue O'Shea).
- **Whether a change is real or caused by the change of vendor or method:** this can't be separated without the vendors' methodology notes. Needed: questionnaires and fielding notes for every wave.

## Decision framework: where to focus resident marketing next

**Overlooked options:** a resident-only Disneyland info channel; renter-focused messaging; publishing a "tourism gives back" annual scorecard.

**Weighted criteria (100%)**

| Criterion | Weight |
|---|---|
| Moves residents feeling valued | 35% |
| Reach | 25% |
| Cost and effort | 20% |
| Measurable by next wave | 20% |

**Decision matrix (1–5, higher is better)**

| Option | Valued (35%) | Reach (25%) | Cost (20%) | Measurable (20%) | Weighted score |
|---|---|---|---|---|---|
| A. "Tourism gives back" information campaign | 5 | 4 | 4 | 4 | **4.35** |
| B. Resident discount program | 4 | 5 | 2 | 5 | 4.05 |
| C. Disneyland and local update channel for residents | 3 | 4 | 4 | 4 | 3.65 |
| D. Renter-focused outreach | 4 | 2 | 3 | 3 | 3.10 |

**Devil's advocate on A:** Information alone may feel like spin if residents don't also see a benefit. The link is a pattern, not proof. Pairing A with B reduces that risk.

**Recommendation (for Scott and Sue):** Lead with a "tourism gives back" information push, because feeling informed is the view most closely tied to residents feeling valued in both cities. Pair it with a resident discount offer so the message has something tangible behind it. Track "feel well-informed" and "city values residents" in the next wave to judge the result.

**Assumptions to verify**
- The patterns hold in the next wave.
- The vendor change did not shape the W4 results.
- Discount partners are available.

## How to update this when new data arrives

1. Add the new vendor files (report, crosstabs, data) to the project or SharePoint folder.
2. Run the pipeline in order. Each step rebuilds from the files, so earlier results are never edited by hand.
   1. `extract_decks.py`
   2. `extract_xtabs.py`
   3. `relationships.py`
   4. `build_repository.py`
   5. `build_page_facts.py`
3. Run the data quality audit on the new wave.
4. Upload the new `ask_facts.csv` to the dashboard's "All findings, every document" source. The Ask page then answers questions about the new wave with no page changes.
5. Re-check the four insights above. Each states the measures to watch.

## Sources

| Source | Documents |
|---|---|
| Anaheim vendor reports | Baseline (04/17/2025), Wave 2 (09/24/2025), Wave 3 (05/07/2026), Wave 4 (11/05/2026) |
| Anaheim Wave 4 data | Crosstabs (10/29/2026) and survey data (10/28/2026) |
| Garden Grove vendor reports | Wave 1 (05/28/2026) and Wave 2 (11/05/2026) |
| Garden Grove Wave 2 data | Crosstabs (11/02/2026) and survey data (11/05/2026) |

All results are unweighted, as delivered by the vendors. Results are shown in aggregate only.
