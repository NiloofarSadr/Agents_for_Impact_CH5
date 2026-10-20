# Audit findings (Fulton County, GA)

Benchmark: county uninsured population (ACS 2020 race x PLACES uninsured 18-64).
Approximation: assumes uninsured residents share their tract's racial mix.
Flag rule: four-fifths rule, ratio < 0.8 -> flag, routed to the human.

| Plan | Black | Hispanic | White | Asian | Est. uninsured reached |
|---|---|---|---|---|---|
| A: distance-weighted (v2) | 0.53 FLAG | 3.08 | 1.05 | 1.63 | 13,513 |
| B: need-only | 0.99 | 2.00 | 0.72 FLAG | 0.83 | 15,286 |

- Black residents are 54% of Fulton's uninsured but 43% of its population.
- The distance term pulled the plan to North Fulton, far from clinics but lower need.
- First audit benchmark (total population) was wrong for a needs-targeted program; replaced with uninsured population.
- Neither plan passes for every group; the trade-off goes to the outreach lead.
- Caveats: tract-level ACS margins of error; PLACES values are modeled; top-30 pools, not final 4.

## Add-on checks
**Clinic hours (HRSA TOT_OPER_HR_PER_WEEK):** 5 of 30 health center sites open <20 h/week (min 4 h).
Counting only sites open >=20 h moves just 2 tracts >1 km farther (max 1.29 km). Lower bound:
hours unknown for all 23 FQHCs. In Fulton, opening hours do not change the access picture.

**Confidence intervals (PLACES ACCESS2, 2023 BRFSS):** the top 2 tracts (34.6% uninsured) overlap
only 4 lower-ranked tracts - a real signal. From rank 3 on, each tract's CI overlaps 35-67
lower-ranked tracts: a statistical tie. Planner rule: overlapping CIs = tied; break ties by
pct_no_vehicle and >=5 km spacing. Table: a4i_health.places_ci (script: scripts/fetch_places_ci.py).

**School-based clinics (prompted by a teammate's prison question):** USP Atlanta (federal prison)
is only in shortage_facilities, which we never use for distance: 0 tracts affected. But 9+ safety-net
sites are School settings that may serve students only. Excluding them:
- tracts farther from a safety-net site than from any care: 135 (41%) -> 194 (60%)
- worst distance to a safety-net site: 28.6 km -> 39.8 km
- tract 13121010214: 8.1 km -> 19.5 km
Reported as a range (some school clinics serve the community). Plan B and its audit are
unaffected (no distance term). Table: a4i_health.tract_access_adult (sql/tract_access_adult.sql).

## Plan C (recommended): need-only score, only tracts >2 km from an adult-accessible safety-net site
Plan B's top picks sat 0.45-0.83 km from existing clinics, so a van adds little there.
| Plan (top 30) | Est. uninsured | Black | Hispanic | White | Asian |
|---|---|---|---|---|---|
| A distance | 13,513 | 0.53 FLAG | 3.08 | 1.05 | 1.63 |
| B need only | 15,286 | 0.99 | 2.00 | 0.72 FLAG | 0.83 |
| C need + van adds access | 17,747 | 1.00 | 2.56 | 0.62 FLAG | 0.50 FLAG |
Four Saturdays (>=5 km apart): 13121011431, 13121010125, 13121006900, 13121006602.
Flags go to the outreach lead; Asian group is small, so its ratio is noisy.

## Final 4 Saturdays (audited as a set, not as a pool)
Greedy spacing on Plan C gave 11431/10125/06900/06602: Black ratio 0.45 -> FLAG. Lesson: audit the
final stops, not the candidate pool. Exhaustive search (scripts/pick4.py: top 15, all 4-combos
>=5 km apart, 623 tested) -> recommended: 13121010125, 13121006900, 13121011307, 13121009405
(need 9.16; BigQuery audit: Black 1.02, Hispanic 0.81, White 0.88, Asian 1.04; no flags).
Alternative: 06900/11421/11307/09405 (need 9.01, ~22% more uninsured reached, no flags).
Trade-off surfaced to the human: 11431 (34.6% uninsured, top tract) appears in no passing set.
Small sample (~2,150 est. uninsured) -> ratios are noisy.
