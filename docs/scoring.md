# How we score "needs the van"

Need score = sum of percentile ranks (higher = more need), tract level:
- pct_uninsured (PLACES, adults 18-64) - headline uninsured measure
- pct_no_vehicle (CDC SVI; -999 treated as missing)
- pct_checkup, reversed (low checkup = high need)

Default = Plan B (need only). Plan A added km_to_safety_net and a >3 km filter;
the auditor showed it reached Black uninsured residents at 0.53 of their share
(see findings.md), so it is kept as the "rejected first answer."

Not used for ranking: PM2.5 (12 km grid, 1.05x spread), disease_weekly (multi-county
region, latest week Aug 1 2026), race (audit only), shortage_areas (empty in Fulton).

Final 4 stops: chosen by build_plan from the top 30, at least 5 km apart.
