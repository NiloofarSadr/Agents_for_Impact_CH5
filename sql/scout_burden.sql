-- RESOLUTION: census tract. PLACES values are MODELED estimates, not counts.
SELECT geo_id, total_pop,
  pct_uninsured, pct_checkup, pct_asthma, pct_copd, pct_diabetes, pct_high_bp,
  pct_mobility_difficulty, pct_age_65_plus, pct_limited_english,
  'tract / modeled (CDC PLACES 2025)' AS resolution
FROM a4i_health.burden_tracts
WHERE geo_id IN UNNEST(@tract_ids)
