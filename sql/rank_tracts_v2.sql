-- v2: van only adds value where a safety-net clinic is not already close
WITH t AS (
  SELECT a.geo_id, a.total_pop, a.pct_uninsured,
         IF(b.pct_no_vehicle < 0, NULL, b.pct_no_vehicle) AS pct_no_vehicle,
         b.pct_checkup, b.pct_limited_english,
         b.latitude, b.longitude,
         a.km_to_any_care, a.km_to_safety_net, a.extra_km_if_uninsured
  FROM a4i_health.tract_access a
  LEFT JOIN a4i_health.burden_tracts b USING (geo_id)
  WHERE a.total_pop > 0 AND a.km_to_safety_net > 3
)
SELECT *,
  ROUND(PERCENT_RANK() OVER (ORDER BY pct_uninsured)
      + PERCENT_RANK() OVER (ORDER BY pct_no_vehicle)
      + PERCENT_RANK() OVER (ORDER BY km_to_safety_net)
      + PERCENT_RANK() OVER (ORDER BY pct_checkup DESC), 3) AS need_score
FROM t
ORDER BY need_score DESC
LIMIT 30
