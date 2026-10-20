-- Add-on: clinic opening hours as capacity (HRSA TOT_OPER_HR_PER_WEEK)
-- Safety net = HRSA Health Center sites + FQHCs. FQHC hours unknown -> assumed open
-- (so this is a LOWER BOUND on the effect). Straight-line, federal sites only.
WITH tracts AS (
  SELECT geo_id, ST_GEOGPOINT(longitude, latitude) AS pt FROM a4i_health.burden_tracts
),
sn AS (
  SELECT ST_GEOGPOINT(longitude, latitude) AS pt, site_kind, TOT_OPER_HR_PER_WEEK AS hrs
  FROM a4i_health.care_sites
  WHERE site_kind IN ('Health Center site', 'FQHC')
)
SELECT t.geo_id,
  ROUND(MIN(ST_DISTANCE(t.pt, sn.pt))/1000, 2) AS km_any_safety_net,
  ROUND(MIN(IF(sn.hrs IS NULL OR sn.hrs >= 20, ST_DISTANCE(t.pt, sn.pt), NULL))/1000, 2) AS km_safety_net_20h
FROM tracts t CROSS JOIN sn
GROUP BY t.geo_id
