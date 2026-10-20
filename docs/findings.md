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
