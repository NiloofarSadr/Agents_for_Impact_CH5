# Data lane handoff - read before building, slides, or video

Fulton County, GA (13121) | Track: Siting (audit + explanation agents behind it)
All numbers verified in BigQuery. Sources: docs/findings.md, sql/, scripts/.

## 1. TL;DR
- Final plan: 4 Saturdays at tracts 10125, 06900, 11307, 09405. Passes the equity audit for every group.
- The system rejected its own answer 3 times before reaching it (this is our demo story).
- Several earlier numbers are OUTDATED - see section 6 before you put any number on a slide.

## 2. The Clinic Plan (use exactly these in the mockup and demo)
| Sat | Tract       | People | Uninsured | No car | Checkup | km to adult safety-net | Reason |
|-----|-------------|--------|-----------|--------|---------|------------------------|--------|
| 1   | 13121010125 | 3,251  | 12.9%     | 31.6%  | 73.7%   | 20.1                   | Farthest from care; 1 in 3 households no car |
| 2   | 13121006900 | 3,733  | 14.8%     | 20.5%  | 74.5%   | 3.2                    | High need, south Atlanta |
| 3   | 13121011307 | 4,631  | 18.0%     | 22.9%  | 77.8%   | 4.8                    | Most uninsured of the four |
| 4   | 13121009405 | 4,332  | 7.9%      | 20.9%  | 70.3%   | 2.4                    | Lowest checkup rate of the four |
Labels: tract level. Uninsured/no car/checkup = modeled or survey estimates.
Distances = straight-line to federally listed sites, school clinics excluded. Stops >= 5 km apart.

Audit of these 4 (plan share / county uninsured share; < 0.8 = flag):
Black 1.02 | Hispanic 0.81 (borderline) | White 0.88 | Asian 1.04  -> no flags

What we could not do (say it out loud):
- Tract 13121011431 (34.6% uninsured, the most uninsured tract in Fulton) is in NO passing plan.
  Its uninsured residents are ~75% Hispanic; any 4-stop set with it pushes other groups below 0.8.
  This trade-off goes to the outreach lead. Suggested: next month's first Saturday, Spanish navigator.
- Stop 4 is the weakest on uninsured (7.9%); it is there for low checkup + car access.
- Ratios rest on ~2,100 estimated uninsured people across 4 tracts -> noisy.

## 3. The demo story: three rejections
| Attempt | What happened | Why rejected |
|---|---|---|
| Plan A: need + distance | Pool reached Black uninsured residents at 0.53 of their share | Auditor flag (equity) |
| Plan B: need only | Passed audit (0.99), but top picks 0.45-0.83 km from existing clinics | Van adds no access |
| Plan C, first 4 picks | Pool passed, but greedy spacing picked 2 North Fulton tracts -> Black 0.45 | Auditor flag on the final set |
| Final 4 (searched 623 spaced

cat >> docs/HANDOFF.md <<'EOF'

## 4. Agent lane
Tables (dataset a4i_health):
- tract_access_adult (NEW): km_to_safety_net_adult - school clinics excluded. Use this for access.
- places_ci (NEW): PLACES confidence intervals (ACCESS2 = uninsured, CHECKUP).
SQL (sql/): rank_tracts_plan_c.sql = planner default (A = rank_tracts_v2, B = rank_tracts_need_only, kept for comparison)
           scout_burden / scout_access (take tract_ids) | scout_context_disease / scout_context_air (no params)
           audit_demographics_v2.sql = AUDITOR ONLY, takes tract_ids
Rules to implement:
1. build_plan: from Plan C top 15, pick the highest-need 4-stop set, all >= 5 km apart, that passes
   the audit. Logic is in scripts/pick4.py. Tracts with overlapping CIs are ties - do not over-rank.
2. Auditor runs on state.plan (the final 4), never on the candidate pool.
3. Composer: method problem (spacing, wrong scale, next to a clinic) -> back to planner;
   equity flag that cannot be fixed -> to the human with the trade-off written out.
4. Every claim carries its scale (each SQL row has a `resolution` column - quote it):
   - "Is COVID rising here?" -> "Regionally (Clayton, DeKalb, Fulton, Gwinnett), as of week ending
     Aug 1 2026, COVID ER visits rose 0.07% -> 0.28%. I cannot tell you about this neighborhood."
   - Air quality: county-level only (tract spread 1.05x on a 12 km grid). Never rank tracts on it.
   - Shortage areas: Fulton has 0 active (all 99 Proposed For Withdrawal). Say "no signal", not "no problem".
5. Explainer: language per stop from pct_limited_english (all 4 stops are 0-5%; stop 2 = 5.3%).
   English first; Spanish justified at stop 2. Plain words, 6th-grade level.
Test: the 7 questions in the README. The final plan in the demo must equal section 2.

## 5. Front end lane
- Map: 4 pins (section 2 tracts); optionally 11431 in grey as "not chosen - human decision".
- Show the disagreement: planner draft -> auditor flag -> revised plan. This is our demo moment.
- Per stop: the reason line + the scale label. Keep the "what we could not tell you" panel visible.

## 6. Story lane - numbers (use these, replace old ones)
| Topic | USE NOW | OUTDATED - do not use |
|---|---|---|
| Safety-net gap | 41-60% of 326 tracts (135-194) farther from adult safety-net than from any care | "135 (41%)" alone |
| Worst distance | 28.6-39.8 km | "28.6 km" alone |
| Tract 10214 | 43% households no car; 8.1 km to nearest listed site (a school clinic); 19.5 km if students-only | "8.1 km to nearest clinic" |
| Tract 10214 role | Example of the access gap only - NOT a stop (rank 65) | stop 1 in mockup |
| Recommended plan | Final 4 in section 2 | Plan B as default |
| Audit headline | 0.53 -> passes at final set (1.02 / 0.81 / 0.88 / 1.04) | 0.99 as final result |
Other verified facts:
- Air: PM2.5 varies 1.05x across Fulton (8.98-9.81) - a 12 km grid, cannot rank neighborhoods.
- Ranking confidence: top 2 uninsured tracts are statistically distinct; from #3 on, 35-67 tracts tie.
- Clinic hours: 5 of 30 health center sites open < 20 h/week (min 4 h); changes little; FQHC hours unknown.
- Prison check: USP Atlanta only in shortage_facilities (never used for distance) - 0 tracts affected.
Measured vs modeled: measured = clinic locations/hours, distances | survey = ACS race, SVI no-vehicle |
modeled = PLACES uninsured/checkup/disease, PM2.5 | regional = disease trends (4 counties, to Aug 1 2026).
Limitations (one line each): straight-line not travel time; federal clinics only (real access may be closer);
school clinics may or may not serve adults; 0 active shortage areas; no transport-barrier measure in data
(used no-vehicle); audit assumes uninsured share their tract's racial mix; 4-stop ratios are noisy.
Video line (Speaker 2): "A teammate asked if a prison was counted as a clinic. It wasn't - but checking
showed school clinics were making access look up to 11 km better than it is."
