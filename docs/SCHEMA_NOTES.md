# BigQuery Schema Notes (`a4i_health`)

Verified against live BigQuery dataset `qwiklabs-gcp-04-26e02fd45203:a4i_health` for Fulton County, GA (FIPS `13121`).

---

## 1. Key Findings & Answers to Pre-flight Questions

### Do `_crude95ci` confidence-interval columns exist in `burden_tracts`?
- **No.** None of the `*_crude95ci` confidence interval columns exist in `a4i_health.burden_tracts`. Only point-estimate prevalence columns (`pct_uninsured`, `pct_asthma`, `pct_copd`, `pct_diabetes`, `pct_high_bp`, `pct_checkup`, `pct_mobility_difficulty`, etc.) are present.
- **Implication for `tie_check` (§6.2):** Because CI columns are not present, `tie_check` must use the fallback rule: flag picks whose `need_score` is within 5% of the next unpicked tract, and label the rule `"approximate, no CI loaded"`.

### Distinct `site_kind` values and which count as "safety-net"
Queried from `a4i_health.care_sites` (Fulton County) and `a4i_health.care_sites_state` (Georgia statewide):

| `site_kind` | `care_sites` (Fulton) | `care_sites_state` (Georgia) | Counts as Safety-Net? | Notes |
|---|---:|---:|:---:|---|
| `FQHC` | 23 | 373 | **Yes** | CMS POS Federally Qualified Health Center |
| `Health Center site` | 30 | 443 | **Yes** | HRSA BPHC Health Center service delivery site |
| `Hospital` | 14 | 181 | **No** | CMS POS Hospital (acute/emergency, not sliding-scale primary care) |
| `Rural Health Clinic` | 0 | 93 | **No** | CMS POS Rural Health Clinic |
| `Critical Access Hospital` | 0 | 31 | **No** | CMS POS Critical Access Hospital |

- **Safety-net filter in SQL:** `WHERE site_kind IN ('FQHC', 'Health Center site')` (53 safety-net sites inside Fulton County; 816 statewide in Georgia).

### Important Column Name & Data Nuances
1. **Mobility column:** In raw CDC PLACES Socrata API (`yjkw-uj5s`), the column is `mobility_crudeprev_` (with a trailing underscore). In the loaded `a4i_health.burden_tracts` table, it has already been renamed to `pct_mobility_difficulty`.
2. **Distance columns in `tract_access`:** The real column names in `a4i_health.tract_access` are:
   - `km_to_any_care` (straight-line km to nearest federal care site of any kind)
   - `km_to_safety_net` (straight-line km to nearest federal safety-net site, i.e., `FQHC` or `Health Center site`)
   - `extra_km_if_uninsured` (`km_to_safety_net - km_to_any_care`)
   *(Note: §5.2 refers conceptually to `safety_net_km`; the actual column in `tract_access` is `km_to_safety_net`.)*
3. **Transport lack column (`pct_lack_transport`):** Not present in the `burden_tracts` snapshot table; vehicle access is measured via `pct_no_vehicle` and `pctile_no_vehicle` (CDC SVI).
4. **`disease_weekly.fips` type:** In the raw CDC Socrata endpoint `fips` is numeric (`13121`), whereas in the BigQuery snapshot table `disease_weekly.fips` is stored as `STRING` (`"13121"`). Using `SAFE_CAST(fips AS INT64) = 13121` handles both seamlessly without string quotes in the filter value.
5. **CDC SVI missing sentinel:** CDC SVI uses `-999` for missing values. Always apply `NULLIF(col, -999)` or filter `col >= 0`.
6. **Tract IDs:** Always 11-character zero-padded strings (`LPAD(CAST(geo_id AS STRING), 11, '0')`).

---

## 2. Table Schemas (`a4i_health`)

### `burden_tracts` (326 rows) — Scale: `tract`, Kind: `modeled` (PLACES) / `survey` (SVI)
| Column | Type | Source / Meaning |
|---|---|---|
| `geo_id` | `STRING` | 11-character census tract FIPS (`13121...`) |
| `total_pop` | `INTEGER` | Total population (CDC PLACES) |
| `pct_uninsured` | `FLOAT` | **Headline uninsured:** Adults aged 18–64 without health insurance (PLACES `access2_crudeprev`, modeled) |
| `pct_asthma` | `FLOAT` | Current asthma prevalence among adults (PLACES, modeled) |
| `pct_copd` | `FLOAT` | COPD prevalence among adults (PLACES, modeled) |
| `pct_diabetes` | `FLOAT` | Diagnosed diabetes prevalence among adults (PLACES, modeled) |
| `pct_high_bp` | `FLOAT` | High blood pressure prevalence among adults (PLACES, modeled) |
| `pct_checkup` | `FLOAT` | Routine checkup within past year among adults (PLACES, modeled — **low is bad**) |
| `pct_mobility_difficulty` | `FLOAT` | Mobility disability among adults (PLACES `mobility_crudeprev_`, modeled) |
| `pct_selfcare_difficulty` | `FLOAT` | Self-care disability among adults (PLACES, modeled) |
| `pct_indep_living_difficulty` | `FLOAT` | Independent living disability among adults (PLACES, modeled) |
| `pct_any_disability` | `FLOAT` | Any disability among adults (PLACES, modeled) |
| `longitude` | `FLOAT` | Tract centroid longitude |
| `latitude` | `FLOAT` | Tract centroid latitude |
| `svi_total_pop` | `FLOAT` | Total population (CDC SVI / ACS 5-year survey) |
| `pct_no_vehicle` | `FLOAT` | % of households with no vehicle available (CDC SVI `EP_NOVEH`, survey) |
| `pctile_no_vehicle` | `FLOAT` | National percentile rank (0–1) for no-vehicle households (CDC SVI `EPL_NOVEH`, survey) |
| `pct_disability_svi` | `FLOAT` | % civilian noninstitutionalized population with a disability (CDC SVI, survey) |
| `pct_age_65_plus` | `FLOAT` | % of population aged 65 and older (CDC SVI `EP_AGE65`, survey) |
| `pct_age_17_under` | `FLOAT` | % of population aged 17 and younger (CDC SVI `EP_AGE17`, survey) |
| `pct_uninsured_all_ages` | `FLOAT` | % uninsured across all ages (CDC SVI `EP_UNINSUR`, survey — do not mix with `pct_uninsured` 18–64 without stating) |
| `pctile_uninsured` | `FLOAT` | National percentile rank (0–1) for uninsured all ages (CDC SVI `EPL_UNINSUR`, survey) |
| `pct_limited_english` | `FLOAT` | % speaking English "less than well" (CDC SVI, survey) |
| `pct_mobile_homes` | `FLOAT` | % mobile homes (CDC SVI, survey) |
| `pct_group_quarters` | `FLOAT` | % living in group quarters (CDC SVI, survey) |
| `pct_no_internet` | `FLOAT` | % of households without internet access (CDC SVI, survey) |
| `svi_socioeconomic` | `FLOAT` | SVI Theme 1 percentile (0–1) |
| `svi_household` | `FLOAT` | SVI Theme 2 percentile (0–1) |
| `svi_housing_transport` | `FLOAT` | SVI Theme 4 percentile (0–1) |
| `uninsured_gap` | `FLOAT` | Difference between PLACES 18–64 and SVI all-ages uninsured estimates |

### `exposure_tracts` (327 rows) — Scale: `grid_12km`, Kind: `modeled`
| Column | Type | Source / Meaning |
|---|---|---|
| `geo_id` | `STRING` | 11-character census tract FIPS (12 km EPA FAQSD grid interpolated onto tract ID) |
| `mean_pm` | `FLOAT` | Annual mean PM2.5 (µg/m³) |
| `max_pm` | `FLOAT` | Annual maximum daily PM2.5 (µg/m³) |
| `days_over_12` | `INTEGER` | Days per year with PM2.5 > 12 µg/m³ |
| `days_over_20` | `INTEGER` | Days per year with PM2.5 > 20 µg/m³ |
| `days_over_25` | `INTEGER` | Days per year with PM2.5 > 25 µg/m³ |
| `days_over_35` | `INTEGER` | Days per year with PM2.5 > 35 µg/m³ |

### `disease_weekly` (201 rows) — Scale: `hsa_region`, Kind: `reported`
| Column | Type | Source / Meaning |
|---|---|---|
| `week_end` | `TIMESTAMP` | Week ending date |
| `geography` | `STRING` | State name (`Georgia`) |
| `county` | `STRING` | County name (`Fulton`) |
| `fips` | `STRING` | County FIPS (`13121`) — filter via `SAFE_CAST(fips AS INT64) = 13121` |
| `hsa` | `STRING` | Health Service Area name (`Atlanta, GA - Clayton, DeKalb, Fulton, Gwinnett`) |
| `hsa_counties` | `STRING` | Counties sharing this HSA figure |
| `trend_source` | `STRING` | Data source (`HSA` — multi-county regional figure) |
| `percent_visits_combined` | `FLOAT` | Combined COVID + Flu + RSV % of ED visits |
| `percent_visits_covid` | `FLOAT` | COVID-19 % of ED visits |
| `percent_visits_influenza` | `FLOAT` | Influenza % of ED visits |
| `percent_visits_rsv` | `FLOAT` | RSV % of ED visits |
| `percent_visits_smoothed_combined` | `FLOAT` | Smoothed combined % of ED visits |
| `percent_visits_smoothed_covid` | `FLOAT` | Smoothed COVID-19 % of ED visits |
| `percent_visits_smoothed_influenza` | `FLOAT` | Smoothed Influenza % of ED visits |
| `percent_visits_smoothed_rsv` | `FLOAT` | Smoothed RSV % of ED visits |
| `ed_trends_covid` | `STRING` | Qualitative trend direction for COVID-19 |
| `ed_trends_influenza` | `STRING` | Qualitative trend direction for Influenza |
| `ed_trends_rsv` | `STRING` | Qualitative trend direction for RSV |

### `care_sites` (67 rows) — Scale: `facility_point`, Kind: `reported`
| Column | Type | Source / Meaning |
|---|---|---|
| `CMS_PROVIDER_NUM` | `STRING` | CMS provider number (NULL for HRSA-only sites) |
| `FACILITY_NM` | `STRING` | Facility name |
| `CMS_PROVIDER_ADDRESS` | `STRING` | Street address |
| `CMS_PROVIDER_CITY` | `STRING` | City |
| `CMS_PROVIDER_STATE_ABBR` | `STRING` | State abbreviation (`GA`) |
| `CMS_PROVIDER_ZIP_CD` | `STRING` | ZIP code |
| `CMS_PROVIDER_CAT_DESC` | `STRING` | CMS category description |
| `CMS_PROVIDER_CAT_SUB_TYP_DESC` | `STRING` | CMS subcategory description |
| `longitude` | `FLOAT` | Facility longitude |
| `latitude` | `FLOAT` | Facility latitude |
| `site_kind` | `STRING` | `'FQHC'`, `'Health Center site'`, or `'Hospital'` |
| `HCC_TYP_DESC` | `STRING` | HRSA health center type description |
| `HCC_STATUS_DESC` | `STRING` | HRSA site status (`Active`) |
| `HCC_LOC_SETTING_DESC` | `STRING` | Location setting (e.g., `All Other Clinic Types`, `School`) |
| `TOT_OPER_HR_PER_WEEK` | `FLOAT` | Operating hours per week (HRSA sites; NULL on CMS POS rows) |
| `SITE_POP_TYP_DESC` | `STRING` | Population type description |
| `RURAL_IND` | `STRING` | Rural indicator (`Yes`/`No`) |
| `MHC_SUB_PROG_IND` | `STRING` | Migrant Health Center indicator |
| `SBHC_SUB_PROG_IND` | `STRING` | School-Based Health Center indicator |
| `PHPC_SUB_PROG_IND` | `STRING` | Public Housing Primary Care indicator |
| `HCH_SUB_PROG_IND` | `STRING` | Health Care for the Homeless indicator |
| `county_geo_id` | `STRING` | County FIPS (`13121`) |
| `county_name` | `STRING` | County name (`Fulton`) |

### `care_sites_state` (1,121 rows) — Scale: `facility_point`, Kind: `reported`
Same schema as `care_sites` **except** it omits `county_geo_id` and `county_name` (contains all 1,121 federally recognized care sites across Georgia before the county boundary spatial filter).

### `shortage_areas` (0 rows in Fulton) — Scale: `fed_designation`, Kind: `reported`
| Column | Type | Source / Meaning |
|---|---|---|
| `HPSA_NM` | `STRING` | Health Professional Shortage Area name |
| `HPSA_SCORE` | `STRING` | HPSA score (0–25) |
*(Legitimately 0 rows in Fulton County because all 99 HPSA area designations are `'Proposed For Withdrawal'`.)*

### `shortage_facilities` (6 rows) — Scale: `facility_point`, Kind: `reported`
| Column | Type | Source / Meaning |
|---|---|---|
| `HPSA_NM` | `STRING` | Facility HPSA name |
| `HPSA_TYP_DESC` | `STRING` | HPSA facility type description |
| `HPSA_POPULATION_TYP_DESC` | `STRING` | Population type description |
| `HPSA_SCORE` | `INTEGER` | HPSA score |
| `HPSA_STATUS_DESC` | `STRING` | Designation status (`Designated`) |
| `ADDRESS` | `STRING` | Street address |
| `CITY` | `STRING` | City |
| `ZIP_CD` | `STRING` | ZIP code |
| `HPSA_DESIGNATION_POP` | `FLOAT` | Designated population size |
| `RURAL_STATUS_DESC` | `STRING` | Rural status description |
| `CMN_STATE_COUNTY_FIPS_CD` | `STRING` | County FIPS (`13121`) |
| `longitude` | `FLOAT` | Facility longitude |
| `latitude` | `FLOAT` | Facility latitude |

### `tract_access` (326 rows) — Scale: `tract`, Kind: `computed_upper_bound` (distances) / `modeled` / `survey`
| Column | Type | Source / Meaning |
|---|---|---|
| `geo_id` | `STRING` | 11-character census tract FIPS |
| `total_pop` | `INTEGER` | Total population |
| `pct_uninsured` | `FLOAT` | Uninsured adults 18–64 (PLACES, modeled) |
| `pct_asthma` | `FLOAT` | Adult asthma prevalence (PLACES, modeled) |
| `pct_diabetes` | `FLOAT` | Adult diabetes prevalence (PLACES, modeled) |
| `pct_no_vehicle` | `FLOAT` | % households with no vehicle (CDC SVI, survey) |
| `pct_age_65_plus` | `FLOAT` | % aged 65+ (CDC SVI, survey) |
| `km_to_any_care` | `FLOAT` | Straight-line distance (km) from tract centroid to nearest federal care site of any kind (`computed_upper_bound`) |
| `km_to_safety_net` | `FLOAT` | Straight-line distance (km) from tract centroid to nearest federal safety-net site (`FQHC` or `Health Center site`, `computed_upper_bound`) |
| `extra_km_if_uninsured` | `FLOAT` | `km_to_safety_net - km_to_any_care` (`computed_upper_bound`) |

