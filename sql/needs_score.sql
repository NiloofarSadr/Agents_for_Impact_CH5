-- Need score ranking for Fulton County (FIPS 13121) census tracts.
-- Formula (§5.2):
--   uninsured_pr = PERCENT_RANK() OVER (ORDER BY pct_uninsured)   -- within Fulton, PLACES 18-64
--   access       = LEAST(km_to_safety_net / 8.0, 1.0)             -- from tract_access
--   mobility     = 0.5 + 0.5 * pctile_no_vehicle                  -- SVI national percentile (-999 -> NULL)
--   need_score   = uninsured_pr * access * mobility
-- Tiebreakers only (not in need_score): pct_diabetes DESC, pct_high_bp DESC, pct_checkup ASC.
-- Strictly excludes PM2.5 (exposure_tracts) and race/ethnicity demographics (a4i_audit).

WITH base AS (
  SELECT
    LPAD(CAST(b.geo_id AS STRING), 11, '0') AS tract_id,
    b.total_pop,
    b.latitude,
    b.longitude,
    b.pct_uninsured,
    b.pct_diabetes,
    b.pct_high_bp,
    b.pct_checkup,
    b.pct_asthma,
    b.pct_copd,
    b.pct_mobility_difficulty,
    NULLIF(b.pct_no_vehicle, -999) AS pct_no_vehicle,
    NULLIF(b.pctile_no_vehicle, -999) AS pctile_no_vehicle,
    NULLIF(b.pct_age_65_plus, -999) AS pct_age_65_plus,
    a.km_to_any_care,
    a.km_to_safety_net,
    a.km_to_safety_net AS safety_net_km,
    a.extra_km_if_uninsured,
    PERCENT_RANK() OVER (ORDER BY b.pct_uninsured ASC) AS uninsured_pr,
    LEAST(a.km_to_safety_net / 8.0, 1.0) AS access_factor,
    0.5 + 0.5 * COALESCE(NULLIF(b.pctile_no_vehicle, -999), 0.0) AS mobility_factor
  FROM `a4i_health.burden_tracts` AS b
  INNER JOIN `a4i_health.tract_access` AS a
    ON LPAD(CAST(b.geo_id AS STRING), 11, '0') = LPAD(CAST(a.geo_id AS STRING), 11, '0')
  WHERE b.pct_uninsured IS NOT NULL
    AND a.km_to_safety_net IS NOT NULL
)
SELECT
  ROW_NUMBER() OVER (
    ORDER BY
      (uninsured_pr * access_factor * mobility_factor) DESC,
      pct_diabetes DESC,
      pct_high_bp DESC,
      pct_checkup ASC
  ) AS need_rank,
  tract_id,
  ROUND(uninsured_pr * access_factor * mobility_factor, 4) AS need_score,
  ROUND(uninsured_pr, 4) AS uninsured_pr,
  ROUND(access_factor, 4) AS access_factor,
  ROUND(mobility_factor, 4) AS mobility_factor,
  pct_uninsured,
  ROUND(km_to_safety_net, 2) AS safety_net_km,
  ROUND(km_to_safety_net, 2) AS km_to_safety_net,
  ROUND(km_to_any_care, 2) AS km_to_any_care,
  ROUND(extra_km_if_uninsured, 2) AS extra_km_if_uninsured,
  pct_no_vehicle,
  pctile_no_vehicle,
  pct_diabetes,
  pct_high_bp,
  pct_checkup,
  pct_asthma,
  pct_copd,
  pct_mobility_difficulty,
  pct_age_65_plus,
  total_pop,
  latitude,
  longitude,
  'tract' AS scale,
  'modeled' AS kind
FROM base
ORDER BY need_rank ASC;

