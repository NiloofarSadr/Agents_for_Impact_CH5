-- Distance to nearest safety-net site EXCLUDING school-based clinics (may serve students only).
-- Saved as a4i_health.tract_access_adult. Straight-line, federal sites only.
WITH tracts AS (SELECT geo_id, ST_GEOGPOINT(longitude, latitude) pt FROM a4i_health.burden_tracts),
sn AS (SELECT ST_GEOGPOINT(longitude, latitude) pt FROM a4i_health.care_sites
       WHERE site_kind IN ("Health Center site","FQHC")
         AND IFNULL(HCC_LOC_SETTING_DESC,"") != "School"
         AND NOT REGEXP_CONTAINS(LOWER(FACILITY_NM), r"school|elementary|academy"))
SELECT t.geo_id, ROUND(MIN(ST_DISTANCE(t.pt, sn.pt))/1000, 2) AS km_to_safety_net_adult
FROM tracts t CROSS JOIN sn GROUP BY t.geo_id
