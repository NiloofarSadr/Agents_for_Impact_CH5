"""Unit and guardrail tests for Clinic Van Planner (§3.1, §4, §5, Phase 6)."""

from __future__ import annotations

import json
from pathlib import Path
import pytest

from agent.clinic_broker.contract import (
    MODEL_NAME,
    AuditEquity,
    AuditRevision,
    Claim,
    Kind,
    PlanDraft,
    ProblemType,
    Scale,
    SitePick,
)
from agent.clinic_broker.composer import compose_clinic_plan, default_fulton_limits
from agent.clinic_broker.prompts import (
    AUDITOR_INSTRUCTION,
    BURDEN_SCOUT_INSTRUCTION,
    CONTEXT_SCOUT_INSTRUCTION,
    PLANNER_INSTRUCTION,
)
from agent.clinic_broker.agent import auditor, planner, root_agent
from agent.clinic_broker.tools.audit import (
    equity_audit,
    remeasure_border,
    spacing_check,
    tie_check,
)
from agent.clinic_broker.tools.readability import readability_check
from agent.clinic_broker.tools.scoring import haversine_km, score_and_schedule


# ---------------------------------------------------------------------------
# Test Fixtures & Synthetic Data
# ---------------------------------------------------------------------------
SAMPLE_RANKING_ROWS = [
    {
        "tract_id": "13121011431",
        "need_rank": 1,
        "need_score": 0.4487,
        "pct_uninsured": 23.4,
        "safety_net_km": 4.12,
        "any_care_km": 0.52,
        "pct_no_vehicle": 33.1,
        "pctile_no_vehicle": 0.95,
        "pct_diabetes": 19.3,
        "pct_high_bp": 50.1,
        "pct_checkup": 79.2,
        "latitude": 33.6841,
        "longitude": -84.4425,
    },
    {
        "tract_id": "13121011430",
        "need_rank": 2,
        "need_score": 0.4381,  # 2.36% relative diff with #1 (< 5% tie threshold)
        "pct_uninsured": 22.8,
        "safety_net_km": 4.05,
        "any_care_km": 0.48,
        "pct_no_vehicle": 31.9,
        "pctile_no_vehicle": 0.94,
        "pct_diabetes": 18.7,
        "pct_high_bp": 49.3,
        "pct_checkup": 80.1,
        "latitude": 33.6821,
        "longitude": -84.4379,  # 0.46 km from #1 (violates 3.0 km spacing)
    },
    {
        "tract_id": "13121010214",
        "need_rank": 3,
        "need_score": 0.4120,
        "pct_uninsured": 21.5,
        "safety_net_km": 3.80,
        "any_care_km": 1.10,
        "pct_no_vehicle": 28.4,
        "pctile_no_vehicle": 0.89,
        "pct_diabetes": 16.2,
        "pct_high_bp": 44.0,
        "pct_checkup": 82.0,
        "latitude": 33.7550,
        "longitude": -84.4210,  # > 7 km away from #1
    },
    {
        "tract_id": "13121007710",
        "need_rank": 4,
        "need_score": 0.3950,
        "pct_uninsured": 20.1,
        "safety_net_km": 3.50,
        "any_care_km": 0.95,
        "pct_no_vehicle": 25.0,
        "pctile_no_vehicle": 0.85,
        "pct_diabetes": 15.1,
        "pct_high_bp": 42.5,
        "pct_checkup": 83.1,
        "latitude": 33.7210,
        "longitude": -84.4100,  # spaced
    },
    {
        "tract_id": "13121011647",
        "need_rank": 5,
        "need_score": 0.3800,
        "pct_uninsured": 19.5,
        "safety_net_km": 3.20,
        "any_care_km": 1.20,
        "pct_no_vehicle": 24.2,
        "pctile_no_vehicle": 0.82,
        "pct_diabetes": 14.8,
        "pct_high_bp": 41.0,
        "pct_checkup": 84.0,
        "latitude": 33.6500,
        "longitude": -84.4600,  # spaced
    },
    {
        "tract_id": "13121011636",
        "need_rank": 6,
        "need_score": 0.3738,  # 1.63% relative diff with #5 (< 5% tie)
        "pct_uninsured": 19.0,
        "safety_net_km": 3.10,
        "any_care_km": 1.15,
        "pct_no_vehicle": 23.5,
        "pctile_no_vehicle": 0.80,
        "pct_diabetes": 14.2,
        "pct_high_bp": 40.5,
        "pct_checkup": 84.5,
        "latitude": 33.6480,
        "longitude": -84.4550,
    },
]


SAMPLE_TRACT_DEMO_ROWS = [
    {
        "tract_id": "13121011431",
        "total_pop": 3200,
        "black_pop": 1800,
        "white_pop": 600,
        "hispanic_pop": 600,
        "asian_pop": 100,
        "amerindian_pop": 10,
        "other_race_pop": 40,
        "two_or_more_races_pop": 50,
    },
    {
        "tract_id": "13121010214",
        "total_pop": 4100,
        "black_pop": 2500,
        "white_pop": 800,
        "hispanic_pop": 500,
        "asian_pop": 150,
        "amerindian_pop": 15,
        "other_race_pop": 50,
        "two_or_more_races_pop": 85,
    },
    {
        "tract_id": "13121007710",
        "total_pop": 3000,
        "black_pop": 1600,
        "white_pop": 700,
        "hispanic_pop": 500,
        "asian_pop": 80,
        "amerindian_pop": 10,
        "other_race_pop": 40,
        "two_or_more_races_pop": 70,
    },
    {
        "tract_id": "13121011647",
        "total_pop": 3500,
        "black_pop": 1900,
        "white_pop": 900,
        "hispanic_pop": 450,
        "asian_pop": 120,
        "amerindian_pop": 12,
        "other_race_pop": 38,
        "two_or_more_races_pop": 80,
    },
]

SAMPLE_COUNTY_DEMO_ROWS = [
    {
        "total_pop": 1066710,
        "black_pop": 459632,     # ~43.1%
        "white_pop": 419217,     # ~39.3%
        "hispanic_pop": 76803,   # ~7.2%
        "asian_pop": 74670,      # ~7.0%
        "amerindian_pop": 2133,
        "other_race_pop": 8534,
        "two_or_more_races_pop": 25721,
    }
]


# ---------------------------------------------------------------------------
# 1. Custom Tools Tests
# ---------------------------------------------------------------------------
def test_score_and_schedule_respects_spacing():
    picks = score_and_schedule(
        n=4,
        min_spacing_km=3.0,
        ranking_rows=SAMPLE_RANKING_ROWS,
    )
    assert len(picks) == 4
    # Tract 13121011430 is 0.46 km from 13121011431 so it must be skipped
    picked_ids = [p["tract_id"] for p in picks]
    assert "13121011431" in picked_ids
    assert "13121011430" not in picked_ids
    assert "13121010214" in picked_ids
    assert "13121007710" in picked_ids
    assert "13121011647" in picked_ids

    # Every pick must have tract-level reasons
    for p in picks:
        assert len(p["reasons"]) >= 2
        for r in p["reasons"]:
            assert r["scale"] == "tract"
            assert r["kind"] in ("modeled", "computed_upper_bound", "survey")


def test_spacing_check_detects_proximity():
    # Naive top 2 tracts are only 0.46 km apart
    res = spacing_check(
        tract_ids=["13121011431", "13121011430"],
        min_spacing_km=3.0,
        ranking_rows=SAMPLE_RANKING_ROWS,
    )
    assert res["has_violations"] is True
    assert len(res["violations"]) == 1
    v = res["violations"][0]
    assert v["distance_km"] < 1.0
    assert v["revision"]["problem_type"] == "TOO_CLOSE_TOGETHER"


def test_tie_check_detects_ties_within_5_percent():
    # Tract 13121011431 vs unpicked 13121011430 are within 2.36%
    res = tie_check(
        tract_ids=["13121011431", "13121010214", "13121007710", "13121011647"],
        ranking_rows=SAMPLE_RANKING_ROWS,
    )
    assert res["has_ties"] is True
    assert res["rule"] == "approximate, no CI loaded"
    tied_picks = [t["pick_tract_id"] for t in res["ties"]]
    assert "13121011431" in tied_picks


def test_remeasure_border_fires_when_out_of_county_clinic_is_closer():
    # Synthetic out-of-county clinic in DeKalb that is 1.8 km away vs 4.5 km in-county
    state_rows = [
        {
            "tract_id": "13121008000",
            "state_safety_net_km": 1.82,
            "in_county_safety_net_km": 4.50,
            "is_outside_fulton": True,
            "facility_name": "Decatur Community Health Center",
            "city": "Decatur",
        }
    ]
    res = remeasure_border("13121008000", state_rows=state_rows)
    assert res["border_clinic_closer"] is True
    assert res["revision"]["problem_type"] == "BORDER_CLINIC_CLOSER"
    assert "Decatur" in res["revision"]["explanation"]


def test_equity_audit_computes_shares():
    res = equity_audit(
        tract_ids=["13121011431", "13121010214", "13121007710", "13121011647"],
        tract_demo_rows=SAMPLE_TRACT_DEMO_ROWS,
        county_demo_rows=SAMPLE_COUNTY_DEMO_ROWS,
    )
    audit = AuditEquity.model_validate(res)
    assert len(audit.table) == 5
    assert "Black or African American (Non-Hispanic)" in [r.group for r in audit.table]
    assert audit.finding
    assert "firewalled out" in audit.structural_hypothesis


def test_readability_check_grade_and_banned_words():
    # Compliant text: short sentences, plain words
    good_text = (
        "Free mobile health van is coming this Saturday. "
        "Get a free checkup for high blood pressure and sugar. "
        "You do not need insurance. No ID is needed. Walk in from 9 AM to 3 PM."
    )
    res_good = readability_check(good_text)
    assert res_good["reading_grade"] <= 6.0
    assert res_good["passes_grade_6"] is True
    assert len(res_good["banned_words_found"]) == 0
    assert res_good["passes_all"] is True

    # Bad text: contains banned hedging words
    bad_text = (
        "We selected this tract using modeled chronic disease prevalence and "
        "an estimated 95th percentile confidence interval."
    )
    res_bad = readability_check(bad_text)
    assert "modeled" in res_bad["banned_words_found"]
    assert "estimated" in res_bad["banned_words_found"]
    assert "percentile" in res_bad["banned_words_found"]
    assert "confidence" in res_bad["banned_words_found"]
    assert res_bad["passes_all"] is False


# ---------------------------------------------------------------------------
# 2. Strict Demographic Firewall Tests (§3.1)
# ---------------------------------------------------------------------------
def test_planner_instruction_never_mentions_demographics_or_audit_equity():
    """Verify Planner instruction contains zero demographic terms or audit_equity."""
    planner_text = PLANNER_INSTRUCTION.lower()
    banned_tokens = [
        "audit_equity",
        "race",
        "racial",
        "ethnicity",
        "ethnic",
        "black_pop",
        "white_pop",
        "hispanic_pop",
        "asian_pop",
        "amerindian_pop",
        "other_race_pop",
        "two_or_more_races_pop",
        "demographic",
        "demographics",
    ]
    for token in banned_tokens:
        assert token not in planner_text, f"Firewall breach: token '{token}' found in PLANNER_INSTRUCTION"


def test_planner_toolset_has_no_demographic_tools():
    """Verify Planner has only planning tools and never receives demographic tools."""
    tool_names = [getattr(t, "__name__", str(t)) for t in planner.tools]
    assert "get_tract_demographics" not in tool_names
    assert "get_county_demographics" not in tool_names
    assert "equity_audit" not in tool_names


def test_auditor_toolset_includes_tract_demographics():
    """Verify Auditor toolset possesses demographic inspection tools for post-hoc audit."""
    tool_names = [getattr(t, "__name__", str(t)) for t in auditor.tools]
    assert "get_tract_demographics" in tool_names
    assert "get_county_demographics" in tool_names
    assert "equity_audit" in tool_names


def test_context_scout_verbatim_refusal_rule():
    """Verify Context Scout includes the exact required regional scale refusal."""
    expected_refusal = (
        "If asked about disease trends or air quality for a specific neighborhood, answer: "
        "'I can tell you about the region, not this street,' and give the regional number with its scale."
    )
    assert expected_refusal in CONTEXT_SCOUT_INSTRUCTION


def test_auditor_instruction_exact_opening():
    """Verify Auditor instruction starts with the required sentence."""
    assert AUDITOR_INSTRUCTION.strip().startswith("Your job is to find what is wrong with this plan.")


# ---------------------------------------------------------------------------
# 3. Scale Integrity Tests (§4, §5)
# ---------------------------------------------------------------------------
def test_pick_reasons_never_contain_grid12km_or_hsaregion():
    """Ensure tract pick reasons never use 12km grid or HSA region scales."""
    sample_picks = score_and_schedule(
        n=4,
        min_spacing_km=3.0,
        ranking_rows=SAMPLE_RANKING_ROWS,
    )
    for p_dict in sample_picks:
        pick = SitePick.model_validate(p_dict)
        for r in pick.reasons:
            assert r.scale not in (Scale.GRID_12KM, Scale.HSA_REGION), (
                f"Scale violation on pick {pick.tract_id}: reason used {r.scale}"
            )
            assert r.scale == Scale.TRACT


# ---------------------------------------------------------------------------
# 4. Composer Deterministic Node Tests (§3.2)
# ---------------------------------------------------------------------------
def test_composer_flags_unresolved_objections_after_rounds():
    """When method revisions remain at composition time, affected picks are marked flagged=True."""
    mock_picks = [
        SitePick.model_validate(p)
        for p in score_and_schedule(n=4, min_spacing_km=3.0, ranking_rows=SAMPLE_RANKING_ROWS)
    ]
    mock_draft = PlanDraft(version=2, picks=mock_picks, method_notes="Revised draft")
    # Auditor left a statistical tie note on tract 13121011431
    mock_revisions = [
        AuditRevision(
            pick_tract_id="13121011431",
            problem_type=ProblemType.STATISTICAL_TIE,
            explanation="Tract 13121011431 is within 2.36% of unpicked tract 13121011430.",
            suggested_action="Review secondary chronic disease burden.",
        )
    ]
    mock_equity = AuditEquity.model_validate(
        equity_audit(
            tract_ids=[p.tract_id for p in mock_picks],
            tract_demo_rows=SAMPLE_TRACT_DEMO_ROWS,
            county_demo_rows=SAMPLE_COUNTY_DEMO_ROWS,
        )
    )

    state_input = {
        "plan_draft": mock_draft.model_dump(mode="json"),
        "audit_revisions": [r.model_dump(mode="json") for r in mock_revisions],
        "audit_equity": mock_equity.model_dump(mode="json"),
        "audit_status": "PASS",
        "revise_round": 2,
    }
    composed = compose_clinic_plan(state_input)
    plan_final = composed["plan_final"]

    # Verify tract 13121011431 was flagged
    picks_final = {p["tract_id"]: p for p in plan_final["where_the_van_goes"]}
    assert picks_final["13121011431"]["flagged"] is True
    assert "STATISTICAL_TIE" in picks_final["13121011431"]["flag_reason"]

    # Other tracts are unflagged
    assert picks_final["13121010214"]["flagged"] is False

    # Part 2 contains named and counted limits
    assert len(plan_final["what_we_could_not_tell_you"]) >= 6

    # Part 3 contains firewalled demographic equity
    assert plan_final["who_this_plan_lands_on"]["finding"]

