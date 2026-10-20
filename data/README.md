# data/

**This folder is empty, and that is the design.**

Everything this challenge uses is pulled live from its original publisher by
`notebooks/c5_01_load_explore.ipynb` and loaded straight into BigQuery in **your** project. Nothing
is pre-cleaned and handed to you, because the cleaning decisions *are* the teaching—a shipped table
would hide nine real defects in federal data that you should see happen.

If a publisher is having a bad morning, `bash scripts/load.sh <COUNTY_FIPS>` rebuilds the identical
tables from a Cloud Storage snapshot instead.

## Where the data actually lives

After the notebook or `load.sh` runs, in `<your-project>.a4i_health`:

| Table | Grain | What it holds |
|---|---|---|
| `burden_tracts` | one row per census tract | uninsured, routine checkup, asthma, COPD, diabetes, blood pressure, four disability measures, lack of transportation (`pct_lack_transport`, NULL in 11 states), no-vehicle households, over-65 and under-17 share, limited English, no internet, three SVI theme scores, and a centroid |
| `exposure_tracts` | one row per census tract | mean and maximum PM2.5, and days over 12, 20, 25 and 35 µg/m³ |
| `tract_access` | one row per census tract | distance to the nearest care site of any kind, distance to the nearest safety-net site, and the difference between them |
| `care_sites` | one row per facility | every federally recognized care site inside your county, with coordinates, address and `site_kind` |
| `care_sites_state` | one row per facility | the same for the whole state, before the county filter—useful when the nearest clinic is over the county line |
| `shortage_areas` | one row per HRSA designation | where the federal government says a **neighborhood** is underserved, with `HPSA_SCORE`. Legitimately empty in four of our six counties |
| `shortage_facilities` | one row per HRSA designation | where a **clinic** serves an underserved population. This marks where care already *is*. Not the same thing, and never `UNION` it with the one above |
| `disease_weekly` | one row per week | emergency-department visit percentages for COVID, influenza and RSV—**a multi-county Health Service Area figure written onto a county key** |

**Three of those tables are not what their grain suggests, and the README says which.**
`exposure_tracts` carries an eleven-digit tract ID over a 12 km modeling surface.
`disease_weekly` describes a region, not a county and certainly not a tract. And `shortage_areas`
is empty in the default county for a real reason rather than a broken load.

## If you add your own data

You may, and it earns credit—but the license rules on the challenge card apply to anything you
bring, and they are not a formality. A winning project gets promoted publicly, so an unchecked
share-alike or non-commercial source becomes somebody else's legal problem.

Two traps specific to this domain. **Federal funding does not imply federal license terms**—the best
transit-accessibility dataset in the country is FHWA-sponsored and CC BY-NC. And health data is full
of files that are technically aggregate and practically about individuals; **if a row could be one
person, it is an automatic rejection**, however useful it would have been.

Put small reference files here and commit them. Anything large, or anything pulled live, belongs in
BigQuery rather than in git.
