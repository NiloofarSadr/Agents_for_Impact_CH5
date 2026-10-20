# Data Limitations and Scope Limits (Fulton County, GA)

This system performs **place-based planning only**. It never gives medical advice or discusses individuals.

## 1. Scale Limits and Resolution Gaps

Every number in the system carries explicit `scale` and `kind` metadata to prevent scale misuse:

1. **EPA PM2.5 Air Quality Model Grid (`grid_12km`)**:
   - Source: `a4i_health.exposure_tracts.pm25`
   - Nature: 12 km grid model resolution wearing tract IDs.
   - Limitation: Across all 327 Fulton County census tracts, the p90/p10 ratio is only 1.05x (9.92 vs 9.45 ug/m3). Air pollution values cannot distinguish high-need from low-need neighborhoods and must never be used to rank tracts. Reported at the county level only.

2. **CDC NHSN Respiratory Disease Trends (`hsa_region`)**:
   - Source: `a4i_health.disease_weekly.pct_ed_visits_resp`
   - Nature: Multi-county Health Service Area (HSA) metric shared across Clayton, DeKalb, Fulton, and Gwinnett counties.
   - Limitation: Every census tract in Fulton County inherits the exact same regional percentage (e.g. 2.91% latest week). It cannot differentiate neighborhoods. Refusal rule enforced: *"I can tell you about the region, not this street."*

3. **HRSA HPSA Geographic Shortage Designations (`fed_designation`)**:
   - Source: `a4i_health.shortage_areas.status`
   - Nature: Federal shortage-area geographic designations.
   - Limitation: Fulton County currently has **0 active shortage-area designations**. All 99 records carry status `"Proposed For Withdrawal"`.

4. **Safety-Net Operating Capacity (`facility_point`)**:
   - Source: `a4i_health.care_sites.weekly_hours`
   - Nature: Operating hours reported in federal HRSA records.
   - Limitation: 47 of the 51 safety-net clinic records report 0 weekly hours (only 4 report hours > 0), and 0 records report Saturday clinic hours.

5. **Straight-Line Centroid Distances (`computed_upper_bound`)**:
   - Source: `a4i_health.tract_access.km_to_safety_net`
   - Nature: Straight-line Euclidean distance from census tract centroid to nearest federally recognized safety-net clinic.
   - Limitation: Straight-line upper bound, not street driving, walking, or transit travel times. Excludes non-federal charitable clinics.

6. **CDC PLACES Small-Area Estimates and Missing Rows (`modeled`)**:
   - Source: `a4i_health.burden_tracts`
   - Nature: Model-based small-area estimates for adults 18–64.
   - Limitation: 25 of 327 Fulton tracts have NULL PLACES values (unpopulated or unmodeled). 1 tract (`13121980000`, Hartsfield-Jackson Airport) has missing SVI vehicle data (`-999`). No confidence interval columns (`_crude95ci`) exist in `burden_tracts`; near-ties within 5% are flagged as `"approximate, no CI loaded"`.

