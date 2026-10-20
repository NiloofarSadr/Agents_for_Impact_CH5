-- Plan B: need only, no distance term (for the human to compare)
SELECT a.geo_id
FROM a4i_health.tract_access a
LEFT JOIN a4i_health.burden_tracts b USING (geo_id)
WHERE a.total_pop > 0
ORDER BY
    PERCENT_RANK() OVER (ORDER BY a.pct_uninsured)
  + PERCENT_RANK() OVER (ORDER BY IF(b.pct_no_vehicle < 0, NULL, b.pct_no_vehicle))
  + PERCENT_RANK() OVER (ORDER BY b.pct_checkup DESC) DESC
LIMIT 30
