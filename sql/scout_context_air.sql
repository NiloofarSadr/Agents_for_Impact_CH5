-- RESOLUTION: 12 km EPA grid wearing a tract ID. Report county-level only.
SELECT
  ROUND(MIN(mean_pm),2) AS min_mean_pm,
  ROUND(APPROX_QUANTILES(mean_pm,100)[OFFSET(50)],2) AS median_mean_pm,
  ROUND(MAX(mean_pm),2) AS max_mean_pm,
  ROUND(APPROX_QUANTILES(mean_pm,100)[OFFSET(90)] / APPROX_QUANTILES(mean_pm,100)[OFFSET(10)],3) AS p90_p10_ratio,
  ROUND(AVG(days_over_35),1) AS avg_days_over_35,
  'county summary (12 km grid) - cannot rank tracts' AS resolution
FROM a4i_health.exposure_tracts
