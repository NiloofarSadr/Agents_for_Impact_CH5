-- "Needs the van" ranking, Fulton County (tract level only)
WITH t AS (
  SELECT
    a.geo_id,
    a.total_pop,
    a.pct_uninsured,                                   -- PLACES, adults 18-64 (headline)
    IF(b.pct_no_vehicle < 0, NULL, b.pct_no_vehicle) AS pct_no_vehicle,  -- SVI, -999 = missing
    b.pct_checkup,                                     -- LOW is bad
    b.pct_limited_english,                             -- for the flyer, not the score
    a.km_to_any_care,
    a.km_to_safety_net,
    a.extra_km_if_uninsured
  FROM a4i_health.tract_access a
  LEFT JOIN a4i_health.burden_tracts b USING (geo_id)
  WHERE a.total_pop > 0
)
SELECT
  *,
  ROUND(
      PERCENT_RANK() OVER (ORDER BY pct_uninsured)
    + PERCENT_RANK() OVER (ORDER BY pct_no_vehicle)
    + PERCENT_RANK() OVER (ORDER BY km_to_safety_net)
    + PERCENT_RANK() OVER (ORDER BY pct_checkup DESC)  -- low checkup = high need
  , 3) AS need_score
FROM t
ORDER BY need_score DESC
LIMIT 20
