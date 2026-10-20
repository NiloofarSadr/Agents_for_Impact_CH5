-- AUDITOR ONLY. Race is never a planner input; it audits the output.
-- Source: US Census ACS 2020 5-year (public domain)
WITH acs AS (
  SELECT geo_id, total_pop, white_pop, black_pop, hispanic_pop, asian_pop
  FROM `bigquery-public-data.census_bureau_acs.censustract_2020_5yr`
  WHERE geo_id LIKE '13121%'
),
picked AS (
  SELECT geo_id FROM UNNEST(@tract_ids) AS geo_id
)
SELECT
  grp,
  CAST(SUM(total_pop) AS INT64)                   AS people,
  ROUND(100*SUM(black_pop)/SUM(total_pop),1)      AS pct_black,
  ROUND(100*SUM(hispanic_pop)/SUM(total_pop),1)   AS pct_hispanic,
  ROUND(100*SUM(white_pop)/SUM(total_pop),1)      AS pct_white,
  ROUND(100*SUM(asian_pop)/SUM(total_pop),1)      AS pct_asian
FROM (
  SELECT 'county' AS grp, * FROM acs
  UNION ALL
  SELECT 'plan', acs.* FROM acs JOIN picked USING (geo_id)
)
GROUP BY grp
