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
