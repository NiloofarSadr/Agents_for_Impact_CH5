-- AUDITOR ONLY. Benchmark = county's uninsured population, not total population.
-- Approximation: assumes uninsured residents share their tract's racial mix.
WITH acs AS (
  SELECT a.geo_id,
         a.total_pop * b.pct_uninsured/100 AS w,   -- est. uninsured people
         a.black_pop/a.total_pop  AS s_black,
         a.hispanic_pop/a.total_pop AS s_hisp,
         a.white_pop/a.total_pop  AS s_white,
         a.asian_pop/a.total_pop  AS s_asian
  FROM `bigquery-public-data.census_bureau_acs.censustract_2020_5yr` a
  JOIN a4i_health.burden_tracts b USING (geo_id)
  WHERE a.total_pop > 0
),
picked AS (SELECT geo_id FROM UNNEST(@tract_ids) AS geo_id),
g AS (
  SELECT 'county_uninsured' AS grp, * FROM acs
  UNION ALL
  SELECT 'plan', acs.* FROM acs JOIN picked USING (geo_id)
)
SELECT grp,
  CAST(SUM(w) AS INT64)                  AS est_uninsured,
  ROUND(100*SUM(w*s_black)/SUM(w),1)     AS pct_black,
  ROUND(100*SUM(w*s_hisp)/SUM(w),1)      AS pct_hispanic,
  ROUND(100*SUM(w*s_white)/SUM(w),1)     AS pct_white,
  ROUND(100*SUM(w*s_asian)/SUM(w),1)     AS pct_asian
FROM g GROUP BY grp
