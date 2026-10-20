-- RESOLUTION: Health Service Area (multi-county), written onto a county key.
-- NEVER report this for a neighborhood or tract.
SELECT week_end, hsa, hsa_counties,
  percent_visits_smoothed_covid, percent_visits_smoothed_influenza, percent_visits_smoothed_rsv,
  ed_trends_covid, ed_trends_influenza, ed_trends_rsv,
  'regional (HSA, multi-county) - not neighborhood' AS resolution
FROM a4i_health.disease_weekly
ORDER BY week_end DESC
LIMIT 8
