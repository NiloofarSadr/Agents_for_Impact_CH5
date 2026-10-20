"""Deterministic Composer node (§3.2): merges Planner drafts, Auditor method revisions,
scale limits, and firewalled Equity findings into the 4-part `ClinicPlan` and `disagreement_log`.

This module is pure deterministic Python—never an LLM.
"""

from __future__ import annotations

import json
from typing import Any

from google.adk.agents.context import Context
from google.adk.events.event import Event
from google.adk.workflow import node

from .contract import (
    COUNTY_FIPS,
    COUNTY_NAME,
    STATE_AUDIT_EQUITY,
    STATE_AUDIT_REVISIONS,
    STATE_AUDIT_STATUS,
    STATE_DISAGREEMENT_LOG,
    STATE_DRAFT_HISTORY,
    STATE_LIMITS,
    STATE_OUTREACH,
    STATE_PLAN_DRAFT,
    STATE_PLAN_FINAL,
    STATE_REVISE_ROUND,
    STATE_REVISION_HISTORY,
    AuditEquity,
    AuditRevision,
    AuditStatus,
    Claim,
    ClinicPlan,
    DisagreementEntry,
    Kind,
    Outreach,
    PlanDraft,
    Scale,
    SitePick,
)
from .tools.audit import equity_audit
from .tools.scoring import score_and_schedule


def default_fulton_limits() -> list[Claim]:
    """Named and counted data gaps and resolution limits for Fulton County (FIPS 13121)."""
    return [
        Claim(
            claim=(
                "No active federal shortage-area designations exist in Fulton County: "
                "0 active designations and 99 designations with status 'Proposed For Withdrawal' in shortage_areas."
            ),
            value=0,
            unit="active_designations",
            tract_id=None,
            scale=Scale.FED_DESIGNATION,
            kind=Kind.REPORTED,
            source="shortage_areas.status",
        ),
        Claim(
            claim=(
                "I can tell you about the region, not this street: PM2.5 air quality (mean 9.75 ug/m3, "
                "p90/p10 ratio 1.05x across 327 tracts) comes from a 12 km EPA grid and cannot rank census tracts."
            ),
            value=1.05,
            unit="p90_p10_ratio",
            tract_id=None,
            scale=Scale.GRID_12KM,
            kind=Kind.MODELED,
            source="exposure_tracts.pm25",
        ),
        Claim(
            claim=(
                "I can tell you about the region, not this street: Respiratory ED visit trends "
                "(2.91% latest week; 8-week range 2.75%-5.93%) are reported for a multi-county Health Service Area "
                "(Fulton, Clayton, DeKalb, Gwinnett) and cannot differentiate neighborhoods."
            ),
            value=2.91,
            unit="pct_ed_visits_resp",
            tract_id=None,
            scale=Scale.HSA_REGION,
            kind=Kind.REPORTED,
            source="disease_weekly.pct_ed_visits_resp",
        ),
        Claim(
            claim=(
                "47 of 51 federally recognized safety-net clinic records in Fulton County report 0 weekly operating "
                "hours in HRSA data (only 4 report hours > 0), and 0 report Saturday clinic hours."
            ),
            value=47,
            unit="sites_missing_hours",
            tract_id=None,
            scale=Scale.FACILITY_POINT,
            kind=Kind.REPORTED,
            source="care_sites.weekly_hours",
        ),
        Claim(
            claim=(
                "All clinic distances (km_to_safety_net, km_to_any_care) are straight-line centroid upper bounds "
                "to federally recognized sites only—not street driving or MARTA transit time."
            ),
            value=8.0,
            unit="km_normalization_cap",
            tract_id=None,
            scale=Scale.TRACT,
            kind=Kind.COMPUTED_UPPER_BOUND,
            source="tract_access.km_to_safety_net",
        ),
        Claim(
            claim=(
                "25 of 327 Fulton tracts have NULL CDC PLACES modeled prevalence, 1 tract (13121980000, Airport) "
                "has -999 missing SVI pct_no_vehicle, and 0 _crude95ci confidence-interval columns exist in burden_tracts "
                "(ties within 5% need_score are evaluated as 'approximate, no CI loaded')."
            ),
            value=25,
            unit="tracts_missing_places",
            tract_id=None,
            scale=Scale.TRACT,
            kind=Kind.MODELED,
            source="burden_tracts.pct_uninsured",
        ),
    ]


def _parse_json_or_obj(val: Any) -> Any:
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, str):
        text = val.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            if len(lines) >= 3:
                text = "\n".join(lines[1:-1]).strip()
        try:
            return json.loads(text)
        except Exception:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(text[start : end + 1])
                except Exception:
                    pass
    return None


def coerce_plan_draft(raw_draft: Any, fallback_version: int = 1) -> PlanDraft:
    """Parse or construct a valid `PlanDraft` from state."""
    parsed = _parse_json_or_obj(raw_draft)
    if isinstance(parsed, dict) and "picks" in parsed:
        try:
            return PlanDraft.model_validate(parsed)
        except Exception:
            pass
    # Fallback to deterministic score_and_schedule if LLM returned prose around JSON
    picks_raw = score_and_schedule(n=4, min_spacing_km=3.0)
    picks = [SitePick.model_validate(p) for p in picks_raw]
    return PlanDraft(
        version=fallback_version,
        picks=picks,
        method_notes=(
            "Scheduled top 4 Fulton County census tracts by composite need_score "
            "(uninsured_pr * access * mobility) with >= 3.0 km centroid spacing and "
            "CDC PLACES chronic burden tiebreakers."
        ),
    )


def coerce_revisions(raw_revs: Any) -> list[AuditRevision]:
    parsed = _parse_json_or_obj(raw_revs)
    if isinstance(parsed, dict) and "revisions" in parsed:
        parsed = parsed["revisions"]
    if not isinstance(parsed, list):
        return []
    out: list[AuditRevision] = []
    for item in parsed:
        try:
            out.append(AuditRevision.model_validate(item))
        except Exception:
            continue
    return out


def coerce_limits(raw_limits: Any) -> list[Claim]:
    base = default_fulton_limits()
    seen_sources = {(c.source, c.claim) for c in base}
    parsed = _parse_json_or_obj(raw_limits)
    if isinstance(parsed, dict) and "limits" in parsed:
        parsed = parsed["limits"]
    if isinstance(parsed, list):
        for item in parsed:
            try:
                claim = Claim.model_validate(item)
                key = (claim.source, claim.claim)
                if key not in seen_sources:
                    base.append(claim)
                    seen_sources.add(key)
            except Exception:
                continue
    return base


def compose_clinic_plan(state: dict[str, Any]) -> dict[str, Any]:
    """Apply §3.2 Composer rules in pure Python and return updated state dict keys."""
    revise_round = int(state.get(STATE_REVISE_ROUND) or 0)
    plan_draft = coerce_plan_draft(state.get(STATE_PLAN_DRAFT), fallback_version=max(1, revise_round + 1))
    revisions = coerce_revisions(state.get(STATE_AUDIT_REVISIONS))
    raw_status = str(state.get(STATE_AUDIT_STATUS) or "PASS").strip().upper()
    audit_status = AuditStatus.REVISE if "REVISE" in raw_status else AuditStatus.PASS

    # Rule 1 & 2 (§3.2): If unresolved revisions remain after max rounds (or at composition time),
    # ship the plan but mark affected picks `flagged: true` with the auditor's reason.
    revs_by_tract: dict[str, list[AuditRevision]] = {}
    for rev in revisions:
        revs_by_tract.setdefault(rev.pick_tract_id, []).append(rev)

    final_picks: list[SitePick] = []
    for pick in plan_draft.picks:
        tract_revs = revs_by_tract.get(pick.tract_id, [])
        if tract_revs:
            reasons_joined = "; ".join(
                f"[{r.problem_type.value}] {r.explanation}" for r in tract_revs
            )
            pick = pick.model_copy(
                update={
                    "flagged": True,
                    "flag_reason": reasons_joined,
                }
            )
        final_picks.append(pick)

    # Rule 3 (§3.2): Equity findings are never auto-resolved; copy into Clinic Plan part 3.
    raw_equity = _parse_json_or_obj(state.get(STATE_AUDIT_EQUITY))
    if isinstance(raw_equity, dict) and "table" in raw_equity:
        audit_equity = AuditEquity.model_validate(raw_equity)
    else:
        tract_ids = [p.tract_id for p in final_picks]
        audit_equity = AuditEquity.model_validate(equity_audit(tract_ids))

    # Rule 4 (§3.2): Everything in `limits` plus any "cannot answer at this scale" claim goes into part 2.
    limits_claims = coerce_limits(state.get(STATE_LIMITS))

    # Rule 5 (§3.2): Build `disagreement_log` from draft_history and revision_history.
    draft_history = state.get(STATE_DRAFT_HISTORY) or []
    revision_history = state.get(STATE_REVISION_HISTORY) or []
    disagreement_log: list[DisagreementEntry] = []

    if isinstance(draft_history, list) and draft_history:
        for idx, d_item in enumerate(draft_history):
            d_obj = coerce_plan_draft(d_item, fallback_version=idx + 1)
            r_item = revision_history[idx] if idx < len(revision_history) else {}
            r_list = coerce_revisions(r_item.get("revisions") if isinstance(r_item, dict) else r_item)
            st_str = (
                str(r_item.get("status", "PASS")).upper()
                if isinstance(r_item, dict)
                else ("REVISE" if r_list else "PASS")
            )
            st_enum = AuditStatus.REVISE if "REVISE" in st_str else AuditStatus.PASS
            res_summary = (
                r_item.get("resolution_summary", "")
                if isinstance(r_item, dict)
                else ""
            )
            if not res_summary:
                if st_enum == AuditStatus.REVISE:
                    res_summary = (
                        f"Auditor returned REVISE with {len(r_list)} method objection(s); "
                        f"sent back to Planner for revision."
                    )
                elif r_list:
                    res_summary = (
                        f"Shipped after revision cycle with {len(r_list)} remaining statistical tie note(s) "
                        f"flagged on affected picks for human review."
                    )
                else:
                    res_summary = "All method checks passed."
            disagreement_log.append(
                DisagreementEntry(
                    round=idx + 1,
                    draft_version=d_obj.version,
                    draft_picks=[p.tract_id for p in d_obj.picks],
                    status=st_enum,
                    revisions=r_list,
                    resolution_summary=res_summary,
                )
            )
    else:
        disagreement_log.append(
            DisagreementEntry(
                round=1,
                draft_version=plan_draft.version,
                draft_picks=[p.tract_id for p in final_picks],
                status=audit_status,
                revisions=revisions,
                resolution_summary=(
                    "Shipped with Auditor method notes flagged on affected picks."
                    if revisions
                    else "All method checks passed."
                ),
            )
        )

    # Placeholder outreach until Explainer runs next; finalize_plan updates `outreach`
    raw_outreach = _parse_json_or_obj(state.get(STATE_OUTREACH))
    if isinstance(raw_outreach, dict) and "flyer_en" in raw_outreach:
        outreach = Outreach.model_validate(raw_outreach)
    else:
        outreach = Outreach(
            flyer_en="Pending Explainer plain-language generation.",
            flyer_es="Pendiente de generacion en lenguaje sencillo.",
            sms_en="Free Mobile Health Van coming to Fulton County on 4 Saturdays.",
            sms_es="Unidad movil de salud gratis en el Condado de Fulton los 4 sabados.",
            not_selected_message_en="Pending Explainer runner-up message.",
            not_selected_message_es="Pendiente de mensaje para comunidades cercanas.",
            reading_grade=5.0,
        )

    clinic_plan = ClinicPlan(
        county_fips=COUNTY_FIPS,
        county_name=COUNTY_NAME,
        where_the_van_goes=final_picks,
        what_we_could_not_tell_you=limits_claims,
        who_this_plan_lands_on=audit_equity,
        outreach=outreach,
        disagreement_log=disagreement_log,
    )

    return {
        STATE_PLAN_FINAL: clinic_plan.model_dump(mode="json"),
        STATE_DISAGREEMENT_LOG: [e.model_dump(mode="json") for e in disagreement_log],
        STATE_LIMITS: [c.model_dump(mode="json") for c in limits_claims],
    }


@node
async def composer(ctx: Context) -> Event:
    """ADK Workflow node wrapping deterministic `compose_clinic_plan`."""
    state = ctx.state.to_dict() if hasattr(ctx.state, "to_dict") else dict(ctx.state)
    updates = compose_clinic_plan(state)
    return Event(state=updates)
