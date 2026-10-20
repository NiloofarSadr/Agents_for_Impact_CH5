#!/usr/bin/env bash
#
# A4I 2026 - Challenge 5: Dynamic Public Health Equity & Preventative Mobile Care
# Headless fallback for notebooks/c5_01_load_explore.ipynb
#
# Rebuilds the same BigQuery tables the notebook produces, from a pre-staged
# snapshot in Cloud Storage. Use this when a Colab Enterprise runtime is slow or
# unavailable, or when one of the upstream publishers is not cooperating.
#
# Run it from the repo root in Cloud Shell (no chmod needed - invoke with bash):
#     bash scripts/load.sh                 # defaults to Fulton County, GA
#     bash scripts/load.sh 17031           # Cook County, IL
#     bash scripts/load.sh --list          # show available counties
#
# NOTE THE ARGUMENT. This takes a five-digit COUNTY FIPS code, not a state - which
# is a deliberate difference from Challenge 4. Santa Clara is 06085, and the
# leading zero is part of the code, not decoration.
#
# You still want the notebook if you can run it, and it only takes two to three
# minutes. Section 2 hands you the wrong answer and lets you watch it fail, and
# Sections 6 to 8 walk through the defects in this federal data that will
# otherwise bite you silently. This script gets you the same tables without any
# of that.

set -euo pipefail

BUCKET="gs://class-demo/a4i-2026/challenge-5-public-health"
DATASET="a4i_health"
LOCATION="US"

# Every table the notebook creates. Same list, same names, same order as the
# publisher - if these drift apart, a student following the README asks for a
# table that is not there.
TABLES=(burden_tracts exposure_tracts care_sites care_sites_state
        shortage_areas shortage_facilities disease_weekly tract_access)

# Tables where zero rows means the load is broken.
#
# shortage_areas and shortage_facilities are deliberately NOT on this list, and
# this is the single most important thing in this file to get right. Fulton -
# the default county - has 99 shortage designations and every one of them is
# `Proposed For Withdrawal`, so it has ZERO live ones and ships an empty table.
# Harris, Travis and Santa Clara have none at all. An empty shortage_areas is
# the finding, not a fault, and a script that treats it as a fault would refuse
# to load four of the six counties we pre-staged.
REQUIRED=(burden_tracts exposure_tracts care_sites care_sites_state
          disease_weekly tract_access)

# The counties in the snapshot, with the names they resolve to. The publisher
# checks every one of these against bigquery-public-data.geo_us_boundaries
# before it writes anything, so these pairings are verified rather than typed
# from memory. --list reads the bucket and annotates with this map, so a county
# that exists in the bucket but not here still shows up.
declare -A COUNTY_NAMES=(
  [13121]="Fulton, GA (Atlanta) - the notebook default"
  [17031]="Cook, IL (Chicago)"
  [06085]="Santa Clara, CA (Sunnyvale)"
  [36005]="Bronx, NY (New York City)"
  [48201]="Harris, TX (Houston)"
  [48453]="Travis, TX (Austin)"
)

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }
info()  { printf '  %s\n' "$*"; }
fail()  { printf '\n\033[1mERROR:\033[0m %s\n\n%s\n\n' "$*" \
          "This script is safe to run again - every table load replaces whatever was there." >&2
          exit 1; }

on_interrupt() {
  printf '\n\n\033[1mInterrupted.\033[0m Nothing is broken.\n'
  printf 'Every load replaces the whole table, so just run this script again:\n'
  printf '    bash scripts/load.sh %s\n\n' "${FIPS:-<county-fips>}"
  exit 130
}
trap on_interrupt INT TERM

list_counties() {
  bold "Counties available in the snapshot"
  local found=0 code
  while read -r code; do
    [[ -z "${code}" ]] && continue
    found=1
    # Resolve the name in two steps rather than with a :- default inside the quotes.
    # An apostrophe inside ${var:-word} opens a quote even when the whole thing sits
    # in double quotes, and the script then fails to parse with an EOF error pointing
    # at the last line of the file rather than at this one.
    label="${COUNTY_NAMES[${code}]:-}"
    [[ -z "${label}" ]] && label="(in the bucket, not in this script's name map)"
    printf '  %-7s %s\n' "${code}" "${label}"
  done < <(gcloud storage ls "${BUCKET}/" 2>/dev/null | sed 's|.*/\([^/]*\)/$|\1|')

  if [[ "${found}" -eq 0 ]]; then
    fail "Could not list ${BUCKET}/. Check that you have network access and are signed in."
  fi
  echo
  echo "Usage: bash scripts/load.sh <COUNTY_FIPS>"
  echo
  echo "Any US county works in the notebook - these are the ones we pre-staged."
  echo "If you want a county that is not here, run the notebook instead. It takes"
  echo "two to three minutes and it works for every county in the country."
}

# --------------------------------------------------------------------------
# Arguments
# --------------------------------------------------------------------------
FIPS="${1:-13121}"

if [[ "${FIPS}" == "--list" || "${FIPS}" == "-l" ]]; then
  list_counties
  exit 0
fi

if [[ "${FIPS}" == "--help" || "${FIPS}" == "-h" ]]; then
  sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
fi

FIPS="$(echo "${FIPS}" | tr -d '[:space:]')"

# The leading-zero trap, caught rather than explained afterwards.
#
# County FIPS codes are five-character STRINGS, and seven states have a code
# below 10. Type Santa Clara as a number and you get 6085, which is four
# characters, matches no directory in the bucket, and produces "no snapshot
# found" - a message that sends you looking for a missing upload instead of a
# missing zero. Every join in the notebook pads to eleven characters for the
# same reason.
#
# We pad rather than refuse, because at an event a refusal costs somebody ten
# minutes. But we say so, loudly, because the same habit will silently break
# the first query they write by hand.
if [[ "${FIPS}" =~ ^[0-9]{4}$ ]]; then
  PADDED="0${FIPS}"
  bold "NOTE: '${FIPS}' is four digits. County FIPS codes are five."
  info "Reading it as '${PADDED}' - the leading zero is part of the code, not decoration."
  info "Seven states have a FIPS below 10 (AL 01, AK 02, AZ 04, AR 05, CA 06, CO 08, CT 09),"
  info "and any code you type as a NUMBER rather than a string loses that zero. It will"
  info "cost you a join later if you do not watch for it."
  echo
  FIPS="${PADDED}"
fi

[[ "${FIPS}" =~ ^[0-9]{5}$ ]] \
  || fail "'${FIPS}' is not a five-digit county FIPS code.
       This script takes a COUNTY, not a state - that is different from Challenge 4.
       Try: bash scripts/load.sh 13121      (Fulton County, GA)
       Or:  bash scripts/load.sh --list"

SRC="${BUCKET}/${FIPS}"
COUNTY_LABEL="${COUNTY_NAMES[${FIPS}]:-county ${FIPS}}"

# --------------------------------------------------------------------------
# Preflight
# --------------------------------------------------------------------------
bold "A4I Challenge 5 - loading public health equity data for: ${COUNTY_LABEL}"
echo

command -v bq     >/dev/null 2>&1 || fail "'bq' not found. Run this in Cloud Shell."
command -v gcloud >/dev/null 2>&1 || fail "'gcloud' not found. Run this in Cloud Shell."

PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
[[ -n "${PROJECT_ID}" && "${PROJECT_ID}" != "(unset)" ]] \
  || fail "No project set. Run: gcloud config set project YOUR_PROJECT_ID"

info "Project  : ${PROJECT_ID}"
info "County   : ${FIPS}"
info "Source   : ${SRC}"
info "Dataset  : ${DATASET} (${LOCATION})"
echo

if ! gcloud storage ls "${SRC}/" >/dev/null 2>&1; then
  echo
  bold "No snapshot found for county '${FIPS}'."
  echo
  list_counties
  exit 1
fi

# --------------------------------------------------------------------------
# Create the dataset
# --------------------------------------------------------------------------
bold "1/3  Creating dataset"

# `bq ls -d NAME` does NOT ask "does this dataset exist". It lists the datasets
# inside a PROJECT called NAME, so it reports nothing for a dataset name and the
# script falls through to `mk`, which then dies on a dataset that is already
# there. That never shows up on a first run - it only bites on the second, which
# is exactly when you are re-running because something went wrong the first time.
dataset_exists() {
  bq --project_id="${PROJECT_ID}" show --dataset --format=none \
     "${PROJECT_ID}:${DATASET}" >/dev/null 2>&1
}

if dataset_exists; then
  info "${DATASET} already exists - reusing it"

  existing_loc="$(bq --project_id="${PROJECT_ID}" --format=json show --dataset \
                     "${PROJECT_ID}:${DATASET}" 2>/dev/null \
                  | tr ',' '\n' | grep -i '"location"' | head -1 \
                  | sed 's/.*: *"\([^"]*\)".*/\1/' || true)"
  if [[ -n "${existing_loc}" && "${existing_loc^^}" != "${LOCATION^^}" ]]; then
    fail "Dataset ${DATASET} already exists in '${existing_loc}', but this script loads into
       '${LOCATION}'. BigQuery cannot load across regions. Either delete the dataset
       (bq rm -r -d ${DATASET}) or edit LOCATION at the top of this script to match."
  fi
else
  # Belt and braces. If the check above ever misfires, or two teammates run this
  # in the same shared project at the same second, "already exists" is a fine
  # outcome and not an error. Anything else is.
  if mk_out="$(bq --project_id="${PROJECT_ID}" --location="${LOCATION}" \
                  mk --dataset "${PROJECT_ID}:${DATASET}" 2>&1)"; then
    info "created ${DATASET}"
  elif grep -qi "already exists" <<<"${mk_out}"; then
    info "${DATASET} already exists - reusing it"
  else
    fail "Could not create dataset ${DATASET}:
       ${mk_out}"
  fi
fi
echo

# --------------------------------------------------------------------------
# Load each table
# --------------------------------------------------------------------------
# Every load uses --replace, so re-running from scratch is always safe, and so
# is switching counties: the second run overwrites the first county's tables
# rather than mixing the two.
bold "2/3  Loading tables"
for table in "${TABLES[@]}"; do
  uri="${SRC}/${table}/data.parquet"

  if ! gcloud storage ls "${uri}" >/dev/null 2>&1; then
    if printf '%s\n' "${REQUIRED[@]}" | grep -qx "${table}"; then
      fail "Missing ${uri}. The snapshot for '${FIPS}' looks incomplete - tell a coach."
    fi
    info "${table} not in this snapshot - skipping (optional)"
    continue
  fi

  info "loading ${table}..."
  bq --project_id="${PROJECT_ID}" --location="${LOCATION}" load \
     --source_format=PARQUET \
     --replace \
     "${DATASET}.${table}" \
     "${uri}" >/dev/null

  info "  done"
done
echo

# --------------------------------------------------------------------------
# Verify - never trust a load you did not check
# --------------------------------------------------------------------------
bold "3/3  Verifying"
FAILED=0
for table in "${TABLES[@]}"; do
  if ! bq --project_id="${PROJECT_ID}" show --format=none \
          "${PROJECT_ID}:${DATASET}.${table}" >/dev/null 2>&1; then
    printf '  %-24s %s\n' "${table}" "not loaded (optional)"
    continue
  fi

  rows="$(bq --project_id="${PROJECT_ID}" --location="${LOCATION}" \
            query --use_legacy_sql=false --format=csv \
            "SELECT COUNT(*) FROM \`${PROJECT_ID}.${DATASET}.${table}\`" \
          | tail -n 1)"

  if [[ "${rows}" == "0" ]] && printf '%s\n' "${REQUIRED[@]}" | grep -qx "${table}"; then
    printf '  %-24s %s\n' "${table}" "0 rows  <-- EMPTY"
    FAILED=1
  elif [[ "${rows}" == "0" ]]; then
    printf '  %-24s %s\n' "${table}" "0 rows (legitimately - see below)"
  else
    printf '  %-24s %s rows\n' "${table}" "${rows}"
  fi
done
echo

# The numbers that decide whether the challenge is doable on this county, as
# opposed to whether the load worked. Every structural check above passes on a
# county whose disease table is 201 rows of NULL, or whose safety-net gap does
# not exist. Both load perfectly and then answer nothing.
#
# IFNULL on the aggregates: a NULL prints as an empty CSV field, and `read` then
# shifts every later variable one column left.
bold "Does this county actually support the challenge?"
read -r tracts sites gap worst hpsa trend weeks <<<"$(
  bq --project_id="${PROJECT_ID}" --location="${LOCATION}" \
     query --use_legacy_sql=false --format=csv \
     "SELECT
        (SELECT COUNT(*) FROM \`${PROJECT_ID}.${DATASET}.burden_tracts\`),
        (SELECT COUNT(*) FROM \`${PROJECT_ID}.${DATASET}.care_sites\`),
        (SELECT IFNULL(COUNTIF(extra_km_if_uninsured > 0), 0)
           FROM \`${PROJECT_ID}.${DATASET}.tract_access\`),
        (SELECT IFNULL(ROUND(MAX(km_to_safety_net), 1), 0)
           FROM \`${PROJECT_ID}.${DATASET}.tract_access\`),
        (SELECT COUNT(*) FROM \`${PROJECT_ID}.${DATASET}.shortage_areas\`),
        (SELECT IFNULL(COUNTIF(percent_visits_covid IS NOT NULL), 0)
           FROM \`${PROJECT_ID}.${DATASET}.disease_weekly\`),
        (SELECT COUNT(*) FROM \`${PROJECT_ID}.${DATASET}.disease_weekly\`)" \
  | tail -n 1 | tr ',' ' '
)"

printf '  %-44s %s\n' "census tracts"                          "${tracts}"
printf '  %-44s %s\n' "care sites in the county"               "${sites}"
printf '  %-44s %s\n' "tracts further from safety-net care"    "${gap}"
printf '  %-44s %s km\n' "worst distance to a safety-net site" "${worst}"
printf '  %-44s %s\n' "designated shortage AREAS"              "${hpsa}"
printf '  %-44s %s of %s\n' "weeks with a usable COVID trend"  "${trend}" "${weeks}"
echo

if [[ "${gap}" == "0" ]]; then
  info "  <-- NO tract in this county is further from a clinic that takes the uninsured"
  info "      than from the nearest clinic of any kind. That is the central measurement"
  info "      of this challenge and it is flat here. Your tables are fine; the story is"
  info "      not. Consider a different county, or build a demo about something else."
elif [[ "${hpsa}" == "0" ]]; then
  info "  NOTE: zero designated shortage AREAS. That is a real finding, not a broken load -"
  info "  Fulton's 99 designations are ALL 'Proposed For Withdrawal', and Harris, Travis and"
  info "  Santa Clara have none at all. shortage_areas is empty on purpose. You have lost"
  info "  HPSA_SCORE as a neighborhood signal, which was our only travel-burden measure."
  info "  Do not confuse this with shortage_facilities, which marks where care already IS."
fi

if [[ "${trend}" == "0" ]]; then
  echo
  bold "  READ THIS BEFORE YOU BUILD ANYTHING ON disease_weekly."
  info "  ${weeks} weeks loaded and NOT ONE of them has a COVID percentage. This county's"
  info "  Health Service Area reports 'Data Unavailable' for the whole series. The table"
  info "  is there, the columns are there, the row count looks healthy, and the data is"
  info "  not. Santa Clara and the Bronx are both like this - two of the largest counties"
  info "  in the country, both dark."
  info ""
  info "  This is the only CURRENT layer in the challenge. If your idea is 'the van follows"
  info "  the respiratory surge', it does not work here. Pick another county, or make the"
  info "  silence itself the point - an agent that says 'we cannot tell' is worth more"
  info "  credit than one that reports no increase, because no data is not no problem."
fi
echo

if [[ "${FAILED}" -eq 1 ]]; then
  fail "One or more required tables loaded empty. Tell a coach."
fi

bold "Ready."
echo
echo "  Your tables are in ${PROJECT_ID}.${DATASET}"
echo "  Safe to re-run at any time - each load replaces the whole table."
echo
echo "  THE ONE THING THAT WILL COST YOU CREDIT IF YOU MISS IT: these tables are at"
echo "  four different resolutions and they do not say so. burden_tracts is a census"
echo "  tract. exposure_tracts carries an eleven-digit tract ID over a 12 km modeling"
echo "  grid, so it cannot tell one neighborhood from another. care_sites is a point."
echo "  disease_weekly is a multi-county Health Service Area written onto a county key."
echo "  An agent that blends all four into one confident sentence has said something"
echo "  the data cannot support. Saying which scale each claim came from is the job."
echo
echo "  Next: build your agent. Your differentiator is ADK multi-agent orchestration,"
echo "  which is an ARCHITECTURE rather than a query - so unlike the other challenges"
echo "  you cannot bolt it on at the end. Decide the shape in the first ten minutes."
echo "  Section 13 of the notebook has the working API, the five things that will cost"
echo "  you an hour, and the four questions judges look for. Read it even if you are"
echo "  skipping the rest of the notebook."
echo
