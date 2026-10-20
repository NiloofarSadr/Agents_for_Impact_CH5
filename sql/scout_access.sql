-- RESOLUTION: tract centroid to facility point. Straight-line km, federal sites only,
-- stops at county line -> every distance is an UPPER BOUND.
SELECT a.geo_id, a.km_to_any_care, a.km_to_safety_net, a.extra_km_if_uninsured,
  IF(b.pct_no_vehicle < 0, NULL, b.pct_no_vehicle) AS pct_no_vehicle,
  'tract / straight-line, federal sites only' AS resolution
FROM a4i_health.tract_access a
LEFT JOIN a4i_health.burden_tracts b USING (geo_id)
WHERE a.geo_id IN UNNEST(@tract_ids)
