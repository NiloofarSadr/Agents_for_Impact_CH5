-- Plan C: need-only score, but only where the van adds access
-- (>2 km from an adult-accessible safety-net site; school clinics excluded)
WITH s AS (
  SELECT a.geo_id, a.total_pop, a.pct_uninsured,
    IF(b.pct_no_vehicle < 0, NULL, b.pct_no_vehicle) AS pct_no_vehicle,
    b.pct_checkup, b.latitude, b.longitude, x.km_to_safety_net_adult,
      PERCENT_RANK() OVER (ORDER BY a.pct_uninsured)
    + PERCENT_RANK() OVER (ORDER BY IF(b.pct_no_vehicle < 0, NULL, b.pct_no_vehicle))
    + PERCENT_RANK() OVER (ORDER BY b.pct_checkup DESC) AS need_score
  FROM a4i_health.tract_access a
  LEFT JOIN a4i_health.burden_tracts b USING (geo_id)
  JOIN a4i_health.tract_access_adult x USING (geo_id)
  WHERE a.total_pop > 0)
SELECT * EXCEPT(need_score), ROUND(need_score,3) need_score
FROM s WHERE km_to_safety_net_adult > 2
ORDER BY need_score DESC LIMIT 30
