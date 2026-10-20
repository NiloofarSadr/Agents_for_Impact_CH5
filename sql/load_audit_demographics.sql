-- Audit-only demographics table in separate dataset `a4i_audit` (§3.1 & §5.3).
-- Source: `bigquery-public-data.census_bureau_acs.censustract_2020_5yr` (most recent tract-level 5-year ACS table).
-- Filtered to Fulton County, GA (FIPS prefix '13121').
-- Census data is a US government work in the public domain.
-- FIREWALL RULE: Nothing outside the Auditor's `audit_tools` toolset may read `a4i_audit.tract_demographics`.

CREATE SCHEMA IF NOT EXISTS `a4i_audit`
OPTIONS (
  location = 'US',
  description = 'Audit-only demographic data for post-planning equity review (Fulton County, GA).'
);

CREATE OR REPLACE TABLE `a4i_audit.tract_demographics` AS
SELECT
  LPAD(CAST(geo_id AS STRING), 11, '0') AS geo_id,
  CAST(total_pop AS INT64) AS total_pop,
  CAST(black_pop AS INT64) AS black_pop,
  CAST(white_pop AS INT64) AS white_pop,
  CAST(hispanic_pop AS INT64) AS hispanic_pop,
  CAST(asian_pop AS INT64) AS asian_pop,
  CAST(amerindian_pop AS INT64) AS amerindian_pop,
  CAST(other_race_pop AS INT64) AS other_race_pop,
  CAST(two_or_more_races_pop AS INT64) AS two_or_more_races_pop
FROM `bigquery-public-data.census_bureau_acs.censustract_2020_5yr`
WHERE STARTS_WITH(LPAD(CAST(geo_id AS STRING), 11, '0'), '13121');

